<script lang="ts">
	import { goto } from '$app/navigation';
	import MemberPageHeader from '$lib/components/profile/MemberPageHeader.svelte';
	import SubscriptionForm from '$lib/components/subscriptions/SubscriptionForm.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import { localizedHref } from '$lib/i18n/link.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	async function saved(id: string) {
		await goto(localizedHref(`/subscriptions/${id}`, data.lang), { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>{m.subscriptions_add()} · GL Orbit</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="w-full pb-24 pt-5 sm:pt-8 md:pb-12">
	<a
		class="touch-target inline-flex min-h-11 items-center font-semibold text-plum underline-offset-4 hover:underline"
		href={localizedHref('/subscriptions', data.lang)}
	>
		← {m.subscriptions_cancel()}
	</a>
	<div class="mt-4">
		<MemberPageHeader title={m.subscriptions_add()} />
	</div>
	<div class="mt-6 border border-[var(--orbit-line)] bg-white p-4 sm:p-8">
		<SubscriptionForm
			mode="create"
			platforms={data.platforms}
			currencies={data.currencies}
			subscription={null}
			onSaved={saved}
		/>
	</div>
</main>
