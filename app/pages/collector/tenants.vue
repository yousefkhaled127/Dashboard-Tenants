<template>
  <div>
    <!-- Detail View -->
    <template v-if="detailId">
      <div class="page-title">
        <div>
          <h2>{{ getTenant(detailId)?.name }}</h2>
          <p>{{ getTenant(detailId)?.unit || '—' }}</p>
        </div>
        <button class="btn btn-ghost btn-sm" @click="detailId = null">‹ رجوع للقائمة</button>
      </div>

      <div class="grid grid-2">
        <div>
          <!-- Info -->
          <div class="card" style="margin-bottom:16px;">
            <h3>بيانات المستأجر</h3>
            <div class="kv"><span class="k">رقم المستأجر</span><span class="v">{{ getTenant(detailId)?.tenantNumber || '—' }}</span></div>
            <div class="kv"><span class="k">رقم الجوال</span><span class="v">{{ getTenant(detailId)?.phone || '—' }}</span></div>
            <div class="kv"><span class="k">العقار / الوحدة</span><span class="v">{{ getTenant(detailId)?.unit || '—' }}</span></div>
            <div class="kv"><span class="k">تاريخ الاستحقاق</span><span class="v">{{ getTenant(detailId)?.dueDate ? fmtDate(getTenant(detailId)!.dueDate) : '—' }}</span></div>
            <div class="kv"><span class="k">الهدف الشهري</span><span class="v">{{ fmtMoney(getTenant(detailId)?.monthlyTarget ?? 0) }}</span></div>
          </div>

          <!-- Progress -->
          <div class="card" style="margin-bottom:16px;">
            <h3>هدف الشهر الحالي</h3>
            <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:6px;">
              <span>محصّل {{ fmtMoney(colTenant) }}</span>
              <span class="muted">من {{ fmtMoney(getTenant(detailId)?.monthlyTarget ?? 0) }}</span>
            </div>
            <div class="progress" :class="{ ok: tenantPct >= 100 }"><div :style="`width:${tenantPct}%`" /></div>
          </div>

          <!-- Payments -->
          <div class="card">
            <h3>سجل السدادات</h3>
            <div class="table-wrap">
              <table>
                <thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>
                  <template v-if="tenantPays.length">
                    <tr v-for="p in tenantPays" :key="p.id">
                      <td>{{ fmtDate(p.submittedAt.slice(0,10)) }}</td>
                      <td>{{ paymentTypeLabel(p.type) }}</td>
                      <td>{{ fmtMoney(p.amount) }}</td>
                      <td><span class="badge" :class="`badge-${p.status}`">{{ statusLabel(p.status) }}</span></td>
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
            <div v-for="p in getTenant(detailId)?.promises ?? []" :key="p.id"
              class="note-item" :style="`border-right:3px solid ${promiseColor(p.date)}`">
              <b>{{ fmtDate(p.date) }}</b> — {{ p.note || 'بدون ملاحظة' }}
            </div>
            <p v-if="!getTenant(detailId)?.promises?.length" class="muted" style="font-size:12.5px;">لا توجد وعود مسجلة</p>
            <div class="row2" style="margin-top:10px;">
              <input v-model="promDate" type="date" />
              <input v-model="promNote" placeholder="ملاحظة الموعد" />
            </div>
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;" @click="addPromise">+ إضافة موعد</button>
          </div>

          <!-- Notes -->
          <div class="card">
            <h3>ملاحظات المستأجر</h3>
            <div v-for="n in [...(getTenant(detailId)?.notes ?? [])].reverse()" :key="n.id" class="note-item">
              {{ n.text }}<div class="meta">{{ n.by }} · {{ fmtDate(n.at.slice(0,10)) }}</div>
            </div>
            <p v-if="!getTenant(detailId)?.notes?.length" class="muted" style="font-size:12.5px;">لا توجد ملاحظات</p>
            <textarea v-model="newNote" placeholder="أضف ملاحظة جديدة..." style="margin-top:8px;" />
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;" @click="addNote">+ إضافة ملاحظة</button>
          </div>
        </div>
      </div>
    </template>

    <!-- List View -->
    <template v-else>
      <div class="page-title">
        <div>
          <h2>مستأجروني</h2>
          <p>{{ monthLabel(mk) }} · {{ filteredList.length }} مستأجر</p>
        </div>
      </div>

      <div class="search-bar">
        <input v-model="searchQ" placeholder="ابحث بالاسم، رقم الجوال، رقم المستأجر أو رقم الوحدة..." />
      </div>

      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>رقم المستأجر</th><th>المستأجر</th><th>العقار / الوحدة</th><th>الاستحقاق</th><th>المستهدف</th><th>المحصّل</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              <template v-if="filteredList.length">
                <tr v-for="t in filteredList" :key="t.id" class="clickable" @click="openDetail(t.id)">
                  <td>{{ t.tenantNumber || '—' }}</td>
                  <td><b>{{ t.name }}</b><div v-if="t.phone" class="muted" style="font-size:11.5px;">{{ t.phone }}</div></td>
                  <td>{{ t.unit || '—' }}</td>
                  <td>{{ t.dueDate ? fmtDate(t.dueDate) : '—' }}</td>
                  <td>{{ fmtMoney(t.monthlyTarget) }}</td>
                  <td>{{ fmtMoney(collectedForTenantMonth(t.id, mk)) }}</td>
                  <td>
                    <span class="badge" :class="tenantStatusClass(t.id)">{{ tenantStatusLabel(t.id) }}</span>
                  </td>
                  <td><button class="btn btn-ghost btn-sm" @click.stop="openDetail(t.id)">فتح ›</button></td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="8"><div class="empty-state"><b>{{ searchQ ? 'لا توجد نتائج مطابقة' : 'لم تُسنَد لك محافظ مستأجرين بعد' }}</b></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'

const { state, load, save, uid, monthKey, monthLabel, fmtDate, fmtMoney, todayISO, myTenants, getTenant, collectedForTenantMonth, paymentTypeLabel } = useAppState()
onMounted(load)

const session  = inject<Ref<{ id: string; name: string }>>('collectorSession', ref({ id: '', name: '' }))
const showToast = inject<(m: string) => void>('showToast', () => {})
const mk = monthKey()

const detailId  = ref<string | null>(null)
const searchQ   = ref('')
const newNote   = ref('')
const promDate  = ref(todayISO())
const promNote  = ref('')

const baseList = computed(() => myTenants(session.value.id))
const filteredList = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return baseList.value
  return baseList.value.filter(t =>
    t.name.toLowerCase().includes(q) || (t.phone || '').includes(q) ||
    (t.tenantNumber || '').toLowerCase().includes(q) || (t.unit || '').toLowerCase().includes(q)
  )
})

const colTenant  = computed(() => collectedForTenantMonth(detailId.value || '', mk))
const tenantPct  = computed(() => {
  const tgt = Number(getTenant(detailId.value || '')?.monthlyTarget || 0)
  return tgt ? Math.min(100, Math.round(colTenant.value / tgt * 100)) : 0
})
const tenantPays = computed(() =>
  state.value.payments.filter(p => p.tenantId === detailId.value).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
)

function tenantStatusClass(id: string): string {
  const t = getTenant(id); if (!t) return 'badge-neutral'
  const col = collectedForTenantMonth(id, mk), tgt = Number(t.monthlyTarget || 0)
  if (tgt && col >= tgt) return 'badge-approved'
  if (col > 0) return 'badge-pending'
  return 'badge-neutral'
}
function tenantStatusLabel(id: string): string {
  const t = getTenant(id); if (!t) return 'لم يسدد'
  const col = collectedForTenantMonth(id, mk), tgt = Number(t.monthlyTarget || 0)
  if (tgt && col >= tgt) return 'مسدد'
  if (col > 0) return 'جزئي'
  return 'لم يسدد'
}

const statusLabel  = (s: string) => ({ pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' } as any)[s] || s
const promiseColor = (date: string) => {
  const diff = Math.round((new Date(date).getTime() - new Date().getTime()) / 86400000)
  return diff < 0 ? '#B3452F' : diff <= 2 ? '#B8791E' : '#E6DFD3'
}

function openDetail(id: string) { detailId.value = id; newNote.value = ''; promDate.value = todayISO(); promNote.value = '' }

async function addPromise() {
  const t = getTenant(detailId.value!); if (!t) return
  if (!promDate.value) { showToast('اختر تاريخ الموعد'); return }
  t.promises.push({ id: uid(), date: promDate.value, note: promNote.value.trim() })
  save(); showToast('تم إضافة الموعد')
  promDate.value = todayISO(); promNote.value = ''
}

async function addNote() {
  const t = getTenant(detailId.value!); if (!t) return
  const txt = newNote.value.trim(); if (!txt) return
  t.notes.push({ id: uid(), text: txt, by: session.value.name || 'المحصل', at: new Date().toISOString() })
  save(); newNote.value = ''
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
.muted { color:#8A8479; }
.kv { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #E6DFD3; font-size:13.5px; }
.kv:last-child { border-bottom:none; }
.kv .k { color:#8A8479; } .kv .v { font-weight:800; }
.progress { background:#F3EFE8; border-radius:20px; height:9px; overflow:hidden; }
.progress>div { height:100%; background:#E1712F; border-radius:20px; transition:.3s; }
.progress.ok>div { background:#3F7D52; }
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
.btn-ghost { background:transparent; color:#3A3733; border:1.5px solid #E6DFD3; } .btn-ghost:hover { border-color:#3A3733; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
</style>
