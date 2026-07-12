<script lang="ts">
	let { provider, source }: { provider: 'YouTube' | 'TikTok' | 'X' | 'Link'; source: string } = $props();
	const hostname = $derived.by(() => {
		try { return new URL(source).hostname.replace('www.', ''); } catch { return source; }
	});
</script>

<a href={source} target="_blank" rel="noreferrer" class="group block overflow-hidden rounded-2xl border border-plum/10 bg-white transition hover:border-lavender/70 hover:shadow-lg hover:shadow-lavender/10">
	<div class="relative flex aspect-[16/7] items-end overflow-hidden bg-gradient-to-br from-plum via-plum-light to-lavender-dark p-4">
		<div class="absolute -right-8 -top-10 h-36 w-36 rounded-full border border-white/20"></div>
		<div class="absolute right-12 top-4 h-14 w-14 rounded-full bg-coral/30 blur-xl"></div>
		<div class="relative flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
			<span class="h-2 w-2 rounded-full bg-mint"></span>{provider}
		</div>
		<span class="relative ml-auto text-xs text-white/70">{hostname} ↗</span>
	</div>
	<div class="flex items-center justify-between gap-3 px-4 py-3 text-sm">
		<span class="truncate font-semibold text-plum">Original source</span>
		<span class="shrink-0 text-plum-light group-hover:text-coral-dark">Open ↗</span>
	</div>
</a>
