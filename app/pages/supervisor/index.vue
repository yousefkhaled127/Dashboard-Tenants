<template>
  <div>
    <div class="page-title">
      <div>
        <h2>نظرة عامة</h2>
        <p>أداء {{ monthLabel(mk) }}</p>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-4" style="margin-bottom:18px;">
      <div class="card stat-card">
        <div class="lbl">إجمالي المستهدف هذا الشهر</div>
        <div class="val">{{ fmtMoney(totalTarget) }}</div>
      </div>
      <div class="card stat-card">
        <div class="lbl">إجمالي المُحصّل (معتمد)</div>
        <div class="val">{{ fmtMoney(totalCollected) }}</div>
        <div class="sub">{{ totalTarget ? Math.round(totalCollected/totalTarget*100) : 0 }}% من المستهدف</div>
      </div>
      <div class="card stat-card">
        <div class="lbl">سدادات بانتظار الاعتماد</div>
        <div class="val">{{ pendingCount }}</div>
      </div>
      <div class="card stat-card">
        <div class="lbl">عدد المستأجرين</div>
        <div class="val">{{ tenantsTotal }}</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-2" style="margin-bottom:16px;">
      <div class="card">
        <h3>أداء المحصلين — {{ monthLabel(mk) }}</h3>
        <canvas ref="chartBar" height="220" />
      </div>
      <div class="card">
        <h3>محافظ المحصلين</h3>
        <div v-if="collectorStats.length">
          <div v-for="c in collectorStats" :key="c.id" style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:5px;">
              <span>{{ c.name }}</span>
              <span class="muted">{{ fmtMoney(c.collected) }} / {{ fmtMoney(c.target) }}</span>
            </div>
            <div class="progress" :class="{ ok: c.pct >= 100 }">
              <div :style="`width:${c.pct}%`" />
            </div>
          </div>
        </div>
        <p v-else class="muted" style="font-size:12.5px;">لا توجد بيانات</p>
      </div>
    </div>

    <!-- Trend -->
    <div class="card" style="margin-bottom:16px;">
      <h3>اتجاه التحصيل — آخر 6 أشهر</h3>
      <canvas ref="chartLine" height="90" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { useApi, type TenantListItem, type PaymentApprovalItem, type UserByType } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

Chart.register(...registerables)

const { supervisor, auth } = useApi()
const { monthKey, monthLabel, fmtMoney, lastNMonths } = useFormat()

const mk = monthKey()
const tenants = ref<TenantListItem[]>([])
const tenantsTotal = ref(0)
const allPayments = ref<PaymentApprovalItem[]>([])
const pendingCount = ref(0)
const collectors = ref<UserByType[]>([])

const totalTarget = computed(() => tenants.value.reduce((s, t) => s + Number(t.monthly_target || 0), 0))
const totalCollected = computed(() => tenants.value.reduce((s, t) => s + Number(t.paid_amount || 0), 0))

interface CollectorStat { id: number; name: string; target: number; collected: number; pct: number }
const collectorStats = computed<CollectorStat[]>(() => {
  return collectors.value.map(c => {
    const cTenants = tenants.value.filter(t => t.collector?.id === c.id)
    const target = cTenants.reduce((s, t) => s + Number(t.monthly_target || 0), 0)
    const collected = cTenants.reduce((s, t) => s + Number(t.paid_amount || 0), 0)
    return { id: c.id, name: c.name, target, collected, pct: target ? Math.min(100, Math.round(collected / target * 100)) : 0 }
  })
})

async function loadData() {
  try {
    const [tData, pData, cData] = await Promise.all([
      supervisor.tenants({ period: mk }),
      supervisor.approvals({ tab: 'all' }),
      auth.usersByType('collector'),
    ])
    tenants.value = tData.tenants
    tenantsTotal.value = tData.pagination.total
    allPayments.value = pData.payments
    pendingCount.value = pData.tabs.pending_count
    collectors.value = cData
  } catch { /* تجاهل */ }
}

onMounted(async () => {
  await loadData()
  await nextTick(drawCharts)
})

// Charts
const chartBar = ref<HTMLCanvasElement | null>(null)
const chartLine = ref<HTMLCanvasElement | null>(null)
let c1: Chart | null = null, c2: Chart | null = null

const palette = ['#E1712F', '#3A3733', '#B8791E']

function drawCharts() {
  const months6 = lastNMonths(6)

  if (chartBar.value && collectorStats.value.length) {
    c1 = new Chart(chartBar.value, {
      type: 'bar',
      data: {
        labels: collectorStats.value.map(c => c.name),
        datasets: [
          { label: 'المحصّل', data: collectorStats.value.map(c => c.collected), backgroundColor: '#E1712F', borderRadius: 8, maxBarThickness: 44 },
          { label: 'المستهدف', data: collectorStats.value.map(c => c.target), backgroundColor: '#3A3733', borderRadius: 8, maxBarThickness: 44 },
        ],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal' } } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#EFE9DE' } } } },
    })
  }

  if (chartLine.value && collectorStats.value.length) {
    // البيانات التاريخية للـ 6 أشهر غير متوفرة من API واحد
    // نعرض الشهر الحالي لكل محصل كبداية
    c2 = new Chart(chartLine.value, {
      type: 'line',
      data: {
        labels: months6.map(monthLabel),
        datasets: collectorStats.value.map((c, i) => ({
          label: c.name,
          data: months6.map((m, idx) => idx === months6.length - 1 ? c.collected : 0),
          borderColor: palette[i % 3], borderWidth: 2.5,
          tension: .4, fill: false,
          pointRadius: 3, pointBackgroundColor: '#fff', pointBorderColor: palette[i % 3], pointBorderWidth: 2,
        })),
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal' } } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#EFE9DE' } } } },
    })
  }
}

onUnmounted(() => { c1?.destroy(); c2?.destroy() })
</script>

<style scoped>
.grid   { display:grid; gap:16px; }
.grid-4 { grid-template-columns:repeat(4,1fr); }
.grid-2 { grid-template-columns:1fr 1fr; }
@media(max-width:1050px){ .grid-4{grid-template-columns:repeat(2,1fr);} .grid-2{grid-template-columns:1fr;} }
@media(max-width:600px) { .grid-4{grid-template-columns:1fr 1fr;} }

.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }

.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:#3A3733; }

.stat-card { border-right:4px solid #E1712F; }
.stat-card .lbl { color:#8A8479; font-size:12.5px; font-weight:700; }
.stat-card .val { font-size:24px; font-weight:900; color:#3A3733; margin-top:6px; }
.stat-card .sub { font-size:11.5px; color:#8A8479; margin-top:4px; }

.progress { background:#F3EFE8; border-radius:20px; height:9px; overflow:hidden; }
.progress>div { height:100%; background:#E1712F; border-radius:20px; transition:.3s; }
.progress.ok>div { background:#3F7D52; }

.muted { color:#8A8479; }
</style>
