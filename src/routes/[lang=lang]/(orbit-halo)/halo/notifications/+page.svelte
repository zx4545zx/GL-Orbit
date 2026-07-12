<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/i18n/paraglide.js';
	import HaloIcon from '$lib/components/moments/HaloIcon.svelte';
	import HaloPageHeader from '$lib/components/moments/HaloPageHeader.svelte';
	const isThai = $derived(page.data.lang === 'th');
	const notices = $derived([
		{ kind: 'heart', name: 'Mali S.', copy: isThai ? 'ถูกใจ Moment ของคุณ' : 'liked your Moment.', time: isThai ? '12 นาที' : '12m', unread: true },
		{ kind: 'comment', name: 'June', copy: isThai ? 'แสดงความคิดเห็นว่า “ซีนนี้อบอุ่นมาก”' : 'commented “This scene felt so warm.”', time: isThai ? '1 ชั่วโมง' : '1h', unread: true },
		{ kind: 'spark', name: 'Orbit Halo', copy: isThai ? 'Moment ของคุณถูกเพิ่มเข้า #LingOrm' : 'Your Moment joined #LingOrm.', time: isThai ? 'เมื่อวาน' : 'Yesterday', unread: false }
	]);
</script>

<HaloPageHeader kicker={isThai ? 'ล่าสุด' : 'Latest'} title={m.halo_alerts_title()} icon="bell" meta={isThai ? '2 ใหม่' : '2 new'} />
<div>
	{#each notices as notice}
		<a href={`/${page.data.lang}/halo/moments/moonlit-premiere`} class="relative flex gap-3 border-b border-[#eee9ef] px-4 py-4 transition hover:bg-[#fafafa] sm:px-5">
			{#if notice.unread}<span class="absolute left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-coral"></span>{/if}
			<span class="ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-coral/10 text-coral-dark"><HaloIcon name={notice.kind} size={16} /></span>
			<span class="min-w-0 flex-1 text-sm leading-5 text-plum"><strong>{notice.name}</strong> {notice.copy}<span class="mt-1 block text-xs text-plum-light">{notice.time}</span></span>
		</a>
	{/each}
</div>
