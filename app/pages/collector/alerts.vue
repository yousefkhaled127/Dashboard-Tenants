<template>
  <div>
    <div class="page-title">
      <div>
        <h2>التنبيهات</h2>
        <p>مواعيد السداد المتفق عليها — الفائتة والقريبة خلال يومين</p>
      </div>
      <button class="btn-refresh" :disabled="loading" @click="fetchAlerts">
        {{ loading ? '...' : '↻ تحديث' }}
      </button>
    </div>

    <!-- stats chips -->
    <div v-if="counts" class="chips">
      <span class="chip chip-all">الكل: {{ counts.total }}</span>
      <span class="chip chip-due">فائت: {{ counts.due_count }}</span>
      <span class="chip chip-soon">قريب: {{ counts.soon_count }}</span>
    </div>

    <!-- loading -->
    <div v-if="loading" class="card empty-state">
      <span class="spin">⏳</span> جارٍ التحميل...
    </div>

    <!-- list -->
    <div v-else-if="alerts.length" class="card list-card">
      <div
        v-for="a in alerts"
        :key="a.id"
        class="alert-row"
        :class="a.alert_status"
      >
        <div class="dot" />
        <div class="alert-body">
          <div class="alert-top">
            <span class="tenant-name">{{ a.tenant.name }}</span>
            <span class="badge" :class="a.alert_status === 'due' ? 'badge-due' : 'badge-soon'">
              {{ a.alert_status_label }}
            </span>
          </div>
          <div class="alert-unit muted">{{ a.tenant.property_unit }}</div>
          <div class="alert-date">
            📅 {{ a.promise.date_formatted }}
            <span v-if="a.diff_days < 0" class="diff-neg">(متأخر {{ Math.abs(a.diff_days) }} يوم)</span>
            <span v-else class="diff-pos">(بعد {{ a.diff_days }} يوم)</span>
          </div>
          <div v-if="a.promise.note" class="alert-note muted">{{ a.promise.note }}</div>
          <div class="alert-phone muted">📞 {{ a.tenant.phone }}</div>
        </div>
      </div>
    </div>

    <!-- empty -->
    <div v-else class="card empty-state">
      <b>لا توجد تنبيهات حالية</b>
      ستظهر هنا مواعيد السداد الفائتة أو القريبة خلال يومين
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type AlertItem } from '~/composables/useApi'

const { collector } = useApi()

const loading = ref(false)
const alerts  = ref<AlertItem[]>([])
const counts  = ref<{ total: number; due_count: number; soon_count: number } | null>(null)

const showToast = inject<(m: string) => void>('showToast', () => {})

async function fetchAlerts() {
  loading.value = true
  try {
    const data = await collector.alerts()
    alerts.value = data.alerts  ?? []
    counts.value = data.counts  ?? null
  } catch (e: any) {
    showToast(e?.data?.message ?? 'تعذّر جلب التنبيهات')
    alerts.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchAlerts)
</script>

<style scoped>
.page-title {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 16px; flex-wrap: wrap; gap: 10px;
}
.page-title h2 { margin: 0; font-size: 21px; font-weight: 800; color: var(--charcoal); }
.page-title p  { margin: 2px 0 0; color: var(--muted); font-size: 13px; }

.btn-refresh {
  background: var(--bg); border: 1.5px solid var(--line); border-radius: 9px;
  padding: 8px 16px; font-weight: 700; font-size: 13px; cursor: pointer;
  color: var(--ink); font-family: inherit; transition: .15s;
}
.btn-refresh:hover:not(:disabled) { border-color: var(--orange); color: var(--orange-dark); }
.btn-refresh:disabled { opacity: .6; cursor: default; }

/* chips */
.chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.chip {
  display: inline-flex; align-items: center; padding: 4px 14px;
  border-radius: 20px; font-size: 12px; font-weight: 800;
}
.chip-all  { background: var(--bg); color: var(--muted); border: 1.5px solid var(--line); }
.chip-due  { background: #f7e7e2; color: #b3452f; }
.chip-soon { background: #fbeeda; color: #b8791e; }

/* card */
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 16px; }
.list-card { padding: 10px 14px; }

/* alert row */
.alert-row {
  display: flex; gap: 12px; padding: 13px 12px;
  border-radius: 10px; margin-bottom: 8px; align-items: flex-start;
}
.alert-row:last-child { margin-bottom: 0; }
.alert-row.due  { background: #f7e7e2; }
.alert-row.soon { background: #fbeeda; }

.dot {
  width: 9px; height: 9px; border-radius: 50%;
  margin-top: 6px; flex-shrink: 0;
}
.alert-row.due  .dot { background: #b3452f; }
.alert-row.soon .dot { background: #b8791e; }

.alert-body { flex: 1; }
.alert-top  { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
.tenant-name { font-size: 14px; font-weight: 800; color: var(--charcoal); }

.badge {
  display: inline-flex; align-items: center; padding: 2px 10px;
  border-radius: 20px; font-size: 11px; font-weight: 800;
}
.badge-due  { background: #b3452f; color: #fff; }
.badge-soon { background: #b8791e; color: #fff; }

.alert-unit  { font-size: 12px; margin-bottom: 4px; }
.alert-date  { font-size: 12.5px; font-weight: 700; color: var(--charcoal); margin-bottom: 4px; }
.diff-neg { color: #b3452f; margin-right: 4px; }
.diff-pos { color: #b8791e; margin-right: 4px; }
.alert-note  { font-size: 12px; margin-bottom: 3px; }
.alert-phone { font-size: 12px; }
.muted { color: var(--muted); }

/* empty */
.empty-state {
  text-align: center; padding: 40px 20px; color: var(--muted); font-size: 13.5px;
}
.empty-state b { display: block; color: var(--charcoal); font-size: 14.5px; margin-bottom: 6px; }
.spin { font-size: 20px; }
</style>
