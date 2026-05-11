<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const series = $derived(data.series);

	const statusConfig: Record<string, { text: string; class: string; bg: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'text-mint-dark', bg: 'bg-mint/20' },
		UPCOMING: { text: ' upcoming', class: 'text-lavender-dark', bg: 'bg-lavender/20' },
		ENDED: { text: 'จบแล้ว', class: 'text-coral-dark', bg: 'bg-coral/10' }
	};

	const s = $derived(statusConfig[series.status]);
</script>

<div class="py-6 sm:py-8">
	<!-- Back button -->
	<a href="/series" class="inline-flex items-center gap-2 text-plum-light hover:text-coral-dark transition-colors mb-6 sm:mb-8 touch-target text-sm sm:text-base">
		<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
		<span class="font-medium">กลับหน้ารายการซีรีส์</span>
	</a>

	<!-- Hero -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
		<div class="md:col-span-1">
			<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-lavender/10 max-w-xs sm:max-w-none mx-auto">
				<img src={series.poster} alt={series.titleEn} class="w-full aspect-[2/3] object-cover" loading="eager" />
			</div>
		</div>

		<div class="md:col-span-2 space-y-4 sm:space-y-6">
			<div>
				<div class="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
					<span class="px-2.5 sm:px-3 py-1 rounded-full {s.bg} {s.class} text-xs sm:text-sm font-semibold">{s.text}</span>
					<span class="text-xs sm:text-sm text-plum-light">{series.studio}{#if series.year} • {series.year}{/if}</span>
				</div>
				<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold text-plum mb-1 sm:mb-2">{series.titleEn}</h1>
				<p class="text-base sm:text-xl text-plum-light">{series.titleTh}</p>
			</div>

			{#if series.description}
				<p class="text-sm sm:text-base text-plum-light leading-relaxed">{series.description}</p>
			{/if}

			{#if series.genres.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each series.genres as genre}
						<span class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-lavender/10 text-lavender-dark text-xs sm:text-sm font-medium">{genre}</span>
					{/each}
				</div>
			{/if}

			<div class="grid grid-cols-3 gap-2 sm:gap-4">
				<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
					<div class="text-xl sm:text-2xl font-bold text-coral-dark">{series.episodes}</div>
					<div class="text-[10px] sm:text-xs text-plum-light mt-1">ตอน</div>
				</div>
				{#if series.year}
					<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
						<div class="text-xl sm:text-2xl font-bold text-lavender-dark">{series.year}</div>
						<div class="text-[10px] sm:text-xs text-plum-light mt-1">ปีฉาย</div>
					</div>
				{/if}
				<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center">
					<div class="text-xl sm:text-2xl font-bold text-mint-dark">{series.artists.length}</div>
					<div class="text-[10px] sm:text-xs text-plum-light mt-1">นักแสดง</div>
				</div>
			</div>

			{#if series.platforms.length > 0}
				<div class="flex flex-wrap gap-2 sm:gap-3">
					{#each series.platforms as platform}
						<span class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl glass-card text-xs sm:text-sm font-medium text-plum flex items-center gap-2">
							{#if platform.logo}
								<img src={platform.logo} alt={platform.name} class="w-5 h-5 rounded-full object-cover" />
							{/if}
							{platform.name}
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Artists -->
	{#if series.artists.length > 0}
		<section class="mb-10 sm:mb-12">
			<h2 class="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-plum mb-4 sm:mb-6">นักแสดง</h2>
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
				{#each series.artists as artist}
					<div class="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center hover:shadow-lg transition-all">
						<img src={artist.image} alt={artist.name} class="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto mb-2 sm:mb-3 ring-2 sm:ring-4 ring-coral/20" loading="lazy" />
						<h3 class="font-semibold text-plum text-xs sm:text-sm">{artist.name}</h3>
						<p class="text-[10px] sm:text-xs text-plum-light">รับบท {artist.role}</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Episode Schedule -->
	{#if series.schedule.length > 0}
		<section>
			<h2 class="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-plum mb-4 sm:mb-6">ตารางฉาย</h2>
			<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
				<div class="divide-y divide-lavender/10">
					{#each series.schedule as ep}
						<div class="px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-5 hover:bg-white/40 transition-colors">
							<div class="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-coral/20 to-lavender/20 flex items-center justify-center">
								<span class="text-xs sm:text-sm font-bold text-coral-dark">{ep.episode}</span>
							</div>
							<div class="flex-1 min-w-0">
								<h3 class="font-medium text-plum text-sm sm:text-base truncate">{ep.title}</h3>
								<p class="text-xs sm:text-sm text-plum-light">{ep.airDate} • {ep.platform}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}
</div>
