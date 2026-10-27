<template>
  <div>
    <div class="page-title">
      <div>
        <h2>الرسائل (SMS)</h2>
        <p>الإشعارات والرسائل المرسلة إليك من المنظومة</p>
      </div>
    </div>

    <!-- الرسائل من useAppState (local log) -->
    <div class="card">
      <template v-if="sorted.length">
        <div v-for="s in sorted" :key="s.id" class="sms-item">
          <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
            <span class="badge badge-neutral">{{ kindLabel(s.kind) }}</span>
            <span class="meta">{{ fmtDate(s.createdAt?.slice(0,10)) }} {{ s.createdAt?.slice(11,16) }}</span>
          </div>
          <div class="muted" style="font-size:12px;margin-top:4px;">
            من: المنظومة
          </div>
          <div style="margin-top:6px;font-size:13.5px;line-height:1.7;">{{ s.body }}</div>
        </div>
      </template>
      <div v-else class="empty-state">
        <b>لا توجد رسائل بعد</b>
        <span>ستظهر هنا الإشعارات المرسلة إليك من النظام (اعتماد سداد، طلب صيانة، إلخ)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
import { useAuth } from '~/composables/useAuth'

const { state, load, fmtDate } = useAppState()
const { user } = useAuth()
onMounted(load)

// رسائل الـ owner الحالي
const sorted = computed(() => {
  const ownerId = String(user.value?.id || '')
  return [...state.value.smsLog]
    .filter(s => s.toRole === 'owner' && (s.toId === ownerId || !ownerId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

const kindLabel = (k: string) => ({
  maint_new:              'صيانة جديدة',
  payment_settled:        'سداد مستأجر',
  maintreq_approved:      'اعتماد طلب صيانة',
  maintreq_rejected:      'رفض طلب صيانة',
  maintreq_owner_review:  'صيانة بانتظار موافقتك',
  maintreq_owner_decision:'قرار الصيانة',
} as any)[k] || k
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:2px 0 0; color:var(--muted); font-size:13px; }
.card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; }
.sms-item { background:var(--bg); border-radius:10px; padding:12px 14px; margin-bottom:10px; border-right:3px solid var(--orange); }
.badge         { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-neutral { background:#FBE9DC; color:#B85423; }
.meta          { font-size:11px; color:var(--muted); }
.muted         { color:var(--muted); }
.empty-state   { text-align:center; padding:40px 20px; color:var(--muted); }
.empty-state b { display:block; color:var(--charcoal); font-size:14.5px; margin-bottom:4px; }
</style>
