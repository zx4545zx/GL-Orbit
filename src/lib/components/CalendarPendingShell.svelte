<script lang="ts">
</script>

<section class="py-6 sm:py-8 max-w-6xl mx-auto" aria-busy="true" aria-live="polite">
	<div class="text-center mb-6 sm:mb-8">
		<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral-dark text-xs font-semibold mb-3">
			<span class="w-2 h-2 rounded-full bg-coral animate-pulse"></span>
			กำลังโหลดตารางฉาย
		</div>
		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			ตารางฉาย<span class="text-coral">ประจำเดือน</span>
		</h1>
		<p class="text-sm sm:text-base text-plum-light">กำลังโหลดข้อมูลล่าสุด...</p>
	</div>

	<!-- View Toggle Placeholder -->
	<div class="flex justify-center mb-6 sm:mb-8">
		<div class="glass-card rounded-2xl p-1.5 flex gap-1">
			{#each Array(3) as _, i}
				<div class="h-9 rounded-xl bg-lavender/15 animate-pulse {i === 0 ? 'w-20' : 'w-24'}"></div>
			{/each}
		</div>
	</div>

	<!-- Calendar Skeleton -->
	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
		<!-- Month nav placeholder -->
		<div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-lavender/20">
			<div class="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-lavender/10 animate-pulse"></div>
			<div class="flex items-center gap-2 sm:gap-3">
				<div class="h-6 w-40 bg-lavender/10 rounded animate-pulse"></div>
				<div class="h-5 w-12 bg-lavender/10 rounded animate-pulse"></div>
			</div>
			<div class="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-lavender/10 animate-pulse"></div>
		</div>

		<!-- Day-of-week headers -->
		<div class="grid grid-cols-7 gap-0.5 sm:gap-1 p-2 sm:p-4">
			{#each Array(7) as _}
				<div class="h-8 rounded bg-lavender/10 animate-pulse"></div>
			{/each}
		</div>

		<!-- Calendar grid cells (6 rows × 7 cols = 42 cells) -->
		<div class="grid grid-cols-7 gap-0.5 sm:gap-1 p-2 sm:p-4 pt-0">
			{#each Array(42) as _}
				<div class="aspect-square rounded-lg sm:rounded-xl bg-lavender/5 animate-pulse"></div>
			{/each}
		</div>
	</div>

	<!-- Legend placeholder -->
	<div class="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
		<div class="h-3 w-16 bg-lavender/10 rounded animate-pulse"></div>
		{#each Array(4) as _}
			<div class="flex items-center gap-1">
				<div class="w-3 h-3 rounded bg-lavender/10 animate-pulse"></div>
				<div class="h-3 w-12 bg-lavender/10 rounded animate-pulse"></div>
			</div>
		{/each}
	</div>

	<!-- Info card placeholder -->
	<div class="mt-6 sm:mt-10 glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6">
		<div class="h-4 w-3/4 bg-lavender/10 rounded animate-pulse mb-2"></div>
		<div class="h-3 w-full bg-lavender/5 rounded animate-pulse"></div>
	</div>
</section>
