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
        <span class="badge badge-pending">الكل: {{ myStats.total_count ?? 0 }}</span>
        <span class="badge badge-pending">بانتظار الإصدار: {{ myStats.pending_count ?? 0 }}</span>
        <span class="badge badge-neutral">صادر للتسليم: {{ myStats.approved_count ?? 0 }}</span>
        <span class="badge badge-approved">مكتمل: {{ myStats.completed_count ?? 0 }}</span>
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
                  <!-- pending: waiting for supervisor to issue -->
                  <span v-if="n.status === 'pending'" class="muted">بانتظار قيام المشرف بإصدار نص الإشعار</span>
                  <!-- issued / approved: show notice content only -->
                  <template v-else-if="isIssued(n)">
                    <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;">
                      <span style="flex:1;">
                        <b>نص الإشعار:</b>
                        {{ getLocalContent(n) || n.notice_content || '—' }}
                      </span>
                      <button class="btn-edit-inline" title="تعديل النص" @click="openEditContent(n)">✏️</button>
                    </div>
                    <div v-if="n.notice_file_url" style="margin-top:4px;">
                      <a :href="n.notice_file_url" target="_blank" class="dl-link">تنزيل وثيقة الإشعار ↗</a>
                    </div>
                  </template>
                  <!-- pending_approval: waiting supervisor to confirm delivery -->
                  <span v-else-if="isPendingApproval(n)" class="muted">تم رفع إثبات التسليم — بانتظار اعتماد المشرف</span>
                  <!-- completed -->
                  <span v-else-if="n.status === 'completed'" class="muted">تم اعتماد التسليم</span>
                  <!-- rejected -->
                  <span v-else-if="n.status === 'rejected'" class="muted">{{ n.reason ? 'سبب الرفض: ' + n.reason : 'تم رفض الطلب' }}</span>
                </td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button
                      v-if="isIssued(n)"
                      class="btn btn-dark btn-sm"
                      :disabled="busy === n.id"
                      @click="openDeliver(n)"
                    >
                      رفع إثبات التسليم
                    </button>
                    <button
                      v-if="isIssued(n)"
                      class="btn btn-outline-print btn-sm"
                      @click="openPrintModal(n)"
                    >
                      🖨 طباعة الإشعار
                    </button>
                  </div>
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

    <!-- Print Type Modal -->
    <div v-if="printingNotice" class="modal-overlay" @mousedown.self="printingNotice = null">
      <div class="modal modal-sm">
        <div class="modal-head">
          <h3>اختر نوع الإشعار للطباعة</h3>
          <button class="modal-close" @click="printingNotice = null">×</button>
        </div>
        <p class="hint" style="margin-bottom:20px;">
          المستأجر: <b>{{ printingNotice.tenant?.name }}</b>
        </p>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <button
            class="btn btn-print-type"
            @click="doPrint('payment')"
          >
            <span class="print-icon">💰</span>
            <div>
              <div class="print-type-title">إشعار سداد</div>
              <div class="print-type-sub">مطالبة المستأجر بسداد المبالغ المتأخرة</div>
            </div>
          </button>
          <button
            class="btn btn-print-type btn-print-danger"
            @click="doPrint('evacuation')"
          >
            <span class="print-icon">🏠</span>
            <div>
              <div class="print-type-title">إشعار إخلاء</div>
              <div class="print-type-sub">إشعار رسمي بضرورة إخلاء الوحدة</div>
            </div>
          </button>
        </div>
        <div style="margin-top:16px;text-align:left;">
          <button class="btn btn-ghost btn-sm" @click="printingNotice = null">إلغاء</button>
        </div>
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

    <!-- Edit Content Modal -->
    <div v-if="editingNotice" class="modal-overlay" @mousedown.self="editingNotice = null">
      <div class="modal modal-sm">
        <div class="modal-head">
          <h3>تعديل نص الإشعار</h3>
          <button class="modal-close" @click="editingNotice = null">×</button>
        </div>
        <p class="hint" style="margin-bottom:14px;">
          المستأجر: <b>{{ editingNotice.tenant?.name }}</b>
        </p>
        <div class="field">
          <label>نص الإشعار</label>
          <textarea v-model="editContentText" rows="6" placeholder="اكتب نص الإشعار هنا..." />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="editingNotice = null">إلغاء</button>
          <button class="btn btn-primary" @click="saveEditContent">حفظ</button>
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
    const mk = monthKey()
    const first = await collector.tenants({ period: mk, page: 1 })
    const all = [...first.tenants]
    const lastPage = first.pagination?.last_page ?? 1
    if (lastPage > 1) {
      const rest = await Promise.all(
        Array.from({ length: lastPage - 1 }, (_, i) =>
          collector.tenants({ period: mk, page: i + 2 })
        )
      )
      rest.forEach(r => all.push(...r.tenants))
    }
    tenants.value = all
  } finally {
    loadingTenants.value = false
  }
}

// ===== My notice requests =====
const myRequests = ref<NoticeRequest[]>([])
const myStats    = ref<any>(null)

async function fetchMyRequests() {
  try {
    const data = await collector.noticeRequests({})
    console.log('[notices] raw data:', JSON.stringify(data))

    // الـ API ممكن يرجع البيانات بأشكال مختلفة — نتعامل مع كل الحالات
    if (Array.isArray(data)) {
      // رجع array مباشرة
      myRequests.value = data
    } else if (data && Array.isArray((data as any).requests)) {
      myRequests.value = (data as any).requests
      myStats.value    = (data as any).statistics ?? null
    } else if (data && Array.isArray((data as any).data)) {
      myRequests.value = (data as any).data
    } else {
      console.warn('[notices] unexpected shape:', data)
      myRequests.value = []
    }
  } catch (e: any) {
    console.error('[notices] error:', e)
    showToast(e?.data?.message ?? 'تعذّر جلب طلبات الإشعارات')
  }
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

// ===== النص المحفوظ محلياً (من صفحة الطباعة) =====
function getLocalContent(n: NoticeRequest): string {
  if (!import.meta.client) return ''
  const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')
  const tenant = normalize(n.tenant?.name         ?? '')
  const unit   = normalize(n.tenant?.property_unit ?? '')
  const payKey = `notice-content-payment::${tenant}::${unit}`
  const evaKey = `notice-content-evacuation::${tenant}::${unit}`
  try {
    return localStorage.getItem(payKey) || localStorage.getItem(evaKey) || ''
  } catch { return '' }
}

// ===== Status helpers =====
function statusLabel(s: string) {
  return ({
    // API statuses
    pending:          'بانتظار الإصدار',
    approved:         'صادر — بانتظار التسليم',
    completed:        'تم التسليم',
    rejected:         'مرفوض',
    // legacy / alternate names
    pending_issuance: 'بانتظار الإصدار',
    issued:           'صادر — بانتظار التسليم',
    pending_approval: 'بانتظار اعتماد التسليم',
  } as Record<string, string>)[s] ?? s
}
function statusClass(s: string) {
  return ({
    pending:          'badge-pending',
    approved:         'badge-neutral',
    completed:        'badge-approved',
    rejected:         'badge-rejected',
    pending_issuance: 'badge-pending',
    issued:           'badge-neutral',
    pending_approval: 'badge-pending',
  } as Record<string, string>)[s] ?? 'badge-neutral'
}

// helper: is the notice issued and ready to deliver?
function isIssued(n: NoticeRequest) {
  return n.status === 'issued' || n.status === 'approved'
}
// helper: has delivery proof been submitted (waiting for supervisor)?
function isPendingApproval(n: NoticeRequest) {
  return n.status === 'pending_approval'
}

// ===== Print Modal =====
const printingNotice = ref<NoticeRequest | null>(null)

function openPrintModal(n: NoticeRequest) {
  printingNotice.value = n
}

function doPrint(type: 'payment' | 'evacuation') {
  if (!printingNotice.value) return
  const n = printingNotice.value

  const tenant  = encodeURIComponent(n.tenant?.name         ?? '')
  const unit    = encodeURIComponent(n.tenant?.property_unit ?? '')
  const content = encodeURIComponent(n.notice_content        ?? '')

  if (type === 'payment') {
    // المبلغ المتأخر (المستهدف)
    const amountRaw = n.amount_due
      ?? n.notice_content?.match(/[\d,،]+(?:\.\d+)?/)?.[0]?.replace(/,/g, '')
      ?? ''
    const amount = encodeURIComponent(String(amountRaw))

    // الفرق: من بيانات المستأجر لو متاحة
    const target    = encodeURIComponent(String(n.tenant?.monthly_target     ?? ''))
    const collected = encodeURIComponent(String(n.tenant?.paid_amount        ?? ''))

    const url = `/collector/print/payment?tenant=${tenant}&unit=${unit}&amount=${amount}&content=${content}&target=${target}&collected=${collected}`
    window.open(url, '_blank')
  } else {
    // تاريخ انتهاء العقد: من contract_end_date أو استخراجه من notice_content
    const endDateRaw  = n.contract_end_date
      ?? n.notice_content?.match(/\d{4}-\d{2}-\d{2}/)?.[0]
      ?? ''
    const contractEnd = encodeURIComponent(endDateRaw)
    const url = `/collector/print/evacuation?tenant=${tenant}&unit=${unit}&contractEnd=${contractEnd}&content=${content}`
    window.open(url, '_blank')
  }

  printingNotice.value = null
}

// ===== Print PDF (old inline button — kept for backward compat) =====
async function printNotice(id: number) {
  try {
    const config = useRuntimeConfig()
    const base   = config.public.apiBase
    const token  = useCookie('tahsilat-token')
    // فتح صفحة الطباعة HTML مباشرة
    const url = `${base}/collector/notice-requests/${id}/pdf?format=html&print=1`
    const win = window.open('', '_blank')
    if (!win) { showToast('السماح بالنوافذ المنبثقة لاستخدام الطباعة'); return }
    // جلب HTML مع التوكن
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'ngrok-skip-browser-warning': 'true',
      }
    })
    const html = await res.text()
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 600)
  } catch {
    showToast('تعذّر طباعة الإشعار')
  }
}
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

// ===== تعديل نص الإشعار محلياً =====
const editingNotice   = ref<NoticeRequest | null>(null)
const editContentText = ref('')

function openEditContent(n: NoticeRequest) {
  editingNotice.value   = n
  editContentText.value = getLocalContent(n) || n.notice_content || ''
}

function saveEditContent() {
  if (!editingNotice.value) return
  const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')
  const tenant = normalize(editingNotice.value.tenant?.name         ?? '')
  const unit   = normalize(editingNotice.value.tenant?.property_unit ?? '')
  const text   = editContentText.value.trim()
  try {
    localStorage.setItem(`notice-content-payment::${tenant}::${unit}`,    text)
    localStorage.setItem(`notice-content-evacuation::${tenant}::${unit}`, text)
  } catch {}
  showToast('تم حفظ نص الإشعار')
  editingNotice.value = null
  myRequests.value = [...myRequests.value]
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
.modal-sm { max-width:400px; }
.btn-outline-print { background:transparent; color:var(--charcoal); border:1.5px solid var(--line); }
.btn-outline-print:hover:not(:disabled) { border-color:var(--orange); color:var(--orange-dark); }
.btn-edit-inline { background:none; border:none; cursor:pointer; font-size:14px; padding:2px 5px; border-radius:6px; line-height:1; flex-shrink:0; transition:.15s; opacity:.7; }
.btn-edit-inline:hover { opacity:1; background:var(--orange-tint); }
.btn-print-type { background:var(--bg); border:1.5px solid var(--line); border-radius:12px; padding:14px 16px; display:flex; align-items:center; gap:14px; text-align:right; width:100%; cursor:pointer; transition:.15s; }
.btn-print-type:hover:not(:disabled) { border-color:var(--orange); background:var(--orange-tint); }
.btn-print-danger { }
.btn-print-danger:hover:not(:disabled) { border-color:var(--danger); background:var(--danger-tint); }
.print-icon { font-size:28px; flex-shrink:0; }
.print-type-title { font-size:15px; font-weight:800; color:var(--charcoal); margin-bottom:3px; }
.print-type-sub { font-size:12px; color:var(--muted); font-weight:500; }
</style>

