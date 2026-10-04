<template>
  <div>
    <div class="page-title">
      <div><h2>سدادات الملاك</h2><p>تُبنى تلقائيًا من سدادات المستأجرين المعتمدة</p></div>
    </div>
    <div class="search-bar">
      <input v-model="searchQ" placeholder="ابحث بالمالك أو المستأجر أو الوحدة أو رقم السند..." />
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>المالك</th><th>الوحدة</th><th>المستأجر</th><th>المحصل</th><th>النوع</th><th>الإيصال</th><th>المبلغ</th><th>الفترة</th><th>التاريخ</th><th>الحالة</th></tr></thead>
          <tbody>
            <template v-if="filteredList.length">
              <tr v-for="p in filteredList" :key="p.id">
                <td>{{ ownerName(p.ownerId||'') }}</td>
                <td>{{ p.unit||'—' }}</td>
                <td>{{ p.tenantId ? tenantName(p.tenantId) : '—' }}</td>
                <td>{{ p.collectorId ? collectorName(p.collectorId) : '—' }}</td>
                <td>{{ paymentTypeLabel(p.type) }}</td>
                <td>{{ p.receiptNumber||'—' }}</td>
                <td>{{ fmtMoney(p.amount) }}</td>
                <td>{{ p.month }}</td>
                <td>{{ fmtDate(p.submittedAt.slice(0,10)) }}</td>
                <td><span class="badge" :class="`badge-${p.status}`">{{ statusLabel(p.status) }}</span></td>
              </tr>
            </template>
            <tr v-else><td colspan="10"><div class="empty-state"><b>لا توجد سدادات ملاك بعد</b></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, fmtMoney, fmtDate, ownerName, tenantName, collectorName, paymentTypeLabel } = useAppState()
onMounted(load)
const searchQ = ref('')
const baseList = computed(() => state.value.payments.filter(p=>p.ownerId).sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt)))
const filteredList = computed(()=>{
  const q=searchQ.value.trim().toLowerCase(); if(!q) return baseList.value
  return baseList.value.filter(p=> ownerName(p.ownerId||'').toLowerCase().includes(q)||tenantName(p.tenantId||'').toLowerCase().includes(q)||(p.unit||'').toLowerCase().includes(q)||(p.receiptNumber||'').toLowerCase().includes(q))
})
const statusLabel=(s:string)=>({pending:'قيد المراجعة',approved:'معتمد',rejected:'مرفوض'} as any)[s]||s
</script>
<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.search-bar{margin-bottom:14px;}
.search-bar input{width:100%;padding:11px 15px;border-radius:10px;border:1.5px solid #E6DFD3;background:#fff;font-size:14px;outline:none;font-family:inherit;}
.search-bar input:focus{border-color:#E1712F;}
.card{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:20px;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13.5px;}
th{text-align:right;color:#8A8479;font-weight:700;font-size:12px;padding:9px 10px;border-bottom:1.5px solid #E6DFD3;white-space:nowrap;}
td{padding:11px 10px;border-bottom:1px solid #E6DFD3;vertical-align:middle;}
tr:last-child td{border-bottom:none;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:800;}
.badge-pending{background:#FBEEDA;color:#B8791E;}.badge-approved{background:#E4F1E7;color:#3F7D52;}.badge-rejected{background:#F7E7E2;color:#B3452F;}
.empty-state{text-align:center;padding:40px 20px;color:#8A8479;}
.empty-state b{display:block;color:#3A3733;font-size:14.5px;margin-bottom:4px;}
</style>
