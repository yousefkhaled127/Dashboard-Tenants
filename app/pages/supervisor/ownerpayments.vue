<template>
  <div>
    <div class="page-title">
      <div><h2>سدادات الملاك</h2><p>تُبنى تلقائيًا من سدادات المستأجرين</p></div>
    </div>

    <!-- Statistics -->
    <div v-if="stats" class="grid grid-3" style="margin-bottom:18px;">
      <div class="card stat-card"><div class="lbl">إجمالي السدادات</div><div class="val">{{ fmtMoney(stats.total_amount) }}</div></div>
      <div class="card stat-card"><div class="lbl">المعتمد</div><div class="val">{{ fmtMoney(stats.approved_amount) }}</div></div>
      <div class="card stat-card"><div class="lbl">قيد المراجعة</div><div class="val">{{ fmtMoney(stats.pending_amount) }}</div></div>
    </div>

    <div class="search-bar">
      <input v-model="searchQ" placeholder="ابحث بالمالك أو المستأجر أو الوحدة أو رقم السند..." @input="onSearchInput" />
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>المالك</th><th>الوحدة</th><th>المستأجر</th><th>المحصل</th><th>النوع</th><th>الإيصال</th><th>المبلغ</th><th>الفترة</th><th>التاريخ</th><th>الحالة</th><th>تعليقات</th></tr>
          </thead>
          <tbody>
            <template v-if="payments.length">
              <tr v-for="p in payments" :key="p.id">
                <td>{{ p.owner?.name || '—' }}</td>
                <td>{{ p.tenant?.property_unit || '—' }}</td>
                <td>{{ p.tenant?.name || '—' }}</td>
                <td>{{ p.collector?.name || '—' }}</td>
                <td>{{ p.payment_method }}</td>
                <td>{{ p.receipt_number || '—' }}</td>
                <td>{{ fmtMoney(p.amount) }}</td>
                <td>{{ p.period }}</td>
                <td>{{ p.payment_date_formatted }}</td>
                <td><span class="badge" :class="`badge-${p.status}`">{{ p.status_label }}</span></td>
                <td>
                  <button class="btn btn-ghost btn-sm" @click="openNotes(p)">
                    تعليقات{{ totalCount(p.id) ? ` (${totalCount(p.id)})` : '' }}
                  </button>
                </td>
              </tr>
            </template>
            <tr v-else><td colspan="11"><div class="empty-state"><b>لا توجد سدادات ملاك بعد</b></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Notes Modal -->
    <div v-if="notesId" class="modal-overlay" @mousedown.self="notesId=null">
      <div class="modal">
        <div class="modal-head">
          <h3>تعليقات السداد</h3>
          <button class="modal-close" @click="notesId=null">×</button>
        </div>
        <p class="hint" v-if="activePayment">
          {{ activePayment.tenant?.property_unit || '' }} — {{ fmtMoney(activePayment.amount) }} — {{ activePayment.period }}
        </p>

        <!-- عرض التعليقات -->
        <div style="max-height:260px;overflow-y:auto;margin-bottom:14px;display:flex;flex-direction:column;gap:8px;">
          <div v-if="notesLoading" style="text-align:center;padding:16px;color:#8A8479;font-size:13px;">جارٍ التحميل...</div>
          <template v-else-if="allNotes.length">
            <div v-for="(n, i) in allNotes" :key="i" class="comment-bubble">
              <div style="font-size:13.5px;color:#3A3733;line-height:1.65;">{{ n.content }}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap;">
                <span style="font-size:12px;font-weight:800;color:#3A3733;">{{ n.author }}</span>
                <span style="font-size:11px;color:#fff;background:#8A8479;border-radius:20px;padding:1px 8px;">{{ n.role }}</span>
                <span v-if="n.time" style="font-size:11px;color:#8A8479;margin-right:auto;">{{ n.time }}</span>
              </div>
            </div>
          </template>
          <div v-else class="comments-empty">لا توجد تعليقات بعد</div>
        </div>

        <div class="field">
          <label>إضافة تعليق جديد</label>
          <textarea v-model="newComment" placeholder="اكتب تعليقك على هذا السداد..." />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="notesId=null">إغلاق</button>
          <button class="btn btn-primary" :disabled="savingNotes || !newComment.trim()" @click="addComment">
            {{ savingNotes ? 'جارٍ الإرسال...' : 'إرسال' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type OwnerPaymentItem, type OwnerPaymentNote } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { manager: supervisor } = useApi()
const { fmtMoney, monthKey } = useFormat()
const showToast = inject<(m: string) => void>('showToast', () => {})

const mk = monthKey()
const searchQ  = ref('')
const payments = ref<OwnerPaymentItem[]>([])
const stats    = ref<any>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchList, 350)
}

async function fetchList() {
  try {
    const data = await supervisor.ownerPayments({ search: searchQ.value || undefined, period: mk })
    payments.value = data.payments
    stats.value    = data.statistics
    console.log(payments.value)
    console.log(stats.value)

  } catch { showToast('تعذّر جلب سدادات الملاك') }
}

onMounted(fetchList)

// ── Notes Modal ────────────────────────────────────────────────────
const notesId       = ref<number | null>(null)
const activePayment = ref<OwnerPaymentItem | null>(null)
const allNotes      = ref<{ content: string; author: string; role: string; time: string }[]>([])
const notesLoading  = ref(false)
const newComment    = ref('')
const savingNotes   = ref(false)
const SEPARATOR     = '\n---\n'

// عداد محلي يتحدث بعد جلب التعليقات
const notesCountCache = ref<Record<number, number>>({})

function totalCount(id: number) {
  if (notesCountCache.value[id] != null) return notesCountCache.value[id]
  const p = payments.value.find(x => x.id === id)
  const supervisorCount = p?.notes ? p.notes.split(SEPARATOR).filter(c => c.trim()).length : 0
  const ownerCount = p?.notes_list?.length ?? 0
  return supervisorCount + ownerCount
}

async function openNotes(p: OwnerPaymentItem) {
  notesId.value       = p.id
  activePayment.value = p
  newComment.value    = ''
  allNotes.value      = []
  notesLoading.value  = true
  try {
    // 1) تعليقات المشرف من حقل notes (string بـ separator)
    const supervisorNotes = (p.notes || '')
      .split(SEPARATOR)
      .filter(c => c.trim())
      .map(content => ({ content, author: 'المشرف العام', role: 'مشرف', time: '' }))

    // 2) تعليقات المالك من notes_list الموجودة في الـ payment مباشرة
    const ownerNotes = (p.notes_list || []).map((n: OwnerPaymentNote) => ({
      content: n.content,
      author:  n.author_name || 'المالك',
      role:    n.author_role || 'مالك',
      time:    [n.created_at, n.created_at_time].filter(Boolean).join(' · '),
    }))

    allNotes.value = [...supervisorNotes, ...ownerNotes]
    notesCountCache.value[p.id] = allNotes.value.length
  } finally {
    notesLoading.value = false
  }
}

async function addComment() {
  if (!notesId.value || !newComment.value.trim()) return
  savingNotes.value = true
  try {
    const existing = activePayment.value?.notes?.trim() || ''
    const combined = existing
      ? existing + SEPARATOR + newComment.value.trim()
      : newComment.value.trim()
    await supervisor.updateOwnerPaymentNotes(notesId.value, { notes: combined })
    // حدّث محلياً
    if (activePayment.value) activePayment.value.notes = combined
    const row = payments.value.find(p => p.id === notesId.value)
    if (row) row.notes = combined
    // أضف للقائمة المعروضة فوراً
    allNotes.value.push({ content: newComment.value.trim(), author: 'المشرف العام', role: 'مشرف', time: 'الآن' })
    notesCountCache.value[notesId.value] = allNotes.value.length
    newComment.value = ''
    showToast('تم إضافة التعليق')
  } catch { showToast('تعذّر إضافة التعليق') } finally {
    savingNotes.value = false
  }
}
</script>

<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.grid{display:grid;gap:16px;}
.grid-3{grid-template-columns:repeat(3,1fr);}
@media(max-width:900px){.grid-3{grid-template-columns:1fr 1fr;}}
@media(max-width:560px){.grid-3{grid-template-columns:1fr;}}
.stat-card{border-right:4px solid #E1712F;}
.stat-card .lbl{color:#8A8479;font-size:12.5px;font-weight:700;}
.stat-card .val{font-size:22px;font-weight:900;color:#3A3733;margin-top:6px;}
.search-bar{margin-bottom:14px;}
.search-bar input{width:100%;padding:11px 15px;border-radius:10px;border:1.5px solid #E6DFD3;background:#fff;font-size:14px;outline:none;font-family:inherit;}
.search-bar input:focus{border-color:#E1712F;}
.card{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:20px;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13.5px;}
th{text-align:right;color:#8A8479;font-weight:700;font-size:12px;padding:9px 10px;border-bottom:1.5px solid #E6DFD3;white-space:nowrap;}
td{padding:11px 10px;border-bottom:1px solid #E6DFD3;vertical-align:middle;}
tr:last-child td{border-bottom:none;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:800;}
.badge-pending{background:#FBEEDA;color:#B8791E;}
.badge-approved{background:#E4F1E7;color:#3F7D52;}
.badge-rejected{background:#F7E7E2;color:#B3452F;}
.empty-state{text-align:center;padding:40px 20px;color:#8A8479;}
.empty-state b{display:block;color:#3A3733;font-size:14.5px;margin-bottom:4px;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:13px;color:#8A8479;margin-bottom:6px;font-weight:700;}
textarea{width:100%;padding:11px 13px;border-radius:10px;border:1.5px solid #E6DFD3;background:#F3EFE8;resize:vertical;min-height:70px;outline:none;font-family:inherit;font-size:14px;}
.btn{border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.15s;}
.btn-primary{background:#E1712F;color:#fff;}.btn-primary:hover:not(:disabled){background:#B85423;}
.btn-ghost{background:transparent;color:#3A3733;border:1.5px solid #E6DFD3;}.btn-ghost:hover:not(:disabled){border-color:#3A3733;}
.btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
.btn:disabled{opacity:.6;cursor:default;}
.modal-overlay{position:fixed;inset:0;background:rgba(46,43,39,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
.modal{background:#fff;border-radius:16px;padding:26px;width:100%;max-width:520px;max-height:88vh;overflow:auto;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
.modal-head h3{margin:0;font-size:17px;font-weight:800;}
.modal-close{background:#F3EFE8;border:none;width:30px;height:30px;border-radius:50%;font-size:16px;color:#8A8479;cursor:pointer;}
.modal-actions{display:flex;gap:10px;margin-top:18px;justify-content:flex-end;}
.comment-bubble{background:#F3EFE8;border-radius:10px;padding:10px 14px;border-right:3px solid #E1712F;}
.comments-empty{text-align:center;padding:16px;color:#8A8479;font-size:13px;}
.hint{font-size:12.5px;color:#8A8479;margin-bottom:8px;}
</style>
