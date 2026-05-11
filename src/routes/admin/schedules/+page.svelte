<script lang="ts">
	const schedules = [
		{ id: 1, series: 'Blank The Series', day: 'จันทร์', time: '20:00', platform: 'YouTube', isUncut: true },
		{ id: 2, series: 'The Secret of Us', day: 'พุธ', time: '21:30', platform: 'iQIYI', isUncut: false },
		{ id: 3, series: 'My Marvelous Dream', day: 'ศุกร์', time: '19:00', platform: 'WeTV', isUncut: true },
		{ id: 4, series: '24 Hours', day: 'ศุกร์', time: '22:00', platform: 'GagaOOLala', isUncut: true },
		{ id: 5, series: 'Love Senior', day: 'เสาร์', time: '20:30', platform: 'YouTube', isUncut: false }
	];

	const dayColors: Record<string, string> = {
		'จันทร์': 'bg-coral/10 text-coral-dark',
		'อังคาร': 'bg-orange-100 text-orange-700',
		'พุธ': 'bg-lavender/10 text-lavender-dark',
		'พฤหัสบดี': 'bg-emerald-100 text-emerald-700',
		'ศุกร์': 'bg-teal-100 text-teal-700',
		'เสาร์': 'bg-blue-100 text-blue-700',
		'อาทิตย์': 'bg-rose-100 text-rose-700'
	};
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการตารางฉาย</h1>
			<p class="text-sm sm:text-base text-plum-light">จัดการตารางฉายประจำสัปดาห์ของซีรีส์</p>
		</div>
		<button class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มตารางฉาย</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
		{#each schedules as schedule}
			<div class="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:shadow-lavender/10 transition-all group">
				<div class="flex items-start justify-between mb-3 sm:mb-4">
					<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-coral/20 to-lavender/20 flex items-center justify-center">
						<svg class="w-5 h-5 sm:w-6 sm:h-6 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div class="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
						<button aria-label="แก้ไข" class="p-1.5 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light touch-target">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
						</button>
						<button aria-label="ลบ" class="p-1.5 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
						</button>
					</div>
				</div>

				<h3 class="font-semibold text-plum text-sm sm:text-base mb-2 sm:mb-3">{schedule.series}</h3>

				<div class="space-y-1.5 sm:space-y-2">
					<div class="flex items-center gap-2 text-xs sm:text-sm">
						<span class="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-lavender/20 flex items-center justify-center">
							<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
						</span>
						<span class="px-1.5 sm:px-2 py-0.5 rounded-md {dayColors[schedule.day]} text-[10px] sm:text-xs font-medium">{schedule.day}</span>
						<span class="text-plum font-medium">{schedule.time}</span>
					</div>
					<div class="flex items-center gap-2 text-xs sm:text-sm">
						<span class="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-mint/20 flex items-center justify-center">
							<svg class="w-2.5 h-2.5 sm:w-3 sm:h-3 text-mint-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
						</span>
						<span class="text-plum-light">{schedule.platform}</span>
						{#if schedule.isUncut}
							<span class="px-1.5 sm:px-2 py-0.5 rounded-full bg-coral/10 text-coral-dark text-[10px] sm:text-xs font-medium">Uncut</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
