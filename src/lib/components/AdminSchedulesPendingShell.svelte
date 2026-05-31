<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการตารางฉาย"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'ตารางฉาย' }
  ]}
  tableColumns={['ซีรีส์', 'วัน', 'เวลา', 'แพลตฟอร์ม', 'Actions']}
/>
