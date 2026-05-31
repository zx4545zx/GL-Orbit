<section class="py-6 sm:py-8 max-w-6xl mx-auto" aria-busy="true" aria-live="polite">
	<div class="text-center mb-6 sm:mb-8">
		<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral-dark text-xs font-semibold mb-3">
			<span class="w-2 h-2 rounded-full bg-coral animate-pulse"></span>
			กำลังเปิดหน้าซีรีส์
		</div>
		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			ซีรีส์<span class="text-coral">ทั้งหมด</span>
		</h1>
		<p class="text-sm sm:text-base text-plum-light">กำลังเตรียมข้อมูลล่าสุดให้คุณ</p>
	</div>

	<div class="flex flex-col gap-3 max-w-xl mx-auto mb-6 sm:mb-8">
		<div class="glass-card-strong rounded-2xl px-4 py-3">
			<div class="h-6 rounded-xl bg-lavender/15 animate-pulse"></div>
		</div>
		<div class="flex justify-center">
			<div class="glass-card rounded-2xl p-1.5 flex gap-1">
				{#each Array(4) as _, index}
					<div class="h-9 rounded-xl bg-lavender/15 animate-pulse {index === 0 ? 'w-20' : 'w-24'}"></div>
				{/each}
			</div>
		</div>
	</div>

	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
		{#each Array(8) as _}
			<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
				<div class="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-lavender/10 via-coral/5 to-mint/10">
					<div class="absolute inset-0 bg-lavender/10 animate-pulse"></div>
					<div class="absolute top-3 sm:top-4 left-3 sm:left-4 h-7 w-20 rounded-full bg-white/35 animate-pulse"></div>
					<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5 space-y-2">
						<div class="h-3 w-1/2 bg-white/25 rounded animate-pulse"></div>
						<div class="h-5 w-3/4 bg-white/35 rounded animate-pulse"></div>
						<div class="h-3 w-2/3 bg-white/25 rounded animate-pulse"></div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
