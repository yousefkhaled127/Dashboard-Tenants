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

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.grid { display:grid; gap:16px; }
.grid-4 { grid-template-columns:repeat(4,1fr); }
.grid-3 { grid-template-columns:repeat(3,1fr); }
@media(max-width:1050px){ .grid-4{grid-template-columns:repeat(2,1fr);} .grid-3{grid-template-columns:1fr 1fr;} }
@media(max-width:560px)  { .grid-4{grid-template-columns:1fr 1fr;} .grid-3{grid-template-columns:1fr;} }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:#3A3733; }
.stat-card { border-right:4px solid #E1712F; }
.stat-card .lbl { color:#8A8479; font-size:12.5px; font-weight:700; }
.stat-card .val { font-size:22px; font-weight:900; color:#3A3733; margin-top:6px; }
.property-card { border-right:4px solid #E1712F; }
.kv { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #E6DFD3; font-size:13px; }
.kv:last-of-type { border-bottom:none; }
.kv .k { color:#8A8479; } .kv .v { font-weight:800; }
.muted { color:#8A8479; }
.progress { background:#F3EFE8; border-radius:20px; height:9px; overflow:hidden; }
.progress > div { height:100%; background:#E1712F; border-radius:20px; transition:.3s; }
.progress.ok > div { background:#3F7D52; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:#8A8479; font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid #E6DFD3; white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid #E6DFD3; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-neutral  { background:#F3EFE8; color:#8A8479; }
.empty-state { text-align:center; padding:40px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14.5px; margin-bottom:4px; }
.loading-card { display:flex; align-items:center; gap:12px; padding:40px; color:#8A8479; font-weight:700; }
.spinner { width:28px; height:28px; border-radius:50%; border:3px solid #E6DFD3; border-top-color:#E1712F; animation:spin .8s linear infinite; flex-shrink:0; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
