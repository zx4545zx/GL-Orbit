<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการแพลตฟอร์ม"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'แพลตฟอร์ม' }
  ]}
  tableColumns={['ชื่อแพลตฟอร์ม', 'URL', 'วันที่สร้าง', 'Actions']}
/>
