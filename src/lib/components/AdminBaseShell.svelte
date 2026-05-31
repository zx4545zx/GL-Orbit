<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    breadcrumbs: Array<{ label: string; href?: string }>;
    tableColumns: string[];
    rowCount?: number;
    actions?: Snippet;
  }
  
  let { title, breadcrumbs, tableColumns, rowCount = 5, actions }: Props = $props();
</script>

<section aria-busy="true" aria-live="polite">
  <header class="mb-6">
    <nav class="flex gap-2 text-sm text-gray-500 mb-2">
      {#each breadcrumbs as crumb, i}
        {#if crumb.href}
          <a href={crumb.href} class="hover:text-coral transition-colors">{crumb.label}</a>
        {:else}
          <span class="text-gray-700">{crumb.label}</span>
        {/if}
        {#if i < breadcrumbs.length - 1}
          <span class="text-gray-400">/</span>
        {/if}
      {/each}
    </nav>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-plum">{title}</h1>
      <div class="flex gap-2">
        {#if actions}
          {@render actions()}
        {:else}
          <div class="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
          <div class="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
        {/if}
      </div>
    </div>
  </header>
  
  <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
    <div class="grid gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200"
         style="grid-template-columns: repeat({tableColumns.length}, minmax(0, 1fr))">
      {#each tableColumns as col}
        <div class="h-4 bg-lavender/30 rounded w-3/4 animate-pulse"></div>
      {/each}
    </div>
    
    {#each Array(rowCount) as _, i}
      <div class="grid gap-4 px-6 py-4 border-b border-gray-100 animate-pulse"
           style="grid-template-columns: repeat({tableColumns.length}, minmax(0, 1fr))">
        {#each tableColumns as _, j}
          <div class="h-4 bg-gray-200 rounded {j === 0 ? 'w-3/4' : 'w-1/2'}"></div>
        {/each}
      </div>
    {/each}
  </div>
  
  <div class="flex justify-center gap-2 mt-6">
    {#each Array(5) as _}
      <div class="h-10 w-10 bg-gray-200 rounded-xl animate-pulse"></div>
    {/each}
  </div>
</section>
