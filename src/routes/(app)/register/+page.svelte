<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/user.js';
	import PasswordInput from '$lib/components/PasswordInput.svelte';
	import type { ApiErrorResponse } from '$lib/types.js';

	$effect(() => {
		if ($user) goto('/profile');
	});

	let isLoading = $state(false);
	let errorMessage = $state('');
	let fieldErrors = $state<Record<string, string>>({});
	let username = $state('');
	let email = $state('');
	let displayName = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		errorMessage = '';
		fieldErrors = {};

		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, displayName, password, confirmPassword })
			});
			const data: ApiErrorResponse = await res.json();
			if (!res.ok) {
				errorMessage = data.error || 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง';
				if (data.fields) fieldErrors = data.fields;
				return;
			}
			await goto('/profile');
		} catch {
			errorMessage = 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองอีกครั้ง';
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
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-2">สมัครสมาชิก</h1>
			<p class="text-sm sm:text-base text-plum-light">มาเป็นส่วนหนึ่งของชุมชน GL-Orbit 🌸</p>
		</div>

		<div class="glass-card-strong rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-lavender/10">
			{#if errorMessage}
				<div class="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral-dark text-sm text-center">
					{errorMessage}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4 sm:space-y-5">
				<div>
					<label for="username" class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">ชื่อผู้ใช้</label>
					<input
						id="username"
						name="username"
						type="text"
						bind:value={username}
						placeholder="username"
						class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target {fieldErrors.username ? 'border-coral/50' : ''}"
						required
					/>
					{#if fieldErrors.username}
						<p class="text-xs text-coral mt-1">{fieldErrors.username}</p>
					{/if}
				</div>
				<div>
					<label for="displayName" class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">ชื่อที่แสดง <span class="text-plum-light/60 font-normal">(ไม่บังคับ)</span></label>
					<input
						id="displayName"
						name="displayName"
						type="text"
						bind:value={displayName}
						placeholder="ชื่อของคุณ"
						class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target"
					/>
				</div>
				<div>
					<label for="email" class="block text-sm font-medium text-plum mb-1.5 sm:mb-2">อีเมล</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						placeholder="your@email.com"
						class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target {fieldErrors.email ? 'border-coral/50' : ''}"
						required
					/>
					{#if fieldErrors.email}
						<p class="text-xs text-coral mt-1">{fieldErrors.email}</p>
					{/if}
				</div>
				<PasswordInput
					id="password"
					name="password"
					bind:value={password}
					placeholder="อย่างน้อย 6 ตัวอักษร"
					minlength={6}
					label="รหัสผ่าน"
				/>
				<PasswordInput
					id="confirmPassword"
					name="confirmPassword"
					bind:value={confirmPassword}
					label="ยืนยันรหัสผ่าน"
				/>
				<button
					type="submit"
					disabled={isLoading}
					class="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base touch-target flex items-center justify-center"
				>
					{#if isLoading}
						<div class="flex items-center justify-center gap-2">
							<svg class="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
						<span>กำลังสมัครสมาชิก...</span>
					</div>
					{:else}
						สมัครสมาชิก
					{/if}
				</button>
			</form>

			<div class="mt-5 text-center">
				<p class="text-sm text-plum-light">
					มีบัญชีแล้ว?
					<a href="/login" class="text-coral-dark font-medium hover:underline">เข้าสู่ระบบ</a>
				</p>
			</div>
		</div>
	</div>
</div>
