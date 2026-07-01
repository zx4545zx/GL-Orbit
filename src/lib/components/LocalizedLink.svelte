<script lang="ts">

	import { page } from '$app/state';	import { localizedHref } from '$lib/i18n/link.js';

	let {
		href,
		children,
		class: className = '',
		...rest
	}: {
		href: string;
		children: () => any;
		class?: string;
		[key: string]: unknown;
	} = $props();

	const resolvedHref = $derived(localizedHref(href, page.data.lang ?? 'th'));
</script>

<a href={resolvedHref} class={className} {...rest}>{@render children()}</a>
