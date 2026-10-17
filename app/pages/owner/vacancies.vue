<template>
  <div>
    <div class="page-title">
      <div>
        <h2>الشقق الشاغرة</h2>
        <p>الشقق المعروضة للتأجير في عقاراتك — للعرض فقط</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-4" style="margin-bottom:16px;">
      <div class="card stat-card">
        <div class="lbl">شاغرة</div>
        <div class="val">{{ myVacant.length }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--warning);">
        <div class="lbl">تم العربون</div>
        <div class="val">{{ myDeposit.length }}</div>
        <div class="sub">{{ fmtMoney(sumField(myDeposit,'depositAmount')) }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--success);">
        <div class="lbl">تم التأجير (هذا الشهر)</div>
        <div class="val">{{ myRentedThisMonth.length }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--success);">
        <div class="lbl">إجمالي المؤجرة</div>
        <div class="val">{{ myRented.length }}</div>
        <div class="sub">{{ fmtMoney(sumField(myRented,'rentPrice')) }}</div>
      </div>
    </div>

    <!-- No properties notice -->
    <div v-if="!myPropertyIds.length" class="card" style="margin-bottom:16px;">
      <div class="empty-state">
        <b>لا توجد عقارات مسجلة باسمك</b>
        ستظهر هنا الشقق الشاغرة المرتبطة بعقاراتك بعد إضافتها من قِبَل المشرف
      </div>
    </div>

    <template v-else>
      <!-- Collector performance for my properties -->
      <div v-if="board.length" class="card" style="margin-bottom:16px;">
        <h3>إنجاز المحصلين في تأجير وحداتك</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>المحصل</th><th>أُجّر هذا الشهر</th><th>إجمالي ما أجّره</th></tr>
            </thead>
            <tbody>
              <tr v-for="x in board" :key="x.collectorId">
                <td><b>{{ x.name }}</b></td>
                <td>{{ x.thisMonth }}</td>
                <td>{{ x.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabs -->
      <div class="pill-tabs" style="flex-wrap:wrap;">
        <button v-for="[k,lbl] in tabs" :key="k"
                class="pill-tab" :class="{ active: activeTab===k }" @click="activeTab=k">
          {{ lbl }} ({{ countTab(k) }})
        </button>
      </div>

      <!-- Cards grid -->
      <div class="grid grid-3">
        <template v-if="filteredList.length">
          <div v-for="v in filteredList" :key="v.id" class="card"
               :style="`border-right:4px solid ${v.status==='rented'?'var(--success)':v.status==='deposit'?'var(--warning)':'var(--orange)'}`">

            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
              <div>
                <h3 style="margin:0 0 3px;">{{ vacPropName(v) }} — وحدة {{ v.unit }}</h3>
                <div v-if="v.location" class="muted" style="font-size:12px;">{{ v.location }}</div>
              </div>
              <span class="badge" :class="statusBadgeClass(v.status)">{{ VAC_STATUS[v.status] }}</span>
            </div>

            <div class="kv"><span class="k">السعر</span>
              <span class="v">{{ fmtMoney(v.price) }}
                <span class="muted" style="font-size:11.5px;"> / {{ v.priceCycle }}</span>
              </span>
            </div>
            <div class="kv"><span class="k">عدد الغرف</span><span class="v">{{ v.rooms||'—' }}</span></div>
            <div v-if="v.notes" class="note-item" style="margin-top:8px;">{{ v.notes }}</div>

            <!-- Deposit details -->
            <template v-if="v.status==='deposit'">
              <div class="kv"><span class="k">العربون</span><span class="v">{{ fmtMoney(v.depositAmount) }}</span></div>
              <div class="kv"><span class="k">المحصل</span><span class="v">{{ collectorLabel(v.depositBy) }}</span></div>
              <div class="kv"><span class="k">التاريخ</span><span class="v">{{ fmtDate(v.depositDate) }}</span></div>
            </template>

            <!-- Rented details -->
            <template v-if="v.status==='rented'">
              <div class="kv"><span class="k">المستأجر</span>
                <span class="v">{{ v.tenantName||'—' }}
                  <span v-if="v.tenantPhone" class="muted" style="font-size:11.5px;"> · {{ v.tenantPhone }}</span>
                </span>
              </div>
              <div class="kv"><span class="k">سعر التأجير</span><span class="v">{{ fmtMoney(v.rentPrice||v.price) }}</span></div>
              <div class="kv"><span class="k">المحصل</span><span class="v">{{ collectorLabel(v.rentedBy) }}</span></div>
              <div class="kv"><span class="k">تاريخ التأجير</span><span class="v">{{ fmtDate(v.rentedDate) }}</span></div>
            </template>

            <!-- History (last entry) -->
            <div v-if="(v.history||[]).length" class="muted" style="font-size:11px;margin-top:8px;">
              آخر تحديث: {{ fmtDate((v.history[v.history.length-1].at||'').slice(0,10)) }}
            </div>
          </div>
        </template>
        <div v-else class="card" style="grid-column:1/-1;">
          <div class="empty-state">
            <b>لا توجد شقق في هذا التصنيف</b>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useExtState, type Vacancy } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'

const { extState, load, vacanciesSorted, vacPropName } = useExtState()
const { fmtDate, fmtMoney, monthKey } = useFormat()

const ownerSession = inject<any>('ownerSession')
const myOwnerId = computed(() => ownerSession?.value?.id || '')

onMounted(() => load())

// ===== CONSTANTS =====
const VAC_STATUS: Record<string,string> = { vacant:'شاغرة', deposit:'تم العربون', rented:'تم التأجير' }
const tabs: [string,string][] = [
  ['all',     'الكل'],
  ['vacant',  'شاغرة'],
  ['deposit', 'تم العربون'],
  ['rented',  'تم التأجير'],
]

// ===== COMPUTED =====
// All properties belonging to this owner
const myPropertyIds = computed(() =>
  extState.value.properties.filter(p => String(p.ownerId) === String(myOwnerId.value)).map(p => p.id)
)

// All vacancies linked to my properties (by propertyId) OR tenants linked to me
const myVacancies = computed(() =>
  vacanciesSorted.value.filter(v => {
    if (v.propertyId && myPropertyIds.value.includes(v.propertyId)) return true
    // Also check if it's linked to any tenant that belongs to this owner
    const tenants = extState.value.vacancies // already filtered above from vacanciesSorted
    return false
  })
)

// Simpler: filter vacancies where propertyId matches owner's properties
const ownerVacancies = computed(() => {
  const ids = new Set(myPropertyIds.value)
  return vacanciesSorted.value.filter(v => v.propertyId && ids.has(v.propertyId))
})

const mk             = monthKey()
const myVacant        = computed(() => ownerVacancies.value.filter(v => v.status==='vacant'))
const myDeposit       = computed(() => ownerVacancies.value.filter(v => v.status==='deposit'))
const myRented        = computed(() => ownerVacancies.value.filter(v => v.status==='rented'))
const myRentedThisMonth = computed(() => myRented.value.filter(v => (v.rentedDate||'').slice(0,7)===mk))

const activeTab = ref('all')
const countTab = (k: string) => {
  if (k==='all')     return ownerVacancies.value.length
  return ownerVacancies.value.filter(v => v.status===k).length
}
const filteredList = computed(() => {
  if (activeTab.value==='all') return ownerVacancies.value
  return ownerVacancies.value.filter(v => v.status===activeTab.value)
})

// ===== HELPERS =====
const statusBadgeClass = (s: string) => s==='rented'?'badge-approved':s==='deposit'?'badge-pending':'badge-neutral'
const sumField = (arr: Vacancy[], f: keyof Vacancy) => arr.reduce((s, v) => s + Number(v[f]||0), 0)

// Collector label — use property collectors
const collectorLabel = (id: string|null) => {
  if (!id) return '—'
  // Try to find name from smsLog or state
  return `محصل (${id})`
}

// Board: collector performance
const board = computed(() => {
  const map: Record<string,{collectorId:string;name:string;thisMonth:number;total:number}> = {}
  myRented.value.forEach(v => {
    const k = String(v.rentedBy||'—')
    if (!map[k]) map[k] = { collectorId:k, name:collectorLabel(v.rentedBy), thisMonth:0, total:0 }
    map[k].total++
    if ((v.rentedDate||'').slice(0,7)===mk) map[k].thisMonth++
  })
  return Object.values(map).filter(x=>x.total>0).sort((a,b)=>b.total-a.total)
})
</script>
