<template>
  <div>
    <!-- Tenant Detail View -->
    <template v-if="detailId">
      <div class="page-title">
        <div>
          <h2>{{ detail?.tenant_info.name || '...' }}</h2>
          <p>{{ detail?.tenant_info.collector?.name || '—' }} · {{ detail?.tenant_info.property_unit || '—' }}</p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="closeDetail">‹ رجوع للقائمة</button>
      </div>

      <div class="grid grid-2" v-if="detail">
        <!-- Left -->
        <div>
          <div class="card" style="margin-bottom:16px;">
            <h3>بيانات المستأجر</h3>
            <div class="kv"><span class="k">رقم المستأجر</span><span class="v">{{ detail.tenant_info.tenant_number || '—' }}</span></div>
            <div class="kv"><span class="k">رقم الجوال</span><span class="v">{{ detail.tenant_info.phone || '—' }}</span></div>
            <div class="kv"><span class="k">العقار / الوحدة</span><span class="v">{{ detail.tenant_info.property_unit || '—' }}</span></div>
            <div class="kv"><span class="k">المالك المرتبط</span><span class="v">{{ detail.tenant_info.owner?.name || '—' }}</span></div>
            <div class="kv"><span class="k">تاريخ الاستحقاق</span><span class="v">{{ detail.tenant_info.due_date_formatted || '—' }}</span></div>
            <div class="kv"><span class="k">رقم الهوية</span><span class="v">{{ detail.tenant_info.national_id || '—' }}</span></div>
          </div>

          <div class="card" style="margin-bottom:16px;">
            <h3>هدف الشهر الحالي</h3>
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;">
              <span>محصّل {{ fmtMoney(detail.current_month_target.collected_amount) }}</span>
              <span class="muted">من {{ fmtMoney(detail.current_month_target.target_amount) }}</span>
            </div>
            <div class="progress" :class="{ ok: detail.current_month_target.percentage >= 100 }">
              <div :style="`width:${Math.min(100, detail.current_month_target.percentage)}%`" />
            </div>
          </div>

          <div class="card">
            <h3>سجل السدادات</h3>
            <div class="table-wrap">
              <table>
                <thead><tr><th>التاريخ</th><th>النوع</th><th>الإيصال</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>
                  <template v-if="detail.payments_ledger.length">
                    <tr v-for="p in detail.payments_ledger" :key="p.id">
                      <td>{{ p.payment_date_formatted }}</td>
                      <td>{{ p.payment_method }}</td>
                      <td>{{ p.receipt_number || '—' }}</td>
                      <td>{{ fmtMoney(p.amount) }}</td>
                      <td><span class="badge" :class="`badge-${p.status}`">{{ p.status_label }}</span></td>
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
              <div class="field"><label>رقم المستأجر</label><input v-model="editForm.tenant_number" /></div>
              <div class="field"><label>العقار / الوحدة</label><input v-model="editForm.property_unit" /></div>
            </div>
            <div class="row2">
              <div class="field"><label>تاريخ الاستحقاق</label><input v-model="editForm.due_date" type="date" /></div>
              <div class="field"><label>الهدف الشهري (ر.س)</label><input v-model.number="editForm.monthly_target" type="number" /></div>
            </div>
            <div class="field"><label>رقم الجوال</label><input v-model="editForm.phone" placeholder="05xxxxxxxx" /></div>
            <div class="field">
              <label>المالك المرتبط</label>
              <select v-model="editForm.owner_id">
                <option value="">بدون مالك</option>
                <option v-for="o in owners" :key="o.id" :value="o.id">{{ o.name }}</option>
              </select>
            </div>
            <div class="field">
              <label>المحصل المسؤول</label>
              <select v-model="editForm.collector_id">
                <option v-for="c in collectors" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="row2">
              <div class="field"><label>رقم الهوية</label><input v-model="editForm.national_id" /></div>
              <div class="field"><label>تاريخ الميلاد</label><input v-model="editForm.birth_date" type="date" /></div>
            </div>
            <button class="btn btn-dark btn-sm" style="width:100%" :disabled="saving" @click="saveEdit">
              {{ saving ? 'جارٍ الحفظ...' : 'حفظ' }}
            </button>
          </div>

          <div class="card" style="margin-bottom:16px;">
            <h3>الوعود / المواعيد</h3>
            <div v-for="p in detail.promises" :key="p.id"
              class="note-item" :style="`border-right:3px solid ${promiseColor(p.promise_date)}`">
              <b>{{ p.promise_date_formatted }}</b> — {{ p.note || 'بدون ملاحظة' }}
              <div v-if="p.created_by" class="meta">{{ p.created_by.name }} · {{ p.created_at }}</div>
            </div>
            <p v-if="!detail.promises.length" class="muted" style="font-size:12.5px;">لا توجد وعود</p>
            <div class="row2" style="margin-top:10px;">
              <input v-model="newPromiseDate" type="date" />
              <input v-model="newPromiseNote" placeholder="ملاحظة الموعد" />
            </div>
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px" :disabled="saving" @click="addPromise">+ إضافة موعد</button>
          </div>

          <div class="card">
            <h3>ملاحظات المستأجر</h3>
            <div v-for="n in [...detail.notes_list].reverse()" :key="n.id" class="note-item">
              {{ n.content }}<div class="meta">{{ n.author_name }} · {{ n.created_at }}</div>
            </div>
            <p v-if="!detail.notes_list.length" class="muted" style="font-size:12.5px;">لا توجد ملاحظات</p>
            <textarea v-model="newNote" placeholder="أضف ملاحظة جديدة..." style="margin-top:8px;" />
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px" :disabled="saving" @click="addNote">+ إضافة ملاحظة</button>
          </div>
        </div>
      </div>
    </template>

    <!-- List View -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>المستأجرون</h2>
          <p>{{ monthLabel(mk) }} · {{ listData?.pagination.total || 0 }} مستأجر</p>
        </div>
        <button class="btn btn-dark btn-sm" @click="showAdd = true">+ إضافة مستأجر</button>
      </div>

      <div class="search-bar">
        <input v-model="searchQ" placeholder="ابحث بالاسم، رقم الجوال، رقم المستأجر أو رقم الوحدة..." @input="onSearchInput" />
        <select v-model="filterCollector" @change="fetchList">
          <option value="">كل المحصلين</option>
          <option v-for="c in collectors" :key="c.id" :value="c.id">{{ c.name }}</option>
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
              <template v-if="tenants.length">
                <tr v-for="t in tenants" :key="t.id" class="clickable" @click="openDetail(t.id)">
                  <td>{{ t.tenant_number || '—' }}</td>
                  <td><b>{{ t.name }}</b><div v-if="t.phone" class="muted" style="font-size:11.5px;">{{ t.phone }}</div></td>
                  <td>{{ t.property_unit || '—' }}</td>
                  <td>{{ t.collector?.name || '—' }}</td>
                  <td>{{ t.due_date_formatted || '—' }}</td>
                  <td>{{ fmtMoney(t.monthly_target) }}</td>
                  <td>{{ fmtMoney(t.paid_amount) }}</td>
                  <td><span class="badge" :class="`badge-${t.status === 'regular' ? 'approved' : t.status}`">{{ t.status_label }}</span></td>
                  <td><button class="btn btn-ghost btn-sm" @click.stop="openDetail(t.id)">فتح ›</button></td>
                </tr>
              </template>
              <tr v-else><td colspan="9"><div class="empty-state"><b>لا يوجد مستأجرون مطابقون</b></div></td></tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div v-if="listData && listData.pagination.last_page > 1" style="display:flex;justify-content:center;gap:8px;margin-top:16px;">
          <button class="btn btn-ghost btn-sm" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">‹ السابق</button>
          <span style="padding:7px 12px;font-size:13px;font-weight:700;">{{ currentPage }} / {{ listData.pagination.last_page }}</span>
          <button class="btn btn-ghost btn-sm" :disabled="currentPage >= listData.pagination.last_page" @click="changePage(currentPage + 1)">التالي ›</button>
        </div>
      </div>
    </template>

    <!-- Add Modal -->
    <div v-if="showAdd" class="modal-overlay" @mousedown.self="showAdd = false">
      <div class="modal">
        <div class="modal-head"><h3>إضافة مستأجر جديد</h3><button class="modal-close" @click="showAdd = false">×</button></div>
        <div class="field"><label>اسم المستأجر</label><input v-model="addForm.name" placeholder="محمد عبدالله" /></div>
        <div class="row2">
          <div class="field"><label>رقم المستأجر</label><input v-model="addForm.tenant_number" placeholder="T-1024" /></div>
          <div class="field"><label>رقم الجوال</label><input v-model="addForm.phone" placeholder="05xxxxxxxx" /></div>
        </div>
        <div class="row2">
          <div class="field"><label>العقار / الوحدة</label><input v-model="addForm.property_unit" placeholder="برج الأمل - وحدة 12" /></div>
          <div class="field"><label>تاريخ الاستحقاق</label><input v-model="addForm.due_date" type="date" /></div>
        </div>
        <div class="field"><label>الهدف الشهري (ر.س)</label><input v-model.number="addForm.monthly_target" type="number" /></div>
        <div class="row2">
          <div class="field"><label>المحصل المسؤول</label>
            <select v-model="addForm.collector_id">
              <option v-for="c in collectors" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="field"><label>المالك المرتبط (اختياري)</label>
            <select v-model="addForm.owner_id">
              <option value="">بدون مالك</option>
              <option v-for="o in owners" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>رقم الهوية</label><input v-model="addForm.national_id" /></div>
          <div class="field"><label>تاريخ الميلاد</label><input v-model="addForm.birth_date" type="date" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAdd = false">إلغاء</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveTenant">{{ saving ? 'جارٍ الحفظ...' : 'حفظ المستأجر' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type TenantListItem, type TenantDetail, type UserByType } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { supervisor, auth } = useApi()
const { monthKey, monthLabel, fmtMoney, todayISO } = useFormat()

const showToast = inject<(m: string) => void>('showToast', () => {})

const mk = monthKey()
const detailId = ref<number | null>(null)
const detail = ref<TenantDetail | null>(null)
const searchQ = ref('')
const filterCollector = ref<number | ''>('')
const showAdd = ref(false)
const saving = ref(false)
const newNote = ref('')
const newPromiseDate = ref(todayISO())
const newPromiseNote = ref('')
const currentPage = ref(1)

// بيانات القائمة
const listData = ref<{ tenants: TenantListItem[]; pagination: any; period: string } | null>(null)
const tenants = computed(() => listData.value?.tenants || [])

// المحصلون والملاك للقوائم المنسدلة
const collectors = ref<UserByType[]>([])
const owners = ref<UserByType[]>([])

// edit form
const editForm = reactive({
  tenant_number: '', property_unit: '', due_date: '', monthly_target: 0,
  phone: '', owner_id: '' as number | '', collector_id: '' as number | '',
  national_id: '', birth_date: '',
})

const addForm = reactive({
  name: '', tenant_number: '', phone: '', property_unit: '', due_date: todayISO(),
  monthly_target: 0, collector_id: '' as number | '', owner_id: '' as number | '',
  national_id: '', birth_date: '',
})

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchList() }, 350)
}

async function fetchList() {
  try {
    listData.value = await supervisor.tenants({
      search: searchQ.value || undefined,
      collector_id: filterCollector.value || undefined,
      period: mk,
      page: currentPage.value,
    })
  } catch { showToast('تعذّر جلب قائمة المستأجرين') }
}

async function fetchCollectorsAndOwners() {
  try {
    collectors.value = await auth.usersByType('collector')
  } catch { /* تجاهل */ }
  try {
    owners.value = await auth.usersByType('owner')
  } catch { /* تجاهل */ }
}

onMounted(async () => {
  await Promise.all([fetchList(), fetchCollectorsAndOwners()])
  if (collectors.value.length && !addForm.collector_id) addForm.collector_id = collectors.value[0].id
})

async function changePage(p: number) {
  currentPage.value = p
  await fetchList()
}

async function openDetail(id: number) {
  detailId.value = id
  detail.value = null
  newNote.value = ''
  newPromiseDate.value = todayISO()
  newPromiseNote.value = ''
  try {
    detail.value = await supervisor.showTenant(id, mk)
    const t = detail.value.tenant_info
    Object.assign(editForm, {
      tenant_number: t.tenant_number, property_unit: t.property_unit,
      due_date: t.due_date, monthly_target: t.monthly_target,
      phone: t.phone, owner_id: t.owner?.id || '', collector_id: t.collector?.id || '',
      national_id: t.national_id || '', birth_date: t.birth_date || '',
    })
  } catch { showToast('تعذّر جلب بيانات المستأجر') }
}

function closeDetail() {
  detailId.value = null
  detail.value = null
}

const promiseColor = (date: string) => {
  const diff = Math.round((new Date(date).getTime() - new Date().getTime()) / 86400000)
  if (diff < 0) return '#B3452F'
  if (diff <= 2) return '#B8791E'
  return '#E6DFD3'
}

async function saveEdit() {
  if (!detailId.value) return
  saving.value = true
  try {
    await supervisor.updateTenant(detailId.value, {
      name: detail.value!.tenant_info.name,
      tenant_number: editForm.tenant_number,
      phone: editForm.phone,
      property_unit: editForm.property_unit,
      due_date: editForm.due_date,
      monthly_target: editForm.monthly_target,
      collector_id: editForm.collector_id || undefined,
      owner_id: editForm.owner_id || undefined,
      national_id: editForm.national_id,
      birth_date: editForm.birth_date,
    })
    showToast('تم تحديث بيانات المستأجر')
    await openDetail(detailId.value)
    await fetchList()
  } catch (e: any) {
    showToast(e?.data?.message || 'تعذّر تحديث البيانات')
  } finally {
    saving.value = false
  }
}

async function addPromise() {
  if (!detailId.value) return
  if (!newPromiseDate.value) { showToast('اختر تاريخ الموعد'); return }
  saving.value = true
  try {
    await supervisor.addPromise(detailId.value, {
      promise_date: newPromiseDate.value,
      note: newPromiseNote.value.trim(),
    })
    showToast('تم إضافة الموعد')
    await openDetail(detailId.value)
    newPromiseDate.value = todayISO()
    newPromiseNote.value = ''
  } catch { showToast('تعذّر إضافة الموعد') } finally {
    saving.value = false
  }
}

async function addNote() {
  if (!detailId.value) return
  const txt = newNote.value.trim()
  if (!txt) return
  saving.value = true
  try {
    await supervisor.addNote(detailId.value, { content: txt })
    showToast('تم إضافة الملاحظة')
    await openDetail(detailId.value)
    newNote.value = ''
  } catch { showToast('تعذّر إضافة الملاحظة') } finally {
    saving.value = false
  }
}

async function saveTenant() {
  if (!addForm.name.trim()) { showToast('الرجاء إدخال اسم المستأجر'); return }
  saving.value = true
  try {
    await supervisor.createTenant({
      name: addForm.name.trim(),
      tenant_number: addForm.tenant_number.trim(),
      phone: addForm.phone.trim(),
      property_unit: addForm.property_unit.trim(),
      due_date: addForm.due_date || undefined,
      monthly_target: addForm.monthly_target || 0,
      collector_id: addForm.collector_id || undefined,
      owner_id: addForm.owner_id || undefined,
      national_id: addForm.national_id.trim(),
      birth_date: addForm.birth_date || undefined,
    })
    showAdd.value = false
    showToast('تم إضافة المستأجر')
    Object.assign(addForm, {
      name: '', tenant_number: '', phone: '', property_unit: '', due_date: todayISO(),
      monthly_target: 0, owner_id: '', national_id: '', birth_date: '',
    })
    currentPage.value = 1
    await fetchList()
  } catch (e: any) {
    const msg = e?.data?.message
    if (msg) { showToast(msg) }
    else { showToast('تعذّر إضافة المستأجر') }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
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
.btn-primary { background:#E1712F; color:#fff; } .btn-primary:hover:not(:disabled) { background:#B85423; }
.btn-ghost { background:transparent; color:#3A3733; border:1.5px solid #E6DFD3; } .btn-ghost:hover:not(:disabled) { border-color:#3A3733; }
.btn-dark { background:#3A3733; color:#fff; } .btn-dark:hover:not(:disabled) { background:#2a2724; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:default; }
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:#fff; border-radius:16px; padding:26px; width:100%; max-width:520px; max-height:88vh; overflow:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close { background:#F3EFE8; border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:#8A8479; cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending { background:#FBEEDA; color:#B8791E; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }
.badge-regular { background:#E4F1E7; color:#3F7D52; }
.badge-neutral { background:#F3EFE8; color:#8A8479; }
</style>
