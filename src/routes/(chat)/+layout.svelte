<script lang="ts">
	let { children } = $props();
</script>

<!-- Flex column เต็ม viewport ด้วย CSS ล้วน (100dvh ลดลงตอนมี keyboard ในเบราว์เซอร์ที่รองรับ
     interactive-widget=resizes-content) — header/shrink-0 + list/flex-1 scroll + composer/shrink-0
     overflow-hidden ที่ shell → มีแค่ list ข้อความตัวเดียวที่เลื่อนได้ -->
<div
	class="flex h-[calc(100dvh-var(--pwa-safe-top))] w-full flex-col overflow-hidden bg-[#f7f7f8] text-plum"
>
	{@render children()}
</div>
