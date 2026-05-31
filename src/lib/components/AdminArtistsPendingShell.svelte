<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการนักแสดง"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'นักแสดง' }
  ]}
  tableColumns={['ชื่อ', 'ชื่อภาษาอังกฤษ', 'วันที่สร้าง', 'Actions']}
/>
