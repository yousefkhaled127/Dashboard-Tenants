<template>
  <div>
    <div class="page-title">
      <div>
        <h2>الإشعارات</h2>
        <p>مراجعة طلبات إصدار الإشعارات واعتماد إثبات تسليمها للمستأجرين</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="pill-tabs">
      <button class="pill-tab" :class="{ active: tab === 'new' }" @click="switchTab('new')">
        طلبات جديدة ({{ stats.new_requests_count ?? 0 }})
      </button>
      <button class="pill-tab" :class="{ active: tab === 'pending_approval' }" @click="switchTab('pending_approval')">
        بانتظار اعتماد التسليم ({{ stats.pending_approval_count ?? 0 }})
      </button>
      <button class="pill-tab" :class="{ active: tab === 'all' }" @click="switchTab('all')">
        جميع الإشعارات ({{ stats.all_count ?? 0 }})
      </button>
    </div>

    <!-- Search -->
    <div class="search-bar">
      <input v-model="searchQ" placeholder="ابحث باسم المستأجر، الجوال، رقم المستأجر أو سبب الإشعار..." @input="onSearchInput" />
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>المستأجر</th>
              <th>المحصل</th>
              <th>التاريخ</th>
              <th>السبب / التفاصيل</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="requests.length">
              <tr v-for="n in requests" :key="n.id">
                <td>
                  <b>{{ n.tenant?.name || '—' }}</b>
                  <div v-if="n.tenant?.phone" class="muted" style="font-size:11.5px;">{{ n.tenant.phone }}</div>
                </td>
                <td>{{ n.collector?.name || '—' }}</td>
                <td>{{ n.created_at || '—' }}</td>
                <td style="max-width:260px;font-size:12.5px;">
                  <span v-if="n.status === 'pending_issuance'" class="muted">{{ n.reason }}</span>
                  <span v-else-if="n.status === 'issued'"><b>نص الإشعار:</b> {{ n.notice_content || '—' }}</span>
                  <span v-else-if="n.status === 'pending_approval'" class="muted">تم رفع إثبات التسليم — بانتظار الاعتماد</span>
                  <span v-else-if="n.status === 'approved'" class="muted">تم اعتماد التسليم</span>
                  <span v-else-if="n.status === 'rejected'" class="muted">{{ n.reason }}</span>
                  <div v-if="n.delivery_proof_url" style="margin-top:4px;">
                    <a :href="n.delivery_proof_url" target="_blank" class="dl-link">عرض إثبات التسليم ↗</a>
                  </div>
                </td>
                <td>
                  <span class="badge" :class="statusClass(n.status)">{{ statusLabel(n.status) }}</span>
                </td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <!-- Issue notice -->
                    <template v-if="n.status === 'pending_issuance'">
                      <button class="btn btn-success btn-sm" :disabled="busy === n.id" @click="openIssue(n)">إصدار الإشعار</button>
                      <button class="btn btn-danger btn-sm" :disabled="busy === n.id" @click="startReject(n.id)">رفض</button>
                    </template>
                    <!-- Approve delivery -->
                    <template v-else-if="n.status === 'pending_approval'">
                      <button class="btn btn-success btn-sm" :disabled="busy === n.id" @click="approveDelivery(n.id)">اعتماد التسليم</button>
                      <button class="btn btn-danger btn-sm" :disabled="busy === n.id" @click="startReject(n.id)">رفض</button>
                    </template>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="6">
                <div class="empty-state"><b>لا يوجد بيانات</b></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Issue Modal -->
    <div v-if="issuingId" class="modal-overlay" @mousedown.self="issuingId = null">
      <div class="modal">
        <div class="modal-head">
          <h3>إصدار إشعار للمستأجر</h3>
          <button class="modal-close" @click="issuingId = null">×</button>
        </div>
        <p class="hint" v-if="issuingNotice">
          المستأجر: <b>{{ issuingNotice.tenant?.name }}</b> — طلب من:
          <b>{{ issuingNotice.collector?.name }}</b>
        </p>
        <p v-if="issuingNotice" class="hint">سبب الطلب: {{ issuingNotice.reason }}</p>
        <div class="field">
          <label>نص الإشعار <span class="req">*</span></label>
          <textarea v-model="issueText" placeholder="اكتب نص الإشعار الذي سيُسلَّم للمستأجر..." />
        </div>
        <div class="field">
          <label>وثيقة الإشعار الرسمية (صورة أو PDF — اختياري)</label>
          <div class="filepick" :class="{ has: !!issueFile }" @click="($refs.issueFileInp as HTMLInputElement).click()">
            {{ issueFile ? `تم اختيار: ${issueFile.name} ✓` : 'اضغط لرفع وثيقة الإشعار' }}
          </div>
          <input ref="issueFileInp" type="file" accept="image/*,application/pdf,.pdf" style="display:none;" @change="handleIssueFile" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="issuingId = null">إلغاء</button>
          <button class="btn btn-success" :disabled="busy" @click="confirmIssue">إصدار وإرسال للمحصل</button>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="rejectingId" class="modal-overlay" @mousedown.self="rejectingId = null">
      <div class="modal">
        <div class="modal-head">
          <h3>سبب الرفض</h3>
          <button class="modal-close" @click="rejectingId = null">×</button>
        </div>
        <textarea v-model="rejectReason" placeholder="اذكر سبب الرفض..." />
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="rejectingId = null">إلغاء</button>
          <button class="btn btn-danger" :disabled="busy" @click="confirmReject">تأكيد الرفض</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useApi, type NoticeRequest } from '~/composables/useApi'

const { manager } = useApi()
const showToast = inject<(m: string) => void>('showToast', () => {})

const tab      = ref('new')
const searchQ  = ref('')
const requests = ref<NoticeRequest[]>([])
const stats    = ref<{ new_requests_count?: number; pending_approval_count?: number; all_count?: number }>({})
const busy     = ref<number | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchList, 350)
}

async function fetchList() {
  try {
    const data = await manager.noticeRequests({ tab: tab.value, search: searchQ.value || undefined })
    requests.value = data.requests
    stats.value    = data.statistics
  } catch { showToast('تعذّر جلب الإشعارات') }
}

onMounted(fetchList)

function switchTab(t: string) { tab.value = t; fetchList() }

// ===== STATUS helpers =====
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

// ===== ISSUE =====
const issuingId     = ref<number | null>(null)
const issuingNotice = ref<NoticeRequest | null>(null)
const issueText     = ref('')
const issueFile     = ref<File | null>(null)

function openIssue(n: NoticeRequest) {
  issuingId.value     = n.id
  issuingNotice.value = n
  issueText.value     = ''
  issueFile.value     = null
}

function handleIssueFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (f.size > 5 * 1024 * 1024) { showToast('حجم الملف أكبر من 5MB'); return }
  issueFile.value = f
}

async function confirmIssue() {
  if (!issuingId.value) return
  if (!issueText.value.trim()) { showToast('الرجاء كتابة نص الإشعار'); return }
  busy.value = issuingId.value
  try {
    const fd = new FormData()
    fd.append('notice_content', issueText.value.trim())
    if (issueFile.value) fd.append('notice_file', issueFile.value)
    await manager.issueNotice(issuingId.value, fd)
    showToast('تم إصدار الإشعار، بانتظار قيام المحصل بالتسليم')
    issuingId.value = null
    await fetchList()
  } catch (e: any) {
    showToast(e?.data?.message ?? 'تعذّر إصدار الإشعار')
  } finally {
    busy.value = null
  }
}

// ===== APPROVE DELIVERY =====
async function approveDelivery(id: number) {
  busy.value = id
  try {
    await manager.approveNoticeDelivery(id)
    showToast('تم اعتماد تسليم الإشعار')
    await fetchList()
  } catch (e: any) {
    showToast(e?.data?.message ?? 'تعذّر الاعتماد')
  } finally {
    busy.value = null
  }
}

// ===== REJECT =====
const rejectingId  = ref<number | null>(null)
const rejectReason = ref('')

function startReject(id: number) { rejectingId.value = id; rejectReason.value = '' }

async function confirmReject() {
  if (!rejectingId.value) return
  busy.value = rejectingId.value
  try {
    await manager.rejectNoticeRequest(rejectingId.value, {
      rejection_reason: rejectReason.value.trim() || 'بدون سبب محدد',
    })
    showToast('تم رفض طلب الإشعار')
    rejectingId.value = null
    await fetchList()
  } catch (e: any) {
    showToast(e?.data?.message ?? 'تعذّر الرفض')
  } finally {
    busy.value = null
  }
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:2px 0 0; color:var(--muted); font-size:13px; }
.pill-tabs { display:flex; gap:6px; background:var(--bg); padding:4px; border-radius:10px; margin-bottom:16px; width:fit-content; flex-wrap:wrap; }
.pill-tab { border:none; background:transparent; padding:8px 16px; border-radius:8px; font-weight:700; font-size:13px; color:var(--muted); cursor:pointer; }
.pill-tab.active { background:var(--surface); color:var(--charcoal); box-shadow:0 1px 3px rgba(0,0,0,.08); }
.search-bar { margin-bottom:14px; }
.search-bar input { width:100%; padding:11px 15px; border-radius:10px; border:1.5px solid var(--line); background:var(--surface); font-size:14px; outline:none; font-family:inherit; }
.search-bar input:focus { border-color:var(--orange); }
.card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; }
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
.hint { font-size:12.5px; color:var(--muted); margin-bottom:8px; }
.req { color:var(--danger); font-weight:900; }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:var(--muted); margin-bottom:6px; font-weight:700; }
textarea { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid var(--line); background:var(--bg); resize:vertical; min-height:80px; outline:none; font-family:inherit; font-size:14px; }
textarea:focus { border-color:var(--orange); background:var(--surface); }
.filepick { border:1.5px dashed var(--line); border-radius:10px; padding:14px; text-align:center; color:var(--muted); font-size:13px; font-weight:700; background:var(--bg); cursor:pointer; }
.filepick.has { border-color:var(--success); color:var(--success); background:var(--success-tint); }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-ghost   { background:transparent; color:var(--charcoal); border:1.5px solid var(--line); } .btn-ghost:hover:not(:disabled)   { border-color:var(--charcoal); }
.btn-success { background:var(--success-tint); color:var(--success); } .btn-success:hover:not(:disabled) { background:#cde4d5; }
.btn-danger  { background:var(--danger-tint); color:var(--danger); }  .btn-danger:hover:not(:disabled)  { background:#f0cdc6; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:default; }
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:var(--surface); border-radius:16px; padding:26px; width:100%; max-width:520px; max-height:88vh; overflow:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close { background:var(--bg); border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:var(--muted); cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
</style>
