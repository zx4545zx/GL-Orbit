<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types.js';
	import PasswordInput from '$lib/components/PasswordInput.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const user = $derived(data.user);

	let editMode = $state(false);
	let passwordMode = $state(false);
	let isLoadingProfile = $state(false);
	let isLoadingPassword = $state(false);

	let displayName = $state('');
	let avatarUrl = $state('');

	$effect(() => {
		displayName = user.displayName ?? '';
		avatarUrl = user.avatarUrl ?? '';
	});

	function handleLogout() {
		const f = document.createElement('form');
		f.method = 'POST';
		f.action = '/logout';
		document.body.appendChild(f);
		f.submit();
		document.body.removeChild(f);
	}
</script>

<div class="py-8 sm:py-12">
	<div class="max-w-md mx-auto">
		<!-- Profile Header -->
		<div class="text-center mb-8">
			<div class="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4">
				{#if user.avatarUrl}
					<img src={user.avatarUrl} alt="" class="w-full h-full rounded-3xl object-cover shadow-lg shadow-lavender/20" />
				{:else}
					<div class="w-full h-full rounded-3xl bg-gradient-to-br from-coral/20 to-lavender/20 flex items-center justify-center shadow-lg shadow-lavender/20">
						<span class="text-2xl sm:text-3xl font-bold text-coral-dark">
							{(user.displayName || user.username).charAt(0).toUpperCase()}
						</span>
					</div>
				{/if}
			</div>
			<h1 class="font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold text-plum mb-1">
				{user.displayName || user.username}
			</h1>
			<p class="text-sm text-plum-light">{user.email}</p>
			<span class="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-medium {user.role === 'ADMIN' ? 'bg-coral/10 text-coral-dark' : 'bg-lavender/10 text-lavender-dark'}">
				{user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}
			</span>
		</div>

		<!-- Success Message -->
		{#if form?.success}
			<div class="mb-4 p-3 rounded-xl bg-mint/10 border border-mint/20 text-mint-dark text-sm text-center">
				{form.message}
			</div>
		{/if}
		{#if form?.error}
			<div class="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral-dark text-sm text-center">
				{form.error}
			</div>
		{/if}

		<!-- Info Card -->
		<div class="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4">
			<div class="flex items-center justify-between py-2 border-b border-lavender/10">
				<span class="text-sm text-plum-light">ชื่อผู้ใช้</span>
				<span class="text-sm font-medium text-plum">{user.username}</span>
			</div>
			<div class="flex items-center justify-between py-2 border-b border-lavender/10">
				<span class="text-sm text-plum-light">อีเมล</span>
				<span class="text-sm font-medium text-plum">{user.email}</span>
			</div>
			<div class="flex items-center justify-between py-2 border-b border-lavender/10">
				<span class="text-sm text-plum-light">ชื่อที่แสดง</span>
				<span class="text-sm font-medium text-plum">{user.displayName || '-'}</span>
			</div>
			<div class="flex items-center justify-between py-2 border-b border-lavender/10">
				<span class="text-sm text-plum-light">บทบาท</span>
				<span class="text-sm font-medium text-plum">{user.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'สมาชิก'}</span>
			</div>
			<div class="flex items-center justify-between py-2">
				<span class="text-sm text-plum-light">เข้าร่วมเมื่อ</span>
				<span class="text-sm font-medium text-plum">
					{new Date(user.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
				</span>
			</div>
		</div>

		<!-- Favorite Series Section -->
		<div class="mt-8">
			<h2 class="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-plum mb-4 sm:mb-6">ซีรีส์ที่ฉัน Favorite</h2>

			{#if data.favoriteSeries && data.favoriteSeries.length > 0}
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
					{#each data.favoriteSeries as s (s.id)}
						<a href="/series/{s.id}" class="group">
							<div class="glass-card rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-lavender/20 transition-all duration-500 hover:-translate-y-1">
								<div class="relative aspect-[3/4] overflow-hidden">
									<img
										src={s.poster}
										alt={s.title}
										class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
										loading="lazy"
									/>
									<div class="absolute inset-0 bg-gradient-to-t from-plum/80 via-plum/20 to-transparent"></div>
									<div class="absolute top-2 sm:top-3 left-2 sm:left-3">
										<span class="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-md {s.status === 'ONGOING' ? 'bg-mint/20 text-mint-dark' : s.status === 'UPCOMING' ? 'bg-lavender/20 text-lavender-dark' : 'bg-coral/10 text-coral-dark'}">
											{s.status === 'ONGOING' ? 'กำลังฉาย' : s.status === 'UPCOMING' ? 'เร็วๆ นี้' : 'จบแล้ว'}
										</span>
									</div>
									<div class="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
										<p class="text-white/70 text-[10px] sm:text-xs mb-0.5">{s.studio}</p>
										<h3 class="text-white font-bold text-sm sm:text-base leading-tight">{s.title}</h3>
										{#if s.subtitle}
											<p class="text-white/80 text-[10px] sm:text-xs mt-0.5">{s.subtitle}</p>
										{/if}
									</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-10 text-center">
					<div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-lavender/10 flex items-center justify-center mx-auto mb-4">
						<svg class="w-7 h-7 sm:w-8 sm:h-8 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
						</svg>
					</div>
					<h3 class="font-semibold text-plum mb-1">ยังไม่มีซีรีส์ที่ Favorite</h3>
					<p class="text-sm text-plum-light mb-4">ไปค้นหาซีรีส์ที่คุณชอบแล้วเพิ่มลงในรายการ Favorite!</p>
					<a
						href="/series"
						class="inline-flex px-6 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm touch-target"
					>
						ไปดูซีรีส์ทั้งหมด
					</a>
				</div>
			{/if}
		</div>

		<!-- Edit Profile Form -->
		<div class="mt-6">
			<button
				onclick={() => editMode = !editMode}
				class="w-full py-3 rounded-xl glass-card-strong text-plum font-semibold hover:bg-white/90 hover:scale-[1.02] transition-all duration-300 text-sm sm:text-base touch-target flex items-center justify-center gap-2"
			>
				<svg class="w-5 h-5 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
				{editMode ? 'ยกเลิก' : 'แก้ไขโปรไฟล์'}
			</button>

			{#if editMode}
				<div class="mt-4 glass-card-strong rounded-2xl sm:rounded-3xl p-5 sm:p-6">
					<h3 class="font-semibold text-plum mb-4">แก้ไขโปรไฟล์</h3>
					<form
						method="POST"
						action="?/updateProfile"
						use:enhance={() => {
							isLoadingProfile = true;
							return async ({ update }) => {
								isLoadingProfile = false;
								editMode = false;
								update();
							};
						}}
						class="space-y-4"
					>
						<div>
							<label for="displayName" class="block text-sm font-medium text-plum mb-1.5">ชื่อที่แสดง</label>
							<input
								id="displayName"
								name="displayName"
								type="text"
								bind:value={displayName}
								placeholder="ชื่อของคุณ"
								class="w-full px-3 sm:px-4 py-2.5 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target"
							/>
						</div>
						<div>
							<label for="avatarUrl" class="block text-sm font-medium text-plum mb-1.5">URL รูปโปรไฟล์</label>
							<input
								id="avatarUrl"
								name="avatarUrl"
								type="url"
								bind:value={avatarUrl}
								placeholder="https://example.com/avatar.jpg"
								class="w-full px-3 sm:px-4 py-2.5 rounded-xl bg-white/60 border border-lavender/20 text-plum placeholder:text-plum-light/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/30 transition-all text-sm sm:text-base touch-target"
							/>
						</div>
						<button
							type="submit"
							disabled={isLoadingProfile}
							class="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 text-sm sm:text-base touch-target flex items-center justify-center gap-2"
						>
							{#if isLoadingProfile}
								<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
								กำลังบันทึก...
							{:else}
								บันทึกโปรไฟล์
							{/if}
						</button>
					</form>
				</div>
			{/if}
		</div>

		<!-- Change Password Form -->
		<div class="mt-4">
			<button
				onclick={() => passwordMode = !passwordMode}
				class="w-full py-3 rounded-xl glass-card-strong text-plum font-semibold hover:bg-white/90 hover:scale-[1.02] transition-all duration-300 text-sm sm:text-base touch-target flex items-center justify-center gap-2"
			>
				<svg class="w-5 h-5 text-plum-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
				{passwordMode ? 'ยกเลิก' : 'เปลี่ยนรหัสผ่าน'}
			</button>

			{#if passwordMode}
				<div class="mt-4 glass-card-strong rounded-2xl sm:rounded-3xl p-5 sm:p-6">
					<h3 class="font-semibold text-plum mb-4">เปลี่ยนรหัสผ่าน</h3>
					<form
						method="POST"
						action="?/changePassword"
						use:enhance={() => {
							isLoadingPassword = true;
							return async ({ update }) => {
								isLoadingPassword = false;
								passwordMode = false;
								update();
							};
						}}
						class="space-y-4"
					>
						<PasswordInput
							id="currentPassword"
							name="currentPassword"
							label="รหัสผ่านปัจจุบัน"
						/>
						<PasswordInput
							id="newPassword"
							name="newPassword"
							label="รหัสผ่านใหม่"
							placeholder="อย่างน้อย 6 ตัวอักษร"
							minlength={6}
						/>
						<PasswordInput
							id="confirmPassword"
							name="confirmPassword"
							label="ยืนยันรหัสผ่านใหม่"
						/>
						<button
							type="submit"
							disabled={isLoadingPassword}
							class="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 text-sm sm:text-base touch-target flex items-center justify-center gap-2"
						>
							{#if isLoadingPassword}
								<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
								กำลังบันทึก...
							{:else}
								เปลี่ยนรหัสผ่าน
							{/if}
						</button>
					</form>
				</div>
			{/if}
		</div>

		<!-- Admin Link + Logout -->
		<div class="mt-6 space-y-3">
			{#if user.role === 'ADMIN'}
				<a
					href="/admin/series"
					class="w-full py-3 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm sm:text-base touch-target flex items-center justify-center gap-2"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
					ไปยังหน้าจัดการ
				</a>
			{/if}
			<button
				onclick={handleLogout}
				class="w-full py-3 rounded-xl border-2 border-coral/30 bg-coral/5 text-coral-dark font-semibold hover:bg-coral/10 hover:border-coral/50 hover:scale-[1.02] transition-all duration-300 text-sm sm:text-base touch-target flex items-center justify-center gap-2"
			>
				<svg class="w-5 h-5 text-coral-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
				ออกจากระบบ
			</button>
		</div>
	</div>
</div>
