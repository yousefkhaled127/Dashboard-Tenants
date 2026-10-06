<template>
  <div>
    <div class="page-title"><div><h2>التنبيهات</h2><p>مواعيد السداد المتفق عليها مع المستأجرين</p></div></div>

    <div class="card">
      <template v-if="alerts.length">
        <div v-for="a in alerts" :key="a.promise.id" class="alert-row" :class="a.status">
          <div class="dot" />
          <div>
            <b>{{ a.tenant.name }}</b>
            — {{ a.status === 'due' ? 'موعد فائت' : 'موعد قريب' }}
            ({{ fmtDate(a.promise.date) }})
            <div class="muted" style="font-size:12.5px;margin-top:2px;">{{ a.promise.note || 'بدون ملاحظة' }}</div>
            <div v-if="a.tenant.unit" class="muted" style="font-size:11.5px;">{{ a.tenant.unit }}</div>
          </div>
        </div>
      </template>
      <div v-else class="empty-state">
        <b>لا توجد تنبيهات حالية</b>
        ستظهر هنا مواعيد السداد المتفق عليها عند اقترابها
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'

const { load, fmtDate, collectorAlerts } = useAppState()
onMounted(load)

const session = inject<Ref<{ id: string }>>('collectorSession', ref({ id: '' }))
const alerts  = computed(() => collectorAlerts(session.value.id))
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.alert-row { display:flex; gap:12px; padding:13px 14px; border-radius:10px; margin-bottom:9px; align-items:flex-start; }
.alert-row.due  { background:#F7E7E2; }
.alert-row.soon { background:#FBEEDA; }
.dot { width:9px; height:9px; border-radius:50%; margin-top:5px; flex-shrink:0; }
.alert-row.due  .dot { background:#B3452F; }
.alert-row.soon .dot { background:#B8791E; }
.muted { color:#8A8479; }
.empty-state { text-align:center; padding:40px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14.5px; margin-bottom:4px; }
</style>
