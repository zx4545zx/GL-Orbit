<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	let {
		title,
		text,
		url,
		className = '',
		ariaLabel = m.share_aria_label(),
		variant = 'compact'
	}: {
		title: string;
		text: string;
		url: string;
		className?: string;
		ariaLabel?: string;
		variant?: 'compact' | 'command';
	} = $props();

	let menuOpen = $state(false);
	let copied = $state(false);
	let copiedTimer: ReturnType<typeof setTimeout> | null = null;
	let rootEl: HTMLDivElement | null = $state(null);

	const lineUrl = $derived(
		`https://line.me/R/msg/text/?${encodeURIComponent(`${title}\n${text}\n${url}`)}`
	);
	const facebookUrl = $derived(
		`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
	);
	const xUrl = $derived(
		`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
	);
	const buttonClass = $derived(
		variant === 'command'
			? `inline-flex min-h-[3.35rem] items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm touch-target focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender ${menuOpen ? 'border border-lavender/60 bg-lavender/18 text-lavender-dark' : 'border border-lavender/40 bg-white/95 text-plum hover:border-lavender/60 hover:bg-lavender/8'} ${className}`
			: `inline-flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm font-semibold touch-target focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender ${menuOpen ? 'border border-lavender/60 bg-lavender/18 text-lavender-dark' : 'border border-lavender/35 bg-white/95 text-plum hover:border-lavender/55 hover:bg-lavender/8 hover:text-lavender-dark'} ${className}`
	);

	const LINE_PATH =
		'M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.05.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314';
	const FB_PATH =
		'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12C0 18.627 5.373 24 12.001 24c.852 0 1.679-.09 2.479-.257v-8.024H8.865v-3.47h3.615V9.43c0-3.578 2.184-5.526 5.368-5.526 1.526 0 2.836.114 3.216.165v3.726l-2.208.001c-1.732 0-2.067.824-2.067 2.034v2.668h4.136l-.539 3.47h-3.597v7.851C20.597 22.855 24 18.853 24 12.073';
	const X_PATH =
		'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z';

	async function handleShare() {
		if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
			try {
				await navigator.share({ title, text, url });
				return;
			} catch (err) {
				if (err instanceof DOMException && err.name === 'AbortError') return;
			}
		}
		menuOpen = !menuOpen;
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = url;
			ta.style.position = 'fixed';
			ta.style.opacity = '0';
			document.body.appendChild(ta);
			ta.select();
			try {
				document.execCommand('copy');
			} catch {
				/* give up silently */
			}
			document.body.removeChild(ta);
		}
		copied = true;
		if (copiedTimer) clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => {
			copied = false;
			menuOpen = false;
		}, 1600);
	}

	function handleWindowClick(e: MouseEvent) {
		if (menuOpen && rootEl && !rootEl.contains(e.target as Node)) {
			menuOpen = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) menuOpen = false;
	}

	function selectOption(e: MouseEvent) {
		menuOpen = false;
		e.stopPropagation();
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleKeydown} />

<div class="relative" bind:this={rootEl}>
	<button
		onclick={handleShare}
		aria-label={ariaLabel}
		aria-haspopup="menu"
		aria-expanded={menuOpen}
		class={buttonClass}
	>
		{#if variant === 'command'}
			<span class="grid h-9 w-9 shrink-0 place-items-center rounded-2xl {menuOpen ? 'bg-lavender text-white' : 'bg-lavender/16 text-lavender-dark ring-1 ring-lavender/30'}">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.9"
						d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-2.684-4.684M5.342 8.684a3 3 0 104.026 4.026m-4.026-4.026L18.058 5.5M5.342 15.316L18.058 18.5"
					/>
				</svg>
			</span>

			<span class="min-w-0 leading-none">
				<span class="block text-[10px] font-bold uppercase tracking-[0.22em] opacity-70">SHARE</span>
				<span class="mt-1 block truncate text-xs font-bold sm:text-sm">{m.share_command_title()}</span>
			</span>
		{:else}
			<div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lavender/16 text-lavender-dark ring-1 ring-lavender/30 {menuOpen ? 'bg-lavender text-white' : ''}">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.8"
						d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-2.684-4.684M5.342 8.684a3 3 0 104.026 4.026m-4.026-4.026L18.058 5.5M5.342 15.316L18.058 18.5"
					/>
				</svg>
			</div>
			<span>{m.share_aria_label()}</span>
		{/if}
	</button>

	{#if menuOpen}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			role="menu"
			aria-label={m.share_menu_label()}
			class="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-2"
		>
			<p class="px-3 pb-2 pt-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-plum-light">{m.share_to()}</p>

			<a
				href={lineUrl}
				target="_blank"
				rel="noopener noreferrer"
				role="menuitem"
				onclick={selectOption}
				class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/70 touch-target"
			>
				<span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center share-brand-line">
					<svg class="text-white share-icon-line" fill="currentColor" viewBox="0 0 24 24"><path d={LINE_PATH} /></svg>
				</span>
				<span class="text-sm font-medium text-plum">LINE</span>
			</a>

			<a
				href={facebookUrl}
				target="_blank"
				rel="noopener noreferrer"
				role="menuitem"
				onclick={selectOption}
				class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/70 touch-target"
			>
				<span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center share-brand-facebook">
					<svg class="text-white share-icon-facebook" fill="currentColor" viewBox="0 0 24 24"><path d={FB_PATH} /></svg>
				</span>
				<span class="text-sm font-medium text-plum">Facebook</span>
			</a>

			<a
				href={xUrl}
				target="_blank"
				rel="noopener noreferrer"
				role="menuitem"
				onclick={selectOption}
				class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/70 touch-target"
			>
				<span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-black">
					<svg class="text-white share-icon-x" fill="currentColor" viewBox="0 0 24 24"><path d={X_PATH} /></svg>
				</span>
				<span class="text-sm font-medium text-plum">X (Twitter)</span>
			</a>

			<div class="my-1.5 h-px bg-lavender/20"></div>

			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<button
				type="button"
				role="menuitem"
				onclick={copyLink}
				class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/70 touch-target text-left"
			>
				<span class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-lavender/20">
					{#if copied}
						<svg class="w-4 h-4 text-mint-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
					{:else}
						<svg class="w-4 h-4 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
					{/if}
				</span>
				<span class="text-sm font-medium text-plum">{copied ? m.share_copied() : m.share_copy()}</span>
			</button>
		</div>
	{/if}
</div>
