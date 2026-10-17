<template>
  <div>
    <div class="page-title">
      <div>
        <h2>التسويق المميز للعقارات</h2>
        <p>تابع مرحلة التسويق ووزّع المهام (تصوير، فيديو، موقع دقيق…) على المستخدمين</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-4" style="margin-bottom:16px;">
      <div class="card stat-card"><div class="lbl">عقارات مميزة</div><div class="val">{{ ftLive.length }}</div><div class="sub">{{ ftLive.filter(f=>f.stage==='full').length }} بتسويق كامل</div></div>
      <div class="card stat-card" style="border-right-color:var(--warning);">
        <div class="lbl">مهام مفتوحة</div><div class="val">{{ openTasksCount }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--danger);">
        <div class="lbl">مهام متأخرة</div><div class="val">{{ lateTasksCount }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--success);">
        <div class="lbl">مهامي المفتوحة</div><div class="val">{{ myOpenTasks }}</div>
      </div>
    </div>

    <!-- View tabs -->
    <div class="pill-tabs" style="flex-wrap:wrap;">
      <button class="pill-tab" :class="{ active: view==='board' }" @click="view='board'">العقارات المميزة ({{ ftLive.length }})</button>
      <button class="pill-tab" :class="{ active: view==='mine' }"  @click="view='mine'">مهامي ({{ myOpenTasks }})</button>
      <button class="pill-tab" :class="{ active: view==='tasks' }" @click="view='tasks'">كل المهام ({{ allTasks.length }})</button>
    </div>

    <!-- ===== BOARD VIEW ===== -->
    <template v-if="view==='board'">
      <!-- Search to add -->
      <div class="card" style="margin-bottom:16px;">
        <h3>إضافة عقار للتسويق المميز</h3>
        <div class="search-bar">
          <input v-model="searchQ" placeholder="ابحث في مهام العقارات الشاغرة: الكود، اسم الوحدة، المالك...">
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>الكود</th><th>الوحدة</th><th>النوع</th><th>السعر</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              <template v-if="searchResults.length">
                <tr v-for="l in searchResults" :key="l.id">
                  <td><span class="ls-code">{{ l.code }}</span></td>
                  <td><b>{{ l.title||'—' }}</b></td>
                  <td>{{ LS_TYPES[l.unitType]||'—' }}</td>
                  <td>{{ Number(l.rentPrice)>0?fmtMoney(l.rentPrice):Number(l.salePrice)>0?fmtMoney(l.salePrice):'—' }}</td>
                  <td><span class="ls-badge ls-tone-muted">{{ lsStatusLabel(l.status) }}</span></td>
                  <td><button class="btn btn-dark btn-sm" @click="addToFeatured(l.id)">★ إضافة للتسويق المميز</button></td>
                </tr>
              </template>
              <tr v-else><td colspan="6"><div class="empty-state"><b>{{ searchQ ? 'لا توجد نتائج' : 'اكتب للبحث في الوحدات الشاغرة' }}</b></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Featured table -->
      <div class="card">
        <h3>العقارات المميزة</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الكود</th><th>الوحدة</th><th>السعر</th><th>حالة الوحدة</th>
                <th>مرحلة التسويق</th><th>المهام</th><th>المكلَّفون</th><th>أُضيفت بواسطة</th><th></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="ftLive.length">
                <tr v-for="f in ftLive" :key="f.id" class="clickable" @click="openFeatured(f.id)">
                  <td>
                    <span class="ls-code">{{ getListing(f.listingId)?.code||'—' }}</span>
                  </td>
                  <td><b>{{ getListing(f.listingId)?.title||'—' }}</b>
                    <div v-if="!getListing(f.listingId)?.vacant" class="muted" style="font-size:11px;">غير شاغرة</div>
                  </td>
                  <td>{{ mainPrice(getListing(f.listingId)) }}</td>
                  <td>
                    <span v-if="getListing(f.listingId)?.vacant" class="ls-badge ls-tone-muted">{{ lsStatusLabel(getListing(f.listingId)?.status) }}</span>
                    <span v-else class="ls-badge ls-tone-muted">غير شاغرة</span>
                  </td>
                  <td>
                    <select class="ls-status-sel" :class="`ls-tone-${ftStageObj(f.stage).tone}`"
                            @click.stop @change="e=>setStage(f.id,(e.target as HTMLSelectElement).value)">
                      <option v-for="(s,i) in FT_STAGES" :key="s.k" :value="s.k" :selected="f.stage===s.k">{{ i+1 }}. {{ s.l }}</option>
                    </select>
                  </td>
                  <td>
                    <div class="ls-mini-progress"><div :style="`width:${taskProgress(f)}%`"></div></div>
                    <div class="muted" style="font-size:11px;margin-top:3px;">
                      {{ doneCount(f) }}/{{ activeCount(f) }} منجزة
                      <span v-if="lateCount(f)" class="late"> · {{ lateCount(f) }} متأخرة</span>
                    </div>
                  </td>
                  <td>
                    <div class="ft-assignees">
                      <span v-for="k in openAssignees(f)" :key="k" class="ft-chip">{{ actorName(k) }}</span>
                      <span v-if="!openAssignees(f).length" class="muted">—</span>
                    </div>
                  </td>
                  <td style="white-space:nowrap;font-size:11.5px;">{{ actorName(f.addedBy) }}<br><span class="muted">{{ fmtDate((f.addedAt||'').slice(0,10)) }}</span></td>
                  <td @click.stop><button class="btn btn-ghost btn-sm" @click="openFeatured(f.id)">فتح ›</button></td>
                </tr>
              </template>
              <tr v-else><td colspan="9"><div class="empty-state"><b>لا توجد عقارات مميزة بعد</b>ابحث بالأعلى واضغط «إضافة للتسويق المميز»</div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ===== MINE VIEW ===== -->
    <template v-else-if="view==='mine'">
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>الوحدة</th><th>المهمة</th><th>الاستحقاق</th><th>الحالة</th><th></th></tr></thead>
            <tbody>
              <template v-if="myTasks.length">
                <tr v-for="{ f, t } in myTasks" :key="t.id" :class="{ clickable: true }">
                  <td><span class="ls-code">{{ getListing(f.listingId)?.code||'—' }}</span><br><span style="font-size:12px;">{{ getListing(f.listingId)?.title }}</span></td>
                  <td><span class="badge badge-neutral">{{ FT_TASK_TYPES[t.type]||t.type }}</span><div style="font-weight:700;font-size:12.5px;margin-top:3px;">{{ t.title }}</div><div class="muted" style="font-size:11.5px;">{{ t.note }}</div></td>
                  <td :class="{ late: isLate(t) }">{{ t.due ? fmtDate(t.due) : '—' }}</td>
                  <td>
                    <select class="ls-status-sel" :class="`ls-tone-${ftTaskStObj(t.status).tone}`"
                            @change="e=>setTaskStatus(f.id,t.id,(e.target as HTMLSelectElement).value)">
                      <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k" :selected="t.status===k">{{ s.l }}</option>
                    </select>
                  </td>
                  <td><button class="btn btn-ghost btn-sm" @click="openFeatured(f.id)">فتح ›</button></td>
                </tr>
              </template>
              <tr v-else><td colspan="5"><div class="empty-state"><b>لا توجد مهام مسندة إليك</b></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ===== ALL TASKS VIEW ===== -->
    <template v-else>
      <div class="search-bar">
        <select v-model="taskAssF">
          <option value="">كل المستخدمين</option>
          <option v-for="s in allStaff" :key="s.key" :value="s.key">{{ s.name }}</option>
        </select>
        <select v-model="taskStF">
          <option value="">كل الحالات</option>
          <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k">{{ s.l }}</option>
          <option value="late">المتأخرة فقط</option>
        </select>
        <select v-model="taskTypeF">
          <option value="">كل أنواع المهام</option>
          <option v-for="(lbl,k) in FT_TASK_TYPES" :key="k" :value="k">{{ lbl }}</option>
        </select>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>الوحدة</th><th>المهمة</th><th>المسؤول</th><th>الاستحقاق</th><th>الحالة</th><th>أنشأها</th><th></th></tr></thead>
            <tbody>
              <template v-if="filteredAllTasks.length">
                <tr v-for="{ f, t } in filteredAllTasks" :key="t.id">
                  <td><span class="ls-code">{{ getListing(f.listingId)?.code||'—' }}</span><br><span style="font-size:12px;">{{ getListing(f.listingId)?.title }}</span></td>
                  <td><span class="badge badge-neutral">{{ FT_TASK_TYPES[t.type]||t.type }}</span><div style="font-weight:700;font-size:12.5px;margin-top:3px;">{{ t.title }}</div></td>
                  <td>{{ actorName(t.assignee) }}</td>
                  <td :class="{ late: isLate(t) }">{{ t.due?fmtDate(t.due):'—' }}{{ isLate(t)?' (متأخرة)':'' }}</td>
                  <td>
                    <select class="ls-status-sel" :class="`ls-tone-${ftTaskStObj(t.status).tone}`"
                            @change="e=>setTaskStatus(f.id,t.id,(e.target as HTMLSelectElement).value)">
                      <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k" :selected="t.status===k">{{ s.l }}</option>
                    </select>
                  </td>
                  <td style="font-size:11.5px;">{{ actorName(t.createdBy) }}<br><span class="muted">{{ fmtDate((t.createdAt||'').slice(0,10)) }}</span></td>
                  <td><button class="btn btn-ghost btn-sm" @click="openFeatured(f.id)">فتح ›</button></td>
                </tr>
              </template>
              <tr v-else><td colspan="7"><div class="empty-state"><b>لا توجد مهام مطابقة</b></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useExtState, type Featured, type FeaturedTask } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const { extState, load, save, uid, lsOffice, ftLive, ftByListing, getListing } = useExtState()
const { fmtDate, fmtMoney, todayISO } = useFormat()
const { auth } = useApi()
const router = useRouter()
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

const allStaff = ref<{key:string;name:string}[]>([])
const myActorKey = computed(() => { const s = supervisorSession?.value; return s ? `supervisor:${s.id}` : '' })

// ===== CONSTANTS =====
const LS_TYPES: Record<string,string> = { apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة', land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى' }
const FT_STAGES = [
  {k:'initial', l:'تسويق مبدئي', tone:'muted'},
  {k:'precise_location', l:'موقع دقيق', tone:'warn'},
  {k:'video', l:'تسويق فيديوهات', tone:'orange'},
  {k:'campaign', l:'حملة إعلانية', tone:'orange'},
  {k:'full', l:'تسويق كامل', tone:'ok'},
]
const FT_TASK_TYPES: Record<string,string> = { photo:'طلب تصوير', video:'طلب فيديو', location:'طلب موقع دقيق', design:'تصميم إعلان', campaign:'إطلاق حملة إعلانية', publish:'نشر في منصة', visit:'معاينة / زيارة', other:'مهمة أخرى' }
const FT_TASK_ST: Record<string,{l:string;tone:string}> = { open:{l:'جديدة',tone:'muted'}, progress:{l:'جاري التنفيذ',tone:'orange'}, done:{l:'منجزة',tone:'ok'}, cancelled:{l:'ملغاة',tone:'danger'} }

const ftStageObj = (k:string) => FT_STAGES.find(s=>s.k===k) || FT_STAGES[0]
const ftTaskStObj = (k:string) => FT_TASK_ST[k] || FT_TASK_ST.open
const lsStatusLabel = (k?:string) => {
  const MAP: Record<string,string> = { name_only:'عندي الاسم فقط', basic_details:'تفاصيل أولية', photographed:'تم التصوير', waiting_video:'بانتظار الفيديو', website_only:'بالموقع فقط', awaiting_owner_license:'بانتظار الترخيص', license_issued:'تم الترخيص', publishing:'جاري التنزيل', published:'تم تنزيل الإعلان', license_renewal:'ترخيص منتهي', license_expired:'ترخيص منتهي تماماً' }
  return MAP[k||''] || k || '—'
}
const mainPrice = (l:any) => l ? (Number(l.rentPrice)>0 ? fmtMoney(l.rentPrice) : Number(l.salePrice)>0 ? fmtMoney(l.salePrice) : '—') : '—'
const actorName = (key:string) => allStaff.value.find(s=>s.key===key)?.name || (key||'—').split(':')[1] || '—'

// ===== VIEW STATE =====
const view = ref<'board'|'mine'|'tasks'>('board')
const searchQ = ref('')
const taskAssF = ref(''), taskStF = ref(''), taskTypeF = ref('')

// ===== ALL TASKS FLAT =====
type TaskEntry = { f: Featured; t: FeaturedTask }
const allTasks = computed<TaskEntry[]>(() => {
  const out: TaskEntry[] = []
  ftLive.value.forEach(f => f.tasks.forEach(t => out.push({f,t})))
  return out
})
const isOpen = (t: FeaturedTask) => t.status==='open' || t.status==='progress'
const isLate = (t: FeaturedTask) => isOpen(t) && !!t.due && t.due < todayISO()

const openTasksCount = computed(() => allTasks.value.filter(x=>isOpen(x.t)).length)
const lateTasksCount = computed(() => allTasks.value.filter(x=>isLate(x.t)).length)
const myOpenTasks    = computed(() => allTasks.value.filter(x=>x.t.assignee===myActorKey.value&&isOpen(x.t)).length)

const myTasks = computed(() => allTasks.value.filter(x=>x.t.assignee===myActorKey.value).sort((a,b)=>(isOpen(b.t)?1:0)-(isOpen(a.t)?1:0)))
const filteredAllTasks = computed(() => {
  let list = allTasks.value
  if (taskAssF.value)  list = list.filter(x=>x.t.assignee===taskAssF.value)
  if (taskStF.value==='late') list = list.filter(x=>isLate(x.t))
  else if (taskStF.value) list = list.filter(x=>x.t.status===taskStF.value)
  if (taskTypeF.value) list = list.filter(x=>x.t.type===taskTypeF.value)
  return list.sort((a,b)=>(isOpen(b.t)?1:0)-(isOpen(a.t)?1:0)||(a.t.due||'9').localeCompare(b.t.due||'9'))
})

// ===== HELPERS =====
const doneCount   = (f:Featured) => f.tasks.filter(t=>t.status==='done').length
const activeCount = (f:Featured) => f.tasks.filter(t=>t.status!=='cancelled').length
const lateCount   = (f:Featured) => f.tasks.filter(isLate).length
const taskProgress= (f:Featured) => { const a=activeCount(f); return a ? Math.round(doneCount(f)/a*100) : 0 }
const openAssignees=(f:Featured) => [...new Set(f.tasks.filter(isOpen).map(t=>t.assignee))]

// ===== SEARCH RESULTS =====
const searchResults = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  return lsOffice.value.filter(l => l.vacant && !ftByListing(l.id) && (!q || [l.code,l.title].join(' ').toLowerCase().includes(q))).slice(0, 10)
})

// ===== ADD TO FEATURED =====
function addToFeatured(listingId: string) {
  if (ftByListing(listingId)) { showToast('مضافة بالفعل'); return }
  const now = new Date().toISOString()
  const f: Featured = { id:uid(), listingId, stage:'initial', addedBy:myActorKey.value, addedAt:now, updatedAt:now, updatedBy:myActorKey.value, tasks:[], history:[] }
  f.history.push({ id:uid(), at:now, by:myActorKey.value, type:'add' })
  extState.value.featured.push(f)
  save(); showToast('أُضيفت للتسويق المميز')
}

// ===== SET STAGE =====
function setStage(fid: string, k: string) {
  const f = extState.value.featured.find(x=>x.id===fid); if(!f) return
  const from = f.stage; f.stage=k; f.updatedAt=new Date().toISOString(); f.updatedBy=myActorKey.value
  f.history.push({ id:uid(), at:f.updatedAt, by:myActorKey.value, type:'stage', from, to:k })
  save(); showToast('مرحلة التسويق: '+ftStageObj(k).l)
}

// ===== SET TASK STATUS =====
function setTaskStatus(fid: string, tid: string, st: string) {
  const f = extState.value.featured.find(x=>x.id===fid); if(!f) return
  const t = f.tasks.find(x=>x.id===tid); if(!t) return
  t.status = st as any
  if (st==='done') { t.doneAt=new Date().toISOString(); t.doneBy=myActorKey.value }
  else { t.doneAt=null; t.doneBy=undefined }
  f.updatedAt=new Date().toISOString(); f.updatedBy=myActorKey.value
  f.history.push({ id:uid(), at:f.updatedAt, by:myActorKey.value, type:'task', action:'status', title:t.title, to:st })
  save(); showToast(`«${t.title}»: ${FT_TASK_ST[st]?.l||st}`)
}

// ===== NAVIGATE =====
function openFeatured(id: string) {
  router.push(`/supervisor/featureddetail?id=${id}`)
}
</script>
