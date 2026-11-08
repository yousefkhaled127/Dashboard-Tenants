<template>
  <div>
    <!-- ===== HEADER ===== -->
    <div class="page-title">
      <div>
        <h2>تقارير الوحدات</h2>
        <p>متابعة ما يتم من تسويق على كل وحدة – أرقام المشاهدات والاستفسارات، مع ملف الوحدة كاملاً</p>
      </div>
    </div>

    <!-- ===== STAT CARDS ===== -->
    <div class="grid grid-4" style="margin-bottom:18px;">
      <div class="card stat-card">
        <div class="lbl">الوحدات</div>
        <div class="val">{{ lsOffice.length }}</div>
        <div class="sub">{{ withReports }} بها تقارير</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--orange);">
        <div class="lbl">إجمالي المشاهدات (آخر قراءة)</div>
        <div class="val">{{ totalViews.toLocaleString('ar-SA-u-nu-latn') }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--success);">
        <div class="lbl">إجمالي الاستفسارات</div>
        <div class="val">{{ totalInquiries.toLocaleString('ar-SA-u-nu-latn') }}</div>
        <div class="sub">والنسب + متعلقات + اتصالات</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--warning);">
        <div class="lbl">طلبات تسويق بانتظار المراجعة</div>
        <div class="val">{{ pendingMrCount }}</div>
      </div>
    </div>

    <!-- ===== TABS ===== -->
    <div class="pill-tabs" style="margin-bottom:14px;">
      <button class="pill-tab" :class="{ active: activeTab === 'units' }" @click="activeTab = 'units'">
        الوحدات ({{ lsOffice.length }})
      </button>
      <button class="pill-tab" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">
        طلبات التسويق الإضافي ({{ pendingMrCount }})
      </button>
    </div>

    <!-- ===== TAB: UNITS ===== -->
    <template v-if="activeTab === 'units'">
      <!-- Filter row -->
      <div class="search-bar">
        <select v-model="filterType">
          <option value="">كل الوحدات</option>
          <option v-for="(lbl, k) in LS_TYPES" :key="k" :value="k">{{ lbl }}</option>
        </select>
        <input v-model="searchQ" placeholder="ابحث باسم الوحدة، المالك، العمارة، الكود أو الحارس..." @input="onSearch" />
      </div>

      <!-- Table -->
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الوحدة</th>
                <th>المالك</th>
                <th>العمارة</th>
                <th>المشاهدات</th>
                <th>الاستفسارات</th>
                <th>زيارات تامة</th>
                <th>معينون</th>
                <th>مشغّلون</th>
                <th>الروابط</th>
                <th>آخر قراءة</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="filteredUnits.length">
                <tr v-for="l in filteredUnits" :key="l.id" class="clickable" @click="openDetail(l)">
                  <td>
                    <span class="ls-code">{{ l.code }}</span>
                    <div class="unit-title">{{ l.title || '—' }}</div>
                    <div v-if="l.unitNo" class="muted" style="font-size:11px;">وحدة {{ l.unitNo }}</div>
                  </td>
                  <td>
                    <div class="fw7">{{ lsOwnerName(l) || '—' }}</div>
                    <div v-if="l.ownerPhone" class="muted" style="font-size:11px;">{{ l.ownerPhone }}</div>
                  </td>
                  <td>{{ propertyName(l) || '—' }}</td>
                  <td>
                    <div class="stat-num">{{ (l.views ?? 0).toLocaleString('ar-SA-u-nu-latn') }}</div>
                  </td>
                  <td>
                    <div class="stat-num">{{ (l.inquiries?.total ?? 0).toLocaleString('ar-SA-u-nu-latn') }}</div>
                    <div v-if="l.inquiries?.total" class="inq-sub muted">
                      {{ l.inquiries.related }} متعلقة · {{ l.inquiries.calls }} اتصال
                    </div>
                  </td>
                  <td>
                    <div class="stat-num">{{ l.visitsComplete ?? 0 }}</div>
                  </td>
                  <td>
                    <div v-if="l.assignees?.length" class="chips-wrap">
                      <span v-for="k in l.assignees" :key="k" class="chip">{{ actorName(k) }}</span>
                    </div>
                    <span v-else class="muted">—</span>
                  </td>
                  <td>
                    <div class="stat-num">{{ l.operators ?? 0 }}</div>
                  </td>
                  <td>
                    <div v-if="publishedLinks(l).length" class="chips-wrap">
                      <a
                        v-for="p in publishedLinks(l)" :key="p.id"
                        :href="l.platforms[p.id]?.url || '#'"
                        target="_blank"
                        class="chip chip-link"
                        @click.stop
                      >{{ p.name }}</a>
                    </div>
                    <span v-else class="muted">—</span>
                  </td>
                  <td>
                    <span v-if="l.lastRead" class="muted" style="font-size:12px;">{{ fmtDate(l.lastRead) }}</span>
                    <span v-else class="muted">—</span>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="10">
                  <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <b>لا توجد وحدات مطابقة</b>
                    <span>الوحدات تأتي من »مهام العقارات الشاغرة«</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ===== TAB: MARKETING REQUESTS ===== -->
    <template v-else>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
          <h3 style="margin:0;">طلبات التسويق الإضافي</h3>
          <div style="display:flex;gap:8px;">
            <select v-model="mrFilter" style="padding:8px 12px;border-radius:9px;border:1.5px solid var(--line);background:var(--bg);font-family:inherit;font-size:13px;outline:none;">
              <option value="">كل الطلبات</option>
              <option value="pending">بانتظار المراجعة</option>
              <option value="approved">مقبولة</option>
              <option value="rejected">مرفوضة</option>
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الوحدة</th>
                <th>نوع الطلب</th>
                <th>ملاحظة</th>
                <th>مقدّم الطلب</th>
                <th>تاريخ الطلب</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="filteredMR.length">
                <tr v-for="mr in filteredMR" :key="mr.id">
                  <td>
                    <span class="ls-code">{{ listingCode(mr.listingId) }}</span>
                    <div class="unit-title">{{ listingTitle(mr.listingId) }}</div>
                  </td>
                  <td><span class="badge badge-neutral">{{ mr.typeLabel }}</span></td>
                  <td><span class="muted" style="font-size:12.5px;">{{ mr.note || '—' }}</span></td>
                  <td>{{ actorName(mr.requestedBy) }}</td>
                  <td style="white-space:nowrap;font-size:12px;">{{ fmtDate(mr.requestedAt.slice(0,10)) }}</td>
                  <td>
                    <span class="badge" :class="mrStatusCls(mr.status)">{{ mrStatusLabel(mr.status) }}</span>
                  </td>
                  <td>
                    <div v-if="mr.status === 'pending'" style="display:flex;gap:6px;">
                      <button class="btn btn-success btn-sm" @click="decideMR(mr.id, 'approved')">قبول</button>
                      <button class="btn btn-danger  btn-sm" @click="decideMR(mr.id, 'rejected')">رفض</button>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="7">
                  <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <b>لا توجد طلبات {{ mrFilter ? mrFilterLabel : '' }}</b>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ===== DETAIL MODAL ===== -->
    <Teleport to="body">
      <div v-if="detailModal.open" class="modal-overlay" @mousedown.self="closeDetail">
        <div class="modal modal-lg">
          <div class="modal-head">
            <div>
              <h3>{{ detailModal.listing?.title || '—' }}</h3>
              <div class="muted" style="font-size:12px;">{{ detailModal.listing?.code }}</div>
            </div>
            <button class="modal-close" @click="closeDetail">×</button>
          </div>

          <div v-if="detailModal.listing" class="detail-body">
            <!-- Metrics row -->
            <div class="grid grid-4" style="margin-bottom:16px;">
              <div class="det-stat"><div class="lbl">المشاهدات</div><div class="val">{{ detailModal.listing.views ?? 0 }}</div></div>
              <div class="det-stat"><div class="lbl">الاستفسارات</div><div class="val">{{ detailModal.listing.inquiries?.total ?? 0 }}</div></div>
              <div class="det-stat"><div class="lbl">زيارات تامة</div><div class="val">{{ detailModal.listing.visitsComplete ?? 0 }}</div></div>
              <div class="det-stat"><div class="lbl">مشغّلون</div><div class="val">{{ detailModal.listing.operators ?? 0 }}</div></div>
            </div>

            <!-- Edit metrics -->
            <h4 class="section-label">تعديل الأرقام</h4>
            <div class="grid grid-4" style="margin-bottom:16px;">
              <div class="field">
                <label>المشاهدات</label>
                <input v-model.number="editForm.views" type="number" min="0" />
              </div>
              <div class="field">
                <label>الاستفسارات (الكل)</label>
                <input v-model.number="editForm.inquiriesTotal" type="number" min="0" />
              </div>
              <div class="field">
                <label>منها متعلقة</label>
                <input v-model.number="editForm.inquiriesRelated" type="number" min="0" />
              </div>
              <div class="field">
                <label>منها اتصالات</label>
                <input v-model.number="editForm.inquiriesCalls" type="number" min="0" />
              </div>
            </div>
            <div class="grid grid-4" style="margin-bottom:16px;">
              <div class="field">
                <label>زيارات تامة</label>
                <input v-model.number="editForm.visitsComplete" type="number" min="0" />
              </div>
              <div class="field">
                <label>مشغّلون</label>
                <input v-model.number="editForm.operators" type="number" min="0" />
              </div>
              <div class="field">
                <label>آخر قراءة</label>
                <input v-model="editForm.lastRead" type="date" />
              </div>
            </div>

            <!-- Assignees -->
            <h4 class="section-label">المعيّنون على الوحدة</h4>
            <div class="chips-wrap" style="margin-bottom:10px;">
              <span v-for="k in editForm.assignees" :key="k" class="chip chip-removable">
                {{ actorName(k) }}
                <button class="chip-rm" @click="removeAssignee(k)">×</button>
              </span>
              <span v-if="!editForm.assignees.length" class="muted" style="font-size:12.5px;">لا أحد معيّن</span>
            </div>
            <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
              <select v-model="newAssignee" style="flex:1;padding:9px 12px;border-radius:9px;border:1.5px solid var(--line);background:var(--bg);font-family:inherit;font-size:13px;outline:none;">
                <option value="">اختر شخصاً لإضافته...</option>
                <option v-for="s in allStaff" :key="s.key" :value="s.key">{{ s.name }}</option>
              </select>
              <button class="btn btn-ghost btn-sm" :disabled="!newAssignee" @click="addAssignee">+ إضافة</button>
            </div>

            <!-- Add marketing request -->
            <h4 class="section-label">إضافة طلب تسويق</h4>
            <div class="grid grid-3" style="margin-bottom:8px;">
              <div class="field" style="margin:0;">
                <label>النوع</label>
                <select v-model="newMR.type">
                  <option v-for="(lbl,k) in MR_TYPES" :key="k" :value="k">{{ lbl }}</option>
                </select>
              </div>
              <div class="field" style="margin:0;grid-column:span 2;">
                <label>ملاحظة (اختياري)</label>
                <input v-model="newMR.note" placeholder="تفاصيل الطلب..." />
              </div>
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-bottom:16px;" @click="addMR">+ إرسال الطلب</button>

            <div class="modal-actions" style="border-top:1px solid var(--line);padding-top:14px;">
              <button class="btn btn-ghost" @click="closeDetail">إلغاء</button>
              <button class="btn btn-primary" :disabled="saving" @click="saveDetail">
                {{ saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useExtState, type Listing, type MarketingRequest } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const { extState, load, save, uid, mrNextId, lsOffice, lsOwnerName, getListing } = useExtState()
const { fmtDate, todayISO } = useFormat()
const { auth } = useApi()

const showToast = inject<(m: string) => void>('showToast', () => {})
const supervisorSession = inject<any>('supervisorSession')

// ── constants ──
const LS_TYPES: Record<string, string> = {
  apartment: 'شقة', villa: 'فيلا', floor: 'دور', building: 'عمارة',
  land: 'أرض', shop: 'محل تجاري', office: 'مكتب', warehouse: 'مستودع', other: 'أخرى',
}
const MR_TYPES: Record<string, string> = {
  photo: 'تصوير', video: 'فيديو', campaign: 'حملة إعلانية', other: 'أخرى',
}

// ── staff ──
const allStaff = ref<{ key: string; name: string }[]>([])
const myActorKey = computed(() => {
  const s = supervisorSession?.value
  return s ? `supervisor:${s.id}` : ''
})
const actorName = (key: string) => {
  if (!key) return '—'
  return allStaff.value.find(s => s.key === key)?.name || key.split(':')[1] || key
}

onMounted(async () => {
  load()
  try {
    const [sups, cols] = await Promise.all([
      auth.usersByType('supervisor'),
      auth.usersByType('collector'),
    ])
    allStaff.value = [
      ...sups.map(u => ({ key: `supervisor:${u.id}`, name: u.name })),
      ...cols.map(u => ({ key: `collector:${u.id}`,  name: u.name })),
    ]
  } catch { /* silent */ }
})

// ── helpers ──
const propertyName = (l: Listing) => {
  if (l.propertyId) {
    const p = extState.value.properties.find(x => x.id === l.propertyId)
    if (p) return p.name
  }
  return ''
}

const publishedLinks = (l: Listing) =>
  (extState.value.listingPlatforms || []).filter(p => l.platforms?.[p.id]?.url)

const listingCode  = (lid: string) => getListing(lid)?.code  || lid
const listingTitle = (lid: string) => getListing(lid)?.title || '—'

// ── stats ──
const withReports = computed(() =>
  lsOffice.value.filter(l => (l.views ?? 0) > 0 || (l.inquiries?.total ?? 0) > 0).length
)
const totalViews = computed(() =>
  lsOffice.value.reduce((s, l) => s + (l.views ?? 0), 0)
)
const totalInquiries = computed(() =>
  lsOffice.value.reduce((s, l) => s + (l.inquiries?.total ?? 0), 0)
)
const allMR = computed<MarketingRequest[]>(() =>
  lsOffice.value.flatMap(l => l.marketingRequests ?? [])
)
const pendingMrCount = computed(() => allMR.value.filter(m => m.status === 'pending').length)

// ── search / filter ──
const activeTab  = ref<'units' | 'requests'>('units')
const searchQ    = ref('')
const filterType = ref('')
let   _searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearch() {
  if (_searchTimer) clearTimeout(_searchTimer)
  _searchTimer = setTimeout(() => {}, 0) // reactive via computed
}

const filteredUnits = computed(() => {
  let list = lsOffice.value
  if (filterType.value) list = list.filter(l => l.unitType === filterType.value)
  const q = searchQ.value.trim().toLowerCase()
  if (q) list = list.filter(l =>
    [l.code, l.title, lsOwnerName(l), propertyName(l), l.guard?.name].join(' ').toLowerCase().includes(q)
  )
  return list
})

// marketing requests filter
const mrFilter = ref('')
const mrFilterLabel = computed(() => ({ pending: 'بانتظار المراجعة', approved: 'مقبولة', rejected: 'مرفوضة' } as any)[mrFilter.value] || '')
const filteredMR = computed(() => {
  let list = allMR.value
  if (mrFilter.value) list = list.filter(m => m.status === mrFilter.value)
  return [...list].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
})

const mrStatusCls   = (s: string) => s === 'approved' ? 'badge-approved' : s === 'rejected' ? 'badge-rejected' : 'badge-pending'
const mrStatusLabel = (s: string) => ({ pending: 'بانتظار المراجعة', approved: 'مقبول', rejected: 'مرفوض' } as any)[s] ?? s

function decideMR(mrId: string, decision: 'approved' | 'rejected') {
  for (const l of extState.value.listings) {
    const mr = (l.marketingRequests || []).find(m => m.id === mrId)
    if (mr) {
      mr.status     = decision
      mr.decidedBy  = myActorKey.value
      mr.decidedAt  = new Date().toISOString()
      save()
      showToast(decision === 'approved' ? 'تم قبول الطلب' : 'تم رفض الطلب')
      return
    }
  }
}

// ── detail modal ──
const detailModal = reactive<{ open: boolean; listing: Listing | null }>({ open: false, listing: null })
const saving = ref(false)
const newAssignee = ref('')
const newMR = reactive({ type: 'photo', note: '' })

const editForm = reactive({
  views: 0,
  inquiriesTotal: 0, inquiriesRelated: 0, inquiriesCalls: 0,
  visitsComplete: 0,
  operators: 0,
  lastRead: '',
  assignees: [] as string[],
})

function openDetail(l: Listing) {
  detailModal.listing = l
  Object.assign(editForm, {
    views:             l.views            ?? 0,
    inquiriesTotal:    l.inquiries?.total   ?? 0,
    inquiriesRelated:  l.inquiries?.related ?? 0,
    inquiriesCalls:    l.inquiries?.calls   ?? 0,
    visitsComplete:    l.visitsComplete    ?? 0,
    operators:         l.operators         ?? 0,
    lastRead:          l.lastRead          ?? '',
    assignees:         [...(l.assignees ?? [])],
  })
  newAssignee.value = ''
  newMR.type = 'photo'
  newMR.note = ''
  detailModal.open = true
}

function closeDetail() {
  detailModal.open = false
  detailModal.listing = null
}

function addAssignee() {
  if (!newAssignee.value) return
  if (!editForm.assignees.includes(newAssignee.value)) {
    editForm.assignees.push(newAssignee.value)
  }
  newAssignee.value = ''
}

function removeAssignee(key: string) {
  editForm.assignees = editForm.assignees.filter(k => k !== key)
}

function addMR() {
  if (!detailModal.listing) return
  const mr: MarketingRequest = {
    id:          mrNextId(),
    listingId:   detailModal.listing.id,
    type:        newMR.type as any,
    typeLabel:   MR_TYPES[newMR.type] ?? newMR.type,
    note:        newMR.note.trim() || undefined,
    status:      'pending',
    requestedBy: myActorKey.value,
    requestedAt: new Date().toISOString(),
  }
  const target = extState.value.listings.find(l => l.id === detailModal.listing!.id)
  if (target) {
    if (!target.marketingRequests) target.marketingRequests = []
    target.marketingRequests.push(mr)
    save()
    showToast('تم إرسال طلب التسويق')
    newMR.note = ''
  }
}

function saveDetail() {
  if (!detailModal.listing) return
  saving.value = true
  try {
    const target = extState.value.listings.find(l => l.id === detailModal.listing!.id)
    if (target) {
      target.views          = editForm.views
      target.inquiries      = { total: editForm.inquiriesTotal, related: editForm.inquiriesRelated, calls: editForm.inquiriesCalls }
      target.visitsComplete = editForm.visitsComplete
      target.operators      = editForm.operators
      target.lastRead       = editForm.lastRead || undefined
      target.assignees      = [...editForm.assignees]
      save()
      showToast('تم حفظ بيانات الوحدة')
      closeDetail()
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Layout ── */
.page-title { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal,#3A3733); }
.page-title p  { margin:4px 0 0; color:var(--muted,#8A8479); font-size:12.5px; max-width:560px; line-height:1.6; }

/* ── Grid ── */
.grid      { display:grid; gap:14px; }
.grid-4    { grid-template-columns: repeat(4,1fr); }
.grid-3    { grid-template-columns: repeat(3,1fr); }
@media(max-width:1100px){ .grid-4{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:600px) { .grid-4{ grid-template-columns:1fr; } .grid-3{ grid-template-columns:1fr; } }

/* ── Stat cards ── */
.card { background:var(--surface,#fff); border:1px solid var(--line,#E6DFD3); border-radius:14px; padding:20px; }
.stat-card { border-right:4px solid var(--orange,#E1712F); }
.stat-card .lbl  { color:var(--muted,#8A8479); font-size:12px; font-weight:700; margin-bottom:4px; }
.stat-card .val  { font-size:26px; font-weight:900; color:var(--charcoal,#3A3733); line-height:1; }
.stat-card .sub  { font-size:11.5px; color:var(--muted,#8A8479); margin-top:4px; }

/* ── Tabs ── */
.pill-tabs { display:flex; gap:6px; flex-wrap:wrap; }
.pill-tab  {
  padding:8px 16px; border-radius:20px; border:1.5px solid var(--line,#E6DFD3);
  background:transparent; color:var(--muted,#8A8479); font-weight:700; font-size:13px;
  cursor:pointer; font-family:inherit; transition:.15s;
}
.pill-tab:hover  { background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733); }
.pill-tab.active { background:var(--orange,#E1712F); color:#fff; border-color:var(--orange,#E1712F); }

/* ── Search bar ── */
.search-bar { display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
.search-bar input {
  flex:1; min-width:200px; padding:10px 14px;
  border-radius:10px; border:1.5px solid var(--line,#E6DFD3);
  background:var(--surface,#fff); font-size:14px; outline:none; font-family:inherit;
}
.search-bar input:focus { border-color:var(--orange,#E1712F); }
.search-bar select {
  padding:9px 12px; border-radius:9px; border:1.5px solid var(--line,#E6DFD3);
  background:var(--surface,#fff); font-size:13px; font-weight:700; outline:none; font-family:inherit;
}

/* ── Table ── */
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13px; }
th {
  text-align:right; color:var(--muted,#8A8479); font-weight:700; font-size:11.5px;
  padding:9px 10px; border-bottom:1.5px solid var(--line,#E6DFD3); white-space:nowrap;
}
td { padding:11px 10px; border-bottom:1px solid var(--line,#E6DFD3); vertical-align:middle; }
tr:last-child td { border-bottom:none; }
tr.clickable:hover { background:var(--bg,#F3EFE8); cursor:pointer; }

.ls-code { background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733); font-size:11px; font-weight:800; padding:2px 8px; border-radius:6px; white-space:nowrap; }
.unit-title { font-weight:700; font-size:13px; color:var(--charcoal,#3A3733); margin-top:3px; }
.fw7 { font-weight:700; }
.muted { color:var(--muted,#8A8479); }
.stat-num { font-weight:800; font-size:15px; color:var(--charcoal,#3A3733); }
.inq-sub  { font-size:11px; margin-top:2px; }

/* ── Chips ── */
.chips-wrap { display:flex; flex-wrap:wrap; gap:4px; }
.chip {
  background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733);
  font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px;
}
.chip-link { color:var(--orange,#E1712F); text-decoration:none; }
.chip-link:hover { text-decoration:underline; }
.chip-removable { display:flex; align-items:center; gap:4px; }
.chip-rm {
  background:none; border:none; color:var(--muted,#8A8479);
  cursor:pointer; font-size:13px; padding:0; line-height:1;
}
.chip-rm:hover { color:var(--danger,#B3452F); }

/* ── Badge ── */
.badge         { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }
.badge-neutral  { background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733); }

/* ── Empty ── */
.empty-state { text-align:center; padding:48px 20px; }
.empty-state .empty-icon { font-size:36px; margin-bottom:10px; }
.empty-state b    { display:block; font-size:14.5px; color:var(--charcoal,#3A3733); margin-bottom:4px; }
.empty-state span { font-size:12.5px; color:var(--muted,#8A8479); }

/* ── Buttons ── */
.btn {
  border:none; border-radius:10px; padding:12px 18px;
  font-weight:800; font-size:14px; cursor:pointer;
  display:inline-flex; align-items:center; gap:6px; transition:.15s; font-family:inherit;
}
.btn-primary { background:var(--orange,#E1712F); color:#fff; }
.btn-primary:hover:not(:disabled) { background:#B85423; }
.btn-ghost   { background:transparent; color:var(--charcoal,#3A3733); border:1.5px solid var(--line,#E6DFD3); }
.btn-ghost:hover:not(:disabled) { border-color:var(--charcoal,#3A3733); }
.btn-success { background:#E4F1E7; color:#3F7D52; }
.btn-success:hover:not(:disabled) { background:#cde4d5; }
.btn-danger  { background:#F7E7E2; color:#B3452F; }
.btn-danger:hover:not(:disabled)  { background:#f0cdc6; }
.btn-sm { padding:7px 12px; font-size:12.5px; border-radius:8px; }
.btn:disabled { opacity:.6; cursor:not-allowed; }

/* ── Modal ── */
.modal-overlay {
  position:fixed; inset:0; background:rgba(46,43,39,.5);
  display:flex; align-items:center; justify-content:center; z-index:200; padding:20px;
}
.modal {
  background:var(--surface,#fff); border-radius:16px; padding:26px;
  width:100%; max-width:520px; max-height:90vh; overflow-y:auto;
}
.modal-lg { max-width:780px; }
.modal-head {
  display:flex; justify-content:space-between; align-items:flex-start;
  margin-bottom:18px; gap:10px;
}
.modal-head h3 { margin:0; font-size:17px; font-weight:800; color:var(--charcoal,#3A3733); }
.modal-close {
  background:var(--bg,#F3EFE8); border:none; width:30px; height:30px;
  border-radius:50%; font-size:18px; color:var(--muted,#8A8479); cursor:pointer; flex-shrink:0;
}
.modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:14px; }

/* ── Detail modal inner ── */
.det-stat { background:var(--bg,#F3EFE8); border-radius:12px; padding:14px 16px; }
.det-stat .lbl { font-size:11.5px; color:var(--muted,#8A8479); font-weight:700; margin-bottom:4px; }
.det-stat .val { font-size:22px; font-weight:900; color:var(--charcoal,#3A3733); }
.section-label { font-size:13px; font-weight:800; color:var(--muted,#8A8479); margin:0 0 10px; text-transform:uppercase; letter-spacing:.3px; }

/* ── Fields ── */
.field { margin-bottom:14px; }
.field label { display:block; font-size:12.5px; color:var(--muted,#8A8479); margin-bottom:5px; font-weight:700; }
.field input,
.field select {
  width:100%; padding:10px 12px; border-radius:9px; border:1.5px solid var(--line,#E6DFD3);
  background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733);
  font-family:inherit; font-size:13.5px; outline:none; box-sizing:border-box;
}
.field input:focus,
.field select:focus { border-color:var(--orange,#E1712F); background:var(--surface,#fff); }

/* ── card h3 ── */
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:var(--charcoal,#3A3733); }
</style>
