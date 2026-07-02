<script lang="ts">
	import { addFeedback } from '$lib/admin/action-feedback.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	let seriesId = $state('');
	let recipientType = $state<'followers' | 'global'>('followers');
	let message = $state('');
	let loading = $state(false);
	let result = $state<{ success: true; sentCount: number } | null>(null);

	const MESSAGE_MAX = 500;
	let remaining = $derived(MESSAGE_MAX - message.length);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!seriesId || !message.trim()) return;
		loading = true;
		result = null;
		try {
			const res = await fetch('/api/notifications/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seriesId, recipientType, message: message.trim() })
			});
			const payload = await res.json();
			if (res.ok) {
				result = { success: true, sentCount: payload.sentCount };
				addFeedback({ type: 'success', message: `ส่งแจ้งเตือนแล้ว ${payload.sentCount} ราย` });
				seriesId = '';
				message = '';
				recipientType = 'followers';
			} else {
				addFeedback({ type: 'error', message: payload.error ?? 'ส่งไม่สำเร็จ' });
			}
		} catch {
			addFeedback({ type: 'error', message: 'เกิดข้อผิดพลาดในการส่ง' });
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold text-plum mb-6">ส่งแจ้งเตือน</h1>

	<form onsubmit={handleSubmit} class="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
		<div>
			<label class="block text-sm font-medium text-plum mb-1.5">ซีรีส์</label>
			<select bind:value={seriesId} required class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral">
				<option value="" disabled>เลือกซีรีส์</option>
				{#each data.series as s}
					<option value={s.id}>{s.titleEn}</option>
				{/each}
			</select>
		</div>

		<div>
			<label class="block text-sm font-medium text-plum mb-1.5">ผู้รับ</label>
			<div class="flex gap-4">
				<label class="flex items-center gap-2 text-sm text-gray-700">
					<input type="radio" bind:group={recipientType} value="followers" />
					ผู้ติดตามซีรีส์
				</label>
				<label class="flex items-center gap-2 text-sm text-gray-700">
					<input type="radio" bind:group={recipientType} value="global" />
					ทุกผู้ใช้
				</label>
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium text-plum mb-1.5">ข้อความ</label>
			<textarea
				bind:value={message}
				required
				maxlength={MESSAGE_MAX}
				rows="4"
				class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral resize-none"
			></textarea>
			<p class="text-xs text-gray-400 mt-1 text-right">{remaining} ตัวอักษร</p>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full rounded-xl bg-coral text-white font-medium py-3 hover:bg-coral-dark transition-colors disabled:opacity-50"
		>
			{#if loading}
				กำลังส่ง...
			{:else}
				ส่งแจ้งเตือน
			{/if}
		</button>

		{#if result}
			<p class="text-sm text-mint-dark text-center">ส่งแจ้งเตือนสำเร็จ {result.sentCount} ราย</p>
		{/if}
	</form>
</div>
