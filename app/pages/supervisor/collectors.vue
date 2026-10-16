<template>
  <div>
    <div class="page-title">
      <div>
        <h2>المستخدمون والصلاحيات</h2>
        <p>إدارة جميع الحسابات: الإضافة، تعديل البيانات، تغيير كلمات المرور، الإيقاف والحذف</p>
      </div>
      <button class="btn btn-dark btn-sm" @click="openAdd">{{ addLabel }}</button>
    </div>

    <!-- Tabs -->
    <div class="pill-tabs" style="flex-wrap:wrap;">
      <button
        v-for="t in tabs" :key="t.value"
        class="pill-tab" :class="{ active: activeTab === t.value }"
        @click="switchTab(t.value)"
      >
        {{ t.label }} ({{ tabCount(t.value) }})
      </button>
    </div>

    <!-- Supervisor type cards summary -->
    <div v-if="activeTab === 'supervisor' && typeInfo.length" class="grid grid-4" style="margin-bottom:14px;">
      <div v-for="ti in typeInfo" :key="ti.value" class="card" style="padding:13px;">
        <div style="font-weight:800;font-size:13px;">{{ ti.label }}</div>
        <div class="muted" style="font-size:11.5px;margin-top:4px;line-height:1.6;">{{ ti.description }}</div>
      </div>
    </div>

    <!-- Owner hint -->
    <p v-if="activeTab === 'owner'" class="hint" style="margin:0 0 12px;">
      يسجّل المالك دخوله برقم الهوية وكلمة المرور، ولا تظهر أسماء الملاك في صفحة الدخول.
    </p>

    <!-- Search -->
    <div class="search-bar" style="margin-bottom:14px;">
      <input v-model="searchQ" :placeholder="searchPlaceholder" @input="onSearchInput" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-card"><div class="spinner" /><span>جارٍ التحميل...</span></div>

    <!-- User cards grid -->
    <div v-else class="grid grid-3">
      <template v-if="users.length">
        <div
          v-for="u in users" :key="u.id"
          class="card user-card"
          :class="{ 'is-disabled': !u.is_active }"
        >
          <!-- Head -->
          <div class="user-head">
            <div class="user-avatar" :class="{ muted: !u.is_active }">
              {{ (u.name || '?').trim().charAt(0) }}
            </div>
            <div style="flex:1;min-width:0;">
              <div class="user-name">
                {{ u.name }}
                <span v-if="u.is_active === false" class="badge badge-rejected" style="font-size:10px;margin-right:6px;">موقوف</span>
                <span v-else class="badge badge-approved" style="font-size:10px;margin-right:6px;">نشط</span>
              </div>
              <div class="muted" style="font-size:11.5px;">{{ typeLabel(u) }}</div>
            </div>
          </div>

          <!-- Edit form -->
          <div class="field"><label>الاسم</label>
            <input v-model="editForms[u.id].name" />
          </div>

          <template v-if="activeTab === 'supervisor'">
            <div class="field"><label>نوع المشرف (الصلاحيات)</label>
              <select v-model="editForms[u.id].type">
                <option v-for="ti in typeInfo" :key="ti.value" :value="ti.value">{{ ti.label }} — {{ ti.description }}</option>
              </select>
            </div>
            <div class="field"><label>رقم الجوال</label>
              <input v-model="editForms[u.id].phone" placeholder="05xxxxxxxx" />
            </div>
          </template>

          <template v-else-if="activeTab === 'collector'">
            <div class="field"><label>رقم الجوال</label>
              <input v-model="editForms[u.id].phone" placeholder="05xxxxxxxx" />
            </div>
          </template>

          <template v-else>
            <div class="field"><label>رقم الهوية (للدخول)</label>
              <input v-model="editForms[u.id].national_id" inputmode="numeric" />
              <div v-if="!editForms[u.id].national_id" class="hint" style="color:var(--danger);">لا يوجد رقم هوية — لن يتمكن المالك من الدخول</div>
            </div>
            <div class="field"><label>رقم الجوال</label>
              <input v-model="editForms[u.id].phone" placeholder="05xxxxxxxx" />
            </div>
          </template>

          <div class="field"><label>كلمة مرور جديدة (اتركها فارغة للإبقاء)</label>
            <input v-model="editForms[u.id].password" type="password" placeholder="4 أحرف على الأقل" autocomplete="new-password" />
          </div>

          <!-- Stats -->
          <template v-if="activeTab === 'collector'">
            <div class="kv"><span class="k">المستأجرون</span><span class="v">{{ (u as any).tenants_count ?? '—' }}</span></div>
            <div class="kv"><span class="k">محصّل هذا الشهر</span><span class="v">{{ fmtMoney((u as any).collected_this_month ?? 0) }} / {{ fmtMoney((u as any).target_this_month ?? 0) }}</span></div>
          </template>
          <template v-else-if="activeTab === 'owner'">
            <div class="kv"><span class="k">العقارات</span><span class="v">{{ (u as any).properties_count ?? '—' }}</span></div>
            <div class="kv"><span class="k">المستأجرون</span><span class="v">{{ (u as any).tenants_count ?? '—' }}</span></div>
          </template>

          <button class="btn btn-dark btn-sm" style="width:100%;margin-bottom:10px;" :disabled="saving === u.id" @click="saveUser(u)">
            {{ saving === u.id ? 'جارٍ الحفظ...' : 'حفظ التعديلات' }}
          </button>

          <div style="display:flex;gap:6px;">
            <button class="btn btn-ghost btn-sm" style="flex:1;" :disabled="saving === u.id" @click="toggleUser(u)">
              {{ u.is_active ? 'إيقاف الحساب' : 'تفعيل الحساب' }}
            </button>
            <button class="btn btn-danger btn-sm" style="flex:1;" :disabled="saving === u.id" @click="deleteUser(u)">
              حذف
            </button>
          </div>
        </div>
      </template>

      <div v-else class="card" style="grid-column:1/-1;">
        <div class="empty-state">
          <b>{{ searchQ ? 'لا توجد نتائج مطابقة' : 'لا توجد حسابات بعد' }}</b>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div v-if="showAdd" class="modal-overlay" @mousedown.self="showAdd = false">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ addLabel }}</h3>
          <button class="modal-close" @click="showAdd = false">×</button>
        </div>

        <div v-if="addError" class="form-error">{{ addError }}</div>

        <div class="field"><label>الاسم <span class="req">*</span></label>
          <input v-model="addForm.name" placeholder="الاسم الكامل" />
        </div>

        <template v-if="activeTab === 'supervisor'">
          <div class="field"><label>نوع المشرف <span class="req">*</span></label>
            <select v-model="addForm.type">
              <option v-for="ti in typeInfo" :key="ti.value" :value="ti.value">{{ ti.label }} — {{ ti.description }}</option>
            </select>
          </div>
          <div class="field"><label>رقم الجوال</label>
            <input v-model="addForm.phone" placeholder="05xxxxxxxx" />
          </div>
        </template>

        <template v-else-if="activeTab === 'collector'">
          <div class="field"><label>رقم الجوال (اختياري)</label>
            <input v-model="addForm.phone" placeholder="05xxxxxxxx" />
          </div>
        </template>

        <template v-else>
          <div class="field"><label>رقم الهوية (يُستخدم للدخول) <span class="req">*</span></label>
            <input v-model="addForm.national_id" inputmode="numeric" />
          </div>
          <div class="field"><label>رقم الجوال (اختياري)</label>
            <input v-model="addForm.phone" placeholder="05xxxxxxxx" />
          </div>
        </template>

        <div class="field"><label>كلمة المرور <span class="req">*</span></label>
          <input v-model="addForm.password" type="text" placeholder="4 أحرف على الأقل" autocomplete="new-password" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAdd = false">إلغاء</button>
          <button class="btn btn-primary" :disabled="adding" @click="createUser">
            {{ adding ? 'جارٍ الإنشاء...' : 'إنشاء الحساب' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm delete modal -->
    <div v-if="confirmDelete" class="modal-overlay" @mousedown.self="confirmDelete = null">
      <div class="modal">
        <div class="modal-head"><h3>حذف الحساب</h3><button class="modal-close" @click="confirmDelete = null">×</button></div>
        <p>هل أنت متأكد من حذف حساب <b>{{ confirmDelete.name }}</b>؟ لا يمكن التراجع.</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="confirmDelete = null">إلغاء</button>
          <button class="btn btn-danger" :disabled="deleting" @click="confirmDeleteUser">
            {{ deleting ? 'جارٍ الحذف...' : 'تأكيد الحذف' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import {
  useApi,
  type SupervisorUser,
  type CollectorUser,
  type OwnerUser,
  type UserTypeInfo,
} from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { manager } = useApi()
const { fmtMoney } = useFormat()

const showToast = inject<(m: string) => void>('showToast', () => {})

// ===== TABS =====
const tabs = [
  { value: 'supervisor', label: 'المشرفون' },
  { value: 'collector',  label: 'المحصلون' },
  { value: 'owner',      label: 'الملاك'    },
]
const activeTab = ref('supervisor')
const tabCounts = ref<Record<string, number>>({ supervisor: 0, collector: 0, owner: 0 })
const tabCount  = (t: string) => tabCounts.value[t] ?? 0

// ===== DATA =====
const users    = ref<any[]>([])
const typeInfo = ref<UserTypeInfo[]>([])
const searchQ  = ref('')
const loading  = ref(false)
const saving   = ref<number | null>(null)
const deleting = ref(false)
const editForms = ref<Record<number, any>>({})

// ===== ADD MODAL =====
const showAdd  = ref(false)
const adding   = ref(false)
const addError = ref('')
const addForm  = reactive({ name: '', type: 'general_manager', phone: '', national_id: '', password: '' })

const addLabel = computed(() => ({
  supervisor: '+ إضافة مشرف',
  collector:  '+ إضافة محصل',
  owner:      '+ إضافة مالك',
}[activeTab.value] ?? '+ إضافة'))

const searchPlaceholder = computed(() =>
  activeTab.value === 'owner'
    ? 'ابحث بالاسم أو رقم الهوية أو الجوال...'
    : 'ابحث بالاسم أو رقم الجوال...'
)

// ===== DELETE CONFIRM =====
const confirmDelete = ref<any | null>(null)

// ===== HELPERS =====
function typeLabel(u: any) {
  if (u.type_label) return u.type_label
  if (u.type === 'collector') return 'محصل'
  if (u.type === 'owner')     return 'مالك'
  return 'مشرف'
}

function buildEditForm(u: any) {
  editForms.value[u.id] = {
    name:       u.name       ?? '',
    type:       u.type       ?? 'general_manager',
    phone:      u.phone      ?? '',
    national_id: u.national_id ?? '',
    password:   '',
  }
}

// ===== FETCH =====
let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchUsers, 350)
}

async function fetchUsers() {
  loading.value = true
  try {
    const q = searchQ.value || undefined
    if (activeTab.value === 'supervisor') {
      const data = await manager.supervisors({ search: q })
      users.value     = data.supervisors
      typeInfo.value  = data.types ?? []
      tabCounts.value.supervisor = data.statistics.all_count
      // refresh collector/owner counts from tabs_counts if available
    } else if (activeTab.value === 'collector') {
      const data = await manager.collectors({ search: q })
      users.value = data.collectors
      tabCounts.value.collector = data.statistics.all_count
      if (data.tabs_counts) {
        tabCounts.value.supervisor = data.tabs_counts.supervisors
        tabCounts.value.owner      = data.tabs_counts.owners
      }
    } else {
      const data = await manager.owners({ search: q })
      users.value = data.owners
      tabCounts.value.owner = data.statistics.all_count
      if (data.tabs_counts) {
        tabCounts.value.supervisor = data.tabs_counts.supervisors
        tabCounts.value.collector  = data.tabs_counts.collectors
      }
    }
    // rebuild edit forms
    users.value.forEach(buildEditForm)
  } catch { showToast('تعذّر جلب بيانات المستخدمين') }
  loading.value = false
}

onMounted(fetchUsers)

function switchTab(t: string) {
  activeTab.value = t
  searchQ.value   = ''
  users.value     = []
  fetchUsers()
}

// ===== SAVE =====
async function saveUser(u: any) {
  const f = editForms.value[u.id]
  if (!f?.name?.trim()) { showToast('الرجاء إدخال الاسم'); return }
  if (f.password && f.password.length < 4) { showToast('كلمة المرور يجب أن تكون 4 أحرف على الأقل'); return }
  saving.value = u.id
  try {
    const body: Record<string, any> = { name: f.name.trim(), phone: f.phone.trim() }
    if (f.password) body.password = f.password
    if (activeTab.value === 'supervisor') body.type = f.type
    if (activeTab.value === 'owner')      body.national_id = f.national_id.trim()

    if (activeTab.value === 'supervisor') await manager.updateSupervisor(u.id, body)
    else if (activeTab.value === 'collector') await manager.updateCollector(u.id, body)
    else await manager.updateOwner(u.id, body)

    showToast('تم حفظ البيانات')
    f.password = ''
    await fetchUsers()
  } catch (e: any) {
    showToast(e?.data?.message ?? 'تعذّر حفظ البيانات')
  } finally {
    saving.value = null
  }
}

// ===== TOGGLE =====
async function toggleUser(u: any) {
  saving.value = u.id
  try {
    if (activeTab.value === 'supervisor') await manager.toggleSupervisor(u.id)
    else if (activeTab.value === 'collector') await manager.toggleCollector(u.id)
    else await manager.toggleOwner(u.id)
    showToast(u.is_active ? `تم إيقاف حساب ${u.name}` : `تم تفعيل حساب ${u.name}`)
    await fetchUsers()
  } catch (e: any) {
    showToast(e?.data?.message ?? 'تعذّر تغيير حالة الحساب')
  } finally {
    saving.value = null
  }
}

// ===== DELETE =====
function deleteUser(u: any) { confirmDelete.value = u }

async function confirmDeleteUser() {
  const u = confirmDelete.value; if (!u) return
  deleting.value = true
  try {
    if (activeTab.value === 'supervisor') await manager.deleteSupervisor(u.id)
    else if (activeTab.value === 'collector') await manager.deleteCollector(u.id)
    else await manager.deleteOwner(u.id)
    showToast(`تم حذف حساب ${u.name}`)
    confirmDelete.value = null
    await fetchUsers()
  } catch (e: any) {
    showToast(e?.data?.message ?? 'تعذّر حذف الحساب')
  } finally {
    deleting.value = false
  }
}

// ===== CREATE =====
function openAdd() {
  addError.value = ''
  addForm.name = ''; addForm.phone = ''; addForm.national_id = ''; addForm.password = ''
  addForm.type = typeInfo.value[0]?.value ?? 'general_manager'
  showAdd.value = true
}

async function createUser() {
  addError.value = ''
  if (!addForm.name.trim())     { addError.value = 'الرجاء إدخال الاسم'; return }
  if (!addForm.password || addForm.password.length < 4) { addError.value = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل'; return }
  if (activeTab.value === 'owner' && !addForm.national_id.trim()) { addError.value = 'الرجاء إدخال رقم الهوية'; return }
  adding.value = true
  try {
    if (activeTab.value === 'supervisor') {
      await manager.createSupervisor({ name: addForm.name.trim(), type: addForm.type, phone: addForm.phone.trim() || undefined, password: addForm.password })
    } else if (activeTab.value === 'collector') {
      await manager.createCollector({ name: addForm.name.trim(), phone: addForm.phone.trim() || undefined, password: addForm.password })
    } else {
      await manager.createOwner({ name: addForm.name.trim(), national_id: addForm.national_id.trim(), phone: addForm.phone.trim() || undefined, password: addForm.password })
    }
    showToast('تم إنشاء الحساب')
    showAdd.value = false
    await fetchUsers()
  } catch (e: any) {
    const msg = e?.data?.message
    const errs = e?.data?.errors
    if (errs) {
      addError.value = Object.values(errs).flat().join(' — ')
    } else {
      addError.value = msg ?? 'تعذّر إنشاء الحساب'
    }
  } finally {
    adding.value = false
  }
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:2px 0 0; color:var(--muted); font-size:13px; }
.pill-tabs { display:flex; gap:6px; background:var(--bg); padding:4px; border-radius:10px; margin-bottom:16px; width:fit-content; }
.pill-tab { border:none; background:transparent; padding:8px 16px; border-radius:8px; font-weight:700; font-size:13px; color:var(--muted); cursor:pointer; }
.pill-tab.active { background:var(--surface); color:var(--charcoal); box-shadow:0 1px 3px rgba(0,0,0,.08); }
.grid { display:grid; gap:16px; }
.grid-3 { grid-template-columns:repeat(3,1fr); }
.grid-4 { grid-template-columns:repeat(4,1fr); }
@media(max-width:1050px){ .grid-3{grid-template-columns:1fr 1fr;} .grid-4{grid-template-columns:repeat(2,1fr);} }
@media(max-width:600px) { .grid-3{grid-template-columns:1fr;} .grid-4{grid-template-columns:1fr;} }
.card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; }
.user-card { border-top:3px solid var(--orange); }
.user-card.is-disabled { border-top-color:var(--danger); background:var(--bg); }
.user-head { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
.user-avatar { width:40px; height:40px; border-radius:12px; background:var(--orange-tint); color:var(--orange-dark); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:17px; flex-shrink:0; }
.user-avatar.muted { background:var(--line); color:var(--muted); }
.user-name { font-weight:800; font-size:14.5px; color:var(--charcoal); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.field { margin-bottom:12px; }
.field label { display:block; font-size:13px; color:var(--muted); margin-bottom:5px; font-weight:700; }
.field input,.field select { width:100%; padding:10px 12px; border-radius:9px; border:1.5px solid var(--line); background:var(--bg); color:var(--ink); outline:none; font-family:inherit; font-size:14px; }
.field input:focus,.field select:focus { border-color:var(--orange); background:var(--surface); }
.kv { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--line); font-size:13px; }
.kv:last-of-type { border-bottom:none; }
.kv .k { color:var(--muted); } .kv .v { font-weight:800; }
.hint { font-size:11.5px; color:var(--muted); margin-top:3px; }
.req { color:var(--danger); font-weight:900; }
.badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10.5px; font-weight:800; }
.badge-approved { background:var(--success-tint); color:var(--success); }
.badge-rejected { background:var(--danger-tint); color:var(--danger); }
.search-bar input { width:100%; padding:11px 15px; border-radius:10px; border:1.5px solid var(--line); background:var(--surface); font-size:14px; outline:none; font-family:inherit; }
.search-bar input:focus { border-color:var(--orange); }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-primary { background:var(--orange); color:#fff; } .btn-primary:hover:not(:disabled) { background:var(--orange-dark); }
.btn-ghost { background:transparent; color:var(--charcoal); border:1.5px solid var(--line); } .btn-ghost:hover:not(:disabled) { border-color:var(--charcoal); }
.btn-dark { background:var(--charcoal); color:#fff; } .btn-dark:hover:not(:disabled) { opacity:.88; }
.btn-danger { background:var(--danger-tint); color:var(--danger); } .btn-danger:hover:not(:disabled) { background:#f0cdc6; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:default; }
.form-error { background:var(--danger-tint); color:var(--danger); border-radius:9px; padding:10px 12px; font-size:13px; font-weight:700; margin-bottom:12px; }
.loading-card { display:flex; align-items:center; gap:12px; padding:40px; color:var(--muted); font-weight:700; }
.spinner { width:26px; height:26px; border-radius:50%; border:3px solid var(--line); border-top-color:var(--orange); animation:spin .8s linear infinite; flex-shrink:0; }
@keyframes spin { to { transform:rotate(360deg); } }
.empty-state { text-align:center; padding:40px 20px; color:var(--muted); }
.empty-state b { display:block; color:var(--charcoal); font-size:14.5px; margin-bottom:4px; }
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:var(--surface); border-radius:16px; padding:26px; width:100%; max-width:520px; max-height:88vh; overflow:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close { background:var(--bg); border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:var(--muted); cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
</style>
