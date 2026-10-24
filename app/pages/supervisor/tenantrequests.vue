<template>
  <div>
    <div class="page-title">
      <div>
        <h2>طلبات صيانة المستأجرين</h2>
        <p>طلبات الصيانة المرفوعة من بوابة المستأجرين العامة</p>
      </div>
      <button class="btn btn-ghost btn-sm" @click="loadRequests">↻ تحديث</button>
    </div>

    <!-- Stats -->
    <div class="grid grid-4" style="margin-bottom:16px;">
      <div class="card stat-card">
        <div class="lbl">إجمالي الطلبات</div>
        <div class="val">{{ all.length }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--warning);">
        <div class="lbl">بانتظار المراجعة</div>
        <div class="val">{{ pending.length }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--success);">
        <div class="lbl">معتمدة</div>
        <div class="val">{{ approved.length }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--danger);">
        <div class="lbl">مرفوضة</div>
        <div class="val">{{ rejected.length }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="pill-tabs" style="margin-bottom:16px;">
      <button class="pill-tab" :class="{ active: tab==='pending' }" @click="tab='pending'">
        بانتظار المراجعة ({{ pending.length }})
      </button>
      <button class="pill-tab" :class="{ active: tab==='all' }" @click="tab='all'">
        جميع الطلبات ({{ all.length }})
      </button>
    </div>

    <!-- List -->
    <template v-if="displayList.length">
      <div v-for="r in displayList" :key="r.id" class="card req-card">
        <!-- Header -->
        <div class="req-header">
          <div>
            <div class="req-title">{{ r.title || 'طلب صيانة' }}</div>
            <div class="muted req-meta">
              {{ r.requesterName || '—' }} &nbsp;·&nbsp;
              {{ r.unit || '—' }} &nbsp;·&nbsp;
              {{ r.owner || '—' }} &nbsp;·&nbsp;
              {{ fmtDate(r.requestedAt?.slice(0,10)) }}
            </div>
          </div>
          <span class="badge" :class="reqBadge(r.status).cls">{{ reqBadge(r.status).label }}</span>
        </div>

        <!-- Details -->
        <div class="kv-grid">
          <div class="kv"><span class="k">رقم الهوية</span><span class="v">{{ r.idNumber || '—' }}</span></div>
          <div class="kv"><span class="k">تاريخ الميلاد</span><span class="v">{{ r.birthDate ? fmtDate(r.birthDate) : '—' }}</span></div>
          <div class="kv"><span class="k">رقم الجوال</span><span class="v">{{ r.phone || '—' }}</span></div>
        </div>

        <p v-if="r.description" class="req-desc">{{ r.description }}</p>

        <!-- Media -->
        <div v-if="r.media?.length" class="req-media">
          <template v-for="(med, i) in r.media" :key="i">
            <video v-if="med.type?.startsWith('video')" :src="med.data"
                   controls style="width:150px;height:110px;border-radius:10px;object-fit:cover;border:1px solid #E6DFD3;" />
            <img   v-else :src="med.data"
                   style="width:110px;height:110px;border-radius:10px;object-fit:cover;border:1px solid #E6DFD3;" />
          </template>
        </div>

        <!-- Actions -->
        <div v-if="r.status === 'pending'" style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-success btn-sm" @click="startReview(r.id, 'approve')">✓ اعتماد الطلب</button>
          <button class="btn btn-danger  btn-sm" @click="startReview(r.id, 'reject')">✕ رفض الطلب</button>
        </div>
        <div v-else class="note-item" style="margin-top:10px;">
          <span style="font-weight:700;">ملاحظة المشرف:</span>
          {{ r.supervisorNote || 'بدون ملاحظة' }}
          <div class="meta">{{ r.decidedAt ? fmtDate(r.decidedAt.slice(0,10)) : '' }}</div>
        </div>
      </div>
    </template>

    <div v-else class="card">
      <div class="empty-state">
        <b>{{ tab === 'pending' ? 'لا توجد طلبات بانتظار المراجعة' : 'لا توجد طلبات صيانة بعد' }}</b>
        <span>تظهر هنا الطلبات المرسلة من بوابة المستأجرين</span>
      </div>
    </div>

    <!-- Review Modal -->
    <Teleport to="body">
      <div v-if="reviewingId" class="modal-overlay" @mousedown.self="reviewingId = null">
        <div class="modal">
          <div class="modal-head">
            <h3>{{ reviewAction === 'reject' ? 'رفض طلب الصيانة' : 'اعتماد طلب الصيانة' }}</h3>
            <button class="modal-close" @click="reviewingId = null">×</button>
          </div>
          <p class="hint">{{ reviewingReq?.title || 'طلب صيانة' }} — {{ reviewingReq?.requesterName }}</p>
          <div class="field">
            <label>
              ملاحظة
              <span v-if="reviewAction === 'reject'" style="color:var(--danger);">(إلزامي: اذكر سبب الرفض)</span>
              <span v-else style="color:var(--muted);">(اختياري)</span>
            </label>
            <textarea v-model="reviewNote" placeholder="أدخل ملاحظتك..." rows="3" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="reviewingId = null">إلغاء</button>
            <button class="btn" :class="reviewAction === 'reject' ? 'btn-danger' : 'btn-success'" @click="confirmReview">
              {{ reviewAction === 'reject' ? 'تأكيد الرفض' : 'تأكيد الاعتماد' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const PORTAL_KEY = 'portal-maintenance-requests'

const showToast         = inject<(m:string)=>void>('showToast', () => {})
const supervisorSession = inject<any>('supervisorSession')
const sessionId         = computed(() => supervisorSession?.value?.id ?? '')

// ── state ──
const requests = ref<any[]>([])
const tab      = ref<'pending' | 'all'>('pending')

function loadRequests() {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(PORTAL_KEY)
    requests.value = raw ? JSON.parse(raw) : []
  } catch {
    requests.value = []
  }
}

function saveRequests() {
  if (!import.meta.client) return
  localStorage.setItem(PORTAL_KEY, JSON.stringify(requests.value))
}

onMounted(loadRequests)

// ── computed lists ──
const all      = computed(() => [...requests.value].sort((a,b) => b.requestedAt?.localeCompare(a.requestedAt ?? '') ?? 0))
const pending  = computed(() => all.value.filter(r => r.status === 'pending'))
const approved = computed(() => all.value.filter(r => r.status === 'approved'))
const rejected = computed(() => all.value.filter(r => r.status === 'rejected'))

const displayList = computed(() => tab.value === 'pending' ? pending.value : all.value)

// ── badge ──
const reqBadge = (s: string) => ({
  pending:  { cls: 'badge-pending',  label: 'بانتظار المراجعة' },
  approved: { cls: 'badge-approved', label: 'معتمد' },
  rejected: { cls: 'badge-rejected', label: 'مرفوض' },
} as any)[s] ?? { cls: 'badge-neutral', label: s }

// ── date format ──
function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── review modal ──
const reviewingId  = ref<string | null>(null)
const reviewAction = ref<'approve' | 'reject'>('approve')
const reviewNote   = ref('')

const reviewingReq = computed(() => requests.value.find(r => r.id === reviewingId.value))

function startReview(id: string, action: 'approve' | 'reject') {
  reviewingId.value  = id
  reviewAction.value = action
  reviewNote.value   = ''
}

function confirmReview() {
  const r = requests.value.find(x => x.id === reviewingId.value)
  if (!r) return

  if (reviewAction.value === 'reject' && !reviewNote.value.trim()) {
    showToast('الرجاء ذكر سبب الرفض')
    return
  }

  r.status        = reviewAction.value === 'reject' ? 'rejected' : 'approved'
  r.supervisorNote = reviewNote.value.trim()
  r.decidedAt     = new Date().toISOString()
  r.decidedBy     = sessionId.value

  saveRequests()
  reviewingId.value = null
  showToast(r.status === 'approved' ? 'تم اعتماد الطلب' : 'تم رفض الطلب')
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:2px 0 0; color:var(--muted); font-size:13px; }

.grid { display:grid; gap:16px; }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
@media(max-width:1050px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
@media(max-width:600px)  { .grid-4 { grid-template-columns: 1fr 1fr; } }

.card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; }
.stat-card { border-right:4px solid var(--orange); }
.stat-card .lbl { color:var(--muted); font-size:12.5px; font-weight:700; }
.stat-card .val { font-size:26px; font-weight:900; color:var(--charcoal); margin-top:6px; }

.pill-tabs { display:flex; gap:6px; background:var(--bg); padding:4px; border-radius:10px; width:fit-content; flex-wrap:wrap; }
.pill-tab  { border:none; background:transparent; padding:8px 16px; border-radius:8px; font-weight:700; font-size:13px; color:var(--muted); cursor:pointer; }
.pill-tab.active { background:var(--surface); color:var(--charcoal); box-shadow:0 1px 3px rgba(0,0,0,.08); }

.req-card     { margin-bottom:16px; }
.req-header   { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
.req-title    { font-weight:800; font-size:14.5px; color:var(--charcoal); }
.req-meta     { font-size:12px; margin-top:3px; }
.req-desc     { font-size:13.5px; margin:10px 0; color:var(--charcoal); line-height:1.6; }
.req-media    { display:flex; gap:10px; flex-wrap:wrap; margin:10px 0; }

.kv-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:2px 10px; }
@media(max-width:700px) { .kv-grid { grid-template-columns: 1fr; } }
.kv      { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--line); font-size:13px; }
.kv .k   { color:var(--muted); }
.kv .v   { font-weight:800; }

.note-item { background:var(--bg); border-radius:10px; padding:10px 12px; font-size:13px; }
.meta      { color:var(--muted); font-size:11px; margin-top:4px; }

.badge          { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }
.badge-neutral  { background:#FBE9DC; color:#B85423; }

.empty-state    { text-align:center; padding:40px 20px; color:var(--muted); }
.empty-state b  { display:block; color:var(--charcoal); font-size:14.5px; margin-bottom:4px; }

.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-ghost   { background:transparent; color:var(--charcoal); border:1.5px solid var(--line); }
.btn-ghost:hover { border-color:var(--charcoal); }
.btn-success { background:#E4F1E7; color:#3F7D52; } .btn-success:hover { background:#cde4d5; }
.btn-danger  { background:#F7E7E2; color:#B3452F; } .btn-danger:hover  { background:#f0cdc6; }
.btn-sm      { padding:7px 12px; font-size:12.5px; border-radius:8px; }

.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal         { background:var(--surface); border-radius:16px; padding:26px; width:100%; max-width:520px; }
.modal-head    { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close   { background:var(--bg); border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:var(--muted); cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
.field         { margin-bottom:14px; }
.field label   { display:block; font-size:13px; color:var(--muted); margin-bottom:6px; font-weight:700; }
.hint          { font-size:12.5px; color:var(--muted); margin-bottom:10px; }
textarea       { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid var(--line); background:var(--bg); resize:vertical; min-height:80px; outline:none; font-family:inherit; font-size:14px; color:var(--charcoal); }
textarea:focus { border-color:var(--orange); background:var(--surface); }
.muted         { color:var(--muted); }
</style>
