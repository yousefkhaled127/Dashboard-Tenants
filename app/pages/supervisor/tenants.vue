<template>
  <div>
    <!-- Tenant Detail View -->
    <template v-if="detailId">
      <div class="page-title">
        <div>
          <h2>{{ getTenant(detailId)?.name }}</h2>
          <p>{{ collectorName(getTenant(detailId)?.collectorId ?? '') }} · {{ getTenant(detailId)?.unit }}</p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="detailId = null">‹ رجوع للقائمة</button>
      </div>

      <div class="grid grid-2" v-if="getTenant(detailId) as any">
        <!-- Left -->
        <div>
          <div class="card" style="margin-bottom:16px;">
            <h3>بيانات المستأجر</h3>
            <div class="kv"><span class="k">رقم المستأجر</span><span class="v">{{ getTenant(detailId)?.tenantNumber || '—' }}</span></div>
            <div class="kv"><span class="k">رقم الجوال</span><span class="v">{{ getTenant(detailId)?.phone || '—' }}</span></div>
            <div class="kv"><span class="k">العقار / الوحدة</span><span class="v">{{ getTenant(detailId)?.unit || '—' }}</span></div>
            <div class="kv"><span class="k">المالك المرتبط</span><span class="v">{{ getTenant(detailId)?.ownerId ? ownerName(getTenant(detailId)!.ownerId!) : '—' }}</span></div>
            <div class="kv"><span class="k">تاريخ الاستحقاق</span><span class="v">{{ getTenant(detailId)?.dueDate ? fmtDate(getTenant(detailId)!.dueDate) : '—' }}</span></div>
            <div class="kv"><span class="k">رقم الهوية</span><span class="v">{{ getTenant(detailId)?.idNumber || '—' }}</span></div>
          </div>

          <div class="card" style="margin-bottom:16px;">
            <h3>هدف الشهر الحالي</h3>
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;">
              <span>محصّل {{ fmtMoney(collectedForTenantMonth(detailId, mk)) }}</span>
              <span class="muted">من {{ fmtMoney(getTenant(detailId)?.monthlyTarget ?? 0) }}</span>
            </div>
            <div class="progress" :class="{ ok: tenantPct(detailId) >= 100 }">
              <div :style="`width:${tenantPct(detailId)}%`" />
            </div>
          </div>

          <div class="card">
            <h3>سجل السدادات</h3>
            <div class="table-wrap">
              <table>
                <thead><tr><th>التاريخ</th><th>النوع</th><th>الإيصال</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>
                  <template v-if="tenantPayments(detailId).length">
                    <tr v-for="p in tenantPayments(detailId)" :key="p.id">
                      <td>{{ fmtDate(p.submittedAt.slice(0,10)) }}</td>
                      <td>{{ paymentTypeLabel(p.type) }}</td>
                      <td>{{ p.receiptNumber || '—' }}</td>
                      <td>{{ fmtMoney(p.amount) }}</td>
                      <td><StatusBadge :status="p.status" /></td>
                    </tr>
                  </template>
                  <tr v-else><td colspan="5" class="empty-cell">لا يوجد سدادات بعد</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right -->
        <div>
          <div class="card" style="margin-bottom:16px;">
            <h3>تعديل بيانات المستأجر</h3>
            <div class="row2">
              <div class="field"><label>رقم المستأجر</label><input v-model="editForm.tenantNumber" /></div>
              <div class="field"><label>العقار / الوحدة</label><input v-model="editForm.unit" /></div>
            </div>
            <div class="row2">
              <div class="field"><label>تاريخ الاستحقاق</label><input v-model="editForm.dueDate" type="date" /></div>
              <div class="field"><label>الهدف الشهري (ر.س)</label><input v-model.number="editForm.monthlyTarget" type="number" /></div>
            </div>
            <div class="field"><label>رقم الجوال</label><input v-model="editForm.phone" placeholder="05xxxxxxxx" /></div>
            <div class="field">
              <label>المالك المرتبط</label>
              <select v-model="editForm.ownerId">
                <option value="">بدون مالك</option>
                <option v-for="o in state.owners" :key="o.id" :value="o.id">{{ o.name }}</option>
              </select>
            </div>
            <div class="row2">
              <div class="field"><label>رقم الهوية (لبوابة الصيانة)</label><input v-model="editForm.idNumber" /></div>
              <div class="field"><label>تاريخ الميلاد</label><input v-model="editForm.birthDate" type="date" /></div>
            </div>
            <button class="btn btn-dark btn-sm" style="width:100%" @click="saveEdit">حفظ</button>
          </div>

          <div class="card" style="margin-bottom:16px;">
            <h3>الوعود / المواعيد</h3>
            <div v-for="p in getTenant(detailId)?.promises ?? []" :key="p.id"
              class="note-item" :style="`border-right:3px solid ${promiseColor(p.date)}`">
              <b>{{ fmtDate(p.date) }}</b> — {{ p.note || 'بدون ملاحظة' }}
            </div>
            <p v-if="!getTenant(detailId)?.promises?.length" class="muted" style="font-size:12.5px;">لا توجد وعود</p>
            <div class="row2" style="margin-top:10px;">
              <input v-model="newPromiseDate" type="date" />
              <input v-model="newPromiseNote" placeholder="ملاحظة الموعد" />
            </div>
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px" @click="addPromise">+ إضافة موعد</button>
          </div>

          <div class="card">
            <h3>ملاحظات المستأجر</h3>
            <div v-for="n in [...(getTenant(detailId)?.notes ?? [])].reverse()" :key="n.id" class="note-item">
              {{ n.text }}<div class="meta">{{ n.by }} · {{ fmtDate(n.at.slice(0,10)) }}</div>
            </div>
            <p v-if="!getTenant(detailId)?.notes?.length" class="muted" style="font-size:12.5px;">لا توجد ملاحظات</p>
            <textarea v-model="newNote" placeholder="أضف ملاحظة جديدة..." style="margin-top:8px;" />
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px" @click="addNote">+ إضافة ملاحظة</button>
          </div>
        </div>
      </div>
    </template>

    <!-- List View -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>المستأجرون</h2>
          <p>{{ monthLabel(mk) }} · {{ filteredList.length }} مستأجر</p>
        </div>
        <button class="btn btn-dark btn-sm" @click="showAdd = true">+ إضافة مستأجر</button>
      </div>

      <div class="search-bar">
        <input v-model="searchQ" placeholder="ابحث بالاسم، رقم الجوال، رقم المستأجر أو رقم الوحدة..." />
        <select v-model="filterCollector">
          <option value="">كل المحصلين</option>
          <option v-for="c in state.collectors" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>رقم المستأجر</th><th>المستأجر</th><th>العقار / الوحدة</th>
                <th>المحصل</th><th>تاريخ الاستحقاق</th><th>المستهدف</th><th>المحصّل</th><th>الحالة</th><th></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="filteredList.length">
                <tr v-for="t in filteredList" :key="t.id" class="clickable" @click="openDetail(t.id)">
                  <td>{{ t.tenantNumber || '—' }}</td>
                  <td><b>{{ t.name }}</b><div v-if="t.phone" class="muted" style="font-size:11.5px;">{{ t.phone }}</div></td>
                  <td>{{ t.unit || '—' }}</td>
                  <td>{{ collectorName(t.collectorId) }}</td>
                  <td>{{ t.dueDate ? fmtDate(t.dueDate) : '—' }}</td>
                  <td>{{ fmtMoney(t.monthlyTarget) }}</td>
                  <td>{{ fmtMoney(collectedForTenantMonth(t.id, mk)) }}</td>
                  <td><StatusBadge :status="tenantStatus(t.id)" /></td>
                  <td><button class="btn btn-ghost btn-sm" @click.stop="openDetail(t.id)">فتح ›</button></td>
                </tr>
              </template>
              <tr v-else><td colspan="9"><div class="empty-state"><b>لا يوجد مستأجرون مطابقون</b></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Add Modal -->
    <div v-if="showAdd" class="modal-overlay" @mousedown.self="showAdd = false">
      <div class="modal">
        <div class="modal-head"><h3>إضافة مستأجر جديد</h3><button class="modal-close" @click="showAdd = false">×</button></div>
        <div class="field"><label>اسم المستأجر</label><input v-model="addForm.name" placeholder="محمد عبدالله" /></div>
        <div class="row2">
          <div class="field"><label>رقم المستأجر</label><input v-model="addForm.tenantNumber" placeholder="T-1024" /></div>
          <div class="field"><label>رقم الجوال</label><input v-model="addForm.phone" placeholder="05xxxxxxxx" /></div>
        </div>
        <div class="row2">
          <div class="field"><label>العقار / الوحدة</label><input v-model="addForm.unit" placeholder="برج الأمل - وحدة 12" /></div>
          <div class="field"><label>تاريخ الاستحقاق</label><input v-model="addForm.dueDate" type="date" /></div>
        </div>
        <div class="field"><label>الهدف الشهري (ر.س)</label><input v-model.number="addForm.monthlyTarget" type="number" /></div>
        <div class="row2">
          <div class="field"><label>المحصل المسؤول</label>
            <select v-model="addForm.collectorId">
              <option v-for="c in state.collectors" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="field"><label>المالك المرتبط (اختياري)</label>
            <select v-model="addForm.ownerId">
              <option value="">بدون مالك</option>
              <option v-for="o in state.owners" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>رقم الهوية (لبوابة الصيانة)</label><input v-model="addForm.idNumber" /></div>
          <div class="field"><label>تاريخ الميلاد</label><input v-model="addForm.birthDate" type="date" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAdd = false">إلغاء</button>
          <button class="btn btn-primary" @click="saveTenant">حفظ المستأجر</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'

const {
  state, load, save, uid, monthKey, monthLabel, fmtDate, fmtMoney, todayISO,
  collectorName, ownerName, getTenant, collectedForTenantMonth, targetForCollector, paymentTypeLabel,
} = useAppState()

onMounted(load)

const mk = monthKey()
const detailId = ref<string|null>(null)
const searchQ = ref('')
const filterCollector = ref('')
const showAdd = ref(false)
const newNote = ref('')
const newPromiseDate = ref(todayISO())
const newPromiseNote = ref('')

// edit form
const editForm = reactive({ tenantNumber:'', unit:'', dueDate:'', monthlyTarget:0, phone:'', ownerId:'', idNumber:'', birthDate:'' })
watch(detailId, id => {
  if (!id) return
  const t = getTenant(id)
  if (t) Object.assign(editForm, { tenantNumber:t.tenantNumber, unit:t.unit, dueDate:t.dueDate, monthlyTarget:t.monthlyTarget, phone:t.phone, ownerId:t.ownerId||'', idNumber:t.idNumber, birthDate:t.birthDate })
})

const addForm = reactive({ name:'', tenantNumber:'', phone:'', unit:'', dueDate:todayISO(), monthlyTarget:0, collectorId:'', ownerId:'', idNumber:'', birthDate:'' })
watch(state, () => { if (!addForm.collectorId && state.value.collectors[0]) addForm.collectorId = state.value.collectors[0].id }, { immediate:true })

const baseList = computed(() => filterCollector.value ? state.value.tenants.filter(t => t.collectorId === filterCollector.value) : state.value.tenants)
const filteredList = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return baseList.value
  return baseList.value.filter(t =>
    t.name.toLowerCase().includes(q) || (t.phone||'').includes(q) ||
    (t.tenantNumber||'').toLowerCase().includes(q) || (t.unit||'').toLowerCase().includes(q))
})

const tenantPayments = (id: string) => state.value.payments.filter(p => p.tenantId === id).sort((a,b) => b.submittedAt.localeCompare(a.submittedAt))

const tenantStatus = (id: string): string => {
  const t = getTenant(id); if (!t) return 'pending'
  const col = collectedForTenantMonth(id, mk), target = Number(t.monthlyTarget||0)
  if (target && col >= target) return 'approved'
  if (col > 0) return 'pending'
  return 'neutral'
}

const tenantPct = (id: string) => {
  const t = getTenant(id); if (!t) return 0
  const target = Number(t.monthlyTarget||0)
  return target ? Math.min(100, Math.round(collectedForTenantMonth(id, mk)/target*100)) : 0
}

const promiseColor = (date: string) => {
  const diff = Math.round((new Date(date).getTime() - new Date().getTime()) / 86400000)
  if (diff < 0) return '#B3452F'
  if (diff <= 2) return '#B8791E'
  return '#E6DFD3'
}

const showToast = inject<(m:string)=>void>('showToast', () => {})

function openDetail(id: string) {
  detailId.value = id
  newNote.value = ''
  newPromiseDate.value = todayISO()
  newPromiseNote.value = ''
}

async function saveEdit() {
  const t = getTenant(detailId.value!)
  if (!t) return
  Object.assign(t, { tenantNumber:editForm.tenantNumber, unit:editForm.unit, dueDate:editForm.dueDate, monthlyTarget:editForm.monthlyTarget, phone:editForm.phone, ownerId:editForm.ownerId||null, idNumber:editForm.idNumber, birthDate:editForm.birthDate })
  save(); showToast('تم تحديث بيانات المستأجر')
}

async function addPromise() {
  const t = getTenant(detailId.value!); if (!t) return
  if (!newPromiseDate.value) { showToast('اختر تاريخ الموعد'); return }
  t.promises.push({ id:uid(), date:newPromiseDate.value, note:newPromiseNote.value.trim() })
  save(); showToast('تم إضافة الموعد')
  newPromiseDate.value = todayISO(); newPromiseNote.value = ''
}

async function addNote() {
  const t = getTenant(detailId.value!); if (!t) return
  const txt = newNote.value.trim(); if (!txt) return
  const session = JSON.parse(localStorage.getItem('tahsilat-session')||'{}')
  t.notes.push({ id:uid(), text:txt, by:session.name||'المشرف', at:new Date().toISOString() })
  save(); newNote.value = ''
}

async function saveTenant() {
  if (!addForm.name.trim()) { showToast('الرجاء إدخال اسم المستأجر'); return }
  const t = {
    id:uid(), name:addForm.name.trim(), tenantNumber:addForm.tenantNumber.trim(),
    phone:addForm.phone.trim(), unit:addForm.unit.trim(), dueDate:addForm.dueDate||'',
    monthlyTarget:addForm.monthlyTarget||0, collectorId:addForm.collectorId,
    ownerId:addForm.ownerId||null, idNumber:addForm.idNumber.trim(), birthDate:addForm.birthDate||'',
    notes:[], dues:{}, promises:[]
  }
  state.value.tenants.push(t)
  save(); showAdd.value = false; showToast('تم إضافة المستأجر')
  Object.assign(addForm, { name:'', tenantNumber:'', phone:'', unit:'', dueDate:todayISO(), monthlyTarget:0, ownerId:'', idNumber:'', birthDate:'' })
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p { margin:2px 0 0; color:#8A8479; font-size:13px; }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:#3A3733; }
.grid { display:grid; gap:16px; }
.grid-2 { grid-template-columns:2fr 1fr; }
@media(max-width:1050px){ .grid-2{grid-template-columns:1fr;} }
.search-bar { display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
.search-bar input { flex:1; min-width:200px; padding:11px 15px; border-radius:10px; border:1.5px solid #E6DFD3; background:#fff; font-size:14px; outline:none; font-family:inherit; }
.search-bar input:focus { border-color:#E1712F; }
.search-bar select { padding:9px 12px; border-radius:9px; border:1.5px solid #E6DFD3; background:#F3EFE8; font-size:13px; font-weight:700; outline:none; font-family:inherit; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:#8A8479; font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid #E6DFD3; white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid #E6DFD3; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
tr.clickable:hover { background:#F3EFE8; cursor:pointer; }
.empty-state { text-align:center; padding:40px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14.5px; margin-bottom:4px; }
.empty-cell { text-align:center; padding:16px; color:#8A8479; }
.muted { color:#8A8479; }
.kv { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #E6DFD3; font-size:13.5px; }
.kv:last-child { border-bottom:none; }
.kv .k { color:#8A8479; } .kv .v { font-weight:800; }
.note-item { background:#F3EFE8; border-radius:10px; padding:10px 12px; margin-bottom:8px; font-size:13px; }
.meta { color:#8A8479; font-size:11px; margin-top:4px; }
.progress { background:#F3EFE8; border-radius:20px; height:9px; overflow:hidden; }
.progress>div { height:100%; background:#E1712F; border-radius:20px; transition:.3s; }
.progress.ok>div { background:#3F7D52; }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:#8A8479; margin-bottom:6px; font-weight:700; }
.field input,.field select { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; color:#2E2B27; outline:none; font-family:inherit; font-size:14px; }
.field input:focus,.field select:focus { border-color:#E1712F; background:#fff; }
textarea { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; resize:vertical; min-height:70px; outline:none; font-family:inherit; font-size:14px; }
textarea:focus { border-color:#E1712F; background:#fff; }
.row2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media(max-width:520px){ .row2{grid-template-columns:1fr;} }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-primary { background:#E1712F; color:#fff; } .btn-primary:hover { background:#B85423; }
.btn-ghost { background:transparent; color:#3A3733; border:1.5px solid #E6DFD3; } .btn-ghost:hover { border-color:#3A3733; }
.btn-dark { background:#3A3733; color:#fff; } .btn-dark:hover { background:#2a2724; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:#fff; border-radius:16px; padding:26px; width:100%; max-width:520px; max-height:88vh; overflow:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close { background:#F3EFE8; border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:#8A8479; cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
</style>

<!-- Shared Status Badge component -->
<script lang="ts">
export const StatusBadge = defineComponent({
  props: { status: String },
  setup(props) {
    const map: Record<string, { cls: string; label: string }> = {
      pending:           { cls:'badge-pending',  label:'قيد المراجعة' },
      approved:          { cls:'badge-approved', label:'معتمد' },
      rejected:          { cls:'badge-rejected', label:'مرفوض' },
      neutral:           { cls:'badge-neutral',  label:'لم يسدد' },
      requested:         { cls:'badge-pending',  label:'بانتظار الإصدار' },
      issued:            { cls:'badge-neutral',  label:'صادر' },
      delivered_pending: { cls:'badge-pending',  label:'بانتظار الاعتماد' },
      accepted:          { cls:'badge-approved', label:'مقبولة' },
    }
    const info = computed(() => map[props.status ?? ''] ?? { cls:'badge-neutral', label: props.status ?? '' })
    return () => h('span', { class: ['badge', info.value.cls] }, info.value.label)
  }
})
</script>
