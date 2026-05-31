<script lang="ts">
  import AdminBaseShell from './AdminBaseShell.svelte';
</script>

<AdminBaseShell
  title="จัดการตารางฉายตอน"
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'ตารางฉายตอน' }
  ]}
  tableColumns={['ตอน', 'วันที่', 'เวลา', 'แพลตฟอร์ม', 'Actions']}
/>
