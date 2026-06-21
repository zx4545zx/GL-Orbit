<script lang="ts">
	import { adminActiveActions, adminToasts } from '$lib/admin/action-feedback.js';
</script>

{#if $adminActiveActions > 0}
	<div class="fixed left-0 right-0 top-0 z-[90] h-1 overflow-hidden bg-coral/10" aria-hidden="true">
		<div class="admin-progress-bar h-full w-1/2 rounded-r-full bg-gradient-to-r from-coral via-lavender to-mint"></div>
	</div>
{/if}

<div class="pointer-events-none fixed inset-x-3 bottom-4 z-[100] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:bottom-auto sm:w-96" aria-live="polite" aria-atomic="true">
	{#each $adminToasts as toast (toast.id)}
		<div class="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-2xl shadow-plum/10 backdrop-blur-xl ring-1 ring-lavender/10">
			<div class="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl {toast.type === 'loading' ? 'bg-lavender/15 text-lavender-dark' : toast.type === 'success' ? 'bg-mint/15 text-emerald-700' : 'bg-coral/15 text-coral-dark'}">
				{#if toast.type === 'loading'}
					<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
				{:else if toast.type === 'success'}
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3" d="M5 13l4 4L19 7" /></svg>
				{:else}
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
				{/if}
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-bold text-plum">{toast.title}</p>
				{#if toast.message}
					<p class="mt-0.5 text-xs leading-relaxed text-plum-light">{toast.message}</p>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.admin-progress-bar {
		animation: admin-progress 1s ease-in-out infinite;
	}

	@keyframes admin-progress {
		0% { transform: translateX(-120%); }
		50% { transform: translateX(80%); }
		100% { transform: translateX(240%); }
	}
</style>
