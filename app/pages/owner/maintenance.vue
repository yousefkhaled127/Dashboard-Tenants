<template>
  <div>
    <!-- Header -->
    <div class="page-title">
      <div>
        <h2>أعمال الصيانة</h2>
        <p>صور وفيديوهات أعمال الصيانة المنفذة في عقاراتك، يمكنك تنزيل التقرير الرسمي (PDF) وقبول أو رفض العمل وتقييمه</p>
      </div>
      <button class="btn btn-ghost btn-sm" @click="load">↻ تحديث</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card" style="text-align:center;padding:60px;">
      <div class="spinner" style="margin:0 auto 12px;"></div>
      <div class="muted">جارٍ التحميل...</div>
    </div>

    <template v-else>
      <!-- Empty state -->
      <div v-if="!allWorks.length" class="card empty-card">
        <div class="empty-icon">🔧</div>
        <b>لا توجد أعمال صيانة مسجلة بعد</b>
        <span>ستظهر هنا أعمال الصيانة التي يرسلها المشرف مع الصور والفيديوهات</span>
      </div>

      <!-- Work cards -->
      <template v-else>
        <div v-for="w in allWorks" :key="w.id" class="work-card">

          <!-- Card header -->
          <div class="work-head">
            <div class="work-info">
              <div class="work-num">{{ w.work_order_number }}</div>
              <div class="work-title">{{ w.title }}</div>
              <div class="work-meta">
                {{ w.property_unit || '—' }}
                <span v-if="w.created_at_formatted"> · {{ w.created_at_formatted }}</span>
                <span v-if="w.creator?.name"> · بواسطة {{ w.creator.name }}</span>
              </div>
            </div>
            <span class="badge" :class="statusCls(w.status)">{{ w.status_label || statusTxt(w.status) }}</span>
          </div>

          <!-- Description -->
          <p v-if="w.description" class="work-desc">{{ w.description }}</p>

          <!-- Attachments -->
          <div v-if="w.attachments?.length" class="work-files">
            <template v-for="(a, i) in w.attachments" :key="i">
              <a :href="a.url" target="_blank" class="file-thumb-wrap">
                <img v-if="a.file_type==='image'" :src="a.url" class="file-thumb" :alt="a.name" />
                <div v-else class="file-thumb file-doc">
                  <span>📎</span>
                  <span class="file-name">{{ a.name }}</span>
                </div>
              </a>
            </template>
          </div>
          <div v-else class="no-files">لا توجد مرفقات</div>

          <!-- Owner decision (if made) -->
          <div v-if="w.owner_notes" class="decision-note">
            <span class="decision-label">ملاحظتك:</span> {{ w.owner_notes }}
          </div>
          <div v-if="w.owner_rejection_reason" class="decision-note danger">
            <span class="decision-label">سبب الرفض:</span> {{ w.owner_rejection_reason }}
          </div>
          <div v-if="w.rating" class="decision-note">
            <span class="decision-label">تقييمك:</span>
            <span class="stars">{{ '★'.repeat(w.rating) }}{{ '☆'.repeat(5-w.rating) }}</span>
            {{ w.rating_comment ? ` — ${w.rating_comment}` : '' }}
          </div>

          <!-- Actions — only for pending -->
          <div v-if="w.status === 'pending'" class="work-actions">
            <button class="btn btn-success btn-sm" @click="openApprove(w)">✓ قبول العمل</button>
            <button class="btn btn-danger  btn-sm" @click="openReject(w)">✕ رفض العمل</button>
          </div>
        </div>
      </template>
    </template>

    <!-- ===== APPROVE MODAL ===== -->
    <Teleport to="body">
      <div v-if="approveModal.open" class="modal-overlay" @mousedown.self="approveModal.open=false">
        <div class="modal">
          <div class="modal-head">
            <h3>قبول عمل الصيانة</h3>
            <button class="modal-close" @click="approveModal.open=false">×</button>
          </div>
          <p class="hint">{{ approveModal.title }}</p>
          <div class="field">
            <label>ملاحظة (اختياري)</label>
            <textarea v-model="approveModal.notes" placeholder="مثال: عمل ممتاز..." rows="2" />
          </div>
          <div class="field">
            <label>تقييم جودة العمل</label>
            <div class="stars-row">
              <button v-for="s in 5" :key="s"
                      class="star-btn" :class="{ active: approveModal.rating >= s }"
                      @click="approveModal.rating = s">★</button>
            </div>
          </div>
          <div v-if="approveModal.rating" class="field">
            <label>تعليق التقييم (اختياري)</label>
            <textarea v-model="approveModal.ratingComment" placeholder="مثال: عمل دقيق ونظيف..." rows="2" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="approveModal.open=false">إلغاء</button>
            <button class="btn btn-success" :disabled="approveModal.saving" @click="confirmApprove">
              {{ approveModal.saving ? 'جارٍ الحفظ...' : 'تأكيد القبول' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== REJECT MODAL ===== -->
    <Teleport to="body">
      <div v-if="rejectModal.open" class="modal-overlay" @mousedown.self="rejectModal.open=false">
        <div class="modal">
          <div class="modal-head">
            <h3>رفض عمل الصيانة</h3>
            <button class="modal-close" @click="rejectModal.open=false">×</button>
          </div>
          <p class="hint">{{ rejectModal.title }}</p>
          <div class="field">
            <label>سبب الرفض <span style="color:var(--danger);">*</span></label>
            <textarea v-model="rejectModal.reason" placeholder="وضّح سبب الرفض..." rows="3" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="rejectModal.open=false">إلغاء</button>
            <button class="btn btn-danger" :disabled="rejectModal.saving" @click="confirmReject">
              {{ rejectModal.saving ? 'جارٍ الحفظ...' : 'تأكيد الرفض' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'

const { owner } = useApi()
const showToast = inject<(m: string) => void>('showToast', () => {})

const loading   = ref(true)
const allWorks  = ref<any[]>([])

async function load() {
  loading.value = true
  try {
    const d = await owner.maintenanceWorks()
    // دمج pending + history في قائمة واحدة (pending أولاً)
    allWorks.value = [...(d.pending_list ?? []), ...(d.history_list ?? [])]
  } catch { allWorks.value = [] } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Status helpers ──
function statusCls(s: string) {
  return s === 'approved' ? 'badge-approved' : s === 'rejected' ? 'badge-rejected' : 'badge-pending'
}
function statusTxt(s: string) {
  return ({ pending:'بانتظار قراركم', approved:'مقبولة', rejected:'مرفوضة' } as any)[s] ?? s
}

// ── Approve ──
const approveModal = reactive({
  open: false, saving: false, id: 0, title: '',
  notes: '', rating: 0, ratingComment: '',
})

function openApprove(w: any) {
  Object.assign(approveModal, { open:true, id:w.id, title:`${w.work_order_number} · ${w.title}`, notes:'', rating:0, ratingComment:'' })
}

async function confirmApprove() {
  approveModal.saving = true
  try {
    await owner.approveMaintenanceWork(approveModal.id, { notes: approveModal.notes || undefined })
    if (approveModal.rating) {
      await owner.rateMaintenanceWork(approveModal.id, {
        rating: approveModal.rating,
        rating_comment: approveModal.ratingComment || undefined,
      })
    }
    showToast('تم قبول عمل الصيانة')
    approveModal.open = false
    await load()
  } catch (e: any) { showToast(e?.data?.message || 'تعذّر القبول')
  } finally { approveModal.saving = false }
}

// ── Reject ──
const rejectModal = reactive({ open: false, saving: false, id: 0, title: '', reason: '' })

function openReject(w: any) {
  Object.assign(rejectModal, { open:true, id:w.id, title:`${w.work_order_number} · ${w.title}`, reason:'' })
}

async function confirmReject() {
  if (!rejectModal.reason.trim()) { showToast('الرجاء ذكر سبب الرفض'); return }
  rejectModal.saving = true
  try {
    await owner.rejectMaintenanceWork(rejectModal.id, { rejection_reason: rejectModal.reason })
    showToast('تم رفض عمل الصيانة')
    rejectModal.open = false
    await load()
  } catch (e: any) { showToast(e?.data?.message || 'تعذّر الرفض')
  } finally { rejectModal.saving = false }
}
</script>

<style scoped>
.page-title   { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:4px 0 0; color:var(--muted); font-size:12.5px; max-width:520px; line-height:1.6; }

/* Empty */
.empty-card  { text-align:center; padding:64px 20px; }
.empty-icon  { font-size:40px; margin-bottom:12px; }
.empty-card b { display:block; font-size:15px; color:var(--charcoal); margin-bottom:6px; }
.empty-card span { font-size:13px; color:var(--muted); }

/* Work card */
.work-card {
  background:var(--surface); border:1px solid var(--line);
  border-radius:14px; padding:20px; margin-bottom:14px;
}
.work-head  { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
.work-num   { font-size:11.5px; color:var(--muted); font-weight:700; margin-bottom:3px; }
.work-title { font-size:15px; font-weight:800; color:var(--charcoal); }
.work-meta  { font-size:12px; color:var(--muted); margin-top:3px; }
.work-desc  { font-size:13.5px; color:var(--charcoal); margin:0 0 12px; line-height:1.7; }

/* Files */
.work-files { display:flex; flex-wrap:wrap; gap:10px; margin:10px 0; }
.file-thumb-wrap { text-decoration:none; display:block; }
.file-thumb {
  width:100px; height:80px; border-radius:10px; object-fit:cover;
  border:1px solid var(--line); display:block;
}
.file-doc {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:4px; background:var(--bg); color:var(--charcoal); font-size:11px;
  width:100px; height:80px;
}
.file-name { font-size:10px; text-align:center; word-break:break-all; }
.no-files  { font-size:12px; color:var(--muted); margin:8px 0; }

/* Decision notes */
.decision-note { font-size:12.5px; color:var(--muted); background:var(--bg); border-radius:8px; padding:8px 12px; margin-top:8px; }
.decision-note.danger { color:var(--danger); background:#fef2f0; }
.decision-label { font-weight:800; color:var(--charcoal); margin-left:4px; }
.stars { color:var(--orange); font-size:14px; }

/* Actions */
.work-actions { display:flex; gap:8px; margin-top:14px; }

/* Badge */
.badge          { display:inline-block; padding:4px 12px; border-radius:20px; font-size:11.5px; font-weight:800; white-space:nowrap; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }

/* Buttons */
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; cursor:pointer; transition:.15s; display:inline-flex; align-items:center; gap:6px; }
.btn-ghost   { background:transparent; color:var(--charcoal); border:1.5px solid var(--line); } .btn-ghost:hover { border-color:var(--charcoal); }
.btn-success { background:#E4F1E7; color:#3F7D52; } .btn-success:hover { background:#cde4d5; }
.btn-danger  { background:#F7E7E2; color:#B3452F; } .btn-danger:hover  { background:#f0cdc6; }
.btn-sm      { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:not-allowed; }

/* Card */
.card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; }
.muted  { color:var(--muted); }
.spinner { width:28px; height:28px; border:3px solid var(--line); border-top-color:var(--orange); border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Modal */
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal         { background:var(--surface); border-radius:16px; padding:26px; width:100%; max-width:500px; max-height:88vh; overflow-y:auto; }
.modal-head    { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close   { background:var(--bg); border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:var(--muted); cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
.hint  { font-size:12.5px; color:var(--muted); margin-bottom:12px; }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:var(--muted); margin-bottom:6px; font-weight:700; }
textarea { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid var(--line); background:var(--bg); resize:vertical; min-height:80px; outline:none; font-family:inherit; font-size:14px; color:var(--charcoal); box-sizing:border-box; }
textarea:focus { border-color:var(--orange); background:var(--surface); }

.stars-row { display:flex; gap:6px; }
.star-btn  { background:none; border:none; font-size:28px; color:var(--line); cursor:pointer; padding:0; transition:.1s; line-height:1; }
.star-btn.active, .star-btn:hover { color:var(--orange); }
</style>
