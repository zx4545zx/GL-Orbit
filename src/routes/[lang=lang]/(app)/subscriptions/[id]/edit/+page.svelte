<script lang="ts">
	import { goto } from '$app/navigation';
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

<main class="mx-auto w-full max-w-4xl pb-24 pt-5 sm:pt-8 md:pb-12">
	<a
		class="touch-target inline-flex min-h-11 items-center font-semibold text-plum underline-offset-4 hover:underline"
		href={detailHref}
	>
		← {m.subscriptions_cancel()}
	</a>
	<header class="mt-4 border border-[var(--orbit-line)] bg-white p-5 sm:p-7">
		<p class="text-xs font-bold uppercase tracking-[0.18em] text-coral">
			{data.subscription.platform?.name ?? data.subscription.customPlatformName}
		</p>
		<h1 class="mt-2 font-display text-3xl text-plum sm:text-4xl">{m.subscriptions_edit()}</h1>
	</header>
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
