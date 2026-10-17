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
                  <div v-if="p.attachment_url" style="margin-top:4px;">
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
