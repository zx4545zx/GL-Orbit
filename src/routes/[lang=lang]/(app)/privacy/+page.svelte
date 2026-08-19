<!--
THESIS: A plain-language privacy field guide, not a wall of legal text.
OWN-WORLD: GL-Orbit's existing editorial type, paper surfaces, strong rules, and theme tokens.
STORY: See the short promise first, then scan collection, use, sharing, retention, and controls.
FIRST VIEWPORT: Split masthead with title, concise explanation, revision date, and a ruled summary.
FORM: A responsive policy memo with a sticky table of contents; the incumbent visual system stays unchanged.
-->
<script lang="ts">
	import { page } from '$app/state';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';
	import { m } from '$lib/i18n/paraglide.js';
	import {
		DEFAULT_OG_IMAGE,
		OG_IMAGE_HEIGHT,
		OG_IMAGE_TYPE,
		OG_IMAGE_WIDTH,
		absoluteUrl,
		buildBreadcrumbJsonLd,
		buildCanonicalUrl,
		buildWebPageJsonLd,
		jsonLdScript,
		localizedPath,
		safeJsonLd
	} from '$lib/seo.js';

	const LAST_UPDATED = '2026-08-19';
	const canonicalPath = '/privacy';
	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));

	const tableOfContents = [
		{ id: 'data', label: m.privacy_section_data() },
		{ id: 'use', label: m.privacy_section_use() },
		{ id: 'storage', label: m.privacy_section_storage() },
		{ id: 'sharing', label: m.privacy_section_sharing() },
		{ id: 'visibility', label: m.privacy_section_visibility() },
		{ id: 'retention', label: m.privacy_section_retention() },
		{ id: 'security', label: m.privacy_section_security() },
		{ id: 'controls', label: m.privacy_section_controls() },
		{ id: 'changes', label: m.privacy_section_changes() }
	] as const;

	const dataItems = [
		{ title: m.privacy_data_account_title(), description: m.privacy_data_account_desc() },
		{ title: m.privacy_data_activity_title(), description: m.privacy_data_activity_desc() },
		{ title: m.privacy_data_community_title(), description: m.privacy_data_community_desc() },
		{ title: m.privacy_data_ai_title(), description: m.privacy_data_ai_desc() },
		{ title: m.privacy_data_technical_title(), description: m.privacy_data_technical_desc() }
	] as const;

	const useItems = [
		m.privacy_use_1(),
		m.privacy_use_2(),
		m.privacy_use_3(),
		m.privacy_use_4(),
		m.privacy_use_5()
	] as const;

	const storageItems = [
		m.privacy_storage_1(),
		m.privacy_storage_2(),
		m.privacy_storage_3(),
		m.privacy_storage_4()
	] as const;

	const sharingItems = [
		m.privacy_sharing_1(),
		m.privacy_sharing_2(),
		m.privacy_sharing_3(),
		m.privacy_sharing_4()
	] as const;

	const retentionItems = [m.privacy_retention_1(), m.privacy_retention_2(), m.privacy_retention_3()] as const;
	const securityItems = [m.privacy_security_1(), m.privacy_security_2(), m.privacy_security_3()] as const;

	const policyJsonLd = $derived(safeJsonLd([
		{
			...buildWebPageJsonLd(
				page.url.origin,
				localizedPath(currentLang, canonicalPath),
				m.privacy_seo_title(),
				m.privacy_seo_description(),
				currentLang
			),
			dateModified: LAST_UPDATED
		},
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: m.privacy_breadcrumb_home(), path: localizedPath(currentLang, '') },
			{ name: m.privacy_breadcrumb(), path: localizedPath(currentLang, canonicalPath) }
		])
	]));
</script>

<svelte:head>
	<title>{m.privacy_seo_title()}</title>
	<meta name="description" content={m.privacy_seo_description()} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={m.privacy_seo_title()} />
	<meta property="og:description" content={m.privacy_seo_description()} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:title" content={m.privacy_seo_title()} />
	<meta name="twitter:description" content={m.privacy_seo_description()} />
	{@html jsonLdScript(policyJsonLd)}
</svelte:head>

<main class="mx-auto w-full max-w-6xl pb-24 pt-8 sm:pt-12 md:pb-16">
	<header class="policy-masthead">
		<div>
			<p class="orbit-index">{m.privacy_badge()}</p>
			<h1>{m.privacy_title()}</h1>
		</div>
		<div class="policy-intro">
			<p>{m.privacy_intro()}</p>
			<time datetime={LAST_UPDATED}>{m.privacy_last_updated({ date: m.privacy_last_updated_date() })}</time>
		</div>
		<div class="policy-summary">
			<strong>{m.privacy_summary_label()}</strong>
			<p>{m.privacy_summary()}</p>
		</div>
	</header>

	<div class="policy-layout">
		<nav class="policy-toc" aria-label={m.privacy_toc_label()}>
			<p>{m.privacy_toc_label()}</p>
			<ul>
				{#each tableOfContents as item}
					<li><a href={`#${item.id}`}>{item.label}</a></li>
				{/each}
			</ul>
		</nav>

		<article class="policy-copy">
			<section id="data" class="policy-section">
				<h2>{m.privacy_section_data()}</h2>
				<p>{m.privacy_data_intro()}</p>
				<dl class="policy-data-list">
					{#each dataItems as item}
						<div>
							<dt>{item.title}</dt>
							<dd>{item.description}</dd>
						</div>
					{/each}
				</dl>
			</section>

			<section id="use" class="policy-section">
				<h2>{m.privacy_section_use()}</h2>
				<p>{m.privacy_use_intro()}</p>
				<ul class="policy-list">
					{#each useItems as item}<li>{item}</li>{/each}
				</ul>
			</section>

			<section id="storage" class="policy-section">
				<h2>{m.privacy_section_storage()}</h2>
				<p>{m.privacy_storage_intro()}</p>
				<ul class="policy-list">
					{#each storageItems as item}<li>{item}</li>{/each}
				</ul>
			</section>

			<section id="sharing" class="policy-section">
				<h2>{m.privacy_section_sharing()}</h2>
				<p>{m.privacy_sharing_intro()}</p>
				<ul class="policy-list">
					{#each sharingItems as item}<li>{item}</li>{/each}
				</ul>
			</section>

			<section id="visibility" class="policy-section">
				<h2>{m.privacy_section_visibility()}</h2>
				<dl class="policy-visibility">
					<div>
						<dt>{m.privacy_visibility_public_label()}</dt>
						<dd>{m.privacy_visibility_public()}</dd>
					</div>
					<div>
						<dt>{m.privacy_visibility_private_label()}</dt>
						<dd>{m.privacy_visibility_private()}</dd>
					</div>
				</dl>
			</section>

			<section id="retention" class="policy-section">
				<h2>{m.privacy_section_retention()}</h2>
				<ul class="policy-list">
					{#each retentionItems as item}<li>{item}</li>{/each}
				</ul>
			</section>

			<section id="security" class="policy-section">
				<h2>{m.privacy_section_security()}</h2>
				<p>{m.privacy_security_intro()}</p>
				<ul class="policy-list">
					{#each securityItems as item}<li>{item}</li>{/each}
				</ul>
			</section>

			<section id="controls" class="policy-section">
				<h2>{m.privacy_section_controls()}</h2>
				<p>{m.privacy_controls_intro()}</p>
				<div class="policy-links">
					<a href="/{page.data.lang}/account/profile">{m.privacy_controls_profile()}</a>
					<a href="/{page.data.lang}/security/session">{m.privacy_controls_sessions()}</a>
					<a href="/{page.data.lang}/settings/ai">{m.privacy_controls_ai()}</a>
					<a href="/{page.data.lang}/chat">{m.privacy_controls_chat()}</a>
				</div>
				<p class="policy-notice">{m.privacy_controls_notice()}</p>
			</section>

			<section id="changes" class="policy-section">
				<h2>{m.privacy_section_changes()}</h2>
				<p>{m.privacy_changes_body()}</p>
			</section>
		</article>
	</div>
</main>

<style>
	main {
		--policy-body: var(--orbit-ink);
		--policy-body: color-mix(in srgb, var(--orbit-muted) 82%, var(--orbit-ink));
		--policy-accent-text: var(--orbit-coral-dark);
		--policy-accent-text: color-mix(in srgb, var(--orbit-coral-dark) 78%, var(--orbit-ink));
		--policy-link: var(--orbit-link);
		--policy-link: color-mix(in srgb, var(--orbit-link) 70%, var(--orbit-ink));
	}

	.policy-masthead {
		display: grid;
		gap: 1.5rem;
		border-block: var(--orbit-border-width, 1px) var(--orbit-border-style, solid) var(--orbit-line-strong);
		padding-block: clamp(2rem, 6vw, 4.5rem);
	}

	.policy-masthead .orbit-index {
		color: var(--policy-accent-text);
	}

	.policy-masthead h1 {
		max-width: 10ch;
		margin-top: 0.75rem;
		font-family: var(--orbit-font-display);
		font-size: clamp(2.5rem, 8vw, 5.25rem);
		font-weight: var(--orbit-font-heading-weight, 700);
		letter-spacing: -0.03em;
		line-height: 1.02;
		color: var(--orbit-ink);
		text-wrap: balance;
	}

	.policy-intro {
		align-self: end;
		max-width: 38rem;
	}

	.policy-intro p,
	.policy-summary p {
		font-size: 1rem;
		line-height: 1.8;
		color: var(--policy-body);
	}

	.policy-intro time {
		display: block;
		margin-top: 1rem;
		font-size: 0.75rem;
		font-weight: var(--orbit-font-label-weight, 600);
		color: var(--policy-accent-text);
	}

	.policy-summary {
		display: grid;
		gap: 0.75rem;
		border-top: var(--orbit-border-width, 1px) var(--orbit-border-style, solid) var(--orbit-line);
		padding-top: 1.25rem;
	}

	.policy-summary strong {
		font-family: var(--orbit-font-display);
		font-size: 0.875rem;
		color: var(--orbit-ink);
	}

	.policy-layout {
		display: grid;
		gap: 3rem;
		padding-top: clamp(2.5rem, 7vw, 5rem);
	}

	.policy-toc {
		align-self: start;
		border-bottom: var(--orbit-border-width, 1px) var(--orbit-border-style, solid) var(--orbit-line);
		padding-bottom: 1.25rem;
	}

	.policy-toc > p {
		font-family: var(--orbit-font-display);
		font-size: 0.75rem;
		font-weight: var(--orbit-font-label-weight, 600);
		color: var(--policy-accent-text);
	}

	.policy-toc ul {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.25rem 1rem;
		margin-top: 0.75rem;
	}

	.policy-toc a {
		display: inline-flex;
		min-height: 2.75rem;
		align-items: center;
		font-size: 0.8125rem;
		font-weight: 600;
		line-height: 1.35;
		color: var(--policy-body);
		text-decoration-color: transparent;
		text-underline-offset: 0.25rem;
	}

	.policy-toc a:hover {
		color: var(--policy-link);
		text-decoration-line: underline;
		text-decoration-color: currentColor;
	}

	.policy-toc a:focus-visible,
	.policy-links a:focus-visible {
		outline: 2px solid var(--orbit-focus);
		outline-offset: 3px;
	}

	.policy-copy {
		min-width: 0;
		max-width: 46rem;
	}

	.policy-section {
		scroll-margin-top: 2rem;
		border-top: var(--orbit-border-width, 1px) var(--orbit-border-style, solid) var(--orbit-line);
		padding-block: clamp(2.75rem, 7vw, 4.5rem);
	}

	.policy-section:first-child {
		border-top: 0;
		padding-top: 0;
	}

	.policy-section h2 {
		margin-bottom: 1rem;
		font-family: var(--orbit-font-display);
		font-size: clamp(1.5rem, 4vw, 2rem);
		font-weight: var(--orbit-font-heading-weight, 700);
		letter-spacing: -0.02em;
		line-height: 1.25;
		color: var(--orbit-ink);
		text-wrap: balance;
	}

	.policy-section > p,
	.policy-list,
	.policy-data-list dd,
	.policy-visibility dd {
		font-size: 0.9375rem;
		line-height: 1.85;
		color: var(--policy-body);
	}

	.policy-data-list {
		margin-top: 2rem;
		border-top: var(--orbit-border-width, 1px) var(--orbit-border-style, solid) var(--orbit-line);
	}

	.policy-data-list > div,
	.policy-visibility > div {
		display: grid;
		gap: 0.5rem;
		border-bottom: var(--orbit-border-width, 1px) var(--orbit-border-style, solid) var(--orbit-line);
		padding-block: 1.25rem;
	}

	.policy-data-list dt,
	.policy-visibility dt {
		font-family: var(--orbit-font-display);
		font-size: 0.9375rem;
		font-weight: var(--orbit-font-label-weight, 600);
		line-height: 1.5;
		color: var(--orbit-ink);
	}

	.policy-list {
		display: grid;
		gap: 0.875rem;
		margin-top: 1.5rem;
		padding-left: 1.15rem;
		list-style: disc;
	}

	.policy-list li::marker {
		color: var(--orbit-coral);
	}

	.policy-visibility {
		margin-top: 1.5rem;
		border-top: var(--orbit-border-width, 1px) var(--orbit-border-style, solid) var(--orbit-line);
	}

	.policy-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin-top: 1.5rem;
	}

	.policy-links a {
		min-height: 2.75rem;
		display: inline-flex;
		align-items: center;
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--policy-link);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.3rem;
	}

	.policy-notice {
		margin-top: 1.5rem;
		background: var(--orbit-coral-soft);
		padding: 1rem 1.125rem;
		color: var(--orbit-ink) !important;
	}

	@media (min-width: 640px) {
		.policy-masthead {
			grid-template-columns: minmax(0, 1.05fr) minmax(18rem, 0.95fr);
			column-gap: 3rem;
		}

		.policy-summary {
			grid-column: 1 / -1;
			grid-template-columns: minmax(8rem, 0.4fr) minmax(0, 1.6fr);
			gap: 2rem;
		}

		.policy-data-list > div,
		.policy-visibility > div {
			grid-template-columns: minmax(9rem, 0.45fr) minmax(0, 1.55fr);
			gap: 2rem;
		}
	}

	@media (min-width: 1024px) {
		.policy-layout {
			grid-template-columns: 14rem minmax(0, 46rem);
			justify-content: center;
			gap: 4.5rem;
		}

		.policy-toc {
			position: sticky;
			top: 2rem;
			border-bottom: 0;
			padding-bottom: 0;
		}

		.policy-toc ul {
			grid-template-columns: 1fr;
		}
	}
</style>
