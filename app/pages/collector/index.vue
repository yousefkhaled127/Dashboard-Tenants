<template>
  <div>
    <div class="page-title">
      <div><h2>محفظتي</h2><p>{{ monthLabel(mk) }}</p></div>
    </div>

    <!-- Stats -->
    <div class="grid grid-3" style="margin-bottom:18px;">
      <div class="card stat-card">
        <div class="lbl">محصّل هذا الشهر</div>
        <div class="val">{{ fmtMoney(collected) }}</div>
      </div>
      <div class="card stat-card">
        <div class="lbl">المستهدف هذا الشهر</div>
        <div class="val">{{ fmtMoney(target) }}</div>
        <div class="sub">{{ pct }}% مكتمل</div>
      </div>
      <div class="card stat-card">
        <div class="lbl">إجمالي التحصيل (كل الأوقات)</div>
        <div class="val">{{ fmtMoney(allTime) }}</div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;">
        <span>تقدّم الهدف الشهري</span>
        <span class="muted">{{ fmtMoney(collected) }} / {{ fmtMoney(target) }}</span>
      </div>
      <div class="progress" :class="{ ok: pct >= 100 }">
        <div :style="`width:${pct}%`" />
      </div>
    </div>

    <!-- Chart -->
    <div class="card">
      <h3>أدائي — آخر 6 أشهر</h3>
      <canvas ref="chartEl" height="110" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { useAppState } from '~/composables/useAppState'
import { useSession } from '~/composables/useSession'

Chart.register(...registerables)

const { state, load, monthKey, monthLabel, fmtMoney, lastNMonths, collectedForMonth, targetForCollector, approvedPayments } = useAppState()
const { session, loadSession } = useSession()

onMounted(() => { load(); loadSession() })
const mk = monthKey()

const collected = computed(() => collectedForMonth(session.value.id, mk))
const target    = computed(() => targetForCollector(session.value.id))
const pct       = computed(() => target.value ? Math.min(100, Math.round(collected.value / target.value * 100)) : 0)
const allTime   = computed(() => approvedPayments.value.filter(p => p.collectorId === session.value.id).reduce((s, p) => s + Number(p.amount), 0))

const chartEl = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

onMounted(() => nextTick(() => {
  if (!chartEl.value) return
  const months = lastNMonths(6)
  chart = new Chart(chartEl.value, {
    type: 'bar',
    data: {
      labels: months.map(monthLabel),
      datasets: [
        { label: 'المحصّل',  data: months.map(m => collectedForMonth(session.value.id, m)), backgroundColor: '#E1712F', borderRadius: 8, maxBarThickness: 44 },
        { label: 'المستهدف', data: months.map(() => targetForCollector(session.value.id)),  backgroundColor: '#3A3733', borderRadius: 8, maxBarThickness: 44 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal' } } } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: '#EFE9DE' } } },
    },
  })
}))
onUnmounted(() => chart?.destroy())
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.grid { display:grid; gap:16px; }
.grid-3 { grid-template-columns:repeat(3,1fr); }
@media(max-width:900px){ .grid-3{grid-template-columns:1fr 1fr;} }
@media(max-width:560px){ .grid-3{grid-template-columns:1fr;} }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:#3A3733; }
.stat-card { border-right:4px solid #E1712F; }
.stat-card .lbl { color:#8A8479; font-size:12.5px; font-weight:700; }
.stat-card .val { font-size:24px; font-weight:900; color:#3A3733; margin-top:6px; }
.stat-card .sub { font-size:11.5px; color:#8A8479; margin-top:4px; }
.muted { color:#8A8479; }
.progress { background:#F3EFE8; border-radius:20px; height:9px; overflow:hidden; }
.progress > div { height:100%; background:#E1712F; border-radius:20px; transition:.3s; }
.progress.ok > div { background:#3F7D52; }
</style>
