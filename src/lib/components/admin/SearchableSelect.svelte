<script lang="ts">
	interface Option {
		id: string;
		label: string;
	}

	let {
		value = $bindable(''),
		options,
		placeholder = 'ค้นหา...',
		emptyText = 'ไม่พบรายการ',
		label
	}: {
		value: string;
		options: Option[];
		placeholder?: string;
		emptyText?: string;
		label?: string;
	} = $props();

	let open = $state(false);
	let query = $state('');
	let focusedIndex = $state(-1);

	const selectedOption = $derived(options.find((o) => o.id === value));
	const filtered = $derived(
		query.trim()
			? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
			: options
	);

	let inputEl: HTMLInputElement | undefined = $state();
	let listEl: HTMLDivElement | undefined = $state();

	function onInput() {
		open = true;
		focusedIndex = -1;
	}

	function select(id: string) {
		value = id;
		query = '';
		open = false;
		focusedIndex = -1;
	}

	function clear() {
		value = '';
		query = '';
		open = false;
		focusedIndex = -1;
	}

	function onKeydown(e: KeyboardEvent) {
		if (!open) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || /* space when closed */ false) {
				open = true;
				e.preventDefault();
			}
			return;
		}

		switch (e.key) {
			case 'Escape':
				open = false;
				focusedIndex = -1;
				query = '';
				e.preventDefault();
				break;
			case 'ArrowDown':
				e.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, filtered.length - 1);
				scrollInto(focusedIndex);
				break;
			case 'ArrowUp':
				e.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, 0);
				scrollInto(focusedIndex);
				break;
			case 'Enter':
				e.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < filtered.length) {
					select(filtered[focusedIndex].id);
				} else if (filtered.length === 1) {
					select(filtered[0].id);
				}
				break;
		}
	}

	function scrollInto(index: number) {
		if (!listEl) return;
		const child = listEl.children[index] as HTMLElement | undefined;
		child?.scrollIntoView({ block: 'nearest' });
	}

	function onBlur() {
		// delay to allow click on option
		setTimeout(() => {
			open = false;
			focusedIndex = -1;
			if (value) query = '';
		}, 200);
	}
</script>

<div class="relative">
	{#if label}
		<label class="mb-1.5 block text-sm font-medium text-plum">{label}</label>
	{/if}

	<!-- trigger button when selected -->
	{#if value && selectedOption}
		<div class="flex items-center gap-1.5 rounded-xl border border-lavender/30 bg-white/60 px-3 py-2.5 text-sm text-plum">
			<span class="flex-1 truncate">{selectedOption.label}</span>
			<button type="button" onclick={clear} class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-plum-light hover:bg-coral/10 hover:text-coral-dark transition-colors" aria-label="ล้างค่า">
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
			</button>
			<button type="button" onclick={() => { open = !open; query = ''; inputEl?.focus(); }} class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-plum-light hover:bg-lavender/15 transition-colors" aria-label="เปลี่ยน">
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
			</button>
		</div>
	{:else}
		<div class="relative">
			<svg class="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-plum-light/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
			<input
				type="text"
				bind:this={inputEl}
				bind:value={query}
				oninput={onInput}
				onfocus={() => (open = true)}
				onblur={onBlur}
				onkeydown={onKeydown}
				placeholder={placeholder}
				class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base placeholder:text-plum-light/60"
			/>
		</div>
	{/if}

	<!-- dropdown -->
	{#if open && filtered.length > 0}
		<div
			bind:this={listEl}
			class="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/70 bg-white/90 p-1 shadow-2xl shadow-plum/15 backdrop-blur-xl"
			role="listbox"
		>
			{#each filtered as option, i}
				<button
					type="button"
					role="option"
					aria-selected={option.id === value}
					onmousedown={() => select(option.id)}
					class="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors {option.id === value ? 'bg-coral/10 text-coral-dark font-medium' : i === focusedIndex ? 'bg-lavender/15 text-plum' : 'text-plum hover:bg-lavender/10'}"
				>
					{#if option.id === value}
						<svg class="w-4 h-4 flex-shrink-0 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
					{/if}
					<span class="flex-1 truncate">{option.label}</span>
				</button>
			{/each}
		</div>
	{:else if open && query.trim()}
		<div class="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/70 bg-white/90 p-4 shadow-2xl shadow-plum/15 backdrop-blur-xl">
			<p class="text-sm text-plum-light text-center">{emptyText}</p>
		</div>
	{/if}
</div>
