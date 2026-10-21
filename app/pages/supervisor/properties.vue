<template>
  <div>
    <!-- ===== PROPERTY DETAIL VIEW ===== -->
    <template v-if="selectedPropertyId">
      <div class="page-title">
        <div>
          <h2>{{ selectedProperty?.name || '...' }}</h2>
          <p>المالك: {{ selectedProperty?.owner_name }} {{ selectedProperty?.location ? '· ' + selectedProperty.location : '' }}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" @click="backToList">‹ رجوع للعقارات</button>
          <button class="btn btn-dark btn-sm" @click="openAddContract">+ إضافة عقد</button>
        </div>
      </div>

      <div v-if="detailLoading" class="card" style="text-align:center;padding:40px;"><div class="spinner" style="margin:0 auto;"></div></div>
      <template v-else-if="detail">
        <!-- Stats -->
        <div class="grid grid-4" style="margin-bottom:16px;">
          <div class="card stat-card"><div class="lbl">وحدات بعقود سارية</div><div class="val">{{ detail.statistics.active_contracts_count }}</div><div class="sub">{{ detail.statistics.renewal_notice }}</div></div>
          <div class="card stat-card"><div class="lbl">قيمة العقود السارية</div><div class="val">{{ detail.statistics.active_contracts_total_value_formatted }}</div></div>
          <div class="card stat-card"><div class="lbl">المحصّل هذا الشهر</div><div class="val">{{ detail.statistics.collected_this_month_formatted }}</div></div>
          <div class="card stat-card" style="border-right-color:var(--danger);"><div class="lbl">المبالغ المتأخرة</div><div class="val" :style="detail.statistics.total_overdue>0?'color:var(--danger)':''">{{ detail.statistics.total_overdue_formatted }}</div></div>
        </div>

        <!-- Active contracts -->
        <div class="card" style="margin-bottom:16px;">
          <h3>الوحدات والعقود السارية</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>الوحدة</th><th>المستأجر</th><th>رقم الهوية</th><th>بداية العقد</th><th>انتهاء العقد</th><th>القسط / الدورة</th><th>قيمة العقد</th><th>المحصّل</th><th>المتأخر</th><th>الحالة</th><th></th></tr></thead>
              <tbody>
                <template v-if="detail.active_contracts.length">
                  <tr v-for="c in detail.active_contracts" :key="c.id">
                    <td><b>{{ c.unit_number }}</b></td>
                    <td>{{ c.tenant_name }}<div class="muted" style="font-size:11.5px;">{{ c.tenant_phone }}</div></td>
                    <td>{{ c.national_id||'—' }}</td>
                    <td>{{ c.start_date_formatted }}</td>
                    <td>{{ c.end_date_formatted }}</td>
                    <td>{{ c.installment_cycle_formatted }}</td>
                    <td>{{ c.total_amount_formatted }}</td>
                    <td>{{ c.collected_amount_formatted }}</td>
                    <td :style="c.overdue_amount>0?'color:var(--danger);font-weight:800;':''">{{ c.overdue_amount_formatted }}</td>
                    <td><span class="badge" :class="contractBadgeClass(c.status)">{{ c.status_label }}</span></td>
                    <td>
                      <div style="display:flex;gap:5px;flex-wrap:wrap;">
                        <button class="btn btn-success btn-sm" @click="openRenewContract(c)">تجديد</button>
                        <button class="btn btn-ghost btn-sm" @click="openEditContract(c)">تعديل</button>
                        <button class="btn btn-ghost btn-sm" @click="openTerminateContract(c)">إنهاء</button>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-else><td colspan="11"><div class="empty-state"><b>لا توجد عقود سارية</b>اضغط «إضافة عقد» لإضافة أول عقد</div></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tenants without contract -->
        <div v-if="detail.tenants_without_active_contract?.length" class="card" style="margin-bottom:16px;">
          <h3>مستأجرون مرتبطون بالعقار بدون عقد ساري</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>المستأجر</th><th>الجوال</th><th>الوحدة</th></tr></thead>
              <tbody>
                <tr v-for="t in detail.tenants_without_active_contract" :key="t.id">
                  <td>{{ t.name||t.tenant_name }}</td>
                  <td>{{ t.phone||t.tenant_phone }}</td>
                  <td>{{ t.property_unit||'—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Previous contracts -->
        <div class="card">
          <h3>سجل العقود السابقة (المجددة والمغلقة)</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>الوحدة</th><th>المستأجر</th><th>من</th><th>إلى</th><th>قيمة العقد</th><th>المحصّل</th><th>الحالة</th></tr></thead>
              <tbody>
                <template v-if="detail.previous_contracts.length">
                  <tr v-for="c in detail.previous_contracts" :key="c.id">
                    <td>{{ c.unit_number }}</td>
                    <td>{{ c.tenant_name }}</td>
                    <td>{{ c.start_date_formatted }}</td>
                    <td>{{ c.end_date_formatted }}</td>
                    <td>{{ c.total_amount_formatted }}</td>
                    <td>{{ c.collected_amount_formatted }}</td>
                    <td><span class="badge" :class="contractBadgeClass(c.status)">{{ c.status_label }}</span></td>
                  </tr>
                </template>
                <tr v-else><td colspan="7" class="muted" style="text-align:center;padding:16px;">لا يوجد سجل عقود سابقة</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>

    <!-- ===== PROPERTIES LIST ===== -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>إدارة الأملاك والعقود</h2>
          <p v-if="statistics">{{ statistics.subtitle }}</p>
        </div>
        <button class="btn btn-dark btn-sm" @click="openAddProperty">+ إضافة عقار</button>
      </div>

      <!-- Search + filter -->
      <div class="search-bar">
        <input v-model="searchQ" placeholder="ابحث باسم العقار أو الموقع أو المالك..." @input="debounceLoad">
        <select v-model="ownerFilter" @change="loadProperties">
          <option value="">كل الملاك</option>
          <option v-for="o in ownersList" :key="o.id" :value="o.id">{{ o.name }}</option>
        </select>
      </div>

      <!-- Expiring contracts alert -->
      <div v-if="expiringContracts.length" class="card" style="margin-bottom:16px;border:1.5px solid var(--warning);">
        <h3>عقود بحاجة إلى تجديد ({{ expiringContracts.length }})</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>العقار</th><th>الوحدة</th><th>المستأجر</th><th>تاريخ الانتهاء</th><th>الحالة</th></tr></thead>
            <tbody>
              <tr v-for="item in expiringContracts" :key="item.contractId">
                <td>{{ item.propertyName }}</td>
                <td>{{ item.unitNumber }}</td>
                <td>{{ item.tenantName }}</td>
                <td :style="item.isExpired?'color:var(--danger);font-weight:800;':''">{{ item.endDate }}</td>
                <td><span class="badge" :class="item.isExpired?'badge-rejected':'badge-pending'">{{ item.isExpired ? 'منتهي' : 'ينتهي قريبًا' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="card" style="text-align:center;padding:40px;"><div class="spinner" style="margin:0 auto;"></div></div>

      <!-- Grid -->
      <div v-else class="grid grid-3">
        <template v-if="properties.length">
          <div v-for="p in properties" :key="p.id" class="card property-card" style="cursor:pointer;transition:.15s;"
               @click="openDetail(p.id)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
              <div>
                <h3 style="margin:0 0 4px;">{{ p.name }}</h3>
                <div class="muted" style="font-size:12px;">المالك: {{ p.owner_name }}{{ p.location?' · '+p.location:'' }}</div>
              </div>
            </div>
            <div class="kv"><span class="k">وحدات بعقود سارية</span><span class="v">{{ p.active_contracts_count }}</span></div>
            <div class="kv"><span class="k">المحصّل هذا الشهر</span><span class="v">{{ p.collected_this_month_formatted }}</span></div>
            <div class="kv" style="border-bottom:none;"><span class="k">المبالغ المتأخرة</span>
              <span class="v" :style="p.overdue_amount>0?'color:var(--danger);':''">{{ p.overdue_amount_formatted }}</span>
            </div>
            <div style="display:flex;gap:6px;margin-top:12px;" @click.stop>
              <button class="btn btn-dark btn-sm" style="flex:1;" @click="openDetail(p.id)">فتح العقار ›</button>
              <button class="btn btn-ghost btn-sm" @click="openEditProperty(p)">تعديل</button>
              <button class="btn btn-danger btn-sm" @click="confirmDeleteProperty(p.id)">حذف</button>
            </div>
          </div>
        </template>
        <div v-else class="card" style="grid-column:1/-1;">
          <div class="empty-state"><b>لا توجد عقارات مضافة بعد</b>أضف عقارًا وحدد المالك، ثم ادخل إليه لإضافة العقود</div>
        </div>
      </div>
    </template>

    <!-- ===== MODAL: Add/Edit Property ===== -->
    <div v-if="propModal" class="modal-overlay" @mousedown.self="propModal=null">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ propModal.id ? 'تعديل العقار' : 'إضافة عقار جديد' }}</h3>
          <button class="modal-close" @click="propModal=null">×</button>
        </div>
        <div class="field"><label>المالك *</label>
          <select v-model="propModal.owner_id">
            <option :value="null">اختر المالك</option>
            <option v-for="o in ownersList" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
        </div>
        <div class="field"><label>اسم العقار *</label><input v-model="propModal.name" placeholder="مثال: برج الأمل"></div>
        <div class="field"><label>الموقع / الحي (اختياري)</label><input v-model="propModal.location" placeholder="مثال: الرياض - حي النرجس"></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="propModal=null">إلغاء</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveProperty">
            {{ saving ? 'جارٍ الحفظ...' : (propModal.id ? 'حفظ التعديلات' : 'إضافة العقار') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL: Delete Property ===== -->
    <div v-if="deletePropertyId" class="modal-overlay" @mousedown.self="deletePropertyId=null">
      <div class="modal">
        <div class="modal-head"><h3>حذف العقار</h3><button class="modal-close" @click="deletePropertyId=null">×</button></div>
        <p>هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع.</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="deletePropertyId=null">إلغاء</button>
          <button class="btn btn-danger" :disabled="saving" @click="deleteProperty">تأكيد الحذف</button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL: Add/Edit/Renew Contract ===== -->
    <div v-if="contractModal" class="modal-overlay" @mousedown.self="contractModal=null">
      <div class="modal wide">
        <div class="modal-head">
          <h3>{{ contractModal.mode==='renew' ? 'تجديد العقد' : contractModal.mode==='edit' ? 'تعديل العقد' : 'إضافة عقد جديد' }}</h3>
          <button class="modal-close" @click="contractModal=null">×</button>
        </div>
        <p class="hint">العقار: <b>{{ selectedProperty?.name }}</b> · المالك: <b>{{ selectedProperty?.owner_name }}</b>
          <template v-if="contractModal.originalContract"> · المستأجر: <b>{{ contractModal.originalContract.tenant_name }}</b></template>
        </p>
        <div v-if="contractModal.mode==='renew'" class="note-item" style="margin-bottom:12px;">
          العقد الحالي: من {{ contractModal.originalContract?.start_date_formatted }} إلى {{ contractModal.originalContract?.end_date_formatted }} — {{ contractModal.originalContract?.total_amount_formatted }}
        </div>

        <!-- Tenant selection (add only) -->
        <template v-if="contractModal.mode==='add'">
          <div class="field"><label>المستأجر</label>
            <div class="radio-group" style="margin-bottom:10px;">
              <div class="radio-opt" :class="{ sel: contractModal.tenantMode==='existing' }" @click="contractModal.tenantMode='existing'">مستأجر مسجل</div>
              <div class="radio-opt" :class="{ sel: contractModal.tenantMode==='new' }" @click="contractModal.tenantMode='new'">مستأجر جديد</div>
            </div>
          </div>
          <template v-if="contractModal.tenantMode==='existing'">
            <div class="field">
              <select v-model="contractModal.tenant_id">
                <option :value="null">اختر المستأجر</option>
                <option v-for="t in contractOptions?.tenants||[]" :key="t.id" :value="t.id">{{ t.display_label }}</option>
              </select>
            </div>
          </template>
          <template v-else>
            <div class="row2">
              <div class="field"><label>اسم المستأجر *</label><input v-model="contractModal.new_name"></div>
              <div class="field"><label>رقم الجوال *</label><input v-model="contractModal.new_phone" placeholder="05xxxxxxxx"></div>
            </div>
            <div class="row2">
              <div class="field"><label>رقم الهوية</label><input v-model="contractModal.new_national_id" inputmode="numeric"></div>
              <div class="field"><label>المحصل *</label>
                <select v-model="contractModal.collector_id">
                  <option :value="null">اختر المحصل</option>
                  <option v-for="c in contractOptions?.collectors||[]" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
            </div>
          </template>
        </template>

        <div class="field"><label>رقم الوحدة *</label><input v-model="contractModal.unit_number" placeholder="مثال: 12" :disabled="contractModal.mode==='renew'"></div>
        <div class="row2">
          <div class="field"><label>تاريخ بداية العقد *</label><input type="date" v-model="contractModal.start_date"></div>
          <div class="field"><label>تاريخ انتهاء العقد *</label><input type="date" v-model="contractModal.end_date"></div>
        </div>
        <div class="row2">
          <div class="field"><label>قيمة العقد الإجمالية (ر.س) *</label><input type="number" min="0" v-model.number="contractModal.total_amount"></div>
          <div class="field"><label>دورة السداد</label>
            <select v-model="contractModal.payment_cycle">
              <option v-for="c in contractOptions?.payment_cycles||[]" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>مبلغ القسط (ر.س) *</label><input type="number" min="0" v-model.number="contractModal.installment_amount"></div>
          <div v-if="contractModal.mode!=='edit'" class="field"><label>إنشاء مطالبات الاستحقاق</label>
            <select v-model="contractModal.claim_generation_mode">
              <option v-for="c in contractOptions?.claim_generation_modes||[]" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
        </div>
        <div class="field"><label>ملاحظات (اختياري)</label><textarea v-model="contractModal.notes" rows="2"></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="contractModal=null">إلغاء</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveContract">
            {{ saving ? 'جارٍ الحفظ...' : (contractModal.mode==='renew' ? 'تأكيد التجديد' : 'حفظ العقد') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL: Terminate Contract ===== -->
    <div v-if="terminateModal" class="modal-overlay" @mousedown.self="terminateModal=null">
      <div class="modal">
        <div class="modal-head"><h3>إنهاء العقد</h3><button class="modal-close" @click="terminateModal=null">×</button></div>
        <p class="hint">الوحدة: <b>{{ terminateModal.unit_number }}</b> · المستأجر: <b>{{ terminateModal.tenant_name }}</b></p>
        <div class="field"><label>سبب الإنهاء *</label><textarea v-model="terminateModal.reason" placeholder="مثال: انتهاء فترة الإيجار بناء على رغبة المستأجر" rows="2"></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="terminateModal=null">إلغاء</button>
          <button class="btn btn-danger" :disabled="saving" @click="doTerminate">{{ saving?'جارٍ...':'تأكيد الإنهاء' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type PropertyItem, type PropertyDetailResponse, type ContractOptionsResponse, type ActiveContract, type ContractItem } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { manager } = useApi()
const { fmtDate, monthKey } = useFormat()
const showToast = inject<(m:string)=>void>('showToast', ()=>{})
const supervisorSession = inject<any>('supervisorSession')

// Detect role from user type
const userType = computed(() => supervisorSession?.value?.role || 'general_manager')
const apiRole = computed((): 'general-manager' | 'real-estate-supervisor' =>
  userType.value === 'real_estate_supervisor' ? 'real-estate-supervisor' : 'general-manager'
)

// ===== STATE =====
const loading       = ref(false)
const saving        = ref(false)
const properties    = ref<PropertyItem[]>([])
const statistics    = ref<any>(null)
const ownersList    = ref<{id:number;name:string}[]>([])
const searchQ       = ref('')
const ownerFilter   = ref<number|''>('')

// Detail view
const selectedPropertyId = ref<number|null>(null)
const selectedProperty   = computed(() => properties.value.find(p=>p.id===selectedPropertyId.value) || null)
const detail        = ref<PropertyDetailResponse|null>(null)
const detailLoading = ref(false)
const contractOptions = ref<ContractOptionsResponse|null>(null)

// Expiring contracts
const expiringContracts = computed(() => {
  const result: {contractId:number;propertyName:string;unitNumber:string;tenantName:string;endDate:string;isExpired:boolean}[] = []
  // We build this from detail views; for list view we skip (would require separate API call)
  return result
})

// ===== LOAD =====
let searchTimer: ReturnType<typeof setTimeout>|null = null
function debounceLoad() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadProperties(), 400)
}

async function loadProperties() {
  loading.value = true
  try {
    const data = await manager.properties({
      search:   searchQ.value || undefined,
      owner_id: ownerFilter.value || undefined,
      period:   monthKey(),
    }, apiRole.value)
    properties.value = data.properties
    statistics.value = data.statistics
    if (data.owners?.length) ownersList.value = data.owners
  } catch { showToast('تعذّر جلب العقارات') }
  finally { loading.value = false }
}

onMounted(() => {
  loadProperties()
  loadOwnersList()
})

async function loadOwnersList() {
  if (ownersList.value.length) return
  try {
    const { auth } = useApi()
    const data = await auth.usersByType('owner')
    ownersList.value = data.map(o => ({ id: o.id, name: o.name }))
  } catch {}
}

// ===== DETAIL =====
async function openDetail(id: number) {
  selectedPropertyId.value = id
  detailLoading.value = true
  detail.value = null
  contractOptions.value = null
  try {
    const [det, opts] = await Promise.all([
      manager.showProperty(id, apiRole.value),
      manager.contractOptions(id, apiRole.value),
    ])
    detail.value = det
    contractOptions.value = opts
  } catch { showToast('تعذّر جلب تفاصيل العقار') }
  finally { detailLoading.value = false }
}

function backToList() {
  selectedPropertyId.value = null
  detail.value = null
}

// ===== ADD/EDIT PROPERTY =====
const propModal = ref<{id?:number;owner_id:number|null;name:string;location:string}|null>(null)

function openAddProperty() {
  propModal.value = { owner_id: null, name:'', location:'' }
}
function openEditProperty(p: PropertyItem) {
  propModal.value = { id: p.id, owner_id: p.owner_id, name: p.name, location: p.location||'' }
}
async function saveProperty() {
  const m = propModal.value; if (!m) return
  if (!m.owner_id) { showToast('الرجاء اختيار المالك'); return }
  if (!m.name.trim()) { showToast('الرجاء إدخال اسم العقار'); return }
  saving.value = true
  try {
    const body = { owner_id: m.owner_id, name: m.name.trim(), location: m.location.trim() }
    if (m.id) {
      await manager.updateProperty(m.id, body, apiRole.value)
      showToast('تم تحديث العقار')
    } else {
      await manager.createProperty(body, apiRole.value)
      showToast('تمت إضافة العقار')
    }
    propModal.value = null
    await loadProperties()
  } catch (e: any) {
    showToast(e?.data?.message || 'تعذّر حفظ العقار')
  } finally { saving.value = false }
}

// ===== DELETE PROPERTY =====
const deletePropertyId = ref<number|null>(null)
function confirmDeleteProperty(id: number) { deletePropertyId.value = id }
async function deleteProperty() {
  if (!deletePropertyId.value) return
  saving.value = true
  try {
    await manager.deleteProperty(deletePropertyId.value, apiRole.value)
    showToast('تم حذف العقار')
    deletePropertyId.value = null
    await loadProperties()
  } catch (e:any) {
    showToast(e?.data?.message || 'تعذّر حذف العقار')
  } finally { saving.value = false }
}

// ===== CONTRACT MODAL =====
type ContractModalMode = 'add' | 'edit' | 'renew'
interface ContractModal {
  mode: ContractModalMode
  originalContract?: ActiveContract
  tenantMode: 'existing' | 'new'
  tenant_id: number|null
  new_name: string; new_phone: string; new_national_id: string; collector_id: number|null
  unit_number: string; start_date: string; end_date: string
  total_amount: number; payment_cycle: string; installment_amount: number
  claim_generation_mode: string; notes: string
}
const contractModal = ref<ContractModal|null>(null)
const terminateModal = ref<{id:number;unit_number:string;tenant_name:string;reason:string}|null>(null)

const defaultCycle = computed(() => contractOptions.value?.payment_cycles?.[0]?.value || 'monthly')
const defaultClaimMode = computed(() => contractOptions.value?.claim_generation_modes?.[0]?.value || 'current_month_only')

function openAddContract() {
  if (!contractOptions.value) { showToast('جارٍ تحميل خيارات العقد...'); return }
  const today = new Date().toISOString().slice(0,10)
  const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear()+1)
  contractModal.value = {
    mode:'add', tenantMode:'existing', tenant_id:null,
    new_name:'', new_phone:'', new_national_id:'', collector_id: contractOptions.value.collectors[0]?.id||null,
    unit_number:'', start_date: today, end_date: nextYear.toISOString().slice(0,10),
    total_amount: 0, payment_cycle: defaultCycle.value, installment_amount: 0,
    claim_generation_mode: defaultClaimMode.value, notes: '',
  }
}
function openEditContract(c: ActiveContract) {
  contractModal.value = {
    mode:'edit', originalContract: c, tenantMode:'existing', tenant_id: null,
    new_name:'', new_phone:'', new_national_id:'', collector_id:null,
    unit_number: c.unit_number, start_date:'', end_date:'',
    total_amount: c.total_amount, payment_cycle: defaultCycle.value, installment_amount: c.installment_amount,
    claim_generation_mode: '', notes: '',
  }
}
function openRenewContract(c: ActiveContract) {
  if (!contractOptions.value) return
  // Renew start = day after end
  let newStart = ''
  try {
    const d = new Date(c.end_date_formatted)
    if (!isNaN(d.getTime())) { d.setDate(d.getDate()+1); newStart = d.toISOString().slice(0,10) }
  } catch {}
  const newEnd = (() => { try { const d = new Date(newStart); d.setFullYear(d.getFullYear()+1); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10) } catch { return '' } })()
  contractModal.value = {
    mode:'renew', originalContract: c, tenantMode:'existing', tenant_id:null,
    new_name:'', new_phone:'', new_national_id:'', collector_id:null,
    unit_number: c.unit_number, start_date: newStart, end_date: newEnd,
    total_amount: c.total_amount, payment_cycle: defaultCycle.value, installment_amount: c.installment_amount,
    claim_generation_mode: defaultClaimMode.value, notes: '',
  }
}
function openTerminateContract(c: ActiveContract) {
  terminateModal.value = { id: c.id, unit_number: c.unit_number, tenant_name: c.tenant_name, reason:'' }
}

async function saveContract() {
  const m = contractModal.value; if (!m || !selectedPropertyId.value) return
  if (!m.unit_number.trim()) { showToast('الرجاء إدخال رقم الوحدة'); return }
  if (!(m.total_amount>0) || !(m.installment_amount>0)) { showToast('الرجاء إدخال قيمة العقد والقسط'); return }
  if (!m.start_date || !m.end_date) { showToast('الرجاء تحديد تاريخ البداية والانتهاء'); return }
  saving.value = true
  try {
    if (m.mode === 'add') {
      const body: any = {
        is_new_tenant: m.tenantMode === 'new',
        unit_number: m.unit_number, start_date: m.start_date, end_date: m.end_date,
        total_amount: m.total_amount, payment_cycle: m.payment_cycle, installment_amount: m.installment_amount,
        claim_generation_mode: m.claim_generation_mode, notes: m.notes||undefined,
      }
      if (m.tenantMode === 'existing') {
        if (!m.tenant_id) { showToast('الرجاء اختيار المستأجر'); saving.value=false; return }
        body.tenant_id = m.tenant_id
      } else {
        if (!m.new_name.trim()) { showToast('الرجاء إدخال اسم المستأجر'); saving.value=false; return }
        if (!m.new_phone.trim()) { showToast('الرجاء إدخال رقم الجوال'); saving.value=false; return }
        body.name = m.new_name.trim(); body.phone = m.new_phone.trim()
        if (m.new_national_id) body.national_id = m.new_national_id
        if (m.collector_id) body.collector_id = m.collector_id
      }
      await manager.createContract(selectedPropertyId.value, body, apiRole.value)
      showToast('تمت إضافة العقد')
    } else if (m.mode === 'edit' && m.originalContract) {
      await manager.updateContract(selectedPropertyId.value, m.originalContract.id, {
        unit_number: m.unit_number, total_amount: m.total_amount,
        payment_cycle: m.payment_cycle, installment_amount: m.installment_amount,
        notes: m.notes||undefined,
      }, apiRole.value)
      showToast('تم تحديث العقد')
    } else if (m.mode === 'renew' && m.originalContract) {
      await manager.renewContract(selectedPropertyId.value, m.originalContract.id, {
        start_date: m.start_date, end_date: m.end_date,
        total_amount: m.total_amount, payment_cycle: m.payment_cycle, installment_amount: m.installment_amount,
        claim_generation_mode: m.claim_generation_mode, notes: m.notes||undefined,
      }, apiRole.value)
      showToast('تم تجديد العقد')
    }
    contractModal.value = null
    await openDetail(selectedPropertyId.value)
  } catch (e:any) {
    const d = e?.data
    if (d?.errors) {
      const first = Object.values(d.errors)[0] as string[]
      showToast(first[0] || d.message || 'تعذّر حفظ العقد')
    } else showToast(d?.message || 'تعذّر حفظ العقد')
  } finally { saving.value = false }
}

async function doTerminate() {
  const m = terminateModal.value; if (!m || !selectedPropertyId.value) return
  if (!m.reason.trim()) { showToast('الرجاء إدخال سبب الإنهاء'); return }
  saving.value = true
  try {
    await manager.terminateContract(selectedPropertyId.value, m.id, { closure_reason: m.reason }, apiRole.value)
    showToast('تم إنهاء العقد')
    terminateModal.value = null
    await openDetail(selectedPropertyId.value)
  } catch (e:any) {
    showToast(e?.data?.message || 'تعذّر إنهاء العقد')
  } finally { saving.value = false }
}

// ===== HELPERS =====
function contractBadgeClass(status: string) {
  if (status==='active') return 'badge-approved'
  if (status==='renewed') return 'badge-neutral'
  if (status==='closed') return 'badge-neutral'
  return 'badge-pending'
}
</script>

<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:var(--charcoal);}
.page-title p{margin:2px 0 0;color:var(--muted);font-size:13px;}

.search-bar{margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;}
.search-bar input{flex:1;min-width:200px;padding:11px 15px;border-radius:10px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);outline:none;font-family:inherit;font-size:14px;}
.search-bar input:focus{border-color:var(--orange);}
.search-bar select{padding:11px 13px;border-radius:10px;border:1.5px solid var(--line);background:var(--surface);color:var(--ink);font-weight:700;outline:none;cursor:pointer;font-family:inherit;}
.search-bar select:focus{border-color:var(--orange);}

.grid{display:grid;gap:16px;}
.grid-3{grid-template-columns:repeat(3,1fr);}
.grid-4{grid-template-columns:repeat(4,1fr);}
@media(max-width:1050px){.grid-3,.grid-4{grid-template-columns:repeat(2,1fr);}}
@media(max-width:600px){.grid-3,.grid-4{grid-template-columns:1fr;}}

.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:20px;}
.card h3{margin:0 0 14px;font-size:15px;font-weight:800;color:var(--charcoal);}
.property-card{border-right:4px solid var(--orange);}
.property-card:hover{border-color:var(--orange);box-shadow:0 10px 24px -16px rgba(46,43,39,.45);}

.stat-card{border-right:4px solid var(--orange);}
.stat-card .lbl{color:var(--muted);font-size:12.5px;font-weight:700;}
.stat-card .val{font-size:24px;font-weight:900;color:var(--charcoal);margin-top:6px;}
.stat-card .sub{font-size:11.5px;color:var(--muted);margin-top:4px;}

.kv{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:13.5px;}
.kv .k{color:var(--muted);}
.kv .v{font-weight:800;}

table{width:100%;border-collapse:collapse;font-size:13.5px;}
th{text-align:right;color:var(--muted);font-weight:700;font-size:12px;padding:9px 10px;border-bottom:1.5px solid var(--line);white-space:nowrap;}
td{padding:10px 10px;border-bottom:1px solid var(--line);vertical-align:middle;}
tr:last-child td{border-bottom:none;}
.table-wrap{overflow-x:auto;}

.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:800;}
.badge-approved{background:var(--success-tint);color:var(--success);}
.badge-rejected{background:var(--danger-tint);color:var(--danger);}
.badge-pending{background:var(--warning-tint);color:var(--warning);}
.badge-neutral{background:var(--orange-tint);color:var(--orange-dark);}

.muted{color:var(--muted);}
.empty-state{text-align:center;padding:40px 20px;color:var(--muted);}
.empty-state b{display:block;color:var(--charcoal);font-size:14.5px;margin-bottom:4px;}
.hint{font-size:12.5px;color:var(--muted);margin-bottom:10px;}

.field{margin-bottom:14px;}
.field label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px;font-weight:700;}
.field input,.field select,.field textarea{width:100%;padding:11px 13px;border-radius:10px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);outline:none;font-family:inherit;font-size:14px;}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--orange);background:var(--surface);}
textarea{resize:vertical;min-height:60px;}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:520px){.row2{grid-template-columns:1fr;}}
.radio-group{display:flex;gap:8px;flex-wrap:wrap;}
.radio-opt{border:1.5px solid var(--line);border-radius:10px;padding:9px 14px;font-weight:700;font-size:13px;color:var(--muted);flex:1;text-align:center;cursor:pointer;}
.radio-opt.sel{border-color:var(--orange);background:var(--orange-tint);color:var(--orange-dark);}
.note-item{background:var(--bg);border-radius:10px;padding:10px 12px;font-size:13px;}

.btn{border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.15s;}
.btn-primary{background:var(--orange);color:#fff;}.btn-primary:hover:not(:disabled){background:var(--orange-dark);}
.btn-ghost{background:transparent;color:var(--charcoal);border:1.5px solid var(--line);}.btn-ghost:hover:not(:disabled){border-color:var(--charcoal);}
.btn-dark{background:var(--charcoal);color:#fff;}.btn-dark:hover:not(:disabled){opacity:.88;}
.btn-danger{background:var(--danger-tint);color:var(--danger);}.btn-danger:hover:not(:disabled){background:#f0cdc6;}
.btn-success{background:var(--success-tint);color:var(--success);}
.btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
.btn:disabled{opacity:.6;cursor:default;}

.modal-overlay{position:fixed;inset:0;background:rgba(46,43,39,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
.modal{background:var(--surface);border-radius:16px;padding:26px;width:100%;max-width:520px;max-height:90vh;overflow:auto;}
.modal.wide{max-width:680px;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
.modal-head h3{margin:0;font-size:17px;font-weight:800;}
.modal-close{background:var(--bg);border:none;width:30px;height:30px;border-radius:50%;font-size:16px;color:var(--muted);cursor:pointer;}
.modal-actions{display:flex;gap:10px;margin-top:18px;justify-content:flex-end;}

.spinner{width:34px;height:34px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--orange);animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
</style>
