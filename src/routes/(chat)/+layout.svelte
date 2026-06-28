<script lang="ts">
	let { children } = $props();
</script>

<!-- fixed + inset ยึด viewport จริง ไม่พึ่ง dvh (ที่มี 2 ค่าสลับกันบน Android เมื่อ address bar
     show/hide ทำให้ height เปลี่ยน/ทะลุจอ). top ชดเชย --pwa-safe-top สำหรับ iOS PWA -->
<div class="fixed inset-x-0 bottom-0 top-[var(--pwa-safe-top)] overflow-hidden bg-[#f7f7f8] text-plum">
	{@render children()}
</div>
