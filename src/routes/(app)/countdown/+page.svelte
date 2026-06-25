<script lang="ts">
	import { page } from '$app/state';
	import {
		DEFAULT_OG_IMAGE,
		DEFAULT_SEO_DESCRIPTION,
		OG_IMAGE_HEIGHT,
		OG_IMAGE_TYPE,
		OG_IMAGE_WIDTH,
		SITE_NAME,
		absoluteUrl,
		buildBreadcrumbJsonLd,
		buildWebPageJsonLd,
		jsonLdScript,
		safeJsonLd
	} from '$lib/seo.js';
	import type { PageData } from './$types.js';
	import type { CountdownItem } from '$lib/types/home.js';

	let { data }: { data: PageData } = $props();

	const countdownItems = $derived<CountdownItem[]>(data.countdown);

	const SEO_TITLE = `นับถอยหลังซีรีส์ GL | ${SITE_NAME}`;
	const SEO_DESCRIPTION = 'นับถอยหลังสู่ตอนใหม่ของซีรีส์ GL ที่กำลังฉายและที่กำลังจะฉาย พร้อมเวลาออกอากาศและแพลตฟอร์มรับชม';

	const canonicalUrl = $derived(absoluteUrl(page.url.origin, '/countdown'));
	const jsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, '/countdown', SEO_TITLE, SEO_DESCRIPTION),
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: 'หน้าแรก', path: '/' },
			{ name: 'นับถอยหลัง', path: '/countdown' }
		])
	]));

	// --- Live countdown clock ---
	// `now` ticks every second so the HH:MM:SS tiles update in real time.
	let now = $state(Date.now());
	$effect(() => {
		if (countdownItems.length === 0) return;
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	interface ActiveCountdown extends CountdownItem {
		diff: number;
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
		airLabel: string;
	}

	const dayShortNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
	const thaiMonths = [
		'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
		'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
	];

	// Only keep airings still in the future — when `diff <= 0` the card disappears.
	const activeCountdowns = $derived<ActiveCountdown[]>(
		countdownItems
			.map((item) => {
				const target = new Date(item.airDate);
				const diff = target.getTime() - now;
				return {
					...item,
					diff,
					days: Math.max(0, Math.floor(diff / 86_400_000)),
					hours: Math.max(0, Math.floor((diff % 86_400_000) / 3_600_000)),
					minutes: Math.max(0, Math.floor((diff % 3_600_000) / 60_000)),
					seconds: Math.max(0, Math.floor((diff % 60_000) / 1_000)),
					airLabel: `${dayShortNames[target.getDay()]} ${target.getDate()} ${thaiMonths[target.getMonth()]} · ${pad(target.getHours())}:${pad(target.getMinutes())} น.`
				};
			})
			.filter((c) => c.diff > 0)
	);

	const pad = (n: number) => String(n).padStart(2, '0');
</script>

<svelte:head>
	<title>{SEO_TITLE}</title>
	<meta name="description" content={SEO_DESCRIPTION} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={SEO_TITLE} />
	<meta property="og:description" content={SEO_DESCRIPTION} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:title" content={SEO_TITLE} />
	<meta name="twitter:description" content={SEO_DESCRIPTION} />
	{@html jsonLdScript(jsonLd)}
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden -mx-4 px-4 pt-4 sm:pt-8 pb-10 sm:pb-14">
	<!-- background atmosphere (เหมือน hero หน้าแรก: mesh + floating blobs + orbit) -->
	<div class="absolute inset-0 bg-gradient-mesh pointer-events-none"></div>
	<div class="absolute top-4 left-2 sm:left-10 w-44 h-44 sm:w-72 sm:h-72 bg-coral/20 rounded-full blur-3xl animate-float pointer-events-none"></div>
	<div class="absolute top-24 right-2 sm:right-12 w-52 h-52 sm:w-80 sm:h-80 bg-lavender/20 rounded-full blur-3xl animate-float-delayed pointer-events-none"></div>
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[460px] sm:h-[460px] bg-mint/10 rounded-full blur-3xl pointer-events-none"></div>

	<!-- orbiting particles — signature ของ GL-Orbit -->
	<div class="absolute top-20 right-6 sm:top-24 sm:right-24 w-[170px] h-[170px] sm:w-[230px] sm:h-[230px] pointer-events-none">
		<div class="absolute w-2.5 h-2.5 bg-coral rounded-full animate-orbit opacity-70"></div>
		<div class="absolute w-2 h-2 bg-lavender rounded-full animate-orbit opacity-50" style="animation-delay:-6s; animation-duration:14s;"></div>
		<div class="absolute w-1.5 h-1.5 bg-mint rounded-full animate-orbit opacity-60" style="animation-delay:-11s; animation-duration:22s;"></div>
	</div>

	<div class="relative z-10 max-w-3xl mx-auto">
		<a href="/" class="flex w-fit items-center gap-1.5 text-sm font-medium text-plum-light hover:text-coral-dark transition-colors mb-6 sm:mb-8 glass-card rounded-full pl-3 pr-4 py-2 touch-target">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
			กลับหน้าแรก
		</a>

		<div class="inline-flex items-center gap-2 mb-4 animate-slide-up">
			<span class="relative flex h-2.5 w-2.5">
				<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75"></span>
				<span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-coral"></span>
			</span>
			<span class="text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">Live Countdown</span>
		</div>

		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-5xl md:text-6xl font-bold text-plum mb-3 animate-slide-up stagger-1 leading-tight">
			นับถอยหลัง<span class="text-gradient">ซีรีส์ GL</span>
		</h1>
		<p class="text-base sm:text-lg text-plum-light max-w-2xl leading-relaxed animate-slide-up stagger-2">
			ติดตามทุกตอนที่กำลังจะฉาย — ซีรีส์ที่กำลังฉายและที่ยังไม่ฉาย ภายใน 7 วันข้างหน้า
		</p>

		<div class="mt-5 animate-slide-up stagger-3">
			<span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card text-plum-light text-xs sm:text-sm">
				<svg class="w-4 h-4 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
				กำลังติดตาม
				<span class="font-bold text-plum tabular-nums">{activeCountdowns.length}</span>
				ตอนที่จะฉาย · ภายใน 7 วัน
			</span>
		</div>
	</div>
</section>

<!-- Countdown grid -->
<section class="relative pb-12 sm:pb-16 -mx-4 px-4">
	<div class="max-w-6xl mx-auto">
		{#if activeCountdowns.length === 0}
			{@render emptyState()}
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				{#each activeCountdowns as c, i (c.id)}
					<a
						href="/series/{c.seriesId}"
						class="group block animate-slide-up"
						style="animation-delay: {Math.min(i, 8) * 60}ms; animation-fill-mode: both;"
					>
						<article class="glass-card-strong rounded-[1.75rem] p-5 sm:p-6 relative overflow-hidden hover:-translate-y-1.5 transition-all duration-500 hover:shadow-2xl hover:shadow-coral/20 h-full flex flex-col">
							<!-- playful sparkle badge: magic countdown -->
							<div class="absolute top-3.5 right-3.5 z-10 animate-float" style="animation-delay:-2s;">
								<div class="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-lavender shadow-lg shadow-lavender/50 flex items-center justify-center">
									<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l1.4 6.6L20 10l-6.6 1.4L12 18l-1.4-6.6L4 10l6.6-1.4z"/></svg>
								</div>
								<span class="absolute -bottom-1 -left-2 w-2 h-2 rounded-full bg-mint shadow-[0_0_5px_rgba(110,231,183,0.95)]"></span>
							</div>
							<!-- decorative blobs -->
							<div class="absolute -top-10 -right-10 w-32 h-32 bg-coral/15 rounded-full blur-2xl pointer-events-none"></div>
							<div class="absolute -bottom-10 -left-10 w-32 h-32 bg-lavender/15 rounded-full blur-2xl pointer-events-none"></div>

							<!-- header: poster + meta -->
							<div class="relative flex items-center gap-3 mb-3 pr-12">
								<div class="flex-shrink-0 w-11 h-14 sm:w-12 sm:h-16 rounded-xl overflow-hidden bg-lavender/10 ring-1 ring-white/60">
									<img
										src={c.poster}
										alt={c.title}
										class="w-full h-full object-cover"
										loading="lazy"
										decoding="async"
									/>
								</div>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-1.5 mb-0.5">
										<h3 class="font-semibold text-plum text-sm sm:text-base truncate group-hover:text-coral-dark transition-colors">{c.title}</h3>
										{#if c.isUncut}
											<span class="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-coral/10 text-coral-dark text-[9px] font-bold border border-coral/20">Uncut</span>
										{/if}
									</div>
									<p class="text-xs text-plum-light truncate">{c.episode} · {c.platform}</p>
								</div>
							</div>

							<!-- orbital days — วงแหวนโคจรรอบจำนวนวัน (สัญลักษณ์ของ GL-Orbit) -->
							<div class="relative flex-1 flex items-center justify-center py-2">
								{@render orbitDays(c.days)}
							</div>

							<!-- HH:MM:SS tiles -->
							<div class="relative flex items-start justify-center gap-1.5 sm:gap-2 font-[family-name:var(--font-display)]">
								{@render timeUnit(pad(c.hours), 'ชม.')}
								<span aria-hidden="true" class="pt-2 sm:pt-2.5 text-2xl sm:text-3xl font-bold text-coral/60 animate-pulse">:</span>
								{@render timeUnit(pad(c.minutes), 'นาที')}
								<span aria-hidden="true" class="pt-2 sm:pt-2.5 text-2xl sm:text-3xl font-bold text-coral/60 animate-pulse" style="animation-delay: 0.5s;">:</span>
								{@render timeUnit(pad(c.seconds), 'วิ')}
							</div>

							<!-- air date -->
							<div class="relative mt-5 pt-4 border-t border-lavender/20 text-center">
								<p class="text-xs text-plum-light">{c.airLabel}</p>
							</div>
						</article>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

{#snippet orbitDays(days: number)}
	<div class="relative w-32 h-32 sm:w-36 sm:h-36">
		<!-- dashed orbital ring -->
		<div class="absolute inset-0 rounded-full border-2 border-dashed border-lavender/35"></div>
		<!-- soft gradient halo inside -->
		<div class="absolute inset-3 rounded-full bg-gradient-to-br from-coral/8 to-lavender/8"></div>
		<!-- orbiting satellite dot (traces the ring) -->
		<div class="absolute inset-0 animate-[spin_9s_linear_infinite]">
			<span class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-coral shadow-[0_0_12px_rgba(255,107,157,0.85)]"></span>
		</div>
		<!-- center: days + label -->
		<div class="absolute inset-0 flex flex-col items-center justify-center">
			<span class="font-[family-name:var(--font-display)] text-5xl sm:text-6xl font-extrabold text-gradient tabular-nums leading-none">{days}</span>
			<span class="font-[family-name:var(--font-display)] text-sm font-bold text-plum-light mt-1">วัน</span>
		</div>
	</div>
{/snippet}

{#snippet timeUnit(value: string, label: string)}
	<div class="flex flex-col items-center gap-1">
		<span class="min-w-[2.75rem] sm:min-w-[3.25rem] text-center rounded-xl bg-gradient-to-br from-plum to-plum-light text-cream px-2 py-1.5 text-2xl sm:text-3xl font-bold tabular-nums shadow-lg shadow-plum/20 ring-1 ring-white/10">
			{value}
		</span>
		<span class="text-[10px] font-semibold text-plum-light/80">{label}</span>
	</div>
{/snippet}

{#snippet emptyState()}
	<div class="text-center py-20">
		<div class="relative w-24 h-24 mx-auto mb-6">
			<div class="absolute inset-0 rounded-full border-2 border-dashed border-lavender/30"></div>
			<div class="absolute inset-0 animate-[spin_14s_linear_infinite]">
				<span class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-lavender shadow-[0_0_12px_rgba(196,181,253,0.7)]"></span>
			</div>
			<div class="absolute inset-0 flex items-center justify-center">
				<svg class="w-9 h-9 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
			</div>
		</div>
		<h3 class="font-semibold text-plum mb-1">ยังไม่มีตอนที่จะฉายในเร็วๆ นี้</h3>
		<p class="text-sm text-plum-light">ตอนใหม่จะปรากฏที่นี่เมื่อมีกำหนดออกอากาศภายใน 7 วัน</p>
	</div>
{/snippet}
