<script lang="ts">
	let { count = 0 }: { count: number } = $props();
</script>

{#if count > 0}
	<span
		class="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-coral text-white text-[10px] font-bold leading-none px-1 shadow-lg shadow-coral/30 animate-fade-in"
		aria-label="การแจ้งเตือน {count} รายการ"
	>
		{count > 99 ? '99+' : count}
	</span>
{/if}
