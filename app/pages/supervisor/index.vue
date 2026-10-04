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
        <div class="val">{{ pendingPayments.length }}</div>
      </div>
      <div class="card stat-card">
        <div class="lbl">عدد المستأجرين</div>
        <div class="val">{{ state.tenants.length }}</div>
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
        <div v-for="c in state.collectors" :key="c.id" style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:5px;">
            <span>{{ c.name }}</span>
            <span class="muted">{{ fmtMoney(collectedForMonth(c.id, mk)) }} / {{ fmtMoney(targetForCollector(c.id)) }}</span>
          </div>
          <div class="progress" :class="{ ok: pct(c.id) >= 100 }">
            <div :style="`width:${pct(c.id)}%`" />
          </div>
        </div>
      </div>
    </div>

    <!-- Trend -->
    <div class="card" style="margin-bottom:16px;">
      <h3>اتجاه التحصيل — آخر 6 أشهر</h3>
      <canvas ref="chartLine" height="90" />
    </div>

    <!-- Org Ratings -->
    <div class="card">
      <h3>تقييم الملاك لأداء المؤسسة</h3>
      <div class="grid grid-2">
        <div class="gauge-wrap">
          <canvas ref="chartGauge" height="150" />
          <div class="gauge-value">
            {{ orgRatingAvg ? orgRatingAvg.toFixed(1) : '—' }}
            <small>من 5 · {{ state.orgRatings.length }} تقييم</small>
          </div>
        </div>
        <div>
          <template v-if="latestRatings.length">
            <div v-for="r in latestRatings" :key="r.id" class="note-item">
              <div style="display:flex;justify-content:space-between;">
                <b>{{ ownerName(r.ownerId) }}</b>
                <span class="stars-static">{{ starsDisplay(r.stars) }}</span>
              </div>
              <div v-if="r.comment" style="margin-top:4px;font-size:12.5px;">{{ r.comment }}</div>
              <div class="meta">{{ fmtDate(r.ratedAt.slice(0,10)) }}</div>
            </div>
          </template>
          <p v-else class="muted" style="font-size:12.5px;">لم يرسل أي مالك تقييمًا بعد</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { useAppState } from '~/composables/useAppState'

Chart.register(...registerables)

const {
  state, load, monthKey, monthLabel, fmtMoney, fmtDate, lastNMonths,
  collectedForMonth, targetForCollector, ownerName, pendingPayments,
  orgRatingAvg, starsDisplay,
} = useAppState()

onMounted(() => { load(); nextTick(drawCharts) })

const mk = monthKey()
const totalTarget    = computed(() => state.value.collectors.reduce((s,c) => s + targetForCollector(c.id), 0))
const totalCollected = computed(() => state.value.collectors.reduce((s,c) => s + collectedForMonth(c.id, mk), 0))
const latestRatings  = computed(() => [...state.value.orgRatings].sort((a,b) => b.ratedAt.localeCompare(a.ratedAt)).slice(0,4))

const pct = (cid: string) => {
  const t = targetForCollector(cid)
  return t ? Math.min(100, Math.round(collectedForMonth(cid, mk) / t * 100)) : 0
}

// Charts
const chartBar   = ref<HTMLCanvasElement|null>(null)
const chartLine  = ref<HTMLCanvasElement|null>(null)
const chartGauge = ref<HTMLCanvasElement|null>(null)
let c1: Chart|null=null, c2: Chart|null=null, c3: Chart|null=null

const palette = ['#E1712F','#3A3733','#B8791E']

function drawCharts() {
  const months6 = lastNMonths(6)

  if (chartBar.value) {
    c1 = new Chart(chartBar.value, {
      type: 'bar',
      data: {
        labels: state.value.collectors.map(c => c.name),
        datasets: [
          { label:'المحصّل',   data: state.value.collectors.map(c => collectedForMonth(c.id, mk)), backgroundColor:'#E1712F', borderRadius:8, maxBarThickness:44 },
          { label:'المستهدف', data: state.value.collectors.map(c => targetForCollector(c.id)),    backgroundColor:'#3A3733', borderRadius:8, maxBarThickness:44 },
        ],
      },
      options: { responsive:true, plugins:{ legend:{ position:'bottom', rtl:true, labels:{ font:{family:'Tajawal'} } } }, scales:{ x:{ grid:{display:false} }, y:{ grid:{color:'#EFE9DE'} } } },
    })
  }

  if (chartLine.value) {
    c2 = new Chart(chartLine.value, {
      type: 'line',
      data: {
        labels: months6.map(monthLabel),
        datasets: state.value.collectors.map((c, i) => ({
          label: c.name,
          data: months6.map(m => collectedForMonth(c.id, m)),
          borderColor: palette[i % 3], borderWidth:2.5,
          tension:.4, fill:false,
          pointRadius:3, pointBackgroundColor:'#fff', pointBorderColor:palette[i%3], pointBorderWidth:2,
        })),
      },
      options: { responsive:true, plugins:{ legend:{ position:'bottom', rtl:true, labels:{ font:{family:'Tajawal'} } } }, scales:{ x:{ grid:{display:false} }, y:{ grid:{color:'#EFE9DE'} } } },
    })
  }

  if (chartGauge.value) {
    const avg = Math.max(0, Math.min(5, orgRatingAvg.value))
    c3 = new Chart(chartGauge.value, {
      type: 'doughnut',
      data: { labels:['التقييم','الباقي'], datasets:[{ data:[avg, 5-avg], backgroundColor:['#E1712F','#F3EFE8'], borderWidth:0 }] },
      options: { cutout:'78%', rotation:-90, circumference:180, plugins:{ legend:{display:false}, tooltip:{enabled:false} } },
    })
  }
}

onUnmounted(() => { c1?.destroy(); c2?.destroy(); c3?.destroy() })
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
.note-item { background:#F3EFE8; border-radius:10px; padding:10px 12px; margin-bottom:8px; font-size:13px; }
.meta { color:#8A8479; font-size:11px; margin-top:4px; }
.stars-static { color:#E1712F; letter-spacing:2px; }

.gauge-wrap { position:relative; max-width:210px; margin:0 auto; }
.gauge-value { position:absolute; left:0; right:0; bottom:6px; text-align:center; font-weight:900; font-size:22px; color:#3A3733; }
.gauge-value small { display:block; font-size:11px; font-weight:700; color:#8A8479; }
</style>
