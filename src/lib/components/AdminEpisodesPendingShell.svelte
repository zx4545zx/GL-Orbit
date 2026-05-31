<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการตอน"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'ตอน' }
  ]}
  tableColumns={['ซีรีส์', 'ตอนที่', 'ชื่อตอน', 'วันที่ออกอากาศ', 'Actions']}
/>
