<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props();

	// ตอนเปิด keyboard บน iOS Safari: layout viewport (innerHeight) ไม่ย่อ แต่
	// visualViewport.height ย่อลงเหลือพื้นที่มองเห็นจริงเหนือ keyboard → ผลต่างคือ
	// ความสูง keyboard เอาค่านี้ไปยก `bottom` ของ shell ขึ้น input ที่ท้าย shell จะ
	// โผล่เหนือ keyboard อยู่แล้ว → iOS ไม่ต้อง scroll เพื่อ reveal = ไม่ drag หน้า
	// ไม่สลับด้าน ฟังแค่ resize (ไม่ฟัง scroll) เพื่อกัน feedback loop
	// บน Android (หลัง deploy) interactive-widget=resizes-content ย่อ innerHeight ไป
	// เท่า vv.height อยู่แล้ว → kb = 0 → no-op ไม่กระทบ
	let kb = $state(0);

	function sync() {
		const vv = window.visualViewport;
		if (!vv) return;
		kb = Math.max(0, window.innerHeight - vv.height);
	}

	onMount(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		sync();
		vv.addEventListener('resize', sync);
		return () => vv.removeEventListener('resize', sync);
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
