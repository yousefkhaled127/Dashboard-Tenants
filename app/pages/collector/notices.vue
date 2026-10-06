<template>
  <div>
    <div class="page-title"><div><h2>طلبات الإشعارات</h2><p>اطلب من المشرف إصدار إشعار لمستأجر، ثم ارفع صورة إثبات تسليمه</p></div></div>

    <!-- New Request -->
    <div class="card" style="max-width:560px;margin-bottom:18px;">
      <h3>طلب إشعار جديد</h3>
      <div class="field">
        <label>المستأجر</label>
        <select v-model="form.tenantId">
          <option value="">اختر المستأجر</option>
          <option v-for="t in myList" :key="t.id" :value="t.id">{{ t.name }}{{ t.unit ? ' — ' + t.unit : '' }}</option>
        </select>
      </div>
      <div class="field">
        <label>سبب / تفاصيل الطلب</label>
        <textarea v-model="form.note" placeholder="مثال: تأخر السداد لمدة شهرين..." />
      </div>
      <button class="btn btn-primary" style="width:100%;" @click="sendRequest">إرسال الطلب للمشرف</button>
    </div>

    <!-- My Notices -->
    <div class="card">
      <h3>طلباتي</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>المستأجر</th><th>تاريخ الطلب</th><th>الحالة</th><th>التفاصيل</th><th></th></tr></thead>
          <tbody>
            <template v-if="myNotices.length">
              <tr v-for="n in myNotices" :key="n.id">
                <td>{{ tenantName(n.tenantId) }}</td>
                <td>{{ fmtDate(n.requestedAt.slice(0,10)) }}</td>
                <td><span class="badge" :class="nBadge(n.status).cls">{{ nBadge(n.status).label }}</span></td>
                <td style="max-width:260px;font-size:12.5px;">
                  <span v-if="n.status==='requested'"         class="muted">بانتظار إصدار المشرف</span>
                  <span v-if="n.status==='issued'"><b>نص الإشعار:</b> {{ n.noticeText || '—' }}</span>
                  <span v-if="n.status==='delivered_pending'" class="muted">بانتظار اعتماد التسليم</span>
                  <span v-if="n.status==='approved'"          class="muted">تم اعتماد التسليم</span>
                  <span v-if="n.status==='rejected' && n.rejectReason" class="muted">سبب الرفض: {{ n.rejectReason }}</span>
                </td>
                <td>
                  <button v-if="n.status === 'issued'" class="btn btn-dark btn-sm" @click="startDeliver(n.id)">رفع إثبات التسليم</button>
                </td>
              </tr>
            </template>
            <tr v-else><td colspan="5"><div class="empty-state"><b>لا توجد طلبات إشعارات بعد</b></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Deliver Modal -->
    <div v-if="deliveringId" class="modal-overlay" @mousedown.self="deliveringId = null">
      <div class="modal">
        <div class="modal-head"><h3>إثبات تسليم الإشعار</h3><button class="modal-close" @click="deliveringId = null">×</button></div>
        <p class="hint">المستأجر: <b>{{ tenantName(deliveringNotice?.tenantId || '') }}</b></p>
        <p class="hint">نص الإشعار: {{ deliveringNotice?.noticeText || '—' }}</p>
        <div class="field">
          <label>صورة إثبات التسليم</label>
          <div class="filepick" :class="{ has: !!deliverImg }" @click="$refs.deliverFile.click()">
            {{ deliverImg ? 'تم اختيار الصورة ✓ (اضغط للتغيير)' : 'اضغط لتصوير / اختيار صورة عملية التسليم' }}
          </div>
          <input ref="deliverFile" type="file" accept="image/*" style="display:none;" @change="handleDeliverImg" />
        </div>
        <div class="field"><label>ملاحظة (اختياري)</label><textarea v-model="deliverNote" placeholder="مثال: تم تسليم الإشعار يدًا بيد للمستأجر" /></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="deliveringId = null">إلغاء</button>
          <button class="btn btn-primary" @click="confirmDeliver">إرسال للمراجعة</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'

const { state, load, save, uid, fmtDate, tenantName, myTenants } = useAppState()
onMounted(load)

const session   = inject<Ref<{ id: string }>>('collectorSession', ref({ id: '' }))
const showToast = inject<(m: string) => void>('showToast', () => {})

const form = reactive({ tenantId: '', note: '' })
const myList = computed(() => myTenants(session.value.id))
const myNotices = computed(() =>
  state.value.notices.filter(n => n.collectorId === session.value.id)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
)

const nBadge = (s: string) => ({
  requested:         { cls: 'badge-pending',  label: 'بانتظار الإصدار' },
  issued:            { cls: 'badge-neutral',  label: 'صادر — بانتظار التسليم' },
  delivered_pending: { cls: 'badge-pending',  label: 'بانتظار اعتماد التسليم' },
  approved:          { cls: 'badge-approved', label: 'معتمد' },
  rejected:          { cls: 'badge-rejected', label: 'مرفوض' },
} as any)[s] || { cls: 'badge-neutral', label: s }

async function sendRequest() {
  if (!form.tenantId)    { showToast('الرجاء اختيار المستأجر'); return }
  if (!form.note.trim()) { showToast('الرجاء كتابة سبب الطلب'); return }
  state.value.notices.push({ id: uid(), tenantId: form.tenantId, collectorId: session.value.id, requestNote: form.note.trim(), requestedAt: new Date().toISOString(), status: 'requested' })
  save(); showToast('تم إرسال طلب الإشعار للمشرف')
  form.tenantId = ''; form.note = ''
}

// Deliver
const deliveringId   = ref<string | null>(null)
const deliverImg     = ref<string | null>(null)
const deliverImgName = ref('')
const deliverNote    = ref('')
const deliveringNotice = computed(() => state.value.notices.find(n => n.id === deliveringId.value))

function startDeliver(id: string) { deliveringId.value = id; deliverImg.value = null; deliverNote.value = '' }

function handleDeliverImg(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
  if (file.size > 3 * 1024 * 1024) { showToast('حجم الصورة كبير جدًا (الحد الأقصى 3MB)'); return }
  const reader = new FileReader()
  reader.onload = ev => { deliverImg.value = ev.target!.result as string; deliverImgName.value = file.name }
  reader.readAsDataURL(file)
}

async function confirmDeliver() {
  if (!deliverImg.value) { showToast('الرجاء إرفاق صورة إثبات التسليم'); return }
  const n = state.value.notices.find(x => x.id === deliveringId.value); if (!n) return
  Object.assign(n, { deliveryImage: deliverImg.value, deliveryNote: deliverNote.value.trim(), deliveredAt: new Date().toISOString(), status: 'delivered_pending' })
  deliveringId.value = null; deliverImg.value = null
  save(); showToast('تم إرسال إثبات التسليم للمراجعة')
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:#3A3733; }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:#8A8479; margin-bottom:6px; font-weight:700; }
select, input { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; color:#2E2B27; outline:none; font-family:inherit; font-size:14px; }
select:focus, input:focus { border-color:#E1712F; background:#fff; }
textarea { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; resize:vertical; min-height:70px; outline:none; font-family:inherit; font-size:14px; }
textarea:focus { border-color:#E1712F; background:#fff; }
.filepick { border:1.5px dashed #E6DFD3; border-radius:10px; padding:16px; text-align:center; color:#8A8479; font-size:13px; font-weight:700; background:#F3EFE8; cursor:pointer; }
.filepick:hover { border-color:#E1712F; color:#B85423; }
.filepick.has { border-color:#3F7D52; color:#3F7D52; background:#E4F1E7; }
.hint { font-size:12.5px; color:#8A8479; margin-bottom:8px; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:#8A8479; font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid #E6DFD3; white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid #E6DFD3; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }
.badge-neutral  { background:#FBE9DC; color:#B85423; }
.muted { color:#8A8479; }
.empty-state { text-align:center; padding:40px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14.5px; margin-bottom:4px; }
.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:#fff; border-radius:16px; padding:26px; width:100%; max-width:520px; max-height:88vh; overflow:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close { background:#F3EFE8; border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:#8A8479; cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-primary { background:#E1712F; color:#fff; } .btn-primary:hover { background:#B85423; }
.btn-ghost { background:transparent; color:#3A3733; border:1.5px solid #E6DFD3; } .btn-ghost:hover { border-color:#3A3733; }
.btn-dark { background:#3A3733; color:#fff; } .btn-dark:hover { background:#2a2724; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
</style>
