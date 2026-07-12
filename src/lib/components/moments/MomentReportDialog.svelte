<script lang="ts">
	import { page } from '$app/state';

	let { momentId, open = $bindable(false), onSuccess }: { momentId: string; open?: boolean; onSuccess?: () => void } = $props();
	let reason = $state<'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'COPYRIGHT' | 'MISLEADING' | 'OTHER'>('SPAM');
	let details = $state('');
	let submitting = $state(false);
	let error = $state('');
	const isThai = $derived(page.data.lang === 'th');
	const copy = $derived(isThai ? {
		title: 'รายงาน Moment', details: 'รายละเอียดเพิ่มเติม (ไม่บังคับ)', cancel: 'ยกเลิก', submit: 'ส่งรายงาน', sending: 'กำลังส่ง…', failed: 'ส่งรายงานไม่สำเร็จ โปรดลองอีกครั้ง'
	} : {
		title: 'Report Moment', details: 'Additional details (optional)', cancel: 'Cancel', submit: 'Submit report', sending: 'Sending…', failed: 'Unable to submit the report. Please try again.'
	});
	const reasons = $derived(isThai ? [
		{ value: 'SPAM', label: 'สแปม' }, { value: 'HARASSMENT', label: 'การคุกคาม' }, { value: 'INAPPROPRIATE', label: 'เนื้อหาไม่เหมาะสม' }, { value: 'COPYRIGHT', label: 'ลิขสิทธิ์' }, { value: 'MISLEADING', label: 'ข้อมูลชวนเข้าใจผิด' }, { value: 'OTHER', label: 'อื่น ๆ' }
	] : [
		{ value: 'SPAM', label: 'Spam' }, { value: 'HARASSMENT', label: 'Harassment' }, { value: 'INAPPROPRIATE', label: 'Inappropriate content' }, { value: 'COPYRIGHT', label: 'Copyright' }, { value: 'MISLEADING', label: 'Misleading' }, { value: 'OTHER', label: 'Other' }
	]);

	function close() {
		if (!submitting) { open = false; error = ''; }
	}

	async function submit() {
		if (submitting) return;
		submitting = true;
		error = '';
		try {
			const response = await fetch(`/api/moments/${encodeURIComponent(momentId)}/report`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ reason, details: details.trim() || undefined })
			});
			if (response.status !== 201) throw new Error('report-failed');
			details = '';
			open = false;
			onSuccess?.();
		} catch {
			error = copy.failed;
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:window onkeydown={(event) => { if (event.key === 'Escape' && open) close(); }} />

{#if open}
	<div class="fixed inset-0 z-50 grid place-items-center bg-plum/35 p-4" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) close(); }}>
		<div role="dialog" aria-modal="true" aria-labelledby={`report-title-${momentId}`} class="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
			<h2 id={`report-title-${momentId}`} class="font-display text-lg font-extrabold text-plum">{copy.title}</h2>
			<label class="mt-4 block text-xs font-bold text-plum" for={`report-reason-${momentId}`}>{isThai ? 'เหตุผล' : 'Reason'}</label>
			<select id={`report-reason-${momentId}`} bind:value={reason} class="mt-1 w-full rounded-xl border border-[#ded8df] bg-white px-3 py-2.5 text-sm outline-none focus:border-coral">
				{#each reasons as item}<option value={item.value}>{item.label}</option>{/each}
			</select>
			<label class="mt-3 block text-xs font-bold text-plum" for={`report-details-${momentId}`}>{copy.details}</label>
			<textarea id={`report-details-${momentId}`} bind:value={details} maxlength="2000" rows="4" class="mt-1 w-full resize-none rounded-xl border border-[#ded8df] px-3 py-2.5 text-sm outline-none focus:border-coral"></textarea>
			{#if error}<p class="mt-2 text-xs text-coral-dark" role="alert">{error}</p>{/if}
			<div class="mt-5 flex justify-end gap-2"><button type="button" onclick={close} disabled={submitting} class="halo-focus-ring rounded-full px-4 py-2 text-sm font-bold text-plum hover:bg-plum/[.05]">{copy.cancel}</button><button type="button" onclick={submit} disabled={submitting} class="halo-focus-ring rounded-full bg-coral px-4 py-2 text-sm font-bold text-white hover:bg-coral-dark disabled:opacity-60">{submitting ? copy.sending : copy.submit}</button></div>
		</div>
	</div>
{/if}
