<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import PasswordInput from '$lib/components/PasswordInput.svelte';

	let isLoading = $state(false);
	let errorMessage = $state('');
	let email = $state('');
	let password = $state('');

	$effect(() => {
		if (page.data.user) goto('/profile');
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ identifier: email, password })
			});
			const data = await res.json();
			if (!res.ok) {
				errorMessage = data.error || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง';
				return;
			}
			await invalidateAll();
			await goto('/profile');
		} catch {
			errorMessage = 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="min-h-[calc(100dvh-6rem)] flex items-center justify-center px-4">
	<div class="absolute inset-0 bg-gradient-mesh pointer-events-none"></div>
	<div class="absolute top-10 sm:top-20 left-4 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-coral/15 rounded-full blur-3xl"></div>
	<div class="absolute bottom-10 sm:bottom-20 right-4 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-lavender/15 rounded-full blur-3xl"></div>

	<div class="relative w-full max-w-sm sm:max-w-md">
		<div class="text-center mb-6 sm:mb-8">
			<div class="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-coral to-lavender mb-4 shadow-lg shadow-coral/25">
				<span class="text-xl sm:text-2xl font-bold text-white">G</span>
			</div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-2">เข้าสู่ระบบ</h1>
			<p class="text-sm sm:text-base text-plum-light">ยินดีต้อนรับกลับมา! 👋</p>
		</div>

		<div class="glass-card-strong rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-lavender/10">
			{#if errorMessage}
				<div class="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral-dark text-sm text-center">
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4 sm:space-y-5">
				<div>
					<label for="identifier" class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">ชื่อผู้ใช้ หรือ อีเมล</label>
					<input
						id="identifier"
						name="identifier"
						type="text"
						bind:value={email}
						placeholder="ชื่อผู้ใช้ หรือ your@email.com"
						class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target"
						required
					/>
				</div>
				<PasswordInput bind:value={password} />
				<button
					type="submit"
					disabled={isLoading}
					class="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base touch-target flex items-center justify-center"
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
					ยังไม่มีบัญชี?
					<a href="/register" class="text-coral-dark font-medium hover:underline">สมัครสมาชิก</a>
				</p>
			</div>
		</div>
	</div>
</div>
