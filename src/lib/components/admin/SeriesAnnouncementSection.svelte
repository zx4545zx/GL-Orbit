<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	type RecipientType = 'followers' | 'global';
	type TemplateId = 'new-episode' | 'link-updated' | 'general-update';

	let { seriesId, seriesTitle, lang }: { seriesId: string; seriesTitle: string; lang: 'th' | 'en' } = $props();

	let recipientType = $state<RecipientType>('followers');
	let templateId = $state<TemplateId>('new-episode');
	let sending = $state(false);
	let statusMessage = $state('');
	let errorMessage = $state('');

	function templateMessage(id: TemplateId) {
		const options = { locale: lang } as const;
		if (id === 'new-episode') return m.series_announcement_template_new_episode_message({ series: seriesTitle }, options);
		if (id === 'link-updated') return m.series_announcement_template_link_updated_message({ series: seriesTitle }, options);
		return m.series_announcement_template_general_update_message({ series: seriesTitle }, options);
	}

	let message = $state(templateMessage('new-episode'));
	const messageMaxLength = 500;
	const remaining = $derived(messageMaxLength - message.length);
	const canSubmit = $derived(Boolean(message.trim()) && !sending);

	function selectTemplate(id: TemplateId) {
		templateId = id;
		message = templateMessage(id);
		statusMessage = '';
		errorMessage = '';
	}

	async function submit() {
		if (!canSubmit) return;
		if (recipientType === 'global' && !window.confirm(m.series_announcement_confirm_all({}, { locale: lang }))) return;

		sending = true;
		statusMessage = '';
		errorMessage = '';
		try {
			const response = await fetch('/api/notifications/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ seriesId, recipientType, message: message.trim() })
			});
			const payload = (await response.json().catch(() => null)) as { error?: string; sentCount?: number } | null;
			if (!response.ok) {
				errorMessage = payload?.error ?? m.series_announcement_error({}, { locale: lang });
				return;
			}
			statusMessage = m.series_announcement_sent({ count: String(payload?.sentCount ?? 0) }, { locale: lang });
		} catch {
			errorMessage = m.series_announcement_error({}, { locale: lang });
		} finally {
			sending = false;
		}
	}
</script>

<section class="space-y-6" aria-labelledby="series-announcement-heading">
	<header class="border-b border-[var(--orbit-line)] pb-4">
		<h2 id="series-announcement-heading" class="text-xl font-bold text-[var(--orbit-ink)]">{m.series_announcement_heading({}, { locale: lang })}</h2>
		<p class="mt-1 text-sm text-[var(--orbit-muted)]">{m.series_announcement_description({}, { locale: lang })}</p>
	</header>

	<form class="space-y-5" onsubmit={(event) => { event.preventDefault(); void submit(); }}>
		<fieldset class="space-y-2">
			<legend class="text-sm font-semibold text-[var(--orbit-ink)]">{m.series_announcement_template_label({}, { locale: lang })}</legend>
			<div class="grid gap-2 sm:grid-cols-3">
				{#each [
					{ id: 'new-episode' as const, label: m.series_announcement_template_new_episode({}, { locale: lang }) },
					{ id: 'link-updated' as const, label: m.series_announcement_template_link_updated({}, { locale: lang }) },
					{ id: 'general-update' as const, label: m.series_announcement_template_general_update({}, { locale: lang }) }
				] as template}
					<button type="button" onclick={() => selectTemplate(template.id)} class="rounded-xl border px-3 py-3 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 {templateId === template.id ? 'border-coral bg-coral/10 text-coral-dark' : 'border-[var(--orbit-line)] text-[var(--orbit-ink)] hover:border-coral/50'}">
						{template.label}
					</button>
				{/each}
			</div>
		</fieldset>

		<fieldset class="space-y-2">
			<legend class="text-sm font-semibold text-[var(--orbit-ink)]">{m.series_announcement_audience_label({}, { locale: lang })}</legend>
			<div class="flex flex-col gap-2 sm:flex-row sm:gap-5">
				<label class="flex items-center gap-2 text-sm text-[var(--orbit-ink)]"><input type="radio" bind:group={recipientType} value="followers" /> {m.series_announcement_audience_followers({}, { locale: lang })}</label>
				<label class="flex items-center gap-2 text-sm text-[var(--orbit-ink)]"><input type="radio" bind:group={recipientType} value="global" /> {m.series_announcement_audience_all({}, { locale: lang })}</label>
			</div>
			{#if recipientType === 'global'}<p class="text-xs text-coral-dark">{m.series_announcement_audience_all_hint({}, { locale: lang })}</p>{/if}
		</fieldset>

		<label class="grid gap-2 text-sm font-semibold text-[var(--orbit-ink)]" for="series-announcement-message">
			{m.series_announcement_message_label({}, { locale: lang })}
			<textarea id="series-announcement-message" bind:value={message} required maxlength={messageMaxLength} rows="5" placeholder={m.series_announcement_message_placeholder({}, { locale: lang })} class="orbit-control resize-y px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2"></textarea>
			<span class="text-right text-xs font-normal text-[var(--orbit-muted)]">{m.series_announcement_remaining({ count: String(remaining) }, { locale: lang })}</span>
		</label>

		<button type="submit" disabled={!canSubmit} class="orbit-action min-h-11 px-4 focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50">
			{sending ? m.series_announcement_sending({}, { locale: lang }) : m.series_announcement_send({}, { locale: lang })}
		</button>
	</form>

	{#if errorMessage}<p role="alert" class="border border-coral p-3 text-sm text-coral-dark">{errorMessage}</p>{/if}
	{#if statusMessage}<p aria-live="polite" class="border border-mint p-3 text-sm text-mint-dark">{statusMessage}</p>{/if}
</section>
