<script lang="ts">
	import type { SeriesStatus } from '$lib/admin/editor-types.js';

	let { status }: { status: SeriesStatus } = $props();

	const config: Record<SeriesStatus, { text: string; class: string }> = {
		UPCOMING: { text: 'กำลังจะมาฉาย', class: 'bg-lavender/20 text-lavender-dark' },
		ONGOING: { text: 'กำลังฉาย', class: 'bg-mint/20 text-mint-dark' },
		ENDED: { text: 'จบแล้ว', class: 'bg-coral/10 text-coral-dark' }
	};
</script>

<span
	class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap {config[status].class}"
>
	{config[status].text}
</span>
