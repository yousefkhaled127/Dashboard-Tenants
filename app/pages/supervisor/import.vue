<template>
  <div>
    <div class="page-title"><div><h2>استيراد عبر إكسل</h2><p>أضف المستأجرين دفعة واحدة عبر ملف إكسل</p></div></div>

    <div class="grid grid-2">
      <div class="card">
        <h3>رفع ملف مستأجرين جدد</h3>
        <p class="hint">أعمدة الملف: <b>رقم المستأجر</b>، <b>اسم المستأجر</b>، <b>رقم الجوال</b>، <b>العقار والوحدة</b>، <b>تاريخ الاستحقاق</b> (YYYY-MM-DD)، <b>المحصل</b>، <b>المالك</b> (اختياري)، <b>الهدف الشهري</b>، <b>ملاحظات</b>.</p>

        <div class="filepick" :class="{ has: !!selectedFile }" @click="$refs.fileInput.click()">
          {{ selectedFile ? `تم اختيار: ${selectedFile.name} ✓` : 'اضغط لاختيار ملف إكسل (.xlsx, .xls, .csv)' }}
        </div>
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" style="display:none;" @change="handleFile" />

        <div style="display:flex;gap:10px;margin-top:14px;">
          <button class="btn btn-ghost btn-sm" @click="downloadTemplate">تحميل نموذج فارغ</button>
          <button class="btn btn-primary btn-sm" :disabled="!selectedFile || importing" @click="doImport">
            {{ importing ? 'جارٍ الاستيراد...' : 'تأكيد الاستيراد' }}
          </button>
        </div>

        <template v-if="importResult">
          <div class="result-box" style="margin-top:16px;">
            <div style="font-weight:800;font-size:14px;margin-bottom:8px;">نتيجة الاستيراد</div>
            <div class="kv"><span>إجمالي الصفوف</span><span>{{ importResult.total }}</span></div>
            <div class="kv"><span>تمت الإضافة</span><span class="ok">{{ importResult.imported }}</span></div>
            <div class="kv"><span>تم التحديث</span><span>{{ importResult.updated }}</span></div>
            <div class="kv"><span>فشل</span><span :class="{ err: importResult.failed > 0 }">{{ importResult.failed }}</span></div>
            <template v-if="importResult.errors.length">
              <div style="margin-top:10px;font-size:12.5px;color:#B3452F;">
                <div v-for="(e, i) in importResult.errors" :key="i">• {{ e }}</div>
              </div>
            </template>
          </div>
        </template>
      </div>

      <div class="card">
        <h3>ملاحظات هامة</h3>
        <p class="hint" style="line-height:1.9;">
          • عمود «المحصل» يجب أن يطابق الاسم المسجل بالنظام تمامًا.<br>
          • عمود «المالك» اختياري — يربط المستأجر بمالك مسجل.<br>
          • إذا أُدخل الهدف الشهري مع تاريخ الاستحقاق تُنشأ مطالبة للشهر الحالي.<br>
          • لا يتم استبدال أي مستأجر موجود مسبقًا.<br>
          • الحد الأقصى لحجم الملف 5MB.<br>
          • الصيغ المدعومة: .xlsx, .xls, .csv
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type ImportResult } from '~/composables/useApi'

const { supervisor } = useApi()
const showToast = inject<(m: string) => void>('showToast', () => {})

const selectedFile = ref<File | null>(null)
const importing = ref(false)
const importResult = ref<ImportResult | null>(null)

function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { showToast('حجم الملف كبير جدًا (الحد الأقصى 5MB)'); return }
  selectedFile.value = file
  importResult.value = null
}

function downloadTemplate() {
  // فتح رابط التحميل في نافذة جديدة مع التوكن
  const token = useCookie<string>('tahsilat-token')
  const link = supervisor.importTemplate()
  // نستخدم fetch مع auth لتحميل الملف
  fetch(link, { headers: { Authorization: `Bearer ${token.value}` } })
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'نموذج_استيراد_المستأجرين.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    })
    .catch(() => showToast('تعذّر تحميل النموذج'))
}

async function doImport() {
  if (!selectedFile.value) return
  importing.value = true
  importResult.value = null
  try {
    const fd = new FormData()
    fd.append('file', selectedFile.value)
    importResult.value = await supervisor.importExcel(fd)
    showToast('تم الاستيراد بنجاح')
    selectedFile.value = null
  } catch (e: any) {
    const msg = e?.data?.message || 'تعذّر استيراد الملف'
    showToast(msg)
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.grid{display:grid;gap:16px;}
.grid-2{grid-template-columns:1fr 1fr;}
@media(max-width:900px){.grid-2{grid-template-columns:1fr;}}
.card{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:20px;}
.card h3{margin:0 0 14px;font-size:15px;font-weight:800;color:#3A3733;}
.hint{font-size:12.5px;color:#8A8479;}
.filepick{border:1.5px dashed #E6DFD3;border-radius:10px;padding:18px;text-align:center;color:#8A8479;font-size:13px;font-weight:700;background:#F3EFE8;cursor:pointer;transition:.15s;}
.filepick:hover{border-color:#E1712F;color:#B85423;}
.filepick.has{border-color:#3F7D52;color:#3F7D52;background:#E4F1E7;}
.result-box{background:#F3EFE8;border-radius:10px;padding:14px;}
.kv{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #E6DFD3;}
.kv:last-child{border-bottom:none;}
.kv .ok{color:#3F7D52;font-weight:800;}
.kv .err{color:#B3452F;font-weight:800;}
.btn{border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.15s;}
.btn-ghost{background:transparent;color:#3A3733;border:1.5px solid #E6DFD3;}.btn-ghost:hover:not(:disabled){border-color:#3A3733;}
.btn-primary{background:#E1712F;color:#fff;}.btn-primary:hover:not(:disabled){background:#B85423;}
.btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
.btn:disabled{opacity:.6;cursor:default;}
</style>
