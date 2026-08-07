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

	function modal(node: HTMLDialogElement) {
		if (!node.open) {
			node.showModal?.();
			// jsdom has dialog methods but does not implement their state changes.
			if (!node.open) node.setAttribute('open', '');
		}

		requestAnimationFrame(() => {
			node.querySelector<HTMLElement>('[data-cancel-button]')?.focus();
		});

		return {
			destroy() {
				node.close?.();
			}
		};
	}

	function handleNativeCancel(event: Event) {
		event.preventDefault();
		handleCancel();
	}
</script>

{#if open}
	<dialog
		use:modal
		class="confirm-dialog orbit-dialog z-50"
		aria-modal="true"
		aria-labelledby="confirm-title"
		oncancel={handleNativeCancel}
		onclick={(event) => {
			if (event.currentTarget === event.target) handleCancel();
		}}
	>
		<div class="orbit-dialog-panel relative max-w-sm w-full overflow-hidden p-6 animate-slide-up sm:p-8">
			<!-- Icon -->
			<div class="orbit-dialog-icon w-12 h-12 sm:w-14 sm:h-14 {danger ? 'bg-coral/10' : 'bg-lavender/10'} flex items-center justify-center mx-auto mb-4">
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
					data-testid="confirm-cancel"
					onclick={handleCancel}
					class="orbit-dialog-action orbit-control"
				>
					{cancelLabel}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					class="orbit-dialog-action orbit-action {!danger ? 'bg-lavender-dark hover:bg-plum' : ''}"
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</dialog>
{/if}

<style>
	/* Keep the hit area viewport-sized so backdrop clicks work inside constrained layouts. */
	.confirm-dialog {
		position: fixed;
		inset: 0;
		box-sizing: border-box;
		display: flex;
		width: 100vw;
		height: 100dvh;
		max-height: none;
		max-width: none;
		margin: 0;
		align-items: center;
		justify-content: center;
		border: 0;
		background: transparent;
		padding: 1rem;
	}

	.confirm-dialog::backdrop {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		background: rgb(36 21 31 / 0.35);
	}
</style>
