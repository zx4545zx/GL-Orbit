<script lang="ts">
	import {
		createLibraryShareCard,
		shareLibraryCard
	} from '$lib/client/library-share-card.js';
	import { m, type AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import type { FavoriteSeriesItem } from '$lib/types.js';
	import { onDestroy } from 'svelte';

	interface Props {
		lang: AvailableLanguageTag;
		displayName: string | null;
		avatarUrl: string | null;
		favoriteCount: number;
		watchedCount: number;
		favorites: FavoriteSeriesItem[];
	}

	let {
		lang,
		displayName,
		avatarUrl,
		favoriteCount,
		watchedCount,
		favorites
	}: Props = $props();
	let busy = $state(false);
	let status = $state<'idle' | 'shared' | 'downloaded' | 'error'>('idle');
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function showToast(next: Exclude<typeof status, 'idle'>) {
		clearTimeout(toastTimer);
		status = next;
		toastTimer = setTimeout(() => (status = 'idle'), 3_000);
	}

	onDestroy(() => clearTimeout(toastTimer));

	async function createAndShare() {
		if (busy) return;
		busy = true;
		clearTimeout(toastTimer);
		status = 'idle';

		try {
			const blob = await createLibraryShareCard({
				lang: lang === 'en' ? 'en' : 'th',
				displayName: displayName?.trim() || m.profile_library_share_member_fallback(),
				avatarUrl,
				favoriteCount,
				watchedCount,
				favorites: favorites.slice(0, 3).map(({ title, poster }) => ({ title, poster: poster || null })),
				createdAt: new Date()
			});
			const result = await shareLibraryCard(blob, {
				title: m.profile_library_share_native_title(),
				text: m.profile_library_share_native_text()
			});
			if (result !== 'cancelled') showToast(result);
		} catch {
			showToast('error');
		} finally {
			busy = false;
		}
	}
</script>

<section class="border border-[var(--orbit-line)] bg-[var(--orbit-surface)]" aria-labelledby="library-share-title">
	<div class="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
		<div>
			<h3 id="library-share-title" class="font-display text-base font-bold text-[var(--orbit-ink)]">
				{m.profile_library_share_title()}
			</h3>
			<p class="mt-1 text-sm text-[var(--orbit-muted)]">
				{m.profile_library_share_description()}
			</p>
		</div>

		<button
			type="button"
			onclick={createAndShare}
			disabled={busy}
			class="touch-target border border-coral bg-coral px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-coral-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-not-allowed disabled:opacity-60"
		>
			{busy ? m.profile_library_share_creating() : m.profile_library_share_action()}
		</button>
	</div>

</section>

{#if status !== 'idle'}
	<div
		class="fixed inset-x-4 bottom-[var(--floating-action-bottom)] z-[60] mx-auto w-fit max-w-[calc(100%-2rem)] border px-4 py-3 text-sm font-semibold shadow-[var(--orbit-shadow-raised)] md:bottom-6 {status === 'error' ? 'border-coral bg-[var(--orbit-surface)] text-coral-dark' : 'border-mint bg-[var(--orbit-surface)] text-mint-dark'}"
		role={status === 'error' ? 'alert' : 'status'}
		aria-live="polite"
	>
		{status === 'shared'
			? m.profile_library_share_success()
			: status === 'downloaded'
				? m.profile_library_share_downloaded()
				: m.profile_library_share_error()}
	</div>
{/if}
