<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';
	import { SHAPE_NAMES, setShape, shapeState, type ShapeName } from '$lib/shape.svelte.js';

	let { className = '', compact = false }: { className?: string; compact?: boolean } = $props();
	let open = $state(false);
	let root = $state<HTMLDivElement | null>(null);
	let trigger = $state<HTMLButtonElement | null>(null);
	let options = $state<(HTMLButtonElement | null)[]>([]);
	let status = $state('');
	let activeIndex = $state(0);
	const labels: Record<ShapeName, () => string> = { sharp: m.shape_sharp, rounded: m.shape_rounded };

	$effect(() => { if (open) queueMicrotask(() => options[activeIndex]?.focus()); });

	function toggle() {
		open = !open;
		if (open) activeIndex = SHAPE_NAMES.indexOf(shapeState.shape);
	}

	function close() {
		open = false;
		trigger?.focus();
	}

	function dismiss() {
		open = false;
	}

	function handleWindowClick(event: MouseEvent) {
		if (open && root && event.target instanceof Node && !root.contains(event.target)) dismiss();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') dismiss();
	}

	function select(shape: ShapeName) {
		setShape(shape);
		status = m.shape_selected({ shape: labels[shape]() });
		close();
	}

	function keydown(event: KeyboardEvent) {
		if (event.key === 'Escape') { event.preventDefault(); close(); return; }
		if (event.key === 'Tab') { open = false; return; }
		const current = activeIndex;
		let next = current;
		if (event.key === 'ArrowDown') next = (current + 1) % SHAPE_NAMES.length;
		if (event.key === 'ArrowUp') next = (current + SHAPE_NAMES.length - 1) % SHAPE_NAMES.length;
		if (event.key === 'Home') next = 0;
		if (event.key === 'End') next = SHAPE_NAMES.length - 1;
		if (next !== current || ['Home', 'End'].includes(event.key)) {
			event.preventDefault();
			activeIndex = next;
			options[next]?.focus();
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div bind:this={root} class="relative {className}">
	<button bind:this={trigger} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={m.shape_trigger()} title={compact ? m.shape_trigger() : undefined} onclick={toggle} class="orbit-control touch-target flex min-h-11 items-center gap-2 px-3">
		<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx={shapeState.shape === 'rounded' ? 2 : 0} /><rect x="13" y="13" width="7" height="7" rx={shapeState.shape === 'rounded' ? 2 : 0} /></svg>
		{#if !compact}<span class="hidden sm:inline">{m.shape_trigger()}</span>{/if}
	</button>
	{#if open}
		<div role="menu" tabindex="-1" class="orbit-menu absolute right-0 top-full z-50 mt-2 w-44">
			{#each SHAPE_NAMES as name, index}
				<button bind:this={options[index]} type="button" role="menuitemradio" aria-checked={shapeState.shape === name} tabindex={activeIndex === index ? 0 : -1} onclick={() => select(name)} onkeydown={keydown} class="orbit-menu-item">
					<svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx={name === 'rounded' ? 4 : 0} /></svg>
					<span>{labels[name]()}</span>{#if shapeState.shape === name}<span class="ml-auto font-bold" aria-label={m.shape_current()}>✓</span>{/if}
				</button>
			{/each}
		</div>
	{/if}
	<span class="sr-only" role="status" aria-live="polite">{status}</span>
</div>
