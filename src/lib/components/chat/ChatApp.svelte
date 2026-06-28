<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChatMarkdown from '$lib/components/ChatMarkdown.svelte';

	type Conversation = {
		id: string;
		title: string;
		createdAt: string;
		updatedAt: string;
	};

	type Message = {
		id: string;
		role: 'USER' | 'ASSISTANT';
		content: string;
		createdAt: string;
	};

	let {
		conversations,
		activeConversation = null,
		initialMessages = []
	}: {
		conversations: Conversation[];
		activeConversation?: Conversation | null;
		initialMessages?: Message[];
	} = $props();

	let sidebarOpen = $state(false);
	let history = $state<Conversation[]>(conversations);
	let current = $state<Conversation | null>(activeConversation);
	let messages = $state<Message[]>(initialMessages);
	let input = $state('');
	let loading = $state(false);
	let error = $state('');
	let loadingStatus = $state('');
	let loadingDetail = $state('');
	let statusTimers: ReturnType<typeof setTimeout>[] = [];
	let renamingId = $state<string | null>(null);
	let renameTitle = $state('');
	const currentUser = $derived(page.data.user);

	const loadingSteps = [
		{ delay: 0, status: 'กำลังอ่านคำถามของคุณ', detail: 'กำลังดูว่าคุณอยากรู้เรื่องซีรีส์ นักแสดง หรือตารางฉาย' },
		{ delay: 2500, status: 'กำลังหาข้อมูลที่เกี่ยวข้อง', detail: 'กำลังค้นจากข้อมูลซีรีส์ที่มีใน GL-Orbit' },
		{ delay: 7000, status: 'กำลังคัดคำตอบให้ตรงคำถาม', detail: 'กำลังเลือกเฉพาะข้อมูลที่น่าจะช่วยตอบคำถามนี้' },
		{ delay: 10000, status: 'กำลังรวบรวมรายละเอียด', detail: 'กำลังเช็กชื่อเรื่อง สถานะ นักแสดง หรือช่องทางรับชมที่เกี่ยวข้อง' },
		{ delay: 15000, status: 'กำลังจัดคำตอบให้อ่านง่าย', detail: 'อีกสักครู่จะสรุปให้เป็นภาษาที่อ่านเข้าใจง่าย' },
		{ delay: 25000, status: 'ยังทำงานอยู่', detail: 'คำถามนี้ใช้เวลานานกว่าปกตินิดหน่อย กำลังพยายามหาคำตอบให้ครบ' }
	];

	function startLoadingStatus() {
		stopLoadingStatus();
		for (const step of loadingSteps) {
			statusTimers.push(setTimeout(() => {
				loadingStatus = step.status;
				loadingDetail = step.detail;
			}, step.delay));
		}
	}

	function stopLoadingStatus() {
		for (const timer of statusTimers) clearTimeout(timer);
		statusTimers = [];
		loadingStatus = '';
		loadingDetail = '';
	}

	async function refreshHistory() {
		const res = await fetch('/api/chat/conversations');
		if (!res.ok) return;
		const body = await res.json();
		history = body.conversations ?? history;
	}

	async function createConversation(title = 'แชตใหม่', options: { resetMessages?: boolean } = {}) {
		if (current && messages.length === 0) {
			await goto(`/chat/${current.id}`);
			return current;
		}

		const res = await fetch('/api/chat/conversations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title })
		});
		if (!res.ok) throw new Error('create failed');
		const body = await res.json();
		current = body.conversation;
		if (options.resetMessages ?? true) messages = [];
		await refreshHistory();
		const created = current;
		if (!created) throw new Error('create failed');
		await goto(`/chat/${created.id}`);
		return created;
	}

	async function sendMessage() {
		const text = input.trim();
		if (!text || loading) return;

		error = '';
		loading = true;
		input = '';
		startLoadingStatus();

		const optimisticUser: Message = {
			id: crypto.randomUUID(),
			role: 'USER',
			content: text,
			createdAt: new Date().toISOString()
		};
		messages = [...messages, optimisticUser];

		try {
			const conversation = current ?? await createConversation(text, { resetMessages: false });
			if (!conversation) throw new Error('missing conversation');
			const res = await fetch(`/api/chat/conversations/${conversation.id}/messages`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: text })
			});
			const body = await res.json();
			if (!res.ok) {
				error = body.error ?? 'ตอบคำถามไม่ได้ในตอนนี้';
				messages = messages.filter((message) => message.id !== optimisticUser.id);
				input = text;
				return;
			}

			messages = [
				...messages,
				{
					id: crypto.randomUUID(),
					role: 'ASSISTANT',
					content: body.reply,
					createdAt: new Date().toISOString()
				}
			];
			await refreshHistory();
		} catch {
			error = 'เชื่อมต่อแชตไม่ได้ ลองใหม่อีกครั้งนะคะ';
			messages = messages.filter((message) => message.id !== optimisticUser.id);
			input = text;
		} finally {
			loading = false;
			stopLoadingStatus();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function startRename(conversation: Conversation) {
		renamingId = conversation.id;
		renameTitle = conversation.title;
	}

	async function saveRename(conversationId: string) {
		const title = renameTitle.trim();
		if (!title) return;
		const res = await fetch(`/api/chat/conversations/${conversationId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title })
		});
		if (!res.ok) return;
		const body = await res.json();
		history = history.map((item) => item.id === conversationId ? body.conversation : item);
		if (current?.id === conversationId) current = body.conversation;
		renamingId = null;
	}

	async function deleteConversation(conversationId: string) {
		if (!confirm('ลบแชตนี้หรือไม่?')) return;
		const res = await fetch(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' });
		if (!res.ok) return;
		history = history.filter((item) => item.id !== conversationId);
		if (current?.id === conversationId) {
			current = null;
			messages = [];
			await goto('/chat');
		}
	}
</script>

<svelte:head>
	<title>{current?.title ?? 'AI Chat'} | GL-Orbit</title>
</svelte:head>

<div class="flex h-full overflow-hidden">
	{#if sidebarOpen}
		<button class="fixed inset-0 z-30 bg-black/20 md:hidden" type="button" aria-label="ปิดประวัติแชต" onclick={() => sidebarOpen = false}></button>
	{/if}

	<aside class="fixed top-[var(--pwa-safe-top)] bottom-0 left-0 z-40 flex w-80 max-w-[86vw] flex-col border-r border-black/10 bg-white transition-transform md:static md:translate-x-0 {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}">
		<div class="flex h-16 items-center gap-3 border-b border-black/10 px-4">
			<a href="/" class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-lavender font-bold text-white">G</a>
			<div class="min-w-0">
				<p class="truncate text-sm font-bold text-plum">GL-Orbit AI</p>
				<p class="text-xs text-plum-light">ผู้ช่วยค้นข้อมูลซีรีส์</p>
			</div>
			<button
				type="button"
				class="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-xl font-bold text-plum-light transition hover:bg-lavender/10 hover:text-plum md:hidden"
				aria-label="ปิดเมนู"
				onclick={() => sidebarOpen = false}
			>
				×
			</button>
		</div>

		<div class="p-3">
			<button type="button" class="flex w-full items-center justify-center rounded-xl border border-lavender/30 bg-white px-4 py-3 text-sm font-bold text-plum shadow-sm transition hover:bg-lavender/10" onclick={() => createConversation('แชตใหม่', { resetMessages: true })}>
				แชตใหม่
			</button>
		</div>

		<nav class="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
			{#each history as conversation (conversation.id)}
				<div class="group flex items-center gap-1 rounded-xl {current?.id === conversation.id ? 'bg-coral/10' : 'hover:bg-lavender/10'}">
					{#if renamingId === conversation.id}
						<input
							class="min-w-0 flex-1 rounded-lg border border-lavender/30 bg-white px-2 py-2 text-sm outline-none focus:border-coral"
							bind:value={renameTitle}
							onkeydown={(event) => {
								if (event.key === 'Enter') saveRename(conversation.id);
								if (event.key === 'Escape') renamingId = null;
							}}
						/>
						<button type="button" class="px-2 text-xs font-bold text-coral-dark" onclick={() => saveRename(conversation.id)}>บันทึก</button>
					{:else}
						<a href={`/chat/${conversation.id}`} class="min-w-0 flex-1 truncate px-3 py-2.5 text-sm font-medium text-plum" onclick={() => sidebarOpen = false}>
							{conversation.title}
						</a>
						<button type="button" class="px-2 text-xs text-plum-light opacity-100 md:opacity-0 md:group-hover:opacity-100" onclick={() => startRename(conversation)}>แก้</button>
						<button type="button" class="px-2 pr-3 text-xs text-coral-dark opacity-100 md:opacity-0 md:group-hover:opacity-100" onclick={() => deleteConversation(conversation.id)}>ลบ</button>
					{/if}
				</div>
			{/each}
		</nav>

		<div class="border-t border-black/10 p-3">
			<a href="/" class="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-plum-light transition hover:bg-lavender/10 hover:text-plum">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
				</svg>
				กลับหน้าเว็บ
			</a>
		</div>
	</aside>

	<section class="flex min-w-0 flex-1 flex-col">
		<header class="flex h-16 shrink-0 items-center justify-between border-b border-black/10 bg-white px-4">
			<div class="flex min-w-0 items-center gap-3">
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-xl border border-lavender/30 text-plum transition hover:bg-lavender/10 md:hidden"
					aria-label="เปิดเมนู"
					onclick={() => sidebarOpen = true}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				<div class="min-w-0">
					<h1 class="truncate text-base font-bold text-plum">{current?.title ?? 'แชตใหม่'}</h1>
					<p class="text-xs text-plum-light">ถามต่อได้ในบทสนทนาเดิม</p>
				</div>
			</div>
			<a href="/profile" class="flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-lavender/10">
				{#if currentUser?.avatarUrl}
					<img src={currentUser.avatarUrl} alt="" class="h-8 w-8 rounded-full object-cover" />
				{:else}
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral/20 to-lavender/25 text-xs font-black text-coral-dark">
						{(currentUser?.displayName || currentUser?.username || 'U').charAt(0).toUpperCase()}
					</div>
				{/if}
				<span class="hidden max-w-32 truncate text-sm font-bold text-plum sm:block">
					{currentUser?.displayName || currentUser?.username || 'โปรไฟล์'}
				</span>
			</a>
		</header>

		<div class="flex-1 overflow-y-auto px-4 py-6">
			<div class="mx-auto flex max-w-3xl flex-col gap-5">
				{#if messages.length === 0}
					<div class="flex min-h-[52dvh] flex-col items-center justify-center text-center">
						<div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-coral/15 text-lg font-black text-coral-dark">AI</div>
						<h2 class="text-2xl font-black text-plum">อยากรู้เรื่องซีรีส์อะไร?</h2>
						<p class="mt-3 max-w-lg text-sm leading-6 text-plum-light">
							ลองถามเช่น “ซีรีส์ที่กำลังฉายมีเรื่องอะไรบ้าง” หรือ “นักแสดงคนนี้อยู่เรื่องไหน”
						</p>
					</div>
				{:else}
					{#each messages as message (message.id)}
						<article class="flex {message.role === 'USER' ? 'justify-end' : 'justify-start'}">
							<div class="{message.role === 'USER' ? 'max-w-[82%] rounded-2xl rounded-tr-md bg-coral px-4 py-3 text-white shadow-lg shadow-coral/15' : 'max-w-[90%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-plum shadow-sm'} text-sm leading-6">
								{#if message.role === 'USER'}
									{message.content}
								{:else}
									<ChatMarkdown content={message.content} />
								{/if}
							</div>
						</article>
					{/each}
				{/if}

				{#if loading}
					<div class="max-w-[90%] rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm">
						<div class="flex items-center gap-2 text-sm font-semibold text-plum">
							<span class="h-2.5 w-2.5 animate-pulse rounded-full bg-coral"></span>
							{loadingStatus || 'กำลังเริ่มทำงาน'}
						</div>
						<p class="mt-1 text-sm leading-5 text-plum-light">{loadingDetail || 'กำลังเตรียมคำถามของคุณ'}</p>
					</div>
				{/if}
			</div>
		</div>

		<footer class="shrink-0 border-t border-black/10 bg-white px-4 py-3">
			<div class="mx-auto max-w-3xl">
				{#if error}
					<p class="mb-2 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral-dark">{error}</p>
				{/if}
				<div class="flex items-end gap-2 rounded-2xl border border-lavender/25 bg-white p-2 shadow-sm">
					<textarea
						bind:value={input}
						onkeydown={handleKeydown}
						rows="1"
						maxlength="500"
						placeholder="ถามเกี่ยวกับซีรีส์..."
						class="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-plum outline-none"
						disabled={loading}
					></textarea>
					<button type="button" onclick={sendMessage} disabled={loading || !input.trim()} class="h-11 rounded-xl bg-plum px-5 text-sm font-bold text-white transition hover:bg-coral disabled:cursor-not-allowed disabled:opacity-45">
						ส่ง
					</button>
				</div>
			</div>
		</footer>
	</section>
</div>
