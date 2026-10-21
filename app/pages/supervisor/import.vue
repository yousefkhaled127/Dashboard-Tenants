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
                        <span class="badge"
                              :class="row._failed    ? 'badge-rejected'
                                    : row._valid     ? 'badge-approved'
                                    : row._unitTaken ? 'badge-pending'
                                    : row._phoneTaken? 'badge-pending'
                                    : 'badge-rejected'">
                          {{
                            row._failed     ? (row._error || 'فشل الاستيراد')
                            : row._valid    ? 'جاهز'
                            : row._unitTaken  ? 'الوحدة مستأجرة بالفعل'
                            : row._phoneTaken ? 'رقم الجوال مكرر'
                            : (row._error || 'خطأ')
                          }}
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
          <div style="margin-top:16px;background:var(--bg);border-radius:12px;padding:14px;">
            <div style="font-weight:800;font-size:14px;margin-bottom:10px;color:var(--charcoal);">نتيجة الاستيراد</div>
            <div class="kv"><span class="k">إجمالي الصفوف</span><span class="v">{{ importResult.total }}</span></div>
            <div class="kv"><span class="k">تمت الإضافة</span><span class="v" style="color:var(--success);">{{ importResult.imported }}</span></div>
            <div class="kv"><span class="k">تم التحديث</span><span class="v">{{ importResult.updated }}</span></div>
            <div class="kv" :style="importResult.errors?.length ? '' : 'border-bottom:none;'">
              <span class="k">فشل</span>
              <span class="v" :style="importResult.failed > 0 ? 'color:var(--danger);' : ''">{{ importResult.failed }}</span>
            </div> -->
            <!-- أسباب الفشل مفصّلة -->
            <!-- <template v-if="importResult.errors?.length">
              <div style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px;">
                <div style="font-weight:800;font-size:12.5px;color:var(--danger);margin-bottom:6px;">
                  أسباب الفشل ({{ importResult.errors.length }}):
                </div>
                <div v-for="(e, i) in importResult.errors" :key="i"
                     style="display:flex;gap:6px;align-items:flex-start;font-size:12.5px;color:var(--danger);padding:5px 0;border-bottom:1px solid var(--danger-tint);">
                  <span style="flex-shrink:0;font-weight:900;min-width:18px;">{{ i + 1 }}.</span>
                  <span>{{ e }}</span>
                </div>
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

// قوائم المحصلين والملاك للتحقق من الأسماء
const collectorsList  = ref<{id: number; name: string}[]>([])
const ownersList      = ref<{id: number; name: string}[]>([])
const occupiedUnits   = ref<Set<string>>(new Set())   // الوحدات المستأجرة حالياً
const existingPhones  = ref<Set<string>>(new Set())   // أرقام الجوال المسجّلة حالياً

onMounted(async () => {
  try {
    const { auth } = useApi()
    const [cols, owns, tenantsData] = await Promise.all([
      auth.usersByType('collector'),
      auth.usersByType('owner'),
      supervisor.tenants({ page: 1 }).catch(() => ({ tenants: [], pagination: { total:0, per_page:50, current_page:1, last_page:1 } })),
    ])
    collectorsList.value = cols.map(c => ({ id: c.id, name: c.name }))
    ownersList.value     = owns.map(o => ({ id: o.id, name: o.name }))

    // جمع كل الوحدات المستأجرة حالياً (property_unit غير فارغة)
    const units = new Set<string>()
    tenantsData.tenants.forEach(t => {
      if (t.property_unit) units.add(t.property_unit.trim().toLowerCase())
    })
    // لو في صفحات إضافية — جيبها كلها
    if (tenantsData.pagination.last_page > 1) {
      const pages = []
      for (let p = 2; p <= tenantsData.pagination.last_page; p++) {
        pages.push(supervisor.tenants({ page: p }).catch(() => ({ tenants: [] })))
      }
      const rest = await Promise.all(pages)
      rest.forEach((d: any) => d.tenants?.forEach((t: any) => {
        if (t.property_unit) units.add(t.property_unit.trim().toLowerCase())
      }))
    }
    occupiedUnits.value = units

    // جمع أرقام الجوال الموجودة حالياً في النظام
    const phones = new Set<string>()
    tenantsData.tenants.forEach(t => {
      if (t.phone) phones.add(t.phone.trim().replace(/\s/g,''))
    })
    if (tenantsData.pagination.last_page > 1) {
      const pages = []
      for (let p = 2; p <= tenantsData.pagination.last_page; p++) {
        pages.push(supervisor.tenants({ page: p }).catch(() => ({ tenants: [] })))
      }
      const rest2 = await Promise.all(pages)
      rest2.forEach((d: any) => d.tenants?.forEach((t: any) => {
        if (t.phone) phones.add(t.phone.trim().replace(/\s/g,''))
      }))
    }
    existingPhones.value = phones
  } catch { /* تجاهل */ }
})

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
      const seenPhonesInFile = new Set<string>()   // لكشف تكرار الجوال داخل الملف
      previewRows.value = json.map((r: any) => {
        const name     = String(r['اسم المستأجر'] || r['المستأجر'] || r['name'] || '').trim()
        const colName  = String(r['المحصل'] || r['collector'] || '').trim()
        const ownName  = String(r['المالك'] || '').trim()

        // التحقق من وجود المحصل في النظام
        const colFound = !colName || collectorsList.value.some(
          c => c.name.trim() === colName
        )
        // التحقق من وجود المالك (اختياري — فقط لو كتب اسم)
        const ownFound = !ownName || ownersList.value.some(
          o => o.name.trim() === ownName
        )

        // التحقق من إن الوحدة مش مستأجرة بالفعل
        const unitVal   = String(r['العقار والوحدة'] || r['الوحدة'] || '').trim()
        const unitTaken = !!unitVal && occupiedUnits.value.has(unitVal.toLowerCase())

        // التحقق من تكرار رقم الجوال في النظام
        const phoneVal    = String(r['رقم الجوال'] || r['الجوال'] || '').trim().replace(/\s/g,'')
        const phoneTaken  = !!phoneVal && existingPhones.value.has(phoneVal)

        // التحقق من تكرار الجوال داخل الملف نفسه
        const phoneDupInFile = !!phoneVal && seenPhonesInFile.has(phoneVal)
        if (phoneVal) seenPhonesInFile.add(phoneVal)

        let error = ''
        if (!name)             error = 'الاسم مطلوب'
        else if (!colName)     error = 'المحصل مطلوب'
        else if (!colFound)    error = `لم يتم العثور على اسم المحصل: ${colName}`
        else if (ownName && !ownFound) error = `لم يتم العثور على اسم المالك: ${ownName}`
        else if (unitTaken)    error = 'الوحدة مستأجرة بالفعل'
        else if (phoneTaken)   error = 'رقم الجوال مكرر'
        else if (phoneDupInFile) error = 'رقم الجوال مكرر في الملف'

        return {
          tenant_number:  String(r['رقم المستأجر'] || r['رقم'] || '').trim(),
          name,
          phone:          phoneVal,
          property_unit:  unitVal,
          due_date:       String(r['تاريخ الاستحقاق']|| r['الاستحقاق']|| '').trim(),
          collector_name: colName,
          owner_name:     ownName,
          monthly_target: Number(r['الهدف الشهري'] || r['الهدف'] || 0),
          _valid: !!name && !!colName && colFound && (ownName ? ownFound : true) && !unitTaken && !phoneTaken && !phoneDupInFile,
          _error: error,
          _unitTaken: unitTaken,
          _phoneTaken: phoneTaken || phoneDupInFile,
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
    const result = await supervisor.importExcel(fd)
    importResult.value = result

    // ربط أسباب الفشل بالصفوف في الجدول
    if (result.errors && result.errors.length) {
      result.errors.forEach((errMsg: string) => {
        // تحويل رسائل الخطأ الشائعة إلى عربي مفهوم
        const friendlyMsg = errMsg
          .replace(/.*phone.*(?:taken|duplicate|unique|مكرر).*/i,     'رقم الجوال مكرر')
          .replace(/.*(?:phone|جوال).*(?:already|exists|موجود).*/i,   'رقم الجوال مكرر')
          .replace(/.*(?:has already been taken|unique).*/i,           'رقم الجوال مكرر')

        // صيغة 1: "الصف 3: ..." أو "Row 3: ..."
        const rowMatch = errMsg.match(/(?:الصف|row)\s*(\d+)/i)
        if (rowMatch) {
          const rowIdx = parseInt(rowMatch[1]) - 1
          if (previewRows.value[rowIdx]) {
            previewRows.value[rowIdx]._valid   = false
            previewRows.value[rowIdx]._failed  = true
            previewRows.value[rowIdx]._error   = friendlyMsg !== errMsg
              ? friendlyMsg
              : errMsg.replace(/(?:الصف|row)\s*\d+\s*[:：]\s*/i, '').trim()
            previewRows.value[rowIdx]._phoneTaken = /جوال|phone/i.test(errMsg)
          }
          return
        }
        // صيغة 2: ابحث بالاسم داخل رسالة الخطأ
        const matchedRow = previewRows.value.find(r => r.name && errMsg.includes(r.name))
        if (matchedRow) {
          matchedRow._valid      = false
          matchedRow._failed     = true
          matchedRow._error      = friendlyMsg !== errMsg ? friendlyMsg : errMsg
          matchedRow._phoneTaken = /جوال|phone/i.test(errMsg)
        }
      })
    }

    // الصفوف اللي نجحت — نمسح فقط اللي لم تفشل
    if (result.failed === 0) {
      // كل شيء نجح
      showToast(`تم الاستيراد بنجاح — أُضيف ${result.imported} مستأجر`)
      setTimeout(() => {
        previewRows.value = []
        selectedFile.value = null
        if (fileInput.value) fileInput.value.value = ''
      }, 3000)
    } else {
      showToast(`تم الاستيراد: ${result.imported} نجح، ${result.failed} فشل`)
    }

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
