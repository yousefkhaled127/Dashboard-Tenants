<template>
  <div>
    <!-- ===== VACANCY REPORT ===== -->
    <template v-if="showReport">
      <div class="page-title no-print">
        <div>
          <h2>تقرير الشقق (PDF)</h2>
          <p>اختر نوع التقرير ثم اضغط «تنزيل PDF»</p>
        </div>
        <div class="report-toolbar">
          <button class="btn btn-ghost btn-sm" @click="showReport=false">→ رجوع للشقق</button>
          <button class="btn btn-dark btn-sm" @click="printReport">⬇ تنزيل PDF</button>
        </div>
      </div>

      <!-- filters -->
      <div class="card no-print vrep-filters" style="margin-bottom:16px;">
        <div class="field">
          <label>نوع التقرير</label>
          <div class="radio-group">
            <div v-for="(lbl,k) in VAC_REPORT_TYPES" :key="k"
                 class="radio-opt" :class="{ sel: repType===k }"
                 @click="repType=k">{{ lbl }}</div>
          </div>
        </div>
        <div class="row2" style="margin-top:10px;">
          <div class="field" style="margin:0;">
            <label>الفترة</label>
            <select v-model="repPeriod">
              <option value="all">كل الفترات</option>
              <option v-for="m in last12Months" :key="m" :value="m">{{ fmtMonthLabel(m) }}</option>
            </select>
          </div>
          <div class="field" style="margin:0;">
            <label>المحصل</label>
            <select v-model="repCollector">
              <option value="">جميع المحصلين</option>
              <option v-for="c in collectorsFromApi" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- PDF paper -->
      <div class="vrep-paper">
        <div class="vrep-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg width="46" height="46" viewBox="0 0 100 100" fill="none">
              <path d="M50 8 L84 30 V38 L50 17 L16 38 V30 Z" fill="#3A3733"/>
              <path d="M12 42 L50 18 L88 42 V54 L50 30 L12 54 Z" fill="#E1712F"/>
              <path d="M29 50 L46 40 V70 L29 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
              <path d="M71 50 L54 40 V70 L71 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
              <rect x="46" y="42" width="8" height="46" fill="#3A3733"/>
            </svg>
            <div>
              <div style="font-weight:800;font-size:15px;">مؤسسة سعود علي السقامي</div>
              <div style="font-size:10px;color:#E1712F;letter-spacing:.3px;">SAUD ALI ALSAQAMI · TAHSILAT</div>
            </div>
          </div>
          <div class="vrep-meta">
            <div class="vrep-title">تقرير {{ VAC_REPORT_TYPES[repType] }}</div>
            <div>تاريخ الإصدار: {{ fmtDate(todayISO()) }}</div>
            <div v-if="repPeriod!=='all'">الفترة: {{ fmtMonthLabel(repPeriod) }}</div>
          </div>
        </div>

        <div class="vrep-stats">
          <div class="vrep-stat">
            <div class="lbl">شاغرة</div>
            <div class="val">{{ repData.vacant.length }}</div>
            <div class="sub">{{ fmtMoney(sumField(repData.vacant,'price')) }}</div>
          </div>
          <div class="vrep-stat vrep-deposit">
            <div class="lbl">تم العربون</div>
            <div class="val">{{ repData.deposit.length }}</div>
            <div class="sub">عربون {{ fmtMoney(sumField(repData.deposit,'depositAmount')) }}</div>
          </div>
          <div class="vrep-stat vrep-rented">
            <div class="lbl">مؤجرة</div>
            <div class="val">{{ repData.rented.length }}</div>
            <div class="sub">قيمة التأجير {{ fmtMoney(sumField(repData.rented,'rentPrice')) }}</div>
          </div>
        </div>

        <template v-for="sec in repSections" :key="sec">
          <div v-if="repType==='all'||repType===sec" class="vrep-section">
            <div class="vrep-sec-head" :class="'vrep-'+sec">
              <span class="vrep-dot"></span>
              {{ secTitles[sec] }}
              <span class="vrep-count">{{ repData[sec].length }}</span>
            </div>
            <div class="vrep-table-wrap" style="overflow-x:auto;">
              <table class="vrep-table">
                <thead><tr><th v-for="h in secHeaders[sec]" :key="h">{{ h }}</th></tr></thead>
                <tbody>
                  <tr v-if="!repData[sec].length">
                    <td :colspan="secHeaders[sec].length" class="vrep-empty">لا توجد شقق في هذا التصنيف</td>
                  </tr>
                  <template v-else>
                    <tr v-for="(v,i) in repData[sec]" :key="v.id">
                      <td>{{ i+1 }}</td>
                      <td>{{ vacPropNameLocal(v) }}</td>
                      <td><b>{{ v.unit }}</b></td>
                      <td>{{ v.rooms||'—' }}</td>
                      <template v-if="sec==='vacant'">
                        <td>{{ fmtMoney(v.price) }}</td>
                        <td>{{ v.priceCycle||'—' }}</td>
                        <td>{{ v.location||'—' }}</td>
                        <td class="vrep-note">{{ v.notes||'—' }}</td>
                      </template>
                      <template v-else-if="sec==='deposit'">
                        <td>{{ fmtMoney(v.price) }}</td>
                        <td><b>{{ fmtMoney(v.depositAmount) }}</b></td>
                        <td>{{ collectorNameLocal(v.depositBy) }}</td>
                        <td>{{ fmtDate(v.depositDate) }}</td>
                      </template>
                      <template v-else>
                        <td>{{ fmtMoney(v.price) }}</td>
                        <td><b>{{ fmtMoney(v.rentPrice||v.price) }}</b></td>
                        <td>{{ collectorNameLocal(v.rentedBy) }}</td>
                        <td>{{ fmtDate(v.rentedDate) }}</td>
                        <td>{{ v.tenantName||'—' }}</td>
                      </template>
                    </tr>
                  </template>
                </tbody>
                <tfoot v-if="repData[sec].length">
                  <tr>
                    <td :colspan="4">الإجمالي ({{ repData[sec].length }} شقة)</td>
                    <td>{{ fmtMoney(sumField(repData[sec],'price')) }}</td>
                    <td v-if="sec==='deposit'">{{ fmtMoney(sumField(repData[sec],'depositAmount')) }}</td>
                    <td v-if="sec==='rented'">{{ fmtMoney(sumField(repData[sec],'rentPrice')) }}</td>
                    <td v-for="n in (sec==='vacant'?3:sec==='deposit'?2:3)" :key="n"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </template>

        <div class="vrep-sign">
          <div><div class="muted">إعداد: {{ userName }}</div><div class="vrep-line"></div></div>
          <div><div class="muted">اعتماد الإدارة</div><div class="vrep-line"></div></div>
        </div>
        <div class="vrep-foot">صادر آليًا عن نظام تحصيلات المستأجرين — مؤسسة سعود علي السقامي للعقارات</div>
      </div>
    </template>

    <!-- ===== MAIN VACANCIES ===== -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>الشقق الشاغرة</h2>
          <p>أضف الشقق الشاغرة وحدّث حالتها عند العربون أو التأجير</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" @click="openReport">⬇ تقرير PDF</button>
          <button class="btn btn-dark btn-sm" @click="openAdd">+ إضافة شقة شاغرة</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="card stat-card">
          <div class="lbl">شاغرة</div>
          <div class="val">{{ countByStatus('vacant') }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--warning);">
          <div class="lbl">تم العربون</div>
          <div class="val">{{ countByStatus('deposit') }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--success);">
          <div class="lbl">أُجّرت هذا الشهر</div>
          <div class="val">{{ rentedThisMonth.length }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--success);">
          <div class="lbl">إجمالي المؤجرة</div>
          <div class="val">{{ countByStatus('rented') }}</div>
        </div>
      </div>

      <!-- Collector board -->
      <div v-if="board.length" class="card" style="margin-bottom:16px;">
        <h3>إنجاز المحصلين في التأجير</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>المحصل</th><th>أُجّرت هذا الشهر</th><th>إجمالي ما أجّره</th></tr></thead>
            <tbody>
              <tr v-for="x in board" :key="x.name">
                <td><b>{{ x.name }}</b></td><td>{{ x.thisMonth }}</td><td>{{ x.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabs -->
      <div class="pill-tabs" style="flex-wrap:wrap;">
        <button v-for="[k,lbl] in tabs" :key="k" class="pill-tab" :class="{active:activeTab===k}" @click="activeTab=k">
          {{ lbl }} ({{ countTab(k) }})
        </button>
      </div>

      <!-- Cards grid -->
      <div class="grid grid-3">
        <template v-if="filteredVacancies.length">
          <div v-for="v in filteredVacancies" :key="v.id" class="card"
               :style="`border-right:4px solid ${v.status==='rented'?'var(--success)':v.status==='deposit'?'var(--warning)':'var(--orange)'}`">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
              <div>
                <h3 style="margin:0 0 3px;">{{ vacPropNameLocal(v) }} — وحدة {{ v.unit }}</h3>
                <div v-if="v.location" class="muted" style="font-size:12px;">{{ v.location }}</div>
              </div>
              <span class="badge" :class="statusBadgeClass(v.status)">{{ VAC_STATUS[v.status] }}</span>
            </div>
            <div class="kv"><span class="k">السعر</span><span class="v">{{ fmtMoney(v.price) }} <span class="muted" style="font-size:11.5px;">/ {{ v.priceCycle }}</span></span></div>
            <div class="kv"><span class="k">عدد الغرف</span><span class="v">{{ v.rooms||'—' }}</span></div>
            <div v-if="v.notes" class="note-item" style="margin-top:8px;">{{ v.notes }}</div>
            <div v-if="v.status==='deposit'">
              <div class="kv"><span class="k">العربون</span><span class="v">{{ fmtMoney(v.depositAmount) }} — {{ collectorNameLocal(v.depositBy) }}</span></div>
              <div class="kv"><span class="k">تاريخ العربون</span><span class="v">{{ fmtDate(v.depositDate) }}</span></div>
            </div>
            <div v-if="v.status==='rented'">
              <div class="kv"><span class="k">أجّرها المحصل</span><span class="v" style="color:var(--success);">{{ collectorNameLocal(v.rentedBy) }}</span></div>
              <div class="kv"><span class="k">المستأجر</span><span class="v">{{ v.tenantName||'—' }}{{ v.tenantPhone?' · '+v.tenantPhone:'' }}</span></div>
            </div>
            <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">
              <button class="btn btn-dark btn-sm" style="flex:1;" @click="openStatus(v)">تحديث الحالة</button>
              <button class="btn btn-ghost btn-sm" @click="openEdit(v)">تعديل</button>
              <button class="btn btn-danger btn-sm" @click="confirmDelete(v.id)">حذف</button>
            </div>
          </div>
        </template>
        <div v-else class="card" style="grid-column:1/-1;">
          <div class="empty-state"><b>لا توجد شقق في هذا التصنيف</b></div>
        </div>
      </div>
    </template>

    <!-- ===== MODAL: ADD / EDIT ===== -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ editingId ? 'تعديل بيانات الشقة' : 'إضافة شقة شاغرة' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="row2">
          <div class="field"><label>اسم العقار</label><input v-model="form.propertyName" placeholder="مثال: عمارة النخيل"></div>
          <div class="field"><label>رقم الشقة / الوحدة</label><input v-model="form.unit" placeholder="مثال: 7"></div>
        </div>
        <div class="row2">
          <div class="field"><label>السعر (ر.س)</label><input v-model.number="form.price" type="number" placeholder="0"></div>
          <div class="field"><label>السعر لمدة</label>
            <select v-model="form.priceCycle">
              <option v-for="c in priceCycles" :key="c">{{ c }}</option>
            </select>
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>عدد الغرف</label><input v-model.number="form.rooms" type="number" min="0"></div>
          <div class="field"><label>الموقع / الحي</label><input v-model="form.location"></div>
        </div>
        <div class="field"><label>مواصفات / ملاحظات (اختياري)</label>
          <textarea v-model="form.notes" placeholder="مثال: دور ثاني، مطبخ راكب"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="closeModal">إلغاء</button>
          <button class="btn btn-primary" @click="saveVacancy">{{ editingId ? 'حفظ التعديلات' : 'إضافة الشقة' }}</button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL: UPDATE STATUS ===== -->
    <div v-if="showStatusModal" class="modal-overlay" @click.self="closeStatusModal">
      <div class="modal">
        <div class="modal-head">
          <h3>تحديث حالة الشقة</h3>
          <button class="modal-close" @click="closeStatusModal">×</button>
        </div>
        <p class="hint" v-if="statusVacancy">{{ vacPropNameLocal(statusVacancy) }} — وحدة {{ statusVacancy.unit }} · {{ fmtMoney(statusVacancy.price) }}</p>
        <div class="field"><label>الحالة</label>
          <div class="radio-group">
            <div v-for="[k,lbl] in Object.entries(VAC_STATUS)" :key="k"
                 class="radio-opt" :class="{ sel: statusForm.status===k }"
                 @click="statusForm.status=k">{{ lbl }}</div>
          </div>
        </div>
        <template v-if="statusForm.status!=='vacant'">
          <div class="row2">
            <div class="field"><label>المحصل</label>
              <select v-model="statusForm.collectorId">
                <option value="">اختر المحصل</option>
                <option v-for="c in collectorsFromApi" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
              </select>
            </div>
            <div class="field"><label>التاريخ</label><input v-model="statusForm.date" type="date"></div>
          </div>
          <template v-if="statusForm.status==='deposit'">
            <div class="field"><label>مبلغ العربون (ر.س)</label><input v-model.number="statusForm.depositAmount" type="number"></div>
            <div class="row2">
              <div class="field"><label>اسم المستأجر (اختياري)</label><input v-model="statusForm.tenantName"></div>
              <div class="field"><label>جوال المستأجر</label><input v-model="statusForm.tenantPhone"></div>
            </div>
          </template>
          <template v-if="statusForm.status==='rented'">
            <div class="row2">
              <div class="field"><label>اسم المستأجر</label><input v-model="statusForm.tenantName"></div>
              <div class="field"><label>جوال المستأجر</label><input v-model="statusForm.tenantPhone"></div>
            </div>
            <div class="row2">
              <div class="field"><label>سعر التأجير الفعلي (ر.س)</label><input v-model.number="statusForm.rentPrice" type="number"></div>
            </div>
          </template>
        </template>
        <div class="field"><label>ملاحظة (اختياري)</label><input v-model="statusForm.note"></div>
        <!-- history -->
        <div v-if="statusVacancy && (statusVacancy.history||[]).length" style="margin-top:6px;">
          <label class="hint" style="display:block;margin-bottom:6px;">سجل الشقة</label>
          <div v-for="h in (statusVacancy.history||[]).slice().reverse().slice(0,5)" :key="h.at" class="note-item">
            {{ VAC_STATUS[h.status]||h.status }}{{ h.note?' — '+h.note:'' }}
            <div class="meta">{{ fmtDate(h.at) }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="closeStatusModal">إلغاء</button>
          <button class="btn btn-primary" @click="saveStatus">حفظ الحالة</button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL: DELETE ===== -->
    <div v-if="deleteId" class="modal-overlay" @click.self="deleteId=null">
      <div class="modal">
        <div class="modal-head"><h3>حذف الشقة</h3><button class="modal-close" @click="deleteId=null">×</button></div>
        <p>هل تريد حذف هذه الشقة من القائمة؟</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="deleteId=null">إلغاء</button>
          <button class="btn btn-danger" @click="doDelete">تأكيد الحذف</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExtState, type Vacancy } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const { extState, load, save, uid, vacanciesSorted, vacantCount, vacPropName } = useExtState()
const { fmtDate, fmtMoney, todayISO, monthKey, lastNMonths } = useFormat()
const { auth } = useApi()

const showToast = inject<(m:string)=>void>('showToast', (m)=>console.log(m))

// ===== COLLECTORS =====
const collectorsFromApi = ref<{id:number;name:string}[]>([])
onMounted(async () => {
  load()
  try {
    const data = await auth.usersByType('collector')
    collectorsFromApi.value = data.map(u => ({ id: u.id, name: u.name }))
  } catch {}
})

const userName = inject<any>('supervisorSession')?.value?.name || 'المشرف'

// ===== CONSTANTS =====
const VAC_STATUS: Record<string,string> = { vacant:'شاغرة', deposit:'تم العربون', rented:'تم التأجير' }
const priceCycles = ['سنوي','شهري','نصف سنوي','ربع سنوي']
const tabs: [string,string][] = [['all','الكل'],['vacant','شاغرة'],['deposit','تم العربون'],['rented','تم التأجير']]
const activeTab = ref('all')

// ===== HELPERS =====
const vacPropNameLocal = (v: Vacancy) => vacPropName(v)
const collectorNameLocal = (id: string|null) => {
  if (!id) return '—'
  return collectorsFromApi.value.find(c => String(c.id) === String(id))?.name || id
}
const statusBadgeClass = (s: string) =>
  s==='rented' ? 'badge-approved' : s==='deposit' ? 'badge-pending' : 'badge-neutral'

const countByStatus = (s: string) => extState.value.vacancies.filter(v => v.status === s).length
const countTab = (k: string) => k==='all' ? extState.value.vacancies.length : countByStatus(k)
const mk = monthKey()
const rentedThisMonth = computed(() => extState.value.vacancies.filter(v => v.status==='rented' && (v.rentedDate||'').slice(0,7)===mk))

const board = computed(() => {
  const all = extState.value.vacancies
  const map: Record<string,{name:string;thisMonth:number;total:number}> = {}
  all.filter(v => v.status==='rented').forEach(v => {
    const k = String(v.rentedBy||'—')
    if (!map[k]) map[k] = { name: collectorNameLocal(v.rentedBy), thisMonth:0, total:0 }
    map[k].total++
    if ((v.rentedDate||'').slice(0,7)===mk) map[k].thisMonth++
  })
  return Object.values(map).filter(x => x.total>0).sort((a,b) => b.total-a.total)
})

const filteredVacancies = computed(() => {
  const list = vacanciesSorted.value
  if (activeTab.value === 'all') return list
  return list.filter(v => v.status === activeTab.value)
})

const sumField = (arr: any[], field: string) => arr.reduce((s:number,v:any) => s + Number(v[field]||0), 0)

// ===== ADD / EDIT MODAL =====
const showModal = ref(false)
const editingId = ref<string|null>(null)
const emptyForm = () => ({ propertyName:'', unit:'', price:0, priceCycle:'سنوي', rooms:0, location:'', notes:'' })
const form = ref(emptyForm())

function openAdd() { editingId.value=null; form.value=emptyForm(); showModal.value=true }
function openEdit(v: Vacancy) {
  editingId.value = v.id
  form.value = { propertyName:v.propertyName, unit:v.unit, price:v.price, priceCycle:v.priceCycle, rooms:v.rooms, location:v.location, notes:v.notes }
  showModal.value = true
}
function closeModal() { showModal.value=false }
function saveVacancy() {
  if (!form.value.propertyName.trim()) { showToast('الرجاء إدخال اسم العقار'); return }
  if (!form.value.unit.trim())         { showToast('الرجاء إدخال رقم الشقة'); return }
  if (!(form.value.price > 0))         { showToast('الرجاء إدخال السعر'); return }
  const now = new Date().toISOString()
  if (editingId.value) {
    const v = extState.value.vacancies.find(x => x.id === editingId.value)
    if (v) Object.assign(v, { ...form.value, updatedAt: now })
  } else {
    extState.value.vacancies.push({
      id: uid(), propertyId: null, propertyName: form.value.propertyName, unit: form.value.unit,
      price: form.value.price, priceCycle: form.value.priceCycle, rooms: form.value.rooms,
      location: form.value.location, notes: form.value.notes, status: 'vacant',
      depositBy: null, depositAmount: 0, depositDate: '',
      rentedBy: null, rentedDate: '', rentPrice: 0, tenantName: '', tenantPhone: '',
      history: [{ status:'vacant', collectorId:null, note:'إضافة الشقة', at:now, by:'sup' }],
      handover: null, createdAt: now, createdBy: 'sup', updatedAt: now,
    })
  }
  save(); showToast(editingId.value ? 'تم التعديل' : 'تمت إضافة الشقة'); closeModal()
}

// ===== STATUS MODAL =====
const showStatusModal = ref(false)
const statusVacancy = ref<Vacancy|null>(null)
const statusForm = ref({ status:'vacant', collectorId:'', date: todayISO(), depositAmount:0, rentPrice:0, tenantName:'', tenantPhone:'', note:'' })

function openStatus(v: Vacancy) {
  statusVacancy.value = v
  statusForm.value = {
    status: v.status === 'vacant' ? 'deposit' : v.status === 'deposit' ? 'rented' : v.status,
    collectorId: String(v.rentedBy || v.depositBy || ''), date: todayISO(),
    depositAmount: v.depositAmount || 0, rentPrice: v.rentPrice || v.price || 0,
    tenantName: v.tenantName || '', tenantPhone: v.tenantPhone || '', note: ''
  }
  showStatusModal.value = true
}
function closeStatusModal() { showStatusModal.value=false; statusVacancy.value=null }
function saveStatus() {
  const v = statusVacancy.value; if (!v) return
  if (statusForm.value.status !== 'vacant' && !statusForm.value.collectorId) { showToast('الرجاء اختيار المحصل'); return }
  const now = new Date().toISOString()
  const note = statusForm.value.note.trim()
  if (statusForm.value.status === 'vacant') {
    Object.assign(v, { status:'vacant', depositBy:null, depositAmount:0, depositDate:'', rentedBy:null, rentedDate:'', rentPrice:0, tenantName:'', tenantPhone:'' })
  } else if (statusForm.value.status === 'deposit') {
    Object.assign(v, { status:'deposit', depositBy:statusForm.value.collectorId, depositAmount:statusForm.value.depositAmount, depositDate:statusForm.value.date, tenantName:statusForm.value.tenantName, tenantPhone:statusForm.value.tenantPhone })
  } else {
    Object.assign(v, { status:'rented', rentedBy:statusForm.value.collectorId, rentedDate:statusForm.value.date, rentPrice:statusForm.value.rentPrice, tenantName:statusForm.value.tenantName, tenantPhone:statusForm.value.tenantPhone })
  }
  if (!v.history) v.history = []
  v.history.push({ status:v.status, collectorId:statusForm.value.collectorId||null, note, at:now, by:'sup' })
  v.updatedAt = now
  save(); showToast('تم تحديث حالة الشقة'); closeStatusModal()
}

// ===== DELETE =====
const deleteId = ref<string|null>(null)
function confirmDelete(id: string) { deleteId.value=id }
function doDelete() {
  extState.value.vacancies = extState.value.vacancies.filter(v => v.id !== deleteId.value)
  save(); showToast('تم حذف الشقة'); deleteId.value=null
}

// ===== REPORT =====
const showReport = ref(false)
const VAC_REPORT_TYPES: Record<string,string> = { all:'جميع الشقق', vacant:'الشاغرة', deposit:'تم العربون', rented:'المؤجرة' }
const repType = ref('all')
const repPeriod = ref('all')
const repCollector = ref('')
const repSections = ['vacant','deposit','rented'] as const

const secTitles: Record<string,string> = { vacant:'الشقق الشاغرة', deposit:'الشقق التي دُفع فيها عربون', rented:'الشقق المؤجرة' }
const secHeaders: Record<string,string[]> = {
  vacant:  ['#','العقار','الوحدة','الغرف','السعر المطلوب','المدة','الحي / الموقع','ملاحظات'],
  deposit: ['#','العقار','الوحدة','الغرف','السعر','مبلغ العربون','المحصل','تاريخ العربون'],
  rented:  ['#','العقار','الوحدة','الغرف','السعر المعروض','سعر التأجير','المحصل','تاريخ التأجير','المستأجر'],
}

const inPeriod = (d:string) => repPeriod.value==='all' || (d||'').slice(0,7)===repPeriod.value

const repData = computed(() => {
  const all = extState.value.vacancies
  const col = repCollector.value
  return {
    vacant:  all.filter(v => v.status==='vacant'),
    deposit: all.filter(v => v.status==='deposit' && inPeriod(v.depositDate) && (!col || String(v.depositBy)===col)),
    rented:  all.filter(v => v.status==='rented'  && inPeriod(v.rentedDate)  && (!col || String(v.rentedBy)===col)),
  }
})

const last12Months = computed(() => lastNMonths(12).slice().reverse())
const fmtMonthLabel = (mk: string) => {
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const [y,m] = mk.split('-').map(Number)
  return months[m-1]+' '+y
}

function openReport() {
  repType.value = 'all'; repPeriod.value = 'all'; repCollector.value = ''
  showReport.value = true
}
function printReport() {
  const old = document.title
  document.title = `تقرير_الشقق_${todayISO()}`
  window.print()
  setTimeout(() => { document.title = old }, 800)
}
</script>
