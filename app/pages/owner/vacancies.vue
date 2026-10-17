<template>
  <div>
    <div class="page-title">
      <div>
        <h2>الشقق الشاغرة</h2>
        <p>الشقق المعروضة للتأجير في عقاراتك — للعرض فقط</p>
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
          <div class="lbl">شاغرة</div>
          <div class="val">{{ stats.vacant_count }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--warning);">
          <div class="lbl">تم العربون</div>
          <div class="val">{{ stats.deposit_count }}</div>
          <div class="sub">{{ fmtMoney(depositTotal) }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--success);">
          <div class="lbl">تم التأجير (هذا الشهر)</div>
          <div class="val">{{ rentedThisMonth }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--success);">
          <div class="lbl">إجمالي المؤجرة</div>
          <div class="val">{{ stats.rented_count }}</div>
          <div class="sub">{{ fmtMoney(rentedTotal) }}</div>
        </div>
      </div>

      <!-- Collector board -->
      <div v-if="collectorBoard.length" class="card" style="margin-bottom:16px;">
        <h3>إنجاز المحصلين في تأجير وحداتك</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>المحصل</th><th>أُجّر هذا الشهر</th><th>إجمالي ما أجّره</th></tr></thead>
            <tbody>
              <tr v-for="x in collectorBoard" :key="x.name">
                <td><b>{{ x.name }}</b></td><td>{{ x.thisMonth }}</td><td>{{ x.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabs -->
      <div class="pill-tabs" style="flex-wrap:wrap;">
        <button v-for="[k,lbl] in tabs" :key="k"
                class="pill-tab" :class="{ active: activeTab===k }" @click="activeTab=k">
          {{ lbl }} ({{ tabCount(k) }})
        </button>
      </div>

      <!-- Cards -->
      <div v-if="!vacancies.length" class="card">
        <div class="empty-state">
          <b>لا توجد شقق شاغرة مرتبطة بعقاراتك</b>
          ستظهر هنا الشقق التي يضيفها المشرف لعقاراتك
        </div>
      </div>
      <div v-else class="grid grid-3">
        <template v-if="filteredList.length">
          <div v-for="v in filteredList" :key="v.id" class="card"
               :style="`border-right:4px solid ${v.status==='rented'?'var(--success)':v.status==='deposit'?'var(--warning)':'var(--orange)'}`">

            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
              <div>
                <h3 style="margin:0 0 3px;">{{ propName(v) }} — وحدة {{ v.unit }}</h3>
                <div v-if="v.location" class="muted" style="font-size:12px;">{{ v.location }}</div>
              </div>
              <span class="badge" :class="statusBadge(v.status)">{{ VAC_STATUS[v.status] }}</span>
            </div>

            <div class="kv"><span class="k">السعر</span>
              <span class="v">{{ fmtMoney(v.price) }}
                <span class="muted" style="font-size:11.5px;"> / {{ v.price_cycle||v.priceCycle||'سنوي' }}</span>
              </span>
            </div>
            <div class="kv"><span class="k">عدد الغرف</span><span class="v">{{ v.rooms||'—' }}</span></div>
            <div v-if="v.notes" class="note-item" style="margin-top:8px;">{{ v.notes }}</div>

            <template v-if="v.status==='deposit'">
              <div class="kv"><span class="k">العربون</span><span class="v">{{ fmtMoney(v.deposit_amount||v.depositAmount) }}</span></div>
              <div class="kv"><span class="k">المحصل</span><span class="v">{{ v.deposit_by_name||collectorLabel(v.deposit_by||v.depositBy) }}</span></div>
              <div class="kv"><span class="k">التاريخ</span><span class="v">{{ fmtDate(v.deposit_date||v.depositDate) }}</span></div>
            </template>

            <template v-if="v.status==='rented'">
              <div class="kv"><span class="k">المستأجر</span>
                <span class="v">{{ v.tenant_name||v.tenantName||'—' }}
                  <span v-if="v.tenant_phone||v.tenantPhone" class="muted" style="font-size:11.5px;"> · {{ v.tenant_phone||v.tenantPhone }}</span>
                </span>
              </div>
              <div class="kv"><span class="k">سعر التأجير</span><span class="v">{{ fmtMoney(v.rent_price||v.rentPrice||v.price) }}</span></div>
              <div class="kv"><span class="k">المحصل</span><span class="v">{{ v.rented_by_name||collectorLabel(v.rented_by||v.rentedBy) }}</span></div>
              <div class="kv"><span class="k">تاريخ التأجير</span><span class="v">{{ fmtDate(v.rented_date||v.rentedDate) }}</span></div>
            </template>

            <div v-if="(v.history||[]).length" class="muted" style="font-size:11px;margin-top:8px;">
              آخر تحديث: {{ fmtDate(((v.updated_at||v.updatedAt||'')).slice(0,10)) }}
            </div>
          </div>
        </template>
        <div v-else class="card" style="grid-column:1/-1;">
          <div class="empty-state"><b>لا توجد شقق في هذا التصنيف</b></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useVacanciesApi } from '~/composables/useApi'
import { useExtState } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'

const vacApi      = useVacanciesApi()
const { extState, load: loadLocal, vacPropName } = useExtState()
const { fmtDate, fmtMoney, monthKey } = useFormat()

const ownerSession  = inject<any>('ownerSession')
const myOwnerId     = computed(() => ownerSession?.value?.id || '')

// ── state ──
const loading       = ref(true)
const usingFallback = ref(false)
const vacancies     = ref<any[]>([])
const stats         = ref({ vacant_count:0, deposit_count:0, rented_count:0, rented_this_month:0 })
const activeTab     = ref('all')

const mk = monthKey()

// ── constants ──
const VAC_STATUS: Record<string,string> = { vacant:'شاغرة', deposit:'تم العربون', rented:'تم التأجير' }
const tabs: [string,string][] = [['all','الكل'],['vacant','شاغرة'],['deposit','تم العربون'],['rented','تم التأجير']]

// ── helpers ──
const propName    = (v: any) => v.property_name || v.propertyName || vacPropName(v) || '—'
const statusBadge = (s: string) => s==='rented'?'badge-approved':s==='deposit'?'badge-pending':'badge-neutral'
const collectorLabel = (id: any) => id ? `محصل (${id})` : '—'

const depositTotal   = computed(() => vacancies.value.filter(v=>v.status==='deposit').reduce((s,v)=>s+Number(v.deposit_amount||v.depositAmount||0),0))
const rentedTotal    = computed(() => vacancies.value.filter(v=>v.status==='rented').reduce((s,v)=>s+Number(v.rent_price||v.rentPrice||v.price||0),0))
const rentedThisMonth= computed(() => vacancies.value.filter(v=>v.status==='rented' && (v.rented_date||v.rentedDate||'').slice(0,7)===mk).length)

const tabCount = (k: string) => k==='all' ? vacancies.value.length : vacancies.value.filter(v=>v.status===k).length
const filteredList = computed(() => activeTab.value==='all' ? vacancies.value : vacancies.value.filter(v=>v.status===activeTab.value))

// Collector board
const collectorBoard = computed(() => {
  const map: Record<string,{name:string;thisMonth:number;total:number}> = {}
  vacancies.value.filter(v=>v.status==='rented').forEach(v=>{
    const name = v.rented_by_name||collectorLabel(v.rented_by||v.rentedBy)
    if (!map[name]) map[name]={name,thisMonth:0,total:0}
    map[name].total++
    if ((v.rented_date||v.rentedDate||'').slice(0,7)===mk) map[name].thisMonth++
  })
  return Object.values(map).filter(x=>x.total>0).sort((a,b)=>b.total-a.total)
})

// ── FETCH ──
async function fetchData() {
  loading.value = true
  try {
    const res = await vacApi.owner.list()
    vacancies.value = res.vacancies || []
    if (res.statistics) stats.value = res.statistics
    usingFallback.value = false
  } catch {
    loadLocal(); usingFallback.value = true
    // filter vacancies by owner's properties
    const ownerPropIds = new Set(extState.value.properties.filter(p=>String(p.ownerId)===String(myOwnerId.value)).map(p=>p.id))
    const all = extState.value.vacancies.filter(v => v.propertyId && ownerPropIds.has(v.propertyId))
    vacancies.value = all
    stats.value = {
      vacant_count:  all.filter(v=>v.status==='vacant').length,
      deposit_count: all.filter(v=>v.status==='deposit').length,
      rented_count:  all.filter(v=>v.status==='rented').length,
      rented_this_month: all.filter(v=>v.status==='rented' && (v.rentedDate||'').slice(0,7)===mk).length,
    }
  } finally { loading.value = false }
}

onMounted(fetchData)
</script>
