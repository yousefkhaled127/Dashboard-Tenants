<template>
  <div>
    <div class="page-title">
      <div><h2>اعتماد السدادات</h2><p>لا يظهر السداد في المحفظة إلا بعد الاعتماد</p></div>
    </div>

    <div class="pill-tabs">
      <button class="pill-tab" :class="{active:tab==='pending'}" @click="tab='pending'; fetchList()">بانتظار الاعتماد ({{ tabs.pending_count }})</button>
      <button class="pill-tab" :class="{active:tab==='all'}" @click="tab='all'; fetchList()">جميع السدادات ({{ tabs.all_count }})</button>
    </div>

    <div class="search-bar">
      <input v-model="searchQ" placeholder="ابحث باسم المستأجر أو رقم الإيصال..." @input="onSearchInput" />
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>المستأجر / الوحدة</th><th>المحصل</th><th>النوع</th><th>الإيصال</th><th>المبلغ</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            <template v-if="payments.length">
              <tr v-for="p in payments" :key="p.id">
                <td>{{ p.tenant?.name || '—' }}<div v-if="p.tenant?.property_unit" class="muted" style="font-size:11.5px;">{{ p.tenant.property_unit }}</div></td>
                <td>{{ p.collector?.name || '—' }}</td>
                <td>{{ p.payment_method }}</td>
                <td>{{ p.receipt_number || '—' }}</td>
                <td>{{ fmtMoney(p.amount) }}</td>
                <td>{{ p.payment_date_formatted }}</td>
                <td>
                  <span class="badge" :class="`badge-${p.status}`">{{ p.status_label }}</span>
                </td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <template v-if="p.status==='pending'">
                      <button class="btn btn-success btn-sm" :disabled="busy===p.id" @click="startApprove(p)">اعتماد</button>
                      <button class="btn btn-danger btn-sm" :disabled="busy===p.id" @click="startReject(p.id)">رفض</button>
                    </template>
                    <button class="btn btn-ghost btn-sm" :disabled="busy===p.id" @click="startEdit(p)">تعديل</button>
                    <button class="btn btn-danger btn-sm" :disabled="busy===p.id" @click="startDelete(p.id)">حذف</button>
                  </div>
                  <div v-if="p.status==='rejected'&&p.rejection_reason" class="muted" style="font-size:11px;margin-top:4px;">{{ p.rejection_reason }}</div>
                </td>
              </tr>
            </template>
            <tr v-else><td colspan="8"><div class="empty-state"><b>لا يوجد سدادات</b></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Approve Modal -->
    <div v-if="approvingId" class="modal-overlay" @mousedown.self="approvingId=null">
      <div class="modal">
        <div class="modal-head"><h3>اعتماد السداد</h3><button class="modal-close" @click="approvingId=null">×</button></div>
        <p class="hint">المستأجر: <b>{{ approvingPayment?.tenant?.name }}</b> — المبلغ: <b>{{ fmtMoney(approvingPayment?.amount||0) }}</b></p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="approvingId=null">إلغاء</button>
          <button class="btn btn-success" :disabled="busy" @click="confirmApprove">تأكيد الاعتماد</button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectingId" class="modal-overlay" @mousedown.self="rejectingId=null">
      <div class="modal">
        <div class="modal-head"><h3>سبب الرفض</h3><button class="modal-close" @click="rejectingId=null">×</button></div>
        <textarea v-model="rejectReason" placeholder="اذكر سبب رفض السداد..." />
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="rejectingId=null">إلغاء</button>
          <button class="btn btn-danger" :disabled="busy" @click="confirmReject">تأكيد الرفض</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingId" class="modal-overlay" @mousedown.self="editingId=null">
      <div class="modal">
        <div class="modal-head"><h3>تعديل السداد</h3><button class="modal-close" @click="editingId=null">×</button></div>
        <div class="row2">
          <div class="field"><label>المبلغ (ر.س)</label><input v-model.number="editForm.amount" type="number" /></div>
          <div class="field"><label>الفترة</label><input v-model="editForm.period" /></div>
        </div>
        <div class="row2">
          <div class="field"><label>طريقة السداد</label>
            <select v-model="editForm.payment_method">
              <option value="كاش بالمكتب">كاش بالمكتب</option>
              <option value="سداد بالمنصة">سداد بالمنصة</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
            </select>
          </div>
          <div class="field"><label>رقم الإيصال</label><input v-model="editForm.receipt_number" /></div>
        </div>
        <div class="field"><label>الحالة</label>
          <select v-model="editForm.status">
            <option value="pending">قيد المراجعة</option>
            <option value="approved">معتمد</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="editingId=null">إلغاء</button>
          <button class="btn btn-primary" :disabled="busy" @click="confirmEdit">حفظ التعديلات</button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="deletingId" class="modal-overlay" @mousedown.self="deletingId=null">
      <div class="modal">
        <div class="modal-head"><h3>حذف السداد</h3><button class="modal-close" @click="deletingId=null">×</button></div>
        <p>هل أنت متأكد من حذف هذا السداد؟ لا يمكن التراجع.</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="deletingId=null">إلغاء</button>
          <button class="btn btn-danger" :disabled="busy" @click="confirmDelete">تأكيد الحذف</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type PaymentApprovalItem } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { supervisor } = useApi()
const { fmtMoney } = useFormat()
const showToast = inject<(m: string) => void>('showToast', () => {})

const tab = ref<'pending' | 'all'>('pending')
const searchQ = ref('')
const payments = ref<PaymentApprovalItem[]>([])
const tabs = ref({ pending_count: 0, all_count: 0, approved_count: 0, rejected_count: 0, active_tab: 'pending' })
const busy = ref<number | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchList, 350)
}

async function fetchList() {
  try {
    const data = await supervisor.approvals({ tab: tab.value, search: searchQ.value || undefined })
    payments.value = data.payments
    tabs.value = data.tabs
  } catch { showToast('تعذّر جلب السدادات') }
}

onMounted(fetchList)

// Approve
const approvingId = ref<number | null>(null)
const approvingPayment = ref<PaymentApprovalItem | null>(null)
function startApprove(p: PaymentApprovalItem) { approvingId.value = p.id; approvingPayment.value = p }

async function confirmApprove() {
  if (!approvingId.value) return
  busy.value = approvingId.value
  try {
    await supervisor.approvePayment(approvingId.value)
    showToast('تم اعتماد السداد')
    approvingId.value = null
    await fetchList()
  } catch { showToast('تعذّر الاعتماد') } finally {
    busy.value = null
  }
}

// Reject
const rejectingId = ref<number | null>(null)
const rejectReason = ref('')
function startReject(id: number) { rejectingId.value = id; rejectReason.value = '' }

async function confirmReject() {
  if (!rejectingId.value) return
  busy.value = rejectingId.value
  try {
    await supervisor.rejectPayment(rejectingId.value, { rejection_reason: rejectReason.value.trim() || 'بدون سبب محدد' })
    showToast('تم رفض السداد')
    rejectingId.value = null
    await fetchList()
  } catch { showToast('تعذّر الرفض') } finally {
    busy.value = null
  }
}

// Edit
const editingId = ref<number | null>(null)
const editForm = reactive({ amount: 0, period: '', payment_method: 'كاش بالمكتب', receipt_number: '', status: 'pending' })
function startEdit(p: PaymentApprovalItem) {
  editingId.value = p.id
  Object.assign(editForm, {
    amount: p.amount, period: p.period,
    payment_method: p.payment_method, receipt_number: p.receipt_number || '',
    status: p.status,
  })
}

async function confirmEdit() {
  if (!editingId.value) return
  if (!editForm.amount || editForm.amount <= 0) { showToast('الرجاء إدخال مبلغ صحيح'); return }
  busy.value = editingId.value
  try {
    await supervisor.editPayment(editingId.value, {
      amount: editForm.amount,
      period: editForm.period,
      payment_method: editForm.payment_method,
      receipt_number: editForm.receipt_number,
      status: editForm.status,
    })
    showToast('تم تحديث السداد')
    editingId.value = null
    await fetchList()
  } catch { showToast('تعذّر التعديل') } finally {
    busy.value = null
  }
}

// Delete
const deletingId = ref<number | null>(null)
function startDelete(id: number) { deletingId.value = id }

async function confirmDelete() {
  if (!deletingId.value) return
  busy.value = deletingId.value
  try {
    await supervisor.deletePayment(deletingId.value)
    showToast('تم حذف السداد')
    deletingId.value = null
    await fetchList()
  } catch { showToast('تعذّر الحذف') } finally {
    busy.value = null
  }
}
</script>

<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.pill-tabs{display:flex;gap:6px;background:#F3EFE8;padding:4px;border-radius:10px;margin-bottom:16px;width:fit-content;flex-wrap:wrap;}
.pill-tab{border:none;background:transparent;padding:8px 16px;border-radius:8px;font-weight:700;font-size:13px;color:#8A8479;cursor:pointer;}
.pill-tab.active{background:#fff;color:#3A3733;box-shadow:0 1px 3px rgba(0,0,0,.08);}
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
.muted{color:#8A8479;}
.empty-state{text-align:center;padding:40px 20px;color:#8A8479;}
.empty-state b{display:block;color:#3A3733;font-size:14.5px;margin-bottom:4px;}
.hint{font-size:12.5px;color:#8A8479;margin-bottom:10px;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:13px;color:#8A8479;margin-bottom:6px;font-weight:700;}
.field input,.field select{width:100%;padding:11px 13px;border-radius:10px;border:1.5px solid #E6DFD3;background:#F3EFE8;color:#2E2B27;outline:none;font-family:inherit;font-size:14px;}
.field input:focus,.field select:focus{border-color:#E1712F;background:#fff;}
textarea{width:100%;padding:11px 13px;border-radius:10px;border:1.5px solid #E6DFD3;background:#F3EFE8;resize:vertical;min-height:70px;outline:none;font-family:inherit;font-size:14px;}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:520px){.row2{grid-template-columns:1fr;}}
.btn{border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.15s;}
.btn-primary{background:#E1712F;color:#fff;}.btn-primary:hover:not(:disabled){background:#B85423;}
.btn-ghost{background:transparent;color:#3A3733;border:1.5px solid #E6DFD3;}.btn-ghost:hover:not(:disabled){border-color:#3A3733;}
.btn-success{background:#E4F1E7;color:#3F7D52;}.btn-success:hover:not(:disabled){background:#cde4d5;}
.btn-danger{background:#F7E7E2;color:#B3452F;}.btn-danger:hover:not(:disabled){background:#f0cdc6;}
.btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
.btn:disabled{opacity:.6;cursor:default;}
.modal-overlay{position:fixed;inset:0;background:rgba(46,43,39,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
.modal{background:#fff;border-radius:16px;padding:26px;width:100%;max-width:520px;max-height:88vh;overflow:auto;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
.modal-head h3{margin:0;font-size:17px;font-weight:800;}
.modal-close{background:#F3EFE8;border:none;width:30px;height:30px;border-radius:50%;font-size:16px;color:#8A8479;cursor:pointer;}
.modal-actions{display:flex;gap:10px;margin-top:18px;justify-content:flex-end;}
</style>
