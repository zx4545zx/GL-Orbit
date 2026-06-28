<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props();

	// แบบ Gemini: เลิกใช้ position:fixed ที่ shell ทั้งหมด เพราะ fixed element บน iOS
	// จะถูก "ดึงออก" (detach) แล้วลอย/ลากตามทุกครั้งที่มี rubber-band หรือตอน keyboard
	// เปิด-ปิด = "หน้าเลื่อน/ลากได้" เปลี่ยนเป็น flex column ที่ไล่ความสูงตาม viewport ตรง ๆ แทน
	//
	// เอาความสูงจาก visualViewport ตรง ๆ เพื่อตาม keyboard ได้ทุก platform โดยไม่ double-count:
	// visualViewport.height = พื้นที่มองเห็นจริง (ลบ keyboard ออกแล้ว) offsetTop = 0 ใน PWA standalone
	// เบราว์เซอร์ที่ respect interactive-widget=resizes-content: visualViewport ปรับให้แล้ว จึงถูก
	// ทุกกรณี เริ่มต้น SSR ใช้ 100dvh - safe-top ไว้ก่อน พอ hydrate แล้วเปลี่ยนเป็นค่า px จริง
	let shellHeight = $state('calc(100dvh - var(--pwa-safe-top))');

	function sync() {
		const vv = window.visualViewport;
		if (!vv) return;
		// ลบ safe-top เพราะ body มี padding-top: var(--pwa-safe-top) ดัน shell ลงใต้ status bar
		shellHeight = `calc(${vv.height}px - var(--pwa-safe-top))`;
	}

	onMount(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		sync();
		// resize = เปิด/ปิด keyboard, scroll = ลากแถบ keyboard / accessory bar บน iOS
		vv.addEventListener('resize', sync);
		vv.addEventListener('scroll', sync);
		return () => {
			vv.removeEventListener('resize', sync);
			vv.removeEventListener('scroll', sync);
		};
	});
</script>

<!-- Flex column เต็ม viewport (ไม่ใช่ fixed) — header/shrink-0 + list/flex-1 scroll +
     composer/shrink-0 พอ keyboard เปิด shellHeight ลดลง กล่องพิมพ์จะลอยขึ้นติด keyboard เอง
     ผ่าน flex overflow-hidden ที่ shell → มีแค่ list ข้อความตัวเดียวที่เลื่อนได้ หน้าเลยลากไม่ได้ -->
<div
	class="flex w-full flex-col overflow-hidden bg-[#f7f7f8] text-plum"
	style="height: {shellHeight};"
>
	{@render children()}
</div>
