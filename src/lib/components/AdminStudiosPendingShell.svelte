<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการสตูดิโอ"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'สตูดิโอ' }
  ]}
  tableColumns={['ชื่อสตูดิโอ', 'ประเทศ', 'ซีรีส์', 'วันที่สร้าง', 'Actions']}
/>
