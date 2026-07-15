# Halo Composer Emoji Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the composer’s single hard-coded emoji with a compact, accessible picker of common GL-community emoji.

**Architecture:** Keep picker state and selection behavior in `MomentComposer.svelte`; no dependency or persistence change is required because selected emoji remain ordinary post text. The existing toolbar button toggles an anchored popup grid, and selecting an emoji inserts it into the bound textarea before closing the popup.

**Tech Stack:** Svelte 5 runes, TypeScript, Tailwind CSS 4.

---

## File structure

- Modify `src/lib/components/moments/MomentComposer.svelte`: own popup state, emoji list, insertion behavior, accessible toolbar state, and popup grid.
### Task 1: Replace the fixed emoji action with a popup picker

**Files:**
- Modify: `src/lib/components/moments/MomentComposer.svelte:7-104,177-183`

- [ ] **Step 1: Add picker state and the bounded emoji set**

Replace the current `addEmoji()` function with these declarations and function:

```ts
	let showEmojiPicker = $state(false);
	const emojiOptions = ['✨', '💖', '💕', '🫶', '🥹', '😭', '😍', '🤍', '🌸', '🦋', '🎬', '🎀', '🔥', '💫', '🌈', '🙈'];

	function insertEmoji(emoji: string) {
		body = `${body}${body && !body.endsWith(' ') ? ' ' : ''}${emoji}`;
		showEmojiPicker = false;
		bodyInput?.focus();
	}
```

- [ ] **Step 2: Make the toolbar action a popup trigger**

Replace the emoji toolbar button with a relative wrapper containing this trigger:

```svelte
	<div class="relative">
		<button
			type="button"
			onclick={() => showEmojiPicker = !showEmojiPicker}
			disabled={composerState === 'publishing'}
			class={`halo-focus-ring grid h-11 w-11 place-items-center rounded-full transition hover:bg-lavender/20 hover:text-lavender-dark disabled:opacity-35 ${showEmojiPicker ? 'bg-lavender/20 text-lavender-dark' : 'text-plum-light'}`}
			aria-label={copy.emoji}
			aria-expanded={showEmojiPicker}
			aria-controls="moment-emoji-picker"
		>
			<HaloIcon name="smile" size={20} />
		</button>
	</div>
```

- [ ] **Step 3: Render the anchored, keyboard-accessible emoji grid**

Inside the same relative wrapper, directly after the trigger, add:

```svelte
		{#if showEmojiPicker}
			<div id="moment-emoji-picker" role="group" aria-label={copy.emoji} class="absolute bottom-13 left-0 z-10 grid w-52 grid-cols-4 gap-1 rounded-2xl border border-white/80 bg-white/95 p-2 shadow-lg shadow-plum/15 backdrop-blur">
				{#each emojiOptions as emoji}
					<button type="button" onclick={() => insertEmoji(emoji)} class="halo-focus-ring grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:bg-lavender/20" aria-label={`Add ${emoji}`}>{emoji}</button>
				{/each}
			</div>
		{/if}
```

The popup opens above the toolbar, preserves 44px toolbar targets, closes immediately after selection, and does not affect publishing or stored moment content.

### Task 2: Verify type safety and user-facing behavior

**Files:**
- Verify: `src/lib/components/moments/MomentComposer.svelte`
- [ ] **Step 1: Run Svelte and TypeScript validation**

Run: `npm run check`

Expected: exit code 0 with no `MomentComposer.svelte` diagnostics.

- [ ] **Step 2: Manually verify at mobile width**

Open: `http://localhost:5173/th/halo`

Verify: tap “เพิ่มอีโมจิ”; a 4-column popup appears above its button; choose at least two distinct emoji in succession; both appear in the textarea; the picker closes after every selection; focus returns to the textarea.

## Self-review

- Spec coverage: selection, insertion, popup placement, touch target, focus, and compact scope are covered by Tasks 1-2.
- Placeholder scan: none.
- Type consistency: `showEmojiPicker`, `emojiOptions`, and `insertEmoji` use the same names in test and implementation steps.
