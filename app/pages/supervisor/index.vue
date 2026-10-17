<template>
  <div>
    <div class="page-title">
      <div>
        <h2>نظرة عامة</h2>
        <p>أداء {{ monthLabel(mk) }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="text-align:center;padding:40px;color:var(--muted);">
      <div class="spinner" style="margin:0 auto 12px;"></div>
      <div>جارٍ تحميل البيانات...</div>
    </div>

    <template v-else>
      <!-- Stats Row -->
      <div class="grid grid-4" style="margin-bottom:18px;">
        <div class="card stat-card">
          <div class="lbl">إجمالي المستهدف هذا الشهر</div>
          <div class="val">{{ fmtMoney(totalTarget) }}</div>
        </div>
        <div class="card stat-card">
          <div class="lbl">إجمالي المُحصّل (معتمد)</div>
          <div class="val">{{ fmtMoney(totalCollected) }}</div>
          <div class="sub">{{ totalTarget ? Math.round(totalCollected / totalTarget * 100) : 0 }}% من المستهدف</div>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { useApi, type CollectorUser } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

Chart.register(...registerables)

// ── useApi مرة واحدة بس ──
const { manager } = useApi()
const { monthKey, monthLabel, fmtMoney, lastNMonths } = useFormat()

const mk             = monthKey()
const loading        = ref(true)
const tenantsTotal   = ref(0)
const pendingCount   = ref(0)
const collectors     = ref<CollectorUser[]>([])
const totalTarget    = ref(0)
const totalCollected = ref(0)

interface CollectorStat { id: number; name: string; target: number; collected: number; pct: number }
const collectorStats = computed<CollectorStat[]>(() =>
  collectors.value.map(c => {
    const target    = Number(c.target_this_month    || 0)
    const collected = Number(c.collected_this_month || 0)
    return {
      id: c.id, name: c.name, target, collected,
      pct: target ? Math.min(100, Math.round(collected / target * 100)) : 0,
    }
  })
)
async function loadData() {
  loading.value = true
  try {
    // المحصلون + إحصائياتهم الشهرية
    const cRes = await manager.collectors()
    collectors.value     = cRes.collectors ?? []
    totalTarget.value    = collectors.value.reduce((s, c) => s + Number(c.target_this_month    || 0), 0)
    totalCollected.value = collectors.value.reduce((s, c) => s + Number(c.collected_this_month || 0), 0)

  } catch (e) { console.error('collectors:', e) }

  try {
    // إجمالي المستأجرين
    const tRes = await manager.tenants({ period: mk, page: 1 })
    tenantsTotal.value = tRes.pagination?.total ?? 0
  } catch (e) { console.error('tenants:', e) }

  try {
    // سدادات بانتظار الاعتماد
    const pRes = await manager.approvals({ tab: 'pending' })
    pendingCount.value = pRes.tabs?.pending_count ?? 0
  } catch (e) { console.error('approvals:', e) }

  loading.value = false   // ← المهم: يتحدث دايماً
}

// ── Charts ──
const chartBar  = ref<HTMLCanvasElement | null>(null)
const chartLine = ref<HTMLCanvasElement | null>(null)
let c1: Chart | null = null
let c2: Chart | null = null
const palette = ['#E1712F', '#3A3733', '#B8791E']

function drawCharts() {
  const months6 = lastNMonths(6)

  if (chartBar.value && collectorStats.value.length) {
    c1?.destroy()
    c1 = new Chart(chartBar.value, {
      type: 'bar',
      data: {
        labels: collectorStats.value.map(c => c.name),
        datasets: [
          { label: 'المحصّل',   data: collectorStats.value.map(c => c.collected), backgroundColor: '#E1712F', borderRadius: 8, maxBarThickness: 44 },
          { label: 'المستهدف', data: collectorStats.value.map(c => c.target),    backgroundColor: '#3A3733', borderRadius: 8, maxBarThickness: 44 },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal' } } } },
        scales:  { x: { grid: { display: false } }, y: { grid: { color: '#EFE9DE' } } },
      },
    })
  }

  if (chartLine.value && collectorStats.value.length) {
    c2?.destroy()
    c2 = new Chart(chartLine.value, {
      type: 'line',
      data: {
        labels: months6.map(monthLabel),
        datasets: collectorStats.value.map((c, i) => ({
          label: c.name,
          data:  months6.map((_, idx) => idx === months6.length - 1 ? c.collected : 0),
          borderColor: palette[i % 3], borderWidth: 2.5,
          tension: .4, fill: false,
          pointRadius: 3, pointBackgroundColor: '#fff',
          pointBorderColor: palette[i % 3], pointBorderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal' } } } },
        scales:  { x: { grid: { display: false } }, y: { grid: { color: '#EFE9DE' } } },
      },
    })
  }
}

onMounted(async () => {
  await loadData()
  await nextTick(drawCharts)
})

watch(collectorStats, async () => {
  await nextTick(drawCharts)
})

onUnmounted(() => { c1?.destroy(); c2?.destroy() })
</script>

<style scoped>
.grid   { display:grid; gap:16px; }
.grid-4 { grid-template-columns:repeat(4,1fr); }
.grid-2 { grid-template-columns:1fr 1fr; }
@media(max-width:1050px){ .grid-4{grid-template-columns:repeat(2,1fr);} .grid-2{grid-template-columns:1fr;} }
@media(max-width:600px) { .grid-4{grid-template-columns:1fr 1fr;} }
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:2px 0 0; color:var(--muted); font-size:13px; }
.card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:var(--charcoal); }
.stat-card { border-right:4px solid var(--orange); }
.stat-card .lbl { color:var(--muted); font-size:12.5px; font-weight:700; }
.stat-card .val { font-size:24px; font-weight:900; color:var(--charcoal); margin-top:6px; }
.stat-card .sub { font-size:11.5px; color:var(--muted); margin-top:4px; }
.progress { background:var(--bg); border-radius:20px; height:9px; overflow:hidden; }
.progress>div { height:100%; background:var(--orange); border-radius:20px; transition:.3s; }
.progress.ok>div { background:var(--success); }
.muted { color:var(--muted); }
.spinner { width:34px; height:34px; border-radius:50%; border:3px solid var(--line); border-top-color:var(--orange); animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
