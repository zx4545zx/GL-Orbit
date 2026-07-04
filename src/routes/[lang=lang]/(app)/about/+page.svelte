<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	import { page } from '$app/state';	import { DEFAULT_OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE, OG_IMAGE_WIDTH, SITE_NAME, absoluteUrl, buildBreadcrumbJsonLd, buildCanonicalUrl, buildWebPageJsonLd, jsonLdScript, localizedPath, safeJsonLd, schemaLanguage } from '$lib/seo.js';
	import type { AvailableLanguageTag } from '$lib/i18n/paraglide.js';

	const ABOUT_SEO_TITLE = m.about_hero_title();
	const ABOUT_SEO_DESCRIPTION = m.about_seo_description();

	const homepageGuideCards = [
		{
			title: m.about_guide_card_1_title(),
			description: m.about_guide_card_1_desc()
		},
		{
			title: m.about_guide_card_2_title(),
			description: m.about_guide_card_2_desc()
		},
		{
			title: m.about_guide_card_3_title(),
			description: m.about_guide_card_3_desc()
		}
	] as const;

	const homepageFaqs = [
		{
			question: m.about_faq_q_1(),
			answer: m.about_faq_a_1()
		},
		{
			question: m.about_faq_q_2(),
			answer: m.about_faq_a_2()
		},
		{
			question: m.about_faq_q_3(),
			answer: m.about_faq_a_3()
		},
		{
			question: m.about_faq_q_4(),
			answer: m.about_faq_a_4()
		},
		{
			question: m.about_faq_q_5(),
			answer: m.about_faq_a_5()
		},
		{
			question: m.about_faq_q_6(),
			answer: m.about_faq_a_6()
		},
		{
			question: m.about_faq_q_7(),
			answer: m.about_faq_a_7()
		}
	] as const;

	const glKnowledgeCards = [
		{
			title: m.about_gl101_card_1_title(),
			description: m.about_gl101_card_1_desc()
		},
		{
			title: m.about_gl101_card_2_title(),
			description: m.about_gl101_card_2_desc()
		},
		{
			title: m.about_gl101_card_3_title(),
			description: m.about_gl101_card_3_desc()
		},
		{
			title: m.about_gl101_card_4_title(),
			description: m.about_gl101_card_4_desc()
		}
	] as const;

	const platformCards = [
		{
			name: m.about_platform_1_name(),
			description: m.about_platform_1_desc()
		},
		{
			name: m.about_platform_2_name(),
			description: m.about_platform_2_desc()
		},
		{
			name: m.about_platform_3_name(),
			description: m.about_platform_3_desc()
		},
		{
			name: m.about_platform_4_name(),
			description: m.about_platform_4_desc()
		},
		{
			name: m.about_platform_5_name(),
			description: m.about_platform_5_desc()
		}
	] as const;


	const LAST_UPDATED = '2026-06-30';
	const LAST_UPDATED_LABEL = m.about_last_updated_date();

	const aiAnswerBlocks = [
		{
			question: m.about_ai_q_1(),
			answer: m.about_ai_a_1()
		},
		{
			question: m.about_ai_q_2(),
			answer: m.about_ai_a_2()
		},
		{
			question: m.about_ai_q_3(),
			answer: m.about_ai_a_3()
		},
		{
			question: m.about_ai_q_4(),
			answer: m.about_ai_a_4()
		}
	] as const;

	const howToSteps = [
		{
			name: m.about_howto_step_1_name(),
			text: m.about_howto_step_1_text(),
			path: '/countdown'
		},
		{
			name: m.about_howto_step_2_name(),
			text: m.about_howto_step_2_text(),
			path: '/calendar'
		},
		{
			name: m.about_howto_step_3_name(),
			text: m.about_howto_step_3_text(),
			path: '/series'
		},
		{
			name: m.about_howto_step_4_name(),
			text: m.about_howto_step_4_text(),
			path: '/'
		}
	] as const;

	const currentLang = $derived((page.data.lang === 'en' ? 'en' : 'th') as AvailableLanguageTag);
	const canonicalPath = '/about';
	const canonicalUrl = $derived(buildCanonicalUrl(page.url.origin, currentLang, canonicalPath));
	const aboutJsonLd = $derived(safeJsonLd([
		buildWebPageJsonLd(page.url.origin, localizedPath(currentLang, canonicalPath), ABOUT_SEO_TITLE, ABOUT_SEO_DESCRIPTION, currentLang),
		{
			'@context': 'https://schema.org',
			'@type': 'AboutPage',
			name: ABOUT_SEO_TITLE,
			description: ABOUT_SEO_DESCRIPTION,
			url: canonicalUrl,
			inLanguage: schemaLanguage(currentLang),
			isPartOf: {
				'@type': 'WebSite',
				name: SITE_NAME,
				url: absoluteUrl(page.url.origin, '/')
			},
			about: {
				'@type': 'Thing',
				name: 'Girls\' Love series'
			}
		},
		{
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: ABOUT_SEO_TITLE,
			description: ABOUT_SEO_DESCRIPTION,
			datePublished: LAST_UPDATED,
			dateModified: LAST_UPDATED,
			inLanguage: schemaLanguage(currentLang),
			mainEntityOfPage: canonicalUrl,
			image: absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE),
			author: {
				'@type': 'Organization',
				name: SITE_NAME,
				url: absoluteUrl(page.url.origin, '/')
			},
			publisher: {
				'@type': 'Organization',
				name: SITE_NAME,
				url: absoluteUrl(page.url.origin, '/'),
				logo: {
					'@type': 'ImageObject',
					url: absoluteUrl(page.url.origin, '/icons/gl-orbit-icon.png')
				}
			},
			articleSection: [m.about_article_section_1(), m.about_article_section_2(), m.about_article_section_3(), m.about_article_section_4()],
			keywords: [m.about_keyword_1(), m.about_keyword_2(), m.about_keyword_3(), m.about_keyword_4(), m.about_keyword_5()]
		},
		buildBreadcrumbJsonLd(page.url.origin, [
			{ name: m.about_breadcrumb_home(), path: localizedPath(currentLang, '') },
			{ name: m.about_breadcrumb_about(), path: localizedPath(currentLang, canonicalPath) }
		])
	]));
</script>

<svelte:head>
	<title>{m.about_hero_title()}</title>
	<meta name="description" content={m.about_hero_subtitle()} />
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={ABOUT_SEO_TITLE} />
	<meta property="og:description" content={ABOUT_SEO_DESCRIPTION} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={absoluteUrl(page.url.origin, DEFAULT_OG_IMAGE)} />
	<meta property="og:image:width" content={OG_IMAGE_WIDTH} />
	<meta property="og:image:height" content={OG_IMAGE_HEIGHT} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta name="twitter:title" content={ABOUT_SEO_TITLE} />
	<meta name="twitter:description" content={ABOUT_SEO_DESCRIPTION} />
	{@html jsonLdScript(aboutJsonLd)}
</svelte:head>

<!-- About page hero -->
<section class="relative -mx-4 overflow-hidden px-4 py-16 sm:py-24">
	<div class="absolute inset-0 bg-gradient-mesh pointer-events-none"></div>
	<div class="absolute -top-16 right-[-6rem] h-72 w-72 rounded-full bg-coral/15 blur-[80px] pointer-events-none"></div>
	<div class="absolute bottom-0 left-[-6rem] h-72 w-72 rounded-full bg-mint/15 blur-[80px] pointer-events-none"></div>

	<div class="relative mx-auto max-w-4xl text-center">
		<div class="inline-flex items-center gap-2 rounded-full border border-lavender/20 bg-white/65 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-coral-dark backdrop-blur-md">
			<span class="h-2 w-2 rounded-full bg-coral"></span>
			{m.about_hero_badge()}
		</div>
		<h1 class="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold leading-tight text-plum sm:text-6xl">
			{m.about_hero_title()}
		</h1>
		<p class="mx-auto mt-5 max-w-2xl text-base leading-8 text-plum-light sm:text-lg">
			{m.about_hero_subtitle()}
		</p>
		<p class="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum-light/70">
			{m.about_last_updated({ date: LAST_UPDATED_LABEL })}
		</p>
		<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
			<a href="/{page.data.lang}/calendar" class="touch-target inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-coral to-coral-dark px-6 py-3 font-semibold text-white shadow-xl shadow-coral/20 transition hover:scale-105">
				{m.about_cta_schedule()}
			</a>
			<a href="/{page.data.lang}/" class="touch-target inline-flex items-center justify-center rounded-2xl glass-card-strong px-6 py-3 font-semibold text-plum transition hover:scale-105">
				{m.about_cta_home()}
			</a>
		</div>
	</div>
</section>

<!-- Extractable answer blocks for AI search -->
<section class="relative -mx-4 px-4 py-12 sm:py-16 content-visibility-auto">
	<div class="mx-auto max-w-5xl">
		<div class="mb-7 max-w-2xl">
			<div class="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-coral-dark">
				<span class="h-2 w-2 rounded-full bg-coral"></span>
				{m.about_ai_section_badge()}
			</div>
			<h2 class="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-plum sm:text-3xl">
				{m.about_ai_section_title()}
			</h2>
			<p class="mt-3 text-sm leading-7 text-plum-light sm:text-base">
				{m.about_ai_section_desc()}
			</p>
		</div>
		<div class="grid gap-4 md:grid-cols-2">
			{#each aiAnswerBlocks as block}
				<article class="rounded-3xl border border-lavender/20 bg-white/70 p-5 shadow-sm shadow-lavender/10 backdrop-blur-sm">
					<h3 class="font-[family-name:var(--font-display)] text-lg font-bold text-plum">{block.question}</h3>
					<p class="mt-2 text-sm leading-7 text-plum-light">{block.answer}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- Editorial: The GL-Orbit Guide (unified magazine feature) -->
<section class="relative -mx-4 px-4 py-16 sm:py-24 content-visibility-auto overflow-hidden">
	<!-- single soft atmosphere (replaces 3 stacked gradients) -->
	<div class="absolute inset-0 bg-gradient-to-b from-cream via-white to-lavender/5 pointer-events-none"></div>
	<div class="absolute top-[12%] -right-24 w-72 h-72 sm:w-96 sm:h-96 bg-coral/8 rounded-full blur-[90px] animate-float pointer-events-none"></div>
	<div class="absolute bottom-[18%] -left-24 w-72 h-72 sm:w-96 sm:h-96 bg-mint/8 rounded-full blur-[90px] animate-float-delayed pointer-events-none"></div>

	<div class="relative mx-auto max-w-5xl">

		<!-- §01 — Lede: what is GL-Orbit -->
		<header class="edi-head">
			<span class="edi-eyebrow"><span class="edi-dot bg-coral"></span>§ 01 · {m.about_guide_badge()}</span>
			<h2 class="edi-title">{m.about_guide_title()}</h2>
		</header>
		<div class="edi-lede">
			<p class="edi-prose dropcap">{m.about_hero_lede_1()}</p>
			<blockquote class="edi-pullquote">{m.about_pullquote()}</blockquote>
			<p class="edi-prose">{m.about_hero_lede_2()}</p>
			<p class="edi-prose">{m.about_hero_lede_3()}</p>
			<p class="edi-prose">{m.about_hero_lede_4()}</p>
		</div>

		<!-- pillars (3 things GL-Orbit does) -->
		<div class="edi-pillars">
			{#each homepageGuideCards as card, i}
				<article class="edi-pillar">
					<span class="edi-pillar-num">{('0' + (i + 1)).slice(-2)}</span>
					<h3>{card.title}</h3>
					<p>{card.description}</p>
				</article>
			{/each}
		</div>

		<!-- §02 — How to use (stepper) -->
		<header class="edi-head edi-spacer">
			<span class="edi-eyebrow"><span class="edi-dot bg-lavender-dark"></span>§ 02 · {m.about_howto_badge()}</span>
			<h2 class="edi-title">{m.about_howto_title()}</h2>
		</header>
		<ol class="edi-steps">
			{#each howToSteps as step, i}
				<li class="edi-step">
					<span class="edi-step-num">{i + 1}</span>
					<div>
						<h3>{step.name}</h3>
						<p>{step.text}</p>
					</div>
				</li>
			{/each}
		</ol>

		<!-- §03 — GL 101 (numbered entries) -->
		<header class="edi-head edi-spacer">
			<span class="edi-eyebrow"><span class="edi-dot bg-mint"></span>§ 03 · {m.about_gl101_badge()}</span>
			<h2 class="edi-title">{m.about_gl101_title()}</h2>
		</header>
		<p class="edi-lead">
			{m.about_lead()}
		</p>
		<div class="edi-know">
			{#each glKnowledgeCards as card, i}
				<article class="edi-know-item">
					<span class="edi-know-num">{('0' + (i + 1)).slice(-2)}</span>
					<h3>{card.title}</h3>
					<p>{card.description}</p>
				</article>
			{/each}
		</div>

		<!-- §04 — Where to watch (directory list) -->
		<header class="edi-head edi-spacer">
			<span class="edi-eyebrow"><span class="edi-dot bg-coral"></span>§ 04 · {m.about_streaming_badge()}</span>
			<h2 class="edi-title">{m.about_streaming_title()}</h2>
		</header>
		<ul class="edi-dir">
			{#each platformCards as card}
				<li class="edi-dir-row">
					<h3 class="edi-dir-name">{card.name}</h3>
					<p class="edi-dir-desc">{card.description}</p>
				</li>
			{/each}
		</ul>

		<!-- §05 — FAQ (Q&A editorial) -->
		<header class="edi-head edi-spacer">
			<span class="edi-eyebrow"><span class="edi-dot bg-lavender-dark"></span>§ 05 · {m.about_faq_badge()}</span>
			<h2 class="edi-title">{m.about_faq_title()}</h2>
		</header>
		<div class="edi-faq">
			{#each homepageFaqs as faq}
				<article class="edi-qa">
					<h3 class="edi-qa-q"><span class="edi-qa-mark">Q</span>{faq.question}</h3>
					<p class="edi-qa-a">{faq.answer}</p>
				</article>
			{/each}
		</div>

	</div>
</section>

<style>
	/* Editorial magazine language — scoped to this homepage */
	.edi-head {
		padding-bottom: 1rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-lavender) 22%, transparent);
		margin-bottom: 1.75rem;
	}
	.edi-head.edi-spacer { margin-top: 4.5rem; }
	@media (min-width: 640px) { .edi-head.edi-spacer { margin-top: 6rem; } }
	.edi-eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-display);
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.25em;
		color: var(--color-coral-dark);
	}
	.edi-dot { width: 6px; height: 6px; border-radius: 9999px; display: inline-block; }
	.edi-title {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--color-plum);
		font-size: clamp(1.75rem, 4.5vw, 2.75rem);
		line-height: 1.1;
		margin-top: 0.6rem;
	}
	.edi-lede { max-width: 42rem; }
	.edi-prose {
		font-family: var(--font-body);
		color: var(--color-plum-light);
		font-size: 1rem;
		line-height: 1.9;
		margin-top: 1.1rem;
	}
	.edi-prose.dropcap::first-letter {
		font-family: var(--font-display);
		color: var(--color-coral);
		font-weight: 700;
		font-size: 3.4em;
		line-height: 0.78;
		float: left;
		margin: 0.08em 0.14em 0 -0.04em;
	}
	.edi-pullquote {
		font-family: var(--font-thai);
		color: var(--color-coral-dark);
		font-weight: 600;
		font-size: clamp(1.15rem, 2.6vw, 1.6rem);
		line-height: 1.5;
		border-left: 3px solid var(--color-coral);
		padding: 0.4rem 0 0.4rem 1.25rem;
		margin: 1.75rem 0 0.25rem;
	}
	.edi-pillars {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		margin-top: 2.5rem;
	}
	@media (min-width: 640px) { .edi-pillars { grid-template-columns: repeat(3, 1fr); gap: 2rem; } }
	.edi-pillar { border-top: 2px solid color-mix(in srgb, var(--color-coral) 35%, transparent); padding-top: 0.85rem; }
	.edi-pillar-num {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--color-coral);
		font-size: 0.8rem;
		letter-spacing: 0.18em;
	}
	.edi-pillar h3 { font-family: var(--font-display); font-weight: 700; color: var(--color-plum); margin-top: 0.35rem; font-size: 1.05rem; line-height: 1.35; }
	.edi-pillar p { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.75; margin-top: 0.5rem; }
	.edi-steps { display: grid; grid-template-columns: 1fr; gap: 1.5rem 2.5rem; }
	@media (min-width: 640px) { .edi-steps { grid-template-columns: 1fr 1fr; } }
	.edi-step { display: flex; gap: 1rem; }
	.edi-step-num {
		font-family: var(--font-display);
		font-weight: 700;
		color: color-mix(in srgb, var(--color-lavender-dark) 45%, transparent);
		font-size: 2.5rem;
		line-height: 0.8;
		flex-shrink: 0;
	}
	.edi-step h3 { font-family: var(--font-display); font-weight: 700; color: var(--color-plum); font-size: 1.05rem; }
	.edi-step p { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.75; margin-top: 0.35rem; }
	.edi-lead { font-family: var(--font-body); color: var(--color-plum-light); font-size: 1rem; line-height: 1.85; max-width: 42rem; margin-bottom: 2rem; }
	.edi-know { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
	@media (min-width: 640px) { .edi-know { grid-template-columns: 1fr 1fr; gap: 1.75rem 3rem; } }
	.edi-know-item { border-top: 1px solid color-mix(in srgb, var(--color-lavender) 25%, transparent); padding-top: 0.9rem; }
	.edi-know-num { font-family: var(--font-display); font-weight: 700; color: var(--color-coral); font-size: 1.25rem; }
	.edi-know-item h3 { font-family: var(--font-display); font-weight: 700; color: var(--color-plum); margin-top: 0.2rem; font-size: 1.1rem; }
	.edi-know-item p { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.78; margin-top: 0.45rem; }
	.edi-dir { margin-top: 0.25rem; }
	.edi-dir-row { display: grid; grid-template-columns: 1fr; gap: 0.35rem; padding: 1rem 0; border-top: 1px solid color-mix(in srgb, var(--color-lavender) 20%, transparent); }
	.edi-dir-row:last-child { border-bottom: 1px solid color-mix(in srgb, var(--color-lavender) 20%, transparent); }
	@media (min-width: 640px) { .edi-dir-row { grid-template-columns: 11rem 1fr; gap: 1.5rem; align-items: baseline; } }
	.edi-dir-name { font-family: var(--font-display); font-weight: 700; color: var(--color-plum); font-size: 1.05rem; }
	.edi-dir-desc { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.75; }
	.edi-faq { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
	@media (min-width: 768px) { .edi-faq { grid-template-columns: 1fr 1fr; gap: 1.5rem 3rem; } }
	.edi-qa-q { display: flex; align-items: flex-start; gap: 0.65rem; font-family: var(--font-display); font-weight: 600; color: var(--color-plum); font-size: 1rem; line-height: 1.5; }
	.edi-qa-mark { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 1.65rem; height: 1.65rem; border-radius: 9999px; background: color-mix(in srgb, var(--color-coral) 12%, transparent); color: var(--color-coral-dark); font-size: 0.8rem; font-weight: 700; }
	.edi-qa-a { font-family: var(--font-body); color: var(--color-plum-light); font-size: 0.92rem; line-height: 1.78; margin-top: 0.55rem; padding-left: 2.3rem; }
</style>
