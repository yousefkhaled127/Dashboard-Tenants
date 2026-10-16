<template>
  <div>
    <div class="page-title">
      <div><h2>نظرة عامة</h2><p>{{ data?.period_formatted || '...' }}</p></div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-card">
      <div class="spinner" />
      <span>جارٍ التحميل...</span>
    </div>

    <template v-else-if="data">
      <!-- KPIs -->
      <div class="grid grid-4" style="margin-bottom:18px;">
        <div class="card stat-card">
          <div class="lbl">محصّل هذا الشهر</div>
          <div class="val">{{ fmtMoney(data.kpis.collected_this_month) }}</div>
        </div>
        <div class="card stat-card">
          <div class="lbl">المستهدف هذا الشهر</div>
          <div class="val">{{ fmtMoney(data.kpis.target_this_month) }}</div>
          <div class="sub">{{ data.kpis.collection_percentage }}% مكتمل</div>
        </div>
        <div class="card stat-card">
          <div class="lbl">إجمالي التحصيل (كل الأوقات)</div>
          <div class="val">{{ fmtMoney(data.kpis.total_collected_all_time) }}</div>
        </div>
        <div class="card stat-card">
          <div class="lbl">عدد الوحدات المرتبطة بحسابك</div>
          <div class="val">{{ data.kpis.total_units_count }}</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;">
          <span>تقدّم الهدف الشهري لوحداتك</span>
          <span class="muted">{{ data.monthly_progress.label }}</span>
        </div>
        <div class="progress" :class="{ ok: data.monthly_progress.percentage >= 100 }">
          <div :style="`width:${Math.min(100, data.monthly_progress.percentage)}%`" />
        </div>
      </div>

      <!-- Collectors Table -->
      <div class="card" style="margin-bottom:16px;">
        <h3>المحصّل المسؤول عن وحداتك — {{ data.period_formatted }}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>المحصل</th><th>عدد الوحدات</th><th>المستهدف</th><th>المحصّل</th><th>النسبة</th></tr>
            </thead>
            <tbody>
              <template v-if="data.assigned_collectors.length">
                <tr v-for="c in data.assigned_collectors" :key="c.id">
                  <td><b>{{ c.name }}</b></td>
                  <td>{{ c.units_count }}</td>
                  <td>{{ fmtMoney(c.target_amount) }}</td>
                  <td>{{ fmtMoney(c.collected_amount) }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div class="progress" style="flex:1;min-width:80px;" :class="{ ok: c.percentage >= 100 }">
                        <div :style="`width:${Math.min(100, c.percentage)}%`" />
                      </div>
                      <span style="font-size:12px;font-weight:700;min-width:32px;">{{ c.percentage }}%</span>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="5" class="muted" style="text-align:center;padding:16px;">لا توجد وحدات مرتبطة بحسابك بعد</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Chart -->
      <div class="card">
        <h3>تحصيل وحداتي — آخر 6 أشهر</h3>
        <canvas ref="chartEl" height="100" />
      </div>
    </template>

    <div v-else class="card">
      <div class="empty-state"><b>تعذّر جلب البيانات</b>تأكد من تشغيل الخادم</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'
import { useApi, type OwnerOverviewData } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

Chart.register(...registerables)

const { owner } = useApi()
const { monthKey, fmtMoney } = useFormat()

const mk      = monthKey()
const loading = ref(true)
const data    = ref<OwnerOverviewData | null>(null)
const chartEl = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

async function loadData() {
  loading.value = true
  try {
    data.value = await owner.overview(mk)
  } catch { /* تجاهل */ } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
  await nextTick(drawChart)
})

function drawChart() {
  if (!chartEl.value || !data.value) return
  const months = data.value.chart_last_6_months
  chart = new Chart(chartEl.value, {
    type: 'bar',
    data: {
      labels: months.map(m => m.month_label),
      datasets: [{
        label: 'المحصّل',
        data: months.map(m => m.collected_amount),
        backgroundColor: '#E1712F',
        borderRadius: 8,
        maxBarThickness: 44,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal' } } },
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#EFE9DE' } },
      },
    },
  })
}

onUnmounted(() => chart?.destroy())
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.grid { display:grid; gap:16px; }
.grid-4 { grid-template-columns:repeat(4,1fr); }
@media(max-width:1050px){ .grid-4{grid-template-columns:repeat(2,1fr);} }
@media(max-width:520px)  { .grid-4{grid-template-columns:1fr 1fr;} }
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
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:#8A8479; font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid #E6DFD3; white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid #E6DFD3; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
.empty-state { text-align:center; padding:40px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14.5px; margin-bottom:4px; }
.loading-card { display:flex; align-items:center; gap:12px; padding:40px; color:#8A8479; font-weight:700; }
.spinner { width:28px; height:28px; border-radius:50%; border:3px solid #E6DFD3; border-top-color:#E1712F; animation:spin .8s linear infinite; flex-shrink:0; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
