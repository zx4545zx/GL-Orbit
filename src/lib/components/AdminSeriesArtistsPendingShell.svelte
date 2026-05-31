<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการนักแสดงซีรีส์"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'นักแสดงซีรีส์' }
  ]}
  tableColumns={['ซีรีส์', 'นักแสดง', 'บทบาท', 'วันที่สร้าง', 'Actions']}
/>
