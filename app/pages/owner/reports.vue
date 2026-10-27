<template>
  <div>
    <!-- Header -->
    <div class="page-title">
      <div>
        <h2>التقارير الشهرية</h2>
        <p>تقرير سدادات وحداتك للشهر المحدد قابل للتصدير</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <select v-model="selectedPeriod" class="period-select" @change="fetchData">
          <option v-for="m in months" :key="m" :value="m">{{ monthLabel(m) }}</option>
        </select>
        <button class="btn btn-ghost btn-sm" @click="exportExcel">⬇ تصدير Excel</button>
        <button class="btn btn-dark  btn-sm" @click="printPage">⬇ تصدير PDF</button>
      </div>
    </div>

    <div v-if="loading" class="card" style="text-align:center;padding:40px;">
      <div class="spinner" style="margin:0 auto 12px;"></div>
      <div class="muted">جارٍ التحميل...</div>
    </div>

    <template v-else>
      <!-- KPIs — 3 كروت -->
      <div class="grid grid-3" style="margin-bottom:18px;">
        <div class="card stat-card">
          <div class="lbl">إجمالي المُحصّل هذا الشهر</div>
          <div class="val">{{ fmtMoney(stats.collected) }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--charcoal);">
          <div class="lbl">عدد السدادات المعتمدة</div>
          <div class="val">{{ stats.approvedCount }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--success);">
          <div class="lbl">إجمالي كل الأوقات</div>
          <div class="val">{{ fmtMoney(stats.allTime) }}</div>
        </div>
      </div>

      <!-- جدول السدادات -->
      <div class="card">
        <h3>تفاصيل سدادات الوحدات — {{ monthLabel(selectedPeriod) }}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الوحدة</th>
                <th>المستأجر</th>
                <th>رقم السند</th>
                <th>المبلغ</th>
                <th>تاريخ السداد</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="payments.length">
                <tr v-for="p in payments" :key="p.id">
                  <td>{{ p.tenant?.property_unit || '—' }}</td>
                  <td><b>{{ p.tenant?.name || '—' }}</b></td>
                  <td>{{ p.receipt_number || '—' }}</td>
                  <td><b>{{ fmtMoney(p.amount) }}</b></td>
                  <td>{{ p.payment_date_formatted || '—' }}</td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="5">
                  <div class="empty-state">
                    <b>لا يوجد سدادات معتمدة لهذا الشهر</b>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination && pagination.last_page > 1"
             style="display:flex;justify-content:center;gap:8px;margin-top:16px;">
          <button class="btn btn-ghost btn-sm"
                  :disabled="currentPage <= 1"
                  @click="changePage(currentPage - 1)">‹ السابق</button>
          <span style="padding:7px 12px;font-size:13px;font-weight:700;">
            {{ currentPage }} / {{ pagination.last_page }}
          </span>
          <button class="btn btn-ghost btn-sm"
                  :disabled="currentPage >= pagination.last_page"
                  @click="changePage(currentPage + 1)">التالي ›</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useApi, type OwnerPaymentItem, type OwnerPaymentStats } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { owner } = useApi()
const { fmtMoney, monthKey, monthLabel, lastNMonths } = useFormat()

const loading     = ref(true)
const payments    = ref<OwnerPaymentItem[]>([])
const pagination  = ref<any>(null)
const currentPage = ref(1)

const overviewData = ref<any>(null)  // من /owner/overview للـ kpis

// إحصائيات مشتقة من السدادات المحمّلة
const stats = computed(() => {
  const collected     = payments.value.filter(p => p.status === 'approved').reduce((s, p) => s + Number(p.amount), 0)
  const approvedCount = payments.value.filter(p => p.status === 'approved').length
  const allTime       = overviewData.value?.kpis?.total_collected_all_time ?? collected
  return { collected, approvedCount, allTime }
})

// الأشهر — آخر 12
const months        = lastNMonths(12).reverse()
const selectedPeriod = ref(monthKey())

async function fetchData() {
  loading.value  = true
  currentPage.value = 1
  await Promise.all([fetchPayments(), fetchOverview()])
  loading.value  = false
}

async function fetchPayments() {
  try {
    const d = await owner.payments({
      period: selectedPeriod.value,
      status: 'approved',
      page:   currentPage.value,
    })
    payments.value   = d.payments
    pagination.value = d.pagination
  } catch { payments.value = []; pagination.value = null }
}

async function fetchOverview() {
  try {
    overviewData.value = await owner.overview(selectedPeriod.value)
  } catch { /* silent */ }
}

async function changePage(p: number) {
  currentPage.value = p
  loading.value = true
  await fetchPayments()
  loading.value = false
}

onMounted(fetchData)

// ── تصدير ──
function printPage() { window.print() }

async function exportExcel() {
  try {
    const XLSX = (await import('xlsx')).default || (await import('xlsx'))
    const rows = payments.value.map(p => ({
      'الوحدة':      p.tenant?.property_unit || '—',
      'المستأجر':    p.tenant?.name          || '—',
      'رقم السند':   p.receipt_number        || '—',
      'المبلغ (ر.س)': Number(p.amount),
      'تاريخ السداد': p.payment_date_formatted || '—',
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'الوحدة': 'لا توجد سدادات' }]), 'التقرير')
    XLSX.writeFile(wb, `تقرير_وحداتي_${selectedPeriod.value}.xlsx`)
  } catch { /* silent */ }
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:2px 0 0; color:var(--muted); font-size:13px; }

.period-select {
  padding:8px 12px; border-radius:9px; border:1.5px solid var(--line);
  background:var(--bg); font-family:inherit; font-size:13px; font-weight:700;
  outline:none; color:var(--charcoal);
}

.grid { display:grid; gap:16px; }
.grid-3 { grid-template-columns: repeat(3,1fr); }
@media(max-width:900px) { .grid-3 { grid-template-columns: repeat(3,1fr); } }
@media(max-width:600px)  { .grid-3 { grid-template-columns: 1fr; } }

.card    { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:var(--charcoal); }

.stat-card { border-right:4px solid var(--orange); }
.stat-card .lbl { color:var(--muted); font-size:12.5px; font-weight:700; }
.stat-card .val { font-size:24px; font-weight:900; color:var(--charcoal); margin-top:6px; }

.table-wrap { overflow-x:auto; }
table  { width:100%; border-collapse:collapse; font-size:13.5px; }
th     { text-align:right; color:var(--muted); font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid var(--line); white-space:nowrap; }
td     { padding:11px 10px; border-bottom:1px solid var(--line); vertical-align:middle; }
tr:last-child td { border-bottom:none; }

.empty-state   { text-align:center; padding:40px 20px; color:var(--muted); }
.empty-state b { display:block; color:var(--charcoal); font-size:14.5px; }

.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; cursor:pointer; transition:.15s; display:inline-flex; align-items:center; gap:6px; }
.btn-dark  { background:var(--charcoal); color:#fff; } .btn-dark:hover  { background:#2a2724; }
.btn-ghost { background:transparent; color:var(--charcoal); border:1.5px solid var(--line); } .btn-ghost:hover { border-color:var(--charcoal); }
.btn-sm    { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:not-allowed; }

.muted { color:var(--muted); }
.spinner { width:28px; height:28px; border:3px solid var(--line); border-top-color:var(--orange); border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

@media print {
  .btn, .period-select { display:none !important; }
  .card { box-shadow:none !important; }
}
</style>
