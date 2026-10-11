<template>
  <div>
    <div class="page-title">
      <div><h2>سداداتي</h2><p>{{ payments.length }} سداد{{ searchQ ? ` (بحث)` : '' }}</p></div>
    </div>

    <div class="search-bar">
      <input v-model="searchQ" placeholder="ابحث باسم المستأجر أو رقم الإيصال..." @input="onSearchInput" />
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>المستأجر</th><th>النوع</th><th>الإيصال / المرفق</th><th>المبلغ</th><th>الفترة</th><th>التاريخ</th><th>الحالة</th></tr>
          </thead>
          <tbody>
            <template v-if="payments.length">
              <tr v-for="p in payments" :key="p.id">
                <td>{{ p.tenant?.name || '—' }}</td>
                <td>{{ p.payment_method }}</td>
                <td>
                  <div v-if="p.receipt_number">#{{ p.receipt_number }}</div>
                  <div v-if="p.attachment_url" style="margin-top:4px;display:flex;align-items:center;gap:6px;">
                    <a :href="p.attachment_url" target="_blank" class="dl-link">عرض المرفق</a>
                  </div>
                  <span v-if="!p.receipt_number && !p.attachment_url" class="muted">—</span>
                </td>
                <td>{{ fmtMoney(p.amount) }}</td>
                <td>{{ p.period }}</td>
                <td>{{ p.payment_date_formatted }}</td>
                <td>
                  <span class="badge" :class="`badge-${p.status}`">{{ p.status_label }}</span>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="7"><div class="empty-state"><b>{{ searchQ ? 'لا توجد نتائج مطابقة' : 'لا يوجد سدادات مرفوعة بعد' }}</b></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type CollectorPaymentItem } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { collector } = useApi()
const { fmtMoney, monthKey } = useFormat()

const mk = monthKey()
const searchQ = ref('')
const payments = ref<CollectorPaymentItem[]>([])

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchList, 350)
}

async function fetchList() {
  try {
    const data = await collector.payments({ search: searchQ.value || undefined, period: mk })
    payments.value = data.payments
  } catch { /* تجاهل */ }
}

onMounted(fetchList)
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.search-bar { margin-bottom:14px; }
.search-bar input { width:100%; padding:11px 15px; border-radius:10px; border:1.5px solid #E6DFD3; background:#fff; font-size:14px; outline:none; font-family:inherit; }
.search-bar input:focus { border-color:#E1712F; }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:#8A8479; font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid #E6DFD3; white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid #E6DFD3; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
.dl-link { color:#B85423; font-weight:800; font-size:12px; text-decoration:none; }
.dl-link:hover { text-decoration:underline; }
.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }
.muted { color:#8A8479; }
.empty-state { text-align:center; padding:40px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14.5px; margin-bottom:4px; }
</style>
