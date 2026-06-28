<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props();

	// --- Keyboard (iOS) --------------------------------------------------------
	// ตอนเปิด keyboard: visualViewport.height ย่อลงเหลือพื้นที่เหนือ keyboard ส่วน
	// window.innerHeight ยังคงเท่าเดิม → ผลต่างคือความสูง keyboard เอาไปยก `bottom`
	// ของ shell ขึ้น กล่องพิมพ์ที่ท้าย shell จะโผล่เหนือ keyboard โดยที่ iOS ไม่ต้อง scroll
	// เพื่อ reveal ฟังแค่ resize (ไม่ฟัง scroll) กัน feedback loop
	// บนเบราว์เซอร์ที่ respect interactive-widget=resizes-content: innerHeight จะย่อ
	// ไปเท่า vv.height อยู่แล้ว → kb = 0 → no-op ไม่กระทบ
	let kb = $state(0);

	function sync() {
		const vv = window.visualViewport;
		if (!vv) return;
		kb = Math.max(0, window.innerHeight - vv.height);
	}

	onMount(() => {
		// --- ล็อก document กัน iOS scroll / rubber-band ---------------------------
		// shell เป็น position:fixed — ถ้า body ด้านหลังยืดหยุ่น (rubber-band) ได้ iOS
		// จะดึง (detach) เอา fixed element ออกมาเลื่อนตาม = "หน้าเลื่อน/ลากได้"
		// overflow:hidden + overscroll-behavior:none บน <html>/<body> เอา scroll context
		// ที่อยู่นอก list ข้อความออกไปหมด → fixed shell อยู่นิ่งเหนือ keyboard ตลอดเวลา
		const html = document.documentElement;
		const body = document.body;
		const prev = {
			htmlOverflow: html.style.overflow,
			htmlOverscroll: html.style.overscrollBehavior,
			bodyOverflow: body.style.overflow,
			bodyOverscroll: body.style.overscrollBehavior
		};
		html.style.overflow = 'hidden';
		html.style.overscrollBehavior = 'none';
		body.style.overflow = 'hidden';
		body.style.overscrollBehavior = 'none';

		const vv = window.visualViewport;
		if (vv) {
			sync();
			vv.addEventListener('resize', sync);
		}

		return () => {
			html.style.overflow = prev.htmlOverflow;
			html.style.overscrollBehavior = prev.htmlOverscroll;
			body.style.overflow = prev.bodyOverflow;
			body.style.overscrollBehavior = prev.bodyOverscroll;
			vv?.removeEventListener('resize', sync);
		};
	});
</script>

<!-- เหมือน shell เดิม (fixed top/bottom) ต่างแค่ยก bottom ขึ้นตามความสูง keyboard
     ตอนเปิด input — ใช้ inline style ชนะ class bottom-0 -->
<div
	class="fixed inset-x-0 bottom-0 top-[var(--pwa-safe-top)] overflow-hidden bg-[#f7f7f8] text-plum"
	style:bottom="{kb}px"
>
	{@render children()}
</div>
