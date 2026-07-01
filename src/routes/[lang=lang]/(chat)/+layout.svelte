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

<!-- 100vh shell ใช้ layout viewport ที่นิ่งกว่า 100dvh/fixed inset บน iOS PWA หลัง keyboard ปิด
     header/shrink-0 + list/flex-1 scroll + composer/absolute overlay
     overflow-hidden ที่ shell → มีแค่ list ข้อความตัวเดียวที่เลื่อนได้ -->
<div
	data-chat-shell
	class="flex h-[100vh] w-full flex-col overflow-hidden bg-[#f7f7f8] pt-[var(--pwa-safe-top)] text-plum"
>
	{@render children()}
</div>
