<template>
  <div>
    <div class="page-title">
      <div>
        <h2>مهام العقارات الشاغرة</h2>
        <p>الوحدات الشاغرة المرتبطة بعقاراتك — للعرض فقط</p>
      </div>
      <button v-if="usingFallback" class="btn btn-ghost btn-sm" style="color:var(--warning);" disabled>⚠ وضع محلي</button>
    </div>

    <div v-if="loading" class="card" style="text-align:center;padding:40px;">
      <div class="spinner" style="margin:0 auto 12px;"></div>
      <div class="muted">جارٍ تحميل البيانات...</div>
    </div>

    <template v-else>
      <!-- Stats -->
      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="card stat-card">
          <div class="lbl">وحدات شاغرة</div>
          <div class="val">{{ listStats.active_count }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--success);">
          <div class="lbl">تم تنزيل الإعلان</div>
          <div class="val">{{ listStats.published_count }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--danger);">
          <div class="lbl">تنبيهات الترخيص</div>
          <div class="val">{{ listStats.license_alerts_count }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--muted);">
          <div class="lbl">غير شاغرة</div>
          <div class="val">{{ listStats.closed_count }}</div>
        </div>
      </div>

      <div v-if="!listings.length" class="card">
        <div class="empty-state">
          <b>لا توجد وحدات مرتبطة بعقاراتك بعد</b>
          ستظهر هنا الوحدات التي يضيفها المشرف تحت عقاراتك
        </div>
      </div>

      <template v-else>
        <!-- Tabs -->
        <div class="pill-tabs" style="flex-wrap:wrap;">
          <button v-for="[k,lbl,c] in tabList" :key="k"
                  class="pill-tab" :class="{ active: activeTab===k }" @click="setTab(k)">
            {{ lbl }} ({{ c }})
          </button>
        </div>

        <!-- Search -->
        <div class="search-bar">
          <input v-model="searchQ" placeholder="ابحث بالكود، اسم الوحدة..." @input="onSearch">
          <select v-model="typeF" @change="onSearch">
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
                  <th>الكود</th><th>الوحدة</th><th>النوع</th>
                  <th>العرض والسعر</th><th>الحالة</th>
                  <th>الاكتمال</th><th>المنصات</th><th>الترخيص</th>
                  <th>المسؤول</th><th>آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="filteredList.length">
                  <tr v-for="l in filteredList" :key="l.id">
                    <td>
                      <span class="ls-code">{{ l.code }}</span>
                      <div v-if="l.ext_code||l.extCode" class="muted" style="font-size:10.5px;margin-top:2px;">لقطة {{ l.ext_code||l.extCode }}</div>
                    </td>
                    <td>
                      <b>{{ l.title||'—' }}</b>
                      <div v-if="l.unit_no||l.unitNo" class="muted" style="font-size:11.5px;">وحدة {{ l.unit_no||l.unitNo }}</div>
                    </td>
                    <td>{{ LS_TYPES[l.unit_type||l.unitType]||'—' }}</td>
                    <td>
                      <span v-if="l.deal_type||l.dealType" class="badge badge-neutral" style="display:block;width:fit-content;margin-bottom:3px;">
                        {{ LS_DEALS[l.deal_type||l.dealType]||'' }}
                      </span>
                      <div v-if="Number(l.rent_price||l.rentPrice)>0" style="font-size:12px;font-weight:700;">
                        إيجار {{ fmtMoney(l.rent_price||l.rentPrice) }}
                      </div>
                      <div v-if="Number(l.sale_price||l.salePrice)>0" style="font-size:12px;font-weight:700;">
                        بيع {{ fmtMoney(l.sale_price||l.salePrice) }}
                      </div>
                    </td>
                    <td>
                      <span v-if="!(l.vacant??true)" class="ls-badge ls-tone-muted">
                        غير شاغرة{{ (l.close_reason||l.closeReason)?' — '+(l.close_reason||l.closeReason):'' }}
                      </span>
                      <span v-else class="ls-badge" :class="`ls-tone-${lsStatusObj(l.status).tone}`">
                        {{ lsStatusObj(l.status).l }}
                      </span>
                    </td>
                    <td>
                      <div class="ls-mini-progress"><div :style="`width:${l.checklist_pct??checklistPct(l)}%`"></div></div>
                      <div class="muted" style="font-size:11px;margin-top:3px;">{{ l.checklist_pct??checklistPct(l) }}%</div>
                    </td>
                    <td>
                      <div class="ls-chips">
                        <span v-for="name in (l.published_platforms||[])" :key="name" class="ls-chip">{{ name }}</span>
                        <span v-if="!(l.published_platforms||[]).length" class="muted">—</span>
                      </div>
                    </td>
                    <td><span v-html="licenseBadge(l)"></span></td>
                    <td class="muted" style="font-size:12px;">
                      {{ l.responsible_name || (l.responsible||'').split(':')[1] || '—' }}
                    </td>
                    <td style="white-space:nowrap;font-size:11.5px;" class="muted">
                      {{ fmtDate((l.updated_at||l.updatedAt||'').slice(0,10)) }}
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="10">
                    <div class="empty-state"><b>{{ searchQ||typeF ? 'لا توجد نتائج مطابقة' : 'لا توجد وحدات في هذا التصنيف' }}</b></div>
                  </td>
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

        <!-- License alerts -->
        <div v-if="licenseAlerts.length" class="card" style="margin-top:16px;border:1.5px solid var(--danger);">
          <h3>تنبيهات الترخيص الإعلاني</h3>
          <div v-for="l in licenseAlerts" :key="l.id" class="alert-row" :class="licenseState(l)==='expired'?'due':'soon'">
            <div class="dot"></div>
            <div>
              <b>{{ l.code }} — {{ l.title }}</b>
              <div class="muted" style="font-size:12px;">
                {{ licenseState(l)==='expired' ? 'الترخيص منتهي' : 'الترخيص ينتهي قريباً' }}
                <span v-if="l.license_expiry"> — {{ fmtDate(l.license_expiry) }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useListingsApi } from '~/composables/useApi'
import { useExtState } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'

const listApi     = useListingsApi()
const { extState, load: loadLocal, lsOffice } = useExtState()
const { fmtDate, fmtMoney } = useFormat()

const ownerSession = inject<any>('ownerSession')
const myOwnerId    = computed(() => ownerSession?.value?.id || '')

// ── state ──
const loading       = ref(true)
const usingFallback = ref(false)
const listings      = ref<any[]>([])
const listStats     = ref({ active_count:0, published_count:0, license_alerts_count:0, closed_count:0, external_pending_count:0 })
const pagination    = ref<any>(null)
const currentPage   = ref(1)
const activeTab     = ref('active')
const searchQ       = ref('')
const typeF         = ref('')

// ── constants ──
const LS_TYPES: Record<string,string> = { apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة', land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى' }
const LS_DEALS: Record<string,string> = { rent:'إيجار', sale:'بيع', both:'بيع أو إيجار' }
const LS_STATUSES = [
  {k:'name_only',l:'عندي الاسم فقط',tone:'muted'},{k:'basic_details',l:'تفاصيل أولية',tone:'muted'},
  {k:'photographed',l:'تم التصوير',tone:'warn'},{k:'waiting_video',l:'بانتظار الفيديو',tone:'warn'},
  {k:'website_only',l:'بالموقع فقط',tone:'orange'},{k:'awaiting_owner_license',l:'بانتظار الترخيص',tone:'warn'},
  {k:'license_issued',l:'تم الترخيص',tone:'orange'},{k:'publishing',l:'جاري التنزيل',tone:'orange'},
  {k:'published',l:'تم تنزيل الإعلان',tone:'ok'},
  {k:'license_renewal',l:'ترخيص منتهي — تجديد',tone:'danger'},{k:'license_expired',l:'ترخيص منتهي تماماً',tone:'danger'},
]
const lsStatusObj = (k: string) => LS_STATUSES.find(s=>s.k===k)||LS_STATUSES[0]

// ── helpers ──
const licenseState = (l: any) => {
  const exp = l.license_expiry || (l.license||{}).expiry
  if (!exp) return 'none'
  const d = Math.round((new Date(exp).getTime()-Date.now())/86400000)
  if (d<0) return 'expired'; if (d<=30) return 'soon'; return 'valid'
}
const licenseBadge = (l: any) => {
  const s = licenseState(l), exp = l.license_expiry||(l.license||{}).expiry
  if (s==='none')    return '<span class="muted">—</span>'
  if (s==='expired') return `<span class="badge badge-rejected">منتهي ${fmtDate(exp||'')}</span>`
  if (s==='soon')    return `<span class="badge badge-pending">ينتهي قريباً</span>`
  return `<span class="badge badge-approved">سارٍ حتى ${fmtDate(exp||'')}</span>`
}
const checklistPct = (l: any) => {
  if (l.checklist_pct != null) return l.checklist_pct
  const items = [!!(l.owner_id||l.ownerId||l.owner_name||l.ownerName), !!(l.description||'').trim(), !!(Number(l.rent_price||l.rentPrice)>0||Number(l.sale_price||l.salePrice)>0), (l.photos_count||0)>0]
  return Math.round(items.filter(Boolean).length/items.length*100)
}

// ── COMPUTED ──
const tabList = computed((): [string,string,number][] => [
  ['active', 'الشاغرة',   listings.value.filter(l=>(l.vacant??true)).length],
  ['closed', 'غير شاغرة', listings.value.filter(l=>!(l.vacant??true)).length],
  ['all',    'الكل',      listings.value.length],
])

const filteredList = computed(() => {
  let list = listings.value
  if (activeTab.value==='active') list = list.filter(l=>(l.vacant??true))
  else if (activeTab.value==='closed') list = list.filter(l=>!(l.vacant??true))
  if (typeF.value)  list = list.filter(l=>(l.unit_type||l.unitType)===typeF.value)
  const q = searchQ.value.trim().toLowerCase()
  if (q) list = list.filter(l=>[l.code,l.title,l.unit_no||l.unitNo||''].join(' ').toLowerCase().includes(q))
  return list
})

const licenseAlerts = computed(() =>
  listings.value.filter(l=>(l.vacant??true) && ['expired','soon'].includes(licenseState(l)))
)

// ── FETCH (API → fallback) ──
async function fetchData() {
  loading.value = true
  try {
    const res = await listApi.owner.list({ tab: activeTab.value, search: searchQ.value||undefined, unit_type: typeF.value||undefined, page: currentPage.value })
    listings.value = res.listings || []
    if (res.statistics) listStats.value = res.statistics
    pagination.value = res.pagination || null
    usingFallback.value = false
  } catch {
    loadLocal(); usingFallback.value = true
    // fallback: filter by ownerId or owner's propertyIds
    const ownerPropIds = new Set(extState.value.properties.filter(p=>String(p.ownerId)===String(myOwnerId.value)).map(p=>p.id))
    listings.value = lsOffice.value.filter(l =>
      (l.ownerId && String(l.ownerId)===String(myOwnerId.value)) ||
      (l.propertyId && ownerPropIds.has(l.propertyId))
    ).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''))
    const active = listings.value.filter(l=>l.vacant)
    listStats.value = {
      active_count:  active.length,
      published_count: active.filter(l=>l.status==='published').length,
      license_alerts_count: active.filter(l=>['expired','soon'].includes(licenseState(l))).length,
      closed_count:  listings.value.filter(l=>!l.vacant).length,
      external_pending_count: 0,
    }
  } finally { loading.value = false }
}

let searchTimer: ReturnType<typeof setTimeout>|null = null
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value=1; fetchData() }, 380)
}
function setTab(k: string) { activeTab.value=k; currentPage.value=1; fetchData() }
function changePage(p: number) { currentPage.value=p; fetchData() }

onMounted(fetchData)
</script>
