<template>
  <div>
    <div class="page-title">
      <div><h2>إدارة أملاكي</h2><p>{{ data?.period_formatted || '...' }}</p></div>
    </div>

    <div v-if="loading" class="loading-card">
      <div class="spinner" /><span>جارٍ التحميل...</span>
    </div>

    <template v-else-if="data">
      <!-- Statistics -->
      <div class="grid grid-4" style="margin-bottom:18px;">
        <div class="card stat-card">
          <div class="lbl">إجمالي الوحدات</div>
          <div class="val">{{ data.statistics.total_units }}</div>
        </div>
        <div class="card stat-card">
          <div class="lbl">المستهدف الشهري</div>
          <div class="val">{{ fmtMoney(data.statistics.total_target) }}</div>
        </div>
        <div class="card stat-card">
          <div class="lbl">المحصّل</div>
          <div class="val">{{ fmtMoney(data.statistics.total_collected) }}</div>
        </div>
        <div class="card stat-card">
          <div class="lbl">نسبة التحصيل</div>
          <div class="val">{{ data.statistics.collection_percentage }}%</div>
        </div>
      </div>

      <!-- Properties cards -->
      <div v-if="data.properties.length" class="grid grid-3" style="margin-bottom:18px;">
        <div v-for="p in data.properties" :key="p.name" class="card property-card">
          <h3 style="margin-bottom:10px;">{{ p.name }}</h3>
          <div class="kv"><span class="k">عدد الوحدات</span><span class="v">{{ p.units_count }}</span></div>
          <div class="kv"><span class="k">المستهدف الشهري</span><span class="v">{{ fmtMoney(p.total_monthly_target) }}</span></div>
          <div class="kv"><span class="k">المحصّل</span><span class="v">{{ fmtMoney(p.total_collected) }}</span></div>
          <div style="margin-top:10px;">
            <div class="progress" :class="{ ok: p.collection_percentage >= 100 }">
              <div :style="`width:${Math.min(100, p.collection_percentage)}%`" />
            </div>
            <div style="text-align:left;font-size:11.5px;color:#8A8479;margin-top:4px;">{{ p.collection_percentage }}%</div>
          </div>
        </div>
      </div>
      <div v-else class="card" style="margin-bottom:18px;">
        <div class="empty-state">
          <b>لا توجد عقارات مسجلة باسمك بعد</b>
          سيقوم المشرف بإضافتها قريبًا
        </div>
      </div>

      <!-- Tenants Table -->
      <div class="card">
        <h3>مستأجرو وحداتي — المستهدف والمحصل لشهر {{ data.period_formatted }}</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الوحدة</th>
                <th>المستأجر</th>
                <th>رقم الجوال</th>
                <th>المحصل المسؤول</th>
                <th>المستهدف الشهري</th>
                <th>المحصّل هذا الشهر</th>
                <th>المتبقي</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="data.tenants.length">
                <tr v-for="t in data.tenants" :key="t.id">
                  <td>{{ t.property_unit || '—' }}</td>
                  <td><b>{{ t.tenant_name }}</b></td>
                  <td>{{ t.tenant_phone || '—' }}</td>
                  <td>{{ t.collector_name || '—' }}</td>
                  <td>{{ fmtMoney(t.monthly_target) }}</td>
                  <td>{{ fmtMoney(t.paid_amount) }}</td>
                  <td>{{ fmtMoney(t.remaining_amount) }}</td>
                  <td>
                    <span class="badge" :class="statusClass(t.status)">{{ t.status_label }}</span>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="8">
                  <div class="empty-state"><b>لا يوجد مستأجرون مرتبطون بوحداتك بعد</b></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else class="card">
      <div class="empty-state"><b>تعذّر جلب البيانات</b>تأكد من تشغيل الخادم</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type OwnerPropertiesData } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { owner } = useApi()
const { monthKey, fmtMoney } = useFormat()

const mk      = monthKey()
const loading = ref(true)
const data    = ref<OwnerPropertiesData | null>(null)

async function loadData() {
  loading.value = true
  try {
    data.value = await owner.properties(mk)
  } catch { /* تجاهل */ } finally {
    loading.value = false
  }
}

onMounted(loadData)

function statusClass(s: string) {
  if (s === 'regular' || s === 'paid') return 'badge-approved'
  return 'badge-neutral'
}
</script>



