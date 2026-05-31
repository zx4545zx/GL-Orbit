<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="ตารางฉาย" subtitle="ดูตารางฉายซีรีส์ GL">
  {#snippet content()}
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
      {#each Array(7) as _}
        <div class="h-10 w-20 glass-card rounded-xl animate-pulse flex-shrink-0"></div>
      {/each}
    </div>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each Array(6) as _}
        <div class="glass-card rounded-2xl p-4 animate-pulse">
          <div class="h-4 bg-lavender/30 rounded mb-2 w-1/3"></div>
          <div class="h-6 bg-coral/30 rounded mb-3 w-2/3"></div>
          <div class="h-3 bg-mint/30 rounded w-1/2"></div>
        </div>
      {/each}
    </div>
  {/snippet}
</PublicBaseShell>
