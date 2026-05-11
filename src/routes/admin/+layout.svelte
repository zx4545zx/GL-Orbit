<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white shadow-sm px-6 py-4">
		<h1 class="text-lg font-semibold text-gray-800">GL-Orbit Admin</h1>
	</header>
	<main class="max-w-6xl mx-auto px-4 py-6">
		{@render children()}
	</main>
</div>
