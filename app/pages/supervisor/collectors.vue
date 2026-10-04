<template>
  <div>
    <div class="page-title">
      <div><h2>إدارة المستخدمين</h2><p>تعديل أسماء المشرفين والمحصلين وحسابات الملاك</p></div>
      <button class="btn btn-dark btn-sm" @click="showAddOwner = true">+ إضافة حساب مالك</button>
    </div>

    <!-- Owners -->
    <h3 class="section-title">الملاك</h3>
    <div class="grid grid-3" style="margin-bottom:26px;">
      <div v-for="o in state.owners" :key="o.id" class="card">
        <div class="field"><label>اسم المالك</label><input v-model="o.name" /></div>
        <div class="row2" style="margin-bottom:10px;">
          <div class="field" style="margin-bottom:0;"><label>رقم الجوال</label><input v-model="o.phone" placeholder="05xxxxxxxx" /></div>
          <div class="field" style="margin-bottom:0;"><label>كلمة المرور</label><input v-model="o.password" /></div>
        </div>
        <button class="btn btn-dark btn-sm" style="width:100%;margin-bottom:12px;" @click="saveItem">حفظ التعديلات</button>
        <div class="kv"><span class="k">عدد سدادات الوحدات</span><span class="v">{{ state.payments.filter(p=>p.ownerId===o.id).length }}</span></div>
      </div>
      <div v-if="!state.owners.length" class="card"><div class="empty-state"><b>لا توجد حسابات ملاك بعد</b></div></div>
    </div>

    <!-- Supervisors -->
    <h3 class="section-title">المشرفون</h3>
    <div class="grid grid-3" style="margin-bottom:26px;">
      <div v-for="s in state.supervisors" :key="s.id" class="card">
        <div class="field"><label>اسم المشرف</label><input v-model="s.name" /></div>
        <button class="btn btn-dark btn-sm" style="width:100%;" @click="saveItem">حفظ الاسم</button>
        <p class="hint">كلمة مرور المشرف تُعدَّل من صفحة «كلمة المرور» بعد تسجيل دخوله.</p>
      </div>
    </div>

    <!-- Collectors -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
      <h3 class="section-title" style="margin:0;">المحصلون</h3>
      <button class="btn btn-dark btn-sm" @click="showAddCollector = true">+ إضافة محصل</button>
    </div>
    <div class="grid grid-3">
      <div v-for="c in state.collectors" :key="c.id" class="card">
        <div class="field"><label>الاسم</label><input v-model="c.name" /></div>
        <div class="row2" style="margin-bottom:10px;">
          <div class="field" style="margin-bottom:0;"><label>رقم الجوال</label><input v-model="c.phone" placeholder="05xxxxxxxx" /></div>
          <div class="field" style="margin-bottom:0;"><label>كلمة المرور</label><input v-model="c.password" /></div>
        </div>
        <button class="btn btn-dark btn-sm" style="width:100%;margin-bottom:12px;" @click="saveItem">حفظ التعديلات</button>
        <div class="kv"><span class="k">عدد المستأجرين</span><span class="v">{{ state.tenants.filter(t=>t.collectorId===c.id).length }}</span></div>
        <div class="kv"><span class="k">محصّل هذا الشهر</span><span class="v">{{ fmtMoney(collectedForMonth(c.id, mk)) }}</span></div>
        <div class="kv"><span class="k">المستهدف</span><span class="v">{{ fmtMoney(targetForCollector(c.id)) }}</span></div>
        <div class="progress" style="margin-top:10px;">
          <div :style="`width:${cPct(c.id)}%`" />
        </div>
      </div>
      <div v-if="!state.collectors.length" class="card"><div class="empty-state"><b>لا يوجد محصلون بعد</b></div></div>
    </div>

    <!-- Add Owner Modal -->
    <div v-if="showAddOwner" class="modal-overlay" @mousedown.self="showAddOwner=false">
      <div class="modal">
        <div class="modal-head"><h3>إضافة حساب مالك جديد</h3><button class="modal-close" @click="showAddOwner=false">×</button></div>
        <div class="field"><label>اسم المالك</label><input v-model="newOwner.name" placeholder="عبدالله السقامي" /></div>
        <div class="row2">
          <div class="field"><label>رقم الجوال (اختياري)</label><input v-model="newOwner.phone" placeholder="05xxxxxxxx" /></div>
          <div class="field"><label>كلمة المرور</label><input v-model="newOwner.password" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAddOwner=false">إلغاء</button>
          <button class="btn btn-primary" @click="saveOwner">حفظ الحساب</button>
        </div>
      </div>
    </div>

    <!-- Add Collector Modal -->
    <div v-if="showAddCollector" class="modal-overlay" @mousedown.self="showAddCollector=false">
      <div class="modal">
        <div class="modal-head"><h3>إضافة محصل جديد</h3><button class="modal-close" @click="showAddCollector=false">×</button></div>
        <div class="field"><label>اسم المحصل</label><input v-model="newCollector.name" placeholder="خالد أحمد" /></div>
        <div class="row2">
          <div class="field"><label>رقم الجوال (اختياري)</label><input v-model="newCollector.phone" placeholder="05xxxxxxxx" /></div>
          <div class="field"><label>كلمة المرور</label><input v-model="newCollector.password" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAddCollector=false">إلغاء</button>
          <button class="btn btn-primary" @click="saveCollector">حفظ الحساب</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, save, uid, monthKey, fmtMoney, collectedForMonth, targetForCollector } = useAppState()
onMounted(load)
const mk = monthKey()
const showAddOwner = ref(false); const showAddCollector = ref(false)
const newOwner     = reactive({ name:'', phone:'', password:'' })
const newCollector = reactive({ name:'', phone:'', password:'' })
const showToast = inject<(m:string)=>void>('showToast', ()=>{})
const cPct = (id:string) => { const t=targetForCollector(id); return t?Math.min(100,Math.round(collectedForMonth(id,mk)/t*100)):0 }
function saveItem() { save(); showToast('تم حفظ البيانات') }
function saveOwner() {
  if (!newOwner.name.trim()) { showToast('الرجاء إدخال اسم المالك'); return }
  if (!newOwner.password.trim()) { showToast('الرجاء إدخال كلمة مرور'); return }
  state.value.owners.push({ id:uid(), name:newOwner.name.trim(), phone:newOwner.phone.trim(), password:newOwner.password.trim() })
  save(); showAddOwner.value=false; showToast('تم إضافة حساب المالك')
  Object.assign(newOwner, { name:'', phone:'', password:'' })
}
function saveCollector() {
  if (!newCollector.name.trim()) { showToast('الرجاء إدخال اسم المحصل'); return }
  if (!newCollector.password.trim()) { showToast('الرجاء إدخال كلمة مرور'); return }
  state.value.collectors.push({ id:uid(), name:newCollector.name.trim(), phone:newCollector.phone.trim(), password:newCollector.password.trim() })
  save(); showAddCollector.value=false; showToast('تم إضافة حساب المحصل')
  Object.assign(newCollector, { name:'', phone:'', password:'' })
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.section-title { margin:0 0 12px; font-size:14.5px; color:#3A3733; }
.grid { display:grid; gap:16px; }
.grid-3 { grid-template-columns:repeat(3,1fr); }
@media(max-width:1050px){ .grid-3{grid-template-columns:repeat(2,1fr);} }
@media(max-width:600px) { .grid-3{grid-template-columns:1fr;} }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:#8A8479; margin-bottom:6px; font-weight:700; }
.field input { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; color:#2E2B27; outline:none; font-family:inherit; font-size:14px; }
.field input:focus { border-color:#E1712F; background:#fff; }
.row2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media(max-width:520px){ .row2{grid-template-columns:1fr;} }
.kv { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #E6DFD3; font-size:13.5px; }
.kv:last-child { border-bottom:none; }
.kv .k { color:#8A8479; } .kv .v { font-weight:800; }
.progress { background:#F3EFE8; border-radius:20px; height:9px; overflow:hidden; }
.progress>div { height:100%; background:#E1712F; border-radius:20px; transition:.3s; }
.hint { font-size:11.5px; color:#8A8479; margin-top:8px; }
.empty-state { text-align:center; padding:30px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14px; margin-bottom:4px; }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-primary { background:#E1712F; color:#fff; } .btn-primary:hover { background:#B85423; }
.btn-ghost { background:transparent; color:#3A3733; border:1.5px solid #E6DFD3; } .btn-ghost:hover { border-color:#3A3733; }
.btn-dark { background:#3A3733; color:#fff; } .btn-dark:hover { background:#2a2724; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:#fff; border-radius:16px; padding:26px; width:100%; max-width:520px; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close { background:#F3EFE8; border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:#8A8479; cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
</style>
