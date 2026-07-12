<script lang="ts">
	let { size = 36 }: { size?: number } = $props();
</script>

<span class="relative grid shrink-0 place-items-center rounded-full bg-plum" style={`width:${size}px;height:${size}px`} aria-hidden="true">
	<span class="absolute h-[56%] w-[86%] -rotate-[18deg] rounded-[50%] border border-coral-light"></span>
	<span class="h-[22%] w-[22%] rounded-full bg-coral"></span>
</span>
