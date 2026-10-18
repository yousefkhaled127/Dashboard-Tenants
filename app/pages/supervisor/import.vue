<template>
  <div>
    <div class="page-title">
      <div><h2>استيراد عبر إكسل</h2><p>أضف المستأجرين أو مطالبات الاستحقاق لمحافظ المحصلين دفعة واحدة</p></div>
    </div>

    <!-- Tabs -->
    <div class="pill-tabs" style="margin-bottom:16px;">
      <button class="pill-tab" :class="{ active: activeTab==='tenants' }" @click="activeTab='tenants'; resetAll()">استيراد المستأجرين</button>
      <button class="pill-tab" :class="{ active: activeTab==='dues' }" @click="activeTab='dues'; resetAll()">استيراد المطالبات (الاستحقاقات)</button>
    </div>

    <div class="grid grid-2">
      <!-- LEFT: upload + preview -->
      <div class="card">
        <h3>رفع ملف {{ activeTab==='tenants' ? 'مستأجرين جدد' : 'مطالبات' }}</h3>

        <p v-if="activeTab==='tenants'" class="hint" style="margin-bottom:12px;">
          أعمدة الملف: <b>رقم المستأجر</b>، <b>اسم المستأجر</b>، <b>رقم الجوال</b>، <b>العقار والوحدة</b>، <b>تاريخ الاستحقاق</b> (YYYY-MM-DD)، <b>المحصل</b>، <b>المالك</b> (اختياري)، <b>الهدف الشهري</b>، <b>ملاحظات</b>.
        </p>
        <p v-else class="hint" style="margin-bottom:12px;">
          أعمدة الملف: <b>اسم المستأجر</b>، <b>الفترة</b> (مثال 2026-09)، <b>تاريخ الاستحقاق</b> (YYYY-MM-DD)، <b>المبلغ</b>.
        </p>

        <!-- File picker -->
        <div class="filepick" :class="{ has: !!selectedFile }" @click="fileInput?.click()">
          <span v-if="parsing">⏳ جارٍ قراءة الملف...</span>
          <span v-else-if="selectedFile">تم اختيار: {{ fileName }} ✓ (اضغط للتغيير)</span>
          <span v-else>اضغط لاختيار ملف إكسل (.xlsx, .xls, .csv)</span>
        </div>
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" style="display:none;" @change="handleFile" />

        <!-- Buttons -->
        <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" @click="downloadTemplate">⬇ تحميل نموذج فارغ</button>
          <button v-if="selectedFile" class="btn btn-ghost btn-sm" style="color:var(--danger);" @click="resetAll">إلغاء</button>
        </div>

        <!-- Preview table -->
        <template v-if="previewRows.length">
          <div style="margin-top:16px;">
            <div style="font-weight:800;font-size:13.5px;margin-bottom:8px;color:var(--charcoal);">
              معاينة البيانات ({{ previewRows.length }} صف)
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr v-if="activeTab==='tenants'">
                    <th>رقم المستأجر</th><th>اسم المستأجر</th><th>الجوال</th>
                    <th>العقار/الوحدة</th><th>الاستحقاق</th><th>المحصل</th>
                    <th>المالك</th><th>الهدف الشهري</th><th>الحالة</th>
                  </tr>
                  <tr v-else>
                    <th>المستأجر</th><th>الفترة</th><th>الاستحقاق</th><th>المبلغ</th><th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in previewRows" :key="i">
                    <template v-if="activeTab==='tenants'">
                      <td>{{ row.tenant_number||'—' }}</td>
                      <td><b>{{ row.name }}</b></td>
                      <td>{{ row.phone||'—' }}</td>
                      <td>{{ row.property_unit||'—' }}</td>
                      <td>{{ row.due_date||'—' }}</td>
                      <td>{{ row.collector_name||'—' }}</td>
                      <td>{{ row.owner_name||'—' }}</td>
                      <td>{{ row.monthly_target||0 }} ر.س</td>
                      <td>
                        <span class="badge" :class="row._valid ? 'badge-approved' : 'badge-rejected'">
                          {{ row._valid ? 'جاهز' : row._error||'خطأ' }}
                        </span>
                      </td>
                    </template>
                    <template v-else>
                      <td><b>{{ row.name }}</b></td>
                      <td>{{ row.period||'—' }}</td>
                      <td>{{ row.due_date||'—' }}</td>
                      <td>{{ row.amount||0 }} ر.س</td>
                      <td>
                        <span class="badge" :class="row._valid ? 'badge-approved' : 'badge-rejected'">
                          {{ row._valid ? 'جاهز' : row._error||'خطأ' }}
                        </span>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Confirm button -->
            <div style="display:flex;gap:10px;margin-top:14px;align-items:center;">
              <button class="btn btn-primary" :disabled="!validRows.length || importing" @click="doImport" style="flex:1;">
                {{ importing ? 'جارٍ الاستيراد...' : `تأكيد إضافة (${validRows.length} ${activeTab==='tenants'?'مستأجر':'مطالبة'})` }}
              </button>
              <button class="btn btn-ghost btn-sm" @click="resetAll">إلغاء</button>
            </div>
            <div v-if="errorRows.length" style="margin-top:8px;font-size:12px;color:var(--danger);font-weight:700;">
              ⚠ {{ errorRows.length }} صف لن يتم استيرادها بسبب بيانات ناقصة
            </div>
          </div>
        </template>

        <!-- Result -->
        <!-- <template v-if="importResult">
          <div class="result-box" style="margin-top:16px;">
            <div style="font-weight:800;font-size:14px;margin-bottom:8px;">نتيجة الاستيراد</div>
            <div class="kv"><span>إجمالي الصفوف</span><span>{{ importResult.total }}</span></div>
            <div class="kv"><span>تمت الإضافة</span><span class="ok">{{ importResult.imported }}</span></div>
            <div class="kv"><span>تم التحديث</span><span>{{ importResult.updated }}</span></div>
            <div class="kv"><span>فشل</span><span :class="{ err: importResult.failed > 0 }">{{ importResult.failed }}</span></div>
            <template v-if="importResult.errors.length">
              <div style="margin-top:10px;font-size:12.5px;color:var(--danger);">
                <div v-for="(e, i) in importResult.errors" :key="i">• {{ e }}</div>
              </div>
            </template>
          </div>
        </template> -->
      </div>

      <!-- RIGHT: notes -->
      <div class="card">
        <h3>ملاحظات هامة</h3>
        <p class="hint" style="line-height:1.9;">
          <template v-if="activeTab==='tenants'">
            • عمود «المحصل» يجب أن يطابق الاسم المسجل بالنظام تمامًا.<br>
            • عمود «المالك» اختياري — يربط المستأجر بمالك مسجل.<br>
            • في حال عدم تطابق اسم المحصل سيظهر الصف كـ «خطأ» في المعاينة.<br>
            • يمكن ترك «الهدف الشهري» و«الملاحظات» فارغين وتعديلهما لاحقًا.<br>
            • تتم إضافة المستأجرين كصفوف جديدة — لا يتم استبدال أي مستأجر موجود.<br>
            • الحد الأقصى لحجم الملف 5MB.
          </template>
          <template v-else>
            • يجب أن يتطابق اسم المستأجر مع الاسم المسجل بالنظام.<br>
            • في حال عدم العثور على مستأجر مطابق سيتم تجاهل الصف.<br>
            • تُضاف المطالبات إلى الشهر (الفترة) المحدد في الملف.<br>
            • لا تُستبدل المطالبات السابقة — تُضاف فقط مطالبات جديدة.
          </template>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type ImportResult } from '~/composables/useApi'

const { manager: supervisor } = useApi()
const showToast = inject<(m: string) => void>('showToast', () => {})

// ── state ──
const activeTab    = ref<'tenants'|'dues'>('tenants')
const selectedFile = ref<File | null>(null)
const fileInput    = ref<HTMLInputElement>()
const parsing      = ref(false)
const importing    = ref(false)
const previewRows  = ref<any[]>([])
const importResult = ref<ImportResult | null>(null)

const validRows = computed(() => previewRows.value.filter(r => r._valid))
const errorRows = computed(() => previewRows.value.filter(r => !r._valid))
const fileName  = computed(() => selectedFile.value?.name ?? '')

function resetAll() {
  selectedFile.value = null
  previewRows.value  = []
  importResult.value = null
  parsing.value      = false
  if (fileInput.value) fileInput.value.value = ''
}

// ── file pick ──
function handleFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { showToast('حجم الملف كبير جدًا (الحد الأقصى 5MB)'); return }
  selectedFile.value = file
  importResult.value = null
  previewRows.value  = []
  // معاينة تلقائية فور اختيار الملف
  nextTick(() => parseFile())
}

// ── parse Excel for preview ──
async function parseFile() {
  if (!selectedFile.value) return
  parsing.value = true
  try {
    // قراءة الملف كـ ArrayBuffer
    const buffer = await selectedFile.value.arrayBuffer()
    // استخدام XLSX من الـ window (محمّل عبر CDN أو نستخدم dynamic import)
    let XLSX: any
    try {
      XLSX = (await import('xlsx')).default || (await import('xlsx'))
    } catch {
      // fallback: إرسال مباشر للـ API بدون preview
      showToast('مكتبة XLSX غير متاحة — سيتم الإرسال مباشرة')
      parsing.value = false
      await doImport()
      return
    }

    const wb   = XLSX.read(buffer, { type: 'array', cellDates: true })
    const ws   = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' })

    if (activeTab.value === 'tenants') {
      previewRows.value = json.map((r: any) => {
        const name  = String(r['اسم المستأجر'] || r['المستأجر'] || r['name'] || '').trim()
        const colName = String(r['المحصل'] || r['collector'] || '').trim()
        const valid = !!name && !!colName
        return {
          tenant_number:  String(r['رقم المستأجر'] || r['رقم'] || '').trim(),
          name,
          phone:          String(r['رقم الجوال']   || r['الجوال']  || '').trim(),
          property_unit:  String(r['العقار والوحدة']|| r['الوحدة'] || '').trim(),
          due_date:       String(r['تاريخ الاستحقاق']|| r['الاستحقاق']|| '').trim(),
          collector_name: colName,
          owner_name:     String(r['المالك'] || '').trim(),
          monthly_target: Number(r['الهدف الشهري'] || r['الهدف'] || 0),
          _valid: valid,
          _error: !name ? 'الاسم مطلوب' : !colName ? 'المحصل مطلوب' : '',
        }
      })
    } else {
      previewRows.value = json.map((r: any) => {
        const name   = String(r['اسم المستأجر'] || r['المستأجر'] || '').trim()
        const period = String(r['الفترة'] || '').trim()
        const amount = Number(r['المبلغ'] || 0)
        const valid  = !!name && !!period && amount > 0
        return {
          name,
          period,
          due_date: String(r['تاريخ الاستحقاق'] || '').trim(),
          amount,
          _valid: valid,
          _error: !name ? 'الاسم مطلوب' : !period ? 'الفترة مطلوبة' : !amount ? 'المبلغ مطلوب' : '',
        }
      })
    }

    if (!previewRows.value.length) showToast('الملف فارغ أو لا توجد بيانات مقروءة')

  } catch (e) {
    console.error('parse error:', e)
    showToast('تعذّر قراءة الملف — تأكد من الصيغة')
  } finally {
    parsing.value = false
  }
}

// ── send to API ──
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
    previewRows.value  = []
    if (fileInput.value) fileInput.value.value = ''
  } catch (e: any) {
    const data = e?.data
    if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0]
      const msg = Array.isArray(data.errors[firstKey]) ? data.errors[firstKey][0] : data.errors[firstKey]
      showToast(msg || data.message || 'تعذّر استيراد الملف')
    } else {
      showToast(data?.message || e?.message || 'تعذّر استيراد الملف')
    }
  } finally {
    importing.value = false
  }
}

// ── download template ──
function downloadTemplate() {
  const token = useCookie<string>('tahsilat-token')
  const link  = supervisor.importTemplate()
  fetch(link, {
    headers: {
      Authorization: `Bearer ${token.value}`,
      'ngrok-skip-browser-warning': 'true',
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
    },
  })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob() })
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href = url; a.download = 'نموذج_استيراد_المستأجرين.xlsx'
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    })
    .catch(() => showToast('تعذّر تحميل النموذج'))
}
</script>
