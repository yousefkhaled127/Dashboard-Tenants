<template>
  <div>
    <div class="page-title">
      <div>
        <h2>التسويق المميز للعقارات</h2>
        <p>مهام التسويق المسندة إليك والعقارات التي تشارك في تسويقها</p>
      </div>
      <button v-if="usingFallback" class="btn btn-ghost btn-sm" style="color:var(--warning);" disabled>⚠ وضع محلي</button>
    </div>

    <!-- Stats -->
    <div class="grid grid-4" style="margin-bottom:16px;">
      <div class="card stat-card"><div class="lbl">عقارات مميزة</div><div class="val">{{ featStats.total_count }}</div></div>
      <div class="card stat-card" style="border-right-color:var(--warning);"><div class="lbl">مهامي المفتوحة</div><div class="val">{{ featStats.my_open_tasks_count }}</div></div>
      <div class="card stat-card" style="border-right-color:var(--danger);"><div class="lbl">مهامي المتأخرة</div><div class="val">{{ myLateCount }}</div></div>
      <div class="card stat-card" style="border-right-color:var(--success);"><div class="lbl">أنجزتها</div><div class="val">{{ myDoneCount }}</div></div>
    </div>

    <!-- Tabs -->
    <div class="pill-tabs" style="flex-wrap:wrap;">
      <button class="pill-tab" :class="{ active: view==='mine' }"  @click="view='mine'">مهامي ({{ featStats.my_open_tasks_count }})</button>
      <button class="pill-tab" :class="{ active: view==='board' }" @click="view='board'; fetchBoard()">كل العقارات المميزة ({{ featStats.total_count }})</button>
      <button class="pill-tab" :class="{ active: view==='tasks' }" @click="view='tasks'">كل المهام ({{ allFlatTasks.length }})</button>
    </div>

    <div v-if="loading" class="card" style="text-align:center;padding:30px;">
      <div class="spinner" style="margin:0 auto 10px;"></div><div class="muted">جارٍ التحميل...</div>
    </div>

    <!-- ===== MY TASKS ===== -->
    <template v-else-if="view==='mine'">
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>الوحدة</th><th>المهمة</th><th>النوع</th><th>الاستحقاق</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              <template v-if="myTasks.length">
                <tr v-for="t in myTasks" :key="t.id||t.task_id">
                  <td>
                    <span class="ls-code">{{ t.listing_code||t.code||'—' }}</span>
                    <div style="font-size:12px;font-weight:700;margin-top:2px;">{{ t.listing_title||t.title||'' }}</div>
                  </td>
                  <td>
                    <span class="badge badge-neutral">{{ FT_TASK_TYPES[t.type]||t.type }}</span>
                    <div style="font-weight:700;font-size:12.5px;margin-top:3px;">{{ t.title }}</div>
                    <div v-if="t.note" class="muted" style="font-size:11.5px;">{{ t.note }}</div>
                  </td>
                  <td>{{ FT_TASK_TYPES[t.type]||'—' }}</td>
                  <td :class="{ late: isLate(t) }">
                    {{ t.due ? fmtDate(t.due) : '—' }}
                    <div v-if="isLate(t)" style="color:var(--danger);font-size:11px;font-weight:800;">متأخرة</div>
                  </td>
                  <td>
                    <select class="ls-status-sel" :class="`ls-tone-${taskStObj(t.status).tone}`"
                            @change="e=>setTaskStatus(t,(e.target as HTMLSelectElement).value)">
                      <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k" :selected="t.status===k">{{ s.l }}</option>
                    </select>
                  </td>
                  <td>
                    <button v-if="t.featured_id||t.featuredId" class="btn btn-ghost btn-sm" @click="openFeatured(t.featured_id||t.featuredId)">فتح ›</button>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="6">
                  <div class="empty-state"><b>لا توجد مهام مسندة إليك</b>ستظهر هنا المهام التي يسندها لك المشرف</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ===== BOARD ===== -->
    <template v-else-if="view==='board'">
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>الكود</th><th>الوحدة</th><th>النوع</th><th>السعر</th><th>مرحلة التسويق</th><th>المهام</th><th>المكلَّفون</th><th></th></tr>
            </thead>
            <tbody>
              <template v-if="boardList.length">
                <tr v-for="f in boardList" :key="f.id" class="clickable" @click="openFeatured(f.id)">
                  <td><span class="ls-code">{{ f.listing_code||f.listingCode||'—' }}</span></td>
                  <td><b>{{ f.listing_title||f.listingTitle||'—' }}</b></td>
                  <td>{{ LS_TYPES[f.listing_unit_type||f.unitType||'']||'—' }}</td>
                  <td>{{ mainPrice(f) }}</td>
                  <td>
                    <span class="ls-badge" :class="`ls-tone-${ftStageObj(f.stage).tone}`">{{ ftStageObj(f.stage).l }}</span>
                  </td>
                  <td>
                    <div class="ls-mini-progress"><div :style="`width:${taskProgress(f)}%`"></div></div>
                    <div class="muted" style="font-size:11px;margin-top:3px;">
                      {{ f.done_tasks_count||0 }}/{{ (f.tasks||[]).filter((t:any)=>t.status!=='cancelled').length||f.open_tasks_count||0 }} منجزة
                      <span v-if="f.late_tasks_count" class="late"> · {{ f.late_tasks_count }} متأخرة</span>
                    </div>
                  </td>
                  <td>
                    <div class="ft-assignees">
                      <span v-for="name in (f.open_assignees||[])" :key="name" class="ft-chip"
                            :style="isMyAssignee(f)?'background:var(--orange-tint);color:var(--orange-dark);':''">
                        {{ name }}
                      </span>
                      <span v-if="!(f.open_assignees||[]).length" class="muted">—</span>
                    </div>
                  </td>
                  <td @click.stop>
                    <button class="btn btn-ghost btn-sm" @click="openFeatured(f.id)">فتح ›</button>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="8"><div class="empty-state"><b>لا توجد عقارات مميزة بعد</b></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ===== ALL TASKS ===== -->
    <template v-else>
      <div class="search-bar">
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
            <thead>
              <tr><th>الوحدة</th><th>المهمة</th><th>المسؤول</th><th>الاستحقاق</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              <template v-if="filteredAllTasks.length">
                <tr v-for="t in filteredAllTasks" :key="t.id||t.task_id">
                  <td>
                    <span class="ls-code">{{ t.listing_code||'—' }}</span>
                    <div style="font-size:12px;">{{ t.listing_title||'' }}</div>
                  </td>
                  <td>
                    <span class="badge badge-neutral">{{ FT_TASK_TYPES[t.type]||t.type }}</span>
                    <div style="font-weight:700;font-size:12.5px;margin-top:3px;">{{ t.title }}</div>
                  </td>
                  <td>
                    <span :style="isMyTask(t)?'font-weight:900;color:var(--orange-dark);':''">
                      {{ t.assignee_name||t.assigneeName||'—' }}{{ isMyTask(t)?' (أنا)':'' }}
                    </span>
                  </td>
                  <td :class="{ late: isLate(t) }">{{ t.due ? fmtDate(t.due) : '—' }}</td>
                  <td>
                    <select v-if="isMyTask(t)"
                            class="ls-status-sel" :class="`ls-tone-${taskStObj(t.status).tone}`"
                            @change="e=>setTaskStatus(t,(e.target as HTMLSelectElement).value)">
                      <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k" :selected="t.status===k">{{ s.l }}</option>
                    </select>
                    <span v-else class="ls-badge" :class="`ls-tone-${taskStObj(t.status).tone}`">{{ taskStObj(t.status).l }}</span>
                  </td>
                  <td>
                    <button v-if="t.featured_id||t.featuredId" class="btn btn-ghost btn-sm" @click="openFeatured(t.featured_id||t.featuredId)">فتح ›</button>
                  </td>
                </tr>
              </template>
              <tr v-else><td colspan="6"><div class="empty-state"><b>لا توجد مهام مطابقة</b></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useFeaturedApi } from '~/composables/useApi'
import { useExtState, type Featured, type FeaturedTask } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'

const featApi    = useFeaturedApi()
const { extState, load: loadLocal, save: saveLocal, ftLive, getListing } = useExtState()
const { fmtDate, fmtMoney, todayISO } = useFormat()
const router     = useRouter()
const showToast  = inject<(m:string)=>void>('showToast', m => console.log(m))
const colSession = inject<any>('collectorSession')

const myId       = computed(() => colSession?.value?.id || '')
const myActorKey = computed(() => myId.value ? `collector:${myId.value}` : '')

// ── state ──
const loading       = ref(true)
const usingFallback = ref(false)
const myTasks       = ref<any[]>([])
const boardList     = ref<any[]>([])
const featStats     = ref({ total_count:0, open_tasks_count:0, late_tasks_count:0, done_tasks_count:0, my_open_tasks_count:0 })
const view          = ref<'mine'|'board'|'tasks'>('mine')
const taskStF       = ref('')
const taskTypeF     = ref('')

// ── constants ──
const LS_TYPES: Record<string,string> = { apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة', land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى' }
const FT_STAGES = [
  {k:'initial',l:'تسويق مبدئي',tone:'muted'},{k:'precise_location',l:'موقع دقيق',tone:'warn'},
  {k:'video',l:'تسويق فيديوهات',tone:'orange'},{k:'campaign',l:'حملة إعلانية',tone:'orange'},{k:'full',l:'تسويق كامل',tone:'ok'},
]
const FT_TASK_TYPES: Record<string,string> = { photo:'طلب تصوير', video:'طلب فيديو', location:'طلب موقع دقيق', design:'تصميم إعلان', campaign:'إطلاق حملة', publish:'نشر في منصة', visit:'معاينة', other:'مهمة أخرى' }
const FT_TASK_ST: Record<string,{l:string;tone:string}> = { open:{l:'جديدة',tone:'muted'}, progress:{l:'جاري التنفيذ',tone:'orange'}, done:{l:'منجزة',tone:'ok'}, cancelled:{l:'ملغاة',tone:'danger'} }

const ftStageObj = (k: string) => FT_STAGES.find(s=>s.k===k)||FT_STAGES[0]
const taskStObj  = (k: string) => FT_TASK_ST[k]||FT_TASK_ST.open
const isOpen     = (t: any)   => t.status==='open'||t.status==='progress'
const isLate     = (t: any)   => isOpen(t) && !!t.due && t.due < todayISO()
const isMyTask   = (t: any)   => String(t.assignee_id||t.assigneeId||'') === String(myId.value) || (t.assignee||'').includes(`:${myId.value}`)
const isMyAssignee=(f: any)   => (f.open_assignees||[]).some((n:string) => n===colSession?.value?.name)
const mainPrice  = (f: any)   => { const r=Number(f.listing_rent_price||f.rentPrice||0), s=Number(f.listing_sale_price||f.salePrice||0); return r>0?fmtMoney(r):s>0?fmtMoney(s):'—' }
const taskProgress=(f: any)   => { const tasks=(f.tasks||[]); const active=tasks.filter((t:any)=>t.status!=='cancelled').length; return active?Math.round(tasks.filter((t:any)=>t.status==='done').length/active*100):0 }

// ── FLAT ALL TASKS from board ──
const allFlatTasks = computed(() =>
  boardList.value.flatMap((f:any) =>
    (f.tasks||[]).map((t:any) => ({ ...t, featured_id:f.id, listing_code:f.listing_code||f.listingCode, listing_title:f.listing_title||f.listingTitle }))
  )
)
const myLateCount = computed(() => allFlatTasks.value.filter(t=>isMyTask(t)&&isLate(t)).length)
const myDoneCount = computed(() => allFlatTasks.value.filter(t=>isMyTask(t)&&t.status==='done').length)

const filteredAllTasks = computed(() => {
  let list = allFlatTasks.value
  if (taskStF.value==='late') list = list.filter(t=>isLate(t))
  else if (taskStF.value)     list = list.filter(t=>t.status===taskStF.value)
  if (taskTypeF.value)        list = list.filter(t=>t.type===taskTypeF.value)
  return list.sort((a,b)=>(isOpen(b)?1:0)-(isOpen(a)?1:0)||(a.due||'9').localeCompare(b.due||'9'))
})

// ── FETCH ──
async function fetchMyTasks() {
  loading.value = true
  try {
    const res = await featApi.collector.myTasks()
    myTasks.value = res.tasks || []
    usingFallback.value = false
  } catch {
    loadLocal(); usingFallback.value = true
    myTasks.value = []
    ftLive.value.forEach(f => {
      f.tasks.filter(t=>t.assignee===myActorKey.value).forEach(t => {
        myTasks.value.push({ ...t, featured_id:f.id, listing_code: getListing(f.listingId)?.code||'', listing_title: getListing(f.listingId)?.title||'' })
      })
    })
  } finally { loading.value = false }
}

async function fetchBoard() {
  if (boardList.value.length) return
  loading.value = true
  try {
    const res = await featApi.collector.list()
    boardList.value = res.featured || []
    if (res.statistics) featStats.value = res.statistics
    usingFallback.value = false
  } catch {
    loadLocal(); usingFallback.value = true
    boardList.value = ftLive.value.map(f => {
      const l = getListing(f.listingId)
      return { id:f.id, listing_code:l?.code||'', listing_title:l?.title||'', stage:f.stage, tasks:f.tasks, open_tasks_count:f.tasks.filter(isOpen).length, done_tasks_count:f.tasks.filter(t=>t.status==='done').length, late_tasks_count:f.tasks.filter(isLate).length, open_assignees:[...new Set(f.tasks.filter(isOpen).map(t=>t.assignee.split(':')[1]||t.assignee))], added_at:f.addedAt }
    })
    featStats.value.total_count = boardList.value.length
  } finally { loading.value = false }
}

onMounted(() => { loadLocal(); fetchMyTasks() })

// ── SET TASK STATUS ──
async function setTaskStatus(t: any, st: string) {
  if (!isMyTask(t)) { showToast('تغيير حالة المهمة للمكلَّف بها فقط'); return }
  const prevSt = t.status; t.status = st
  const fid = t.featured_id || t.featuredId
  const tid = t.id || t.task_id
  try {
    await featApi.collector.updateTaskStatus(Number(fid), String(tid), { status: st })
    showToast(`«${t.title}»: ${FT_TASK_ST[st]?.l||st}`)
  } catch {
    // fallback localStorage
    const f = extState.value.featured?.find((x:any)=>x.id===fid)
    const lt = f?.tasks?.find((x:any)=>x.id===tid)
    if (lt) {
      lt.status = st
      if (st==='done') { lt.doneAt=new Date().toISOString(); lt.doneBy=myActorKey.value }
      else { lt.doneAt=null; lt.doneBy=undefined }
      f.updatedAt = new Date().toISOString()
      await saveLocal()
    }
    showToast(`«${t.title}»: ${FT_TASK_ST[st]?.l||st} (محلياً)`)
  }
}

function openFeatured(id: any) { router.push(`/supervisor/featureddetail?id=${id}`) }
</script>
