<script lang="ts">
	import { onMount } from 'svelte';

	let { children } = $props();

	// iOS Safari ไม่ย่อ layout viewport ตอนเปิด keyboard (มันไม่สน `interactive-widget`
	// = resizes-content) แต่จะ scroll หน้าเพื่อโชว์ input ที่ focus อยู่ ซึ่งพา
	// `position: fixed` element ขึ้นไปด้วย — นั่นคือบั๊ก "ดันทั้งหน้าขึ้น"
	// แก้: ขับ top/height ของ shell ตาม visual viewport แทน layout viewport ให้ shell
	// หดลงไปนั่งเหนือ keyboard และไม่ถูก drag
	// Android (หลัง deploy) ย่อ layout viewport เองอยู่แล้ว สังเกตได้ว่า visualViewport
	// .height ≈ innerHeight และ offsetTop ≈ 0 จึงกลายเป็น no-op ไม่กระทบ
	// null จนกว่าจะ sync ฝั่ง client → SSR/initial paint ใช้ CSS fallback (bottom-0)
	let vvHeight = $state<number | null>(null);
	let vvTop = $state<number | null>(null);

	function sync() {
		const vv = window.visualViewport;
		if (!vv) return;
		vvHeight = vv.height;
		vvTop = vv.offsetTop;
	}

	onMount(() => {
		const vv = window.visualViewport;
		if (!vv) return;
		sync();
		vv.addEventListener('resize', sync);
		vv.addEventListener('scroll', sync);
		return () => {
			vv.removeEventListener('resize', sync);
			vv.removeEventListener('scroll', sync);
		};
	});
</script>

<!-- top/height ตาม visual viewport (ส่วนที่มองเห็นจริง) ตอนเปิด keyboard บน iOS shell จะ
     หดลงเหนือ keyboard แทนที่จะถูก scroll ไปกับหน้า padding-top เคลียร์ status bar
     ของ iOS PWA (ย้ายมาจาก `top` ตอนใช้ vvTop ขับตำแหน่ง) bottom-0 เป็น fallback
     ก่อน client sync -->
<div
	class="fixed bottom-0 left-0 right-0 overflow-hidden bg-[#f7f7f8] text-plum pt-[var(--pwa-safe-top)]"
	style:top={vvTop == null ? '0px' : `${vvTop}px`}
	style:height={vvHeight == null ? null : `${vvHeight}px`}
>
	{@render children()}
</div>
