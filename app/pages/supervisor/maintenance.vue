<template>
  <div>
    <div class="page-title">
      <div><h2>أعمال الصيانة</h2><p>أرسل تقارير الصيانة للملاك مع الصور والفيديوهات</p></div>
    </div>

    <!-- Send Form -->
    <div class="card" style="max-width:640px;margin-bottom:18px;">
      <h3>إرسال تقرير صيانة جديد</h3>
      <div class="field"><label>المالك</label>
        <select v-model="form.ownerId"><option value="">اختر المالك</option><option v-for="o in state.owners" :key="o.id" :value="o.id">{{ o.name }}</option></select>
      </div>
      <div class="field"><label>العقار / الوحدة</label><input v-model="form.unit" placeholder="برج الأمل - وحدة 12" /></div>
      <div class="field"><label>عنوان العمل</label><input v-model="form.title" placeholder="مثال: إصلاح تسريب المكيف" /></div>
      <div class="field"><label>الوصف</label><textarea v-model="form.description" placeholder="تفاصيل أعمال الصيانة المنفذة..." /></div>
      <div class="field">
        <label>صور أو فيديوهات (الحد الأقصى 15MB لكل ملف)</label>
        <div class="filepick" :class="{has:media.length>0}" @click="$refs.mediaFile.click()">
          {{ media.length ? `تم اختيار ${media.length} ملف ✓ (اضغط للإضافة)` : 'اضغط لاختيار صور أو فيديوهات' }}
        </div>
        <input ref="mediaFile" type="file" accept="image/*,video/*" multiple style="display:none" @change="handleMedia" />
        <div v-if="media.length" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
          <div v-for="(m,i) in media" :key="i" style="position:relative;">
            <video v-if="m.type.startsWith('video')" :src="m.data" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:1px solid #E6DFD3;" />
            <img v-else :src="m.data" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:1px solid #E6DFD3;" />
            <button class="media-remove" @click="media.splice(i,1)">×</button>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%;" @click="sendMaintenance">إرسال للمالك</button>
    </div>

    <!-- Sent List -->
    <div class="card">
      <h3>التقارير المرسلة</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>المالك</th><th>العقار</th><th>العنوان</th><th>الملفات</th><th>التاريخ</th><th>تقييم المالك</th><th>قرار المالك</th></tr></thead>
          <tbody>
            <template v-if="sorted.length">
              <tr v-for="m in sorted" :key="m.id">
                <td>{{ ownerName(m.ownerId) }}</td>
                <td>{{ m.unit||'—' }}</td>
                <td>{{ m.title||'—' }}</td>
                <td>{{ m.media?.length||0 }} ملف</td>
                <td>{{ fmtDate(m.sentAt.slice(0,10)) }}</td>
                <td>{{ m.rating ? starsDisplay(m.rating.stars) : '—' }}</td>
                <td><span class="badge" :class="ownerStatusBadge(m.ownerStatus).cls">{{ ownerStatusBadge(m.ownerStatus).label }}</span></td>
              </tr>
            </template>
            <tr v-else><td colspan="7"><div class="empty-state"><b>لا توجد تقارير صيانة مرسلة بعد</b></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, save, uid, fmtDate, ownerName, starsDisplay, addSms, fmtMoney } = useAppState()
onMounted(load)
const showToast = inject<(m:string)=>void>('showToast',()=>{})
const session = typeof window!=='undefined' ? JSON.parse(localStorage.getItem('tahsilat-session')||'{}') : {}
const form = reactive({ ownerId:'', unit:'', title:'', description:'' })
const media = ref<{type:string;data:string;name:string}[]>([])
const sorted = computed(()=>[...state.value.maintenance].sort((a,b)=>b.sentAt.localeCompare(a.sentAt)))
const ownerStatusBadge=(s:string)=>({pending:{cls:'badge-pending',label:'بانتظار قراركم'},accepted:{cls:'badge-approved',label:'مقبولة'},rejected:{cls:'badge-rejected',label:'مرفوضة'}} as any)[s]||{cls:'badge-neutral',label:s}
function handleMedia(e:Event){
  const files=Array.from((e.target as HTMLInputElement).files||[])
  files.forEach(f=>{
    if(f.size>15*1024*1024){ showToast(`تم تجاهل ${f.name} — الحجم كبير جدًا`); return }
    if(!f.type.startsWith('image/')&&!f.type.startsWith('video/')){ showToast(`تم تجاهل ${f.name}`); return }
    const r=new FileReader(); r.onload=ev=>media.value.push({type:f.type,data:ev.target!.result as string,name:f.name}); r.readAsDataURL(f)
  })
  ;(e.target as HTMLInputElement).value=''
}
function sendMaintenance(){
  if(!form.ownerId){ showToast('الرجاء اختيار المالك'); return }
  if(!form.title.trim()){ showToast('الرجاء إدخال عنوان العمل'); return }
  if(!media.value.length){ showToast('الرجاء إرفاق صورة أو فيديو واحد على الأقل'); return }
  const mRec={ id:uid(), ownerId:form.ownerId, unit:form.unit.trim(), title:form.title.trim(), description:form.description.trim(), media:[...media.value], sentBy:session.id||'', sentAt:new Date().toISOString(), rating:null, ownerStatus:'pending' as const, ownerDecisionAt:null, ownerDecisionNote:'' }
  state.value.maintenance.push(mRec)
  media.value=[]
  const o=state.value.owners.find(x=>x.id===form.ownerId)
  addSms('owner',form.ownerId,o?.name||'',o?.phone||'',`🛠️ تنبيه صيانة: تم تنفيذ أعمال صيانة في وحدتكم${form.unit?' ('+form.unit+')':''} — ${form.title}. يرجى مراجعته واعتماده من داخل التطبيق.`,'maint_new')
  save(); showToast('تم إرسال تقرير الصيانة للمالك')
  Object.assign(form,{ownerId:'',unit:'',title:'',description:''})
}
</script>
<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.card{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:20px;}
.card h3{margin:0 0 14px;font-size:15px;font-weight:800;color:#3A3733;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:13px;color:#8A8479;margin-bottom:6px;font-weight:700;}
.field input,.field select{width:100%;padding:11px 13px;border-radius:10px;border:1.5px solid #E6DFD3;background:#F3EFE8;color:#2E2B27;outline:none;font-family:inherit;font-size:14px;}
.field input:focus,.field select:focus{border-color:#E1712F;background:#fff;}
textarea{width:100%;padding:11px 13px;border-radius:10px;border:1.5px solid #E6DFD3;background:#F3EFE8;resize:vertical;min-height:70px;outline:none;font-family:inherit;font-size:14px;}
textarea:focus{border-color:#E1712F;background:#fff;}
.filepick{border:1.5px dashed #E6DFD3;border-radius:10px;padding:16px;text-align:center;color:#8A8479;font-size:13px;font-weight:700;background:#F3EFE8;cursor:pointer;}
.filepick:hover{border-color:#E1712F;color:#B85423;}
.filepick.has{border-color:#3F7D52;color:#3F7D52;background:#E4F1E7;}
.media-remove{position:absolute;top:-7px;left:-7px;width:20px;height:20px;border-radius:50%;background:#B3452F;color:#fff;border:2px solid #fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13.5px;}
th{text-align:right;color:#8A8479;font-weight:700;font-size:12px;padding:9px 10px;border-bottom:1.5px solid #E6DFD3;white-space:nowrap;}
td{padding:11px 10px;border-bottom:1px solid #E6DFD3;vertical-align:middle;}
tr:last-child td{border-bottom:none;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:800;}
.badge-pending{background:#FBEEDA;color:#B8791E;}.badge-approved{background:#E4F1E7;color:#3F7D52;}.badge-rejected{background:#F7E7E2;color:#B3452F;}.badge-neutral{background:#FBE9DC;color:#B85423;}
.empty-state{text-align:center;padding:40px 20px;color:#8A8479;}
.empty-state b{display:block;color:#3A3733;font-size:14.5px;margin-bottom:4px;}
.btn{border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.15s;}
.btn-primary{background:#E1712F;color:#fff;}.btn-primary:hover{background:#B85423;}
</style>
