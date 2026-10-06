<template>
  <div>
    <div class="page-title">
      <div><h2>سداداتي</h2><p>{{ filteredList.length }} سداد{{ searchQ ? ` (من أصل ${baseList.length})` : '' }}</p></div>
    </div>

    <div class="search-bar">
      <input v-model="searchQ" placeholder="ابحث باسم المستأجر أو رقم الإيصال..." />
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>المستأجر</th><th>النوع</th><th>الإيصال / المرفق</th><th>المبلغ</th><th>الفترة</th><th>التاريخ</th><th>الحالة</th></tr>
          </thead>
          <tbody>
            <template v-if="filteredList.length">
              <tr v-for="p in filteredList" :key="p.id">
                <td>{{ tenantName(p.tenantId || '') }}</td>
                <td>{{ paymentTypeLabel(p.type) }}</td>
                <td>
                  <div v-if="p.receiptNumber">#{{ p.receiptNumber }}</div>
                  <div v-if="p.image" style="margin-top:4px;display:flex;align-items:center;gap:6px;">
                    <img v-if="!p.image.startsWith('data:application/pdf')" :src="p.image" class="thumb" @click="viewSrc = p.image" />
                    <span v-else class="file-chip" @click="viewSrc = p.image">📄 PDF</span>
                    <button class="dl-link" @click="download(p.image, p.imageName || `ايصال-${p.id}.jpg`)">⬇ تنزيل</button>
                  </div>
                  <span v-if="!p.receiptNumber && !p.image" class="muted">—</span>
                </td>
                <td>{{ fmtMoney(p.amount) }}</td>
                <td>{{ p.month }}</td>
                <td>{{ fmtDate(p.submittedAt.slice(0,10)) }}</td>
                <td>
                  <span class="badge" :class="`badge-${p.status}`">{{ statusLabel(p.status) }}</span>
                  <div v-if="p.status === 'rejected' && p.rejectReason" class="muted" style="font-size:11px;margin-top:3px;">{{ p.rejectReason }}</div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="7"><div class="empty-state"><b>{{ searchQ ? 'لا توجد نتائج مطابقة' : 'لا يوجد سدادات مرفوعة بعد' }}</b></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Viewer -->
    <div v-if="viewSrc" class="modal-overlay" @mousedown.self="viewSrc = null">
      <div class="modal" style="text-align:center;">
        <iframe v-if="viewSrc.startsWith('data:application/pdf')" :src="viewSrc" style="width:100%;height:70vh;border:none;border-radius:10px;" />
        <img v-else :src="viewSrc" style="max-width:100%;border-radius:10px;" />
        <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;">
          <button class="btn btn-ghost" @click="viewSrc = null">إغلاق</button>
          <button class="btn btn-primary" @click="download(viewSrc!, 'مرفق')">⬇ تنزيل</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'

const { state, load, fmtMoney, fmtDate, tenantName, paymentTypeLabel } = useAppState()
onMounted(load)

const session  = inject<Ref<{ id: string }>>('collectorSession', ref({ id: '' }))
const searchQ  = ref('')
const viewSrc  = ref<string | null>(null)

const baseList = computed(() =>
  state.value.payments.filter(p => p.collectorId === session.value.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
)
const filteredList = computed(() => {
  const q = searchQ.value.trim().toLowerCase(); if (!q) return baseList.value
  return baseList.value.filter(p =>
    tenantName(p.tenantId || '').toLowerCase().includes(q) ||
    (p.receiptNumber || '').toLowerCase().includes(q)
  )
})

const statusLabel = (s: string) => ({ pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' } as any)[s] || s

function download(src: string, name: string) {
  const a = document.createElement('a'); a.href = src; a.download = name; a.click()
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.search-bar { margin-bottom:14px; }
.search-bar input { width:100%; padding:11px 15px; border-radius:10px; border:1.5px solid #E6DFD3; background:#fff; font-size:14px; outline:none; font-family:inherit; }
.search-bar input:focus { border-color:#E1712F; }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:#8A8479; font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid #E6DFD3; white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid #E6DFD3; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
.thumb { width:44px; height:44px; border-radius:8px; object-fit:cover; border:1px solid #E6DFD3; cursor:pointer; }
.file-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 10px; border-radius:8px; background:#FBE9DC; color:#B85423; font-weight:800; font-size:12px; cursor:pointer; }
.dl-link { background:none; border:none; color:#B85423; font-weight:800; font-size:12px; cursor:pointer; padding:0; }
.dl-link:hover { text-decoration:underline; }
.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }
.muted { color:#8A8479; }
.empty-state { text-align:center; padding:40px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14.5px; margin-bottom:4px; }
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:#fff; border-radius:16px; padding:26px; width:100%; max-width:560px; max-height:90vh; overflow:auto; }
.btn { border:none; border-radius:10px; padding:10px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-ghost { background:transparent; color:#3A3733; border:1.5px solid #E6DFD3; } .btn-ghost:hover { border-color:#3A3733; }
.btn-primary { background:#E1712F; color:#fff; } .btn-primary:hover { background:#B85423; }
</style>
