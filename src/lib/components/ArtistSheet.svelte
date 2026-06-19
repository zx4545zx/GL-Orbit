<script lang="ts">

	let { artistId, onclose }: { artistId: string; onclose: () => void } = $props();

	type ArtistData = {
		artist: {
			id: string;
			nickname: string;
			fullName: string;
			profileImageUrl: string;
		};
		socials: Array<{
			platform: string;
			url: string;
			iconUrl: string | null;
		}>;
		series: Array<{
			id: string;
			titleEn: string;
			titleTh: string;
			posterUrl: string;
			roleName: string;
		}>;
	};

	let data = $state<ArtistData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		if (!artistId) return;

		loading = true;
		error = null;

		fetch(`/api/artists/${encodeURIComponent(artistId)}`)
			.then(async (res) => {
				if (!res.ok) {
					if (res.status === 404) throw new Error('ไม่พบข้อมูลศิลปิน');
					throw new Error('โหลดข้อมูลไม่สำเร็จ');
				}
				return res.json() as Promise<ArtistData>;
			})
			.then((result) => {
				data = result;
				loading = false;
			})
			.catch((err: Error) => {
				error = err.message;
				loading = false;
			});
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
		}
	}

	function handleRetry() {
		loading = true;
		error = null;
		data = null;
		const id = artistId;
		artistId = '';
		requestAnimationFrame(() => {
			artistId = id;
		});
	}

	function socialIcon(platform: string): string {
		const p = platform.toLowerCase();
		if (p.includes('instagram')) return 'instagram';
		if (p.includes('twitter') || p.includes('x')) return 'x';
		if (p.includes('youtube') || p.includes('yt')) return 'youtube';
		if (p.includes('tiktok')) return 'tiktok';
		if (p.includes('facebook')) return 'facebook';
		if (p.includes('line')) return 'line';
		return 'link';
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
	role="dialog"
	aria-modal="true"
	aria-label="รายละเอียดศิลปิน"
>
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="fixed inset-0 bg-plum/30 backdrop-blur-sm" onclick={onclose}></div>

	<!-- Sheet / Modal panel -->
	{#if loading}
		<div
			class="relative w-full md:max-w-lg md:mx-auto md:my-8 rounded-t-3xl md:rounded-3xl bg-white shadow-2xl max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
			>
			<!-- Skeleton loading state -->
			<div class="p-6 space-y-6">
				<div class="flex justify-center">
					<div class="w-20 h-20 rounded-full bg-lavender/20 animate-pulse"></div>
				</div>
				<div class="space-y-2 text-center">
					<div class="h-5 w-32 mx-auto bg-lavender/10 rounded animate-pulse"></div>
					<div class="h-4 w-48 mx-auto bg-lavender/10 rounded animate-pulse"></div>
				</div>
				<div class="space-y-3">
					<div class="h-10 w-full bg-lavender/10 rounded-xl animate-pulse"></div>
					<div class="h-10 w-full bg-lavender/10 rounded-xl animate-pulse"></div>
				</div>
				<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
					{#each Array(3) as _}
						<div class="aspect-[2/3] bg-lavender/10 rounded-xl animate-pulse"></div>
					{/each}
				</div>
			</div>
		</div>
	{:else if error}
		<div
			class="relative w-full md:max-w-lg md:mx-auto md:my-8 rounded-t-3xl md:rounded-3xl bg-white shadow-2xl max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
			>
			<!-- Error state -->
			<div class="p-6 text-center space-y-4">
				<div class="w-16 h-16 mx-auto rounded-full bg-coral/10 flex items-center justify-center">
					<svg class="w-8 h-8 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<p class="text-plum font-medium">{error}</p>
				<button
					onclick={handleRetry}
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all touch-target"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					ลองอีกครั้ง
				</button>
			</div>
		</div>
	{:else if data}
		<div
			class="relative w-full md:max-w-lg md:mx-auto md:my-8 rounded-t-3xl md:rounded-3xl bg-white shadow-2xl max-h-[80vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
			>
			<!-- Close button -->
			<button
				onclick={onclose}
				class="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white transition-colors touch-target"
				aria-label="ปิด"
			>
				<svg class="w-5 h-5 text-plum" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<div class="p-6 space-y-6">
				<!-- Artist Profile -->
				<div class="flex flex-col items-center text-center">
					<img
						src={data.artist.profileImageUrl}
						alt={data.artist.nickname}
						width={80}
						height={80}
						loading="eager"
						decoding="async"
						class="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg shadow-lavender/20"
					/>
					<h2 class="mt-3 font-[family-name:var(--font-display)] text-xl font-bold text-plum">
						{data.artist.nickname}
					</h2>
					{#if data.artist.fullName}
						<p class="text-sm text-plum-light">{data.artist.fullName}</p>
					{/if}
				</div>

				<!-- Social Links -->
				{#if data.socials.length > 0}
					<section>
						<h3 class="text-xs font-semibold text-plum-light uppercase tracking-wider mb-3">โซเชียลมีเดีย</h3>
						<div class="space-y-2">
							{#each data.socials as social}
								<a
									href={social.url}
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center gap-3 px-4 py-3 rounded-xl glass-card hover:bg-white transition-colors touch-target"
								>
									{#if social.iconUrl}
										<img src={social.iconUrl} alt={social.platform} width={24} height={24} loading="lazy" decoding="async" class="w-6 h-6 rounded-full object-cover flex-shrink-0" />
									{:else}
										<div class="w-6 h-6 rounded-full bg-gradient-to-br from-coral/20 to-lavender/20 flex items-center justify-center flex-shrink-0">
											<svg class="w-3.5 h-3.5 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
											</svg>
										</div>
									{/if}
									<span class="text-sm font-medium text-plum flex-1 truncate">{social.platform}</span>
									<svg class="w-4 h-4 text-plum-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
									</svg>
								</a>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Series Grid -->
				<section>
					<h3 class="text-xs font-semibold text-plum-light uppercase tracking-wider mb-3">ผลงาน</h3>
					{#if data.series.length > 0}
						<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
							{#each data.series as s}
								<a
									href="/series/{s.id}"
									class="glass-card rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-coral"
								>
									<img
										src={s.posterUrl}
										alt={s.titleEn}
										width={300}
										height={450}
										class="w-full aspect-[2/3] object-cover"
										loading="lazy"
										decoding="async"
									/>
									<div class="p-2 space-y-0.5">
										<p class="text-xs font-semibold text-plum truncate">{s.titleEn}</p>
										{#if s.roleName}
											<p class="text-[10px] text-plum-light truncate">{s.roleName}</p>
										{/if}
									</div>
								</a>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-plum-light text-center py-4">ยังไม่มีผลงานอื่น</p>
					{/if}
				</section>
			</div>
		</div>
	{/if}
</div>
