<script lang="ts">

	import { page } from '$app/state';
	import { localizedHref } from '$lib/i18n/link.js';	import { goto, invalidateAll } from '$app/navigation';
	import { adminFetch } from '$lib/admin/action-feedback.js';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ImageUpload from '$lib/components/admin/ImageUpload.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let loadedArtistId = $state(data.artist.id);
	let nickname = $state(data.artist.nickname);
	let fullNameTh = $state(data.artist.fullNameTh ?? '');
	let fullNameEn = $state(data.artist.fullNameEn);
	let profileImageUrl = $state(data.artist.profileImageUrl ?? '');
	let savingArtist = $state(false);
	let artistError = $state('');
	let artistSaved = $state(false);

	let socialPlatform = $state('');
	let socialUrl = $state('');
	let socialIconUrl = $state('');
	let socialEditingId = $state<string | null>(null);
	let socialLoading = $state(false);
	let socialError = $state('');
	let deleteSocialId = $state<string | null>(null);
	let showConfirm = $state(false);

	const platformOptions = [
		{ value: 'INSTAGRAM', label: 'Instagram' },
		{ value: 'TWITTER', label: 'Twitter / X' },
		{ value: 'TIKTOK', label: 'TikTok' },
		{ value: 'YOUTUBE', label: 'YouTube' },
		{ value: 'FACEBOOK', label: 'Facebook' },
		{ value: 'WEIBO', label: 'Weibo' },
		{ value: 'XIAOHONGSHU', label: 'Xiaohongshu' },
		{ value: 'OTHER', label: 'อื่น ๆ' }
	];

	const tabs = [
		{ id: 'profile', label: 'ข้อมูลนักแสดง', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
		{ id: 'socials', label: 'โซเชียลมีเดีย', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' }
	] as const;

	let activeTab = $state<'profile' | 'socials'>('profile');

	$effect(() => {
		if (data.artist.id !== loadedArtistId) {
			loadedArtistId = data.artist.id;
			nickname = data.artist.nickname;
			fullNameTh = data.artist.fullNameTh ?? '';
			fullNameEn = data.artist.fullNameEn;
			profileImageUrl = data.artist.profileImageUrl ?? '';
			activeTab = 'profile';
			artistError = '';
			artistSaved = false;
			resetSocialForm();
		}
	});

	async function saveArtist() {
		savingArtist = true;
		artistError = '';
		const res = await adminFetch(`/api/admin/artists/${data.artist.id}`, {
			method: 'PUT',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nickname: nickname.trim(),
				fullNameTh: fullNameTh.trim() || null,
				fullNameEn: fullNameEn.trim(),
				profileImageUrl: profileImageUrl.trim() || null
			})
		});
		savingArtist = false;
		if (!res.ok) {
			const json = await res.json().catch(() => ({}));
			artistError = json.error ?? 'บันทึกไม่สำเร็จ';
			return;
		}
		artistSaved = true;
		setTimeout(() => (artistSaved = false), 1800);
		await invalidateAll();
	}

	function resetSocialForm() {
		socialEditingId = null;
		socialPlatform = '';
		socialUrl = '';
		socialIconUrl = '';
		socialError = '';
	}

	function editSocial(s: PageData['socials'][number]) {
		activeTab = 'socials';
		socialEditingId = s.id;
		socialPlatform = s.platform;
		socialUrl = s.url;
		socialIconUrl = s.iconUrl ?? '';
		socialError = '';
	}

	async function saveSocial() {
		if (!socialPlatform || !socialUrl.trim()) {
			socialError = 'กรุณาเลือกแพลตฟอร์มและกรอก URL';
			return;
		}
		socialLoading = true;
		socialError = '';
		const url = socialEditingId ? `/api/admin/artist-socials/${socialEditingId}` : '/api/admin/artist-socials';
		const res = await adminFetch(url, {
			method: socialEditingId ? 'PUT' : 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				artistId: data.artist.id,
				platform: socialPlatform,
				url: socialUrl.trim(),
				iconUrl: socialIconUrl.trim() || null
			})
		});
		socialLoading = false;
		if (!res.ok) {
			const json = await res.json().catch(() => ({}));
			socialError = json.error ?? 'บันทึกไม่สำเร็จ';
			return;
		}
		resetSocialForm();
		await invalidateAll();
	}

	function askDeleteSocial(id: string) {
		deleteSocialId = id;
		showConfirm = true;
	}

	async function deleteSocial() {
		if (!deleteSocialId) return;
		await adminFetch(`/api/admin/artist-socials/${deleteSocialId}`, { method: 'DELETE', credentials: 'include' });
		deleteSocialId = null;
		await invalidateAll();
	}

	function platformLabel(platform: string) {
		return platformOptions.find((p) => p.value === platform)?.label ?? platform;
	}

	function platformColor(platform: string) {
		const colors: Record<string, string> = {
			INSTAGRAM: 'bg-pink-100 text-pink-700',
			TWITTER: 'bg-sky-100 text-sky-700',
			TIKTOK: 'bg-gray-100 text-gray-900',
			YOUTUBE: 'bg-red-100 text-red-700',
			FACEBOOK: 'bg-blue-100 text-blue-700',
			WEIBO: 'bg-orange-100 text-orange-700',
			XIAOHONGSHU: 'bg-rose-100 text-rose-700',
			OTHER: 'bg-gray-100 text-gray-600'
		};
		return colors[platform] ?? 'bg-lavender/10 text-lavender-dark';
	}
</script>

<svelte:head>
	<title>แก้ไขนักแสดง · {data.artist.nickname} | GL-Orbit</title>
</svelte:head>

<div class="py-4 sm:py-6">
	<div class="flex items-center gap-3 mb-5">
		<button onclick={() => goto(localizedHref('/admin/artists', page.data.lang))} class="p-2 -ml-2 rounded-xl hover:bg-lavender/15 text-plum transition-colors touch-target flex-shrink-0" aria-label="กลับ">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
		</button>
		<div class="min-w-0 flex-1">
			<h1 class="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-plum truncate">{data.artist.nickname}</h1>
			<div class="mt-1 flex flex-wrap gap-1.5">
				{#if data.artist.fullNameEn}<span class="inline-flex max-w-full items-center rounded-full bg-lavender/12 px-2 py-0.5 text-xs font-medium text-plum-light"><span class="mr-1 text-coral-dark/70">EN</span><span class="truncate">{data.artist.fullNameEn}</span></span>{/if}
				{#if data.artist.fullNameTh}<span class="inline-flex max-w-full items-center rounded-full bg-mint/12 px-2 py-0.5 text-xs font-medium text-plum-light"><span class="mr-1 text-mint-dark/80">TH</span><span class="truncate">{data.artist.fullNameTh}</span></span>{/if}
			</div>
		</div>
	</div>

	<div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
		<nav class="lg:w-48 xl:w-52 flex-shrink-0">
			<div class="grid grid-cols-2 lg:flex lg:flex-col gap-1.5 lg:sticky lg:top-6">
				{#each tabs as tab (tab.id)}
					{@const active = activeTab === tab.id}
					<button type="button" onclick={() => (activeTab = tab.id)} class="flex items-center justify-center lg:justify-start gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap {active ? 'bg-gradient-to-r from-coral/10 to-lavender/10 text-coral-dark shadow-sm' : 'text-plum-light hover:bg-white/60 hover:text-plum bg-white/40 lg:bg-transparent'}">
						<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d={tab.icon} /></svg>
						<span>{tab.label}</span>
						{#if tab.id === 'socials'}<span class="ml-auto px-1.5 py-0.5 rounded-md text-[10px] font-semibold {active ? 'bg-coral/15 text-coral-dark' : 'bg-lavender/15 text-plum-light'}">{data.socials.length}</span>{/if}
					</button>
				{/each}
			</div>
		</nav>

		<div class="flex-1 min-w-0">
			<div class="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg shadow-lavender/5">
				{#if activeTab === 'profile'}
					<div class="space-y-5">
						<div class="rounded-2xl border border-lavender/15 bg-white/45 px-4 py-3 text-sm text-plum-light">
							ชื่ออังกฤษจำเป็นสำหรับ SEO / schema ส่วนชื่อไทยใช้แสดงบนหน้า public และช่วยค้นหาในระบบจัดการ
						</div>
						<div class="flex flex-col sm:flex-row gap-5">
							<div class="sm:w-36 flex-shrink-0">
								<ImageUpload bind:url={profileImageUrl} type="profiles" label="รูปโปรไฟล์" />
							</div>
							<div class="flex-1 space-y-4">
								<div>
									<label for="artist-nickname" class="block text-sm font-medium text-plum mb-1.5">ชื่อเล่น <span class="text-coral">*</span></label>
									<input id="artist-nickname" bind:value={nickname} class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
								</div>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<label for="artist-fullname-en" class="block text-sm font-medium text-plum mb-1.5">ชื่อเต็มภาษาอังกฤษ <span class="text-coral">*</span></label>
										<input id="artist-fullname-en" bind:value={fullNameEn} required placeholder="Full name in English" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
									</div>
									<div>
										<label for="artist-fullname-th" class="block text-sm font-medium text-plum mb-1.5">ชื่อเต็มภาษาไทย</label>
										<input id="artist-fullname-th" bind:value={fullNameTh} placeholder="ชื่อเต็มภาษาไทย (ถ้ามี)" class="w-full px-4 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm sm:text-base" />
									</div>
								</div>
							</div>
						</div>
						{#if artistError}<p class="text-sm text-coral-dark bg-coral/5 px-3 py-2 rounded-lg">{artistError}</p>{/if}
						<div class="flex items-center gap-3 pt-2"><button onclick={saveArtist} disabled={savingArtist} class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-coral to-coral-dark text-white font-semibold shadow-lg shadow-coral/25 text-sm sm:text-base touch-target disabled:opacity-60">{savingArtist ? 'กำลังบันทึก...' : 'บันทึกข้อมูลนักแสดง'}</button>{#if artistSaved}<span class="text-sm text-mint-dark">บันทึกแล้ว</span>{/if}</div>
					</div>
				{:else}
					<div class="space-y-5">
						<div class="bg-white/50 rounded-2xl p-4 border border-lavender/15 space-y-3">
							<h3 class="text-sm font-semibold text-plum">{socialEditingId ? 'แก้ไขโซเชียลมีเดีย' : 'เพิ่มโซเชียลมีเดีย'}</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<select bind:value={socialPlatform} class="w-full px-3 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm"><option value="">— แพลตฟอร์ม —</option>{#each platformOptions as p}<option value={p.value}>{p.label}</option>{/each}</select>
								<input type="url" bind:value={socialUrl} placeholder="URL โซเชียลมีเดีย" class="w-full px-3 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
							</div>
							<input type="url" bind:value={socialIconUrl} placeholder="URL ไอคอน (ถ้ามี)" class="w-full px-3 py-2.5 rounded-xl border border-lavender/30 bg-white/60 text-plum focus:outline-none focus:ring-2 focus:ring-coral/30 text-sm" />
							{#if socialError}<p class="text-xs text-coral-dark">{socialError}</p>{/if}
							<div class="flex gap-2"><button onclick={saveSocial} disabled={socialLoading} class="px-4 py-2 rounded-xl bg-coral text-white font-medium text-sm touch-target disabled:opacity-50">{socialLoading ? 'กำลังบันทึก...' : socialEditingId ? 'บันทึกการแก้ไข' : '+ เพิ่มโซเชียล'}</button>{#if socialEditingId}<button onclick={resetSocialForm} class="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm touch-target">ยกเลิก</button>{/if}</div>
						</div>

						{#if data.socials.length === 0}
							<div class="text-center py-10 text-sm text-plum-light bg-white/40 rounded-2xl border border-dashed border-lavender/30">ยังไม่มีโซเชียลมีเดียของนักแสดงคนนี้</div>
						{:else}
							<div class="space-y-2.5">
								{#each data.socials as s (s.id)}
									<div class="flex items-start gap-3 bg-white/70 rounded-2xl p-3 border border-lavender/15">
										<div class="flex-1 min-w-0"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold {platformColor(s.platform)}">{platformLabel(s.platform)}</span><a href={s.url} target="_blank" rel="noopener noreferrer" class="block mt-1 text-xs sm:text-sm text-plum-light hover:text-coral-dark hover:underline truncate">{s.url}</a></div>
										<button onclick={() => editSocial(s)} class="p-2 rounded-lg hover:bg-lavender/20 text-plum-light hover:text-lavender-dark touch-target" aria-label="แก้ไข"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
										<button onclick={() => askDeleteSocial(s.id)} class="p-2 rounded-lg hover:bg-coral/10 text-plum-light hover:text-coral-dark touch-target" aria-label="ลบ"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<ConfirmDialog
	bind:open={showConfirm}
	title="ยืนยันการลบโซเชียล"
	message="คุณแน่ใจหรือไม่ว่าต้องการลบโซเชียลนี้?"
	onconfirm={deleteSocial}
	oncancel={() => (deleteSocialId = null)}
/>
