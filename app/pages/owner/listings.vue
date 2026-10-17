<template>
  <div>
    <div class="page-title">
      <div>
        <h2>مهام العقارات الشاغرة</h2>
        <p>الوحدات الشاغرة المرتبطة بعقاراتك — للعرض فقط</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-4" style="margin-bottom:16px;">
      <div class="card stat-card">
        <div class="lbl">وحدات شاغرة</div>
        <div class="val">{{ myActive.length }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--success);">
        <div class="lbl">تم تنزيل الإعلان</div>
        <div class="val">{{ myActive.filter(l=>l.status==='published').length }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--danger);">
        <div class="lbl">تنبيهات الترخيص</div>
        <div class="val">{{ alertCount }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--muted);">
        <div class="lbl">غير شاغرة (مُغلقة)</div>
        <div class="val">{{ myListings.filter(l=>!l.vacant).length }}</div>
      </div>
    </div>

    <!-- No properties notice -->
    <div v-if="!myPropertyIds.length && !myListings.length" class="card">
      <div class="empty-state">
        <b>لا توجد وحدات مرتبطة بعقاراتك بعد</b>
        ستظهر هنا الوحدات التي يُضيفها المشرف تحت عقاراتك
      </div>
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="pill-tabs" style="flex-wrap:wrap;">
        <button v-for="[k,lbl,c] in tabList" :key="k"
                class="pill-tab" :class="{ active: activeTab===k }" @click="activeTab=k">
          {{ lbl }} ({{ c }})
        </button>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <input v-model="searchQ" placeholder="ابحث بالكود، اسم الوحدة، الحالة...">
        <select v-model="typeF">
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
                  <td><span class="ls-code">{{ l.code }}</span>
                    <div v-if="l.extCode" class="muted" style="font-size:10.5px;margin-top:2px;">لقطة {{ l.extCode }}</div>
                  </td>
                  <td>
                    <b>{{ l.title||'—' }}</b>
                    <div v-if="l.unitNo" class="muted" style="font-size:11.5px;">وحدة {{ l.unitNo }}</div>
                  </td>
                  <td>{{ LS_TYPES[l.unitType]||'—' }}</td>
                  <td>
                    <span v-if="l.dealType" class="badge badge-neutral" style="margin-bottom:3px;display:block;width:fit-content;">
                      {{ LS_DEALS[l.dealType]||l.dealType }}
                    </span>
                    <div v-if="Number(l.rentPrice)>0" style="font-size:12px;font-weight:700;">
                      إيجار {{ fmtMoney(l.rentPrice) }}
                    </div>
                    <div v-if="Number(l.salePrice)>0" style="font-size:12px;font-weight:700;">
                      بيع {{ fmtMoney(l.salePrice) }}
                    </div>
                  </td>
                  <td>
                    <span v-if="!l.vacant" class="ls-badge ls-tone-muted">
                      غير شاغرة{{ l.closeReason?' — '+l.closeReason:'' }}
                    </span>
                    <span v-else class="ls-badge" :class="`ls-tone-${lsStatusObj(l.status).tone}`">
                      {{ lsStatusObj(l.status).l }}
                    </span>
                  </td>
                  <td>
                    <div class="ls-mini-progress"><div :style="`width:${checklistPct(l)}%`"></div></div>
                    <div class="muted" style="font-size:11px;margin-top:3px;">{{ checklistPct(l) }}%</div>
                  </td>
                  <td>
                    <div class="ls-chips">
                      <span v-for="p in publishedPlatforms(l)" :key="p.id" class="ls-chip">{{ p.name }}</span>
                      <span v-if="!publishedPlatforms(l).length" class="muted">—</span>
                    </div>
                  </td>
                  <td><span v-html="licenseBadge(l)"></span></td>
                  <td class="muted" style="font-size:12px;">{{ l.responsible ? l.responsible.split(':')[1]||'—' : '—' }}</td>
                  <td style="white-space:nowrap;font-size:11.5px;" class="muted">
                    {{ fmtDate((l.updatedAt||'').slice(0,10)) }}
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="10">
                  <div class="empty-state">
                    <b>{{ searchQ||typeF ? 'لا توجد نتائج مطابقة' : 'لا توجد وحدات في هذا التصنيف' }}</b>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
              <span v-if="(l.license||{}).expiry"> — {{ fmtDate((l.license?.expiry)||'') }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useExtState, type Listing } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'

const { extState, load, lsOffice } = useExtState()
const { fmtDate, fmtMoney } = useFormat()

const ownerSession = inject<any>('ownerSession')
const myOwnerId = computed(() => ownerSession?.value?.id || '')

onMounted(() => load())

// ===== CONSTANTS =====
const LS_TYPES: Record<string,string> = {
  apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة',
  land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى',
}
const LS_DEALS: Record<string,string> = { rent:'إيجار', sale:'بيع', both:'بيع أو إيجار' }
const LS_STATUSES = [
  { k:'name_only',              l:'عندي الاسم فقط',              tone:'muted'  },
  { k:'basic_details',          l:'موجود التفاصيل الأولية فقط',  tone:'muted'  },
  { k:'photographed',           l:'تم تصوير الوحدة',             tone:'warn'   },
  { k:'waiting_video',          l:'بانتظار الفيديو',             tone:'warn'   },
  { k:'website_only',           l:'بالموقع الإلكتروني فقط',     tone:'orange' },
  { k:'awaiting_owner_license', l:'بانتظار ترخيص المالك',        tone:'warn'   },
  { k:'license_issued',         l:'تم إصدار الترخيص',           tone:'orange' },
  { k:'publishing',             l:'جاري تنزيل الإعلان',         tone:'orange' },
  { k:'published',              l:'تم تنزيل الإعلان',           tone:'ok'     },
  { k:'license_renewal',        l:'ترخيص منتهي — مطلوب تجديد', tone:'danger' },
  { k:'license_expired',        l:'ترخيص منتهي تماماً',         tone:'danger' },
]
const lsStatusObj = (k: string) => LS_STATUSES.find(s=>s.k===k) || LS_STATUSES[0]

// ===== COMPUTED: my properties =====
const myPropertyIds = computed(() =>
  extState.value.properties.filter(p => String(p.ownerId) === String(myOwnerId.value)).map(p => p.id)
)

// Listings linked to this owner: by ownerId or by propertyId
const myListings = computed(() => {
  const propIds = new Set(myPropertyIds.value)
  return lsOffice.value.filter(l =>
    (l.ownerId && String(l.ownerId) === String(myOwnerId.value)) ||
    (l.propertyId && propIds.has(l.propertyId))
  ).sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||''))
})

const myActive   = computed(() => myListings.value.filter(l => l.vacant))
const alertCount = computed(() => myActive.value.filter(l => ['expired','soon'].includes(licenseState(l))).length)

// ===== TABS =====
const activeTab = ref('active')
const searchQ   = ref('')
const typeF     = ref('')

const tabList = computed((): [string,string,number][] => [
  ['active', 'الشاغرة',       myActive.value.length],
  ['closed', 'غير شاغرة',     myListings.value.filter(l=>!l.vacant).length],
  ['all',    'الكل',           myListings.value.length],
])

const filteredList = computed(() => {
  let list = myListings.value
  if (activeTab.value==='active') list = list.filter(l => l.vacant)
  else if (activeTab.value==='closed') list = list.filter(l => !l.vacant)
  if (typeF.value) list = list.filter(l => l.unitType===typeF.value)
  const q = searchQ.value.trim().toLowerCase()
  if (q) list = list.filter(l => [l.code, l.title, l.unitNo].join(' ').toLowerCase().includes(q))
  return list
})

// ===== HELPERS =====
const publishedPlatforms = (l: Listing) =>
  (extState.value.listingPlatforms||[]).filter(p => (l.platforms||{})[p.id])

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

const licenseAlerts = computed(() =>
  myActive.value.filter(l => ['expired','soon'].includes(licenseState(l)))
)
</script>
