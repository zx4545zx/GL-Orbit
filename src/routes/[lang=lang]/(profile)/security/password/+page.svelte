<script lang="ts">
	import { page } from '$app/state';
	import MemberPageHeader from '$lib/components/profile/MemberPageHeader.svelte';
	import PasswordChangeForm from '$lib/components/profile/PasswordChangeForm.svelte';
	import { m } from '$lib/i18n/paraglide.js';
</script>

<svelte:head><title>{m.profile_change_password_title()} | GL Orbit</title><meta name="robots" content="noindex, nofollow" /></svelte:head>

<section class="grid w-full gap-4 pb-24 pt-5 sm:pt-8 md:pb-12" aria-labelledby="password-heading">
	<MemberPageHeader
		title={m.profile_change_password_title()}
		description={m.profile_security_section_desc()}
		eyebrow={m.profile_security_section()}
		headingId="password-heading"
	/>
	<PasswordChangeForm lang={page.data.lang} />
</section>
