<template>
  <div>
    <!-- View Switch -->
    <div class="view-switch">
      <button :class="{ active: lsView==='office' }" @click="lsView='office'">
        مهام العقارات الشاغرة <span>{{ lsOffice.filter(l=>l.vacant).length }}</span>
      </button>
      <button :class="{ active: lsView==='external' }" @click="lsView='external'">
        عقارات خارج المكتب <span>{{ exPendingCount }}</span>
      </button>
    </div>

    <!-- ===== OFFICE LISTINGS ===== -->
    <template v-if="lsView==='office'">
      <div class="page-title">
        <div>
          <h2>مهام العقارات الشاغرة</h2>
          <p>متابعة كل وحدة شاغرة من «الاسم فقط» حتى «تنزيل الإعلان»</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" @click="exportExcel">⬇ تصدير Excel</button>
          <button class="btn btn-dark btn-sm" @click="openNew('office')">+ إضافة وحدة شاغرة</button>
        </div>
      </div>

      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="card stat-card"><div class="lbl">الوحدات الشاغرة</div><div class="val">{{ activeOffice.length }}</div></div>
        <div class="card stat-card"><div class="lbl">مسؤوليتي</div><div class="val">{{ myOpenCount }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--success);">
          <div class="lbl">تم تنزيل الإعلان</div>
          <div class="val">{{ activeOffice.filter(l=>l.status==='published').length }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--danger);">
          <div class="lbl">تنبيهات الترخيص</div>
          <div class="val">{{ alertCount }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="pill-tabs" style="flex-wrap:wrap;">
        <button v-for="[k,lbl,c] in officeTabs" :key="k" class="pill-tab" :class="{active:officeTab===k}" @click="officeTab=k">
          {{ lbl }} ({{ c }})
        </button>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <input v-model="lsSearch" placeholder="ابحث بالكود، اسم الوحدة، المالك، عقد الوساطة...">
        <select v-model="lsStatusF">
          <option value="">كل الحالات</option>
          <option v-for="s in LS_STATUSES" :key="s.k" :value="s.k">{{ s.l }}</option>
        </select>
        <select v-model="lsTypeF">
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
                <th>العرض والسعر</th><th>الحالة</th><th>الاكتمال</th>
                <th>المنصات</th><th>الترخيص</th><th>المسؤول</th><th>آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="filteredOffice.length">
                <tr v-for="l in filteredOffice" :key="l.id" class="clickable" @click="openDetail(l.id)">
                  <td><span class="ls-code">{{ l.code }}</span></td>
                  <td>
                    <b>{{ l.title||'—' }}</b>
                    <div v-if="l.unitNo" class="muted" style="font-size:11.5px;">وحدة {{ l.unitNo }}</div>
                  </td>
                  <td>{{ LS_TYPES[l.unitType]||'—' }}</td>
                  <td>{{ lsOwnerName(l) || '—' }}</td>
                  <td>
                    <span v-if="l.dealType" class="badge badge-neutral">{{ LS_DEALS[l.dealType]||l.dealType }}</span>
                    <div v-if="Number(l.rentPrice)>0" style="font-size:12px;font-weight:700;margin-top:3px;">
                      إيجار {{ fmtMoney(l.rentPrice) }}
                    </div>
                    <div v-if="Number(l.salePrice)>0" style="font-size:12px;font-weight:700;">
                      بيع {{ fmtMoney(l.salePrice) }}
                    </div>
                  </td>
                  <td>
                    <span class="ls-badge" :class="'ls-tone-'+lsStatusObj(l.status).tone">{{ lsStatusObj(l.status).l }}</span>
                  </td>
                  <td>
                    <div class="ls-mini-progress"><div :style="`width:${lsChecklistPct(l)}%`"></div></div>
                    <div class="muted" style="font-size:11px;margin-top:3px;">{{ lsChecklistPct(l) }}%</div>
                  </td>
                  <td>
                    <div class="ls-chips">
                      <span v-for="p in lsPublished(l)" :key="p.id" class="ls-chip">{{ p.name }}</span>
                      <span v-if="!lsPublished(l).length" class="muted">—</span>
                    </div>
                  </td>
                  <td><span v-html="lsLicenseBadgeHtml(l)"></span></td>
                  <td>{{ l.responsible ? actorName(l.responsible) : '—' }}</td>
                  <td style="white-space:nowrap;font-size:11.5px;">
                    {{ fmtDate((l.updatedAt||'').slice(0,10)) }}
                  </td>
                </tr>
              </template>
              <tr v-else><td colspan="11"><div class="empty-state"><b>لا توجد وحدات</b></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ===== EXTERNAL (OUTSIDE-OFFICE) ===== -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>عقارات خارج المكتب</h2>
          <p>تسجيل العقارات «اللقطة» — القبول ينقلها إلى مهام العقارات الشاغرة</p>
        </div>
        <button class="btn btn-dark btn-sm" @click="openNew('external')">+ تسجيل عقار خارج المكتب</button>
      </div>

      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="card stat-card" style="border-right-color:var(--warning);"><div class="lbl">بانتظار المراجعة</div><div class="val">{{ exAll.filter(l=>l.review==='pending'||l.review==='needs_info').length }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--success);"><div class="lbl">جاهزة للقرار</div><div class="val">{{ exAll.filter(l=>l.review==='pending'&&exReady(l)).length }}</div></div>
        <div class="card stat-card"><div class="lbl">مقبولة ومحوّلة</div><div class="val">{{ exAcceptedCount }}</div></div>
        <div class="card stat-card" style="border-right-color:var(--danger);"><div class="lbl">مرفوضة</div><div class="val">{{ exAll.filter(l=>l.review==='rejected').length }}</div></div>
      </div>

      <!-- Tabs -->
      <div class="pill-tabs">
        <button class="pill-tab" :class="{active:exTab==='pending'}" @click="exTab='pending'">
          جاري مراجعتها ({{ exAll.filter(l=>l.review==='pending'||l.review==='needs_info').length }})
        </button>
        <button class="pill-tab" :class="{active:exTab==='rejected'}" @click="exTab='rejected'">
          المرفوضة ({{ exAll.filter(l=>l.review==='rejected').length }})
        </button>
      </div>

      <!-- Kanban (pending tab) -->
      <template v-if="exTab==='pending'">
        <div class="kb-board">
          <div v-for="col in exKanbanCols" :key="col.key" class="kb-col">
            <div class="kb-col-head">
              <span><i :style="`background:${col.color}`"></i>{{ col.title }}</span>
              <span class="n">{{ col.items.length }}</span>
            </div>
            <div class="kb-cards">
              <div v-if="!col.items.length" class="kb-empty">{{ col.empty }}</div>
              <div v-for="l in col.items" :key="l.id" class="kb-card" @click="openDetail(l.id)">
                <img v-if="(l.photos||[])[0]" :src="(l.photos||[])[0].data" class="kb-thumb" alt="">
                <div v-else class="kb-noimg">لا توجد صور بعد</div>
                <div class="kb-body">
                  <span class="ls-code">{{ l.code }}</span>
                  <div class="kb-title">{{ l.title||'—' }}</div>
                  <div class="kb-meta">
                    {{ lsOwnerName(l) ? 'المالك: '+lsOwnerName(l) : '' }}
                    <br>سجّلها {{ actorName(l.createdBy) }}
                  </div>
                  <div v-if="l.review==='needs_info'&&l.extNote" class="kb-note">المطلوب: {{ l.extNote }}</div>
                  <div v-if="l.review==='rejected'" class="kb-note danger">سبب الرفض: {{ l.extRejectReason||'—' }}</div>
                  <div class="kb-actions" @click.stop>
                    <button class="btn btn-success btn-sm" @click="exDecide(l.id,'accept')">قبول</button>
                    <button class="btn btn-ghost btn-sm"   @click="exDecide(l.id,'info')">استكمال</button>
                    <button class="btn btn-danger btn-sm"  @click="exDecide(l.id,'reject')">رفض</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Rejected tab -->
      <template v-else>
        <div class="kb-grid">
          <div v-if="!exAll.filter(l=>l.review==='rejected').length" class="card" style="grid-column:1/-1;">
            <div class="empty-state"><b>لا توجد وحدات مرفوضة</b></div>
          </div>
          <div v-for="l in exAll.filter(l=>l.review==='rejected')" :key="l.id" class="kb-card" @click="openDetail(l.id)">
            <img v-if="(l.photos||[])[0]" :src="(l.photos||[])[0].data" class="kb-thumb" alt="">
            <div v-else class="kb-noimg">لا توجد صور</div>
            <div class="kb-body">
              <span class="ls-code">{{ l.code }}</span>
              <div class="kb-title">{{ l.title||'—' }}</div>
              <div class="kb-note danger">سبب الرفض: {{ l.extRejectReason||'—' }}</div>
              <div class="kb-actions" @click.stop>
                <button class="btn btn-ghost btn-sm" @click="exReopen(l.id)">إعادة للمراجعة</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- ===== MODAL: CREATE ===== -->
    <div v-if="showNewModal" class="modal-overlay" @click.self="showNewModal=false">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ newKind==='external' ? 'تسجيل عقار خارج المكتب (لقطة)' : 'إضافة وحدة شاغرة' }}</h3>
          <button class="modal-close" @click="showNewModal=false">×</button>
        </div>
        <div class="field"><label>اسم الوحدة *</label><input v-model="newForm.title" :placeholder="newKind==='external'?'مثال: فيلا حي الملقا - زاوية':'مثال: شقة حي النرجس'"></div>
        <div class="row2">
          <div class="field"><label>نوع الوحدة *</label>
            <select v-model="newForm.unitType">
              <option value="">اختر النوع</option>
              <option v-for="(lbl,k) in LS_TYPES" :key="k" :value="k">{{ lbl }}</option>
            </select>
          </div>
          <div class="field"><label>للبيع أو الإيجار</label>
            <select v-model="newForm.dealType">
              <option value="">يُحدَّد لاحقًا</option>
              <option v-for="(lbl,k) in LS_DEALS" :key="k" :value="k">{{ lbl }}</option>
            </select>
          </div>
        </div>
        <template v-if="newKind==='external'">
          <div class="row2">
            <div class="field"><label>مصدر اللقطة</label><input v-model="newForm.srcName" placeholder="وسيط، مالك مباشر..."></div>
            <div class="field"><label>جوال المصدر</label><input v-model="newForm.srcPhone" placeholder="05xxxxxxxx"></div>
          </div>
        </template>
        <div class="field"><label>المسؤول</label>
          <select v-model="newForm.responsible">
            <option value="">أنا ({{ myActorKey }})</option>
            <option v-for="s in staffOptions" :key="s.key" :value="s.key">{{ s.name }} — {{ s.role }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showNewModal=false">إلغاء</button>
          <button class="btn btn-primary" @click="createListing">
            {{ newKind==='external' ? 'تسجيل العقار' : 'إضافة الوحدة' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL: EX DECISION ===== -->
    <div v-if="exDecisionModal" class="modal-overlay" @click.self="exDecisionModal=null">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ exDecisionModal.action==='accept'?'قبول الوحدة':exDecisionModal.action==='reject'?'رفض الوحدة':'طلب استكمال' }}</h3>
          <button class="modal-close" @click="exDecisionModal=null">×</button>
        </div>
        <p class="hint" v-if="getListing(exDecisionModal.id)">
          <b>{{ getListing(exDecisionModal.id)?.code }}</b> — {{ getListing(exDecisionModal.id)?.title }}
        </p>
        <div class="field">
          <label>{{ exDecisionModal.action==='reject'?'سبب الرفض *':exDecisionModal.action==='info'?'المطلوب استكماله *':'ملاحظة (اختياري)' }}</label>
          <textarea v-model="exDecisionModal.note"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="exDecisionModal=null">إلغاء</button>
          <button class="btn" :class="exDecisionModal.action==='accept'?'btn-success':exDecisionModal.action==='reject'?'btn-danger':'btn-dark'"
                  @click="confirmExDecision">
            {{ exDecisionModal.action==='accept'?'تأكيد القبول':exDecisionModal.action==='reject'?'تأكيد الرفض':'إرسال الطلب' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExtState, LS_DEFAULT_PLATFORMS, type Listing } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const { extState, load, save, uid, lsOffice, exAll, exPendingCount, lsNextCode, exNextCode, lsOwnerName, getListing } = useExtState()
const { fmtDate, fmtMoney, todayISO } = useFormat()
const { auth } = useApi()

const showToast = inject<(m:string)=>void>('showToast', m => console.log(m))
const supervisorSession = inject<any>('supervisorSession')

onMounted(async () => {
  load()
  try {
    const users = await auth.usersByType('supervisor')
    const cols  = await auth.usersByType('collector')
    staffOptions.value = [
      ...users.map(u => ({ key:`supervisor:${u.id}`, name:u.name, role:u.type_label||'مشرف' })),
      ...cols.map(u  => ({ key:`collector:${u.id}`,  name:u.name, role:'محصل' })),
    ]
  } catch {}
})

// ===== CONSTANTS =====
const LS_TYPES: Record<string,string> = { apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة', land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى' }
const LS_DEALS: Record<string,string> = { rent:'إيجار', sale:'بيع', both:'بيع أو إيجار' }
const LS_STATUSES = [
  {k:'name_only', l:'عندي الاسم فقط', tone:'muted'},
  {k:'basic_details', l:'تفاصيل أولية', tone:'muted'},
  {k:'photographed', l:'تم التصوير', tone:'warn'},
  {k:'waiting_video', l:'بانتظار الفيديو', tone:'warn'},
  {k:'website_only', l:'بالموقع الإلكتروني فقط', tone:'orange'},
  {k:'awaiting_owner_license', l:'بانتظار ترخيص المالك', tone:'warn'},
  {k:'license_issued', l:'تم إصدار الترخيص', tone:'orange'},
  {k:'publishing', l:'جاري تنزيل الإعلان', tone:'orange'},
  {k:'published', l:'تم تنزيل الإعلان', tone:'ok'},
  {k:'license_renewal', l:'ترخيص منتهي — مطلوب تجديد', tone:'danger'},
  {k:'license_expired', l:'ترخيص منتهي تماماً', tone:'danger'},
]
const lsStatusObj = (k:string) => LS_STATUSES.find(s=>s.k===k) || LS_STATUSES[0]

// ===== VIEW STATE =====
const lsView = ref<'office'|'external'>('office')
const officeTab = ref('active')
const exTab = ref('pending')
const lsSearch = ref('')
const lsStatusF = ref('')
const lsTypeF = ref('')

const myActorKey = computed(() => {
  const s = supervisorSession?.value
  return s ? `supervisor:${s.id}` : ''
})

const staffOptions = ref<{key:string;name:string;role:string}[]>([])

const activeOffice = computed(() => lsOffice.value.filter(l => l.vacant))
const myOpenCount = computed(() => lsOffice.value.filter(l => l.vacant && l.responsible === myActorKey.value && l.status !== 'published').length)
const alertCount  = computed(() => activeOffice.value.filter(l => lsLicenseState(l) === 'expired' || lsLicenseState(l) === 'soon').length)
const exAcceptedCount = computed(() => extState.value.listings.filter(l => l.extCode).length)

const officeTabs = computed((): [string,string,number][] => [
  ['active','الشاغرة',activeOffice.value.length],
  ['mine','مهامي',myOpenCount.value],
  ['closed','غير شاغرة',lsOffice.value.filter(l=>!l.vacant).length],
  ['all','الكل',lsOffice.value.length],
])

const filteredOffice = computed(() => {
  let list = lsOffice.value
  if (officeTab.value === 'active') list = list.filter(l => l.vacant)
  else if (officeTab.value === 'mine')   list = list.filter(l => l.vacant && l.responsible===myActorKey.value)
  else if (officeTab.value === 'closed') list = list.filter(l => !l.vacant)
  if (lsStatusF.value) list = list.filter(l => l.status===lsStatusF.value)
  if (lsTypeF.value)   list = list.filter(l => l.unitType===lsTypeF.value)
  const q = lsSearch.value.trim().toLowerCase()
  if (q) list = list.filter(l => [l.code,l.extCode,l.title,lsOwnerName(l),l.brokerageNo].join(' ').toLowerCase().includes(q))
  return [...list].sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''))
})

// ===== HELPERS =====
const actorName = (key: string) => {
  if (!key) return '—'
  const [,id] = key.split(':')
  return staffOptions.value.find(s => s.key===key)?.name || id
}
const lsPublished = (l: Listing) => (extState.value.listingPlatforms||[]).filter(p => (l.platforms||{})[p.id])
const lsLicenseState = (l: Listing) => {
  const exp = (l.license||{}).expiry
  if (!exp) return 'none'
  const d = Math.round((new Date(exp).getTime() - Date.now()) / 86400000)
  if (d < 0) return 'expired'
  if (d <= 30) return 'soon'
  return 'valid'
}
const lsLicenseBadgeHtml = (l: Listing) => {
  const s = lsLicenseState(l), exp = (l.license||{}).expiry
  if (s==='none') return '<span class="muted">—</span>'
  if (s==='expired') return `<span class="badge badge-rejected">منتهي ${fmtDate(exp||'')}</span>`
  if (s==='soon') return `<span class="badge badge-pending">ينتهي قريباً</span>`
  return `<span class="badge badge-approved">سارٍ حتى ${fmtDate(exp||'')}</span>`
}
const lsChecklistPct = (l: Listing) => {
  const items = [
    !!(l.ownerId || l.ownerName),
    !!(l.description || '').trim(),
    !!(Number(l.rentPrice)>0 || Number(l.salePrice)>0),
    (l.photos||[]).length > 0,
    !!(l.license?.number && l.license?.file),
    !!(l.guard?.name || l.guard?.phone),
    !!l.location,
  ]
  return Math.round(items.filter(Boolean).length / items.length * 100)
}
const exReady = (l: Listing) => !!(l.ownerId || l.ownerName) && (Number(l.rentPrice)>0 || Number(l.salePrice)>0) && (l.photos||[]).length>0

// ===== KANBAN COLS =====
const exKanbanCols = computed(() => {
  const pending = exAll.value.filter(l => l.review!=='rejected')
  const TONE_COLOR: Record<string,string> = { muted:'var(--muted)', ok:'var(--success)', orange:'var(--orange)' }
  return [
    { key:'incomplete', title:'بيانات ناقصة', color:TONE_COLOR.muted, empty:'لا توجد بطاقات', items: pending.filter(l=>l.review!=='needs_info'&&!exReady(l)) },
    { key:'ready',      title:'جاهزة لقرار الإدارة', color:TONE_COLOR.ok, empty:'تظهر هنا البطاقات المكتملة', items: pending.filter(l=>l.review!=='needs_info'&&exReady(l)) },
    { key:'needs_info', title:'مطلوب استكمال', color:TONE_COLOR.orange, empty:'تعود البطاقة بعد حفظ الاستكمال', items: pending.filter(l=>l.review==='needs_info') },
  ]
})

// ===== NAVIGATE TO DETAIL =====
const router = useRouter()
function openDetail(id: string) {
  router.push(`/supervisor/listingdetail?id=${id}`)
}

// ===== CREATE MODAL =====
const showNewModal = ref(false)
const newKind = ref<'office'|'external'>('office')
const newForm = ref({ title:'', unitType:'', dealType:'', responsible:'', srcName:'', srcPhone:'' })

function openNew(kind: 'office'|'external') {
  newKind.value = kind
  newForm.value = { title:'', unitType:'', dealType:'', responsible: myActorKey.value, srcName:'', srcPhone:'' }
  showNewModal.value = true
}
function createListing() {
  if (!newForm.value.title.trim()) { showToast('الرجاء إدخال اسم الوحدة'); return }
  if (!newForm.value.unitType)     { showToast('الرجاء اختيار نوع الوحدة'); return }
  const now = new Date().toISOString()
  const responsible = newForm.value.responsible || myActorKey.value
  const isExt = newKind.value === 'external'
  const code = isExt ? exNextCode() : lsNextCode()
  const rec: Listing = {
    id: uid(), code, kind: newKind.value, source: 'new', title: newForm.value.title.trim(),
    unitType: newForm.value.unitType, status: 'name_only', vacant: true,
    responsible, createdBy: responsible, createdAt: now, updatedAt: now, updatedBy: responsible,
    propertyId: null, unitNo: '', ownerMode: 'linked', ownerId: null, ownerName: '', ownerPhone: '',
    brokerageNo: '', brokerageDate: '', description: '', answers: {}, dealType: newForm.value.dealType,
    rentPrice: '', rentCycle: 'سنوي', salePrice: '', photos: [], videos: [], videoUrl: '',
    license: {}, guard: {}, location: null, platforms: {}, history: [],
    ...(isExt ? {
      review: 'pending',
      extSource: { name: newForm.value.srcName.trim(), phone: newForm.value.srcPhone.trim() },
    } : {}),
  }
  rec.history.push({ id: uid(), at: now, by: responsible, type: 'create', text: isExt ? 'سجّل عقارًا خارج المكتب' : 'أضاف وحدة شاغرة' })
  extState.value.listings.push(rec)
  save()
  showNewModal.value = false
  showToast(isExt ? `تم تسجيل ${code}` : `تمت إضافة الوحدة ${code}`)
  openDetail(rec.id)
}

// ===== EX DECISION =====
const exDecisionModal = ref<{ id:string; action:string; note:string }|null>(null)
function exDecide(id: string, action: string) {
  exDecisionModal.value = { id, action, note:'' }
}
function exReopen(id: string) {
  const l = getListing(id); if (!l) return
  l.review = 'pending'; l.extRejectReason = ''
  const now = new Date().toISOString()
  l.updatedAt = now
  l.history.push({ id:uid(), at:now, by:myActorKey.value, type:'review', action:'reopen' })
  save(); showToast('أُعيدت الوحدة إلى المراجعة')
}
function confirmExDecision() {
  const d = exDecisionModal.value; if (!d) return
  const l = getListing(d.id); if (!l) return
  const note = d.note.trim(), now = new Date().toISOString()
  if ((d.action==='reject'||d.action==='info') && !note) {
    showToast(d.action==='reject' ? 'الرجاء ذكر سبب الرفض' : 'الرجاء توضيح المطلوب')
    return
  }
  if (d.action === 'accept') {
    const oldCode = l.code
    l.extCode = oldCode; l.code = lsNextCode(); l.kind = 'office'; l.review = 'accepted'
    l.extDecidedAt = now; l.extDecidedBy = myActorKey.value; l.extNote = note
    l.history.push({ id:uid(), at:now, by:myActorKey.value, type:'review', action:'accept', from:oldCode, to:l.code, note })
    save(); exDecisionModal.value = null; showToast(`تم قبول الوحدة — أصبحت ${l.code} في المهام`)
    lsView.value = 'office'
  } else if (d.action === 'reject') {
    l.review = 'rejected'; l.extRejectReason = note; l.extDecidedAt = now; l.extDecidedBy = myActorKey.value
    l.history.push({ id:uid(), at:now, by:myActorKey.value, type:'review', action:'reject', note })
    save(); exDecisionModal.value = null; showToast('تم رفض الوحدة')
  } else {
    l.review = 'needs_info'; l.extNote = note; l.extDecidedAt = now; l.extDecidedBy = myActorKey.value
    l.history.push({ id:uid(), at:now, by:myActorKey.value, type:'review', action:'info', note })
    save(); exDecisionModal.value = null; showToast('تم إرسال طلب الاستكمال')
  }
}

// ===== EXPORT EXCEL =====
function exportExcel() {
  const rows = filteredOffice.value.map(l => ({
    'الكود': l.code, 'الوحدة': l.title, 'النوع': LS_TYPES[l.unitType]||'', 'المالك': lsOwnerName(l),
    'نوع العرض': LS_DEALS[l.dealType]||'', 'سعر الإيجار': Number(l.rentPrice)||'', 'سعر البيع': Number(l.salePrice)||'',
    'الحالة': lsStatusObj(l.status).l, 'الاكتمال %': lsChecklistPct(l),
    'المسؤول': actorName(l.responsible), 'آخر تحديث': (l.updatedAt||'').slice(0,10),
  }))
  if (typeof XLSX !== 'undefined') {
    const wb = (XLSX as any).utils.book_new()
    const ws = (XLSX as any).utils.json_to_sheet(rows.length ? rows : [{ 'الكود': 'لا توجد وحدات' }])
    ;(XLSX as any).utils.book_append_sheet(wb, ws, 'العقارات الشاغرة')
    ;(XLSX as any).writeFile(wb, `مهام_العقارات_الشاغرة_${todayISO()}.xlsx`)
  } else {
    showToast('مكتبة XLSX غير محملة')
  }
}
</script>
