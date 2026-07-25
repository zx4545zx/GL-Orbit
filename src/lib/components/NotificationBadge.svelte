<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	let { count = 0 }: { count: number } = $props();
</script>

{#if count > 0}
	<span
		class="orbit-badge absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-coral text-white text-[10px] leading-none px-1 shadow-[var(--orbit-shadow-interactive)] animate-fade-in"
		aria-label={m.notifications_badge_aria({ count })}
	>
		{count > 99 ? '99+' : count}
	</span>
{/if}
