# Real-time Notifications + Admin Sender — Design Spec

## 1. Objective

เพิ่มระบบแจ้งเตือนแบบ real-time ให้ GL-Orbit รองรับ:

- In-app updates: badge + dropdown + inbox page อัปเดตทันทีที่มี notification ใหม่
- System-level push: native notification นอกเว็บผ่าน Web Push + VAPID
- Admin page สำหรับส่ง notification ด้วยตนเอง แยกผู้รับเป็น followers (favorites) หรือ global (ทุก user)

## 2. Context

โปรเจกต์มีส่วนประกอบพื้นฐานครบแล้ว:

- `notifications` table (Drizzle) พร้อม `type`, `message`, `isRead`
- Notification bell dropdown, badge, inbox page, `/api/notifications*` endpoints
- `createFollowerNotifications()` สำหรับ batch insert ให้ followers
- SvelteKit 2 + Svelte 5 runes + TypeScript strict + Tailwind v4
- Auth session JWT ผ่าน `hooks.server.ts` และ `locals.user`

ขาด:

- Real-time transport
- Web Push / service worker
- Admin UI สำหรับส่ง notification
- Subscription management

## 3. Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Admin sends    │────▶│ notification service │────▶│ notifications   │
│  notification   │     │ (create + fan-out)   │     │   table (DB)    │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
        ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐
        │ SSE registry │  │   Web Push   │  │  Inbox/Dropdown   │
        │ (per userId) │  │ (per device) │  │  (initial load)   │
        └──────────────┘  └──────────────┘  └───────────────────┘
                │                │                │
                ▼                ▼                ▼
        Active clients    Native OS UI      Client polls/fetches
```

### 3.1 Transport: SSE + Web Push

- **SSE** — ใช้สำหรับ in-app updates เท่านั้น รองรับ serverless/Vercel ได้ดีกว่า WebSocket
  - `GET /api/notifications/stream`
  - ส่ง event เมื่อมี notification ใหม่สำหรับ `userId` นั้น
  - ใช้ `AbortSignal` หรือ `close` callback เพื่อล้าง controller
- **Web Push** — ใช้ `web-push` + VAPID keys
  - ส่ง native notification แม้ tab ปิด
  - ต้องมี service worker + user gesture ก่อนขอสิทธิ์
  - รองรับ iOS ได้เมื่อ user add-to-homescreen และเปิดจาก icon

### 3.2 Fan-out Flow

เมื่อมี notification ใหม่:

1. INSERT ลง `notifications`
2. ค้นหา SSE controllers ของ `userId` จาก in-memory registry
3. ส่ง JSON event `{ type: 'new_notification', notification }` ให้แต่ละ controller
4. ค้นหา `pushSubscriptions` ของ `userId` จาก DB
5. เรียก `webpush.sendNotification()` แต่ละ subscription
6. ถ้า response เป็น 410 Gone หรือ 404 → ลบ subscription ออกจาก DB

## 4. Data Model

### 4.1 New Table: `push_subscriptions`

```ts
export const pushSubscriptions = pgTable('push_subscriptions', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	endpoint: text('endpoint').notNull().unique(),
	p256dh: text('p256dh').notNull(),
	auth: text('auth').notNull(),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
```

### 4.2 Notification Type

เพิ่ม `announcement` ให้กับ `NotificationType`:

```ts
export type NotificationType = 'new_episode' | 'status_change' | 'announcement';
```

ไม่ต้องแก้ schema enum เพราะเก็บเป็น `varchar(50)`

## 5. API Endpoints

### 5.1 SSE Stream

- `GET /api/notifications/stream`
- Requires authenticated session
- Headers:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
- ส่ง event รูปแบบ:

```text
event: notification
data: {"id":"...","seriesId":"...","type":"announcement","message":"...","isRead":false,"createdAt":"...","seriesTitle":"..."}

```

### 5.2 Push Subscription

- `POST /api/notifications/push-subscribe`
  - Body: `{ subscription: PushSubscriptionJSON }`
  - Upsert โดย unique ที่ `endpoint`
  - อัปเดต `userId`, `p256dh`, `auth`, `userAgent`, `updatedAt`
- `POST /api/notifications/push-unsubscribe`
  - Body: `{ endpoint: string }`
  - ลบ subscription ของ user นั้น

### 5.3 Send Notification (Admin)

- `POST /api/notifications`
  - Existing endpoint ใช้สำหรับ mark-read อยู่
  - แยก action ด้วย `action` field: `{ action: 'mark-read' | 'send', ... }`
  - หรือสร้าง endpoint ใหม่ `/api/notifications/send`
- Body สำหรับ send:

```json
{
  "action": "send",
  "seriesId": "uuid",
  "recipientType": "followers" | "global",
  "message": "string"
}
```

- Validation:
  - `message` ไม่ว่าง ไม่เกิน 500 ตัวอักษร
  - `seriesId` ต้องมีอยู่จริง
  - `recipientType` ต้องเป็น `followers` หรือ `global`
- Response:

```json
{
  "success": true,
  "sentCount": 123
}
```

## 6. Server Implementation

### 6.1 SSE Registry

```ts
// src/lib/server/notifications-sse.ts
import type { NotificationItem } from '$lib/types.js';

const controllers = new Map<string, Set<ReadableStreamDefaultController>>();

export function subscribeUserNotifications(userId: string, controller: ReadableStreamDefaultController) {
	const set = controllers.get(userId) ?? new Set();
	set.add(controller);
	controllers.set(userId, set);

	return () => {
		set.delete(controller);
		if (set.size === 0) controllers.delete(userId);
	};
}

export function broadcastNotification(userId: string, notification: NotificationItem) {
	const set = controllers.get(userId);
	if (!set) return;
	const data = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
	for (const c of set) {
		try {
			c.enqueue(new TextEncoder().encode(data));
		} catch {
			set.delete(c);
		}
	}
}
```

### 6.2 Notification Creation with Fan-out

สร้างฟังก์ชันใหม่ใน `src/lib/server/notifications.ts`:

```ts
export async function createAndBroadcastNotification(
	userId: string,
	seriesId: string,
	type: NotificationType,
	message: string
): Promise<NotificationItem> {
	const db = await getDb();

	const [row] = await db
		.insert(notifications)
		.values({ userId, seriesId, type, message })
		.returning();

	const item = await enrichNotification(row);
	broadcastNotification(userId, item);
	await sendPushNotification(userId, item);

	return item;
}
```

สำหรับ admin send แบบ bulk:

```ts
export async function sendNotificationToUsers(
	seriesId: string,
	type: NotificationType,
	message: string,
	recipientType: 'followers' | 'global',
	actorId?: string
): Promise<number> {
	const db = await getDb();

	let userIds: string[];
	if (recipientType === 'followers') {
		const rows = await db.select({ userId: favorites.userId }).from(favorites).where(eq(favorites.seriesId, seriesId));
		userIds = rows.map(r => r.userId).filter(id => id !== actorId);
	} else {
		const rows = await db.select({ id: users.id }).from(users).where(eq(users.isActive, true));
		userIds = rows.map(r => r.id);
	}

	// batch insert แล้ว broadcast ทีละรายการ
	// ...
}
```

### 6.3 Web Push Sending

```ts
// src/lib/server/push-notifications.ts
import webpush from 'web-push';
import { getDb } from './db/index.js';
import { pushSubscriptions } from './db/schema.js';
import { eq } from 'drizzle-orm';
import type { NotificationItem } from '$lib/types.js';

webpush.setVapidDetails(
	`mailto:${process.env.VAPID_SUBJECT}`,
	process.env.VAPID_PUBLIC_KEY!,
	process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(userId: string, item: NotificationItem) {
	const db = await getDb();
	const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

	for (const sub of subs) {
		const pushSub = {
			endpoint: sub.endpoint,
			keys: { p256dh: sub.p256dh, auth: sub.auth }
		};

		try {
			await webpush.sendNotification(
				pushSub,
				JSON.stringify({
					title: item.seriesTitle,
					body: item.message,
					data: { url: `/series/${item.seriesId}` }
				})
			);
		} catch (err: any) {
			if (err.statusCode === 410 || err.statusCode === 404) {
				await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
			}
		}
	}
}
```

## 7. Client Implementation

### 7.1 Service Worker

สร้าง `static/service-worker.js` หรือ `src/service-worker.js`:

```js
/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE_NAME = `gl-orbit-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
		)
	);
	self.clients.claim();
});

self.addEventListener('push', (event) => {
	const data = event.data?.json() ?? {};
	event.waitUntil(
		self.registration.showNotification(data.title ?? 'GL-Orbit', {
			body: data.body ?? '',
			icon: '/icon-192x192.png',
			badge: '/badge-96x96.png',
			data: data.data ?? {}
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = event.notification.data?.url ?? '/notifications';
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			const client = clients.find((c) => c.url.includes(self.location.origin));
			if (client) {
				client.navigate(url);
				client.focus();
			} else {
				self.clients.openWindow(url);
			}
		})
	);
});
```

### 7.2 Push Subscription Manager

สร้าง `src/lib/client/push-notifications.ts`:

```ts
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function requestPushPermission(): Promise<boolean> {
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

	const registration = await navigator.serviceWorker.ready;
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return false;

	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
	});

	await fetch('/api/notifications/push-subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ subscription: subscription.toJSON() })
	});

	return true;
}

export async function unsubscribePush(): Promise<void> {
	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();
	if (!subscription) return;

	await fetch('/api/notifications/push-unsubscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ endpoint: subscription.endpoint })
	});

	await subscription.unsubscribe();
}
```

### 7.3 SSE Client

สร้าง `src/lib/client/notification-stream.ts`:

```ts
import type { NotificationItem } from '$lib/types.js';

export function connectNotificationStream(
	onNotification: (item: NotificationItem) => void,
	onCount?: (count: number) => void
) {
	const source = new EventSource('/api/notifications/stream');

	source.addEventListener('notification', (event) => {
		const item: NotificationItem = JSON.parse(event.data);
		onNotification(item);
	});

	source.addEventListener('count', (event) => {
		onCount?.(JSON.parse(event.data).count);
	});

	return () => source.close();
}
```

### 7.4 UI Updates

- `NotificationDropdown.svelte` / `NotificationBadge.svelte`: ฟัง stream เพื่อเพิ่ม badge count + prepend item เข้า list
- `/notifications/+page.svelte`: เชื่อม stream เพื่อ prepend item ใหม่เข้า list โดยไม่ reload
- เพิ่มปุ่ม "เปิดรับการแจ้งเตือน" ใน `/profile` หรือ dropdown โดยใช้ user gesture

## 8. Admin Notification Page

- Path: `/admin/notifications`
- Layout: ใช้ admin shell ที่มีอยู่
- Form fields:
  - Series select (fetch จาก `/api/admin/series` หรือ page load)
  - Recipient type: radio `followers` / `global`
  - Message: textarea, max 500 chars, แสดงเหลือกี่ตัวอักษร
  - Submit button
- หลัง submit สำเร็จ:
  - แสดง `sentCount`
  - reset form
  - แสดง admin action feedback (toast)
- Server action หรือ API endpoint เรียก `sendNotificationToUsers()`

## 9. Security

- SSE endpoint ต้องผ่าน `hooks.server.ts` session validation
- Push subscribe/unsubscribe ต้อง authenticated
- Admin send ต้อง `ADMIN` role
- VAPID keys เก็บใน environment variables
- ลบ subscription ทันทีเมื่อได้รับ 410/404
- ไม่ broadcast event ให้ user อื่น (filter ด้วย `userId`)

## 10. Environment Variables

เพิ่มใน `.env` และ `.env.example`:

```bash
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@gl-orbit.example
```

และ expose public key ผ่าน:

```bash
VITE_VAPID_PUBLIC_KEY=...
```

## 11. Deployment Notes

- ต้องใช้ HTTPS บน production (PWA บังคับอยู่แล้ว)
- iOS รองรับ Web Push ได้เมื่อ:
  - เปิดจาก icon ที่ Add to Home Screen
  - ขอ permission ผ่าน user gesture
- Token/subscription หมดอายุได้ — backend ต้อง handle 410/404
- Service worker build ขึ้นอยู่กับ `src/service-worker.js` ของ SvelteKit

## 12. Out of Scope

- Scheduled notifications (future)
- Rich media / action buttons ใน push payload
- Multi-instance pub/sub (Redis) — ถ้าต้องการรองรับ scale ให้ทำภายหลัง
- In-app toasts สำหรับ notification ใหม่ (อาจเพิ่มได้ในรอบถัดไป)

## 13. Success Criteria

- [ ] User เปิดหน้า inbox แล้วเห็น notification ใหม่ปรากฏทันทีผ่าน SSE
- [ ] Badge บน bell และ bottom nav อัปเดต real-time
- [ ] Admin ส่ง notification ได้จาก `/admin/notifications`
- [ ] Followers ของ series ได้รับ notification
- [ ] Global notification ส่งถึงทุก active user
- [ ] Browser push notification แสดงนอกเว็บเมื่อ user อนุญาต
- [ ] Subscription ที่หมดอายุถูกลบอัตโนมัติ
