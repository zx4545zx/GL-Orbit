<script lang="ts">
	interface Props {
		id?: string;
		name?: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		minlength?: number;
		label?: string;
	}

	let {
		id = 'password',
		name = 'password',
		value = $bindable(''),
		placeholder = '••••••••',
		required = true,
		minlength,
		label = 'รหัสผ่าน'
	}: Props = $props();

	let show = $state(false);

	function toggle() {
		show = !show;
	}
</script>

<div>
	<label for={id} class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">{label}</label>
	<div class="relative">
		<input
			{id}
			{name}
			type={show ? 'text' : 'password'}
			bind:value
			{placeholder}
			{required}
			{minlength}
			class="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target"
		/>
		<button
			type="button"
			onclick={toggle}
			class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-lavender/20 transition-colors text-plum-light"
			aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
		>
			{#if show}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
				</svg>
			{:else}
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			{/if}
		</button>
	</div>
</div>
