<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	interface Field {
		key: string;
		label: string;
		type?: 'text' | 'url';
		placeholder?: string;
		required?: boolean;
	}

	let {
		open = $bindable(),
		title,
		fields,
		submitLabel = 'สร้าง',
		loading = $bindable(false),
		error = $bindable(''),
		onsubmit
	}: {
		open: boolean;
		title: string;
		fields: Field[];
		submitLabel?: string;
		loading: boolean;
		error: string;
		onsubmit: (values: Record<string, string>) => void | Promise<void>;
	} = $props();

	let values = $state<Record<string, string>>({});

	// reset เมื่อเปิด modal
	$effect(() => {
		if (open) {
			values = {};
			error = '';
		}
	});

	function handleClose() {
		if (loading) return;
		open = false;
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onsubmit(values);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!open || loading) return;
		if (e.key === 'Escape') handleClose();
	}

	function portal(node: HTMLElement) {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		document.body.appendChild(node);

		requestAnimationFrame(() => {
			const focusable = node.querySelector<HTMLElement>('[data-modal-panel] input, [data-modal-panel] select, [data-modal-panel] textarea, [data-modal-panel] button:not([disabled]), [data-modal-panel] [tabindex]:not([tabindex="-1"])');
			focusable?.focus();
		});

		return {
			destroy() {
				document.body.style.overflow = previousOverflow;
				node.remove();
			}
		};
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div use:portal class="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
		<!-- backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-plum/35 backdrop-blur-sm"
			transition:fade={{ duration: 150 }}
			onclick={handleClose}
			aria-label="ปิด"
		></button>

		<!-- panel -->
		<div
			data-modal-panel
			transition:scale={{ duration: 180, start: 0.95 }}
			class="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-5 shadow-2xl shadow-plum/15 backdrop-blur-xl sm:p-6 max-h-[calc(100dvh-2rem)] overflow-y-auto"
		>
			<div class="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-white via-cream/70 to-lavender/10"></div>

			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-plum">{title}</h3>
				<button
					type="button"
					onclick={handleClose}
					class="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors touch-target"
					aria-label="ปิด"
				>
					<svg class="w-5 h-5 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				{#each fields as field}
					<div>
						<label for={`field-${field.key}`} class="block text-sm font-medium text-plum mb-1">
							{field.label}{field.required ? ' *' : ''}
						</label>
						<input
							id={`field-${field.key}`}
							type={field.type ?? 'text'}
							placeholder={field.placeholder ?? ''}
							bind:value={values[field.key]}
							required={field.required}
							class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 text-sm sm:text-base"
						/>
					</div>
				{/each}

				{#if error}
					<p class="text-sm text-coral-dark bg-coral/5 px-3 py-2 rounded-lg">{error}</p>
				{/if}

				<div class="flex gap-2 pt-1">
					<button
						type="submit"
						disabled={loading}
						class="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl transition-all text-sm sm:text-base touch-target disabled:opacity-60"
					>
						{loading ? 'กำลังบันทึก...' : submitLabel}
					</button>
					<button
						type="button"
						onclick={handleClose}
						disabled={loading}
						class="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all text-sm sm:text-base touch-target disabled:opacity-60"
					>
						ยกเลิก
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
