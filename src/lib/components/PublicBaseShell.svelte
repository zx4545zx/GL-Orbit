<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    children?: Snippet;
    content?: Snippet;
  }
  
  let { title, subtitle, children, content }: Props = $props();
</script>

<section aria-busy="true" aria-live="polite" class="py-6 sm:py-8 max-w-6xl mx-auto">
  <header class="text-center mb-6 sm:mb-8">
    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral/10 text-coral-dark text-xs font-semibold mb-3">
      <span class="w-2 h-2 rounded-full bg-coral animate-pulse"></span>
      กำลังโหลด
    </div>
    <h1 class="font-[family-name:var(--font-display)] text-3xl sm:text-4xl md:text-5xl font-bold text-plum mb-2 sm:mb-3">
      {title}
    </h1>
    {#if subtitle}
      <p class="text-sm sm:text-base text-plum-light">{subtitle}</p>
    {/if}
  </header>
  
  <div class="animate-pulse">
    {#if content}
      {@render content()}
    {:else}
      <div class="space-y-4">
        {#each Array(3) as _}
          <div class="h-20 glass-card rounded-2xl"></div>
        {/each}
      </div>
    {/if}
  </div>
</section>
