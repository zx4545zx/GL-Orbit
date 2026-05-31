<section aria-busy="true" aria-live="polite">
	<!-- Hero Section Skeleton -->
	<div class="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden -mx-4 px-4 md:-mt-24">
		<div class="absolute inset-0 bg-gradient-mesh pointer-events-none"></div>
		<div class="absolute top-16 sm:top-20 left-4 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-coral/20 rounded-full blur-3xl"></div>
		<div class="absolute bottom-16 sm:bottom-20 right-4 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-lavender/20 rounded-full blur-3xl"></div>

		<div class="relative z-10 text-center max-w-3xl mx-auto px-4 md:pt-24">
			<div class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/60 backdrop-blur-sm border border-lavender/20 mb-6 sm:mb-8">
				<span class="w-2 h-2 bg-coral rounded-full animate-pulse"></span>
				<span class="text-xs sm:text-sm font-medium text-plum-light">กำลังโหลด...</span>
			</div>

			<div class="space-y-3 mb-6 sm:mb-10">
				<div class="h-8 sm:h-12 md:h-16 bg-plum/10 rounded-lg w-3/4 mx-auto animate-pulse"></div>
				<div class="h-8 sm:h-12 md:h-16 bg-coral/10 rounded-lg w-1/2 mx-auto animate-pulse"></div>
			</div>

			<div class="h-4 sm:h-5 bg-plum/8 rounded w-2/3 mx-auto mb-3 animate-pulse"></div>
			<div class="h-4 sm:h-5 bg-plum/8 rounded w-1/2 mx-auto mb-6 sm:mb-10 animate-pulse"></div>

			<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
				<div class="h-12 sm:h-14 w-40 sm:w-48 rounded-2xl bg-gradient-to-r from-coral/40 to-coral-dark/40 animate-pulse mx-auto sm:mx-0"></div>
				<div class="h-12 sm:h-14 w-40 sm:w-48 rounded-2xl bg-white/40 border border-lavender/20 animate-pulse mx-auto sm:mx-0"></div>
			</div>
		</div>
	</div>

	<!-- Featured Series Skeleton -->
	<div class="py-12 sm:py-20 -mx-4 px-4">
		<div class="max-w-6xl mx-auto">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-4">
				<div>
					<div class="h-8 sm:h-10 bg-plum/10 rounded-lg w-48 mb-2 animate-pulse"></div>
					<div class="h-4 bg-plum/8 rounded w-56 animate-pulse"></div>
				</div>
				<div class="h-5 bg-coral/15 rounded w-28 animate-pulse"></div>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
				{#each Array(4) as _}
					<div class="glass-card rounded-2xl sm:rounded-3xl overflow-hidden">
						<div class="relative aspect-[3/4] overflow-hidden">
							<div class="absolute inset-0 bg-lavender/10 animate-pulse"></div>
							<div class="absolute bottom-0 left-0 right-0 p-4 sm:p-5 space-y-2">
								<div class="h-3 w-1/2 bg-white/20 rounded animate-pulse"></div>
								<div class="h-5 w-3/4 bg-white/30 rounded animate-pulse"></div>
								<div class="h-3 w-2/3 bg-white/20 rounded animate-pulse"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Upcoming Schedule Skeleton -->
	<div class="py-12 sm:py-20 -mx-4 px-4 relative">
		<div class="absolute inset-0 bg-gradient-to-b from-lavender/5 to-coral/5 pointer-events-none"></div>

		<div class="relative max-w-6xl mx-auto">
			<div class="text-center mb-8 sm:mb-12">
				<div class="h-8 sm:h-10 bg-plum/10 rounded-lg w-56 mx-auto mb-3 animate-pulse"></div>
				<div class="h-4 bg-plum/8 rounded w-40 mx-auto animate-pulse"></div>
			</div>

			<div class="max-w-2xl mx-auto space-y-3 sm:space-y-4">
				{#each Array(3) as _}
					<div class="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-5">
						<div class="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-lavender/10 animate-pulse"></div>
						<div class="flex-1 min-w-0 space-y-2">
							<div class="h-4 w-3/4 bg-lavender/10 rounded animate-pulse"></div>
							<div class="h-3 w-1/2 bg-lavender/10 rounded animate-pulse"></div>
						</div>
					</div>
				{/each}
			</div>

			<div class="text-center mt-6 sm:mt-8">
				<div class="h-11 w-48 rounded-xl bg-white/40 border border-lavender/20 animate-pulse mx-auto"></div>
			</div>
		</div>
	</div>
</section>
