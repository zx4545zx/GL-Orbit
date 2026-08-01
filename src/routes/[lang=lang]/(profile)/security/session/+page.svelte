<script lang="ts">
	import { page } from '$app/state';
	import MemberPageHeader from '$lib/components/profile/MemberPageHeader.svelte';
	import SessionDeviceManager from '$lib/components/profile/SessionDeviceManager.svelte';
	import { m } from '$lib/i18n/paraglide.js';
</script>

<svelte:head><title>{m.profile_sessions_title()} | GL Orbit</title><meta name="robots" content="noindex, nofollow" /></svelte:head>

<section class="grid w-full gap-4 pb-24 pt-5 sm:pt-8 md:pb-12" aria-labelledby="sessions-heading">
	<MemberPageHeader
		title={m.profile_sessions_title()}
		eyebrow={m.profile_security_section()}
		headingId="sessions-heading"
	/>
	<SessionDeviceManager lang={page.data.lang} />
</section>
