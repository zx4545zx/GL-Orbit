<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import {
		isPushSupported,
		getExistingSubscription,
		requestPushPermission
	} from '$lib/client/push-notifications.js';

	let visible = $state(false);
	let loading = $state(false);
	let statusMessage = $state('');
	let statusType = $state<'success' | 'error' | 'blocked'>('error');

	const DISMISSED_KEY = 'push-prompt-dismissed';

	onMount(() => {
		if (!isPushSupported()) return;
		if (window.matchMedia('(display-mode: browser)').matches && !/(iP(ad|hone|od)|Android)/.test(navigator.userAgent)) {
			// On desktop browsers only ask once per session; PWA / mobile is higher intent
		}
		if (localStorage.getItem(DISMISSED_KEY) === '1') return;

		getExistingSubscription().then((sub) => {
			if (!sub && Notification.permission !== 'denied') {
				visible = true;
			}
		});
	});

	function dismiss() {
		visible = false;
		localStorage.setItem(DISMISSED_KEY, '1');
	}

	async function enable() {
		if (!isPushSupported()) {
			statusMessage = m.push_prompt_unsupported();
			statusType = 'error';
			return;
		}

		loading = true;
		try {
			const granted = await requestPushPermission();
			if (granted) {
				statusMessage = m.push_prompt_success();
				statusType = 'success';
				setTimeout(() => {
					visible = false;
					statusMessage = '';
				}, 2000);
			} else if (Notification.permission === 'denied') {
				statusMessage = m.push_prompt_blocked();
				statusType = 'blocked';
			} else {
				statusMessage = m.push_prompt_error();
				statusType = 'error';
			}
		} catch {
			statusMessage = m.push_prompt_error();
			statusType = 'error';
		} finally {
			loading = false;
		}
	}
</script>

{#if visible}
	<div
		transition:fly={{ y: 24, duration: 250 }}
		class="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-80 z-[60]"
	>
		<div class="glass-card-strong rounded-2xl p-4 shadow-xl shadow-lavender/20 border border-white/60">
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-coral to-lavender flex items-center justify-center shrink-0">
					<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
					</svg>
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-sm font-bold text-plum">{m.push_prompt_title()}</h3>
					<p class="text-xs text-plum-light mt-1 leading-relaxed">{m.push_prompt_description()}</p>
				</div>
			</div>

			{#if statusMessage}
				<div class="mt-3 text-xs font-medium rounded-lg px-3 py-2 text-center
					{statusType === 'success' ? 'bg-mint/10 text-mint-dark' : statusType === 'blocked' ? 'bg-amber-100 text-amber-700' : 'bg-coral/10 text-coral-dark'}">
					{statusMessage}
				</div>
			{/if}

			<div class="flex gap-2 mt-3">
				<button
					onclick={enable}
					disabled={loading}
					class="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white text-xs font-semibold shadow-lg shadow-coral/25 hover:shadow-xl transition-all disabled:opacity-60 touch-target flex items-center justify-center gap-1.5"
				>
					{#if loading}
						<svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
						{m.push_prompt_enabling()}
					{:else}
						{m.push_prompt_enable()}
					{/if}
				</button>
				<button
					onclick={dismiss}
					class="py-2 px-3 rounded-xl bg-white/60 hover:bg-white text-plum-light hover:text-plum text-xs font-medium transition-colors touch-target"
				>
					{m.push_prompt_dismiss()}
				</button>
			</div>
		</div>
	</div>
{/if}
