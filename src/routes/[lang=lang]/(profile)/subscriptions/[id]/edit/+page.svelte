<script lang="ts">
	import { goto } from '$app/navigation';
	import OrbitIcon from '$lib/components/OrbitIcon.svelte';
	import MemberPageHeader from '$lib/components/profile/MemberPageHeader.svelte';
	import SubscriptionForm from '$lib/components/subscriptions/SubscriptionForm.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import { subscriptionFetch } from '$lib/subscriptions/client.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
	const detailHref = $derived(
		localizedHref(`/subscriptions/${data.subscription.id}`, data.lang)
	);

	async function saved() {
		await goto(detailHref, { invalidateAll: true });
	}

	async function deleted() {
		await subscriptionFetch(`/api/subscriptions/${data.subscription.id}`, { method: 'DELETE' });
		await goto(localizedHref('/subscriptions', data.lang), { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>{m.subscriptions_edit()} · GL Orbit</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="w-full pb-24 pt-5 sm:pt-8 md:pb-12">
	<a
		class="touch-target inline-flex min-h-11 items-center gap-2 font-semibold text-plum underline-offset-4 hover:underline"
		href={detailHref}
	>
		<OrbitIcon name="arrow-left" className="h-4 w-4" />
		{m.subscriptions_cancel()}
	</a>
	<div class="mt-4">
		<MemberPageHeader
			title={m.subscriptions_edit()}
			eyebrow={data.subscription.platform?.name ?? data.subscription.customPlatformName ?? 'GL Orbit'}
		/>
	</div>
	<div class="mt-6 border border-[var(--orbit-line)] bg-white p-4 sm:p-8">
		<SubscriptionForm
			mode="edit"
			platforms={data.platforms}
			currencies={data.currencies}
			subscription={data.subscription}
			onSaved={saved}
			onDelete={deleted}
		/>
	</div>
</main>
