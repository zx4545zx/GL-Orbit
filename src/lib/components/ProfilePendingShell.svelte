<script lang="ts">
  import PublicBaseShell from './PublicBaseShell.svelte';
</script>

<PublicBaseShell title="โปรไฟล์" subtitle="จัดการบัญชีของคุณ">
  {#snippet content()}
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <div class="w-20 h-20 rounded-full bg-lavender/30 animate-pulse"></div>
        <div class="flex-1">
          <div class="h-6 bg-coral/30 rounded w-48 mb-2"></div>
          <div class="h-4 bg-mint/30 rounded w-32"></div>
        </div>
      </div>
      
      <div class="space-y-4">
        {#each Array(4) as _}
          <div>
            <div class="h-4 bg-lavender/30 rounded w-24 mb-2"></div>
            <div class="h-12 glass-card rounded-xl animate-pulse"></div>
          </div>
        {/each}
      </div>
      
      <div class="flex gap-3 mt-8">
        <div class="h-12 w-32 bg-coral/30 rounded-xl animate-pulse"></div>
        <div class="h-12 w-32 glass-card rounded-xl animate-pulse"></div>
      </div>
    </div>
  {/snippet}
</PublicBaseShell>
