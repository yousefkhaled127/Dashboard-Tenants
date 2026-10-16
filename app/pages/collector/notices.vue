<template>
  <div>
    <div class="page-title">
      <div>
        <h2>طلبات الإشعارات</h2>
        <p>اطلب من المشرف إصدار إشعار لمستأجر، ثم ارفع صورة إثبات تسليمه ليعتمدها المشرف</p>
      </div>
    </div>

    <!-- New Request -->
    <div class="card" style="max-width:560px;margin-bottom:18px;">
      <h3>طلب إشعار جديد</h3>
      <div class="field">
        <label>المستأجر</label>
        <select v-model="newReq.tenantId" :disabled="loadingTenants">
          <option :value="null">{{ loadingTenants ? 'جارٍ التحميل...' : 'اختر المستأجر' }}</option>
          <option v-for="t in tenants" :key="t.id" :value="t.id">
            {{ t.name }}{{ t.property_unit ? ' — ' + t.property_unit : '' }}
          </option>
        </select>
      </div>
      <div class="field">
        <label>سبب / تفاصيل الطلب</label>
        <textarea v-model="newReq.reason" placeholder="مثال: تأخر السداد لمدة شهرين..." />
      </div>
      <button class="btn btn-primary" style="width:100%;" :disabled="submitting" @click="sendRequest">
        {{ submitting ? 'جارٍ الإرسال...' : 'إرسال الطلب للمشرف' }}
      </button>
    </div>

    <!-- My Requests -->
    <div class="card">
      <h3>طلباتي</h3>

      <!-- stats chips -->
      <div v-if="myStats" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
        <span class="badge badge-pending">بانتظار الإصدار: {{ myStats.pending_issuance_count ?? 0 }}</span>
        <span class="badge badge-neutral">صادر للتسليم: {{ myStats.issued_count ?? 0 }}</span>
        <span class="badge badge-pending">بانتظار اعتماد التسليم: {{ myStats.pending_approval_count ?? 0 }}</span>
        <span class="badge badge-approved">معتمد: {{ myStats.approved_count ?? 0 }}</span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>المستأجر</th>
              <th>تاريخ الطلب</th>
              <th>الحالة</th>
              <th>التفاصيل</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="myRequests.length">
              <tr v-for="n in myRequests" :key="n.id">
                <td>{{ n.tenant?.name || '—' }}</td>
                <td>{{ n.created_at || '—' }}</td>
                <td>
                  <span class="badge" :class="statusClass(n.status)">{{ statusLabel(n.status) }}</span>
                </td>
                <td style="max-width:260px;font-size:12.5px;">
                  <span v-if="n.status === 'pending_issuance'" class="muted">بانتظار قيام المشرف بإصدار نص الإشعار</span>
                  <span v-else-if="n.status === 'issued'"><b>نص الإشعار:</b> {{ n.notice_content || '—' }}</span>
                  <div v-if="n.notice_file_url && n.status === 'issued'" style="margin-top:4px;">
                    <a :href="n.notice_file_url" target="_blank" class="dl-link">تنزيل وثيقة الإشعار ↗</a>
                  </div>
                  <span v-if="n.status === 'pending_approval'" class="muted">تم رفع إثبات التسليم — بانتظار اعتماد المشرف</span>
                  <span v-if="n.status === 'approved'" class="muted">تم اعتماد التسليم</span>
                  <span v-if="n.status === 'rejected' && n.reason" class="muted">سبب الرفض: {{ n.reason }}</span>
                </td>
                <td>
                  <button
                    v-if="n.status === 'issued'"
                    class="btn btn-dark btn-sm"
                    :disabled="busy === n.id"
                    @click="openDeliver(n)"
                  >
                    رفع إثبات التسليم
                  </button>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="5">
                <div class="empty-state"><b>لا توجد طلبات إشعارات بعد</b></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Deliver Modal -->
    <div v-if="deliveringNotice" class="modal-overlay" @mousedown.self="deliveringNotice = null">
      <div class="modal">
        <div class="modal-head">
          <h3>إثبات تسليم الإشعار</h3>
          <button class="modal-close" @click="deliveringNotice = null">×</button>
        </div>
        <p class="hint">المستأجر: <b>{{ deliveringNotice.tenant?.name }}</b></p>
        <p class="hint">نص الإشعار: {{ deliveringNotice.notice_content || '—' }}</p>

        <div class="field">
          <label>صورة إثبات التسليم <span class="req">*</span></label>
          <div class="filepick" :class="{ has: !!deliverFile }" @click="($refs.deliverFileInp as HTMLInputElement).click()">
            {{ deliverFile ? `تم اختيار: ${deliverFile.name} ✓ (اضغط للتغيير)` : 'اضغط لتصوير / اختيار صورة عملية التسليم' }}
          </div>
          <input ref="deliverFileInp" type="file" accept="image/*" style="display:none;" @change="handleDeliverFile" />
        </div>

        <div class="field">
          <label>تاريخ التسليم</label>
          <input v-model="deliverDate" type="date" />
        </div>

        <div class="field">
          <label>ملاحظة (اختياري)</label>
          <textarea v-model="deliverNote" placeholder="مثال: تم تسليم الإشعار يدًا بيد للمستأجر اليوم" />
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="deliveringNotice = null">إلغاء</button>
          <button class="btn btn-primary" :disabled="busy" @click="confirmDeliver">إرسال للمراجعة</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type NoticeRequest, type TenantListItem } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { collector } = useApi()
const { monthKey, todayISO } = useFormat()

const showToast = inject<(m: string) => void>('showToast', () => {})

// ===== Tenants for dropdown =====
const tenants       = ref<TenantListItem[]>([])
const loadingTenants = ref(false)

async function fetchTenants() {
  loadingTenants.value = true
  try {
    const data = await collector.tenants({ period: monthKey() })
    tenants.value = data.tenants
  } catch { /* تجاهل */ } finally {
    loadingTenants.value = false
  }
}

// ===== My notice requests =====
const myRequests = ref<NoticeRequest[]>([])
const myStats    = ref<any>(null)

async function fetchMyRequests() {
  try {
    const data = await collector.noticeRequests()
    myRequests.value = data.requests
    myStats.value    = data.statistics
  } catch { showToast('تعذّر جلب طلبات الإشعارات') }
}

onMounted(async () => {
  await Promise.all([fetchTenants(), fetchMyRequests()])
})

// ===== New request =====
const newReq    = reactive({ tenantId: null as number | null, reason: '' })
const submitting = ref(false)

async function sendRequest() {
  if (!newReq.tenantId) { showToast('الرجاء اختيار المستأجر'); return }
  if (!newReq.reason.trim()) { showToast('الرجاء كتابة سبب الطلب'); return }
  submitting.value = true
  try {
    await collector.createNoticeRequest({ tenant_id: newReq.tenantId, reason: newReq.reason.trim() })
    showToast('تم إرسال طلب الإشعار للمشرف')
    newReq.tenantId = null
    newReq.reason   = ''
    await fetchMyRequests()
  } catch (e: any) {
    showToast(e?.data?.message ?? 'تعذّر إرسال الطلب')
  } finally {
    submitting.value = false
  }
}

// ===== Status helpers =====
function statusLabel(s: string) {
  return ({
    pending_issuance: 'بانتظار الإصدار',
    issued:           'صادر — بانتظار التسليم',
    pending_approval: 'بانتظار اعتماد التسليم',
    approved:         'معتمد',
    rejected:         'مرفوض',
  } as Record<string, string>)[s] ?? s
}
function statusClass(s: string) {
  return ({
    pending_issuance: 'badge-pending',
    issued:           'badge-neutral',
    pending_approval: 'badge-pending',
    approved:         'badge-approved',
    rejected:         'badge-rejected',
  } as Record<string, string>)[s] ?? 'badge-neutral'
}

// ===== Deliver proof =====
const deliveringNotice = ref<NoticeRequest | null>(null)
const deliverFile      = ref<File | null>(null)
const deliverDate      = ref(todayISO())
const deliverNote      = ref('')
const busy             = ref<number | null>(null)

function openDeliver(n: NoticeRequest) {
  deliveringNotice.value = n
  deliverFile.value      = null
  deliverDate.value      = todayISO()
  deliverNote.value      = ''
}

function handleDeliverFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (f.size > 3 * 1024 * 1024) { showToast('حجم الصورة أكبر من 3MB'); return }
  deliverFile.value = f
}

async function confirmDeliver() {
  if (!deliveringNotice.value) return
  if (!deliverFile.value) { showToast('الرجاء إرفاق صورة إثبات التسليم'); return }
  busy.value = deliveringNotice.value.id
  try {
    const fd = new FormData()
    fd.append('delivery_proof', deliverFile.value)
    fd.append('delivery_date',  deliverDate.value)
    fd.append('delivery_notes', deliverNote.value.trim())
    await collector.submitDeliveryProof(deliveringNotice.value.id, fd)
    showToast('تم إرسال إثبات التسليم للمراجعة')
    deliveringNotice.value = null
    await fetchMyRequests()
  } catch (e: any) {
    showToast(e?.data?.message ?? 'تعذّر رفع إثبات التسليم')
  } finally {
    busy.value = null
  }
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:2px 0 0; color:var(--muted); font-size:13px; }
.card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:var(--charcoal); }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:var(--muted); margin-bottom:6px; font-weight:700; }
.field input,
.field select { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid var(--line); background:var(--bg); color:var(--ink); outline:none; font-family:inherit; font-size:14px; }
.field input:focus, .field select:focus { border-color:var(--orange); background:var(--surface); }
textarea { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid var(--line); background:var(--bg); resize:vertical; min-height:70px; outline:none; font-family:inherit; font-size:14px; }
textarea:focus { border-color:var(--orange); background:var(--surface); }
.filepick { border:1.5px dashed var(--line); border-radius:10px; padding:16px; text-align:center; color:var(--muted); font-size:13px; font-weight:700; background:var(--bg); cursor:pointer; }
.filepick.has { border-color:var(--success); color:var(--success); background:var(--success-tint); }
.hint { font-size:12.5px; color:var(--muted); margin-bottom:8px; }
.req { color:var(--danger); font-weight:900; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:var(--muted); font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid var(--line); white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid var(--line); vertical-align:middle; }
tr:last-child td { border-bottom:none; }
.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending  { background:var(--warning-tint); color:var(--warning); }
.badge-approved { background:var(--success-tint); color:var(--success); }
.badge-rejected { background:var(--danger-tint); color:var(--danger); }
.badge-neutral  { background:var(--orange-tint); color:var(--orange-dark); }
.muted { color:var(--muted); }
.dl-link { color:var(--orange-dark); font-weight:800; font-size:12px; text-decoration:none; }
.dl-link:hover { text-decoration:underline; }
.empty-state { text-align:center; padding:40px 20px; color:var(--muted); }
.empty-state b { display:block; color:var(--charcoal); font-size:14.5px; margin-bottom:4px; }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-primary { background:var(--orange); color:#fff; width:100%; } .btn-primary:hover:not(:disabled) { background:var(--orange-dark); }
.btn-ghost { background:transparent; color:var(--charcoal); border:1.5px solid var(--line); } .btn-ghost:hover:not(:disabled) { border-color:var(--charcoal); }
.btn-dark { background:var(--charcoal); color:#fff; } .btn-dark:hover:not(:disabled) { opacity:.88; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:default; }
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:var(--surface); border-radius:16px; padding:26px; width:100%; max-width:520px; max-height:88vh; overflow:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close { background:var(--bg); border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:var(--muted); cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
</style>
