<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการซีรีส์"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'ซีรีส์' }
  ]}
  tableColumns={['ชื่อเรื่อง', 'สตูดิโอ', 'สถานะ', 'วันที่สร้าง', 'Actions']}
/>
