<script lang="ts">
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let showSticky = $state(false);
	let titleRef: HTMLDivElement;

	$effect(() => {
		if (!titleRef) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				showSticky = !entry.isIntersecting;
			},
			{ threshold: 0, rootMargin: '0px 0px -1px 0px' }
		);
		observer.observe(titleRef);
		return () => observer.disconnect();
	});

	const accentGradients = [
		'from-pink-400 to-rose-400',
		'from-violet-400 to-purple-400',
		'from-emerald-400 to-teal-400',
		'from-blue-400 to-indigo-400',
		'from-amber-400 to-orange-400',
		'from-cyan-400 to-blue-400',
		'from-lime-400 to-green-400',
		'from-fuchsia-400 to-pink-400'
	];

	function getAccent(title: string) {
		let hash = 0;
		for (let i = 0; i < title.length; i++) {
			hash = title.charCodeAt(i) + ((hash << 5) - hash);
		}
		const index = Math.abs(hash) % accentGradients.length;
		return accentGradients[index];
	}

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: ' upcoming', class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }
	};

	let filterStatus = $state<'ALL' | 'ONGOING' | 'UPCOMING' | 'ENDED'>('ALL');
	let searchQuery = $state('');

	const allSeries = $derived(data.series);

	const filteredSeries = $derived(() => {
		let result = allSeries;

		if (filterStatus !== 'ALL') {
			result = result.filter((s) => s.status === filterStatus);
		}

		const q = searchQuery.trim().toLowerCase();
		if (q) {
			result = result.filter(
				(s) =>
					s.title.toLowerCase().includes(q) ||
					s.subtitle.toLowerCase().includes(q) ||
					s.studio.toLowerCase().includes(q)
			);
		}

		return result;
	});

	function clearSearch() {
		searchQuery = '';
	}
</script>

{#snippet searchFilter()}
	<div class="flex flex-col gap-3 max-w-xl mx-auto">
		<!-- Search Input -->
		<div class="relative w-full">
			<div class="glass-card-strong rounded-2xl flex items-center px-4 py-3 gap-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-coral/30 focus-within:border-coral/30">
				<svg class="w-5 h-5 text-plum-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="ค้นหาซีรีส์, สตูดิโอ..."
					class="flex-1 bg-transparent text-plum placeholder:text-plum-light/50 focus:outline-none text-sm sm:text-base"
				/>
				{#if searchQuery}
					<button
						onclick={clearSearch}
						class="p-1 rounded-lg hover:bg-lavender/20 transition-colors flex-shrink-0"
						aria-label="ล้างการค้นหา"
					>
						<svg class="w-4 h-4 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<!-- Status Filter -->
		<div class="flex justify-center">
			<div class="glass-card rounded-2xl p-1.5 flex gap-1 overflow-x-auto">
				{#each [{ key: 'ALL', label: 'ทั้งหมด' }, { key: 'ONGOING', label: 'กำลังฉาย' }, { key: 'UPCOMING', label: ' upcoming' }, { key: 'ENDED', label: 'จบแล้ว' }] as filter}
					<button
						onclick={() => filterStatus = filter.key as typeof filterStatus}
						class="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 touch-target whitespace-nowrap {filterStatus === filter.key ? 'bg-gradient-to-r from-coral to-coral-dark text-white shadow-lg shadow-coral/25' : 'text-plum-light hover:bg-white/60'}"
					>
						{filter.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

<!-- Floating Sticky Search (appears on scroll) -->
<div
	class="fixed top-0 md:top-20 left-0 right-0 z-30 px-4 sm:px-6 py-3 glass-card border-t-0 border-x-0 shadow-[0_8px_32px_rgba(196,181,253,0.15)] transition-all duration-300 {showSticky ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}"
>
	<div class="max-w-6xl mx-auto">
		{@render searchFilter()}
	</div>
</div>

<div class="py-6 sm:py-8">
	<!-- Title -->
	<div bind:this={titleRef} class="text-center mb-6 sm:mb-8">
		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			ซีรีส์<span class="text-gradient-coral">ทั้งหมด</span>
		</h1>
		<p class="text-sm sm:text-base text-plum-light">รวบรวมซีรีส์ GL จากทุกสตูดิโอทั่วโลก</p>
	</div>

	<!-- Normal Search & Filter -->
	<div class="mb-6 sm:mb-8">
		{@render searchFilter()}
	</div>

	<!-- Result Count -->
	{#if searchQuery}
		<div class="text-center mb-4">
			<p class="text-sm text-plum-light">
				พบ <span class="font-semibold text-plum">{filteredSeries().length}</span> รายการ
				{#if filteredSeries().length !== allSeries.length}
					<span class="text-plum-light/60">จาก {allSeries.length} รายการ</span>
				{/if}
			</p>
		</div>
	{/if}

	<!-- Series Grid -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
		{#each filteredSeries() as s (s.id)}
			<a href="/series/{s.id}" class="group">
				<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/20 transition-all duration-500 hover:-translate-y-2">
					<div class="relative aspect-[3/4] overflow-hidden">
						<img
							src={s.poster}
							alt={s.title}
							class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
							loading="lazy"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/20 to-transparent"></div>
						<div class="absolute top-3 sm:top-4 left-3 sm:left-4">
							<span class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold backdrop-blur-md {statusConfig[s.status].class}">
								{statusConfig[s.status].text}
							</span>
						</div>
						<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
							<p class="text-white/70 text-xs sm:text-sm mb-1">{s.studio}</p>
							<h3 class="text-white font-bold text-lg sm:text-xl mb-1">{s.title}</h3>
							<p class="text-white/80 text-xs sm:text-sm">{s.subtitle}</p>
						</div>
					</div>
				</div>
			</a>
		{/each}
	</div>

	<!-- Empty State -->
	{#if filteredSeries().length === 0}
		<div class="text-center py-16">
			<div class="w-16 h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
			</div>
			<h3 class="font-semibold text-plum mb-1">ไม่พบซีรีส์</h3>
			<p class="text-sm text-plum-light">
				{#if searchQuery}
					ลองค้นหาด้วยคำอื่น หรือ <button onclick={clearSearch} class="text-coral-dark font-medium hover:underline">ล้างการค้นหา</button>
				{:else}
					ไม่พบซีรีส์ในหมวดหมู่นี้
				{/if}
			</p>
		</div>
	{/if}
</div>
