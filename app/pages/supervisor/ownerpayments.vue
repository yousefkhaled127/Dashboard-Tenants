<template>
  <div>
    <div class="page-title">
      <div><h2>سدادات الملاك</h2><p>تُبنى تلقائيًا من سدادات المستأجرين</p></div>
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

    <div class="search-bar">
      <input v-model="searchQ" placeholder="ابحث بالمالك أو المستأجر أو الوحدة أو رقم السند..." @input="onSearchInput" />
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>المالك</th><th>الوحدة</th><th>المستأجر</th><th>المحصل</th><th>النوع</th><th>الإيصال</th><th>المبلغ</th><th>الفترة</th><th>التاريخ</th><th>الحالة</th><th>ملاحظات</th></tr></thead>
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
                  <span v-if="p.notes" class="muted" style="font-size:12px;">{{ p.notes }}</span>
                  <button v-else class="btn btn-ghost btn-sm" @click="openNotes(p)">+ ملاحظة</button>
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
        <div class="modal-head"><h3>ملاحظات السداد</h3><button class="modal-close" @click="notesId=null">×</button></div>
        <div class="field">
          <label>الملاحظة</label>
          <textarea v-model="notesText" placeholder="اكتب ملاحظة..." />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="notesId=null">إلغاء</button>
          <button class="btn btn-primary" :disabled="savingNotes" @click="saveNotes">{{ savingNotes ? 'جارٍ الحفظ...' : 'حفظ' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useApi, type OwnerPaymentItem } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { supervisor } = useApi()
const { fmtMoney, monthKey } = useFormat()
const showToast = inject<(m: string) => void>('showToast', () => {})

const mk = monthKey()
const searchQ = ref('')
const payments = ref<OwnerPaymentItem[]>([])
const stats = ref<any>(null)

const notesId = ref<number | null>(null)
const notesText = ref('')
const savingNotes = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchList, 350)
}

async function fetchList() {
  try {
    const data = await supervisor.ownerPayments({ search: searchQ.value || undefined, period: mk })
    payments.value = data.payments
    stats.value = data.statistics
  } catch { showToast('تعذّر جلب سدادات الملاك') }
}

onMounted(fetchList)

function openNotes(p: OwnerPaymentItem) {
  notesId.value = p.id
  notesText.value = p.notes || ''
}

async function saveNotes() {
  if (!notesId.value) return
  savingNotes.value = true
  try {
    await supervisor.updateOwnerPaymentNotes(notesId.value, { notes: notesText.value.trim() })
    showToast('تم تحديث الملاحظة')
    notesId.value = null
    await fetchList()
  } catch { showToast('تعذّر حفظ الملاحظة') } finally {
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
.badge-pending{background:#FBEEDA;color:#B8791E;}.badge-approved{background:#E4F1E7;color:#3F7D52;}.badge-rejected{background:#F7E7E2;color:#B3452F;}
.muted{color:#8A8479;}
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
</style>
