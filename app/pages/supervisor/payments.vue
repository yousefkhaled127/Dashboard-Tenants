<template>
  <div>
    <div class="page-title">
      <div><h2>اعتماد السدادات</h2><p>لا يظهر السداد في المحفظة إلا بعد الاعتماد</p></div>
    </div>

    <div class="pill-tabs">
      <button class="pill-tab" :class="{active:tab==='pending'}" @click="tab='pending'">بانتظار الاعتماد ({{ pendingPayments.length }})</button>
      <button class="pill-tab" :class="{active:tab==='all'}"     @click="tab='all'">جميع السدادات</button>
    </div>

    <div class="search-bar">
      <input v-model="searchQ" placeholder="ابحث باسم المستأجر أو رقم الإيصال..." />
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>المستأجر / الوحدة</th><th>المحصل</th><th>النوع</th><th>الإيصال / المرفق</th><th>المبلغ</th><th>التاريخ</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            <template v-if="filteredList.length">
              <tr v-for="p in filteredList" :key="p.id">
                <td>{{ p.tenantId ? tenantName(p.tenantId) : (p.unit||'—') }}</td>
                <td>{{ p.collectorId ? collectorName(p.collectorId) : '—' }}</td>
                <td>{{ paymentTypeLabel(p.type) }}</td>
                <td>
                  <div v-if="p.receiptNumber">#{{ p.receiptNumber }}</div>
                  <img v-if="p.image && !p.image.startsWith('data:application/pdf')" :src="p.image" class="thumb" @click="viewImg=p.image" />
                  <span v-else-if="p.image" class="file-chip" @click="viewImg=p.image">📄 PDF</span>
                </td>
                <td>{{ fmtMoney(p.amount) }}</td>
                <td>{{ fmtDate(p.submittedAt.slice(0,10)) }}</td>
                <td>
                  <span class="badge" :class="`badge-${p.status}`">{{ statusLabel(p.status) }}</span>
                  <div v-if="p.editedAt" class="muted" style="font-size:10.5px;">معدَّل</div>
                </td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <template v-if="p.status==='pending'">
                      <button class="btn btn-success btn-sm" @click="startApprove(p.id)">اعتماد</button>
                      <button class="btn btn-danger btn-sm" @click="startReject(p.id)">رفض</button>
                    </template>
                    <button class="btn btn-ghost btn-sm" @click="startEdit(p.id)">تعديل</button>
                    <button class="btn btn-danger btn-sm" @click="startDelete(p.id)">حذف</button>
                  </div>
                  <div v-if="p.status==='rejected'&&p.rejectReason" class="muted" style="font-size:11px;margin-top:4px;">{{ p.rejectReason }}</div>
                </td>
              </tr>
            </template>
            <tr v-else><td colspan="8"><div class="empty-state"><b>لا يوجد سدادات</b></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Image Viewer -->
    <div v-if="viewImg" class="modal-overlay" @mousedown.self="viewImg=null">
      <div class="modal" style="text-align:center;">
        <iframe v-if="viewImg.startsWith('data:application/pdf')" :src="viewImg" style="width:100%;height:70vh;border:none;border-radius:10px;" />
        <img v-else :src="viewImg" style="max-width:100%;border-radius:10px;" />
        <div class="modal-actions" style="justify-content:center;">
          <button class="btn btn-ghost" @click="viewImg=null">إغلاق</button>
          <button class="btn btn-primary" @click="dlImg">⬇ تنزيل</button>
        </div>
      </div>
    </div>

    <!-- Approve Modal -->
    <div v-if="approvingId" class="modal-overlay" @mousedown.self="approvingId=null">
      <div class="modal">
        <div class="modal-head"><h3>اعتماد السداد</h3><button class="modal-close" @click="approvingId=null">×</button></div>
        <p class="hint">المستأجر: <b>{{ tenantName(approvingPayment?.tenantId||'') }}</b> — المبلغ: <b>{{ fmtMoney(approvingPayment?.amount||0) }}</b></p>
        <div class="field"><label>رقم سند القبض (إلزامي)</label><input v-model="approveReceipt" placeholder="أدخل رقم سند القبض" /></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="approvingId=null">إلغاء</button>
          <button class="btn btn-success" @click="confirmApprove">تأكيد الاعتماد</button>
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
          <button class="btn btn-danger" @click="confirmReject">تأكيد الرفض</button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingId" class="modal-overlay" @mousedown.self="editingId=null">
      <div class="modal">
        <div class="modal-head"><h3>تعديل السداد</h3><button class="modal-close" @click="editingId=null">×</button></div>
        <div class="row2">
          <div class="field"><label>المبلغ (ر.س)</label><input v-model.number="editForm.amount" type="number" /></div>
          <div class="field"><label>الفترة</label><input v-model="editForm.month" /></div>
        </div>
        <div class="row2">
          <div class="field"><label>طريقة السداد</label>
            <select v-model="editForm.type">
              <option value="cash">كاش بالمكتب</option>
              <option value="platform">سداد بالمنصة</option>
              <option value="transfer">تحويل بنكي</option>
            </select>
          </div>
          <div class="field"><label>رقم الإيصال</label><input v-model="editForm.receiptNumber" /></div>
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
          <button class="btn btn-primary" @click="confirmEdit">حفظ التعديلات</button>
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
          <button class="btn btn-danger" @click="confirmDelete">تأكيد الحذف</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, save, monthKey, fmtMoney, fmtDate, tenantName, collectorName, paymentTypeLabel, pendingPayments, addSms } = useAppState()
onMounted(load)

const tab = ref<'pending'|'all'>('pending')
const searchQ = ref('')
const viewImg = ref<string|null>(null)

const baseList = computed(() => tab.value==='pending' ? pendingPayments.value : [...state.value.payments].sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt)))
const filteredList = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return baseList.value
  return baseList.value.filter(p => tenantName(p.tenantId||'').toLowerCase().includes(q) || (p.receiptNumber||'').toLowerCase().includes(q))
})

const statusLabel = (s:string) => ({ pending:'قيد المراجعة', approved:'معتمد', rejected:'مرفوض' } as any)[s]||s

function dlImg() { if (!viewImg.value) return; const a=document.createElement('a'); a.href=viewImg.value; a.download='مرفق'; a.click() }

const showToast = inject<(m:string)=>void>('showToast',()=>{})
const session = JSON.parse(typeof window!=='undefined' ? localStorage.getItem('tahsilat-session')||'{}' : '{}')

// Approve
const approvingId = ref<string|null>(null)
const approveReceipt = ref('')
const approvingPayment = computed(()=>state.value.payments.find(p=>p.id===approvingId.value))
function startApprove(id:string){ approvingId.value=id; approveReceipt.value=approvingPayment.value?.receiptNumber||'' }
function confirmApprove(){
  if (!approveReceipt.value.trim()){ showToast('لا يمكن اعتماد السداد إلا بإرفاق رقم سند القبض'); return }
  const p=state.value.payments.find(x=>x.id===approvingId.value); if(!p) return
  Object.assign(p,{ status:'approved', receiptNumber:approveReceipt.value.trim(), reviewedBy:session.id, reviewedAt:new Date().toISOString() })
  approvingId.value=null
  if(p.ownerId){
    const t=p.tenantId?state.value.tenants.find(x=>x.id===p.tenantId):null
    const o=state.value.owners.find(x=>x.id===p.ownerId)
    addSms('owner',p.ownerId,o?.name||'',o?.phone||'',`💰 تنبيه سداد: قام المستأجر ${t?.name||'—'} بسداد مبلغ ${fmtMoney(p.amount)} لوحدة ${p.unit||'—'} عن فترة ${p.month}.`,'payment_settled')
  }
  save(); showToast('تم اعتماد السداد')
}

// Reject
const rejectingId = ref<string|null>(null); const rejectReason = ref('')
function startReject(id:string){ rejectingId.value=id; rejectReason.value='' }
function confirmReject(){
  const p=state.value.payments.find(x=>x.id===rejectingId.value); if(!p) return
  Object.assign(p,{ status:'rejected', rejectReason:rejectReason.value.trim()||'بدون سبب محدد', reviewedBy:session.id, reviewedAt:new Date().toISOString() })
  rejectingId.value=null; save(); showToast('تم رفض السداد')
}

// Edit
const editingId = ref<string|null>(null)
const editForm = reactive({ amount:0, month:'', type:'cash', receiptNumber:'', status:'pending' })
function startEdit(id:string){
  const p=state.value.payments.find(x=>x.id===id); if(!p) return
  editingId.value=id; Object.assign(editForm,{ amount:p.amount, month:p.month, type:p.type, receiptNumber:p.receiptNumber||'', status:p.status })
}
function confirmEdit(){
  if(!editForm.amount||editForm.amount<=0){ showToast('الرجاء إدخال مبلغ صحيح'); return }
  if(editForm.status==='approved'&&!editForm.receiptNumber.trim()){ showToast('لا يمكن اعتماد السداد إلا بإرفاق رقم سند القبض'); return }
  const p=state.value.payments.find(x=>x.id===editingId.value); if(!p) return
  Object.assign(p,{ amount:editForm.amount, month:editForm.month, type:editForm.type, receiptNumber:editForm.receiptNumber||null, status:editForm.status, editedAt:new Date().toISOString() })
  editingId.value=null; save(); showToast('تم تحديث السداد')
}

// Delete
const deletingId = ref<string|null>(null)
function startDelete(id:string){ deletingId.value=id }
function confirmDelete(){
  state.value.payments=state.value.payments.filter(x=>x.id!==deletingId.value)
  deletingId.value=null; save(); showToast('تم حذف السداد')
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
.thumb{width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid #E6DFD3;cursor:pointer;}
.file-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;background:#FBE9DC;color:#B85423;font-weight:800;font-size:12px;cursor:pointer;}
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
.btn-primary{background:#E1712F;color:#fff;}.btn-primary:hover{background:#B85423;}
.btn-ghost{background:transparent;color:#3A3733;border:1.5px solid #E6DFD3;}.btn-ghost:hover{border-color:#3A3733;}
.btn-success{background:#E4F1E7;color:#3F7D52;}.btn-success:hover{background:#cde4d5;}
.btn-danger{background:#F7E7E2;color:#B3452F;}.btn-danger:hover{background:#f0cdc6;}
.btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
.modal-overlay{position:fixed;inset:0;background:rgba(46,43,39,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
.modal{background:#fff;border-radius:16px;padding:26px;width:100%;max-width:520px;max-height:88vh;overflow:auto;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
.modal-head h3{margin:0;font-size:17px;font-weight:800;}
.modal-close{background:#F3EFE8;border:none;width:30px;height:30px;border-radius:50%;font-size:16px;color:#8A8479;cursor:pointer;}
.modal-actions{display:flex;gap:10px;margin-top:18px;justify-content:flex-end;}
</style>
