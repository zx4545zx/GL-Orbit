<script lang="ts">
	let {
		value = $bindable(''),
		placeholder,
		ariaLabel,
		oninput,
		onclear
	}: {
		value?: string;
		placeholder: string;
		ariaLabel: string;
		oninput: () => void;
		onclear: () => void;
	} = $props();
</script>

<div class="flex flex-col gap-3 max-w-xl mx-auto">
	<div class="relative w-full">
		<div class="orbit-surface flex items-center border-x-4 border-x-plum px-4 py-3 gap-3 transition-all duration-200">
			<svg class="w-5 h-5 text-plum-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
			</svg>
			<input
				type="text"
				bind:value
				{placeholder}
				aria-label={ariaLabel}
				oninput={oninput}
				class="flex-1 bg-transparent text-plum placeholder:text-plum-light/50 focus:outline-none text-sm sm:text-base"
			/>
			{#if value}
				<button
					type="button"
					onclick={onclear}
					class="p-1 rounded-md hover:bg-lavender/30 transition-colors flex-shrink-0"
					aria-label="ล้างการค้นหา"
				>
					<svg class="w-4 h-4 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
</div>
