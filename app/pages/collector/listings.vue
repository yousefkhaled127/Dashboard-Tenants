<template>
  <div>
    <!-- View Switch -->
    <div class="view-switch">
      <button :class="{ active: lsView==='office' }" @click="lsView='office'">
        مهام العقارات الشاغرة <span>{{ officeStats.active_count }}</span>
      </button>
      <button :class="{ active: lsView==='external' }" @click="lsView='external'">
        عقارات خارج المكتب <span>{{ myExternalList.length }}</span>
      </button>
    </div>

    <!-- ===== OFFICE LISTINGS ===== -->
    <template v-if="lsView==='office'">
      <div class="page-title">
        <div>
          <h2>مهام العقارات الشاغرة</h2>
          <p>متابعة الوحدات من «الاسم فقط» حتى «تنزيل الإعلان»</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button v-if="usingFallback" class="btn btn-ghost btn-sm" style="color:var(--warning);" disabled>⚠ وضع محلي</button>
          <button class="btn btn-dark btn-sm" @click="openNew('office')">+ إضافة وحدة شاغرة</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="card stat-card"><div class="lbl">الوحدات الشاغرة</div><div class="val">{{ officeStats.active_count }}</div></div>
        <div class="card stat-card"><div class="lbl">مسؤوليتي</div><div class="val">{{ myOpenCount }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--success);"><div class="lbl">تم تنزيل الإعلان</div><div class="val">{{ officeStats.published_count }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--danger);"><div class="lbl">تنبيهات الترخيص</div><div class="val">{{ officeStats.license_alerts_count }}</div></div>
      </div>

      <div v-if="loading" class="card" style="text-align:center;padding:30px;">
        <div class="spinner" style="margin:0 auto 10px;"></div>
        <div class="muted">جارٍ التحميل...</div>
      </div>

      <template v-else>
        <!-- Tabs -->
        <div class="pill-tabs" style="flex-wrap:wrap;">
          <button v-for="[k,lbl,c] in officeTabs" :key="k"
                  class="pill-tab" :class="{ active: officeTab===k }" @click="officeTab=k">
            {{ lbl }} ({{ c }})
          </button>
        </div>

        <!-- Search + filters -->
        <div class="search-bar">
          <input v-model="lsSearch" placeholder="ابحث بالكود، اسم الوحدة، المالك..." @input="onSearch">
          <select v-model="lsStatusF" @change="onSearch">
            <option value="">كل الحالات</option>
            <option v-for="s in LS_STATUSES" :key="s.k" :value="s.k">{{ s.l }}</option>
          </select>
          <select v-model="lsTypeF" @change="onSearch">
            <option value="">كل الأنواع</option>
            <option v-for="(lbl,k) in LS_TYPES" :key="k" :value="k">{{ lbl }}</option>
          </select>
        </div>

        <div class="card">
          <div class="table-wrap">
            <table class="ls-table">
              <thead>
                <tr>
                  <th>الكود</th><th>الوحدة</th><th>النوع</th><th>المالك</th>
                  <th>السعر</th><th>الحالة</th><th>الاكتمال</th><th>المسؤول</th><th></th>
                </tr>
              </thead>
              <tbody>
                <template v-if="filteredOffice.length">
                  <tr v-for="l in filteredOffice" :key="l.id" class="clickable" @click="openDetail(l.id)">
                    <td>
                      <span class="ls-code">{{ l.code }}</span>
                      <div v-if="isMyListing(l)" class="muted" style="font-size:10.5px;margin-top:2px;">مسؤوليتي</div>
                    </td>
                    <td>
                      <b>{{ l.title||'—' }}</b>
                      <div v-if="l.unit_no||l.unitNo" class="muted" style="font-size:11.5px;">وحدة {{ l.unit_no||l.unitNo }}</div>
                    </td>
                    <td>{{ LS_TYPES[l.unit_type||l.unitType]||'—' }}</td>
                    <td>{{ l.owner_name||l.ownerName||'—' }}</td>
                    <td>
                      <span v-if="l.deal_type||l.dealType" class="badge badge-neutral" style="display:block;width:fit-content;margin-bottom:3px;">{{ LS_DEALS[l.deal_type||l.dealType]||'' }}</span>
                      <div v-if="Number(l.rent_price||l.rentPrice)>0" style="font-size:12px;font-weight:700;">إيجار {{ fmtMoney(l.rent_price||l.rentPrice) }}</div>
                      <div v-if="Number(l.sale_price||l.salePrice)>0" style="font-size:12px;font-weight:700;">بيع {{ fmtMoney(l.sale_price||l.salePrice) }}</div>
                    </td>
                    <td>
                      <!-- collector can only update their own listings' status -->
                      <template v-if="isMyListing(l) && l.vacant">
                        <select class="ls-status-sel" :class="`ls-tone-${lsStatusObj(l.status).tone}`"
                                @click.stop @change="e=>setStatus(l,(e.target as HTMLSelectElement).value)">
                          <optgroup label="مراحل التسويق">
                            <option v-for="(s,i) in LS_FLOW" :key="s.k" :value="s.k" :selected="l.status===s.k">{{ i+1 }}. {{ s.l }}</option>
                          </optgroup>
                          <optgroup label="حالات الترخيص">
                            <option v-for="s in LS_ALERTS" :key="s.k" :value="s.k" :selected="l.status===s.k">{{ s.l }}</option>
                          </optgroup>
                        </select>
                      </template>
                      <template v-else>
                        <span class="ls-badge" :class="`ls-tone-${lsStatusObj(l.status).tone}`">{{ lsStatusObj(l.status).l }}</span>
                      </template>
                    </td>
                    <td>
                      <div class="ls-mini-progress"><div :style="`width:${l.checklist_pct??checklistPct(l)}%`"></div></div>
                      <div class="muted" style="font-size:11px;margin-top:3px;">{{ l.checklist_pct??checklistPct(l) }}%</div>
                    </td>
                    <td class="muted" style="font-size:12px;">
                      {{ l.responsible_name || l.responsible?.split(':')[1] || '—' }}
                      <span v-if="isMyListing(l)" style="color:var(--orange-dark);font-size:10.5px;"> (أنا)</span>
                    </td>
                    <td @click.stop>
                      <button class="btn btn-ghost btn-sm" @click="openDetail(l.id)">فتح ›</button>
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="9"><div class="empty-state"><b>لا توجد وحدات مطابقة</b></div></td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div v-if="pagination && pagination.last_page > 1" style="display:flex;justify-content:center;gap:8px;margin-top:16px;">
            <button class="btn btn-ghost btn-sm" :disabled="currentPage<=1" @click="changePage(currentPage-1)">‹ السابق</button>
            <span style="padding:7px 12px;font-size:13px;font-weight:700;">{{ currentPage }} / {{ pagination.last_page }}</span>
            <button class="btn btn-ghost btn-sm" :disabled="currentPage>=pagination.last_page" @click="changePage(currentPage+1)">التالي ›</button>
          </div>
        </div>
      </template>
    </template>

    <!-- ===== EXTERNAL (my own) ===== -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>عقارات خارج المكتب (لقطاتي)</h2>
          <p>العقارات التي سجّلتها — بانتظار مراجعة الإدارة</p>
        </div>
        <button class="btn btn-dark btn-sm" @click="openNew('external')">+ تسجيل عقار خارج المكتب</button>
      </div>

      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="card stat-card" style="border-right-color:var(--warning);"><div class="lbl">بانتظار المراجعة</div><div class="val">{{ myExternalList.filter(l=>l.review==='pending'||l.review==='needs_info').length }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--orange);"><div class="lbl">مطلوب استكمال</div><div class="val">{{ myExternalList.filter(l=>l.review==='needs_info').length }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--success);"><div class="lbl">مقبولة</div><div class="val">{{ myExternalList.filter(l=>l.review==='accepted').length }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--danger);"><div class="lbl">مرفوضة</div><div class="val">{{ myExternalList.filter(l=>l.review==='rejected').length }}</div></div>
      </div>

      <div v-if="extLoading" class="card" style="text-align:center;padding:30px;">
        <div class="spinner" style="margin:0 auto 10px;"></div><div class="muted">جارٍ التحميل...</div>
      </div>
      <div v-else class="grid grid-3">
        <template v-if="myExternalList.length">
          <div v-for="l in myExternalList" :key="l.id" class="card"
               :style="`border-top:3px solid ${extBorderColor(l.review)};cursor:pointer;`"
               @click="openDetail(l.id)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
              <span class="ls-code">{{ l.code }}</span>
              <span class="ls-badge" :class="`ls-tone-${(EX_REVIEW[l.review||'pending']||EX_REVIEW.pending).tone}`">{{ (EX_REVIEW[l.review||'pending']||EX_REVIEW.pending).l }}</span>
            </div>
            <div style="font-weight:800;font-size:13.5px;margin-bottom:6px;">{{ l.title||'—' }}</div>
            <div class="kv"><span class="k">النوع</span><span class="v">{{ LS_TYPES[l.unit_type||l.unitType]||'—' }}</span></div>
            <div class="kv"><span class="k">اكتمال البيانات</span><span class="v">{{ l.checklist_pct??checklistPct(l) }}%</span></div>
            <div v-if="l.review==='needs_info'&&(l.ext_note||l.extNote)" class="kb-note" style="margin-top:8px;">المطلوب: {{ l.ext_note||l.extNote }}</div>
            <div v-if="l.review==='rejected'" class="kb-note danger" style="margin-top:8px;">سبب الرفض: {{ l.ext_reject_reason||l.extRejectReason||'—' }}</div>
            <div style="margin-top:10px;" @click.stop>
              <button class="btn btn-ghost btn-sm" style="width:100%;" @click="openDetail(l.id)">فتح وتعديل ›</button>
            </div>
          </div>
        </template>
        <div v-else class="card" style="grid-column:1/-1;">
          <div class="empty-state"><b>لم تسجّل أي عقارات خارج المكتب بعد</b></div>
        </div>
      </div>
    </template>

    <!-- ===== MODAL: CREATE ===== -->
    <div v-if="showNewModal" class="modal-overlay" @click.self="showNewModal=false">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ newKind==='external'?'تسجيل عقار خارج المكتب':'إضافة وحدة شاغرة' }}</h3>
          <button class="modal-close" @click="showNewModal=false">×</button>
        </div>
        <div class="field"><label>اسم الوحدة *</label>
          <input v-model="nf.title" :placeholder="newKind==='external'?'مثال: فيلا حي الملقا':'مثال: شقة حي النرجس'">
        </div>
        <div class="row2">
          <div class="field"><label>نوع الوحدة *</label>
            <select v-model="nf.unitType">
              <option value="">اختر النوع</option>
              <option v-for="(lbl,k) in LS_TYPES" :key="k" :value="k">{{ lbl }}</option>
            </select>
          </div>
          <div class="field"><label>للبيع أو الإيجار</label>
            <select v-model="nf.dealType">
              <option value="">يُحدَّد لاحقًا</option>
              <option v-for="(lbl,k) in LS_DEALS" :key="k" :value="k">{{ lbl }}</option>
            </select>
          </div>
        </div>
        <template v-if="newKind==='external'">
          <div class="row2">
            <div class="field"><label>مصدر اللقطة</label><input v-model="nf.srcName" placeholder="وسيط، مالك مباشر..."></div>
            <div class="field"><label>جوال المصدر</label><input v-model="nf.srcPhone" placeholder="05xxxxxxxx"></div>
          </div>
        </template>
        <div class="hint" style="margin-bottom:10px;">
          {{ newKind==='external' ? 'تُرسل للمشرف العام للمراجعة.' : 'تبدأ بحالة «عندي الاسم فقط».' }}
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showNewModal=false">إلغاء</button>
          <button class="btn btn-primary" :disabled="saving" @click="createListing">
            {{ saving ? 'جارٍ الإنشاء...' : (newKind==='external'?'تسجيل العقار':'إضافة الوحدة') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useListingsApi, useExtState, LS_DEFAULT_PLATFORMS, type Listing } from '~/composables/useAppState'
import { useListingsApi as useListApi } from '~/composables/useApi'
import { useExtState as useExt } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'

const listApi    = useListApi()
const { extState, load: loadLocal, save: saveLocal, lsOffice, exAll, lsNextCode, exNextCode } = useExt()
const { fmtDate, fmtMoney, todayISO } = useFormat()
const router     = useRouter()
const showToast  = inject<(m:string)=>void>('showToast', m => console.log(m))
const colSession = inject<any>('collectorSession')

const myId       = computed(() => colSession?.value?.id || '')
const myActorKey = computed(() => myId.value ? `collector:${myId.value}` : '')

// ── state ──
const loading       = ref(true)
const extLoading    = ref(true)
const saving        = ref(false)
const usingFallback = ref(false)
const listings      = ref<any[]>([])
const myExternalList= ref<any[]>([])
const officeStats   = ref({ active_count:0, published_count:0, license_alerts_count:0, closed_count:0, external_pending_count:0 })
const pagination    = ref<any>(null)
const currentPage   = ref(1)

const lsView    = ref<'office'|'external'>('office')
const officeTab = ref('mine')
const lsSearch  = ref('')
const lsStatusF = ref('')
const lsTypeF   = ref('')

// ── constants ──
const LS_TYPES: Record<string,string> = { apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة', land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى' }
const LS_DEALS: Record<string,string> = { rent:'إيجار', sale:'بيع', both:'بيع أو إيجار' }
const LS_FLOW = [
  {k:'name_only',l:'عندي الاسم فقط',tone:'muted'},{k:'basic_details',l:'تفاصيل أولية',tone:'muted'},
  {k:'photographed',l:'تم التصوير',tone:'warn'},{k:'waiting_video',l:'بانتظار الفيديو',tone:'warn'},
  {k:'website_only',l:'بالموقع فقط',tone:'orange'},{k:'awaiting_owner_license',l:'بانتظار الترخيص',tone:'warn'},
  {k:'license_issued',l:'تم الترخيص',tone:'orange'},{k:'publishing',l:'جاري التنزيل',tone:'orange'},
  {k:'published',l:'تم تنزيل الإعلان',tone:'ok'},
]
const LS_ALERTS = [{k:'license_renewal',l:'ترخيص منتهي — تجديد',tone:'danger'},{k:'license_expired',l:'ترخيص منتهي تماماً',tone:'danger'}]
const LS_STATUSES = [...LS_FLOW, ...LS_ALERTS]
const EX_REVIEW: Record<string,{l:string;tone:string}> = {
  pending:{l:'بانتظار المراجعة',tone:'warn'}, needs_info:{l:'مطلوب استكمال',tone:'orange'},
  rejected:{l:'مرفوضة',tone:'danger'},         accepted:{l:'مقبولة',tone:'ok'},
}

const lsStatusObj = (k: string) => LS_STATUSES.find(s=>s.k===k) || LS_STATUSES[0]
const isMyListing = (l: any) => {
  const r = l.responsible_id ? String(l.responsible_id) === String(myId.value) : (l.responsible||'').includes(`:${myId.value}`)
  return r
}
const checklistPct = (l: any) => {
  if (l.checklist_pct != null) return l.checklist_pct
  const items = [!!(l.owner_id||l.ownerId||l.owner_name||l.ownerName), !!(l.description||'').trim(), !!(Number(l.rent_price||l.rentPrice)>0||Number(l.sale_price||l.salePrice)>0), (l.photos_count??0)>0]
  return Math.round(items.filter(Boolean).length/items.length*100)
}
const extBorderColor = (r?: string) => ({ pending:'var(--warning)',needs_info:'var(--orange)',accepted:'var(--success)',rejected:'var(--danger)' }[r||'pending']||'var(--warning)')

// ── COMPUTED ──
const myOpenCount = computed(() => listings.value.filter(l=>l.vacant && isMyListing(l) && l.status!=='published').length)
const officeTabs  = computed((): [string,string,number][] => [
  ['mine',   'مهامي',     listings.value.filter(l=>l.vacant&&isMyListing(l)).length],
  ['active', 'كل الشاغرة', listings.value.filter(l=>l.vacant).length],
  ['closed', 'غير شاغرة',  listings.value.filter(l=>!l.vacant).length],
  ['all',    'الكل',       listings.value.length],
])
const filteredOffice = computed(() => {
  let list = listings.value
  if (officeTab.value==='mine')   list = list.filter(l=>l.vacant&&isMyListing(l))
  else if (officeTab.value==='active') list = list.filter(l=>l.vacant)
  else if (officeTab.value==='closed') list = list.filter(l=>!l.vacant)
  if (lsStatusF.value) list = list.filter(l=>l.status===lsStatusF.value)
  if (lsTypeF.value)   list = list.filter(l=>(l.unit_type||l.unitType)===lsTypeF.value)
  const q = lsSearch.value.trim().toLowerCase()
  if (q) list = list.filter(l=>[l.code,l.title,l.owner_name||l.ownerName||'',l.brokerage_no||l.brokerageNo||''].join(' ').toLowerCase().includes(q))
  return [...list].sort((a,b)=>(b.updated_at||b.updatedAt||'').localeCompare(a.updated_at||a.updatedAt||''))
})

// ── FETCH ──
async function fetchOffice() {
  loading.value = true
  try {
    const res = await listApi.collector.list({ tab: officeTab.value==='mine'?'mine':officeTab.value, search: lsSearch.value||undefined, status: lsStatusF.value||undefined, unit_type: lsTypeF.value||undefined, page: currentPage.value })
    listings.value = res.listings || []
    if (res.statistics) officeStats.value = res.statistics
    pagination.value = res.pagination || null
    usingFallback.value = false
  } catch {
    loadLocal(); usingFallback.value = true
    listings.value = lsOffice.value
    const active = lsOffice.value.filter(l=>l.vacant)
    officeStats.value = { active_count:active.length, published_count:active.filter(l=>l.status==='published').length, license_alerts_count:0, closed_count:lsOffice.value.filter(l=>!l.vacant).length, external_pending_count:0 }
  } finally { loading.value = false }
}

async function fetchExternal() {
  extLoading.value = true
  try {
    const res = await listApi.collector.list({ tab:'external' })
    myExternalList.value = (res.listings||[]).filter((l:any) => l.kind==='external')
    usingFallback.value = false
  } catch {
    loadLocal(); usingFallback.value = true
    myExternalList.value = exAll.value.filter(l => (l.createdBy||'').includes(`:${myId.value}`))
  } finally { extLoading.value = false }
}

let searchTimer: ReturnType<typeof setTimeout>|null = null
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value=1; fetchOffice() }, 380)
}

function changePage(p: number) { currentPage.value=p; fetchOffice() }

watch(lsView, v => { if (v==='external' && !myExternalList.value.length) fetchExternal() })
onMounted(() => { loadLocal(); fetchOffice(); fetchExternal() })

// ── SET STATUS ──
async function setStatus(l: any, k: string) {
  const prevStatus = l.status; l.status = k
  try {
    const updated = await listApi.collector.updateStatus(l.id, { status: k })
    const idx = listings.value.findIndex(x=>x.id===l.id)
    if (idx!==-1) listings.value[idx] = updated
    showToast('تم تحديث الحالة: ' + lsStatusObj(k).l)
  } catch {
    // fallback localStorage
    const local = lsOffice.value.find(x=>String(x.id)===String(l.id))
    if (local) { local.status=k; local.updatedAt=new Date().toISOString(); await saveLocal() }
    showToast('تم تحديث الحالة محلياً')
  }
}

// ── NAVIGATE ──
function openDetail(id: number|string) { router.push(`/supervisor/listingdetail?id=${id}`) }

// ── CREATE ──
const showNewModal = ref(false)
const newKind = ref<'office'|'external'>('office')
const nf = ref({ title:'', unitType:'', dealType:'', srcName:'', srcPhone:'' })

function openNew(k: 'office'|'external') { newKind.value=k; nf.value={title:'',unitType:'',dealType:'',srcName:'',srcPhone:''}; showNewModal.value=true }

async function createListing() {
  if (!nf.value.title.trim())  { showToast('الرجاء إدخال اسم الوحدة'); return }
  if (!nf.value.unitType)      { showToast('الرجاء اختيار نوع الوحدة'); return }
  saving.value = true
  const isExt = newKind.value === 'external'
  const body = { title: nf.value.title.trim(), unit_type: nf.value.unitType, deal_type: nf.value.dealType||null, kind: newKind.value, source_name: nf.value.srcName.trim()||null, source_phone: nf.value.srcPhone.trim()||null }
  try {
    const res = await listApi.collector.create(body)
    showNewModal.value = false
    showToast(isExt ? `تم تسجيل ${res.code} — بانتظار موافقة الإدارة` : `تمت إضافة الوحدة ${res.code}`)
    if (isExt) { myExternalList.value.unshift(res); lsView.value='external' }
    else        { listings.value.unshift(res); openDetail(res.id) }
  } catch {
    // fallback localStorage
    loadLocal()
    const now = new Date().toISOString()
    const code = isExt ? exNextCode() : lsNextCode()
    const rec: any = { id: `local_${Date.now()}`, code, kind: newKind.value, source:'new', title: nf.value.title.trim(), unitType: nf.value.unitType, unitNo:'', status:'name_only', vacant:true, responsible: myActorKey.value, createdBy: myActorKey.value, createdAt: now, updatedAt: now, updatedBy: myActorKey.value, ownerMode:'linked', ownerId:null, ownerName:'', ownerPhone:'', brokerageNo:'', brokerageDate:'', description:'', answers:{}, dealType: nf.value.dealType, rentPrice:'', rentCycle:'سنوي', salePrice:'', photos:[], videos:[], videoUrl:'', license:{}, guard:{}, location:null, platforms:{}, history:[], ...(isExt ? { review:'pending', extSource:{ name:nf.value.srcName, phone:nf.value.srcPhone } }:{}) }
    rec.history.push({ id:`h_${Date.now()}`, at:now, by:myActorKey.value, type:'create', text:'أضاف وحدة' })
    extState.value.listings.push(rec)
    await saveLocal()
    showNewModal.value = false
    showToast(isExt ? `تم تسجيل ${code} محلياً` : `تمت إضافة ${code} محلياً`)
    if (isExt) { myExternalList.value.unshift(rec); lsView.value='external' }
    else        { listings.value.unshift(rec); openDetail(rec.id) }
  } finally { saving.value=false }
}
</script>
