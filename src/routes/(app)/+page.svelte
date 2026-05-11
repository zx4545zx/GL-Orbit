<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const featuredSeries = $derived(data.featuredSeries);
	const upcomingSchedule = $derived(data.upcomingSchedule);

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: ' upcoming', class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }
	};
</script>

<!-- Hero Section -->
<section class="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden -mx-4 px-4">
	<!-- Background decorations -->
	<div class="absolute inset-0 bg-gradient-mesh pointer-events-none"></div>
	<div class="absolute top-16 sm:top-20 left-4 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-coral/20 rounded-full blur-3xl animate-float"></div>
	<div class="absolute bottom-16 sm:bottom-20 right-4 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-lavender/20 rounded-full blur-3xl animate-float-delayed"></div>
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-mint/10 rounded-full blur-3xl"></div>

	<!-- Orbiting elements -->
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px]">
		<div class="absolute w-3 h-3 sm:w-4 sm:h-4 bg-coral rounded-full animate-orbit opacity-60"></div>
		<div class="absolute w-2 h-2 sm:w-3 sm:h-3 bg-lavender rounded-full animate-orbit opacity-40" style="animation-delay: -7s; animation-duration: 15s;"></div>
		<div class="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-mint rounded-full animate-orbit opacity-50" style="animation-delay: -13s; animation-duration: 25s;"></div>
	</div>

	<div class="relative z-10 text-center max-w-3xl mx-auto px-4">
		<div class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/60 backdrop-blur-sm border border-lavender/20 mb-6 sm:mb-8 animate-slide-up">
			<span class="w-2 h-2 bg-coral rounded-full animate-pulse"></span>
			<span class="text-xs sm:text-sm font-medium text-plum-light">ยินดีต้อนรับสู่จักรวาล GL</span>
		</div>

		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-plum mb-4 sm:mb-6 animate-slide-up stagger-1 leading-tight">
			ค้นพบซีรีส์
			<span class="text-gradient">GL</span>
			<br class="hidden sm:block" />
			ที่คุณรัก
		</h1>

		<p class="text-base sm:text-lg md:text-xl text-plum-light max-w-xl mx-auto mb-6 sm:mb-10 leading-relaxed animate-slide-up stagger-2 px-2">
			ติดตามตารางฉาย ข้อมูลซีรีส์ และลิงก์รับชม<br class="hidden md:block" />
			ที่อัปเดตแบบเรียลไทม์ รองรับทุก Timezone
		</p>

		<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-slide-up stagger-3 px-4 sm:px-0">
			<a
				href="/calendar"
				class="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold text-base sm:text-lg shadow-xl shadow-coral/25 hover:shadow-2xl hover:shadow-coral/30 hover:scale-105 transition-all duration-300 animate-pulse-glow touch-target flex items-center justify-center"
			>
				ดูตารางฉาย
			</a>
			<a
				href="/series"
				class="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl glass-card-strong text-plum font-semibold text-base sm:text-lg hover:bg-white/90 hover:scale-105 transition-all duration-300 touch-target flex items-center justify-center"
			>
				สำรวจซีรีส์
			</a>
		</div>
	</div>
</section>

<!-- Featured Series -->
<section class="py-12 sm:py-20 -mx-4 px-4">
	<div class="max-w-6xl mx-auto">
		<div class="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-4">
			<div>
				<h2 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold text-plum mb-2">
					ซีรีส์<span class="text-gradient-coral">แนะนำ</span>
				</h2>
				<p class="text-sm sm:text-base text-plum-light">ซีรีส์ GL ที่น่าติดตามในตอนนี้</p>
			</div>
			<a href="/series" class="flex items-center gap-2 text-coral-dark font-medium hover:gap-3 transition-all text-sm sm:text-base touch-target">
				ดูทั้งหมด
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
			</a>
		</div>

		{#if featuredSeries.length === 0}
			<div class="text-center py-16">
				<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
					</svg>
				</div>
				<h3 class="font-semibold text-plum mb-1">ยังไม่มีซีรีส์</h3>
				<p class="text-sm text-plum-light">ซีรีส์จะปรากฏที่นี่เมื่อมีข้อมูลในระบบ</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
				{#each featuredSeries as series (series.id)}
					<a href="/series/{series.id}" class="group">
						<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/20 transition-all duration-500 hover:-translate-y-2">
							<div class="relative aspect-[3/4] overflow-hidden">
								<img
									src={series.poster}
									alt={series.title}
									class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
									loading="lazy"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/20 to-transparent"></div>
								<div class="absolute top-3 sm:top-4 left-3 sm:left-4">
									<span class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md {statusConfig[series.status].class}">
										{statusConfig[series.status].text}
									</span>
								</div>
								<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
									<p class="text-white/70 text-xs sm:text-sm mb-1">{series.studio}</p>
									<h3 class="text-white font-bold text-lg sm:text-xl mb-1">{series.title}</h3>
									<p class="text-white/80 text-xs sm:text-sm">{series.subtitle}</p>
								</div>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- Upcoming Schedule -->
<section class="py-12 sm:py-20 -mx-4 px-4 relative">
	<div class="absolute inset-0 bg-gradient-to-b from-lavender/5 to-coral/5 pointer-events-none"></div>
	
	<div class="relative max-w-6xl mx-auto">
		<div class="text-center mb-8 sm:mb-12">
			<h2 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl md:text-4xl font-bold text-plum mb-3">
				ตารางฉาย<span class="text-gradient">เร็วๆ นี้</span>
			</h2>
			<p class="text-sm sm:text-base text-plum-light">ไม่พลาดทุกตอนสำคัญ</p>
		</div>

		{#if upcomingSchedule.length === 0}
			<div class="text-center py-16">
				<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
					</svg>
				</div>
				<h3 class="font-semibold text-plum mb-1">ไม่มีตารางฉายเร็วๆ นี้</h3>
				<p class="text-sm text-plum-light">ตารางฉายจะปรากฏเมื่อมีซีรีส์ที่กำหนดฉาย</p>
			</div>
		{:else}
			<div class="max-w-2xl mx-auto space-y-3 sm:space-y-4">
				{#each upcomingSchedule as item, i}
					<div class="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-5 hover:shadow-lg hover:shadow-lavender/10 transition-all duration-300 group">
						<div class="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-coral/20 to-lavender/20 flex flex-col items-center justify-center">
							<span class="text-[10px] sm:text-xs font-bold text-coral-dark">{item.day}</span>
							<span class="text-xs sm:text-sm font-bold text-plum">{item.time}</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<h3 class="font-semibold text-plum text-sm sm:text-base truncate">{item.series}</h3>
								{#if item.isUncut}
									<span class="px-2 py-0.5 rounded-full bg-coral/10 text-coral-dark text-[10px] sm:text-xs font-medium flex-shrink-0">Uncut</span>
								{/if}
							</div>
							<div class="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-plum-light">
								<span>{item.episode}</span>
								<span class="w-1 h-1 rounded-full bg-lavender"></span>
								<span>{item.platform}</span>
							</div>
						</div>
						<div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
							<div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-coral/10 flex items-center justify-center">
								<svg class="w-4 h-4 sm:w-5 sm:h-5 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="text-center mt-6 sm:mt-8">
			<a href="/calendar" class="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl glass-card-strong text-plum font-medium hover:bg-white/90 transition-all text-sm sm:text-base touch-target">
				<svg class="w-4 h-4 sm:w-5 sm:h-5 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
				ดูตารางฉายทั้งหมด
			</a>
		</div>
	</div>
</section>

<!-- Stats / Features Section -->
<section class="py-12 sm:py-20 -mx-4 px-4">
	<div class="max-w-6xl mx-auto">
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
			{#each [
				{ icon: '📺', title: 'ครบทุกซีรีส์', desc: 'รวบรวมซีรีส์ GL จากทุกสตูดิโอทั่วโลก' },
				{ icon: '⏰', title: 'ตารางฉายแม่นยำ', desc: 'รองรับ Timezone ของคุณ พร้อมระบุ Uncut version' },
				{ icon: '🔗', title: 'ลิงก์รับชมครบ', desc: 'รวบรวมลิงก์สตรีมมิ่งจากทุกแพลตฟอร์ม' }
			] as feature}
				<div class="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center hover:shadow-xl hover:shadow-lavender/10 transition-all duration-300 hover:-translate-y-1">
					<div class="text-3xl sm:text-4xl mb-4">{feature.icon}</div>
					<h3 class="font-[family-name:var(--font-display)] font-bold text-plum text-base sm:text-lg mb-2">{feature.title}</h3>
					<p class="text-plum-light text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
