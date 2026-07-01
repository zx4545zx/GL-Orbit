<script lang="ts">

	import { page } from '$app/state';
	const status = $derived(page.status);
	const message = $derived(page.error?.message || 'เกิดข้อผิดพลาด');

	const errorConfig: Record<number, { title: string; desc: string; icon: string }> = {
		404: {
			title: 'ไม่พบหน้านี้',
			desc: 'หน้าที่คุณกำลังมองหาอาจถูกย้ายหรือลบไปแล้ว',
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
		},
		500: {
			title: 'ระบบขัดข้อง',
			desc: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่ในภายหลัง',
			icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>'
		}
	};

	const config = $derived(errorConfig[status] || {
		title: `ข้อผิดพลาด ${status}`,
		desc: message,
		icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'
	});
</script>

<svelte:head>
	<title>{config.title} | GL-Orbit</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="min-h-[60vh] flex items-center justify-center px-4">
	<div class="text-center max-w-md mx-auto">
		<div class="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl glass-card-strong flex items-center justify-center mx-auto mb-6 sm:mb-8 animate-float">
			<svg class="w-12 h-12 sm:w-16 sm:h-16 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				{@html config.icon}
			</svg>
		</div>

		<h1 class="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl font-bold text-plum mb-2">
			{status}
		</h1>
		<h2 class="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-plum mb-3">
			{config.title}
		</h2>
		<p class="text-sm sm:text-base text-plum-light mb-8 leading-relaxed">
			{config.desc}
		</p>

		<div class="flex flex-col sm:flex-row items-center justify-center gap-3">
			<a
				href="/{page.data.lang}/"
				class="px-6 py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-medium shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 transition-all hover:-translate-y-0.5 touch-target"
			>
				กลับหน้าแรก
			</a>
			<a
				href="/{page.data.lang}/series"
				class="px-6 py-3 rounded-xl glass-card text-plum font-medium hover:bg-white/80 transition-all hover:-translate-y-0.5 touch-target"
			>
				ดูซีรีส์ทั้งหมด
			</a>
		</div>
	</div>
</div>
