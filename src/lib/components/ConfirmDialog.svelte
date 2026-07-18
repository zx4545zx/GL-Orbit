<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	interface Props {
		open: boolean;
		title?: string;
		message?: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		onconfirm?: () => void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		title = m.confirm_default_title(),
		message = m.confirm_default_message(),
		confirmLabel = m.confirm_default_confirm(),
		cancelLabel = m.confirm_default_cancel(),
		danger = true,
		onconfirm,
		oncancel
	}: Props = $props();

	function handleConfirm() {
		open = false;
		onconfirm?.();
	}

	function handleCancel() {
		open = false;
		oncancel?.();
	}

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'Escape') handleCancel();
	}

	function portal(node: HTMLElement) {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		document.body.appendChild(node);

		requestAnimationFrame(() => {
			node.querySelector<HTMLElement>('[data-cancel-button]')?.focus();
		});

		return {
			destroy() {
				document.body.style.overflow = previousOverflow;
				node.remove();
			}
		};
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div use:portal>
	<!-- Backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-50 bg-plum/35 transition-opacity duration-200"
		onclick={handleCancel}
		aria-label={m.common_close()}
	></button>

	<!-- Dialog -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-title"
	>
		<div class="glass-card-strong relative max-w-sm w-full overflow-hidden rounded-2xl p-6 shadow-xl shadow-plum/15 animate-slide-up sm:p-8">
			<!-- Icon -->
			<div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl {danger ? 'bg-coral/10' : 'bg-lavender/10'} flex items-center justify-center mx-auto mb-4">
				{#if danger}
					<svg class="w-6 h-6 sm:w-7 sm:h-7 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				{:else}
					<svg class="w-6 h-6 sm:w-7 sm:h-7 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				{/if}
			</div>

			<h3 id="confirm-title" class="text-lg sm:text-xl font-bold text-plum text-center mb-2">
				{title}
			</h3>
			<p class="text-sm text-plum-light text-center mb-6">
				{message}
			</p>

			<div class="flex gap-3">
				<button
					type="button"
					data-cancel-button
					onclick={handleCancel}
					class="flex-1 px-4 py-2.5 sm:py-3 rounded-lg orbit-control text-plum font-medium transition-all text-sm sm:text-base touch-target"
				>
					{cancelLabel}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					class="flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-white font-semibold transition-all text-sm sm:text-base touch-target {danger ? 'bg-coral shadow-sm shadow-coral/25 hover:bg-coral-dark' : 'bg-lavender-dark shadow-sm shadow-lavender/25 hover:bg-plum'}"
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
	</div>
{/if}
