<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';

	let url = $state('');
	let body = $state('');
	let composerState = $state<'idle' | 'resolving' | 'ready' | 'publishing'>('idle');
	const signedIn = $derived(Boolean(page.data.user));
	function preview() { if (!url.trim()) return; composerState = 'resolving'; setTimeout(() => composerState = 'ready', 350); }
	function publish() { if (!signedIn) return; composerState = 'publishing'; setTimeout(() => { url = ''; body = ''; composerState = 'idle'; }, 450); }
</script>

<section class="rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_12px_36px_rgba(88,66,130,.10)] backdrop-blur-xl sm:p-5" aria-label={m.halo_composer_prompt()}>
	<div class="flex gap-3">
		<div class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-coral to-lavender font-display font-bold text-white">{page.data.user?.username?.[0]?.toUpperCase() ?? '✦'}</div>
		<div class="min-w-0 flex-1">
			<label class="sr-only" for="moment-url">{m.halo_composer_url()}</label>
			<div class="flex rounded-xl border border-lavender/30 bg-lavender/5 focus-within:border-lavender">
				<input id="moment-url" bind:value={url} onkeydown={(event) => event.key === 'Enter' && preview()} placeholder={m.halo_composer_url()} class="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none" type="url" />
				<button type="button" onclick={preview} class="m-1 rounded-lg bg-plum px-3 text-xs font-bold text-white disabled:opacity-50" disabled={!url || composerState === 'resolving'}>{composerState === 'resolving' ? '…' : m.halo_preview()}</button>
			</div>
			{#if composerState === 'ready'}<p class="mt-2 rounded-xl bg-mint/15 px-3 py-2 text-xs font-medium text-plum">✓ Link ready. It will always point back to its original source.</p>{/if}
		</div>
	</div>
	<textarea bind:value={body} placeholder={m.halo_composer_body()} rows="2" class="mt-3 w-full resize-none rounded-xl border border-transparent bg-transparent px-1 py-2 text-sm outline-none placeholder:text-plum-light focus:border-lavender/30"></textarea>
	<div class="mt-2 flex items-center justify-between border-t border-plum/5 pt-3">
		<span class="text-xs text-plum-light">{body.length}/2,000</span>
		<button type="button" onclick={publish} class="rounded-xl bg-gradient-to-r from-coral to-coral-dark px-4 py-2 text-sm font-bold text-white shadow-md shadow-coral/25 disabled:opacity-60" disabled={!url || composerState === 'resolving' || composerState === 'publishing'}>{signedIn ? m.halo_publish() : m.halo_signin()}</button>
	</div>
</section>
