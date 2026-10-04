<template>
  <div>
    <div class="page-title">
      <div><h2>التقارير الشهرية</h2><p>تقرير أداء التحصيل — قابل للتصدير</p></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <select v-model="mk" class="report-select">
          <option v-for="m in months" :key="m" :value="m">{{ monthLabel(m) }}</option>
        </select>
        <button class="btn btn-ghost btn-sm" @click="exportExcel">⬇ تصدير Excel</button>
        <button class="btn btn-dark btn-sm"  @click="printPage">⬇ تصدير PDF</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-4" style="margin-bottom:18px;">
      <div class="card stat-card"><div class="lbl">إجمالي المستهدف</div><div class="val">{{ fmtMoney(totalTarget) }}</div></div>
      <div class="card stat-card"><div class="lbl">إجمالي المُحصّل (معتمد)</div><div class="val">{{ fmtMoney(totalCollected) }}</div><div class="sub">{{ totalTarget ? Math.round(totalCollected/totalTarget*100):0 }}%</div></div>
      <div class="card stat-card"><div class="lbl">عدد السدادات المعتمدة</div><div class="val">{{ monthPayments.length }}</div></div>
      <div class="card stat-card"><div class="lbl">سدادات بانتظار الاعتماد</div><div class="val">{{ pendingCount }}</div></div>
    </div>

    <!-- Collectors Table -->
    <div class="card" style="margin-bottom:16px;">
      <h3>أداء المحصلين — {{ monthLabel(mk) }}</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>المحصل</th><th>المستهدف</th><th>المحصّل</th><th>النسبة</th><th>الفرق</th></tr></thead>
          <tbody>
            <tr v-for="c in state.collectors" :key="c.id">
              <td><b>{{ c.name }}</b></td>
              <td>{{ fmtMoney(targetForCollector(c.id)) }}</td>
              <td>{{ fmtMoney(collectedForMonth(c.id, mk)) }}</td>
              <td>{{ targetForCollector(c.id) ? Math.round(collectedForMonth(c.id,mk)/targetForCollector(c.id)*100):0 }}%</td>
              <td :style="`color:${collectedForMonth(c.id,mk)-targetForCollector(c.id)>=0?'#3F7D52':'#B3452F'};font-weight:800;`">
                {{ collectedForMonth(c.id,mk)-targetForCollector(c.id)>=0?'+':'' }}{{ fmtMoney(collectedForMonth(c.id,mk)-targetForCollector(c.id)) }}
              </td>
            </tr>
            <tr style="font-weight:900;background:#F3EFE8;">
              <td>الإجمالي</td>
              <td>{{ fmtMoney(totalTarget) }}</td>
              <td>{{ fmtMoney(totalCollected) }}</td>
              <td>{{ totalTarget?Math.round(totalCollected/totalTarget*100):0 }}%</td>
              <td :style="`color:${totalCollected-totalTarget>=0?'#3F7D52':'#B3452F'}`">{{ totalCollected-totalTarget>=0?'+':'' }}{{ fmtMoney(totalCollected-totalTarget) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Payments Details -->
    <div class="card">
      <h3>تفاصيل السدادات المعتمدة — {{ monthLabel(mk) }}</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>المستأجر</th><th>المحصل</th><th>النوع</th><th>الإيصال</th><th>المبلغ</th><th>تاريخ السداد</th></tr></thead>
          <tbody>
            <template v-if="monthPayments.length">
              <tr v-for="p in monthPayments" :key="p.id">
                <td>{{ tenantName(p.tenantId||'') }}</td>
                <td>{{ collectorName(p.collectorId||'') }}</td>
                <td>{{ paymentTypeLabel(p.type) }}</td>
                <td>{{ p.receiptNumber||'—' }}</td>
                <td>{{ fmtMoney(p.amount) }}</td>
                <td>{{ fmtDate(p.submittedAt.slice(0,10)) }}</td>
              </tr>
            </template>
            <tr v-else><td colspan="6"><div class="empty-state"><b>لا يوجد سدادات معتمدة لهذا الشهر</b></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, monthKey, monthLabel, lastNMonths, fmtMoney, fmtDate, collectedForMonth, targetForCollector, tenantName, collectorName, paymentTypeLabel, approvedPayments } = useAppState()
onMounted(load)
const months = lastNMonths(12).reverse()
const mk = ref(monthKey())
const totalTarget    = computed(()=>state.value.collectors.reduce((s,c)=>s+targetForCollector(c.id),0))
const totalCollected = computed(()=>state.value.collectors.reduce((s,c)=>s+collectedForMonth(c.id,mk.value),0))
const monthPayments  = computed(()=>approvedPayments.value.filter(p=>p.month===mk.value).sort((a,b)=>a.submittedAt.localeCompare(b.submittedAt)))
const pendingCount   = computed(()=>state.value.payments.filter(p=>p.status==='pending'&&p.month===mk.value).length)

function printPage() {
  window.print()
}

async function exportExcel(){  const XLSX = await import('xlsx')
  const summary = state.value.collectors.map(c=>({
    'المحصل':c.name,'المستهدف':targetForCollector(c.id),'المحصّل':collectedForMonth(c.id,mk.value),
    'النسبة %': targetForCollector(c.id)?Math.round(collectedForMonth(c.id,mk.value)/targetForCollector(c.id)*100):0,
    'الفرق': collectedForMonth(c.id,mk.value)-targetForCollector(c.id)
  }))
  summary.push({'المحصل':'الإجمالي','المستهدف':totalTarget.value,'المحصّل':totalCollected.value,'النسبة %':totalTarget.value?Math.round(totalCollected.value/totalTarget.value*100):0,'الفرق':totalCollected.value-totalTarget.value})
  const details = monthPayments.value.map(p=>({'المستأجر':tenantName(p.tenantId||''),'المحصل':collectorName(p.collectorId||''),'النوع':p.type,'رقم الإيصال':p.receiptNumber||'','المبلغ':p.amount,'تاريخ السداد':p.submittedAt.slice(0,10)}))
  const wb=XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(summary),'ملخص المحصلين')
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(details.length?details:[{'المستأجر':'لا يوجد سدادات'}]),'تفاصيل السدادات')
  XLSX.writeFile(wb,`تقرير_${mk.value}.xlsx`)
}
</script>
<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.report-select{padding:9px 12px;border-radius:9px;border:1.5px solid #E6DFD3;background:#F3EFE8;font-weight:700;font-size:13px;outline:none;font-family:inherit;}
.grid{display:grid;gap:16px;}
.grid-4{grid-template-columns:repeat(4,1fr);}
@media(max-width:1050px){.grid-4{grid-template-columns:repeat(2,1fr);}}
@media(max-width:600px){.grid-4{grid-template-columns:1fr 1fr;}}
.card{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:20px;}
.card h3{margin:0 0 14px;font-size:15px;font-weight:800;color:#3A3733;}
.stat-card{border-right:4px solid #E1712F;}
.stat-card .lbl{color:#8A8479;font-size:12.5px;font-weight:700;}
.stat-card .val{font-size:24px;font-weight:900;color:#3A3733;margin-top:6px;}
.stat-card .sub{font-size:11.5px;color:#8A8479;margin-top:4px;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13.5px;}
th{text-align:right;color:#8A8479;font-weight:700;font-size:12px;padding:9px 10px;border-bottom:1.5px solid #E6DFD3;white-space:nowrap;}
td{padding:11px 10px;border-bottom:1px solid #E6DFD3;vertical-align:middle;}
tr:last-child td{border-bottom:none;}
.empty-state{text-align:center;padding:40px 20px;color:#8A8479;}
.empty-state b{display:block;color:#3A3733;font-size:14.5px;margin-bottom:4px;}
.btn{border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.15s;}
.btn-ghost{background:transparent;color:#3A3733;border:1.5px solid #E6DFD3;}.btn-ghost:hover{border-color:#3A3733;}
.btn-dark{background:#3A3733;color:#fff;}.btn-dark:hover{background:#2a2724;}
.btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}

@media print {
  /* إخفاء كل حاجة ماعدا المحتوى */
  .report-toolbar { display:none !important; }
  .pill-tabs       { display:none !important; }

  /* طباعة نظيفة */
  .card { box-shadow:none !important; border:1px solid #ccc !important; break-inside:avoid; }
  table { font-size:11.5px; }
}
</style>
