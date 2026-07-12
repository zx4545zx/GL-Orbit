<script lang="ts">
	let { count = 1, tallEmbed = false }: { count?: number; tallEmbed?: boolean } = $props();
</script>

{#each Array.from({ length: count }) as _, index (index)}
	<article class="border-b border-[#eee9ef] bg-white px-4 py-4 sm:px-5" aria-busy="true" aria-label="Loading moment">
		<div class="flex animate-pulse gap-3">
			<div class="h-10 w-10 shrink-0 rounded-full bg-plum/10"></div>
			<div class="min-w-0 flex-1">
				<header class="flex items-start gap-2">
					<div class="min-w-0 flex-1 space-y-1.5">
						<div class="flex items-center gap-2">
							<div class="h-3.5 w-24 rounded bg-plum/12"></div>
							<div class="h-3 w-28 rounded bg-plum/8"></div>
						</div>
					</div>
				</header>

				<div class="mt-2 space-y-2">
					<div class="h-3.5 w-full rounded bg-plum/8"></div>
					<div class="h-3.5 w-11/12 rounded bg-plum/8"></div>
					<div class="h-3.5 w-4/5 rounded bg-plum/8"></div>
				</div>

				<div class="mt-2 flex flex-wrap gap-1.5">
					<div class="h-5 w-16 rounded-full bg-coral/10"></div>
					<div class="h-5 w-20 rounded-full bg-coral/10"></div>
				</div>

				<div class="mt-3 w-full overflow-hidden rounded-2xl bg-plum/8 {tallEmbed ? 'min-h-[520px]' : 'h-64'}"></div>

				<div class="mt-2 flex max-w-md items-center justify-between">
					<div class="flex h-8 items-center gap-1.5 rounded-full px-2">
						<div class="h-4 w-4 rounded-full bg-plum/10"></div>
						<div class="h-3 w-5 rounded bg-plum/10"></div>
					</div>
					<div class="flex h-8 items-center gap-1.5 rounded-full px-2">
						<div class="h-4 w-4 rounded-full bg-plum/10"></div>
						<div class="h-3 w-5 rounded bg-plum/10"></div>
					</div>
					<div class="grid h-8 w-8 place-items-center rounded-full">
						<div class="h-4 w-4 rounded-full bg-plum/10"></div>
					</div>
					<div class="grid h-8 w-8 place-items-center rounded-full">
						<div class="h-4 w-4 rounded-full bg-plum/10"></div>
					</div>
				</div>
			</div>
		</div>
	</article>
{/each}
