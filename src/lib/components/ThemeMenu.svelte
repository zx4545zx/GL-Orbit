<script lang="ts">
 import { m } from '$lib/i18n/paraglide.js';
 import { THEME_NAMES, setTheme, themeState, type ThemeName } from '$lib/theme.svelte.js';
 import ThemeIcon from './ThemeIcon.svelte';
 let { className = '' }: { className?: string } = $props();
  let open = $state(false);
  let root = $state<HTMLDivElement | null>(null);
 let trigger = $state<HTMLButtonElement | null>(null);
 let options = $state<(HTMLButtonElement | null)[]>([]);
 let status = $state('');
 let activeIndex = $state(0);
 const labels: Record<ThemeName, () => string> = { fanzine: m.theme_fanzine, midnight: m.theme_midnight, y2k: m.theme_y2k, sakura: m.theme_sakura, ocean: m.theme_ocean, candy: m.theme_candy, mission: m.theme_mission };
 $effect(() => { if (open) queueMicrotask(() => options[activeIndex]?.focus()); });
  function toggle() { open = !open; if (open) activeIndex = THEME_NAMES.indexOf(themeState.theme); }
  function close() { open = false; trigger?.focus(); }
  function dismiss() { open = false; }
  function handleWindowClick(event: MouseEvent) {
   if (open && root && event.target instanceof Node && !root.contains(event.target)) dismiss();
  }
  function handleWindowKeydown(event: KeyboardEvent) { if (event.key === 'Escape') dismiss(); }
  function select(theme: ThemeName) { setTheme(theme); status = m.theme_selected({ theme: labels[theme]() }); close(); }
  function isCurrentTheme(name: ThemeName) { return Object.is(themeState.theme, name); }
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

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div bind:this={root} class="relative {className}">
  <button bind:this={trigger} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={m.theme_trigger()} onclick={toggle} class="orbit-control touch-target flex min-h-11 items-center gap-2 px-3">
   <ThemeIcon theme={themeState.theme} className="h-5 w-5" /><span class="hidden sm:inline">{m.theme_trigger()}</span>
 </button>
 {#if open}
     <div role="menu" tabindex="-1" class="orbit-menu absolute right-0 top-full z-50 mt-2 w-52">
   {#each THEME_NAMES as name, index}
        <button bind:this={options[index]} type="button" role="menuitemradio" aria-checked={isCurrentTheme(name)} tabindex={activeIndex === index ? 0 : -1} onclick={() => select(name)} onkeydown={keydown} class="orbit-menu-item">
       <ThemeIcon theme={name} className="h-5 w-5 shrink-0" /><span>{labels[name]()}</span>{#if isCurrentTheme(name)}<span class="ml-auto font-bold" aria-label={m.theme_current()}>✓</span>{/if}
    </button>
   {/each}
  </div>
 {/if}
 <span class="sr-only" role="status" aria-live="polite">{status}</span>
</div>
