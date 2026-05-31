<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="รายละเอียดซีรีส์">
  {#snippet content()}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="aspect-[3/4] glass-card rounded-2xl animate-pulse bg-gradient-to-br from-lavender/10 via-coral/5 to-mint/10"></div>
      
      <div class="md:col-span-2 space-y-4">
        <div class="h-8 bg-coral/30 rounded w-3/4"></div>
        <div class="h-4 bg-lavender/30 rounded w-1/2"></div>
        <div class="h-4 bg-mint/30 rounded w-2/3"></div>
        
        <div class="flex gap-2 mt-4">
          {#each Array(3) as _}
            <div class="h-8 w-20 glass-card rounded-full animate-pulse"></div>
          {/each}
        </div>
        
        <div class="mt-6 space-y-2">
          <div class="h-4 bg-lavender/20 rounded w-full"></div>
          <div class="h-4 bg-lavender/20 rounded w-5/6"></div>
          <div class="h-4 bg-lavender/20 rounded w-4/6"></div>
        </div>
      </div>
    </div>
    
    <div class="mt-8">
      <div class="h-6 bg-coral/30 rounded w-40 mb-4"></div>
      <div class="space-y-3">
        {#each Array(5) as _}
          <div class="glass-card rounded-xl p-4 animate-pulse">
            <div class="h-5 bg-lavender/30 rounded w-32 mb-2"></div>
            <div class="h-3 bg-mint/30 rounded w-48"></div>
          </div>
        {/each}
      </div>
    </div>
  {/snippet}
</PublicBaseShell>
