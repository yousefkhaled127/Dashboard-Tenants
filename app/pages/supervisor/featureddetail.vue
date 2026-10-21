<template>
  <div>
    <!-- Not found -->
    <template v-if="!feat">
      <div class="card" style="text-align:center;padding:48px;">
        <div style="font-size:32px;margin-bottom:12px;">🔍</div>
        <h3>لم يُعثر على العقار المميز</h3>
        <p class="muted">قد يكون قد حُذف أو الرابط غير صحيح</p>
        <button class="btn btn-dark" style="margin-top:16px;" @click="router.push('/supervisor/featured')">← رجوع للقائمة</button>
      </div>
    </template>

    <template v-else>
      <!-- Header -->
      <div class="page-title">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" @click="router.push('/supervisor/featured')">← رجوع</button>
          <div>
            <h2>{{ listing?.title || 'وحدة غير معروفة' }}</h2>
            <p>
              <span class="ls-code" style="font-size:12px;">{{ listing?.code||'—' }}</span>
              &nbsp;·&nbsp; {{ LS_TYPES[listing?.unitType||''] || listing?.unitType || '—' }}
              &nbsp;·&nbsp; {{ mainPrice }}
            </p>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <select class="ls-status-sel" :class="`ls-tone-${stageObj.tone}`" v-model="stageEdit" @change="saveStage">
            <option v-for="(s,i) in FT_STAGES" :key="s.k" :value="s.k">{{ i+1 }}. {{ s.l }}</option>
          </select>
          <button class="btn btn-dark btn-sm" @click="openAddTask">+ مهمة جديدة</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger);" @click="confirmRemove">× إزالة من المميزة</button>
        </div>
      </div>

      <!-- Info cards row -->
      <div class="grid grid-4" style="margin-bottom:16px;">
        <div class="card stat-card">
          <div class="lbl">حالة الوحدة</div>
          <div class="val" style="font-size:16px;">{{ lsStatusLabel(listing?.status) }}</div>
          <div class="sub">{{ listing?.vacant ? 'شاغرة' : 'مؤجرة' }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--warning);">
          <div class="lbl">مهام مفتوحة</div>
          <div class="val">{{ openCount }}</div>
          <div class="sub">من {{ feat.tasks.length }} مهمة</div>
        </div>
        <div class="card stat-card" :style="lateCount>0?'border-right-color:var(--danger);':''">
          <div class="lbl">مهام متأخرة</div>
          <div class="val">{{ lateCount }}</div>
        </div>
        <div class="card stat-card" style="border-right-color:var(--success);">
          <div class="lbl">منجزة</div>
          <div class="val">{{ doneCount }}</div>
          <div class="sub">{{ activeCount ? Math.round(doneCount/activeCount*100) : 0 }}% منجزة</div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="card" style="margin-bottom:16px;padding:14px 18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-weight:700;font-size:13.5px;">تقدم إنجاز المهام</span>
          <span class="muted" style="font-size:12px;">{{ doneCount }}/{{ activeCount }} منجزة</span>
        </div>
        <div class="ls-mini-progress" style="height:10px;border-radius:6px;">
          <div :style="`width:${progress}%;background:var(--success);`" style="border-radius:6px;"></div>
        </div>
      </div>

      <!-- Stage roadmap -->
      <div class="card" style="margin-bottom:16px;overflow-x:auto;">
        <h3 style="margin-bottom:14px;">مراحل التسويق</h3>
        <div class="ft-roadmap">
          <div v-for="(s,i) in FT_STAGES" :key="s.k"
               class="ft-rm-step"
               :class="{ done: rmDone(s.k), current: feat.stage===s.k }">
            <div class="ft-rm-num">{{ i+1 }}</div>
            <div class="ft-rm-label">{{ s.l }}</div>
          </div>
        </div>
      </div>

      <!-- Tasks table -->
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h3 style="margin:0;">المهام ({{ feat.tasks.length }})</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <select v-model="taskStFilter" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:6px;">
              <option value="">كل الحالات</option>
              <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k">{{ s.l }}</option>
              <option value="late">المتأخرة</option>
            </select>
            <select v-model="taskAssFilter" style="font-size:12px;padding:4px 8px;border:1px solid #ddd;border-radius:6px;">
              <option value="">كل المستخدمين</option>
              <option v-for="s in allStaff" :key="s.key" :value="s.key">{{ s.name }}</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>النوع</th><th>المهمة</th><th>المسؤول</th>
                <th>الاستحقاق</th><th>الحالة</th><th>منجزة بواسطة</th><th></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="filteredTasks.length">
                <tr v-for="t in filteredTasks" :key="t.id" :class="{ late: isLate(t) }">
                  <td><span class="badge badge-neutral">{{ FT_TASK_TYPES[t.type]||t.type }}</span></td>
                  <td>
                    <div style="font-weight:700;font-size:13px;">{{ t.title }}</div>
                    <div v-if="t.note" class="muted" style="font-size:11.5px;margin-top:2px;">{{ t.note }}</div>
                  </td>
                  <td>{{ actorName(t.assignee) }}</td>
                  <td :class="{ late: isLate(t) }" style="white-space:nowrap;">
                    {{ t.due ? fmtDate(t.due) : '—' }}
                    <span v-if="isLate(t)" style="color:var(--danger);font-size:11px;display:block;">متأخرة</span>
                  </td>
                  <td>
                    <select class="ls-status-sel" :class="`ls-tone-${FT_TASK_ST[t.status]?.tone||'muted'}`"
                            @change="e=>setTaskStatus(t.id,(e.target as HTMLSelectElement).value)">
                      <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k" :selected="t.status===k">{{ s.l }}</option>
                    </select>
                  </td>
                  <td style="font-size:11.5px;">
                    <template v-if="t.doneAt">
                      {{ actorName(t.doneBy||'') }}<br>
                      <span class="muted">{{ fmtDate((t.doneAt||'').slice(0,10)) }}</span>
                    </template>
                    <span v-else class="muted">—</span>
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;">
                      <button class="btn btn-ghost btn-sm" @click="openEditTask(t)">تعديل</button>
                      <button class="btn btn-ghost btn-sm" style="color:var(--danger);" @click="deleteTask(t.id)">×</button>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="7">
                  <div class="empty-state">
                    <b>{{ feat.tasks.length ? 'لا توجد مهام مطابقة للفلتر' : 'لا توجد مهام بعد' }}</b>
                    <span>اضغط «+ مهمة جديدة» لإضافة مهمة</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- History log -->
      <div class="card">
        <h3 style="margin-bottom:12px;">سجل الأحداث ({{ feat.history?.length||0 }})</h3>
        <template v-if="feat.history?.length">
          <div v-for="h in [...feat.history].reverse()" :key="h.id" class="ft-hist-item">
            <div class="ft-hist-dot" :class="histColor(h)"></div>
            <div class="ft-hist-body">
              <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;">
                <span style="font-weight:700;font-size:13px;">{{ histLabel(h) }}</span>
                <span class="muted" style="font-size:11.5px;">{{ actorName(h.by) }} · {{ fmtDate((h.at||'').slice(0,10)) }} {{ (h.at||'').slice(11,16) }}</span>
              </div>
              <div v-if="h.note" class="muted" style="font-size:12px;margin-top:3px;">{{ h.note }}</div>
            </div>
          </div>
        </template>
        <div v-else class="empty-state"><b>لا توجد أحداث مسجلة</b></div>
      </div>
    </template>

    <!-- ===== ADD / EDIT TASK MODAL ===== -->
    <Teleport to="body">
      <div v-if="taskModal" class="modal-overlay" @click.self="taskModal=false">
        <div class="modal" style="max-width:520px;width:100%;">
          <div class="modal-header">
            <h3>{{ editTaskId ? 'تعديل المهمة' : 'مهمة جديدة' }}</h3>
            <button class="modal-close" @click="taskModal=false">×</button>
          </div>
          <div class="modal-body">
            <div class="row2">
              <div class="field">
                <label>نوع المهمة <span class="req">*</span></label>
                <select v-model="tf.type">
                  <option value="">اختر النوع</option>
                  <option v-for="(lbl,k) in FT_TASK_TYPES" :key="k" :value="k">{{ lbl }}</option>
                </select>
              </div>
              <div class="field">
                <label>الحالة</label>
                <select v-model="tf.status">
                  <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k">{{ s.l }}</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>عنوان المهمة <span class="req">*</span></label>
              <input v-model="tf.title" placeholder="وصف موجز للمهمة..." />
            </div>
            <div class="row2">
              <div class="field">
                <label>المسؤول</label>
                <select v-model="tf.assignee">
                  <option value="">غير محدد</option>
                  <option v-for="s in allStaff" :key="s.key" :value="s.key">{{ s.name }}</option>
                </select>
              </div>
              <div class="field">
                <label>تاريخ الاستحقاق</label>
                <input type="date" v-model="tf.due" />
              </div>
            </div>
            <div class="field">
              <label>ملاحظة</label>
              <textarea v-model="tf.note" placeholder="أي تفاصيل إضافية..." rows="2" />
            </div>
            <div v-if="taskErr" class="form-error">{{ taskErr }}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="taskModal=false">إلغاء</button>
            <button class="btn btn-dark" @click="saveTask">{{ editTaskId ? 'حفظ التعديل' : 'إضافة المهمة' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== CONFIRM REMOVE MODAL ===== -->
    <Teleport to="body">
      <div v-if="removeModal" class="modal-overlay" @click.self="removeModal=false">
        <div class="modal" style="max-width:420px;width:100%;">
          <div class="modal-header">
            <h3>إزالة من التسويق المميز</h3>
            <button class="modal-close" @click="removeModal=false">×</button>
          </div>
          <div class="modal-body">
            <p>هل أنت متأكد من إزالة <b>{{ listing?.title || 'هذا العقار' }}</b> من قائمة التسويق المميز؟</p>
            <p class="muted" style="font-size:12px;">سيُحذف سجل المهام والتاريخ المرتبط به نهائيًا.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="removeModal=false">إلغاء</button>
            <button class="btn" style="background:var(--danger);color:#fff;" @click="doRemove">إزالة</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useExtState, type Featured, type FeaturedTask } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const route  = useRoute()
const router = useRouter()
const id = computed(() => String(route.query.id || ''))

const { extState, load, save, uid, getListing, ftLive } = useExtState()
const { fmtDate, fmtMoney, todayISO } = useFormat()
const { auth } = useApi()
const showToast = inject<(m:string)=>void>('showToast', m=>console.log(m))
const supervisorSession = inject<any>('supervisorSession')

onMounted(async () => {
  load()
  try {
    const [sups, cols] = await Promise.all([auth.usersByType('supervisor'), auth.usersByType('collector')])
    allStaff.value = [
      ...sups.map(u => ({ key:`supervisor:${u.id}`, name:u.name })),
      ...cols.map(u => ({ key:`collector:${u.id}`,  name:u.name })),
    ]
  } catch {}
})

// ===== CONSTANTS =====
const LS_TYPES: Record<string,string> = {
  apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة',
  land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى'
}
const FT_STAGES = [
  { k:'initial',          l:'تسويق مبدئي',       tone:'muted'  },
  { k:'precise_location', l:'موقع دقيق',          tone:'warn'   },
  { k:'video',            l:'تسويق فيديوهات',     tone:'orange' },
  { k:'campaign',         l:'حملة إعلانية',       tone:'orange' },
  { k:'full',             l:'تسويق كامل',         tone:'ok'     },
]
const FT_TASK_TYPES: Record<string,string> = {
  photo:'طلب تصوير', video:'طلب فيديو', location:'طلب موقع دقيق',
  design:'تصميم إعلان', campaign:'إطلاق حملة إعلانية', publish:'نشر في منصة',
  visit:'معاينة / زيارة', other:'مهمة أخرى'
}
const FT_TASK_ST: Record<string,{l:string;tone:string}> = {
  open:      { l:'جديدة',          tone:'muted'  },
  progress:  { l:'جاري التنفيذ',   tone:'orange' },
  done:      { l:'منجزة',          tone:'ok'     },
  cancelled: { l:'ملغاة',          tone:'danger' },
}

const lsStatusLabel = (k?:string) => {
  const MAP: Record<string,string> = {
    name_only:'عندي الاسم فقط', basic_details:'تفاصيل أولية',
    photographed:'تم التصوير', waiting_video:'بانتظار الفيديو',
    website_only:'بالموقع فقط', awaiting_owner_license:'بانتظار الترخيص',
    license_issued:'تم الترخيص', publishing:'جاري التنزيل',
    published:'تم تنزيل الإعلان', license_renewal:'ترخيص منتهي',
    license_expired:'ترخيص منتهي تماماً'
  }
  return MAP[k||''] || k || '—'
}

// ===== STATE =====
const allStaff = ref<{key:string;name:string}[]>([])
const myActorKey = computed(() => { const s = supervisorSession?.value; return s ? `supervisor:${s.id}` : '' })
const stageEdit = ref('')
const taskStFilter  = ref('')
const taskAssFilter = ref('')

// ===== DERIVED =====
const feat    = computed(() => extState.value.featured.find(f => f.id === id.value) ?? null)
const listing = computed(() => feat.value ? getListing(feat.value.listingId) : null)
const stageObj = computed(() => FT_STAGES.find(s => s.k === feat.value?.stage) || FT_STAGES[0])

watch(feat, f => { if (f) stageEdit.value = f.stage }, { immediate: true })

const mainPrice = computed(() => {
  const l = listing.value
  if (!l) return '—'
  return Number(l.rentPrice)>0 ? fmtMoney(l.rentPrice)
       : Number(l.salePrice)>0 ? fmtMoney(l.salePrice) : '—'
})

const isOpen = (t: FeaturedTask) => t.status==='open' || t.status==='progress'
const isLate = (t: FeaturedTask) => isOpen(t) && !!t.due && t.due < todayISO()

const activeCount = computed(() => feat.value?.tasks.filter(t=>t.status!=='cancelled').length ?? 0)
const doneCount   = computed(() => feat.value?.tasks.filter(t=>t.status==='done').length ?? 0)
const openCount   = computed(() => feat.value?.tasks.filter(t=>isOpen(t)).length ?? 0)
const lateCount   = computed(() => feat.value?.tasks.filter(isLate).length ?? 0)
const progress    = computed(() => activeCount.value ? Math.round(doneCount.value/activeCount.value*100) : 0)

const filteredTasks = computed(() => {
  if (!feat.value) return []
  let list = [...feat.value.tasks]
  if (taskStFilter.value === 'late') list = list.filter(isLate)
  else if (taskStFilter.value) list = list.filter(t => t.status===taskStFilter.value)
  if (taskAssFilter.value) list = list.filter(t => t.assignee===taskAssFilter.value)
  return list.sort((a,b) => (isOpen(b)?1:0)-(isOpen(a)?1:0) || (a.due||'9').localeCompare(b.due||'9'))
})

// ===== STAGE ROADMAP =====
const stageIndex  = computed(() => FT_STAGES.findIndex(s => s.k === feat.value?.stage))
const rmDone      = (k: string) => FT_STAGES.findIndex(s=>s.k===k) <= stageIndex.value

// ===== HELPERS =====
const actorName = (key:string) => allStaff.value.find(s=>s.key===key)?.name || (key||'—').split(':').pop() || '—'

// ===== SAVE STAGE =====
function saveStage() {
  const f = extState.value.featured.find(x=>x.id===id.value); if (!f) return
  const from = f.stage
  f.stage = stageEdit.value
  f.updatedAt = new Date().toISOString(); f.updatedBy = myActorKey.value
  f.history = f.history || []
  f.history.push({ id:uid(), at:f.updatedAt, by:myActorKey.value, type:'stage', from, to:stageEdit.value })
  save()
  showToast('مرحلة التسويق: ' + (FT_STAGES.find(s=>s.k===stageEdit.value)?.l||stageEdit.value))
}

// ===== TASK MODAL =====
const taskModal  = ref(false)
const editTaskId = ref<string|null>(null)
const taskErr    = ref('')
const tf = reactive({ type:'', title:'', assignee:'', due:'', note:'', status:'open' })

function openAddTask() {
  editTaskId.value = null
  Object.assign(tf, { type:'', title:'', assignee:myActorKey.value, due:'', note:'', status:'open' })
  taskErr.value = ''
  taskModal.value = true
}

function openEditTask(t: FeaturedTask) {
  editTaskId.value = t.id
  Object.assign(tf, { type:t.type, title:t.title, assignee:t.assignee, due:t.due||'', note:t.note||'', status:t.status })
  taskErr.value = ''
  taskModal.value = true
}

function saveTask() {
  taskErr.value = ''
  if (!tf.type)  { taskErr.value = 'اختر نوع المهمة'; return }
  if (!tf.title.trim()) { taskErr.value = 'أدخل عنوان المهمة'; return }
  const f = extState.value.featured.find(x=>x.id===id.value); if (!f) return
  const now = new Date().toISOString()
  if (editTaskId.value) {
    const t = f.tasks.find(x=>x.id===editTaskId.value); if (!t) return
    t.type = tf.type; t.title = tf.title.trim(); t.assignee = tf.assignee
    t.due = tf.due; t.note = tf.note; t.status = tf.status as any
    if (tf.status==='done' && !t.doneAt) { t.doneAt=now; t.doneBy=myActorKey.value }
    if (tf.status!=='done') { t.doneAt=null; t.doneBy=undefined }
    f.history.push({ id:uid(), at:now, by:myActorKey.value, type:'task', action:'edit', title:t.title })
    showToast('تم تعديل المهمة')
  } else {
    const t: FeaturedTask = {
      id: uid(), type: tf.type, title: tf.title.trim(),
      assignee: tf.assignee, due: tf.due, note: tf.note,
      status: tf.status as any, doneAt: null
    }
    f.tasks.push(t)
    f.history.push({ id:uid(), at:now, by:myActorKey.value, type:'task', action:'add', title:t.title })
    showToast('تمت إضافة المهمة')
  }
  f.updatedAt = now; f.updatedBy = myActorKey.value
  save()
  taskModal.value = false
}

// ===== DELETE TASK =====
function deleteTask(tid: string) {
  const f = extState.value.featured.find(x=>x.id===id.value); if (!f) return
  const t = f.tasks.find(x=>x.id===tid); if (!t) return
  if (!confirm(`حذف المهمة «${t.title}»؟`)) return
  f.tasks = f.tasks.filter(x=>x.id!==tid)
  const now = new Date().toISOString()
  f.history.push({ id:uid(), at:now, by:myActorKey.value, type:'task', action:'delete', title:t.title })
  f.updatedAt = now; f.updatedBy = myActorKey.value
  save(); showToast('حُذفت المهمة')
}

// ===== SET TASK STATUS (inline) =====
function setTaskStatus(tid: string, st: string) {
  const f = extState.value.featured.find(x=>x.id===id.value); if (!f) return
  const t = f.tasks.find(x=>x.id===tid); if (!t) return
  t.status = st as any
  const now = new Date().toISOString()
  if (st==='done') { t.doneAt=now; t.doneBy=myActorKey.value }
  else { t.doneAt=null; t.doneBy=undefined }
  f.updatedAt = now; f.updatedBy = myActorKey.value
  f.history.push({ id:uid(), at:now, by:myActorKey.value, type:'task', action:'status', title:t.title, to:st })
  save(); showToast(`«${t.title}»: ${FT_TASK_ST[st]?.l||st}`)
}

// ===== REMOVE FROM FEATURED =====
const removeModal = ref(false)
function confirmRemove() { removeModal.value = true }
function doRemove() {
  extState.value.featured = extState.value.featured.filter(f=>f.id!==id.value)
  save(); showToast('أُزيل من التسويق المميز')
  router.push('/supervisor/featured')
}

// ===== HISTORY HELPERS =====
function histLabel(h: any) {
  if (h.type==='add')   return 'أُضيف للتسويق المميز'
  if (h.type==='stage') return `تغيير المرحلة: ${FT_STAGES.find(s=>s.k===h.from)?.l||h.from} → ${FT_STAGES.find(s=>s.k===h.to)?.l||h.to}`
  if (h.type==='task') {
    if (h.action==='add')    return `إضافة مهمة: ${h.title}`
    if (h.action==='edit')   return `تعديل مهمة: ${h.title}`
    if (h.action==='delete') return `حذف مهمة: ${h.title}`
    if (h.action==='status') return `تحديث حالة «${h.title}» → ${FT_TASK_ST[h.to]?.l||h.to}`
  }
  return h.type
}
function histColor(h: any) {
  if (h.type==='add') return 'hist-green'
  if (h.type==='stage') return 'hist-orange'
  if (h.action==='delete') return 'hist-red'
  return 'hist-blue'
}
</script>

<style scoped>
/* ── roadmap ── */
.ft-roadmap {
  display: flex; align-items: flex-start; gap: 0; min-width: 520px;
}
.ft-rm-step {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
  position: relative; text-align: center;
}
.ft-rm-step:not(:last-child)::after {
  content: ''; position: absolute; top: 14px; left: 50%; width: 100%;
  height: 2px; background: #e0d9d0; z-index: 0;
}
.ft-rm-step.done:not(:last-child)::after { background: var(--success); }
.ft-rm-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: #e0d9d0; color: #888; font-weight: 800; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  position: relative; z-index: 1; transition: background .2s;
}
.ft-rm-step.done .ft-rm-num  { background: var(--success); color: #fff; }
.ft-rm-step.current .ft-rm-num { background: var(--orange); color: #fff; box-shadow: 0 0 0 3px rgba(225,113,47,.25); }
.ft-rm-label { font-size: 11px; color: #888; font-weight: 600; line-height: 1.3; }
.ft-rm-step.done .ft-rm-label    { color: var(--success); }
.ft-rm-step.current .ft-rm-label { color: var(--orange);  font-weight: 800; }

/* ── history ── */
.ft-hist-item {
  display: flex; gap: 12px; padding: 10px 0;
  border-bottom: 1px solid #f0ece6;
}
.ft-hist-item:last-child { border-bottom: none; }
.ft-hist-dot {
  width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0;
}
.hist-green  { background: var(--success); }
.hist-orange { background: var(--orange); }
.hist-red    { background: var(--danger); }
.hist-blue   { background: #4f80e1; }
.ft-hist-body { flex: 1; }

/* ── misc ── */
.late { color: var(--danger); }
.req  { color: var(--danger); }
.ls-mini-progress {
  height: 8px; background: #f0ece6; border-radius: 4px; overflow: hidden;
}
.ls-mini-progress > div { height: 100%; transition: width .3s; }
</style>
