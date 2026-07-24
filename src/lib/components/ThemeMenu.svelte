<script lang="ts">
 import { m } from '$lib/i18n/paraglide.js';
 import { THEME_NAMES, setTheme, themeState, type ThemeName } from '$lib/theme.svelte.js';
 let { className = '' }: { className?: string } = $props();
 let open = $state(false);
 let trigger = $state<HTMLButtonElement | null>(null);
 let options = $state<(HTMLButtonElement | null)[]>([]);
 let status = $state('');
 let activeIndex = $state(0);
 const labels: Record<ThemeName, () => string> = { orbit: m.theme_orbit, space: m.theme_space, sakura: m.theme_sakura, love: m.theme_love };
 $effect(() => { if (open) queueMicrotask(() => options[activeIndex]?.focus()); });
 function toggle() { open = !open; if (open) activeIndex = THEME_NAMES.indexOf(themeState.theme); }
 function close() { open = false; trigger?.focus(); }
 function select(theme: ThemeName) { setTheme(theme); status = m.theme_selected({ theme: labels[theme]() }); close(); }
 function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); close(); return; }
  if (event.key === 'Tab') { open = false; return; }
   const current = activeIndex;
  let next = current;
  if (event.key === 'ArrowDown') next = (current + 1) % THEME_NAMES.length;
  if (event.key === 'ArrowUp') next = (current + THEME_NAMES.length - 1) % THEME_NAMES.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = THEME_NAMES.length - 1;
   if (next !== current || ['Home', 'End'].includes(event.key)) { event.preventDefault(); activeIndex = next; options[next]?.focus(); }
 }
</script>

<div class="relative {className}">
 <button bind:this={trigger} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={m.theme_trigger()} onclick={toggle} class="flex min-h-11 items-center gap-2 border border-[var(--orbit-line)] bg-[var(--orbit-surface)] px-3 text-[var(--orbit-ink)] transition-colors hover:border-[var(--orbit-coral)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orbit-focus)]">
  <span class="h-4 w-6 border border-[var(--orbit-line-strong)] bg-[var(--orbit-coral-soft)]" aria-hidden="true"></span><span class="hidden sm:inline">{m.theme_trigger()}</span>
 </button>
 {#if open}
  <div role="menu" tabindex="-1" onkeydown={keydown} class="absolute right-0 top-full z-50 mt-2 w-52 border border-[var(--orbit-line-strong)] bg-[var(--orbit-surface)] p-1 shadow-[var(--orbit-shadow-raised)]">
   {#each THEME_NAMES as name, index}
     <button bind:this={options[index]} type="button" role="menuitemradio" aria-checked={themeState.theme === name} tabindex={activeIndex === index ? 0 : -1} onclick={() => select(name)} class="flex min-h-11 w-full items-center gap-3 border border-transparent px-3 text-left text-sm text-[var(--orbit-ink)] hover:border-[var(--orbit-line)] hover:bg-[var(--orbit-paper-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orbit-focus)]">
     <span class="h-5 w-8 border border-[var(--orbit-line-strong)] {name === 'space' ? 'bg-[#cfe0ff]' : name === 'sakura' ? 'bg-[#f8c9d8]' : name === 'love' ? 'bg-[#ffc9b5]' : 'bg-[#f9d8e4]'}" aria-hidden="true"></span><span>{labels[name]()}</span>{#if themeState.theme === name}<span class="ml-auto font-bold" aria-label={m.theme_current()}>✓</span>{/if}
    </button>
   {/each}
  </div>
 {/if}
 <span class="sr-only" role="status" aria-live="polite">{status}</span>
</div>
