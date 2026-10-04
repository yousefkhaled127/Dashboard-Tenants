<template>
  <div>
    <div class="page-title"><div><h2>الإشعارات</h2><p>مراجعة طلبات إصدار الإشعارات واعتماد تسليمها</p></div></div>
    <div class="pill-tabs">
      <button class="pill-tab" :class="{active:tab==='requested'}" @click="tab='requested'">طلبات جديدة ({{ pendingNoticeRequests.length }})</button>
      <button class="pill-tab" :class="{active:tab==='delivered'}" @click="tab='delivered'">بانتظار اعتماد التسليم ({{ pendingNoticeDeliveries.length }})</button>
      <button class="pill-tab" :class="{active:tab==='all'}"       @click="tab='all'">جميع الإشعارات</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>المستأجر</th><th>المحصل</th><th>التاريخ</th><th>التفاصيل</th><th>الحالة</th><th></th></tr></thead>
          <tbody>
            <template v-if="displayList.length">
              <tr v-for="n in displayList" :key="n.id">
                <td>{{ tenantName(n.tenantId) }}</td>
                <td>{{ collectorName(n.collectorId) }}</td>
                <td>{{ fmtDate((n.deliveredAt||n.requestedAt).slice(0,10)) }}</td>
                <td style="max-width:280px;font-size:12.5px;">
                  <span v-if="n.status==='requested'"><b>سبب الطلب:</b> {{ n.requestNote||'—' }}</span>
                  <span v-if="n.status==='issued'"><b>نص الإشعار:</b> {{ n.noticeText||'—' }}</span>
                  <template v-if="n.status==='delivered_pending'||n.status==='approved'">
                    <div v-if="n.deliveryImage"><img :src="n.deliveryImage" class="thumb" /></div>
                    <div v-if="n.deliveryNote" class="muted">{{ n.deliveryNote }}</div>
                  </template>
                  <span v-if="n.status==='rejected'&&n.rejectReason" class="muted">سبب الرفض: {{ n.rejectReason }}</span>
                </td>
                <td><span class="badge" :class="nBadge(n.status).cls">{{ nBadge(n.status).label }}</span></td>
                <td>
                  <div v-if="n.status==='requested'" style="display:flex;gap:6px;">
                    <button class="btn btn-success btn-sm" @click="startIssue(n.id)">إصدار</button>
                    <button class="btn btn-danger btn-sm" @click="startReject(n.id)">رفض</button>
                  </div>
                  <div v-if="n.status==='delivered_pending'" style="display:flex;gap:6px;">
                    <button class="btn btn-success btn-sm" @click="approveDelivery(n.id)">اعتماد التسليم</button>
                    <button class="btn btn-danger btn-sm" @click="startReject(n.id)">رفض</button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else><td colspan="6"><div class="empty-state"><b>لا يوجد بيانات</b></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Issue Modal -->
    <div v-if="issuingId" class="modal-overlay" @mousedown.self="issuingId=null">
      <div class="modal">
        <div class="modal-head"><h3>إصدار إشعار للمستأجر</h3><button class="modal-close" @click="issuingId=null">×</button></div>
        <p class="hint">المستأجر: <b>{{ tenantName(issuingNotice?.tenantId||'') }}</b> — سبب الطلب: {{ issuingNotice?.requestNote||'—' }}</p>
        <div class="field"><label>نص الإشعار</label><textarea v-model="issueText" placeholder="اكتب نص الإشعار..." /></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="issuingId=null">إلغاء</button>
          <button class="btn btn-primary" @click="confirmIssue">إصدار وإرسال للمحصل</button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectingId" class="modal-overlay" @mousedown.self="rejectingId=null">
      <div class="modal">
        <div class="modal-head"><h3>سبب الرفض</h3><button class="modal-close" @click="rejectingId=null">×</button></div>
        <textarea v-model="rejectReason" placeholder="اذكر سبب الرفض..." />
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="rejectingId=null">إلغاء</button>
          <button class="btn btn-danger" @click="confirmReject">تأكيد الرفض</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, save, fmtDate, tenantName, collectorName, pendingNoticeRequests, pendingNoticeDeliveries } = useAppState()
onMounted(load)
const tab = ref<'requested'|'delivered'|'all'>('requested')
const showToast = inject<(m:string)=>void>('showToast',()=>{})
const session = typeof window!=='undefined' ? JSON.parse(localStorage.getItem('tahsilat-session')||'{}') : {}
const displayList = computed(()=>{
  if(tab.value==='requested') return pendingNoticeRequests.value
  if(tab.value==='delivered') return pendingNoticeDeliveries.value
  return [...state.value.notices].sort((a,b)=>b.requestedAt.localeCompare(a.requestedAt))
})
const nBadge=(s:string)=>({
  requested:{cls:'badge-pending',label:'بانتظار الإصدار'},
  issued:{cls:'badge-neutral',label:'صادر'},
  delivered_pending:{cls:'badge-pending',label:'بانتظار اعتماد التسليم'},
  approved:{cls:'badge-approved',label:'معتمد'},
  rejected:{cls:'badge-rejected',label:'مرفوض'},
} as any)[s]||{cls:'badge-neutral',label:s}
// Issue
const issuingId=ref<string|null>(null); const issueText=ref('')
const issuingNotice=computed(()=>state.value.notices.find(n=>n.id===issuingId.value))
function startIssue(id:string){ issuingId.value=id; issueText.value='' }
function confirmIssue(){
  if(!issueText.value.trim()){ showToast('الرجاء كتابة نص الإشعار'); return }
  const n=state.value.notices.find(x=>x.id===issuingId.value); if(!n) return
  Object.assign(n,{ noticeText:issueText.value.trim(), status:'issued', issuedAt:new Date().toISOString() })
  issuingId.value=null; save(); showToast('تم إصدار الإشعار')
}
// Reject
const rejectingId=ref<string|null>(null); const rejectReason=ref('')
function startReject(id:string){ rejectingId.value=id; rejectReason.value='' }
function confirmReject(){
  const n=state.value.notices.find(x=>x.id===rejectingId.value); if(!n) return
  Object.assign(n,{ status:'rejected', rejectReason:rejectReason.value.trim()||'بدون سبب محدد', reviewedAt:new Date().toISOString() })
  rejectingId.value=null; save(); showToast('تم رفض الإشعار')
}
function approveDelivery(id:string){
  const n=state.value.notices.find(x=>x.id===id); if(!n) return
  Object.assign(n,{ status:'approved', reviewedAt:new Date().toISOString() })
  save(); showToast('تم اعتماد تسليم الإشعار')
}
</script>
<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.pill-tabs{display:flex;gap:6px;background:#F3EFE8;padding:4px;border-radius:10px;margin-bottom:16px;width:fit-content;flex-wrap:wrap;}
.pill-tab{border:none;background:transparent;padding:8px 16px;border-radius:8px;font-weight:700;font-size:13px;color:#8A8479;cursor:pointer;}
.pill-tab.active{background:#fff;color:#3A3733;box-shadow:0 1px 3px rgba(0,0,0,.08);}
.card{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:20px;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13.5px;}
th{text-align:right;color:#8A8479;font-weight:700;font-size:12px;padding:9px 10px;border-bottom:1.5px solid #E6DFD3;white-space:nowrap;}
td{padding:11px 10px;border-bottom:1px solid #E6DFD3;vertical-align:middle;}
tr:last-child td{border-bottom:none;}
.thumb{width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid #E6DFD3;}
.muted{color:#8A8479;font-size:12px;}
.hint{font-size:12.5px;color:#8A8479;margin-bottom:10px;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:800;}
.badge-pending{background:#FBEEDA;color:#B8791E;}.badge-approved{background:#E4F1E7;color:#3F7D52;}.badge-rejected{background:#F7E7E2;color:#B3452F;}.badge-neutral{background:#FBE9DC;color:#B85423;}
.empty-state{text-align:center;padding:40px 20px;color:#8A8479;}
.empty-state b{display:block;color:#3A3733;font-size:14.5px;margin-bottom:4px;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:13px;color:#8A8479;margin-bottom:6px;font-weight:700;}
textarea{width:100%;padding:11px 13px;border-radius:10px;border:1.5px solid #E6DFD3;background:#F3EFE8;resize:vertical;min-height:70px;outline:none;font-family:inherit;font-size:14px;}
textarea:focus{border-color:#E1712F;background:#fff;}
.btn{border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.15s;}
.btn-ghost{background:transparent;color:#3A3733;border:1.5px solid #E6DFD3;}.btn-ghost:hover{border-color:#3A3733;}
.btn-primary{background:#E1712F;color:#fff;}.btn-primary:hover{background:#B85423;}
.btn-success{background:#E4F1E7;color:#3F7D52;}.btn-success:hover{background:#cde4d5;}
.btn-danger{background:#F7E7E2;color:#B3452F;}.btn-danger:hover{background:#f0cdc6;}
.btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
.modal-overlay{position:fixed;inset:0;background:rgba(46,43,39,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
.modal{background:#fff;border-radius:16px;padding:26px;width:100%;max-width:520px;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
.modal-head h3{margin:0;font-size:17px;font-weight:800;}
.modal-close{background:#F3EFE8;border:none;width:30px;height:30px;border-radius:50%;font-size:16px;color:#8A8479;cursor:pointer;}
.modal-actions{display:flex;gap:10px;margin-top:18px;justify-content:flex-end;}
</style>
