<template>
  <div class="report-shell">
    <!-- Top Bar -->
    <div class="top-bar no-print">
      <button class="btn-back" @click="$router.back()">← رجوع</button>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:13px;color:#8A8479;">معاينة قابلة للطباعة أو الحفظ كملف PDF</span>
        <button class="btn-pdf" @click="printPage">🖨 طباعة / تصدير PDF</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="text-align:center;padding:80px;color:#8A8479;font-size:14px;">
      جارٍ تحميل التقرير...
    </div>

    <!-- Error -->
    <div v-else-if="error" style="text-align:center;padding:80px;color:#B3452F;font-size:14px;">
      {{ error }}
    </div>

    <!-- Report Page -->
    <div v-else-if="work" class="report-page" id="report-print-area">

      <!-- Report Title -->
      <div class="report-header">
        <div style="display:flex;align-items:center;gap:14px;">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
            <path d="M50 8 L84 30 V38 L50 17 L16 38 V30 Z" fill="#3A3733"/>
            <path d="M12 42 L50 18 L88 42 V54 L50 30 L12 54 Z" fill="#E1712F"/>
            <path d="M29 50 L46 40 V70 L29 78 Z" fill="none" stroke="#E1712F" stroke-width="5"/>
            <path d="M71 50 L54 40 V70 L71 78 Z" fill="none" stroke="#E1712F" stroke-width="5"/>
            <rect x="46" y="42" width="8" height="46" fill="#3A3733"/>
          </svg>
          <div>
            <div class="org-name">مؤسسة سعود علي السقامي للعقارات</div>
            <div class="report-subtitle">تقرير أعمال صيانة</div>
          </div>
        </div>
        <div style="text-align:left;">
          <div class="work-number">{{ work.work_order_number }}</div>
          <div style="font-size:12px;color:#8A8479;margin-top:4px;">{{ work.created_at_formatted || '' }}</div>
        </div>
      </div>

      <!-- Section: Work Info -->
      <div class="section">
        <div class="section-title">بيانات العمل</div>
        <div class="info-grid">
          <div class="info-card">
            <div class="info-label">العقار / الوحدة</div>
            <div class="info-value">{{ work.property_unit || '—' }}</div>
          </div>
          <div class="info-card">
            <div class="info-label">المالك</div>
            <div class="info-value">{{ work.owner?.name || '—' }}</div>
          </div>
          <div class="info-card">
            <div class="info-label">عنوان العمل</div>
            <div class="info-value">{{ work.title || '—' }}</div>
          </div>
          <div class="info-card">
            <div class="info-label">تاريخ التنفيذ</div>
            <div class="info-value">{{ work.created_at_formatted || '—' }}</div>
          </div>
          <div class="info-card">
            <div class="info-label">تقييم المالك</div>
            <div class="info-value">{{ work.rating ? '★'.repeat(work.rating) + ` (${work.rating}/5)` : 'لم يقيّم بعد' }}</div>
          </div>
          <div class="info-card">
            <div class="info-label">قرار المالك</div>
            <div class="info-value">
              <span :style="decisionStyle(work.status)">{{ ownerDecisionLabel(work.status) }}</span>
            </div>
          </div>
          <div class="info-card">
            <div class="info-label">صادر عن</div>
            <div class="info-value">{{ work.creator?.name || 'المشرف العام' }}</div>
          </div>
        </div>
      </div>

      <!-- Section: Description -->
      <div class="section">
        <div class="section-title">وصف أعمال الصيانة المنفذة</div>
        <div class="description-box">
          {{ work.description || 'لا يوجد وصف مضاف' }}
        </div>
      </div>

      <!-- Section: Owner Notes -->
      <div v-if="work.owner_notes || work.owner_rejection_reason || work.rating_comment" class="section">
        <div class="section-title">قرار المالك وملاحظاته</div>
        <div class="description-box">
          <div v-if="work.owner_notes"><b>ملاحظات:</b> {{ work.owner_notes }}</div>
          <div v-if="work.rating_comment" style="margin-top:6px;"><b>تعليق التقييم:</b> {{ work.rating_comment }}</div>
          <div v-if="work.owner_rejection_reason" style="margin-top:6px;color:#B3452F;"><b>سبب الرفض:</b> {{ work.owner_rejection_reason }}</div>
        </div>
      </div>

      <!-- Section: Attachments -->

      <!-- Section: Attachments -->
<div class="section">
  <div class="section-title">الصور المرفقة</div>

  <div v-if="allAttachments.length" class="attachments-grid">

    <template v-for="(att, i) in allAttachments" :key="i">

      <!-- Image -->
      <a
        v-if="att.type === 'image'"
        :href="att.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          :src="att.url"
          :alt="att.name || 'صورة مرفقة'"
          class="attachment-img"
          @error="(e) => console.error('Image error:', att.url, e)"
        />
      </a>

      <!-- Video -->
      <video
        v-else-if="att.type === 'video'"
        :src="att.url"
        controls
        class="attachment-img"
      />

    </template>

  </div>

  <div v-else class="empty-attach">
    لا توجد مرفقات
  </div>
</div>

      <!-- Footer -->
      <div class="report-footer">
        <div>نظام إدارة تحصيلات المستأجرين — TCMS</div>
        <div>تاريخ الطباعة: {{ printDate }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'

const route  = useRoute()
const router = useRouter()
const { manager } = useApi()

const loading = ref(true)
const error   = ref('')
const work    = ref<any>(null)

const imageAttachments = computed(() =>
  (work.value?.attachments || []).filter((a: any) => {
    // قبول أي attachment فيه url
    if (!a.url) return false
    const ft = (a.file_type || '').toLowerCase()
    const mt = (a.mime_type || '').toLowerCase()
    const name = (a.name || a.path || '').toLowerCase()
    // لو صراحةً مش صورة (فيديو أو PDF) — اعرضه كـ icon
    // لو مش معروف — افترض إنه صورة
    if (ft === 'video' || mt.startsWith('video/')) return false
    return true
  })
)

const videoAttachments = computed(() =>
  (work.value?.attachments || []).filter((a: any) => {
    const ft = (a.file_type || '').toLowerCase()
    const mt = (a.mime_type || '').toLowerCase()
    return ft === 'video' || mt.startsWith('video/')
  })
)

const allAttachments = computed(() => work.value?.attachments || [])

const printDate = computed(() =>
  new Date().toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' })
)

async function fetchWork() {
  loading.value = true
  error.value   = ''
  try {
    // جرب الـ show endpoint أولاً
    const data = await manager.showMaintenanceWork(Number(route.params.id))
    work.value = data
console.log('Work Data:', data)
console.log('Attachments:', data?.attachments)
console.table(data?.attachments)
    // لو الـ show endpoint مش بيرجع attachments، جيبها من الـ list
    if (!data?.attachments?.length && data?.files_count > 0) {
      try {
        const listData = await manager.maintenanceWorks({ tab: 'all' })
        const fromList = (listData.works || []).find((w: any) => w.id === Number(route.params.id))
        if (fromList?.attachments?.length) {
          work.value = { ...data, attachments: fromList.attachments }
        }
      } catch { /* تجاهل */ }
    }
  } catch (e: any) {
    // لو الـ show endpoint فشل، جرب الـ list
    try {
      const listData = await manager.maintenanceWorks({ tab: 'all' })
      const fromList = (listData.works || []).find((w: any) => w.id === Number(route.params.id))
      if (fromList) {
        work.value = fromList
      } else {
        error.value = 'لم يتم العثور على التقرير'
      }
    } catch {
      error.value = e?.message || 'تعذّر تحميل بيانات التقرير'
    }
  } finally {
    loading.value = false
  }
}

function ownerDecisionLabel(status: string) {
  const map: Record<string, string> = {
    pending:  'بانتظار قراركم',
    approved: 'معتمد ومقبول',
    rejected: 'مرفوض',
  }
  return map[status] ?? status
}

function decisionStyle(status: string) {
  if (status === 'approved') return 'color:#3F7D52;font-weight:800;'
  if (status === 'rejected') return 'color:#B3452F;font-weight:800;'
  return 'color:#B8791E;font-weight:800;'
}

function printPage() {
  window.print()
}

onMounted(fetchWork)
</script>

<style scoped>
/* Shell */
.report-shell {
  min-height: 100vh;
  background: #F3EFE8;
  padding: 0;
}

/* Top Bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #E6DFD3;
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}
.btn-back {
  background: transparent;
  border: 1.5px solid #E6DFD3;
  border-radius: 9px;
  padding: 8px 16px;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  color: #3A3733;
  font-family: inherit;
}
.btn-back:hover { border-color: #3A3733; }
.btn-pdf {
  background: #E1712F;
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 9px 18px;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
}
.btn-pdf:hover { background: #B85423; }

/* Report Page */
.report-page {
  max-width: 820px;
  margin: 28px auto;
  background: #fff;
  border-radius: 14px;
  padding: 40px 44px;
  box-shadow: 0 4px 28px rgba(46,43,39,.1);
  direction: rtl;
  text-align: right;
}

/* Header */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 3px solid #E1712F;
  padding-bottom: 22px;
  margin-bottom: 28px;
}
.org-name   { font-size: 15px; font-weight: 900; color: #3A3733; }
.report-subtitle { font-size: 13px; color: #8A8479; margin-top: 3px; }
.work-number { font-size: 17px; font-weight: 900; color: #E1712F; direction: ltr; }

/* Sections */
.section { margin-bottom: 26px; }
.section-title {
  font-size: 14px;
  font-weight: 800;
  color: #3A3733;
  background: #F3EFE8;
  border-right: 4px solid #E1712F;
  padding: 8px 12px;
  border-radius: 0 8px 8px 0;
  margin-bottom: 14px;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.info-card {
  background: #F8F5F0;
  border-radius: 10px;
  padding: 12px 14px;
  border: 1px solid #E6DFD3;
}
.info-label { font-size: 11.5px; color: #8A8479; font-weight: 700; margin-bottom: 5px; }
.info-value { font-size: 14px; font-weight: 800; color: #3A3733; }

/* Description */
.description-box {
  background: #F8F5F0;
  border-radius: 10px;
  padding: 16px 18px;
  font-size: 13.5px;
  line-height: 1.8;
  color: #3A3733;
  border: 1px solid #E6DFD3;
  min-height: 60px;
}
.empty-attach { color: #8A8479; font-size: 13px; padding: 16px 0; }

/* Attachments */
.attachments-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.attachment-img {
  width: 160px;
  height: 130px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #E6DFD3;
}

/* Footer */
.report-footer {
  border-top: 1px solid #E6DFD3;
  margin-top: 28px;
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  font-size: 11.5px;
  color: #8A8479;
}
.attachments-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.attachments-grid a {
  display: block;
}

.attachment-img {
  width: 160px;
  height: 130px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #E6DFD3;
  display: block;
}
/* Print */
@media print {
  .no-print { display: none !important; }
  .report-shell { background: #fff; }
  .report-page {
    margin: 0;
    box-shadow: none;
    border-radius: 0;
    padding: 20px 28px;
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .info-grid { grid-template-columns: 1fr 1fr; }
  .report-page { padding: 22px 16px; }
  .report-header { flex-direction: column; gap: 12px; }
}
</style>
