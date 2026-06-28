<script lang="ts">
	import ChatApp from '$lib/components/chat/ChatApp.svelte';

	let { data } = $props();
</script>

{#key 'new'}
	<ChatApp
		conversations={data.conversations}
		activeConversation={data.activeConversation}
		initialMessages={data.messages}
	/>
{/key}
