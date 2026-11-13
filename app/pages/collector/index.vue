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
import { useApi, type TenantListItem, type CollectorPaymentItem } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

Chart.register(...registerables)

const { collector } = useApi()
const { monthKey, monthLabel, fmtMoney, lastNMonths } = useFormat()

const mk = monthKey()
const myTenants  = ref<TenantListItem[]>([])
const myPayments = ref<CollectorPaymentItem[]>([])
const chartPayments = ref<Record<string, number>>({})
const chartTargets  = ref<Record<string, number>>({})

const collected = computed(() =>
  myPayments.value.filter(p => p.status === 'approved').reduce((s, p) => s + Number(p.amount), 0)
)
const target = computed(() => chartTargets.value[mk] ?? 0)
const pct = computed(() => target.value ? Math.min(100, Math.round(collected.value / target.value * 100)) : 0)

const allTime = computed(() =>
  myPayments.value.filter(p => p.status === 'approved').reduce((s, p) => s + Number(p.amount), 0)
)

const chartEl = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null


async function fetchAllTenants(period: string) {
  const all: TenantListItem[] = []
  let page = 1

  while (true) {
    const res = await collector.tenants({ period, page })

    all.push(...res.tenants)

    const lastPage = Number(res.pagination?.last_page || page)
    if (page >= lastPage) break

    page++
  }

  return all
}

async function fetchAllPayments(period: string) {
  const all: CollectorPaymentItem[] = []
  let page = 1

  while (true) {
    const res = await collector.payments({
      period,
      status: 'approved',
      page,
    })

    all.push(...res.payments)

    const lastPage = Number(res.pagination?.last_page || page)
    if (page >= lastPage) break

    page++
  }

  return all
}

async function loadData() {
  try {
    const months = lastNMonths(6)

    const monthResults = await Promise.allSettled(
      months.map(async (m) => {
        // جلب المستأجرين والمدفوعات الخاصة بالشهر
        const [tenants, payments] = await Promise.all([
          fetchAllTenants(m),
          fetchAllPayments(m),
        ])

        // حساب المستهدف التاريخي لكل مستأجر
        let monthlyTarget = 0

        // تقسيم الطلبات لتجنب إرسال عدد كبير مرة واحدة
        for (let i = 0; i < tenants.length; i += 10) {
          const batch = tenants.slice(i, i + 10)

          const details = await Promise.all(
            batch.map(t => collector.showTenant(t.id, m))
          )

          monthlyTarget += details.reduce(
            (sum, detail) =>
              sum + Number(detail.current_month_target?.target_amount || 0),
            0
          )
        }

        // جمع المدفوعات المعتمدة الخاصة بهذا الشهر فقط
        const monthlyCollected = payments
          .filter(p => p.status === 'approved' && p.period === m)
          .reduce((sum, p) => sum + Number(p.amount || 0), 0)

        return {
          month: m,
          tenants,
          payments,
          target: monthlyTarget,
          collected: monthlyCollected,
        }
      })
    )

    const pMap: Record<string, number> = {}
    const tMap: Record<string, number> = {}

    for (let i = 0; i < months.length; i++) {
      const res = monthResults[i]

      if (res.status === 'fulfilled') {
        const data = res.value

        pMap[data.month] = data.collected
        tMap[data.month] = data.target

        console.log('Month:', data.month)
        console.log('Monthly Target:', data.target)
        console.log('Monthly Collected:', data.collected)
      } else {
        console.error(
          'Error loading month:',
          months[i],
          res.reason
        )

        pMap[months[i]] = 0
        tMap[months[i]] = 0
      }
    }

    chartTargets.value = tMap
    chartPayments.value = pMap

    // تحديد بيانات الشهر الحالي
    const currentIndex = months.indexOf(mk)
    const currentResult = monthResults[
      currentIndex >= 0 ? currentIndex : months.length - 1
    ]

    if (currentResult.status === 'fulfilled') {
      myTenants.value = currentResult.value.tenants
      myPayments.value = currentResult.value.payments
    }

  } catch (e) {
    console.error('Error loading data:', e)
  }
}

onMounted(async () => {
  await loadData()
  await nextTick(drawChart)
})

function drawChart() {
  if (!chartEl.value) return
  const months = lastNMonths(6)
  const monthData   = months.map(m => chartPayments.value[m] ?? 0)
  const monthTarget = months.map(m => chartTargets.value[m] ?? 0)

  if (chart) chart.destroy()
  chart = new Chart(chartEl.value, {
    type: 'bar',
    data: {
      labels: months.map(monthLabel),
      datasets: [
        { label: 'المحصّل',   data: monthData,   backgroundColor: '#E1712F', borderRadius: 8, maxBarThickness: 44 },
        { label: 'المستهدف', data: monthTarget, backgroundColor: '#3A3733', borderRadius: 8, maxBarThickness: 44 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', rtl: true, labels: { font: { family: 'Tajawal' } } } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: '#EFE9DE' } } },
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
