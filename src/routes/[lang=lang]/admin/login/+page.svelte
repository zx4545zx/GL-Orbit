<script lang="ts">

	import { page } from '$app/state';	import { enhance } from '$app/forms';
	import type { ActionData } from './$types.js';
	import PasswordInput from '$lib/components/PasswordInput.svelte';

	let { form }: { form: ActionData } = $props();

	let isLoading = $state(false);
	let email = $state('');
	let password = $state('');
</script>

<div class="min-h-[calc(100dvh-6rem)] flex items-center justify-center px-4">
	<div class="relative w-full max-w-sm sm:max-w-md">
		<div class="text-center mb-6 sm:mb-8">
			<div class="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-plum mb-4 shadow-sm shadow-plum/20">
				<span class="text-xl sm:text-2xl font-bold text-white">G</span>
			</div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-2">เข้าสู่ระบบ</h1>
			<p class="text-sm sm:text-base text-plum-light">สำหรับทีมงานและผู้ดูแลระบบ</p>
		</div>

		<div class="glass-card-strong rounded-xl sm:rounded-2xl p-6 sm:p-8">
			{#if form?.error}
				<div class="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral-dark text-sm text-center">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						isLoading = false;
						update();
					};
				}}
				class="space-y-4 sm:space-y-5"
			>
				<div>
					<label for="identifier" class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">ชื่อผู้ใช้ หรือ อีเมล</label>
					<input
						id="identifier"
						name="identifier"
						type="text"
						bind:value={email}
						placeholder="ชื่อผู้ใช้ หรือ your@email.com"
						class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg orbit-control placeholder:text-plum-light/50 transition-all text-sm sm:text-base touch-target"
						required
					/>
				</div>
				<PasswordInput bind:value={password} />
				<button
					type="submit"
					disabled={isLoading}
					class="w-full py-3 sm:py-3.5 rounded-lg orbit-action font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base touch-target flex items-center justify-center"
				>
					{#if isLoading}
						<div class="flex items-center justify-center gap-2">
							<svg class="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
						<span>กำลังเข้าสู่ระบบ...</span>
					</div>
					{:else}
						เข้าสู่ระบบ
					{/if}
				</button>
			</form>

			<div class="mt-5 text-center">
				<p class="text-sm text-plum-light">
					สมาชิกทั่วไป?
					<a href="/{page.data.lang}/login" class="text-coral-dark font-medium hover:underline">เข้าสู่ระบบที่นี่</a>
				</p>
			</div>
		</div>
	</div>
</div>
