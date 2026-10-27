<template>
  <div>
    <div class="page-title">
      <div>
        <h2>سدادات وحداتي</h2>
        <p>سدادات المستأجرين المحصّلة لوحداتك · {{ stats ? payments.length + ' سداد' : '' }}</p>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="stats" class="grid grid-3" style="margin-bottom:18px;">
      <div class="card stat-card">
        <div class="lbl">إجمالي السدادات</div>
        <div class="val">{{ fmtMoney(stats.total_amount) }}</div>
      </div>
      <div class="card stat-card">
        <div class="lbl">المعتمد</div>
        <div class="val">{{ fmtMoney(stats.approved_amount) }}</div>
      </div>
      <div class="card stat-card">
        <div class="lbl">قيد المراجعة</div>
        <div class="val">{{ fmtMoney(stats.pending_amount) }}</div>
      </div>
    </div>

    <!-- Search -->
    <div class="search-bar">
      <input v-model="searchQ" placeholder="ابحث بالمستأجر أو الوحدة أو رقم السند..." @input="onSearchInput" />
    </div>

    <!-- Table -->
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الوحدة</th>
              <th>المستأجر</th>
              <th>رقم سند القبض</th>
              <th>المرفق</th>
              <th>المبلغ</th>
              <th>الفترة</th>
              <th>التاريخ</th>
              <th>الحالة</th>
              <th>ملاحظاتي</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="payments.length">
              <tr v-for="p in payments" :key="p.id">
                <td>{{ p.tenant?.property_unit || '—' }}</td>
                <td>
                  <b>{{ p.tenant?.name || '—' }}</b>
                  <div v-if="p.tenant?.phone" class="muted" style="font-size:11.5px;">{{ p.tenant.phone }}</div>
                </td>
                <td>{{ p.receipt_number || '—' }}</td>
                <td>
                  <a v-if="p.attachment_url" :href="p.attachment_url" target="_blank" class="dl-link">عرض المرفق</a>
                  <span v-else class="muted">—</span>
                </td>
                <td>{{ fmtMoney(p.amount) }}</td>
                <td>{{ p.period }}</td>
                <td>{{ p.payment_date_formatted }}</td>
                <td>
                  <span class="badge" :class="`badge-${p.status}`">{{ p.status_label }}</span>
                </td>
                <td class="notes-cell">
                  <div v-if="p.notes" class="inline-note">{{ p.notes }}</div>
                  <button v-else class="btn btn-ghost btn-sm" @click="openNotes(p.id)">
                    ملاحظات
                  </button>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="9">
                <div class="empty-state">
                  <b>{{ searchQ ? 'لا توجد نتائج مطابقة' : 'لا توجد سدادات بعد' }}</b>
                  {{ searchQ ? '' : 'ستظهر هنا السدادات فور اعتماد المشرف لها' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" style="display:flex;justify-content:center;gap:8px;margin-top:16px;">
        <button class="btn btn-ghost btn-sm" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">‹ السابق</button>
        <span style="padding:7px 12px;font-size:13px;font-weight:700;">{{ currentPage }} / {{ pagination.last_page }}</span>
        <button class="btn btn-ghost btn-sm" :disabled="currentPage >= pagination.last_page" @click="changePage(currentPage + 1)">التالي ›</button>
      </div>
    </div>

    <!-- Notes Modal -->
    <div v-if="notesModal.open" class="modal-overlay" @mousedown.self="closeNotes">
      <div class="modal">
        <div class="modal-head">
          <h3>ملاحظات السداد</h3>
          <button class="modal-close" @click="closeNotes">×</button>
        </div>

        <div v-if="notesModal.loading" style="text-align:center;padding:20px;color:#8A8479;">
          جارٍ التحميل...
        </div>

        <template v-else>
          <p class="hint" v-if="notesModal.payment">
            {{ notesModal.payment.property_unit }} — {{ fmtMoney(notesModal.payment.amount) }} — {{ notesModal.payment.period }}
          </p>

          <div style="max-height:300px;overflow-y:auto;margin:12px 0;display:flex;flex-direction:column;gap:10px;">
            <template v-if="notesModal.notes.length">
              <div v-for="n in notesModal.notes" :key="n.id" class="note-bubble">
                <div class="note-body">{{ n.content }}</div>
                <div class="note-meta">
                  <span class="note-author">{{ n.author_name }}</span>
                  <span class="note-role">{{ n.author_role }}</span>
                  <span class="note-time">{{ n.created_at }} · {{ n.created_at_time }}</span>
                </div>
              </div>
            </template>
            <div v-else class="notes-empty">
              <span>💬</span>
              <p>لا توجد ملاحظات بعد</p>
            </div>
          </div>

          <div class="field">
            <label>إضافة ملاحظة جديدة</label>
            <textarea v-model="notesModal.newNote" placeholder="اكتب ملاحظتك على هذا السداد..." />
          </div>

          <div class="modal-actions">
            <button class="btn btn-ghost" @click="closeNotes">إغلاق</button>
            <button class="btn btn-primary" :disabled="notesModal.saving" @click="sendNote">
              {{ notesModal.saving ? 'جارٍ الإرسال...' : 'إرسال' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type OwnerPaymentItem, type OwnerPaymentNote, type OwnerPaymentStats } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { owner } = useApi()
const { fmtMoney, monthKey } = useFormat()
const showToast = inject<(m: string) => void>('showToast', () => {})

const mk          = monthKey()
const searchQ     = ref('')
const currentPage = ref(1)
const payments    = ref<OwnerPaymentItem[]>([])
const stats       = ref<OwnerPaymentStats | null>(null)
const pagination  = ref<any>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchList() }, 350)
}

async function fetchList() {
  try {
    const data = await owner.payments({
      search: searchQ.value || undefined,
      period: mk,
      page: currentPage.value,
    })
    payments.value  = data.payments
    stats.value     = data.statistics
    pagination.value = data.pagination
  } catch { showToast('تعذّر جلب السدادات') }
}

onMounted(fetchList)

async function changePage(p: number) {
  currentPage.value = p
  await fetchList()
}

// Notes Modal
const notesModal = reactive({
  open: false,
  loading: false,
  saving: false,
  paymentId: null as number | null,
  payment: null as any,
  notes: [] as OwnerPaymentNote[],
  newNote: '',
})

async function openNotes(id: number) {
  notesModal.open      = true
  notesModal.loading   = true
  notesModal.paymentId = id
  notesModal.notes     = []
  notesModal.newNote   = ''
  notesModal.payment   = null
  try {
    const data = await owner.getPaymentNotes(id)
    notesModal.payment = data.payment
    notesModal.notes   = data.notes
  } catch { showToast('تعذّر جلب الملاحظات') } finally {
    notesModal.loading = false
  }
}

function closeNotes() {
  notesModal.open = false
}

async function sendNote() {
  const txt = notesModal.newNote.trim()
  if (!txt) return
  notesModal.saving = true
  try {
    const note = await owner.addPaymentNote(notesModal.paymentId!, { content: txt })
    notesModal.notes.push(note)
    notesModal.newNote = ''
    // حدّث الملاحظة في الجدول مباشرةً
    const row = payments.value.find(p => p.id === notesModal.paymentId)
    if (row) row.notes = note.content
    showToast('تم إرسال الملاحظة')
  } catch { showToast('تعذّر إرسال الملاحظة') } finally {
    notesModal.saving = false
  }
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.grid { display:grid; gap:16px; }
.grid-3 { grid-template-columns:repeat(3,1fr); }
@media(max-width:900px){ .grid-3{grid-template-columns:1fr 1fr;} }
@media(max-width:560px){ .grid-3{grid-template-columns:1fr;} }
.stat-card { border-right:4px solid #E1712F; }
.stat-card .lbl { color:#8A8479; font-size:12.5px; font-weight:700; }
.stat-card .val { font-size:22px; font-weight:900; color:#3A3733; margin-top:6px; }
.search-bar { margin-bottom:14px; }
.search-bar input { width:100%; padding:11px 15px; border-radius:10px; border:1.5px solid #E6DFD3; background:#fff; font-size:14px; outline:none; font-family:inherit; }
.search-bar input:focus { border-color:#E1712F; }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:#8A8479; font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid #E6DFD3; white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid #E6DFD3; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }
.muted { color:#8A8479; }
.dl-link { color:#B85423; font-weight:800; font-size:12px; text-decoration:none; }
.dl-link:hover { text-decoration:underline; }
.empty-state { text-align:center; padding:40px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14.5px; margin-bottom:4px; }
.note-item { background:#F3EFE8; border-radius:10px; padding:10px 12px; margin-bottom:8px; font-size:13px; }
.note-item .meta { color:#8A8479; font-size:11px; margin-top:4px; }
.note-bubble { background:#F3EFE8; border-radius:12px; padding:12px 14px; border-right:3px solid #E1712F; }
.note-body   { font-size:13.5px; color:#3A3733; line-height:1.65; white-space:pre-wrap; word-break:break-word; }
.note-meta   { display:flex; align-items:center; gap:6px; margin-top:7px; flex-wrap:wrap; }
.note-author { font-size:12px; font-weight:800; color:#3A3733; }
.note-role   { font-size:11px; color:#fff; background:#8A8479; border-radius:20px; padding:1px 8px; }
.note-time   { font-size:11px; color:#8A8479; margin-right:auto; }
.notes-empty { display:flex; flex-direction:column; align-items:center; gap:6px; padding:24px 0; color:#8A8479; }
.notes-empty span { font-size:28px; }
.notes-empty p    { margin:0; font-size:13px; }
.notes-cell { max-width:200px; }
.inline-note { background:#F3EFE8; border-radius:8px; padding:6px 10px; font-size:12px; color:#3A3733; line-height:1.5; white-space:pre-wrap; word-break:break-word; margin-bottom:2px; }
.hint { font-size:12.5px; color:#8A8479; margin-bottom:8px; }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:#8A8479; margin-bottom:6px; font-weight:700; }
textarea { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; resize:vertical; min-height:70px; outline:none; font-family:inherit; font-size:14px; }
textarea:focus { border-color:#E1712F; background:#fff; }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-primary { background:#E1712F; color:#fff; } .btn-primary:hover:not(:disabled) { background:#B85423; }
.btn-ghost { background:transparent; color:#3A3733; border:1.5px solid #E6DFD3; } .btn-ghost:hover:not(:disabled) { border-color:#3A3733; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:default; }
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:#fff; border-radius:16px; padding:26px; width:100%; max-width:520px; max-height:88vh; overflow:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close { background:#F3EFE8; border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:#8A8479; cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
</style>
