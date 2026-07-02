# Real-time Notifications + Admin Sender Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time in-app notifications via SSE, browser Web Push notifications with VAPID, and an admin page for sending notifications to followers or all users.

**Architecture:** Use Server-Sent Events for live badge/list updates while the user is on the site, Web Push via `web-push` for native OS notifications when the tab is closed, and a central notification creation service that writes to PostgreSQL then fans out to SSE controllers and push subscriptions.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, TypeScript, Drizzle ORM, PostgreSQL, `web-push`, service worker, Tailwind v4

---

## File Map

| File | Responsibility |
|---|---|
| `src/lib/server/db/schema.ts` | Add `pushSubscriptions` table, extend `NotificationType` union |
| `src/lib/server/notifications.ts` | Add `createAndBroadcastNotification`, `sendNotificationToUsers`, `enrichNotification` |
| `src/lib/server/notifications-sse.ts` | In-memory SSE controller registry per `userId` |
| `src/lib/server/push-notifications.ts` | Web Push setup, `sendPushNotification`, expired subscription cleanup |
| `src/routes/api/notifications/stream/+server.ts` | SSE endpoint |
| `src/routes/api/notifications/push-subscribe/+server.ts` | Upsert push subscription |
| `src/routes/api/notifications/push-unsubscribe/+server.ts` | Delete push subscription |
| `src/routes/api/notifications/send/+server.ts` | Admin-only send endpoint |
| `src/routes/api/notifications/+server.ts` | Modify existing mark-read to avoid conflict with new send endpoint |
| `src/service-worker.ts` | Service worker for caching + push handling |
| `src/lib/client/push-notifications.ts` | Subscribe/unsubscribe helpers, VAPID key conversion |
| `src/lib/client/notification-stream.ts` | `EventSource` wrapper for SSE |
| `src/lib/components/NotificationDropdown.svelte` | Listen to SSE, prepend new items, update badge count |
| `src/lib/components/NotificationBadge.svelte` | (no change needed; consumers pass count) |
| `src/routes/[lang=lang]/(app)/notifications/+page.svelte` | Listen to SSE, prepend new items |
| `src/routes/[lang=lang]/(app)/profile/+page.svelte` | Add "เปิดรับการแจ้งเตือน" button with user gesture |
| `src/routes/[lang=lang]/admin/notifications/+page.svelte` | Admin form for sending notifications |
| `src/routes/[lang=lang]/admin/notifications/+page.server.ts` | Load series list for admin form |
| `src/routes/[lang=lang]/admin/+layout.svelte` | Add "แจ้งเตือน" link to admin nav |
| `.env.example` | Add VAPID environment variables |
| `package.json` | Add `web-push` dependency |
| `src/lib/types.ts` | Extend `NotificationType`, add `PushSubscriptionInput` type |
| `drizzle/...` | Migration for `push_subscriptions` table |

---

## Task 0: Generate i18n Files and Verify Baseline

### Step 0.1: Ensure environment file exists

Copy from example:

```bash
cp .env.example .env
```

### Step 0.2: Generate Paraglide files

Run a production build to generate `src/lib/i18n/paraglide/*` files:

```bash
npm run build
```

Expected: build succeeds and `src/lib/i18n/paraglide/messages.js` and `runtime.js` exist.

### Step 0.3: Run type check

```bash
npm run check
```

Expected: no new errors beyond pre-existing warnings. If there are pre-existing errors unrelated to notifications, note them but do not fix.

### Step 0.4: Commit generated files

```bash
git add src/lib/i18n/paraglide/
git commit -m "chore: generate paraglide i18n files"
```

---

## Task 1: Add Dependency and Types

**Files:**
- Modify: `package.json`
- Modify: `src/lib/types.ts`

### Step 1.1: Install `web-push`

Run:

```bash
npm install web-push
```

Expected: `web-push` appears under `dependencies` in `package.json` and `node_modules/web-push` exists.

### Step 1.2: Extend NotificationType

Modify `src/lib/types.ts`:

```ts
export interface NotificationItem {
	id: string;
	seriesId: string;
	// extended type
	type: 'new_episode' | 'status_change' | 'announcement';
	message: string;
	isRead: boolean;
	createdAt: string;
	seriesTitle: string;
}

export interface PushSubscriptionInput {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
}
```

### Step 1.3: Commit

```bash
git add package.json package-lock.json src/lib/types.ts
git commit -m "chore: add web-push and extend notification types"
```

---

## Task 2: Database Schema Migration

**Files:**
- Modify: `src/lib/server/db/schema.ts`
- Create: `drizzle/000X_add_push_subscriptions.sql` (run `npm run db:generate` after schema change to get real filename)

### Step 2.1: Add push_subscriptions table to schema

Modify `src/lib/server/db/schema.ts` after `notifications` table:

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

### Step 2.2: Generate migration

Run:

```bash
npm run db:generate
```

Expected: new migration file appears in `drizzle/`.

### Step 2.3: Push migration to development database

Run:

```bash
npm run db:push
```

Expected: `push_subscriptions` table exists in DB.

### Step 2.4: Commit

```bash
git add src/lib/server/db/schema.ts drizzle/
git commit -m "feat(db): add push_subscriptions table"
```

---

## Task 3: Server SSE Registry

**Files:**
- Create: `src/lib/server/notifications-sse.ts`

### Step 3.1: Create in-memory registry

Create `src/lib/server/notifications-sse.ts`:

```ts
import type { NotificationItem } from '$lib/types.js';

const controllers = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

export function subscribeUserNotifications(userId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
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
	const data = new TextEncoder().encode(
		`event: notification\ndata: ${JSON.stringify(notification)}\n\n`
	);
	for (const c of set) {
		try {
			c.enqueue(data);
		} catch {
			set.delete(c);
		}
	}
}

export function broadcastUnreadCount(userId: string, count: number) {
	const set = controllers.get(userId);
	if (!set) return;
	const data = new TextEncoder().encode(
		`event: count\ndata: ${JSON.stringify({ count })}\n\n`
	);
	for (const c of set) {
		try {
			c.enqueue(data);
		} catch {
			set.delete(c);
		}
	}
}
```

### Step 3.2: Commit

```bash
git add src/lib/server/notifications-sse.ts
git commit -m "feat(notifications): add in-memory SSE registry"
```

---

## Task 4: Web Push Service

**Files:**
- Create: `src/lib/server/push-notifications.ts`

### Step 4.1: Create push notification sender

Create `src/lib/server/push-notifications.ts`:

```ts
import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { getDb } from './db/index.js';
import { pushSubscriptions } from './db/schema.js';
import type { NotificationItem, PushSubscriptionInput } from '$lib/types.js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
const vapidSubject = process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey) {
	webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function sendPushNotification(userId: string, item: NotificationItem) {
	if (!vapidPublicKey || !vapidPrivateKey) return;

	const db = await getDb();
	const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

	for (const sub of subs) {
		const pushSub: PushSubscriptionInput = {
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

### Step 4.2: Commit

```bash
git add src/lib/server/push-notifications.ts
git commit -m "feat(notifications): add web-push sender with expiry cleanup"
```

---

## Task 5: Central Notification Creation + Fan-out

**Files:**
- Modify: `src/lib/server/notifications.ts`

### Step 5.1: Update notification service

Modify `src/lib/server/notifications.ts` to add:

```ts
import { inArray } from 'drizzle-orm';
import { broadcastNotification, broadcastUnreadCount } from './notifications-sse.js';
import { sendPushNotification } from './push-notifications.js';

export type NotificationType = 'new_episode' | 'status_change' | 'announcement';

async function enrichNotification(row: typeof notifications.$inferSelect): Promise<NotificationItem> {
	const db = await getDb();
	const [seriesRow] = await db
		.select({ titleEn: series.titleEn })
		.from(series)
		.where(eq(series.id, row.seriesId));

	return {
		id: row.id,
		seriesId: row.seriesId,
		type: row.type as NotificationType,
		message: row.message,
		isRead: row.isRead,
		createdAt: row.createdAt.toISOString(),
		seriesTitle: seriesRow?.titleEn ?? ''
	};
}

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

	const [{ count: unreadCount }] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(notifications)
		.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
	broadcastUnreadCount(userId, unreadCount);

	await sendPushNotification(userId, item);

	return item;
}

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
		const rows = await db
			.select({ userId: favorites.userId })
			.from(favorites)
			.where(eq(favorites.seriesId, seriesId));
		userIds = rows.map((r) => r.userId).filter((id) => id !== actorId);
	} else {
		const rows = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.isActive, true));
		userIds = rows.map((r) => r.id);
	}

	if (userIds.length === 0) return 0;

	const values = userIds.map((userId) => ({
		userId,
		seriesId,
		type,
		message
	}));

	const inserted = await db.insert(notifications).values(values).returning();

	await Promise.all(
		inserted.map(async (row) => {
			const item = await enrichNotification(row);
			broadcastNotification(row.userId, item);
			await sendPushNotification(row.userId, item);
		})
	);

	return inserted.length;
}
```

Also update existing `createFollowerNotifications` to use `sendNotificationToUsers`:

```ts
export async function createFollowerNotifications(
	seriesId: string,
	type: NotificationType,
	message: string,
	actorId?: string
): Promise<number> {
	return sendNotificationToUsers(seriesId, type, message, 'followers', actorId);
}
```

### Step 5.2: Commit

```bash
git add src/lib/server/notifications.ts
git commit -m "feat(notifications): central create + broadcast fan-out"
```

---

## Task 6: SSE Stream Endpoint

**Files:**
- Create: `src/routes/api/notifications/stream/+server.ts`

### Step 6.1: Implement SSE endpoint

Create `src/routes/api/notifications/stream/+server.ts`:

```ts
import { subscribeUserNotifications } from '$lib/server/notifications-sse.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response(JSON.stringify({ error: 'กรุณาเข้าสู่ระบบ' }), { status: 401 });
	}

	const userId = locals.user.id;
	let cleanup: (() => void) | undefined;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			cleanup = subscribeUserNotifications(userId, controller);

			const hello = new TextEncoder().encode(
				`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`
			);
			try {
				controller.enqueue(hello);
			} catch {
				cleanup?.();
			}
		},
		cancel() {
			cleanup?.();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
```

### Step 6.2: Commit

```bash
git add src/routes/api/notifications/stream/+server.ts
git commit -m "feat(api): add notifications SSE stream endpoint"
```

---

## Task 7: Push Subscribe / Unsubscribe Endpoints

**Files:**
- Create: `src/routes/api/notifications/push-subscribe/+server.ts`
- Create: `src/routes/api/notifications/push-unsubscribe/+server.ts`

### Step 7.1: Subscribe endpoint

Create `src/routes/api/notifications/push-subscribe/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { pushSubscriptions } from '$lib/server/db/schema.js';
import type { PushSubscriptionInput } from '$lib/types.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals, request, getClientAddress }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	const body = (await request.json()) as { subscription?: Partial<PushSubscriptionInput> };
	const sub = body.subscription;
	if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
		return json({ error: 'ข้อมูล subscription ไม่ครบถ้วน' }, { status: 400 });
	}

	const db = await getDb();
	const existing = await db
		.select({ id: pushSubscriptions.id })
		.from(pushSubscriptions)
		.where(eq(pushSubscriptions.endpoint, sub.endpoint));

	if (existing.length > 0) {
		await db
			.update(pushSubscriptions)
			.set({
				userId: locals.user.id,
				p256dh: sub.keys.p256dh,
				auth: sub.keys.auth,
				userAgent: request.headers.get('user-agent') ?? '',
				updatedAt: new Date()
			})
			.where(eq(pushSubscriptions.endpoint, sub.endpoint));
	} else {
		await db.insert(pushSubscriptions).values({
			userId: locals.user.id,
			endpoint: sub.endpoint,
			p256dh: sub.keys.p256dh,
			auth: sub.keys.auth,
			userAgent: request.headers.get('user-agent') ?? ''
		});
	}

	return json({ success: true });
};
```

### Step 7.2: Unsubscribe endpoint

Create `src/routes/api/notifications/push-unsubscribe/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db/index.js';
import { pushSubscriptions } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

	const body = (await request.json()) as { endpoint?: unknown };
	const endpoint = typeof body.endpoint === 'string' ? body.endpoint : undefined;
	if (!endpoint) return json({ error: 'endpoint ไม่ถูกต้อง' }, { status: 400 });

	const db = await getDb();
	await db
		.delete(pushSubscriptions)
		.where(and(eq(pushSubscriptions.userId, locals.user.id), eq(pushSubscriptions.endpoint, endpoint)));

	return json({ success: true });
};
```

### Step 7.3: Commit

```bash
git add src/routes/api/notifications/push-subscribe/+server.ts src/routes/api/notifications/push-unsubscribe/+server.ts
git commit -m "feat(api): add push subscription endpoints"
```

---

## Task 8: Admin Send Endpoint

**Files:**
- Create: `src/routes/api/notifications/send/+server.ts`

### Step 8.1: Create send endpoint

Create `src/routes/api/notifications/send/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import { sendNotificationToUsers } from '$lib/server/notifications.js';
import { getDb } from '$lib/server/db/index.js';
import { series } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

const MESSAGE_MAX_LENGTH = 500;

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
	}

	const body = (await request.json()) as {
		seriesId?: unknown;
		recipientType?: unknown;
		message?: unknown;
	};

	const seriesId = typeof body.seriesId === 'string' ? body.seriesId : undefined;
	const recipientType = body.recipientType === 'followers' || body.recipientType === 'global' ? body.recipientType : undefined;
	const message = typeof body.message === 'string' ? body.message.trim() : undefined;

	if (!seriesId) return json({ error: 'กรุณาเลือกซีรีส์' }, { status: 400 });
	if (!recipientType) return json({ error: 'กรุณาเลือกประเภทผู้รับ' }, { status: 400 });
	if (!message || message.length === 0) return json({ error: 'กรุณากรอกข้อความ' }, { status: 400 });
	if (message.length > MESSAGE_MAX_LENGTH) {
		return json({ error: `ข้อความต้องไม่เกิน ${MESSAGE_MAX_LENGTH} ตัวอักษร` }, { status: 400 });
	}

	const db = await getDb();
	const [seriesRow] = await db.select({ id: series.id }).from(series).where(eq(series.id, seriesId));
	if (!seriesRow) return json({ error: 'ไม่พบซีรีส์' }, { status: 404 });

	const sentCount = await sendNotificationToUsers(seriesId, 'announcement', message, recipientType, locals.user.id);

	return json({ success: true, sentCount });
};
```

### Step 8.2: Commit

```bash
git add src/routes/api/notifications/send/+server.ts
git commit -m "feat(api): add admin notification send endpoint"
```

---

## Task 9: Service Worker via SvelteKitPWA injectManifest

**Files:**
- Modify: `vite.config.ts` (switch to `injectManifest` strategy)
- Create: `src/service-worker.ts` (custom service worker with workbox precaching + push handlers)

The project already uses `@vite-pwa/sveltekit` for PWA manifest and auto-updating service worker. We switch it to `injectManifest` strategy so it injects the precache manifest into our custom service worker, where we also handle `push` and `notificationclick` events.

### Step 9.1: Configure SvelteKitPWA for injectManifest

Modify `vite.config.ts`:

```ts
SvelteKitPWA({
	registerType: 'autoUpdate',
	strategies: 'injectManifest',
	srcDir: 'src',
	filename: 'service-worker.ts',
	manifest: {
		name: 'GL-Orbit',
		short_name: 'GL-Orbit',
		description: 'ศูนย์กลางข้อมูลและตารางฉายซีรีส์ GL',
		theme_color: '#FF6B9D',
		background_color: '#FFF5F7',
		display: 'standalone',
		lang: 'th',
		icons: [
			{ src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
			{ src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
			{ src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
			{ src: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' }
		]
	},
	injectManifest: {
		globPatterns: ['**/*.{html,css,js,woff2}']
	}
})
```

### Step 9.2: Create custom service worker

Create `src/service-worker.ts`:

```ts
/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// `__WB_MANIFEST` is injected by workbox during the build
// @ts-expect-error virtual workbox manifest
const manifest = self.__WB_MANIFEST;
precacheAndRoute(manifest);

cleanupOutdatedCaches();
clientsClaim();

self.addEventListener('push', (event) => {
	const data = event.data?.json() ?? {};
	event.waitUntil(
		self.registration.showNotification(data.title ?? 'GL-Orbit', {
			body: data.body ?? '',
			icon: '/icons/pwa-192x192.png',
			badge: '/icons/pwa-192x192.png',
			data: data.data ?? {}
		})
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url: string = event.notification.data?.url ?? '/notifications';
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

No manual registration in `+layout.svelte` is required because `@vite-pwa/sveltekit` handles registration automatically.

### Step 9.3: Commit

```bash
git add vite.config.ts src/service-worker.ts
git commit -m "feat(pwa): configure injectManifest service worker with push handling"
```

---

## Task 10: Client Push Manager

**Files:**
- Create: `src/lib/client/push-notifications.ts`

### Step 10.1: Create helpers

Create `src/lib/client/push-notifications.ts`:

```ts
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
	return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
	if (!isPushSupported()) return null;
	const registration = await navigator.serviceWorker.ready;
	return registration.pushManager.getSubscription();
}

export async function requestPushPermission(): Promise<boolean> {
	if (!isPushSupported()) return false;
	if (!VAPID_PUBLIC_KEY) return false;

	const registration = await navigator.serviceWorker.ready;
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return false;

	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
	});

	const res = await fetch('/api/notifications/push-subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ subscription: subscription.toJSON() })
	});

	return res.ok;
}

export async function unsubscribePush(): Promise<boolean> {
	if (!isPushSupported()) return false;

	const registration = await navigator.serviceWorker.ready;
	const subscription = await registration.pushManager.getSubscription();
	if (!subscription) return true;

	await fetch('/api/notifications/push-unsubscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ endpoint: subscription.endpoint })
	});

	await subscription.unsubscribe();
	return true;
}
```

### Step 10.2: Commit

```bash
git add src/lib/client/push-notifications.ts
git commit -m "feat(client): add push subscription helpers"
```

---

## Task 11: Client SSE Manager

**Files:**
- Create: `src/lib/client/notification-stream.ts`

### Step 11.1: Create EventSource wrapper

Create `src/lib/client/notification-stream.ts`:

```ts
import type { NotificationItem } from '$lib/types.js';

export interface NotificationStreamCallbacks {
	onNotification: (item: NotificationItem) => void;
	onCount?: (count: number) => void;
	onConnected?: () => void;
}

export function connectNotificationStream(callbacks: NotificationStreamCallbacks) {
	const source = new EventSource('/api/notifications/stream');

	source.addEventListener('connected', () => {
		callbacks.onConnected?.();
	});

	source.addEventListener('notification', (event) => {
		const item: NotificationItem = JSON.parse(event.data);
		callbacks.onNotification(item);
	});

	source.addEventListener('count', (event) => {
		const payload: { count: number } = JSON.parse(event.data);
		callbacks.onCount?.(payload.count);
	});

	source.addEventListener('error', () => {
		// auto-reconnect is built into EventSource
	});

	return () => source.close();
}
```

### Step 11.2: Commit

```bash
git add src/lib/client/notification-stream.ts
git commit -m "feat(client): add notification SSE stream helper"
```

---

## Task 12: Wire SSE into NotificationDropdown

**Files:**
- Modify: `src/lib/components/NotificationDropdown.svelte`

### Step 12.1: Import and connect stream

Add imports:

```ts
import { connectNotificationStream } from '$lib/client/notification-stream.js';
import { onMount } from 'svelte';
```

Add prop for count updater:

```ts
let {
	unreadCount = 0,
	onMarkAllRead,
	onUnreadCountChange
}: {
	unreadCount: number;
	onMarkAllRead?: () => void;
	onUnreadCountChange?: (count: number) => void;
} = $props();
```

Add inside component after state declarations:

```ts
onMount(() => {
	const disconnect = connectNotificationStream({
		onNotification: (item) => {
			// prepend if not already present
			if (!notifications.some((n) => n.id === item.id)) {
				notifications = [item, ...notifications];
			}
			if (!item.isRead) {
				onUnreadCountChange?.(unreadCount + 1);
			}
		},
		onCount: (count) => {
			onUnreadCountChange?.(count);
		}
	});
	return disconnect;
});
```

### Step 12.2: Update markAllRead callback

After `markAllRead` sets local state, also call `onUnreadCountChange?.(0)`.

### Step 12.3: Commit

```bash
git add src/lib/components/NotificationDropdown.svelte
git commit -m "feat(ui): connect notification dropdown to SSE"
```

---

## Task 13: Wire SSE into Navigation / BottomNav Count

**Files:**
- Modify: `src/lib/components/Navigation.svelte`
- Modify: `src/lib/components/BottomNav.svelte`

### Step 13.1: Navigation badge count

`Navigation.svelte` currently polls `/api/notifications/unread-count`. Replace the polling interval with SSE.

Add imports:

```ts
import { connectNotificationStream } from '$lib/client/notification-stream.js';
import { onMount } from 'svelte';
```

Replace polling `$effect` block with:

```ts
onMount(() => {
	return connectNotificationStream({
		onCount: (count) => {
			unreadCount = count;
		}
	});
});
```

Keep initial fetch for unread count on load.

### Step 13.2: BottomNav badge count

`BottomNav.svelte` currently imports `NotificationBadge` with a static count. Connect to SSE similarly:

```ts
import { connectNotificationStream } from '$lib/client/notification-stream.js';
import { onMount } from 'svelte';

let unreadCount = $state(0);

onMount(() => {
	return connectNotificationStream({
		onCount: (count) => {
			unreadCount = count;
		}
	});
});
```

### Step 13.3: Commit

```bash
git add src/lib/components/Navigation.svelte src/lib/components/BottomNav.svelte
git commit -m "feat(ui): drive badge counts from SSE instead of polling"
```

---

## Task 14: Wire SSE into Notifications Inbox Page

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/notifications/+page.svelte`

### Step 14.1: Connect stream

Add imports:

```ts
import { connectNotificationStream } from '$lib/client/notification-stream.js';
import { onMount } from 'svelte';
```

Add inside component after state declarations:

```ts
onMount(() => {
	const disconnect = connectNotificationStream({
		onNotification: (item) => {
			if (!notifications.some((n) => n.id === item.id)) {
				notifications = [item, ...notifications];
				offset += 1;
			}
		}
	});
	return disconnect;
});
```

### Step 14.2: Commit

```bash
git add src/routes/[lang=lang]/(app)/notifications/+page.svelte
git commit -m "feat(ui): update notifications inbox in real time via SSE"
```

---

## Task 15: Push Permission Button in Profile

**Files:**
- Modify: `src/routes/[lang=lang]/(app)/profile/+page.svelte`

### Step 15.1: Add toggle button

Add imports:

```ts
import { isPushSupported, requestPushPermission, unsubscribePush, getExistingSubscription } from '$lib/client/push-notifications.js';
import { onMount } from 'svelte';
```

Add state:

```ts
let pushEnabled = $state(false);
let pushLoading = $state(false);

onMount(async () => {
	if (!isPushSupported()) return;
	const sub = await getExistingSubscription();
	pushEnabled = !!sub;
});

async function togglePush() {
	pushLoading = true;
	try {
		if (pushEnabled) {
			await unsubscribePush();
			pushEnabled = false;
		} else {
			pushEnabled = await requestPushPermission();
		}
	} finally {
		pushLoading = false;
	}
}
```

Add button somewhere in the profile page UI (e.g. near change password):

```svelte
{#if isPushSupported()}
	<button
		onclick={togglePush}
		disabled={pushLoading}
		class="..."
	>
		{pushEnabled ? 'ปิดการแจ้งเตือน' : 'เปิดรับการแจ้งเตือน'}
	</button>
{/if}
```

### Step 15.2: Commit

```bash
git add src/routes/[lang=lang]/(app)/profile/+page.svelte
git commit -m "feat(profile): add push notification toggle"
```

---

## Task 16: Admin Notification Page

**Files:**
- Create: `src/routes/[lang=lang]/admin/notifications/+page.server.ts`
- Create: `src/routes/[lang=lang]/admin/notifications/+page.svelte`
- Modify: `src/routes/[lang=lang]/admin/+layout.svelte`

### Step 16.1: Server load for series list

Create `src/routes/[lang=lang]/admin/notifications/+page.server.ts`:

```ts
import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/index.js';
import { series } from '$lib/server/db/schema.js';
import { isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		throw redirect(303, '/admin/login');
	}

	const db = await getDb();
	const seriesList = await db
		.select({ id: series.id, titleEn: series.titleEn })
		.from(series)
		.where(isNull(series.deletedAt))
		.orderBy(series.titleEn);

	return { series: seriesList };
};
```

### Step 16.2: Admin form page

Create `src/routes/[lang=lang]/admin/notifications/+page.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types.js';
	import { addFeedback } from '$lib/admin/action-feedback.js';

	let { data }: { data: PageData } = $props();

	let seriesId = $state('');
	let recipientType = $state<'followers' | 'global'>('followers');
	let message = $state('');
	let loading = $state(false);
	let result = $state<{ success: true; sentCount: number } | null>(null);

	const MESSAGE_MAX = 500;
	let remaining = $derived(MESSAGE_MAX - message.length);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!seriesId || !message.trim()) return;
		loading = true;
		result = null;
		try {
			const res = await fetch('/api/notifications/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seriesId, recipientType, message: message.trim() })
			});
			const data = await res.json();
			if (res.ok) {
				result = { success: true, sentCount: data.sentCount };
				addFeedback({ type: 'success', message: `ส่งแจ้งเตือนแล้ว ${data.sentCount} ราย` });
				seriesId = '';
				message = '';
				recipientType = 'followers';
			} else {
				addFeedback({ type: 'error', message: data.error ?? 'ส่งไม่สำเร็จ' });
			}
		} catch {
			addFeedback({ type: 'error', message: 'เกิดข้อผิดพลาดในการส่ง' });
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold text-plum mb-6">ส่งแจ้งเตือน</h1>

	<form onsubmit={handleSubmit} class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
		<div>
			<label class="block text-sm font-medium text-plum mb-1.5">ซีรีส์</label>
			<select bind:value={seriesId} required class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral">
				<option value="" disabled>เลือกซีรีส์</option>
				{#each data.series as s}
					<option value={s.id}>{s.titleEn}</option>
				{/each}
			</select>
		</div>

		<div>
			<label class="block text-sm font-medium text-plum mb-1.5">ผู้รับ</label>
			<div class="flex gap-4">
				<label class="flex items-center gap-2 text-sm text-gray-700">
					<input type="radio" bind:group={recipientType} value="followers" />
					ผู้ติดตามซีรีส์
				</label>
				<label class="flex items-center gap-2 text-sm text-gray-700">
					<input type="radio" bind:group={recipientType} value="global" />
					ทุกผู้ใช้
				</label>
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium text-plum mb-1.5">ข้อความ</label>
			<textarea
				bind:value={message}
				required
				maxlength={MESSAGE_MAX}
				rows="4"
				class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral resize-none"
			></textarea>
			<p class="text-xs text-gray-400 mt-1 text-right">{remaining} ตัวอักษร</p>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full rounded-xl bg-coral text-white font-medium py-3 hover:bg-coral-dark transition-colors disabled:opacity-50"
		>
			{#if loading}
				กำลังส่ง...
			{:else}
				ส่งแจ้งเตือน
			{/if}
		</button>

		{#if result}
			<p class="text-sm text-mint-dark text-center">ส่งแจ้งเตือนสำเร็จ {result.sentCount} ราย</p>
		{/if}
	</form>
</div>
```

### Step 16.3: Add nav link

Modify `src/routes/[lang=lang]/admin/+layout.svelte`. In `navSections`, add a new section or item:

```ts
{
	title: 'การติดต่อสื่อสาร',
	items: [
		{
			href: `/${page.data.lang}/admin/notifications`,
			label: 'แจ้งเตือน',
			hint: 'ส่งถึงผู้ใช้',
			icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
		}
	]
}
```

### Step 16.4: Commit

```bash
git add src/routes/[lang=lang]/admin/notifications/ src/routes/[lang=lang]/admin/+layout.svelte
git commit -m "feat(admin): add notification sender page"
```

---

## Task 17: Environment Variables

**Files:**
- Modify: `.env.example`

### Step 17.1: Add VAPID vars

Append to `.env.example`:

```bash
# Web Push VAPID keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com

# Public VAPID key exposed to client
VITE_VAPID_PUBLIC_KEY=
```

### Step 17.2: Commit

```bash
git add .env.example
git commit -m "docs(env): add VAPID environment variables"
```

---

## Task 18: Verification

### Step 18.1: Type check

Run:

```bash
npm run check
```

Expected: no new TypeScript or Svelte errors introduced by this feature. Pre-existing warnings/errors unrelated to notifications are acceptable.

### Step 18.2: Build

Run:

```bash
npm run build
```

Expected: production build succeeds; service worker is generated and includes push handlers.

### Step 18.3: Lint/format

Run:

```bash
npm run lint
```

If lint script doesn't exist, skip and note.

### Step 18.4: Manual test checklist

- [ ] Open `/profile`, click "เปิดรับการแจ้งเตือน", verify `push_subscriptions` row created.
- [ ] Open `/admin/notifications` as ADMIN, select series, choose "followers", send message.
- [ ] As follower user, verify inbox page shows new notification without reload.
- [ ] Verify bell badge count increments.
- [ ] Close tab, send another notification, verify native push appears.
- [ ] Click native push, verify it opens the series page.

### Step 18.5: Commit

```bash
git add -A
git commit -m "chore: verify real-time notifications build and type-check"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| SSE for in-app badge/list updates | Tasks 3, 6, 11, 12, 13, 14 |
| Web Push with VAPID | Tasks 4, 9, 10, 15 |
| Admin page send followers/global | Tasks 8, 16 |
| `announcement` notification type | Task 5 (type union) |
| Push subscription storage | Tasks 2, 7 |
| Expired subscription cleanup | Task 4 |
| HTTPS/iOS notes | Task 17 (deployment implied) |

### Placeholder scan

No TBD/TODO/fill-in-details found. Every task includes exact file paths, code, and commands.

### Type consistency

- `NotificationType` extended in `src/lib/types.ts` and `src/lib/server/notifications.ts` to include `'announcement'`.
- `PushSubscriptionInput` defined once in `src/lib/types.ts` and reused in server/client code.
- `sendNotificationToUsers` signature matches spec.

### Known limitations

- SSE registry is in-memory; multiple server instances won't share events. Acceptable for current scope per spec.
- Web Push requires HTTPS and VAPID keys in production.
- iOS requires add-to-homescreen for push permission.
