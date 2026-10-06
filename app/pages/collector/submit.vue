<template>
  <div>
    <div class="page-title">
      <div><h2>رفع سداد جديد</h2><p>يمكنك التحصيل من مستأجريك فقط — لن يُعتمد السداد إلا بعد موافقة المشرف</p></div>
    </div>

    <div class="card" style="max-width:560px;">
      <!-- Search -->
      <div class="field">
        <label>ابحث عن المستأجر / الوحدة</label>
        <input v-model="searchQ" placeholder="ابحث بالاسم، رقم الجوال، رقم المستأجر أو رقم الوحدة..." />
      </div>

      <!-- Tenant Select -->
      <div class="field">
        <label>المستأجر / العقار والوحدة</label>
        <select v-model="form.tenantId">
          <option value="">اختر المستأجر أو العقار</option>
          <option v-for="t in filteredTenants" :key="t.id" :value="t.id">
            {{ t.name }}{{ t.unit ? ' — ' + t.unit : '' }}
          </option>
        </select>
        <div class="hint">القائمة تعرض مستأجريك المسندين إليك فقط.{{ !myList.length ? ' لم تُسنَد لك محافظ بعد.' : '' }}</div>
      </div>

      <div class="row2">
        <div class="field"><label>المبلغ (ر.س)</label><input v-model.number="form.amount" type="number" placeholder="0" /></div>
        <div class="field"><label>الفترة (الشهر)</label><input v-model="form.month" placeholder="2026-09" /></div>
      </div>

      <!-- Payment Type -->
      <div class="field">
        <label>طريقة السداد</label>
        <div class="radio-group">
          <div class="radio-opt" :class="{ sel: form.type === 'cash' }"     @click="form.type = 'cash'">كاش بالمكتب</div>
          <div class="radio-opt" :class="{ sel: form.type === 'platform' }" @click="form.type = 'platform'">سداد بالمنصة</div>
          <div class="radio-opt" :class="{ sel: form.type === 'transfer' }" @click="form.type = 'transfer'">تحويل بنكي</div>
        </div>
        <div class="hint">{{ form.type === 'cash' ? 'مطلوب: رقم الإيصال' : 'مطلوب: رقم الإيصال أو صورة الإيصال' }}</div>
      </div>

      <!-- Receipt Number -->
      <div class="field">
        <label>رقم الإيصال{{ form.type === 'cash' ? ' (إلزامي)' : ' (اختياري إن رفعت صورة)' }}</label>
        <input v-model="form.receiptNumber" placeholder="رقم الإيصال" />
      </div>

      <!-- Image Upload (non-cash) -->
      <div v-if="form.type !== 'cash'" class="field">
        <label>صورة أو ملف PDF للإيصال</label>
        <div class="filepick" :class="{ has: !!imagePreview }" @click="$refs.imgFile.click()">
          {{ imagePreview ? `تم اختيار: ${imageFileName} ✓ (اضغط للتغيير)` : 'اضغط لاختيار صورة أو ملف PDF' }}
        </div>
        <input ref="imgFile" type="file" accept="image/*,application/pdf,.pdf" style="display:none;" @change="handleImage" />
        <div class="hint">الحد الأقصى 5MB</div>
      </div>

      <button class="btn btn-primary" style="width:100%;margin-top:6px;" @click="submit">إرسال للمراجعة</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'

const { state, load, save, uid, monthKey, myTenants, getTenant } = useAppState()
onMounted(load)

const session   = inject<Ref<{ id: string; name: string }>>('collectorSession', ref({ id: '', name: '' }))
const showToast = inject<(m: string) => void>('showToast', () => {})
const router    = useRouter()

const searchQ      = ref('')
const imagePreview = ref<string | null>(null)
const imageFileName = ref('')

const form = reactive({ tenantId: '', amount: 0, month: monthKey(), type: 'cash', receiptNumber: '' })

const myList = computed(() => myTenants(session.value.id))
const filteredTenants = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return myList.value
  return myList.value.filter(t =>
    t.name.toLowerCase().includes(q) || (t.phone || '').includes(q) ||
    (t.tenantNumber || '').toLowerCase().includes(q) || (t.unit || '').toLowerCase().includes(q)
  )
})

function handleImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
  if (file.size > 5 * 1024 * 1024) { showToast('حجم الملف كبير جدًا (الحد الأقصى 5MB)'); return }
  const okType = file.type.startsWith('image/') || file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (!okType) { showToast('الرجاء اختيار صورة أو ملف PDF فقط'); return }
  const reader = new FileReader()
  reader.onload = ev => { imagePreview.value = ev.target!.result as string; imageFileName.value = file.name }
  reader.readAsDataURL(file)
}

async function submit() {
  if (!form.tenantId)              { showToast('الرجاء اختيار المستأجر'); return }
  if (!form.amount || form.amount <= 0) { showToast('الرجاء إدخال مبلغ صحيح'); return }
  if (form.type === 'cash' && !form.receiptNumber.trim())         { showToast('كاش بالمكتب يتطلب رقم الإيصال'); return }
  if (form.type !== 'cash' && !form.receiptNumber.trim() && !imagePreview.value) { showToast('يتطلب رقم الإيصال أو صورة الإيصال'); return }

  const tn = getTenant(form.tenantId)
  state.value.payments.push({
    id: uid(), tenantId: form.tenantId, collectorId: session.value.id,
    ownerId: tn?.ownerId || null, unit: tn?.unit || '',
    type: form.type, receiptNumber: form.receiptNumber.trim() || null,
    image: imagePreview.value, imageName: imageFileName.value || null,
    amount: form.amount, month: form.month,
    submittedAt: new Date().toISOString(), status: 'pending', comments: [],
  })
  save()
  showToast('تم إرسال السداد للمراجعة')
  // reset
  form.tenantId = ''; form.amount = 0; form.month = monthKey(); form.type = 'cash'; form.receiptNumber = ''
  imagePreview.value = null; imageFileName.value = ''
  router.push('/collector/payments')
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:#8A8479; margin-bottom:6px; font-weight:700; }
input, select { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; color:#2E2B27; outline:none; font-family:inherit; font-size:14px; }
input:focus, select:focus { border-color:#E1712F; background:#fff; }
.row2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media(max-width:520px){ .row2{grid-template-columns:1fr;} }
.radio-group { display:flex; gap:8px; flex-wrap:wrap; }
.radio-opt { border:1.5px solid #E6DFD3; border-radius:10px; padding:9px 14px; font-weight:700; font-size:13px; color:#8A8479; flex:1; text-align:center; min-width:100px; cursor:pointer; transition:.15s; }
.radio-opt.sel { border-color:#E1712F; background:#FBE9DC; color:#B85423; }
.filepick { border:1.5px dashed #E6DFD3; border-radius:10px; padding:16px; text-align:center; color:#8A8479; font-size:13px; font-weight:700; background:#F3EFE8; cursor:pointer; transition:.15s; }
.filepick:hover { border-color:#E1712F; color:#B85423; }
.filepick.has { border-color:#3F7D52; color:#3F7D52; background:#E4F1E7; }
.hint { font-size:11.5px; color:#8A8479; margin-top:5px; }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-primary { background:#E1712F; color:#fff; width:100%; } .btn-primary:hover { background:#B85423; }
</style>
