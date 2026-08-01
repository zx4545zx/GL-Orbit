<script lang="ts">
	import { page } from '$app/state';
	import MemberPageHeader from '$lib/components/profile/MemberPageHeader.svelte';
	import ProfileEditForm from '$lib/components/profile/ProfileEditForm.svelte';
	import { m } from '$lib/i18n/paraglide.js';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{m.profile_edit()} | GL Orbit</title><meta name="robots" content="noindex, nofollow" /></svelte:head>

<section class="grid w-full gap-4 pb-24 pt-5 sm:pt-8 md:pb-12" aria-labelledby="edit-profile-heading">
	<MemberPageHeader
		title={m.profile_edit()}
		description={m.profile_profile_section_desc()}
		eyebrow={m.profile_nav_account()}
		headingId="edit-profile-heading"
	/>
	<ProfileEditForm user={data.profileUser} lang={page.data.lang} />
</section>
