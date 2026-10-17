<template>
  <div>
    <!-- View Switch -->
    <div class="view-switch">
      <button :class="{ active: lsView==='office' }" @click="lsView='office'">
        مهام العقارات الشاغرة <span>{{ activeOffice.length }}</span>
      </button>
      <button :class="{ active: lsView==='external' }" @click="lsView='external'">
        عقارات خارج المكتب <span>{{ myExternal.length }}</span>
      </button>
    </div>

    <!-- ===== OFFICE LISTINGS ===== -->
    <template v-if="lsView==='office'">
      <div class="page-title">
        <div>
          <h2>مهام العقارات الشاغرة</h2>
          <p>متابعة الوحدات الشاغرة من «الاسم فقط» حتى «تنزيل الإعلان»</p>
        </div>
        <button class="btn btn-dark btn-sm" @click="openNew">+ إضافة وحدة شاغرة</button>
      </div>

      <!-- Stats -->
      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="card stat-card"><div class="lbl">الوحدات الشاغرة</div><div class="val">{{ activeOffice.length }}</div></div>
        <div class="card stat-card"><div class="lbl">مسؤوليتي</div><div class="val">{{ myOpenCount }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--success);"><div class="lbl">تم تنزيل الإعلان</div><div class="val">{{ activeOffice.filter(l=>l.status==='published').length }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--danger);"><div class="lbl">تنبيهات الترخيص</div><div class="val">{{ alertCount }}</div></div>
      </div>

      <!-- Tabs -->
      <div class="pill-tabs" style="flex-wrap:wrap;">
        <button v-for="[k,lbl,c] in officeTabs" :key="k"
                class="pill-tab" :class="{ active: officeTab===k }" @click="officeTab=k">
          {{ lbl }} ({{ c }})
        </button>
      </div>

      <!-- Search + filters -->
      <div class="search-bar">
        <input v-model="lsSearch" placeholder="ابحث بالكود، اسم الوحدة، المالك...">
        <select v-model="lsStatusF">
          <option value="">كل الحالات</option>
          <option v-for="s in LS_STATUSES" :key="s.k" :value="s.k">{{ s.l }}</option>
        </select>
        <select v-model="lsTypeF">
          <option value="">كل الأنواع</option>
          <option v-for="(lbl,k) in LS_TYPES" :key="k" :value="k">{{ lbl }}</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="table-wrap">
          <table class="ls-table">
            <thead>
              <tr>
                <th>الكود</th><th>الوحدة</th><th>النوع</th><th>المالك</th>
                <th>العرض والسعر</th><th>الحالة</th><th>الاكتمال</th>
                <th>المنصات</th><th>الترخيص</th><th>المسؤول</th><th></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="filteredOffice.length">
                <tr v-for="l in filteredOffice" :key="l.id" class="clickable" @click="openDetail(l.id)">
                  <td>
                    <span class="ls-code">{{ l.code }}</span>
                    <div v-if="l.responsible===myActorKey" class="muted" style="font-size:10.5px;margin-top:2px;">مسؤوليتي</div>
                  </td>
                  <td>
                    <b>{{ l.title||'—' }}</b>
                    <div v-if="l.unitNo" class="muted" style="font-size:11.5px;">وحدة {{ l.unitNo }}</div>
                  </td>
                  <td>{{ LS_TYPES[l.unitType]||'—' }}</td>
                  <td>{{ lsOwnerNameLocal(l)||'—' }}</td>
                  <td>
                    <span v-if="l.dealType" class="badge badge-neutral" style="margin-bottom:3px;display:block;width:fit-content;">{{ LS_DEALS[l.dealType]||l.dealType }}</span>
                    <div v-if="Number(l.rentPrice)>0" style="font-size:12px;font-weight:700;">إيجار {{ fmtMoney(l.rentPrice) }}</div>
                    <div v-if="Number(l.salePrice)>0" style="font-size:12px;font-weight:700;">بيع {{ fmtMoney(l.salePrice) }}</div>
                  </td>
                  <td>
                    <!-- Collector can update status only for their own listings -->
                    <template v-if="l.responsible===myActorKey && l.vacant">
                      <select class="ls-status-sel" :class="`ls-tone-${lsStatusObj(l.status).tone}`"
                              @click.stop @change="e=>setStatus(l.id,(e.target as HTMLSelectElement).value)">
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
                    <div class="ls-mini-progress"><div :style="`width:${checklistPct(l)}%`"></div></div>
                    <div class="muted" style="font-size:11px;margin-top:3px;">{{ checklistPct(l) }}%</div>
                  </td>
                  <td>
                    <div class="ls-chips">
                      <span v-for="p in lsPublished(l)" :key="p.id" class="ls-chip">{{ p.name }}</span>
                      <span v-if="!lsPublished(l).length" class="muted">—</span>
                    </div>
                  </td>
                  <td><span v-html="licenseBadge(l)"></span></td>
                  <td style="font-size:12px;">{{ actorLabel(l.responsible) }}</td>
                  <td @click.stop>
                    <button class="btn btn-ghost btn-sm" @click="openDetail(l.id)">فتح ›</button>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="11"><div class="empty-state"><b>لا توجد وحدات مطابقة</b></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ===== EXTERNAL LISTINGS (my own) ===== -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>عقارات خارج المكتب (لقطاتي)</h2>
          <p>العقارات التي سجّلتها بنفسك — بانتظار مراجعة الإدارة</p>
        </div>
        <button class="btn btn-dark btn-sm" @click="openNewExt">+ تسجيل عقار خارج المكتب</button>
      </div>

      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="card stat-card" style="border-right-color:var(--warning);"><div class="lbl">بانتظار المراجعة</div><div class="val">{{ myExternal.filter(l=>l.review==='pending'||l.review==='needs_info').length }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--orange);"><div class="lbl">مطلوب استكمال</div><div class="val">{{ myExternal.filter(l=>l.review==='needs_info').length }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--success);"><div class="lbl">مقبولة</div><div class="val">{{ myExternal.filter(l=>l.review==='accepted'||l.extCode).length }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--danger);"><div class="lbl">مرفوضة</div><div class="val">{{ myExternal.filter(l=>l.review==='rejected').length }}</div></div>
      </div>

      <div class="grid grid-3">
        <template v-if="myExternal.length">
          <div v-for="l in myExternal" :key="l.id" class="card"
               :style="`border-top:3px solid ${extBorderColor(l.review)}`"
               @click="openDetail(l.id)" style="cursor:pointer;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
              <span class="ls-code">{{ l.code }}</span>
              <span class="ls-badge" :class="`ls-tone-${(EX_REVIEW[l.review||'pending']||EX_REVIEW.pending).tone}`">{{ (EX_REVIEW[l.review||'pending']||EX_REVIEW.pending).l }}</span>
            </div>
            <div style="font-weight:800;font-size:13.5px;margin-bottom:6px;">{{ l.title||'—' }}</div>
            <div class="kv"><span class="k">النوع</span><span class="v">{{ LS_TYPES[l.unitType]||'—' }}</span></div>
            <div class="kv"><span class="k">اكتمال البيانات</span><span class="v">{{ checklistPct(l) }}%</span></div>
            <div v-if="l.review==='needs_info' && l.extNote" class="kb-note" style="margin-top:8px;">المطلوب: {{ l.extNote }}</div>
            <div v-if="l.review==='rejected'" class="kb-note danger" style="margin-top:8px;">سبب الرفض: {{ l.extRejectReason||'—' }}</div>
            <div style="margin-top:10px;" @click.stop>
              <button class="btn btn-ghost btn-sm" style="width:100%;" @click="openDetail(l.id)">فتح وتعديل ›</button>
            </div>
          </div>
        </template>
        <div v-else class="card" style="grid-column:1/-1;">
          <div class="empty-state"><b>لم تسجّل أي عقارات خارج المكتب بعد</b>اضغط «تسجيل عقار خارج المكتب» لإضافة لقطة جديدة</div>
        </div>
      </div>
    </template>

    <!-- ===== MODAL: NEW OFFICE LISTING ===== -->
    <div v-if="showNewModal" class="modal-overlay" @click.self="showNewModal=false">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ newKind==='external'?'تسجيل عقار خارج المكتب (لقطة)':'إضافة وحدة شاغرة' }}</h3>
          <button class="modal-close" @click="showNewModal=false">×</button>
        </div>
        <div class="field"><label>اسم الوحدة *</label>
          <input v-model="nf.title" :placeholder="newKind==='external'?'مثال: فيلا حي الملقا - زاوية':'مثال: شقة حي النرجس'">
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
          {{ newKind==='external' ? 'تُرسل للمشرف العام للمراجعة — القبول ينقلها إلى مهام العقارات الشاغرة.' : 'تبدأ بحالة «عندي الاسم فقط»، استكمل بياناتها من صفحة الوحدة.' }}
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showNewModal=false">إلغاء</button>
          <button class="btn btn-primary" @click="createListing">
            {{ newKind==='external'?'تسجيل العقار':'إضافة الوحدة' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExtState, LS_DEFAULT_PLATFORMS, type Listing } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'

const { extState, load, save, uid, lsOffice, exAll, lsNextCode, exNextCode, lsOwnerName, getListing } = useExtState()
const { fmtDate, fmtMoney, todayISO } = useFormat()
const router = useRouter()
const showToast = inject<(m:string)=>void>('showToast', m => console.log(m))
const collectorSession = inject<any>('collectorSession')

const myId = computed(() => collectorSession?.value?.id || '')
const myActorKey = computed(() => myId.value ? `collector:${myId.value}` : '')

onMounted(() => load())

// ===== CONSTANTS =====
const LS_TYPES: Record<string,string> = { apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة', land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى' }
const LS_DEALS: Record<string,string> = { rent:'إيجار', sale:'بيع', both:'بيع أو إيجار' }
const LS_FLOW = [
  {k:'name_only',              l:'عندي الاسم فقط',              tone:'muted'},
  {k:'basic_details',          l:'موجود التفاصيل الأولية فقط',  tone:'muted'},
  {k:'photographed',           l:'تم تصوير الوحدة',              tone:'warn'},
  {k:'waiting_video',          l:'بانتظار الفيديو',              tone:'warn'},
  {k:'website_only',           l:'بالموقع الإلكتروني فقط',      tone:'orange'},
  {k:'awaiting_owner_license', l:'بانتظار ترخيص المالك',         tone:'warn'},
  {k:'license_issued',         l:'تم إصدار الترخيص',            tone:'orange'},
  {k:'publishing',             l:'جاري تنزيل الإعلان',          tone:'orange'},
  {k:'published',              l:'تم تنزيل الإعلان',            tone:'ok'},
]
const LS_ALERTS = [
  {k:'license_renewal', l:'ترخيص منتهي — مطلوب تجديد', tone:'danger'},
  {k:'license_expired', l:'ترخيص منتهي تماماً',         tone:'danger'},
]
const LS_STATUSES = [...LS_FLOW, ...LS_ALERTS]
const EX_REVIEW: Record<string,{l:string;tone:string}> = {
  pending:    { l:'بانتظار مراجعة الإدارة', tone:'warn'   },
  needs_info: { l:'مطلوب استكمال',           tone:'orange' },
  rejected:   { l:'مرفوضة',                  tone:'danger' },
  accepted:   { l:'مقبولة',                  tone:'ok'     },
}

const lsStatusObj = (k: string) => LS_STATUSES.find(s=>s.k===k) || LS_STATUSES[0]

// ===== VIEW STATE =====
const lsView    = ref<'office'|'external'>('office')
const officeTab = ref('mine')
const lsSearch  = ref('')
const lsStatusF = ref('')
const lsTypeF   = ref('')

// ===== COMPUTED =====
const activeOffice = computed(() => lsOffice.value.filter(l => l.vacant))
const myOpenCount  = computed(() => activeOffice.value.filter(l => l.responsible===myActorKey.value).length)
const alertCount   = computed(() => activeOffice.value.filter(l => ['expired','soon'].includes(licenseState(l))).length)
const myExternal   = computed(() =>
  exAll.value.filter(l => l.createdBy===myActorKey.value)
    .sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''))
)

const officeTabs = computed((): [string,string,number][] => [
  ['mine',   'مهامي',     myOpenCount.value],
  ['active', 'كل الشاغرة', activeOffice.value.length],
  ['closed', 'غير شاغرة',  lsOffice.value.filter(l=>!l.vacant).length],
  ['all',    'الكل',       lsOffice.value.length],
])

const filteredOffice = computed(() => {
  let list = lsOffice.value
  if (officeTab.value === 'mine')   list = list.filter(l => l.vacant && l.responsible===myActorKey.value)
  else if (officeTab.value === 'active') list = list.filter(l => l.vacant)
  else if (officeTab.value === 'closed') list = list.filter(l => !l.vacant)
  if (lsStatusF.value) list = list.filter(l => l.status===lsStatusF.value)
  if (lsTypeF.value)   list = list.filter(l => l.unitType===lsTypeF.value)
  const q = lsSearch.value.trim().toLowerCase()
  if (q) list = list.filter(l => [l.code, l.title, lsOwnerNameLocal(l), l.brokerageNo].join(' ').toLowerCase().includes(q))
  return [...list].sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''))
})

// ===== HELPERS =====
const lsOwnerNameLocal = (l: Listing) => {
  if (l.ownerId) {
    const o = extState.value.properties.find(p => p.ownerId === l.ownerId)
    return o ? l.ownerName || '' : l.ownerName || ''
  }
  return l.ownerName || ''
}
const lsPublished  = (l: Listing) => (extState.value.listingPlatforms||[]).filter(p => (l.platforms||{})[p.id])
const licenseState = (l: Listing) => {
  const exp = (l.license||{}).expiry
  if (!exp) return 'none'
  const d = Math.round((new Date(exp).getTime() - Date.now()) / 86400000)
  if (d < 0) return 'expired'; if (d <= 30) return 'soon'; return 'valid'
}
const licenseBadge = (l: Listing) => {
  const s = licenseState(l), exp = (l.license||{}).expiry
  if (s==='none')    return '<span class="muted">—</span>'
  if (s==='expired') return `<span class="badge badge-rejected">منتهي ${fmtDate(exp||'')}</span>`
  if (s==='soon')    return `<span class="badge badge-pending">ينتهي قريباً</span>`
  return `<span class="badge badge-approved">سارٍ حتى ${fmtDate(exp||'')}</span>`
}
const checklistPct = (l: Listing) => {
  const items = [
    !!(l.ownerId || l.ownerName),
    !!(l.description||'').trim(),
    !!(Number(l.rentPrice)>0 || Number(l.salePrice)>0),
    (l.photos||[]).length > 0,
    !!(l.license?.number && l.license?.file),
    !!(l.guard?.name || l.guard?.phone),
    !!l.location,
  ]
  return Math.round(items.filter(Boolean).length / items.length * 100)
}
const actorLabel = (key: string) => {
  if (!key) return '—'
  const [role, id] = key.split(':')
  if (role==='collector' && id===String(myId.value)) return 'أنا'
  return key.split(':')[1] || '—'
}
const extBorderColor = (r?: string) => ({
  pending:'var(--warning)', needs_info:'var(--orange)',
  accepted:'var(--success)', rejected:'var(--danger)',
}[r||'pending'] || 'var(--warning)')

// ===== SET STATUS (own listings only) =====
function setStatus(id: string, k: string) {
  const l = getListing(id); if (!l || !l.vacant) return
  const from = l.status; l.status = k
  l.updatedAt = new Date().toISOString(); l.updatedBy = myActorKey.value
  l.history.push({ id:uid(), at:l.updatedAt, by:myActorKey.value, type:'status', from, to:k })
  save(); showToast('تم تحديث الحالة: ' + lsStatusObj(k).l)
}

// ===== NAVIGATE TO DETAIL =====
function openDetail(id: string) {
  router.push(`/supervisor/listingdetail?id=${id}`)
}

// ===== CREATE MODAL =====
const showNewModal = ref(false)
const newKind = ref<'office'|'external'>('office')
const nf = ref({ title:'', unitType:'', dealType:'', srcName:'', srcPhone:'' })

function openNew()    { newKind.value='office';   nf.value={ title:'', unitType:'', dealType:'', srcName:'', srcPhone:'' }; showNewModal.value=true }
function openNewExt() { newKind.value='external'; nf.value={ title:'', unitType:'', dealType:'', srcName:'', srcPhone:'' }; showNewModal.value=true }

function createListing() {
  if (!nf.value.title.trim())  { showToast('الرجاء إدخال اسم الوحدة'); return }
  if (!nf.value.unitType)      { showToast('الرجاء اختيار نوع الوحدة'); return }
  const now = new Date().toISOString()
  const isExt = newKind.value === 'external'
  const code = isExt ? exNextCode() : lsNextCode()
  const rec: Listing = {
    id: uid(), code, kind: newKind.value, source: 'new', title: nf.value.title.trim(),
    unitType: nf.value.unitType, status: 'name_only', vacant: true,
    responsible: myActorKey.value, createdBy: myActorKey.value, createdAt: now, updatedAt: now, updatedBy: myActorKey.value,
    propertyId: null, unitNo: '', ownerMode: 'linked', ownerId: null, ownerName: '', ownerPhone: '',
    brokerageNo: '', brokerageDate: '', description: '', answers: {}, dealType: nf.value.dealType,
    rentPrice: '', rentCycle: 'سنوي', salePrice: '', photos: [], videos: [], videoUrl: '',
    license: {}, guard: {}, location: null, platforms: {}, history: [],
    ...(isExt ? {
      review: 'pending',
      extSource: { name: nf.value.srcName.trim(), phone: nf.value.srcPhone.trim() },
    } : {}),
  }
  rec.history.push({ id: uid(), at: now, by: myActorKey.value, type: 'create', text: isExt ? 'سجّل عقارًا خارج المكتب' : 'أضاف وحدة شاغرة' })
  extState.value.listings.push(rec)
  save()
  showNewModal.value = false
  showToast(isExt ? `تم تسجيل ${code} — بانتظار موافقة الإدارة` : `تمت إضافة الوحدة ${code}`)
  openDetail(rec.id)
}
</script>
