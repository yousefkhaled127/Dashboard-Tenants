<template>
  <div>
    <div class="page-title">
      <div><h2>سجل رسائل SMS</h2><p>جميع الإشعارات التي أرسلها النظام تلقائيًا ({{ state.smsLog.length }})</p></div>
    </div>
    <div class="card">
      <template v-if="sorted.length">
        <div v-for="s in sorted" :key="s.id" class="sms-item">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
            <span class="badge badge-neutral">{{ kindLabel(s.kind) }}</span>
            <span class="meta">{{ fmtDate(s.createdAt.slice(0,10)) }} {{ s.createdAt.slice(11,16) }}</span>
          </div>
          <div class="muted" style="font-size:12px;margin-top:4px;">إلى: {{ s.toName }} ({{ s.toPhone||'—' }})</div>
          <div style="margin-top:6px;font-size:13.5px;">{{ s.body }}</div>
        </div>
      </template>
      <div v-else class="empty-state"><b>لا توجد رسائل مرسلة بعد</b></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, fmtDate } = useAppState()
onMounted(load)
const sorted = computed(()=>[...state.value.smsLog].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))
const kindLabel=(k:string)=>({maint_new:'صيانة جديدة',payment_settled:'سداد مستأجر',maintreq_approved:'اعتماد طلب صيانة',maintreq_rejected:'رفض طلب صيانة',maintreq_owner_review:'صيانة بانتظار موافقتك',maintreq_owner_decision:'قرار المالك'}as any)[k]||k
</script>
<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.card{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:20px;}
.sms-item{background:#F3EFE8;border-radius:10px;padding:12px 14px;margin-bottom:10px;border-right:3px solid #E1712F;}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:800;}
.badge-neutral{background:#FBE9DC;color:#B85423;}
.meta{font-size:11px;color:#8A8479;}
.muted{color:#8A8479;}
.empty-state{text-align:center;padding:40px 20px;color:#8A8479;}
.empty-state b{display:block;color:#3A3733;font-size:14.5px;margin-bottom:4px;}
</style>
