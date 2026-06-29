<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import ChatMarkdown from '$lib/components/ChatMarkdown.svelte';
	import ChatContextPanel from './ChatContextPanel.svelte';
	import type { ChatContextPayload } from './ChatContext.js';

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
	let followupSuggestions = $state<string[]>([]);
	let context = $state<ChatContextPayload>(null);
	let panelOpen = $state(false);
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
			await replaceState(`/chat/${current.id}`, page.state);
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
		await replaceState(`/chat/${created.id}`, page.state);
		return created;
	}

	async function sendMessage() {
		const text = input.trim();
		if (!text || loading) return;

		error = '';
		followupSuggestions = [];
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
			followupSuggestions = Array.isArray(body.suggestions)
				? body.suggestions.filter((suggestion: unknown): suggestion is string => typeof suggestion === 'string' && suggestion.trim().length > 0).slice(0, 4)
				: [];
			context = body.context ?? null;
			await refreshHistory();
		} catch {
			error = 'เชื่อมต่อแชตไม่ได้ ลองใหม่อีกครั้งนะคะ';
			messages = messages.filter((message) => message.id !== optimisticUser.id);
			input = text;
			context = null;
		} finally {
			loading = false;
			stopLoadingStatus();
		}
	}

	const SUGGESTIONS = [
		{ label: 'ตารางฉายวันนี้', prompt: 'ตารางฉายวันนี้มีอะไรบ้าง?' },
		{ label: 'กำลังฉายอยู่', prompt: 'ตอนนี้มีซีรีส์เรื่องไหนกำลังฉายอยู่บ้าง?' },
		{ label: 'รอฉายใหม่', prompt: 'ซีรีส์ที่กำลังจะฉายมีเรื่องอะไรบ้าง?' },
		{ label: 'แนะนำแนวโรแมนติก', prompt: 'มีซีรีส์แนวโรแมนติกเรื่องอะไรบ้าง?' }
	];

	function sendSuggestion(text: string) {
		if (loading) return;
		input = text;
		void sendMessage();
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
			await replaceState('/chat', page.state);
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
		{#if currentUser}
			<div class="flex items-center gap-2 border-b border-black/10 px-4 py-3">
				{#if currentUser.avatarUrl}
					<img src={currentUser.avatarUrl} alt="" class="h-8 w-8 rounded-full object-cover" />
				{:else}
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral/20 to-lavender/25 text-xs font-black text-coral-dark">
						{(currentUser.displayName || currentUser.username || 'U').charAt(0).toUpperCase()}
					</div>
				{/if}
				<div class="min-w-0">
					<p class="truncate text-sm font-bold text-plum">{currentUser.displayName || currentUser.username}</p>
					<a href="/profile" class="text-xs text-plum-light hover:text-coral-dark transition">ดูโปรไฟล์</a>
				</div>
			</div>
		{/if}
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

		<nav class="flex-1 space-y-1 overflow-y-auto px-2 pb-4 overscroll-y-contain">
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

	<section class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
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
			{#if context}
				<button type="button" class="relative flex h-10 w-10 items-center justify-center rounded-xl border border-lavender/30 text-plum transition hover:bg-lavender/10" aria-label="ดูข้อมูลที่เกี่ยวข้อง" onclick={() => panelOpen = true}>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
					</svg>
					<span class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
						{context.type === 'series' ? context.seriesIds.length : context.type === 'artist' ? context.artistIds.length : 0}
					</span>
				</button>
			{/if}
		</header>

		<div class="flex-1 overflow-y-auto px-4 pt-6 pb-40 overscroll-y-contain sm:pb-44">
			<div class="mx-auto flex max-w-3xl flex-col gap-5">
				{#if messages.length === 0}
					<div class="flex min-h-[52dvh] flex-col items-center justify-center text-center">
						<div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-coral/15 text-lg font-black text-coral-dark">AI</div>
						<h2 class="text-2xl font-black text-plum">อยากรู้เรื่องซีรีส์อะไร?</h2>
						<div class="mt-5 flex flex-wrap items-center justify-center gap-2">
							{#each SUGGESTIONS as suggestion (suggestion.prompt)}
								<button type="button" onclick={() => sendSuggestion(suggestion.prompt)} class="rounded-full border border-lavender/30 bg-white px-4 py-2 text-sm font-semibold text-plum shadow-sm transition hover:border-coral hover:bg-coral/5 hover:text-coral-dark">
									{suggestion.label}
								</button>
							{/each}
						</div>
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
							<span class="flex items-center gap-1">
								<span class="h-2 w-2 animate-bounce rounded-full bg-coral" style="animation-delay: 0ms"></span>
								<span class="h-2 w-2 animate-bounce rounded-full bg-coral" style="animation-delay: 150ms"></span>
								<span class="h-2 w-2 animate-bounce rounded-full bg-coral" style="animation-delay: 300ms"></span>
							</span>
							{loadingStatus || 'กำลังเริ่มทำงาน'}
						</div>
						<p class="mt-1 text-sm leading-5 text-plum-light">{loadingDetail || 'กำลังเตรียมคำถามของคุณ'}</p>
					</div>
				{/if}

				{#if error}
					<div class="flex justify-start">
						<div class="flex max-w-[90%] items-start gap-2 rounded-2xl rounded-tl-md border border-coral/30 bg-coral/10 px-4 py-3 text-sm leading-6 text-coral-dark">
							<svg class="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008Zm9-0.75c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25 21.75 6.615 21.75 12Z" />
							</svg>
							<span>{error}</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<footer class="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pt-2 sm:px-4" style="padding-bottom: max(14px, env(safe-area-inset-bottom, 0px));">
			<div class="pointer-events-auto mx-auto max-w-3xl">
				{#if !loading && input.trim() === '' && (followupSuggestions.length > 0 || messages.length === 0)}
					<div class="mb-2 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
						{#if followupSuggestions.length > 0}
							{#each followupSuggestions as suggestion (suggestion)}
								<button type="button" onclick={() => sendSuggestion(suggestion)} class="shrink-0 rounded-full border border-coral/25 bg-white/95 px-3.5 py-2 text-xs font-bold text-coral-dark shadow-sm shadow-coral/10 transition hover:-translate-y-0.5 hover:border-coral hover:bg-coral/10 hover:shadow-coral/20 active:translate-y-0">
									{suggestion}
								</button>
							{/each}
						{:else}
							{#each SUGGESTIONS as suggestion (suggestion.prompt)}
								<button type="button" onclick={() => sendSuggestion(suggestion.prompt)} class="shrink-0 rounded-full border border-lavender/30 bg-white/95 px-3.5 py-2 text-xs font-bold text-plum shadow-sm shadow-lavender/10 transition hover:-translate-y-0.5 hover:border-coral hover:bg-coral/5 hover:text-coral-dark active:translate-y-0">
									{suggestion.label}
								</button>
							{/each}
						{/if}
					</div>
				{/if}
				<div class="relative overflow-hidden rounded-[1.65rem] border border-lavender/25 bg-white/95 p-2.5 shadow-2xl shadow-lavender/25 ring-1 ring-white/80 before:pointer-events-none before:absolute before:inset-0 before:rounded-[1.65rem] before:bg-gradient-to-r before:from-coral/5 before:via-lavender/5 before:to-mint/5">
					<div class="relative flex items-end gap-2">
						<div class="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-coral/20 to-lavender/25 text-xs font-black text-coral-dark shadow-inner shadow-white/40 sm:flex">
							AI
						</div>
						<textarea
							bind:value={input}
							onkeydown={handleKeydown}
							rows="1"
							maxlength="500"
							placeholder="ถาม GL-Orbit AI..."
							class="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-base leading-6 text-plum placeholder:text-plum-light/70 outline-none sm:px-3"
							disabled={loading}
						></textarea>
						<button type="button" onclick={sendMessage} disabled={loading || !input.trim()} class="group flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-br from-plum to-coral px-4 text-sm font-black text-white shadow-lg shadow-coral/20 transition hover:-translate-y-0.5 hover:shadow-coral/35 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45 sm:px-5">
							<span class="hidden sm:inline">ส่ง</span>
							<svg class="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.4">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m0 0-5-5m5 5-5 5" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</footer>
	</section>

	{#if panelOpen && context}
		<ChatContextPanel {context} onClose={() => (panelOpen = false)} />
	{/if}
</div>
