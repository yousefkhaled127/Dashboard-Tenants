<template>
  <!-- أعمال الصيانة v2 - API Connected -->
  <div>
    <div class="page-title">
      <div>
        <h2>أعمال الصيانة</h2>
        <p>أرسل تقارير الصيانة للملاك مع الصور والفيديوهات</p>
      </div>
    </div>

    <!-- Send Form -->
    <div class="card" style="max-width:680px;margin-bottom:18px;">
      <h3>إرسال تقرير صيانة جديد</h3>

      <div class="field">
        <label>المالك <span style="color:var(--danger)">*</span></label>
        <select v-model="form.owner_id">
          <option value="">{{ loadingOwners ? 'جارٍ التحميل...' : 'اختر المالك' }}</option>
          <option v-for="o in owners" :key="o.id" :value="o.id">{{ o.name }}</option>
        </select>
      </div>

      <div class="field">
        <label>العقار / الوحدة <span style="color:var(--danger)">*</span></label>
        <input v-model="form.property_unit" placeholder="برج الأمل - وحدة 12" />
      </div>

      <div class="field">
        <label>عنوان العمل <span style="color:var(--danger)">*</span></label>
        <input v-model="form.title" placeholder="مثال: إصلاح تسريب المكيف" />
      </div>

      <div class="field">
        <label>الوصف <span style="color:var(--danger)">*</span></label>
        <textarea v-model="form.description" placeholder="تفاصيل أعمال الصيانة المنفذة..." />
      </div>

      <div class="field">
        <label>صور أو فيديوهات (الحد الأقصى 15MB لكل ملف)</label>
        <div class="filepick" :class="{ has: mediaFiles.length > 0 }" @click="($refs.mediaFile as HTMLInputElement).click()">
          {{ mediaFiles.length ? `تم اختيار ${mediaFiles.length} ملف ✓ (اضغط للإضافة)` : 'اضغط لاختيار صور أو فيديوهات' }}
        </div>
        <input ref="mediaFile" type="file" accept="image/*,video/*" multiple style="display:none" @change="handleMedia" />
        <div v-if="mediaPreviews.length" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
          <div v-for="(m, i) in mediaPreviews" :key="i" style="position:relative;">
            <video v-if="m.type.startsWith('video')" :src="m.url" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:1px solid var(--line);" />
            <img v-else :src="m.url" style="width:70px;height:70px;border-radius:8px;object-fit:cover;border:1px solid var(--line);" />
            <button class="media-remove" @click="removeMedia(i)">×</button>
          </div>
        </div>
      </div>

      <button class="btn btn-primary" style="width:100%;" :disabled="sending" @click="sendMaintenance">
        {{ sending ? 'جارٍ الإرسال...' : 'إرسال للمالك' }}
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="pill-tabs" style="margin-bottom:14px;">
      <button v-for="tab in TABS" :key="tab.key"
        class="pill-tab" :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key; fetchWorks()">
        {{ tab.label }}
        <span v-if="tabCounts[tab.key]" class="tab-badge">{{ tabCounts[tab.key] }}</span>
      </button>
    </div>

    <!-- Works List -->
    <div class="card">
      <div v-if="loading" style="text-align:center;padding:40px;color:var(--muted);">جارٍ التحميل...</div>
      <div class="table-wrap" v-else>
        <table>
          <thead>
            <tr>
              <th>رقم أمر العمل</th>
              <th>المالك</th>
              <th>العقار / الوحدة</th>
              <th>العنوان</th>
              <th>الملفات</th>
              <th>التاريخ</th>
              <th>قرار المالك</th>
              <th>التقييم</th>
              <th>التقرير</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="works.length">
              <tr v-for="w in works" :key="w.id">
                <td><code style="font-size:11.5px;background:var(--bg);padding:2px 6px;border-radius:5px;">{{ w.work_order_number }}</code></td>
                <td>{{ w.owner?.name || '—' }}</td>
                <td>{{ w.property_unit || '—' }}</td>
                <td>{{ w.title || '—' }}</td>
                <td>{{ w.files_count_formatted || w.files_count + ' ملف' }}</td>
                <td>{{ w.created_at_formatted || '—' }}</td>
                <td>
                  <span class="badge" :class="ownerDecisionBadge(w.status).cls">
                    {{ ownerDecisionBadge(w.status).label }}
                  </span>
                </td>
                <td>{{ w.rating ? '★'.repeat(w.rating) : '—' }}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" @click.stop="navigateTo(`/supervisor/maintenancereport/${w.id}`)">
                    🖨 إصدار التقرير
                  </button>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="8">
                <div class="empty-state"><b>لا توجد تقارير صيانة بعد</b></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.last_page > 1" style="display:flex;justify-content:center;gap:8px;margin-top:16px;">
        <button class="btn btn-ghost btn-sm" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">‹ السابق</button>
        <span style="padding:7px 12px;font-size:13px;font-weight:700;">{{ currentPage }} / {{ pagination.last_page }}</span>
        <button class="btn btn-ghost btn-sm" :disabled="currentPage >= pagination.last_page" @click="changePage(currentPage + 1)">التالي ›</button>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="detailWork" class="modal-overlay" @mousedown.self="detailWork = null">
      <div class="modal">
        <div class="modal-head">
          <h3>تفاصيل تقرير الصيانة</h3>
          <button class="modal-close" @click="detailWork = null">×</button>
        </div>

        <div class="kv"><span class="k">رقم الأمر</span><span class="v"><code>{{ detailWork.work_order_number }}</code></span></div>
        <div class="kv"><span class="k">المالك</span><span class="v">{{ detailWork.owner?.name || '—' }}</span></div>
        <div class="kv"><span class="k">العقار / الوحدة</span><span class="v">{{ detailWork.property_unit || '—' }}</span></div>
        <div class="kv"><span class="k">العنوان</span><span class="v">{{ detailWork.title }}</span></div>
        <div class="kv"><span class="k">الوصف</span><span class="v" style="white-space:pre-wrap;">{{ detailWork.description || '—' }}</span></div>
        <div class="kv"><span class="k">الحالة</span><span class="v"><span class="badge" :class="ownerDecisionBadge(detailWork.status).cls">{{ ownerDecisionBadge(detailWork.status).label }}</span></span></div>
        <div v-if="detailWork.rating" class="kv"><span class="k">تقييم المالك</span><span class="v">{{ '★'.repeat(detailWork.rating) }} {{ detailWork.rating_comment }}</span></div>
        <div v-if="detailWork.owner_notes" class="kv"><span class="k">ملاحظات المالك</span><span class="v">{{ detailWork.owner_notes }}</span></div>
        <div v-if="detailWork.owner_rejection_reason" class="kv"><span class="k">سبب الرفض</span><span class="v" style="color:var(--danger);">{{ detailWork.owner_rejection_reason }}</span></div>

        <!-- Attachments -->
        <div v-if="detailWork.attachments?.length" style="margin-top:12px;">
          <div style="font-size:13px;font-weight:700;color:var(--muted);margin-bottom:8px;">المرفقات ({{ detailWork.attachments.length }})</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a v-for="(att, i) in detailWork.attachments" :key="i" :href="att.url" target="_blank" style="display:block;">
              <img v-if="att.file_type === 'image'" :src="att.url" style="width:80px;height:80px;border-radius:8px;object-fit:cover;border:1px solid var(--line);" />
              <div v-else style="width:80px;height:80px;border-radius:8px;background:var(--bg);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted);">📄 {{ att.name }}</div>
            </a>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="detailWork = null">إغلاق</button>
          <button class="btn btn-ghost btn-sm" @click="navigateTo(`/supervisor/maintenancereport/${detailWork.id}`); detailWork = null">🖨 إصدار التقرير</button>
          <button class="btn btn-danger btn-sm" @click="deleteWork(detailWork.id)">حذف التقرير</button>
        </div>
      </div>
    </div>

    <!-- Report Modal (PDF View) -->
    <div v-if="reportWork" class="modal-overlay report-overlay" @mousedown.self="reportWork = null">
      <div class="report-page" id="report-print-area">
        <!-- Header -->
        <div class="report-header">
          <div>
            <div class="report-logo">🏢</div>
            <h1>مؤسسة سعود علي السقامي للعقارات</h1>
          </div>
          <div style="text-align:left;">
            <h2>تقرير أعمال صيانة</h2>
            <p style="font-size:12px;color:#666;">معاينة قابلة للطباعة أو الحفظ كملف PDF</p>
          </div>
        </div>

        <!-- Work Info -->
        <div class="report-section">
          <h3>بيانات العمل</h3>
          <div class="report-grid">
            <div class="report-item"><span class="ri-label">رقم أمر العمل</span><span class="ri-val">{{ reportWork.work_order_number }}</span></div>
            <div class="report-item"><span class="ri-label">المالك</span><span class="ri-val">{{ reportWork.owner?.name || '—' }}</span></div>
            <div class="report-item"><span class="ri-label">العقار / الوحدة</span><span class="ri-val">{{ reportWork.property_unit || '—' }}</span></div>
            <div class="report-item"><span class="ri-label">عنوان العمل</span><span class="ri-val">{{ reportWork.title }}</span></div>
            <div class="report-item"><span class="ri-label">تاريخ التنفيذ</span><span class="ri-val">{{ reportWork.created_at_formatted || '—' }}</span></div>
            <div class="report-item"><span class="ri-label">قيّم المالك</span><span class="ri-val">{{ reportWork.rating ? '★'.repeat(reportWork.rating) + ` (${reportWork.rating}/5)` : 'لم يقيّم بعد' }}</span></div>
            <div class="report-item"><span class="ri-label">قرار المالك</span><span class="ri-val">{{ ownerDecisionBadge(reportWork.status).label }}</span></div>
            <div class="report-item"><span class="ri-label">صادر عن</span><span class="ri-val">{{ reportWork.creator?.name || 'المشرف العام' }}</span></div>
          </div>
        </div>

        <!-- Description -->
        <div class="report-section">
          <h3>وصف أعمال الصيانة المنفذة</h3>
          <p style="font-size:13.5px;line-height:1.8;color:#333;">{{ reportWork.description || 'لا يوجد وصف مضاف' }}</p>
        </div>

        <!-- Owner Decision -->
        <div v-if="reportWork.owner_notes || reportWork.owner_rejection_reason || reportWork.rating_comment" class="report-section">
          <h3>قرار المالك وملاحظاته</h3>
          <p v-if="reportWork.owner_notes" style="font-size:13.5px;line-height:1.8;color:#333;"><b>ملاحظات:</b> {{ reportWork.owner_notes }}</p>
          <p v-if="reportWork.rating_comment" style="font-size:13.5px;line-height:1.8;color:#333;"><b>تقييم:</b> {{ reportWork.rating_comment }}</p>
          <p v-if="reportWork.owner_rejection_reason" style="font-size:13.5px;line-height:1.8;color:#B3452F;"><b>سبب الرفض:</b> {{ reportWork.owner_rejection_reason }}</p>
        </div>

        <!-- Attachments -->
        <div v-if="reportWork.attachments?.length" class="report-section">
          <h3>الصور المرفقة ({{ reportWork.attachments.length }})</h3>
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px;">
            <img v-for="(att, i) in reportWork.attachments.filter((a:any) => a.file_type === 'image')"
                 :key="i" :src="att.url"
                 style="width:150px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #ddd;" />
          </div>
        </div>

        <!-- Footer -->
        <div class="report-footer">
          <p>تم إعداد هذا التقرير بواسطة نظام إدارة تحصيلات المستأجرين (TCMS)</p>
          <p>تاريخ الطباعة: {{ new Date().toLocaleDateString('ar-SA') }}</p>
        </div>
      </div>

      <!-- Print Actions (outside print area) -->
      <div class="report-actions no-print">
        <button class="btn btn-ghost" style="background:#fff;" @click="reportWork = null">← رجوع</button>
        <button class="btn btn-primary" @click="printReport">🖨 طباعة / تصدير PDF</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const { manager, auth } = useApi()
const { user } = useAuth()
const showToast = inject<(m: string) => void>('showToast', () => {})

// الـ role المناسب حسب نوع المستخدم
const apiRole = computed<'general-manager' | 'maintenance-supervisor'>(() =>
  user.value?.type === 'maintenance_supervisor' ? 'maintenance-supervisor' : 'general-manager'
)

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',      label: 'الكل' },
  { key: 'pending',  label: 'بانتظار قرار المالك' },
  { key: 'approved', label: 'معتمد' },
  { key: 'rejected', label: 'مرفوض' },
]
const activeTab  = ref('all')
const tabCounts  = ref<Record<string, number>>({})

// ── Works List ────────────────────────────────────────────────────────────────
const loading     = ref(false)
const works       = ref<any[]>([])
const pagination  = ref<any>(null)
const currentPage = ref(1)

async function fetchWorks() {
  loading.value = true
  try {
    const data = await manager.maintenanceWorks({ tab: activeTab.value }, apiRole.value)
    works.value = data.works || []
    pagination.value = data.pagination || null
    if (data.tabs) {
      tabCounts.value = {
        all:      data.tabs.all_count,
        pending:  data.tabs.pending_count,
        approved: data.tabs.approved_count,
        rejected: data.tabs.rejected_count,
      }
    }
  } catch { showToast('تعذّر جلب تقارير الصيانة') } finally {
    loading.value = false
  }
}

async function changePage(p: number) {
  currentPage.value = p
  await fetchWorks()
}

// ── Owners ────────────────────────────────────────────────────────────────────
const owners       = ref<{ id: number; name: string }[]>([])
const loadingOwners = ref(false)

async function fetchOwners() {
  loadingOwners.value = true
  try {
    // جيب الملاك من general-manager/owners
    const data = await manager.owners()
    owners.value = (data.owners || []).map((o: any) => ({ id: o.id, name: o.name }))
  } catch {
    // fallback: auth.usersByType
    try {
      const list = await auth.usersByType('owner')
      owners.value = list.map(o => ({ id: o.id, name: o.name }))
    } catch { showToast('تعذّر جلب قائمة الملاك') }
  } finally {
    loadingOwners.value = false
  }
}

// ── Send Form ─────────────────────────────────────────────────────────────────
const form = reactive({
  owner_id:      '' as number | '',
  property_unit: '',
  title:         '',
  description:   '',
})
const mediaFiles    = ref<File[]>([])
const mediaPreviews = ref<{ type: string; url: string }[]>([])
const sending       = ref(false)

function handleMedia(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  files.forEach(f => {
    if (f.size > 15 * 1024 * 1024) { showToast(`تم تجاهل ${f.name} — الحجم كبير جدًا`); return }
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) { showToast(`نوع غير مدعوم: ${f.name}`); return }
    mediaFiles.value.push(f)
    mediaPreviews.value.push({ type: f.type, url: URL.createObjectURL(f) })
  })
  ;(e.target as HTMLInputElement).value = ''
}

function removeMedia(i: number) {
  URL.revokeObjectURL(mediaPreviews.value[i].url)
  mediaFiles.value.splice(i, 1)
  mediaPreviews.value.splice(i, 1)
}

async function sendMaintenance() {
  if (!form.owner_id)          { showToast('الرجاء اختيار المالك'); return }
  if (!form.property_unit.trim()) { showToast('الرجاء إدخال العقار / الوحدة'); return }
  if (!form.title.trim())      { showToast('الرجاء إدخال عنوان العمل'); return }
  if (!form.description.trim()){ showToast('الرجاء إدخال وصف العمل'); return }

  sending.value = true
  try {
    const fd = new FormData()
    fd.append('owner_id',      String(form.owner_id))
    fd.append('property_unit', form.property_unit.trim())
    fd.append('title',         form.title.trim())
    fd.append('description',   form.description.trim())
    mediaFiles.value.forEach(f => fd.append('attachments[]', f))

    await manager.createMaintenanceWork(fd, apiRole.value)
    showToast('تم إرسال تقرير الصيانة للمالك')

    // reset
    Object.assign(form, { owner_id: '', property_unit: '', title: '', description: '' })
    mediaPreviews.value.forEach(m => URL.revokeObjectURL(m.url))
    mediaFiles.value    = []
    mediaPreviews.value = []
    await fetchWorks()
  } catch (e: any) {
    showToast(e?.message || 'تعذّر إرسال التقرير')
  } finally {
    sending.value = false
  }
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
const detailWork = ref<any>(null)
function openDetail(w: any) { detailWork.value = w }

async function deleteWork(id: number) {
  if (!confirm('هل أنت متأكد من حذف هذا التقرير؟')) return
  try {
    await manager.deleteMaintenanceWork(id, apiRole.value)
    showToast('تم حذف التقرير')
    detailWork.value = null
    await fetchWorks()
  } catch (e: any) {
    showToast(e?.message || 'تعذّر حذف التقرير')
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ownerDecisionBadge(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    pending:  { cls: 'badge-pending',  label: 'بانتظار قرار المالك' },
    approved: { cls: 'badge-approved', label: 'معتمد ومقبول' },
    rejected: { cls: 'badge-rejected', label: 'مرفوض' },
  }
  return map[status] ?? { cls: 'badge-neutral', label: status }
}

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchOwners()
  fetchWorks()
})
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:2px 0 0; color:var(--muted); font-size:13px; }

.card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:20px; }
.card h3 { margin:0 0 16px; font-size:15px; font-weight:800; color:var(--charcoal); }

.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:var(--muted); margin-bottom:6px; font-weight:700; }
.field input,
.field select { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid var(--line); background:var(--bg); color:var(--ink); outline:none; font-family:inherit; font-size:14px; }
.field input:focus, .field select:focus { border-color:var(--orange); background:var(--surface); }
textarea { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid var(--line); background:var(--bg); resize:vertical; min-height:80px; outline:none; font-family:inherit; font-size:14px; color:var(--ink); }
textarea:focus { border-color:var(--orange); background:var(--surface); }

.filepick { border:1.5px dashed var(--line); border-radius:10px; padding:16px; text-align:center; color:var(--muted); font-size:13px; font-weight:700; background:var(--bg); cursor:pointer; transition:.15s; }
.filepick:hover { border-color:var(--orange); color:var(--orange); }
.filepick.has { border-color:var(--success); color:var(--success); background:var(--success-tint); }

.media-remove { position:absolute; top:-7px; left:-7px; width:20px; height:20px; border-radius:50%; background:var(--danger); color:#fff; border:2px solid var(--surface); font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; }

/* Pill tabs */
.pill-tabs { display:flex; gap:8px; flex-wrap:wrap; }
.pill-tab { padding:8px 14px; border-radius:20px; border:1.5px solid var(--line); background:transparent; color:var(--muted); font-weight:700; font-size:13px; cursor:pointer; transition:.15s; display:flex; align-items:center; gap:5px; }
.pill-tab:hover { border-color:var(--orange); color:var(--orange); }
.pill-tab.active { background:var(--charcoal); color:#fff; border-color:var(--charcoal); }
.tab-badge { background:rgba(255,255,255,.25); border-radius:10px; padding:1px 6px; font-size:11px; }
.pill-tab:not(.active) .tab-badge { background:var(--line); color:var(--muted); }

.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:var(--muted); font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid var(--line); white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid var(--line); vertical-align:middle; }
tr:last-child td { border-bottom:none; }
.clickable { cursor:pointer; transition:.12s; }
.clickable:hover td { background:var(--bg); }

.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending  { background:var(--warning-tint); color:var(--warning); }
.badge-approved { background:var(--success-tint); color:var(--success); }
.badge-rejected { background:var(--danger-tint);  color:var(--danger); }
.badge-neutral  { background:var(--orange-tint);   color:var(--orange-dark); }

.empty-state { text-align:center; padding:40px 20px; color:var(--muted); }
.empty-state b { display:block; color:var(--charcoal); font-size:14.5px; margin-bottom:4px; }

.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-primary { background:var(--orange); color:#fff; } .btn-primary:hover:not(:disabled) { background:var(--orange-dark); }
.btn-ghost   { background:transparent; color:var(--charcoal); border:1.5px solid var(--line); } .btn-ghost:hover:not(:disabled) { border-color:var(--charcoal); }
.btn-danger  { background:var(--danger); color:#fff; } .btn-danger:hover { opacity:.85; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:default; }

.modal-overlay { position:fixed; inset:0; background:rgba(46,43,39,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.modal { background:var(--surface); border-radius:16px; padding:26px; width:100%; max-width:560px; max-height:90vh; overflow:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.modal-head h3 { margin:0; font-size:17px; font-weight:800; }
.modal-close { background:var(--bg); border:none; width:30px; height:30px; border-radius:50%; font-size:16px; color:var(--muted); cursor:pointer; }
.modal-actions { display:flex; gap:10px; margin-top:18px; justify-content:flex-end; }

.kv { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; padding:8px 0; border-bottom:1px solid var(--line); font-size:13.5px; }
.kv:last-of-type { border-bottom:none; }
.kv .k { color:var(--muted); font-weight:700; white-space:nowrap; min-width:120px; }
.kv .v { color:var(--charcoal); font-weight:600; text-align:left; }

/* ── Report Page ── */
.report-overlay { align-items:flex-start; overflow-y:auto; padding:20px; background:rgba(0,0,0,.6); }
.report-page {
  background:#fff; width:100%; max-width:800px; margin:0 auto;
  border-radius:12px; padding:40px; font-family:'Cairo', sans-serif;
  direction:rtl; text-align:right; color:#1a1a1a; box-shadow:0 4px 24px rgba(0,0,0,.15);
}
.report-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #E1712F; padding-bottom:20px; margin-bottom:24px; }
.report-header h1 { font-size:16px; font-weight:800; margin:6px 0 0; color:#3A3733; }
.report-header h2 { font-size:18px; font-weight:900; color:#E1712F; margin:0 0 4px; }
.report-logo { font-size:36px; }
.report-section { margin-bottom:24px; }
.report-section h3 { font-size:14px; font-weight:800; color:#E1712F; border-bottom:1.5px solid #E6DFD3; padding-bottom:6px; margin-bottom:12px; }
.report-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.report-item { background:#F8F5F0; border-radius:8px; padding:10px 12px; }
.ri-label { display:block; font-size:11px; color:#8A8479; font-weight:700; margin-bottom:3px; }
.ri-val { display:block; font-size:13.5px; font-weight:800; color:#3A3733; }
.report-footer { border-top:1px solid #E6DFD3; padding-top:16px; margin-top:24px; text-align:center; font-size:11.5px; color:#8A8479; }
.report-actions { display:flex; justify-content:center; gap:12px; margin-top:16px; padding-bottom:20px; }

@media print {
  .no-print { display:none !important; }
  .report-overlay { position:static; background:transparent; padding:0; }
  .report-page { box-shadow:none; border-radius:0; padding:20px; max-width:100%; }
  body > * { display:none; }
  .report-page { display:block !important; }
}
</style>
