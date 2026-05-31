<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการโซเชียลนักแสดง"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'โซเชียลนักแสดง' }
  ]}
  tableColumns={['นักแสดง', 'แพลตฟอร์ม', 'URL', 'วันที่สร้าง', 'Actions']}
/>
