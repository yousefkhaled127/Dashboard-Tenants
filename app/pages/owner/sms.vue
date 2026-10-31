<template>
  <div>
    <div class="page-title">
      <div>
        <h2>الرسائل والإشعارات</h2>
        <p>سجل الأحداث والإشعارات المرتبطة بحسابك</p>
      </div>
      <!-- فلتر النوع -->
      <div class="filter-tabs">
        <button
          v-for="tab in tabs" :key="tab.key"
          class="tab-btn" :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card" style="text-align:center;padding:48px;">
      <div class="spinner"></div>
      <p style="margin-top:12px;color:var(--muted);font-size:13px;">جارٍ التحميل...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card" style="text-align:center;padding:40px;">
      <p style="color:var(--danger,#B3452F);font-size:14px;">{{ error }}</p>
      <button class="btn btn-ghost btn-sm" style="margin-top:12px;" @click="fetchAll">إعادة المحاولة</button>
    </div>

    <!-- القائمة -->
    <template v-else>
      <div class="card" v-if="filtered.length">
        <div
          v-for="item in filtered" :key="item.id"
          class="sms-item"
          :class="`sms-${item.type}`"
        >
          <div class="sms-header">
            <span class="badge" :class="`badge-${item.badgeClass}`">{{ item.typeLabel }}</span>
            <span class="sms-status" :class="`status-${item.statusClass}`">{{ item.statusLabel }}</span>
            <span class="meta">{{ item.date }}</span>
          </div>
          <div class="sms-body">{{ item.body }}</div>
          <div v-if="item.sub" class="sms-sub">{{ item.sub }}</div>
        </div>
      </div>

      <div v-else class="card empty-state">
        <div style="font-size:36px;margin-bottom:12px;">📭</div>
        <b>لا توجد إشعارات</b>
        <span>ستظهر هنا إشعارات السدادات وطلبات الصيانة</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useApi, type OwnerNotificationItem } from '~/composables/useApi'

const { owner } = useApi()
const showToast = inject<(m: string) => void>('showToast', () => {})

// ─── State ───────────────────────────────────────────────────────────────────
const loading = ref(true)
const error   = ref('')
const activeTab = ref<'all' | 'payments' | 'maintenance' | 'maintenance_req'>('all')

interface SmsItem extends OwnerNotificationItem {}

const items = ref<SmsItem[]>([])

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchAll() {
  loading.value = true
  error.value   = ''
  items.value   = []

  try {
    // جلب البيانات بالتوازي
    const [paymentsRes, mainWorksRes, mainReqsRes] = await Promise.allSettled([
      owner.payments({ page: 1 }),
      owner.maintenanceWorks({}),
      owner.maintenanceRequests({}),
    ])

    const list: SmsItem[] = []

    // ── السدادات ──────────────────────────────────────────────────────────
    if (paymentsRes.status === 'fulfilled') {
      for (const p of paymentsRes.value.payments) {
        const statusMap: Record<string, { label: string; cls: string }> = {
          pending:  { label: 'قيد المراجعة', cls: 'pending' },
          approved: { label: 'معتمد',         cls: 'approved' },
          rejected: { label: 'مرفوض',         cls: 'rejected' },
        }
        const s = statusMap[p.status] ?? { label: p.status_label, cls: 'neutral' }
        list.push({
          id:          `pay-${p.id}`,
          type:        'payment',
          typeLabel:   'سداد مستأجر',
          badgeClass:  'payment',
          statusLabel: s.label,
          statusClass: s.cls,
          body:        `سداد بمبلغ ${fmtMoney(p.amount)} من المستأجر ${p.tenant?.name ?? '—'} عن وحدة ${p.tenant?.property_unit ?? '—'}`,
          sub:         `طريقة الدفع: ${p.payment_method} · فترة: ${p.period}${p.receipt_number ? ` · إيصال: ${p.receipt_number}` : ''}`,
          date:        p.payment_date_formatted ?? p.payment_date,
          sortKey:     p.payment_date,
        })
      }
    }

    // ── أعمال الصيانة ────────────────────────────────────────────────────
    if (mainWorksRes.status === 'fulfilled') {
      const works = [
        ...(mainWorksRes.value.pending_list ?? []),
        ...(mainWorksRes.value.history_list ?? []),
      ]
      for (const w of works) {
        const statusMap: Record<string, { label: string; cls: string }> = {
          pending:  { label: 'بانتظار قراركم', cls: 'pending' },
          approved: { label: 'معتمد',           cls: 'approved' },
          rejected: { label: 'مرفوض',           cls: 'rejected' },
        }
        const s = statusMap[w.status] ?? { label: w.status_label ?? w.status, cls: 'neutral' }
        list.push({
          id:          `work-${w.id}`,
          type:        'maintenance',
          typeLabel:   'عمل صيانة',
          badgeClass:  'maintenance',
          statusLabel: s.label,
          statusClass: s.cls,
          body:        `${w.title ?? 'عمل صيانة'} — ${w.property_unit ?? '—'}`,
          sub:         w.description ? w.description.slice(0, 120) + (w.description.length > 120 ? '...' : '') : undefined,
          date:        w.created_at_formatted ?? w.created_at ?? '',
          sortKey:     w.created_at ?? '',
        })
      }
    }

    // ── طلبات الصيانة المحوّلة ───────────────────────────────────────────
    if (mainReqsRes.status === 'fulfilled') {
      const reqs = [
        ...(mainReqsRes.value.pending_requests ?? []),
        ...(mainReqsRes.value.history_requests ?? []),
      ]
      for (const r of reqs) {
        const ownerStatusMap: Record<string, { label: string; cls: string }> = {
          pending:  { label: 'بانتظار موافقتكم', cls: 'pending' },
          approved: { label: 'وافقت عليه',        cls: 'approved' },
          rejected: { label: 'رفضته',              cls: 'rejected' },
        }
        const s = ownerStatusMap[r.owner_status] ?? { label: r.owner_status_label ?? 'جديد', cls: 'neutral' }
        list.push({
          id:          `req-${r.id}`,
          type:        'maintenance_req',
          typeLabel:   'طلب صيانة',
          badgeClass:  'req',
          statusLabel: s.label,
          statusClass: s.cls,
          body:        `طلب صيانة من المستأجر ${r.tenant_name ?? r.tenant?.name ?? '—'} — ${r.property_unit ?? r.tenant?.property_unit ?? '—'}`,
          sub:         r.title ? `العنوان: ${r.title}` : undefined,
          date:        r.created_at_formatted ?? r.created_at ?? '',
          sortKey:     r.created_at ?? '',
        })
      }
    }

    // ترتيب تنازلي حسب التاريخ
    items.value = list.sort((a, b) => b.sortKey.localeCompare(a.sortKey))

  } catch (e: any) {
    error.value = e?.message || 'تعذّر جلب الإشعارات'
  } finally {
    loading.value = false
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const payCount     = computed(() => items.value.filter(i => i.type === 'payment').length)
const workCount    = computed(() => items.value.filter(i => i.type === 'maintenance').length)
const reqCount     = computed(() => items.value.filter(i => i.type === 'maintenance_req').length)

const tabs = computed(() => [
  { key: 'all',             label: 'الكل',         count: items.value.length },
  { key: 'payments',        label: 'السدادات',      count: payCount.value },
  { key: 'maintenance',     label: 'أعمال الصيانة', count: workCount.value },
  { key: 'maintenance_req', label: 'طلبات الصيانة', count: reqCount.value },
])

const filtered = computed(() => {
  if (activeTab.value === 'all') return items.value
  if (activeTab.value === 'payments')        return items.value.filter(i => i.type === 'payment')
  if (activeTab.value === 'maintenance')     return items.value.filter(i => i.type === 'maintenance')
  if (activeTab.value === 'maintenance_req') return items.value.filter(i => i.type === 'maintenance_req')
  return items.value
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtMoney = (n: number | string) =>
  (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ر.س'

// ─── Init ──────────────────────────────────────────────────────────────────────
onMounted(fetchAll)
</script>

<style scoped>
.page-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-title h2 { margin: 0; font-size: 21px; font-weight: 800; color: var(--charcoal); }
.page-title p  { margin: 2px 0 0; color: var(--muted); font-size: 13px; }

/* Tabs */
.filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.tab-btn {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--line);
  background: transparent;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: .15s;
  display: flex;
  align-items: center;
  gap: 5px;
}
.tab-btn:hover { border-color: var(--orange); color: var(--orange); }
.tab-btn.active { background: var(--orange); color: #fff; border-color: var(--orange); }
.tab-count {
  background: rgba(255,255,255,.3);
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 800;
}
.tab-btn:not(.active) .tab-count { background: var(--line); color: var(--muted); }

/* Card */
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 20px;
}

/* SMS items */
.sms-item {
  background: var(--bg);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 10px;
  border-right: 3px solid var(--line);
  transition: .15s;
}
.sms-item:last-child { margin-bottom: 0; }
.sms-item:hover { border-right-color: var(--orange); }
.sms-payment        { border-right-color: #2A9D5C; }
.sms-maintenance    { border-right-color: #E6A817; }
.sms-maintenance_req { border-right-color: #4A90D9; }

.sms-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
}
.badge-payment     { background: #D4F0E2; color: #1A7A40; }
.badge-maintenance { background: #FEF3CD; color: #A07000; }
.badge-req         { background: #DCE9F8; color: #2560A0; }

.sms-status {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}
.status-pending  { background: #FFF3CD; color: #856404; }
.status-approved { background: #D4EDDA; color: #155724; }
.status-rejected { background: #F8D7DA; color: #721C24; }
.status-neutral  { background: var(--line); color: var(--muted); }

.meta { font-size: 11px; color: var(--muted); margin-right: auto; }

.sms-body { font-size: 13.5px; line-height: 1.7; color: var(--charcoal); }
.sms-sub  { font-size: 12px; color: var(--muted); margin-top: 4px; }

/* Empty */
.empty-state {
  text-align: center;
  padding: 50px 20px;
  color: var(--muted);
}
.empty-state b {
  display: block;
  color: var(--charcoal);
  font-size: 15px;
  margin-bottom: 6px;
}
.empty-state span { font-size: 13px; }

/* Spinner */
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--line);
  border-top-color: var(--orange);
  border-radius: 50%;
  animation: spin .7s linear infinite;
  margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 520px) {
  .filter-tabs { gap: 4px; }
  .tab-btn { padding: 6px 10px; font-size: 12px; }
}
</style>
