<template>
  <div>
    <!-- ===== REPORT VIEW ===== -->
    <template v-if="showReport">
      <div class="page-title no-print">
        <div>
          <h2>تقرير الشقق (PDF)</h2>
          <p>اضغط «تنزيل PDF» ثم احفظ بتنسيق PDF</p>
        </div>
        <div class="report-toolbar">
          <button class="btn btn-ghost btn-sm" @click="showReport=false">→ رجوع</button>
          <button class="btn btn-dark btn-sm" @click="printReport">⬇ تنزيل PDF</button>
        </div>
      </div>

      <div class="card no-print vrep-filters" style="margin-bottom:16px;">
        <div class="field">
          <label>نوع التقرير</label>
          <div class="radio-group">
            <div v-for="(lbl,k) in VAC_REPORT_TYPES" :key="k"
                 class="radio-opt" :class="{ sel: repType===k }" @click="repType=k">{{ lbl }}</div>
          </div>
        </div>
        <div class="row2" style="margin-top:10px;">
          <div class="field" style="margin:0;">
            <label>الفترة (للعربون/التأجير)</label>
            <select v-model="repPeriod">
              <option value="all">كل الفترات</option>
              <option v-for="m in last12Months" :key="m" :value="m">{{ fmtMonthLabel(m) }}</option>
            </select>
          </div>
          <div class="field" style="margin:0;">
            <label>عرض</label>
            <select v-model="repMine">
              <option value="all">الكل</option>
              <option value="mine">أنا فقط</option>
            </select>
          </div>
        </div>
      </div>

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
              <div style="font-size:10px;color:#E1712F;">SAUD ALI ALSAQAMI · TAHSILAT</div>
            </div>
          </div>
          <div class="vrep-meta">
            <div class="vrep-title">تقرير {{ VAC_REPORT_TYPES[repType] }}</div>
            <div>تاريخ الإصدار: {{ fmtDate(todayISO()) }}</div>
            <div>صادر عن: {{ collectorName }}</div>
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
          </div>
          <div class="vrep-stat vrep-rented">
            <div class="lbl">مؤجرة</div>
            <div class="val">{{ repData.rented.length }}</div>
          </div>
        </div>

        <template v-for="sec in (['vacant','deposit','rented'] as const)" :key="sec">
          <div v-if="repType==='all'||repType===sec" class="vrep-section">
            <div class="vrep-sec-head" :class="'vrep-'+sec">
              <span class="vrep-dot"></span>{{ secTitles[sec] }}
              <span class="vrep-count">{{ repData[sec].length }}</span>
            </div>
            <div style="overflow-x:auto;">
              <table class="vrep-table">
                <thead><tr><th v-for="h in secHeaders[sec]" :key="h">{{ h }}</th></tr></thead>
                <tbody>
                  <tr v-if="!repData[sec].length">
                    <td :colspan="secHeaders[sec].length" class="vrep-empty">لا توجد شقق</td>
                  </tr>
                  <tr v-for="(v,i) in repData[sec]" :key="v.id">
                    <td>{{ i+1 }}</td><td>{{ v.property_name||v.propertyName }}</td><td><b>{{ v.unit }}</b></td><td>{{ v.rooms||'—' }}</td>
                    <template v-if="sec==='vacant'">
                      <td>{{ fmtMoney(v.price) }}</td><td>{{ v.price_cycle||v.priceCycle||'—' }}</td><td>{{ v.location||'—' }}</td>
                    </template>
                    <template v-else-if="sec==='deposit'">
                      <td>{{ fmtMoney(v.price) }}</td><td><b>{{ fmtMoney(v.deposit_amount||v.depositAmount) }}</b></td><td>{{ fmtDate(v.deposit_date||v.depositDate) }}</td>
                    </template>
                    <template v-else>
                      <td>{{ fmtMoney(v.price) }}</td><td><b>{{ fmtMoney(v.rent_price||v.rentPrice||v.price) }}</b></td><td>{{ fmtDate(v.rented_date||v.rentedDate) }}</td><td>{{ v.tenant_name||v.tenantName||'—' }}</td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <div class="vrep-sign">
          <div><div class="muted">إعداد: {{ collectorName }}</div><div class="vrep-line"></div></div>
          <div><div class="muted">اعتماد الإدارة</div><div class="vrep-line"></div></div>
        </div>
        <div class="vrep-foot">صادر آليًا عن نظام تحصيلات المستأجرين — مؤسسة سعود علي السقامي للعقارات</div>
      </div>
    </template>

    <!-- ===== MAIN VIEW ===== -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>الشقق الشاغرة</h2>
          <p>المتاحة للتأجير — حدّث الحالة عند استلام العربون أو إتمام التأجير</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" @click="openReport">⬇ تقرير PDF</button>
          <button v-if="usingFallback" class="btn btn-ghost btn-sm" style="color:var(--warning);" title="يعمل بالبيانات المحلية" disabled>⚠ وضع محلي</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="card" style="text-align:center;padding:40px;">
        <div class="spinner" style="margin:0 auto 12px;"></div>
        <div class="muted">جارٍ تحميل البيانات...</div>
      </div>

      <template v-else>
        <!-- Stats -->
        <div class="grid grid-4" style="margin-bottom:16px;">
          <div class="card stat-card">
            <div class="lbl">شاغرة</div>
            <div class="val">{{ stats.vacant_count }}</div>
          </div>
          <div class="card stat-card" style="border-right-color:var(--warning);">
            <div class="lbl">تم العربون</div>
            <div class="val">{{ stats.deposit_count }}</div>
          </div>
          <div class="card stat-card" style="border-right-color:var(--success);">
            <div class="lbl">أجّرتها أنت (هذا الشهر)</div>
            <div class="val">{{ myRentedThisMonth }}</div>
          </div>
          <div class="card stat-card" style="border-right-color:var(--success);">
            <div class="lbl">إجمالي ما أجّرته</div>
            <div class="val">{{ myRentedTotal }}</div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="pill-tabs" style="flex-wrap:wrap;">
          <button v-for="[k,lbl] in tabs" :key="k"
                  class="pill-tab" :class="{ active: activeTab===k }" @click="setTab(k)">
            {{ lbl }} ({{ tabCount(k) }})
          </button>
        </div>

        <!-- Cards -->
        <div class="grid grid-3">
          <template v-if="filteredList.length">
            <div v-for="v in filteredList" :key="v.id" class="card"
                 :style="`border-right:4px solid ${v.status==='rented'?'var(--success)':v.status==='deposit'?'var(--warning)':'var(--orange)'};${isMine(v)?'background:var(--success-tint);':''}`">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
                <div>
                  <h3 style="margin:0 0 3px;">{{ v.property_name||v.propertyName }} — وحدة {{ v.unit }}</h3>
                  <div v-if="v.location" class="muted" style="font-size:12px;">{{ v.location }}</div>
                </div>
                <span class="badge" :class="statusBadge(v.status)">{{ VAC_STATUS[v.status] }}</span>
              </div>

              <div class="kv"><span class="k">السعر</span><span class="v">{{ fmtMoney(v.price) }} <span class="muted" style="font-size:11.5px;">/ {{ v.price_cycle||v.priceCycle }}</span></span></div>
              <div class="kv"><span class="k">عدد الغرف</span><span class="v">{{ v.rooms||'—' }}</span></div>
              <div v-if="v.notes" class="note-item" style="margin-top:8px;">{{ v.notes }}</div>

              <template v-if="v.status==='deposit'">
                <div class="kv"><span class="k">العربون</span><span class="v">{{ fmtMoney(v.deposit_amount||v.depositAmount) }}</span></div>
                <div class="kv"><span class="k">تاريخ العربون</span><span class="v">{{ fmtDate(v.deposit_date||v.depositDate) }}</span></div>
              </template>
              <template v-if="v.status==='rented'">
                <div class="kv"><span class="k">المستأجر</span><span class="v">{{ v.tenant_name||v.tenantName||'—' }}{{ (v.tenant_phone||v.tenantPhone)?' · '+(v.tenant_phone||v.tenantPhone):'' }}</span></div>
                <div v-if="isMine(v)" class="kv"><span class="k">أجّرتها أنت</span><span class="v" style="color:var(--success);">✓</span></div>
              </template>

              <div v-if="v.status!=='rented'" style="margin-top:12px;">
                <button class="btn btn-dark btn-sm" style="width:100%;" @click="openStatus(v)">
                  {{ v.status==='vacant' ? 'تسجيل عربون' : 'تأكيد التأجير' }}
                </button>
              </div>
            </div>
          </template>
          <div v-else class="card" style="grid-column:1/-1;">
            <div class="empty-state"><b>لا توجد شقق في هذا التصنيف</b></div>
          </div>
        </div>
      </template>
    </template>

    <!-- ===== MODAL: STATUS ===== -->
    <div v-if="statusModal" class="modal-overlay" @click.self="statusModal=null">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ statusModal.status==='vacant' ? 'تسجيل عربون' : 'تأكيد التأجير' }}</h3>
          <button class="modal-close" @click="statusModal=null">×</button>
        </div>
        <p class="hint">{{ statusModal.property_name||statusModal.propertyName }} — وحدة {{ statusModal.unit }} · {{ fmtMoney(statusModal.price) }}</p>

        <template v-if="statusModal.status==='vacant'">
          <div class="field"><label>تاريخ العربون</label><input v-model="sf.date" type="date"></div>
          <div class="field"><label>مبلغ العربون (ر.س)</label><input v-model.number="sf.depositAmount" type="number"></div>
          <div class="row2">
            <div class="field"><label>اسم المستأجر (اختياري)</label><input v-model="sf.tenantName"></div>
            <div class="field"><label>جوال المستأجر</label><input v-model="sf.tenantPhone" placeholder="05xxxxxxxx"></div>
          </div>
        </template>
        <template v-else>
          <div class="field"><label>تاريخ التأجير</label><input v-model="sf.date" type="date"></div>
          <div class="row2">
            <div class="field"><label>اسم المستأجر</label><input v-model="sf.tenantName"></div>
            <div class="field"><label>جوال المستأجر</label><input v-model="sf.tenantPhone" placeholder="05xxxxxxxx"></div>
          </div>
          <div class="field"><label>سعر التأجير الفعلي (ر.س)</label><input v-model.number="sf.rentPrice" type="number"></div>
        </template>
        <div class="field"><label>ملاحظة (اختياري)</label><input v-model="sf.note"></div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="statusModal=null">إلغاء</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveStatus">
            {{ saving ? 'جارٍ الحفظ...' : 'حفظ' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVacanciesApi, type VacancyItem } from '~/composables/useApi'
import { useExtState } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'

const vacApi = useVacanciesApi()
const { extState, load: loadLocal, save: saveLocal, vacPropName } = useExtState()
const { fmtDate, fmtMoney, todayISO, monthKey, lastNMonths } = useFormat()

const showToast   = inject<(m:string)=>void>('showToast', m => console.log(m))
const colSession  = inject<any>('collectorSession')
const myId        = computed(() => colSession?.value?.id || '')
const collectorName = computed(() => colSession?.value?.name || 'المحصل')

// ── state ──
const loading       = ref(true)
const saving        = ref(false)
const usingFallback = ref(false)
const vacancies     = ref<any[]>([])
const stats         = ref({ vacant_count:0, deposit_count:0, rented_count:0, rented_this_month:0 })
const activeTab     = ref('available')

const mk = monthKey()

// ── constants ──
const VAC_STATUS: Record<string,string> = { vacant:'شاغرة', deposit:'تم العربون', rented:'تم التأجير' }
const tabs: [string,string][] = [['available','المتاحة'],['rented','أجّرتها أنا'],['all','الكل']]
const statusBadge = (s: string) => s==='rented'?'badge-approved':s==='deposit'?'badge-pending':'badge-neutral'

// ── helpers ──
const propName  = (v: any) => v.property_name || v.propertyName || '—'
const depAmount = (v: any) => v.deposit_amount ?? v.depositAmount ?? 0
const depDate   = (v: any) => v.deposit_date   || v.depositDate   || ''
const rentPrice = (v: any) => v.rent_price      || v.rentPrice      || v.price || 0
const rentDate  = (v: any) => v.rented_date     || v.rentedDate     || ''
const tenName   = (v: any) => v.tenant_name     || v.tenantName     || ''
const tenPhone  = (v: any) => v.tenant_phone    || v.tenantPhone    || ''
const priceCyc  = (v: any) => v.price_cycle     || v.priceCycle     || 'سنوي'

const isMine = (v: any) => {
  const rid = String(v.rented_by ?? v.rentedBy ?? '')
  const did = String(v.deposit_by ?? v.depositBy ?? '')
  const me  = String(myId.value)
  return rid === me || did === me
}

const myRentedThisMonth = computed(() =>
  vacancies.value.filter(v => v.status==='rented' && isMine(v) && (rentDate(v)||'').slice(0,7)===mk).length
)
const myRentedTotal = computed(() =>
  vacancies.value.filter(v => v.status==='rented' && isMine(v)).length
)

const tabCount = (k: string) => {
  if (k==='all')       return vacancies.value.length
  if (k==='available') return vacancies.value.filter(v=>v.status!=='rented').length
  return vacancies.value.filter(v=>v.status==='rented' && isMine(v)).length
}
const filteredList = computed(() => {
  if (activeTab.value==='all')       return vacancies.value
  if (activeTab.value==='available') return vacancies.value.filter(v=>v.status!=='rented')
  return vacancies.value.filter(v=>v.status==='rented' && isMine(v))
})
function setTab(k: string) { activeTab.value = k }

// ── LOAD (API → fallback) ──
async function fetchData() {
  loading.value = true
  try {
    const res = await vacApi.collector.list()
    vacancies.value = res.vacancies || []
    if (res.statistics) stats.value = res.statistics
    usingFallback.value = false
  } catch {
    // fallback to localStorage
    loadLocal()
    usingFallback.value = true
    vacancies.value = extState.value.vacancies || []
    const vac = vacancies.value
    stats.value = {
      vacant_count:  vac.filter(v=>v.status==='vacant').length,
      deposit_count: vac.filter(v=>v.status==='deposit').length,
      rented_count:  vac.filter(v=>v.status==='rented').length,
      rented_this_month: vac.filter(v=>v.status==='rented' && (v.rentedDate||'').slice(0,7)===mk).length,
    }
  } finally {
    loading.value = false
  }
}
onMounted(fetchData)

// ── STATUS MODAL ──
const statusModal = ref<any|null>(null)
const sf = ref({ date: todayISO(), depositAmount: 0, rentPrice: 0, tenantName: '', tenantPhone: '', note: '' })

function openStatus(v: any) {
  statusModal.value = v
  sf.value = { date: todayISO(), depositAmount: depAmount(v), rentPrice: rentPrice(v), tenantName: tenName(v), tenantPhone: tenPhone(v), note: '' }
}

async function saveStatus() {
  const v = statusModal.value; if (!v) return
  saving.value = true
  const isDeposit = v.status === 'vacant'
  const body = isDeposit
    ? { status:'deposit', collector_id: myId.value, deposit_date: sf.value.date, deposit_amount: sf.value.depositAmount, tenant_name: sf.value.tenantName.trim(), tenant_phone: sf.value.tenantPhone.trim(), note: sf.value.note.trim() }
    : { status:'rented',  collector_id: myId.value, rented_date: sf.value.date,  rent_price: sf.value.rentPrice, tenant_name: sf.value.tenantName.trim(), tenant_phone: sf.value.tenantPhone.trim(), note: sf.value.note.trim() }

  try {
    const updated = await vacApi.collector.updateStatus(v.id, body)
    const idx = vacancies.value.findIndex(x => x.id === v.id)
    if (idx !== -1) vacancies.value[idx] = updated
    showToast('تم تحديث حالة الشقة')
  } catch {
    // fallback: update localStorage
    const local = extState.value.vacancies.find(x => String(x.id) === String(v.id))
    if (local) {
      const now = new Date().toISOString()
      if (isDeposit) {
        Object.assign(local, { status:'deposit', depositBy: myId.value, depositAmount: sf.value.depositAmount, depositDate: sf.value.date, tenantName: sf.value.tenantName, tenantPhone: sf.value.tenantPhone })
      } else {
        Object.assign(local, { status:'rented', rentedBy: myId.value, rentedDate: sf.value.date, rentPrice: sf.value.rentPrice, tenantName: sf.value.tenantName, tenantPhone: sf.value.tenantPhone })
      }
      if (!local.history) local.history = []
      local.history.push({ status: local.status, collectorId: myId.value, note: sf.value.note, at: now, by: myId.value })
      local.updatedAt = now
      await saveLocal()
      vacancies.value = [...extState.value.vacancies]
    }
    showToast('تم الحفظ محلياً (الـ API غير متاح)')
  } finally {
    saving.value = false
    statusModal.value = null
  }
}

// ── REPORT ──
const showReport = ref(false)
const repType  = ref<'all'|'vacant'|'deposit'|'rented'>('all')
const repPeriod = ref('all')
const repMine   = ref('all')

const VAC_REPORT_TYPES: Record<string,string> = { all:'جميع الشقق', vacant:'الشاغرة', deposit:'تم العربون', rented:'المؤجرة' }
const secTitles: Record<string,string> = { vacant:'الشقق الشاغرة', deposit:'الشقق التي دُفع فيها عربون', rented:'الشقق المؤجرة' }
const secHeaders: Record<string,string[]> = {
  vacant:  ['#','العقار','الوحدة','الغرف','السعر','المدة','الحي'],
  deposit: ['#','العقار','الوحدة','الغرف','السعر','مبلغ العربون','تاريخ العربون'],
  rented:  ['#','العقار','الوحدة','الغرف','السعر','سعر التأجير','تاريخ التأجير','المستأجر'],
}
const inPeriod = (d: string) => repPeriod.value==='all' || (d||'').slice(0,7)===repPeriod.value
const inScope  = (v: any)    => repMine.value==='mine' ? isMine(v) : true
const repData  = computed(() => ({
  vacant:  vacancies.value.filter(v=>v.status==='vacant'  && inScope(v)),
  deposit: vacancies.value.filter(v=>v.status==='deposit' && inPeriod(depDate(v)) && inScope(v)),
  rented:  vacancies.value.filter(v=>v.status==='rented'  && inPeriod(rentDate(v)) && inScope(v)),
}))
const sumField   = (arr: any[], f: string) => arr.reduce((s,v) => s + Number(v[f]||0), 0)
const last12Months = computed(() => lastNMonths(12).slice().reverse())
const fmtMonthLabel = (m: string) => {
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
  const [y,mo] = m.split('-').map(Number); return months[mo-1]+' '+y
}
function openReport()  { repType.value='all'; repPeriod.value='all'; repMine.value='all'; showReport.value=true }
function printReport() { const old=document.title; document.title=`تقرير_الشقق_${todayISO()}`; window.print(); setTimeout(()=>{ document.title=old },800) }
</script>
