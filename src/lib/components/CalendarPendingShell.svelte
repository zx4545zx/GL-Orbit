<div class="py-6 sm:py-8 max-w-6xl mx-auto" aria-busy="true" aria-live="polite">
	<!-- Title -->
	<div class="text-center mb-6 sm:mb-8">
		<h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
			ตารางฉาย<span class="text-coral">ประจำเดือน</span>
		</h1>
		<p class="text-sm sm:text-base text-plum-light">อัปเดตตารางฉายซีรีส์ GL ล่าสุด</p>
	</div>

	<!-- View Toggle -->
	<div class="mb-6 sm:mb-8">
		<div class="flex justify-center">
			<div class="glass-card rounded-2xl p-1.5 flex gap-1">
				<div class="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark shadow-lg shadow-coral/25 flex items-center gap-1.5 sm:gap-2">
					<div class="w-4 h-4 bg-white/30 rounded"></div>
					<div class="w-10 h-4 bg-white/30 rounded hidden sm:block"></div>
				</div>
				<div class="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 sm:gap-2">
					<div class="w-4 h-4 bg-lavender/20 rounded"></div>
					<div class="w-12 h-4 bg-lavender/20 rounded hidden sm:block"></div>
				</div>
				<div class="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 sm:gap-2">
					<div class="w-4 h-4 bg-lavender/20 rounded"></div>
					<div class="w-10 h-4 bg-lavender/20 rounded hidden sm:block"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Grid View Skeleton -->
	<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden animate-pulse">
		<!-- Header: Month nav -->
		<div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-lavender/20">
			<div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-lavender/10"></div>
			<div class="flex items-center gap-2 sm:gap-3">
				<div class="h-5 sm:h-6 w-32 sm:w-40 bg-lavender/10 rounded"></div>
				<div class="h-5 w-12 sm:w-14 bg-coral/10 rounded-md"></div>
			</div>
			<div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-lavender/10"></div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto">
			<table class="w-full min-w-[800px]">
				<thead>
					<tr class="border-b border-lavender/10">
						<th class="sticky left-0 z-10 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 text-left w-32 sm:w-40 border-r border-lavender/10">
							<div class="h-4 w-12 bg-lavender/10 rounded"></div>
						</th>
						{#each Array(31) as _, i}
							<th class="px-1 sm:px-2 py-2 sm:py-3 text-center min-w-[36px] sm:min-w-[48px]">
								<div class="h-4 w-4 sm:w-5 bg-lavender/10 rounded mx-auto mb-1"></div>
								<div class="h-2 w-3 sm:w-4 bg-lavender/5 rounded mx-auto"></div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each Array(5) as _, rowIndex}
						<tr class="border-b border-lavender/5 {rowIndex % 2 === 0 ? 'bg-white/20' : ''}">
							<td class="sticky left-0 z-10 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-3 border-r border-lavender/10">
								<div class="h-4 w-20 sm:w-24 bg-lavender/10 rounded"></div>
							</td>
							{#each Array(31) as _, dayIndex}
								<td class="px-0.5 sm:px-1 py-1 sm:py-2 text-center">
									{#if (rowIndex + dayIndex) % 7 === 0}
										<div class="rounded-md sm:rounded-lg p-1 sm:p-1.5 bg-lavender/10 border border-lavender/20">
											<div class="h-2 w-6 sm:w-8 bg-lavender/20 rounded mx-auto"></div>
											<div class="h-2 w-4 sm:w-6 bg-lavender/15 rounded mx-auto mt-0.5"></div>
										</div>
									{:else}
										<div class="w-full h-6 sm:h-8"></div>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Platform Legend -->
	<div class="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
		<div class="h-3 w-16 bg-lavender/10 rounded"></div>
		{#each Array(4) as _}
			<div class="flex items-center gap-1">
				<div class="w-3 h-3 rounded bg-lavender/10"></div>
				<div class="h-3 w-12 bg-lavender/10 rounded"></div>
			</div>
		{/each}
	</div>

	<!-- Note Section -->
	<div class="mt-6 sm:mt-10 glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
		<div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-lavender/20 flex items-center justify-center flex-shrink-0">
			<svg class="w-4 h-4 sm:w-5 sm:h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</div>
		<div class="flex-1">
			<div class="h-4 w-20 bg-lavender/10 rounded mb-2"></div>
			<div class="h-3 bg-lavender/8 rounded w-full mb-1"></div>
			<div class="h-3 bg-lavender/8 rounded w-5/6 mb-1"></div>
			<div class="h-3 bg-lavender/8 rounded w-4/6"></div>
		</div>
	</div>
</div>
