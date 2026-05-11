<script lang="ts">
	const seriesList = [
		{ id: 1, title: 'Gap The Series', titleTh: 'ทฤษฎีสีชมพู', status: 'ENDED', studio: 'Idol Factory', episodes: 12 },
		{ id: 2, title: 'Blank The Series', titleTh: 'เติมคำว่ารักลงในช่องว่าง', status: 'ONGOING', studio: '9NAA', episodes: 6 },
		{ id: 3, title: 'The Secret of Us', titleTh: 'ใจซ่อนรัก', status: 'ONGOING', studio: 'GDH', episodes: 8 },
		{ id: 4, title: 'My Marvelous Dream', titleTh: 'ฝันอัศจรรย์ของฉัน', status: 'UPCOMING', studio: 'WeTV', episodes: 0 }
	];

	const statusConfig: Record<string, { text: string; class: string }> = {
		ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' },
		UPCOMING: { text: ' upcoming', class: 'bg-lavender/20 text-lavender-dark' },
		ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }
	};
</script>

<div class="py-6 sm:py-8">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
		<div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">จัดการซีรีส์</h1>
			<p class="text-sm sm:text-base text-plum-light">เพิ่ม แก้ไข และลบข้อมูลซีรีส์</p>
		</div>
		<button class="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm sm:text-base touch-target">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
			<span class="hidden sm:inline">เพิ่มซีรีส์ใหม่</span>
			<span class="sm:hidden">เพิ่ม</span>
		</button>
	</div>

	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-lavender/5">
		<div class="overflow-x-auto -mx-px">
			<table class="w-full min-w-[600px]">
				<thead>
					<tr class="border-b border-lavender/20">
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider">ซีรีส์</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-plum-light uppercase tracking-wider hidden md:table-cell">สตูดิโอ</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-plum-light uppercase tracking-wider">สถานะ</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-semibold text-plum-light uppercase tracking-wider">ตอน</th>
						<th class="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-plum-light uppercase tracking-wider">จัดการ</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-lavender/10">
					{#each seriesList as series}
						<tr class="hover:bg-white/40 transition-colors">
							<td class="px-4 sm:px-6 py-3 sm:py-4">
								<div>
									<div class="font-medium text-plum text-sm sm:text-base">{series.title}</div>
									<div class="text-xs sm:text-sm text-plum-light">{series.titleTh}</div>
								</div>
							</td>
							<td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-plum-light hidden md:table-cell">{series.studio}</td>
							<td class="px-4 sm:px-6 py-3 sm:py-4 text-center">
								<span class="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium {statusConfig[series.status].class}">
									{statusConfig[series.status].text}
								</span>
							</td>
							<td class="px-4 sm:px-6 py-3 sm:py-4 text-center text-sm text-plum">{series.episodes || '-'}</td>
							<td class="px-4 sm:px-6 py-3 sm:py-4 text-right">
								<div class="flex items-center justify-end gap-1 sm:gap-2">
									<button aria-label="แก้ไข" class="p-1.5 sm:p-2 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light hover:text-lavender-dark touch-target">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
									</button>
									<button aria-label="ลบ" class="p-1.5 sm:p-2 rounded-lg hover:bg-coral/10 transition-colors text-plum-light hover:text-coral-dark touch-target">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
