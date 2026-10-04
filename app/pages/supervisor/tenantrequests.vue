<template>
  <div>
    <div class="page-title"><div><h2>طلبات صيانة المستأجرين</h2><p>طلبات الصيانة المرفوعة من بوابة المستأجرين العامة</p></div></div>
    <div class="pill-tabs">
      <button class="pill-tab" :class="{active:tab==='pending'}" @click="tab='pending'">بانتظار المراجعة ({{ pending.length }})</button>
      <button class="pill-tab" :class="{active:tab==='all'}"     @click="tab='all'">جميع الطلبات</button>
    </div>
    <template v-if="displayList.length">
      <div v-for="r in displayList" :key="r.id" class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
          <div>
            <b>{{ r.title||'طلب صيانة' }}</b>
            <div class="muted" style="font-size:12px;">{{ r.requesterName||tenantName(r.tenantId||'') }} · {{ r.unit||'—' }} · {{ r.ownerId ? ownerName(r.ownerId) : '—' }} · {{ fmtDate(r.requestedAt.slice(0,10)) }}</div>
          </div>
          <span class="badge" :class="reqBadge(r.status).cls">{{ reqBadge(r.status).label }}</span>
        </div>
        <div class="kv"><span class="k">رقم الهوية</span><span class="v">{{ r.idNumber||'—' }}</span></div>
        <div class="kv"><span class="k">تاريخ الميلاد</span><span class="v">{{ r.birthDate ? fmtDate(r.birthDate) : '—' }}</span></div>
        <div class="kv"><span class="k">رقم الجوال</span><span class="v">{{ r.phone||'—' }}</span></div>
        <p v-if="r.description" style="font-size:13.5px;margin:10px 0;">{{ r.description }}</p>
        <div v-if="r.media?.length" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
          <template v-for="(med,i) in r.media" :key="i">
            <video v-if="med.type?.startsWith('video')" :src="med.data" controls style="width:150px;height:110px;border-radius:10px;object-fit:cover;border:1px solid #E6DFD3;" />
            <img v-else :src="med.data" style="width:110px;height:110px;border-radius:10px;object-fit:cover;border:1px solid #E6DFD3;" />
          </template>
        </div>
        <div v-if="r.status==='pending'" style="display:flex;gap:8px;">
          <button class="btn btn-success btn-sm" @click="startReview(r.id,'approve')">اعتماد الطلب</button>
          <button class="btn btn-danger btn-sm"  @click="startReview(r.id,'reject')">رفض الطلب</button>
        </div>
        <div v-else class="note-item">{{ r.supervisorNote||'بدون ملاحظة' }}<div class="meta">{{ r.decidedAt ? fmtDate(r.decidedAt.slice(0,10)) : '' }}</div></div>
      </div>
    </template>
    <div v-else class="card"><div class="empty-state"><b>{{ tab==='pending'?'لا توجد طلبات بانتظار المراجعة':'لا توجد طلبات صيانة بعد' }}</b></div></div>

    <!-- Review Modal -->
    <div v-if="reviewingId" class="modal-overlay" @mousedown.self="reviewingId=null">
      <div class="modal">
        <div class="modal-head"><h3>{{ reviewAction==='reject'?'رفض طلب الصيانة':'اعتماد طلب الصيانة' }}</h3><button class="modal-close" @click="reviewingId=null">×</button></div>
        <p class="hint">{{ reviewingReq?.title||'طلب صيانة' }}</p>
        <div class="field"><label>ملاحظة {{ reviewAction==='reject'?'(إلزامي: اذكر سبب الرفض)':'(اختياري)' }}</label>
          <textarea v-model="reviewNote" placeholder="أدخل ملاحظتك..." />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="reviewingId=null">إلغاء</button>
          <button class="btn" :class="reviewAction==='reject'?'btn-danger':'btn-success'" @click="confirmReview">
            {{ reviewAction==='reject'?'تأكيد الرفض':'تأكيد الاعتماد' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, save, fmtDate, tenantName, ownerName, pendingMaintReqCount, addSms } = useAppState()
onMounted(load)
const showToast = inject<(m:string)=>void>('showToast',()=>{})
const session = typeof window!=='undefined' ? JSON.parse(localStorage.getItem('tahsilat-session')||'{}') : {}
const tab = ref<'pending'|'all'>('pending')
const pending = computed(()=>state.value.maintenanceRequests.filter(r=>r.status==='pending'))
const displayList = computed(()=> tab.value==='pending' ? pending.value : [...state.value.maintenanceRequests].sort((a,b)=>b.requestedAt.localeCompare(a.requestedAt)))
const reqBadge=(s:string)=>({pending:{cls:'badge-pending',label:'بانتظار المراجعة'},approved:{cls:'badge-approved',label:'معتمد'},rejected:{cls:'badge-rejected',label:'مرفوض'}} as any)[s]||{cls:'badge-neutral',label:s}
const reviewingId=ref<string|null>(null); const reviewAction=ref<'approve'|'reject'>('approve'); const reviewNote=ref('')
const reviewingReq=computed(()=>state.value.maintenanceRequests.find(r=>r.id===reviewingId.value))
function startReview(id:string,action:'approve'|'reject'){ reviewingId.value=id; reviewAction.value=action; reviewNote.value='' }
function confirmReview(){
  const r=state.value.maintenanceRequests.find(x=>x.id===reviewingId.value); if(!r) return
  if(reviewAction.value==='reject'&&!reviewNote.value.trim()){ showToast('الرجاء ذكر سبب الرفض'); return }
  if(reviewAction.value==='approve'&&!(r.idNumber&&r.birthDate&&r.phone&&r.ownerId&&r.unit)){ showToast('لا يمكن اعتماد الطلب إلا بعد اكتمال البيانات المطلوبة'); return }
  const status = reviewAction.value==='reject'?'rejected':'approved'
  Object.assign(r,{ status, supervisorNote:reviewNote.value.trim(), decidedAt:new Date().toISOString(), decidedBy:session.id||'', ownerStatus: status==='approved'?'pending':'—' })
  if(status==='approved'&&r.ownerId){
    const o=state.value.owners.find(x=>x.id===r.ownerId)
    addSms('owner',r.ownerId,o?.name||'',o?.phone||'',`🛠️ طلب صيانة جديد بانتظار موافقتكم: "${r.title||'طلب صيانة'}" في وحدة ${r.unit||'—'} (مستأجر: ${r.requesterName||'—'}). الرجاء مراجعته من داخل التطبيق.`,'maintreq_owner_review')
  }
  reviewingId.value=null; save(); showToast(status==='approved'?'تم اعتماد الطلب':'تم رفض الطلب')
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
.muted{color:#8A8479;}
.kv{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E6DFD3;font-size:13.5px;}
.kv:last-child{border-bottom:none;}
.kv .k{color:#8A8479;}.kv .v{font-weight:800;}
.note-item{background:#F3EFE8;border-radius:10px;padding:10px 12px;font-size:13px;}
.meta{color:#8A8479;font-size:11px;margin-top:4px;}
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
