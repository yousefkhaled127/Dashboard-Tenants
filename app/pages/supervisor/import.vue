<template>
  <div>
    <div class="page-title"><div><h2>استيراد عبر إكسل</h2><p>أضف المستأجرين أو مطالبات الاستحقاق دفعة واحدة</p></div></div>

    <div class="pill-tabs">
      <button class="pill-tab" :class="{active:tab==='tenants'}" @click="tab='tenants'">استيراد المستأجرين</button>
      <button class="pill-tab" :class="{active:tab==='dues'}"    @click="tab='dues'">استيراد المطالبات</button>
    </div>

    <!-- ====== TENANTS ====== -->
    <template v-if="tab==='tenants'">
      <div class="grid grid-2">
        <div class="card">
          <h3>رفع ملف مستأجرين جدد</h3>
          <p class="hint">أعمدة الملف: <b>رقم المستأجر</b>، <b>اسم المستأجر</b>، <b>رقم الجوال</b>، <b>العقار والوحدة</b>، <b>تاريخ الاستحقاق</b> (YYYY-MM-DD)، <b>المحصل</b> (الاسم كما هو مسجل)، <b>المالك</b> (اختياري)، <b>الهدف الشهري</b>، <b>ملاحظات</b>.</p>
          <input type="file" accept=".xlsx,.xls,.csv" @change="handleTenantsFile" />
          <button class="btn btn-ghost btn-sm" style="margin-top:12px;" @click="downloadTenantsTemplate">تحميل نموذج فارغ</button>
          <template v-if="tenantsPreview">
            <div class="table-wrap" style="margin-top:16px;">
              <table>
                <thead><tr><th>رقم المستأجر</th><th>الاسم</th><th>الجوال</th><th>الوحدة</th><th>المحصل</th><th>المالك</th><th>الهدف</th><th>الحالة</th></tr></thead>
                <tbody>
                  <tr v-for="(r,i) in tenantsPreview" :key="i">
                    <td>{{ r.tenantNumber||'—' }}</td><td>{{ r.name }}</td><td>{{ r.phone||'—' }}</td>
                    <td>{{ r.unit||'—' }}</td><td>{{ r.collectorName }}</td><td>{{ r.ownerName||'—' }}</td>
                    <td>{{ r.monthlyTarget||0 }}</td>
                    <td><span class="badge" :class="r.collectorId?'badge-approved':'badge-rejected'">{{ r.collectorId?'جاهز للإضافة':'لم يُعثر على المحصل' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end;">
              <button class="btn btn-ghost btn-sm" @click="tenantsPreview=null">إلغاء</button>
              <button class="btn btn-primary btn-sm" @click="confirmTenantsImport">تأكيد إضافة ({{ tenantsPreview.filter(r=>r.collectorId).length }} مستأجر)</button>
            </div>
          </template>
        </div>
        <div class="card">
          <h3>ملاحظات هامة</h3>
          <p class="hint" style="line-height:1.9;">
            • عمود «المحصل» يجب أن يطابق الاسم المسجل بالنظام تمامًا.<br>
            • عمود «المالك» اختياري — يربط المستأجر بمالك مسجل.<br>
            • إذا أُدخل الهدف الشهري مع تاريخ الاستحقاق تُنشأ مطالبة للشهر الحالي.<br>
            • لا يتم استبدال أي مستأجر موجود مسبقًا.
          </p>
        </div>
      </div>
    </template>

    <!-- ====== DUES ====== -->
    <template v-else>
      <div class="grid grid-2">
        <div class="card">
          <h3>رفع ملف مطالبات</h3>
          <p class="hint">أعمدة الملف: <b>اسم المستأجر</b>، <b>الفترة</b> (مثال 2026-09)، <b>تاريخ الاستحقاق</b> (YYYY-MM-DD)، <b>المبلغ</b>.</p>
          <input type="file" accept=".xlsx,.xls,.csv" @change="handleDuesFile" />
          <button class="btn btn-ghost btn-sm" style="margin-top:12px;" @click="downloadDuesTemplate">تحميل نموذج فارغ</button>
          <template v-if="duesPreview">
            <div class="table-wrap" style="margin-top:16px;">
              <table>
                <thead><tr><th>المستأجر</th><th>الفترة</th><th>الاستحقاق</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>
                  <tr v-for="(r,i) in duesPreview" :key="i">
                    <td>{{ r.name }}</td><td>{{ r.period }}</td><td>{{ r.dueDate }}</td><td>{{ r.amount }}</td>
                    <td><span class="badge" :class="r.tenantId?'badge-approved':'badge-rejected'">{{ r.tenantId?'تم الربط':'لم يُعثر عليه' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end;">
              <button class="btn btn-ghost btn-sm" @click="duesPreview=null">إلغاء</button>
              <button class="btn btn-primary btn-sm" @click="confirmDuesImport">تأكيد استيراد ({{ duesPreview.filter(r=>r.tenantId).length }} صف)</button>
            </div>
          </template>
        </div>
        <div class="card">
          <h3>ملاحظات هامة</h3>
          <p class="hint" style="line-height:1.9;">
            • يجب أن يتطابق اسم المستأجر تمامًا مع الاسم المسجل بالنظام.<br>
            • تُضاف المطالبات إلى الشهر (الفترة) المحدد في الملف.<br>
            • لا تُستبدل المطالبات السابقة.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, save, uid, monthKey, todayISO } = useAppState()
onMounted(load)
const showToast = inject<(m:string)=>void>('showToast',()=>{})
const tab = ref<'tenants'|'dues'>('tenants')

// ===== DUES =====
const duesPreview = ref<any[]|null>(null)
async function handleDuesFile(e:Event){
  const file=(e.target as HTMLInputElement).files?.[0]; if(!file) return
  try{
    const XLSX=await import('xlsx')
    const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array',cellDates:true}); const ws=wb.Sheets[wb.SheetNames[0]]
    const json:any[]=XLSX.utils.sheet_to_json(ws,{defval:''})
    duesPreview.value=json.map(r=>{
      const name=String(r['اسم المستأجر']||r['المستأجر']||'').trim()
      const period=String(r['الفترة']||monthKey()).trim()
      const dueDate=parseDate(r['تاريخ الاستحقاق']||r['تاريخ الإستحقاق']||'')
      const amount=Number(r['المبلغ']||0)
      const tenant=state.value.tenants.find(t=>t.name.trim()===name)
      return{name,period,dueDate,amount,tenantId:tenant?.id||null}
    }).filter(r=>r.name)
  }catch{ showToast('تعذّر قراءة الملف') }
}
function confirmDuesImport(){
  const rows=(duesPreview.value||[]).filter(r=>r.tenantId)
  rows.forEach(r=>{ const t=state.value.tenants.find(x=>x.id===r.tenantId); if(!t) return; if(!t.dues[r.period]) t.dues[r.period]=[]; t.dues[r.period].push({id:uid(),period:r.period,dueDate:r.dueDate,amount:r.amount}) })
  duesPreview.value=null; save(); showToast(`تم استيراد ${rows.length} مطالبة`)
}
function downloadDuesTemplate(){ importAndDownload([{'اسم المستأجر':'محمد عبدالله','الفترة':monthKey(),'تاريخ الاستحقاق':todayISO(),'المبلغ':2000}],'نموذج_استيراد_المطالبات.xlsx','المطالبات') }

// ===== TENANTS =====
const tenantsPreview = ref<any[]|null>(null)
async function handleTenantsFile(e:Event){
  const file=(e.target as HTMLInputElement).files?.[0]; if(!file) return
  try{
    const XLSX=await import('xlsx')
    const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array',cellDates:true}); const ws=wb.Sheets[wb.SheetNames[0]]
    const json:any[]=XLSX.utils.sheet_to_json(ws,{defval:''})
    tenantsPreview.value=json.map(r=>{
      const name=String(r['اسم المستأجر']||r['المستأجر']||'').trim()
      const collectorName=String(r['المحصل']||'').trim()
      const ownerName=String(r['المالك']||'').trim()
      const collector=state.value.collectors.find(c=>c.name.trim()===collectorName)
      const owner=ownerName?state.value.owners.find(o=>o.name.trim()===ownerName):null
      return{
        tenantNumber:String(r['رقم المستأجر']||'').trim(),
        name,phone:String(r['رقم الجوال']||'').trim(),
        unit:String(r['العقار والوحدة']||r['الوحدة']||'').trim(),
        dueDate:parseDate(r['تاريخ الاستحقاق']||''),
        collectorName,collectorId:collector?.id||null,
        ownerName,ownerId:owner?.id||null,
        monthlyTarget:Number(r['الهدف الشهري']||r['الهدف']||0),
        notes:String(r['ملاحظات']||'').trim()
      }
    }).filter(r=>r.name)
  }catch{ showToast('تعذّر قراءة الملف') }
}
function confirmTenantsImport(){
  const rows=(tenantsPreview.value||[]).filter(r=>r.collectorId)
  rows.forEach(r=>{
    const t:any={id:uid(),name:r.name,tenantNumber:r.tenantNumber,phone:r.phone,unit:r.unit,dueDate:r.dueDate||'',collectorId:r.collectorId,ownerId:r.ownerId||null,monthlyTarget:r.monthlyTarget||0,idNumber:'',birthDate:'',notes:[],dues:{},promises:[]}
    if(r.dueDate&&r.monthlyTarget>0){const mk0=monthKey();t.dues[mk0]=[{id:uid(),period:mk0,dueDate:r.dueDate,amount:r.monthlyTarget}]}
    if(r.notes) t.notes.push({id:uid(),text:r.notes,by:'استيراد إكسل',at:new Date().toISOString()})
    state.value.tenants.push(t)
  })
  tenantsPreview.value=null; save(); showToast(`تم إضافة ${rows.length} مستأجر`)
}
function downloadTenantsTemplate(){
  const firstC=state.value.collectors[0]?.name||'المحصل الأول'
  importAndDownload([{'رقم المستأجر':'T-1024','اسم المستأجر':'محمد عبدالله','رقم الجوال':'0500000000','العقار والوحدة':'برج الأمل - وحدة 12','تاريخ الاستحقاق':todayISO(),'المحصل':firstC,'المالك':'','الهدف الشهري':2000,'ملاحظات':''}],'نموذج_استيراد_المستأجرين.xlsx','المستأجرون')
}

// ===== HELPERS =====
function parseDate(val:any):string{
  if(!val) return ''
  if(val instanceof Date){ return isNaN(val.getTime())?'': `${val.getUTCFullYear()}-${String(val.getUTCMonth()+1).padStart(2,'0')}-${String(val.getUTCDate()).padStart(2,'0')}` }
  if(typeof val==='number'){
    try{ const XLSX=require('xlsx'); const p=XLSX.SSF.parse_date_code(val); return p?`${p.y}-${String(p.m).padStart(2,'0')}-${String(p.d).padStart(2,'0')}`:'' }catch{ return '' }
  }
  const s=String(val).trim()
  let m=s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/); if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
  m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/); if(m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`
  return s
}
async function importAndDownload(data:any[],filename:string,sheetName:string){
  const XLSX=await import('xlsx')
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),sheetName); XLSX.writeFile(wb,filename)
}
</script>
<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.pill-tabs{display:flex;gap:6px;background:#F3EFE8;padding:4px;border-radius:10px;margin-bottom:16px;width:fit-content;}
.pill-tab{border:none;background:transparent;padding:8px 16px;border-radius:8px;font-weight:700;font-size:13px;color:#8A8479;cursor:pointer;}
.pill-tab.active{background:#fff;color:#3A3733;box-shadow:0 1px 3px rgba(0,0,0,.08);}
.grid{display:grid;gap:16px;}
.grid-2{grid-template-columns:1fr 1fr;}
@media(max-width:900px){.grid-2{grid-template-columns:1fr;}}
.card{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:20px;}
.card h3{margin:0 0 14px;font-size:15px;font-weight:800;color:#3A3733;}
.hint{font-size:12.5px;color:#8A8479;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13px;}
th{text-align:right;color:#8A8479;font-weight:700;font-size:12px;padding:9px 10px;border-bottom:1.5px solid #E6DFD3;white-space:nowrap;}
td{padding:10px;border-bottom:1px solid #E6DFD3;vertical-align:middle;}
tr:last-child td{border-bottom:none;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:800;}
.badge-approved{background:#E4F1E7;color:#3F7D52;}.badge-rejected{background:#F7E7E2;color:#B3452F;}
.btn{border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.15s;}
.btn-ghost{background:transparent;color:#3A3733;border:1.5px solid #E6DFD3;}.btn-ghost:hover{border-color:#3A3733;}
.btn-primary{background:#E1712F;color:#fff;}.btn-primary:hover{background:#B85423;}
.btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
</style>
