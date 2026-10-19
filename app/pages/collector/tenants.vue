<template>
  <div>
    <!-- Detail View -->
    <template v-if="detailId">
      <div class="page-title">
        <div>
          <h2>{{ detail?.tenant_info.name || '...' }}</h2>
          <p>{{ detail?.tenant_info.property_unit || '—' }}</p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="closeDetail">‹ رجوع للقائمة</button>
      </div>

      <div class="grid grid-2" v-if="detail">
        <div>
          <!-- Info -->
          <div class="card" style="margin-bottom:16px;">
            <h3>بيانات المستأجر</h3>
            <div class="kv"><span class="k">رقم المستأجر</span><span class="v">{{ detail.tenant_info.tenant_number || '—' }}</span></div>
            <div class="kv"><span class="k">رقم الجوال</span><span class="v">{{ detail.tenant_info.phone || '—' }}</span></div>
            <div class="kv"><span class="k">العقار / الوحدة</span><span class="v">{{ detail.tenant_info.property_unit || '—' }}</span></div>
            <div class="kv"><span class="k">تاريخ الاستحقاق</span><span class="v">{{ detail.tenant_info.due_date_formatted || '—' }}</span></div>
            <div class="kv"><span class="k">الهدف الشهري</span><span class="v">{{ fmtMoney(detail.tenant_info.monthly_target) }}</span></div>
          </div>

          <!-- Progress -->
          <div class="card" style="margin-bottom:16px;">
            <h3>هدف الشهر الحالي</h3>
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;">
              <span>محصّل {{ fmtMoney(detail.current_month_target.collected_amount) }}</span>
              <span class="muted">من {{ fmtMoney(detail.current_month_target.target_amount) }}</span>
            </div>
            <div class="progress" :class="{ ok: detail.current_month_target.percentage >= 100 }">
              <div :style="`width:${Math.min(100, detail.current_month_target.percentage)}%`" />
            </div>
          </div>

          <!-- Payments -->
          <div class="card">
            <h3>سجل السدادات</h3>
            <div class="table-wrap">
              <table>
                <thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>
                  <template v-if="detail.payments_ledger.length">
                    <tr v-for="p in detail.payments_ledger" :key="p.id">
                      <td>{{ p.payment_date_formatted }}</td>
                      <td>{{ p.payment_method }}</td>
                      <td>{{ fmtMoney(p.amount) }}</td>
                      <td><span class="badge" :class="`badge-${p.status}`">{{ p.status_label }}</span></td>
                    </tr>
                  </template>
                  <tr v-else><td colspan="4" class="empty-cell">لا يوجد سدادات بعد</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <!-- Promises -->
          <div class="card" style="margin-bottom:16px;">
            <h3>الوعود / المواعيد</h3>
            <div v-for="p in detail.promises" :key="p.id"
              class="note-item" :style="`border-right:3px solid ${promiseColor(p.promise_date)}`">
              <b>{{ p.promise_date_formatted }}</b> — {{ p.note || 'بدون ملاحظة' }}
              <div v-if="p.created_by" class="meta">{{ p.created_by.name }} · {{ p.created_at }}</div>
            </div>
            <p v-if="!detail.promises.length" class="muted" style="font-size:12.5px;">لا توجد وعود مسجلة</p>
            <div class="row2" style="margin-top:10px;">
              <input v-model="promDate" type="date" />
              <input v-model="promNote" placeholder="ملاحظة الموعد" />
            </div>
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;" :disabled="saving" @click="addPromise">+ إضافة موعد</button>
          </div>

          <!-- Notes -->
          <div class="card">
            <h3>ملاحظات المستأجر</h3>
            <div v-for="n in [...detail.notes_list].reverse()" :key="n.id" class="note-item">
              {{ n.content }}<div class="meta">{{ n.author_name }} · {{ n.created_at }}</div>
            </div>
            <p v-if="!detail.notes_list.length" class="muted" style="font-size:12.5px;">لا توجد ملاحظات</p>
            <textarea v-model="newNote" placeholder="أضف ملاحظة جديدة..." style="margin-top:8px;" />
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;" :disabled="saving" @click="addNote">+ إضافة ملاحظة</button>
          </div>
        </div>
      </div>
    </template>

    <!-- List View -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>مستأجروني</h2>
          <p>{{ monthLabel(mk) }} · {{ listData?.pagination.total || 0 }} مستأجر</p>
        </div>
      </div>

      <div class="search-bar">
        <input v-model="searchQ" placeholder="ابحث بالاسم، رقم الجوال، رقم المستأجر أو رقم الوحدة..." @input="onSearchInput" />
      </div>

      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>رقم المستأجر</th><th>المستأجر</th><th>العقار / الوحدة</th><th>الاستحقاق</th><th>المستهدف</th><th>المحصّل</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              <template v-if="tenants.length">
                <tr v-for="t in tenants" :key="t.id" class="clickable" @click="openDetail(t.id)">
                  <td>{{ t.tenant_number || '—' }}</td>
                  <td><b>{{ t.name }}</b><div v-if="t.phone" class="muted" style="font-size:11.5px;">{{ t.phone }}</div></td>
                  <td>{{ t.property_unit || '—' }}</td>
                  <td>{{ t.due_date_formatted || '—' }}</td>
                  <td>{{ fmtMoney(t.monthly_target) }}</td>
                  <td>{{ fmtMoney(t.paid_amount) }}</td>
                  <td><span class="badge" :class="`badge-${t.status === 'regular' ? 'approved' : t.status}`">{{ t.status_label }}</span></td>
                  <td><button class="btn btn-ghost btn-sm" @click.stop="openDetail(t.id)">فتح ›</button></td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="8"><div class="empty-state"><b>{{ searchQ ? 'لا توجد نتائج مطابقة' : 'لم تُسنَد لك محافظ مستأجرين بعد' }}</b></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div v-if="listData && listData.pagination.last_page > 1" style="display:flex;justify-content:center;gap:8px;margin-top:16px;">
          <button class="btn btn-ghost btn-sm" :disabled="currentPage <= 1" @click="changePage(currentPage - 1)">‹ السابق</button>
          <span style="padding:7px 12px;font-size:13px;font-weight:700;">{{ currentPage }} / {{ listData.pagination.last_page }}</span>
          <button class="btn btn-ghost btn-sm" :disabled="currentPage >= listData.pagination.last_page" @click="changePage(currentPage + 1)">التالي ›</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useApi, type TenantListItem, type TenantDetail } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const { collector } = useApi()
const { monthKey, monthLabel, fmtMoney, todayISO } = useFormat()

const showToast = inject<(m: string) => void>('showToast', () => {})

const mk = monthKey()
const detailId = ref<number | null>(null)
const detail = ref<TenantDetail | null>(null)
const searchQ = ref('')
const saving = ref(false)
const newNote = ref('')
const promDate = ref(todayISO())
const promNote = ref('')
const currentPage = ref(1)

const listData = ref<{ tenants: TenantListItem[]; pagination: any; period: string } | null>(null)
const tenants = computed(() => listData.value?.tenants || [])

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchList() }, 350)
}

async function fetchList() {
  try {
    listData.value = await collector.tenants({ search: searchQ.value || undefined, period: mk, page: currentPage.value })
  } catch { showToast('تعذّر جلب قائمة المستأجرين') }
}

onMounted(fetchList)

async function changePage(p: number) {
  currentPage.value = p
  await fetchList()
}

async function openDetail(id: number) {
  detailId.value = id
  detail.value = null
  newNote.value = ''
  promDate.value = todayISO()
  promNote.value = ''
  try {
    detail.value = await collector.showTenant(id, mk)
  } catch { showToast('تعذّر جلب بيانات المستأجر') }
}

function closeDetail() {
  detailId.value = null
  detail.value = null
}

const promiseColor = (date: string) => {
  const diff = Math.round((new Date(date).getTime() - new Date().getTime()) / 86400000)
  return diff < 0 ? '#B3452F' : diff <= 2 ? '#B8791E' : '#E6DFD3'
}

async function addPromise() {
  if (!detailId.value) return
  if (!promDate.value) { showToast('اختر تاريخ الموعد'); return }
  saving.value = true
  try {
    const res = await collector.addPromise(detailId.value, { promise_date: promDate.value, note: promNote.value.trim() })
    // أضيف محلياً بدون reload
    if (detail.value) detail.value.promises.push(res)
    showToast('تم إضافة الموعد')
    promDate.value = todayISO()
    promNote.value = ''
  } catch { showToast('تعذّر إضافة الموعد') } finally {
    saving.value = false
  }
}

async function addNote() {
  if (!detailId.value) return
  const txt = newNote.value.trim()
  if (!txt) return
  saving.value = true
  try {
    const res = await collector.addNote(detailId.value, { content: txt })
    // أضيف محلياً بدون reload
    if (detail.value) detail.value.notes_list.push(res)
    showToast('تم إضافة الملاحظة')
    newNote.value = ''
  } catch { showToast('تعذّر إضافة الملاحظة') } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.grid { display:grid; gap:16px; }
.grid-2 { grid-template-columns:1.4fr 1fr; }
@media(max-width:1050px){ .grid-2{grid-template-columns:1fr;} }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:#3A3733; }
.search-bar { margin-bottom:14px; }
.search-bar input { width:100%; padding:11px 15px; border-radius:10px; border:1.5px solid #E6DFD3; background:#fff; font-size:14px; outline:none; font-family:inherit; }
.search-bar input:focus { border-color:#E1712F; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13.5px; }
th { text-align:right; color:#8A8479; font-weight:700; font-size:12px; padding:9px 10px; border-bottom:1.5px solid #E6DFD3; white-space:nowrap; }
td { padding:11px 10px; border-bottom:1px solid #E6DFD3; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
tr.clickable:hover { background:#F3EFE8; cursor:pointer; }
.empty-state { text-align:center; padding:40px 20px; color:#8A8479; }
.empty-state b { display:block; color:#3A3733; font-size:14.5px; margin-bottom:4px; }
.empty-cell { text-align:center; padding:16px; color:#8A8479; }
.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }
.badge-neutral  { background:#F3EFE8; color:#8A8479; }
.badge-regular  { background:#E4F1E7; color:#3F7D52; }
.muted { color:#8A8479; }
.kv { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #E6DFD3; font-size:13.5px; }
.kv:last-child { border-bottom:none; }
.kv .k { color:#8A8479; } .kv .v { font-weight:800; }
.progress { background:#F3EFE8; border-radius:20px; height:9px; overflow:hidden; }
.progress > div { height:100%; background:#E1712F; border-radius:20px; transition:.3s; }
.progress.ok > div { background:#3F7D52; }
.note-item { background:#F3EFE8; border-radius:10px; padding:10px 12px; margin-bottom:8px; font-size:13px; }
.meta { color:#8A8479; font-size:11px; margin-top:4px; }
.row2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media(max-width:520px){ .row2{grid-template-columns:1fr;} }
.field { margin-bottom:14px; }
input, select { padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; color:#2E2B27; outline:none; font-family:inherit; font-size:14px; width:100%; }
input:focus { border-color:#E1712F; background:#fff; }
textarea { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; resize:vertical; min-height:70px; outline:none; font-family:inherit; font-size:14px; }
textarea:focus { border-color:#E1712F; background:#fff; }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; transition:.15s; }
.btn-ghost { background:transparent; color:#3A3733; border:1.5px solid #E6DFD3; } .btn-ghost:hover:not(:disabled) { border-color:#3A3733; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:default; }
</style>
