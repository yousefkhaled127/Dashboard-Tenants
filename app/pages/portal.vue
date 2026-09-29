<template>
  <div class="portal-screen">
    <div class="portal-wrap">

      <!-- Header -->
      <div class="portal-header">
        <div class="portal-header-brand">
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
            <path d="M50 8 L84 30 V38 L50 17 L16 38 V30 Z" fill="#3A3733"/>
            <path d="M12 42 L50 18 L88 42 V54 L50 30 L12 54 Z" fill="#E1712F"/>
            <path d="M29 50 L46 40 V70 L29 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
            <path d="M71 50 L54 40 V70 L71 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
            <rect x="46" y="42" width="8" height="46" fill="#3A3733"/>
            <rect x="44" y="30" width="6" height="6" fill="#3A3733"/>
            <rect x="52" y="30" width="6" height="6" fill="#3A3733"/>
          </svg>
          <div>
            <div class="portal-header-title">بوابة طلبات الصيانة</div>
            <div class="portal-header-sub">متاحة لجميع المستأجرين</div>
          </div>
        </div>
        <button class="btn-back" @click="navigateTo('/')">‹ رجوع لتسجيل الدخول الرئيسي</button>
      </div>

      <!-- Submit Form -->
      <div class="card">
        <h3>رفع طلب صيانة جديد</h3>

        <div v-if="formError" class="form-error">{{ formError }}</div>
        <div v-if="formSuccess" class="form-success">{{ formSuccess }}</div>

        <div class="field">
          <label>اسم المستأجر</label>
          <input v-model="form.name" placeholder="اسمك الكامل" />
        </div>

        <div class="row2">
          <div class="field">
            <label>اسم المالك</label>
            <select v-model="form.owner">
              <option value="">اختر المالك</option>
              <option v-for="o in owners" :key="o.id" :value="o.name">{{ o.name }}</option>
            </select>
          </div>
          <div class="field">
            <label>رقم الوحدة</label>
            <input v-model="form.unit" placeholder="مثال: برج الأمل - وحدة 12" />
          </div>
        </div>

        <div class="row2">
          <div class="field">
            <label>رقم هوية المستأجر</label>
            <input v-model="form.idNumber" placeholder="رقم الهوية / الإقامة" />
          </div>
          <div class="field">
            <label>تاريخ ميلاد المستأجر</label>
            <input v-model="form.birthDate" type="date" />
          </div>
        </div>

        <div class="field">
          <label>رقم جوال المستأجر</label>
          <input v-model="form.phone" placeholder="05xxxxxxxx" type="tel" />
        </div>

        <div class="field">
          <label>عنوان الطلب</label>
          <input v-model="form.title" placeholder="مثال: تسريب مياه في المطبخ" />
        </div>

        <div class="field">
          <label>وصف المشكلة</label>
          <textarea v-model="form.description" placeholder="اشرح المشكلة بالتفصيل..." />
        </div>

        <div class="field">
          <label>صور أو فيديوهات (اختياري، الحد الأقصى 15MB لكل ملف)</label>
          <div
            class="filepick"
            :class="{ has: media.length > 0 }"
            @click="triggerFile"
          >
            <span v-if="media.length">تم اختيار {{ media.length }} ملف ✓ (اضغط للإضافة)</span>
            <span v-else>اضغط لإرفاق صور أو فيديو للمشكلة</span>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*,video/*"
            multiple
            style="display:none"
            @change="handleFiles"
          />
          <!-- Previews -->
          <div v-if="media.length" class="media-row">
            <div v-for="(m, i) in media" :key="i" class="media-thumb-wrap">
              <video v-if="m.type.startsWith('video')" :src="m.data" class="media-thumb" />
              <img v-else :src="m.data" class="media-thumb" />
              <button class="media-remove" @click="media.splice(i, 1)">×</button>
            </div>
          </div>
        </div>

        <div class="hint">
          لن يتم اعتماد الطلب من المشرف إلا بعد إرفاق: الاسم، رقم الهوية، تاريخ الميلاد، رقم الجوال، اسم المالك، ورقم الوحدة كاملةً.
        </div>

        <button class="btn-submit" @click="submitRequest">إرسال الطلب للمشرف</button>
      </div>

      <!-- Track Status -->
      <div class="card" style="margin-top:16px;">
        <h3>تتبع حالة طلباتك</h3>
        <div class="row2">
          <div class="field">
            <label>رقم الهوية</label>
            <input v-model="trackId" placeholder="رقم الهوية / الإقامة" />
          </div>
          <div class="field">
            <label>رقم الجوال</label>
            <input v-model="trackPhone" placeholder="05xxxxxxxx" />
          </div>
        </div>

        <template v-if="trackId && trackPhone">
          <template v-if="trackedRequests.length">
            <div
              v-for="r in trackedRequests"
              :key="r.id"
              class="track-item"
              :style="`border-right-color:${r.status === 'approved' ? '#3F7D52' : r.status === 'rejected' ? '#B3452F' : '#B8791E'}`"
            >
              <div class="track-item-top">
                <b>{{ r.title || 'طلب صيانة' }}</b>
                <span class="badge" :class="`badge-${r.status}`">{{ statusLabel(r.status) }}</span>
              </div>
              <div v-if="r.description" class="track-item-desc">{{ r.description }}</div>
              <div class="track-item-meta">
                {{ fmtDate(r.requestedAt) }}{{ r.media?.length ? ` · ${r.media.length} ملف` : '' }}
              </div>
              <div v-if="r.status !== 'pending' && r.supervisorNote" class="track-item-note">
                ملاحظة المشرف: {{ r.supervisorNote }}
              </div>
            </div>
          </template>
          <p v-else class="muted-text">لا توجد طلبات مطابقة لهذه البيانات</p>
        </template>
        <p v-else class="muted-text">أدخل رقم الهوية والجوال لعرض حالة طلباتك</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
// ===== OWNERS LIST (static for now) =====
const owners = [
  { id: 'own1', name: 'المالك الأول' },
  { id: 'own2', name: 'المالك الثاني' },
]

// ===== STORAGE KEY =====
const STORAGE_KEY = 'portal-maintenance-requests'

// ===== STATE =====
const form = reactive({
  name: '', owner: '', unit: '', idNumber: '',
  birthDate: '', phone: '', title: '', description: ''
})

const media = ref<{ type: string; data: string; name: string }[]>([])
const formError   = ref('')
const formSuccess = ref('')
const fileInput   = ref<HTMLInputElement | null>(null)

const trackId    = ref('')
const trackPhone = ref('')

// ===== REQUESTS (localStorage) =====
const requests = ref<any[]>([])

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) requests.value = JSON.parse(raw)
  } catch {}
})

function saveRequests() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests.value))
}

// ===== TRACK =====
const trackedRequests = computed(() => {
  const id = trackId.value.trim().toLowerCase()
  const ph = trackPhone.value.trim().replace(/\D/g, '')
  if (!id || !ph) return []
  return requests.value
    .filter(r => r.idNumber?.trim().toLowerCase() === id && r.phone?.replace(/\D/g, '') === ph)
    .sort((a: any, b: any) => b.requestedAt.localeCompare(a.requestedAt))
})

// ===== FILE UPLOAD =====
function triggerFile() {
  fileInput.value?.click()
}

function handleFiles(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  if (!files.length) return
  const maxSize = 15 * 1024 * 1024
  files.forEach(f => {
    if (!f.type.startsWith('image/') && !f.type.startsWith('video/')) return
    if (f.size > maxSize) return
    const reader = new FileReader()
    reader.onload = ev => {
      media.value.push({ type: f.type, data: ev.target!.result as string, name: f.name })
    }
    reader.readAsDataURL(f)
  })
  if (fileInput.value) fileInput.value.value = ''
}

// ===== SUBMIT =====
function submitRequest() {
  formError.value   = ''
  formSuccess.value = ''

  if (!form.name.trim() || !form.owner || !form.unit.trim() ||
      !form.idNumber.trim() || !form.birthDate || !form.phone.trim() || !form.title.trim()) {
    formError.value = 'لا يمكن إرسال الطلب إلا بعد تعبئة: اسم المستأجر، اسم المالك، رقم الوحدة، رقم الهوية، تاريخ الميلاد، رقم الجوال، وعنوان الطلب.'
    return
  }

  const req = {
    id:           Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    requesterName: form.name.trim(),
    owner:        form.owner,
    unit:         form.unit.trim(),
    idNumber:     form.idNumber.trim(),
    birthDate:    form.birthDate,
    phone:        form.phone.trim(),
    title:        form.title.trim(),
    description:  form.description.trim(),
    media:        media.value,
    status:       'pending',
    supervisorNote: '',
    requestedAt:  new Date().toISOString(),
  }

  requests.value.push(req)
  saveRequests()

  // set track fields so tenant sees request immediately
  trackId.value    = form.idNumber.trim()
  trackPhone.value = form.phone.trim()

  // reset form
  Object.assign(form, { name: '', owner: '', unit: '', idNumber: '', birthDate: '', phone: '', title: '', description: '' })
  media.value = []

  formSuccess.value = '✅ تم إرسال طلب الصيانة للمشرف بنجاح'
  setTimeout(() => formSuccess.value = '', 4000)
}

// ===== HELPERS =====
function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ar-SA-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusLabel(s: string) {
  return ({ pending: 'بانتظار المراجعة', approved: 'معتمد', rejected: 'مرفوض' } as any)[s] || s
}
</script>

<style scoped>
.portal-screen {
  min-height: 100vh;
  background:
    radial-gradient(circle at 15% 15%, rgba(225,113,47,.08), transparent 40%),
    radial-gradient(circle at 85% 85%, rgba(58,55,51,.06), transparent 40%),
    #F3EFE8;
  padding: 32px 16px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.portal-wrap {
  width: 100%;
  max-width: 640px;
}

/* Header */
.portal-header {
  background: #fff;
  border: 1px solid #E6DFD3;
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.portal-header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.portal-header-title {
  font-weight: 800;
  font-size: 15px;
  color: #3A3733;
}
.portal-header-sub {
  font-size: 12px;
  color: #8A8479;
  margin-top: 2px;
}
.btn-back {
  background: transparent;
  border: 1.5px solid #E6DFD3;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12.5px;
  font-weight: 700;
  color: #3A3733;
  cursor: pointer;
  transition: .15s;
}
.btn-back:hover { border-color: #3A3733; }

/* Card */
.card {
  background: #fff;
  border: 1px solid #E6DFD3;
  border-radius: 14px;
  padding: 22px 20px;
}
.card h3 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 800;
  color: #3A3733;
}

/* Fields */
.field { margin-bottom: 14px; }
.field label {
  display: block;
  font-size: 13px;
  color: #8A8479;
  margin-bottom: 6px;
  font-weight: 700;
}
.field input,
.field select,
textarea {
  width: 100%;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid #E6DFD3;
  background: #F3EFE8;
  color: #2E2B27;
  outline: none;
  transition: .15s;
  font-family: inherit;
  font-size: 14px;
}
.field input:focus,
.field select:focus,
textarea:focus {
  border-color: #E1712F;
  background: #fff;
}
textarea {
  resize: vertical;
  min-height: 80px;
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 520px) { .row2 { grid-template-columns: 1fr; } }

/* File Picker */
.filepick {
  border: 1.5px dashed #E6DFD3;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  color: #8A8479;
  font-size: 13px;
  font-weight: 700;
  background: #F3EFE8;
  cursor: pointer;
  transition: .15s;
}
.filepick:hover { border-color: #E1712F; color: #B85423; }
.filepick.has   { border-color: #3F7D52; color: #3F7D52; background: #E4F1E7; }

.media-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.media-thumb-wrap { position: relative; }
.media-thumb {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #E6DFD3;
  display: block;
}
.media-remove {
  position: absolute;
  top: -7px;
  left: -7px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #B3452F;
  color: #fff;
  border: 2px solid #fff;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.hint {
  font-size: 11.5px;
  color: #8A8479;
  margin-bottom: 12px;
  line-height: 1.6;
}

/* Alerts */
.form-error {
  background: #F7E7E2;
  color: #B3452F;
  border-radius: 9px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 14px;
}
.form-success {
  background: #E4F1E7;
  color: #3F7D52;
  border-radius: 9px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 14px;
}

/* Submit Button */
.btn-submit {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: #E1712F;
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: .15s;
}
.btn-submit:hover { background: #B85423; }

/* Track */
.track-item {
  background: #F3EFE8;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 10px;
  border-right: 3px solid #B8791E;
}
.track-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}
.track-item-desc {
  font-size: 12.5px;
  margin-top: 4px;
  color: #3A3733;
}
.track-item-meta {
  font-size: 11px;
  color: #8A8479;
  margin-top: 4px;
}
.track-item-note {
  font-size: 12px;
  color: #8A8479;
  margin-top: 4px;
}

/* Badge */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11.5px;
  font-weight: 800;
}
.badge-pending  { background: #FBEEDA; color: #B8791E; }
.badge-approved { background: #E4F1E7; color: #3F7D52; }
.badge-rejected { background: #F7E7E2; color: #B3452F; }

.muted-text { font-size: 12.5px; color: #8A8479; margin-top: 6px; }
</style>
