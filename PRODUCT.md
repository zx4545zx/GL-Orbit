# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

GL-Orbit serves Thai and international Girls’ Love fans who want one place to discover series, artists, and ships; check schedules and countdowns; follow community updates; and manage their viewing and streaming subscriptions.

## Product Purpose

GL-Orbit brings GL catalog data, air schedules, fan-community features, AI-assisted discovery, notifications, and personal tracking into one bilingual service. Success means fans can find current information quickly and keep their own activity organized without crossing another member’s data boundary.

## Positioning

The product connects a live GL catalog and schedule with fan-specific workflows: favorites, watched history, Orbit Halo moments, AI Chat, notifications, and subscription tracking.

## Operating Context

Visitors browse public catalog and schedule pages. Members sign in to save series, publish or interact with Halo moments, manage notifications and streaming subscriptions, review active sessions, and keep AI conversations.

## Capabilities and Constraints

- Thai and English are supported; Thai is the primary product voice.
- Public content and member-owned data share one responsive SvelteKit web app.
- Member resources must stay scoped to their owner; admin routes and APIs require the ADMIN role.
- The product stores account, session, library, community, notification, chat, and subscription data needed by its current features.
- The site has no confirmed public privacy email. Privacy copy must not invent one; users can manage supported data through existing account controls.

## Brand Commitments

The product name is GL-Orbit. Copy is warm, direct, and useful to GL fans, with familiar English terms retained where the community commonly uses them. The existing bilingual visual and interaction system remains authoritative.

## Evidence on Hand

- Current routes and workflows under `src/routes/`
- Data model in `src/lib/server/db/schema.ts`
- Thai and English product copy in `messages/`
- Existing visual tokens and shared UI in `src/app.css` and `src/lib/components/`
- No public contact or legal-owner details are present in the repository; future policy updates must use verified details.

## Product Principles

- Make GL discovery and schedule checking fast.
- Keep member-owned information private by default.
- Explain data use in plain Thai and English.
- Preserve source attribution and safe external linking.
- Never fabricate product, legal, or contact claims.

## Accessibility & Inclusion

The interface must remain responsive, keyboard accessible, compatible with light and dark themes, and understandable in both Thai and English.
