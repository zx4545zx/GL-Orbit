<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		// iOS PWA: กัน document/body rubber-band จนดึงเห็น background ด้านหลังแอป
		// ล็อกเฉพาะ route chat เท่านั้น — scroll จริงยังอยู่ที่ message container ภายใน ChatApp
		const html = document.documentElement;
		const body = document.body;
		const previous = {
			htmlOverflow: html.style.overflow,
			htmlOverscrollBehavior: html.style.overscrollBehavior,
			htmlHeight: html.style.height,
			bodyPaddingTop: body.style.paddingTop,
			bodyOverflow: body.style.overflow,
			bodyOverscrollBehavior: body.style.overscrollBehavior
		};

		html.style.overflow = 'hidden';
		html.style.overscrollBehavior = 'none';
		html.style.height = '100%';
		body.style.paddingTop = '0px';
		body.style.overflow = 'hidden';
		body.style.overscrollBehavior = 'none';

		return () => {
			html.style.overflow = previous.htmlOverflow;
			html.style.overscrollBehavior = previous.htmlOverscrollBehavior;
			html.style.height = previous.htmlHeight;
			body.style.paddingTop = previous.bodyPaddingTop;
			body.style.overflow = previous.bodyOverflow;
			body.style.overscrollBehavior = previous.bodyOverscrollBehavior;
		};
	});
</script>

<!-- Flex column เต็ม viewport ด้วย CSS ล้วน (100dvh ลดลงตอนมี keyboard ในเบราว์เซอร์ที่รองรับ
     interactive-widget=resizes-content) — header/shrink-0 + list/flex-1 scroll + composer/shrink-0
     overflow-hidden ที่ shell → มีแค่ list ข้อความตัวเดียวที่เลื่อนได้ -->
<div
	data-chat-shell
	class="flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f7f7f8] pt-[var(--pwa-safe-top)] text-plum"
>
	{@render children()}
</div>
