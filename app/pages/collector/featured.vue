<template>
  <div>
    <div class="page-title">
      <div>
        <h2>التسويق المميز للعقارات</h2>
        <p>مهام التسويق المسندة إليك والعقارات التي تشارك في تسويقها</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-4" style="margin-bottom:16px;">
      <div class="card stat-card">
        <div class="lbl">عقارات مميزة</div>
        <div class="val">{{ ftLive.length }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--warning);">
        <div class="lbl">مهامي المفتوحة</div>
        <div class="val">{{ myOpenCount }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--danger);">
        <div class="lbl">مهامي المتأخرة</div>
        <div class="val">{{ myLateCount }}</div>
      </div>
      <div class="card stat-card" style="border-right-color:var(--success);">
        <div class="lbl">أنجزتها</div>
        <div class="val">{{ myDoneCount }}</div>
      </div>
    </div>

    <!-- View tabs -->
    <div class="pill-tabs" style="flex-wrap:wrap;">
      <button class="pill-tab" :class="{ active: view==='mine' }"  @click="view='mine'">مهامي ({{ myOpenCount }})</button>
      <button class="pill-tab" :class="{ active: view==='board' }" @click="view='board'">كل العقارات المميزة ({{ ftLive.length }})</button>
      <button class="pill-tab" :class="{ active: view==='all' }"   @click="view='all'">كل المهام ({{ allTasks.length }})</button>
    </div>

    <!-- ===== MY TASKS ===== -->
    <template v-if="view==='mine'">
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الوحدة</th><th>المهمة</th><th>النوع</th>
                <th>الاستحقاق</th><th>الحالة</th><th></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="myTasks.length">
                <tr v-for="{ f, t } in myTasks" :key="t.id">
                  <td>
                    <span class="ls-code">{{ getListing(f.listingId)?.code||'—' }}</span>
                    <div style="font-size:12px;font-weight:700;margin-top:2px;">{{ getListing(f.listingId)?.title||'' }}</div>
                  </td>
                  <td>
                    <span class="badge badge-neutral">{{ FT_TASK_TYPES[t.type]||t.type }}</span>
                    <div style="font-weight:700;font-size:12.5px;margin-top:3px;">{{ t.title }}</div>
                    <div v-if="t.note" class="muted" style="font-size:11.5px;margin-top:2px;max-width:260px;">{{ t.note }}</div>
                  </td>
                  <td>{{ FT_TASK_TYPES[t.type]||'—' }}</td>
                  <td :class="{ late: isLate(t) }">
                    {{ t.due ? fmtDate(t.due) : '—' }}
                    <div v-if="isLate(t)" style="color:var(--danger);font-size:11px;font-weight:800;">متأخرة</div>
                  </td>
                  <td>
                    <select class="ls-status-sel" :class="`ls-tone-${taskStObj(t.status).tone}`"
                            @change="e=>setTaskStatus(f.id, t.id, (e.target as HTMLSelectElement).value)">
                      <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k" :selected="t.status===k">{{ s.l }}</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-sm" @click="openFeatured(f.id)">فتح ›</button>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="6">
                  <div class="empty-state">
                    <b>لا توجد مهام مسندة إليك حالياً</b>
                    ستظهر هنا المهام التي يسندها لك المشرف
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ===== FEATURED BOARD ===== -->
    <template v-else-if="view==='board'">
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الكود</th><th>الوحدة</th><th>النوع</th><th>السعر</th>
                <th>مرحلة التسويق</th><th>المهام</th><th>المكلَّفون</th><th></th>
              </tr>
            </thead>
            <tbody>
              <template v-if="ftLive.length">
                <tr v-for="f in ftLive" :key="f.id" class="clickable" @click="openFeatured(f.id)">
                  <td><span class="ls-code">{{ getListing(f.listingId)?.code||'—' }}</span></td>
                  <td>
                    <b>{{ getListing(f.listingId)?.title||'—' }}</b>
                    <div v-if="!getListing(f.listingId)?.vacant" class="muted" style="font-size:11px;">غير شاغرة</div>
                  </td>
                  <td>{{ LS_TYPES[getListing(f.listingId)?.unitType||''] || '—' }}</td>
                  <td>{{ mainPrice(getListing(f.listingId)) }}</td>
                  <td>
                    <span class="ls-badge" :class="`ls-tone-${ftStageObj(f.stage).tone}`">
                      {{ ftStageObj(f.stage).l }}
                    </span>
                  </td>
                  <td>
                    <div class="ls-mini-progress">
                      <div :style="`width:${taskProgress(f)}%`"></div>
                    </div>
                    <div class="muted" style="font-size:11px;margin-top:3px;">
                      {{ doneCount(f) }}/{{ activeCount(f) }} منجزة
                      <span v-if="lateCount(f)" class="late"> · {{ lateCount(f) }} متأخرة</span>
                    </div>
                  </td>
                  <td>
                    <div class="ft-assignees">
                      <span v-for="k in openAssignees(f)" :key="k" class="ft-chip"
                            :style="k===myActorKey?'background:var(--orange-tint);color:var(--orange-dark);':''">
                        {{ k===myActorKey ? 'أنا' : k.split(':')[1]||k }}
                      </span>
                      <span v-if="!openAssignees(f).length" class="muted">—</span>
                    </div>
                  </td>
                  <td @click.stop>
                    <button class="btn btn-ghost btn-sm" @click="openFeatured(f.id)">فتح ›</button>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="8">
                  <div class="empty-state"><b>لا توجد عقارات مميزة بعد</b></div>
                </td>
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
                <tr v-for="{ f, t } in filteredAllTasks" :key="t.id">
                  <td>
                    <span class="ls-code">{{ getListing(f.listingId)?.code||'—' }}</span>
                    <div style="font-size:12px;">{{ getListing(f.listingId)?.title }}</div>
                  </td>
                  <td>
                    <span class="badge badge-neutral">{{ FT_TASK_TYPES[t.type]||t.type }}</span>
                    <div style="font-weight:700;font-size:12.5px;margin-top:3px;">{{ t.title }}</div>
                  </td>
                  <td>
                    <span :style="t.assignee===myActorKey?'font-weight:900;color:var(--orange-dark);':''">
                      {{ t.assignee===myActorKey ? 'أنا' : t.assignee.split(':')[1]||t.assignee }}
                    </span>
                  </td>
                  <td :class="{ late: isLate(t) }">
                    {{ t.due ? fmtDate(t.due) : '—' }}
                  </td>
                  <td>
                    <!-- Only update status for tasks assigned to me -->
                    <select v-if="t.assignee===myActorKey"
                            class="ls-status-sel" :class="`ls-tone-${taskStObj(t.status).tone}`"
                            @change="e=>setTaskStatus(f.id, t.id, (e.target as HTMLSelectElement).value)">
                      <option v-for="(s,k) in FT_TASK_ST" :key="k" :value="k" :selected="t.status===k">{{ s.l }}</option>
                    </select>
                    <span v-else class="ls-badge" :class="`ls-tone-${taskStObj(t.status).tone}`">
                      {{ taskStObj(t.status).l }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-sm" @click="openFeatured(f.id)">فتح ›</button>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="6"><div class="empty-state"><b>لا توجد مهام مطابقة</b></div></td>
              </tr>
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

const { extState, load, save, uid, ftLive, getListing } = useExtState()
const { fmtDate, fmtMoney, todayISO } = useFormat()
const router = useRouter()
const showToast = inject<(m:string)=>void>('showToast', m => console.log(m))
const collectorSession = inject<any>('collectorSession')

const myId       = computed(() => collectorSession?.value?.id || '')
const myActorKey = computed(() => myId.value ? `collector:${myId.value}` : '')

onMounted(() => load())

// ===== CONSTANTS =====
const LS_TYPES: Record<string,string> = {
  apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة',
  land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى',
}
const FT_STAGES = [
  { k:'initial',          l:'تسويق مبدئي',    tone:'muted'  },
  { k:'precise_location', l:'موقع دقيق',       tone:'warn'   },
  { k:'video',            l:'تسويق فيديوهات', tone:'orange' },
  { k:'campaign',         l:'حملة إعلانية',   tone:'orange' },
  { k:'full',             l:'تسويق كامل',     tone:'ok'     },
]
const FT_TASK_TYPES: Record<string,string> = {
  photo:'طلب تصوير', video:'طلب فيديو', location:'طلب موقع دقيق',
  design:'تصميم إعلان', campaign:'إطلاق حملة إعلانية',
  publish:'نشر في منصة', visit:'معاينة / زيارة', other:'مهمة أخرى',
}
const FT_TASK_ST: Record<string,{l:string;tone:string}> = {
  open:      { l:'جديدة',          tone:'muted'  },
  progress:  { l:'جاري التنفيذ',   tone:'orange' },
  done:      { l:'منجزة',          tone:'ok'     },
  cancelled: { l:'ملغاة',          tone:'danger' },
}

const ftStageObj  = (k: string) => FT_STAGES.find(s=>s.k===k) || FT_STAGES[0]
const taskStObj   = (k: string) => FT_TASK_ST[k] || FT_TASK_ST.open
const isOpen      = (t: FeaturedTask) => t.status==='open' || t.status==='progress'
const isLate      = (t: FeaturedTask) => isOpen(t) && !!t.due && t.due < todayISO()
const mainPrice   = (l: any) => l ? (Number(l.rentPrice)>0 ? fmtMoney(l.rentPrice) : Number(l.salePrice)>0 ? fmtMoney(l.salePrice) : '—') : '—'

// ===== VIEW STATE =====
const view      = ref<'mine'|'board'|'all'>('mine')
const taskStF   = ref('')
const taskTypeF = ref('')

// ===== FLAT TASKS =====
type TaskEntry = { f: Featured; t: FeaturedTask }
const allTasks = computed<TaskEntry[]>(() => {
  const out: TaskEntry[] = []
  ftLive.value.forEach(f => f.tasks.forEach(t => out.push({ f, t })))
  return out
})

const myTasks = computed(() =>
  allTasks.value
    .filter(x => x.t.assignee===myActorKey.value)
    .sort((a,b) => (isOpen(b.t)?1:0)-(isOpen(a.t)?1:0) || (a.t.due||'9').localeCompare(b.t.due||'9'))
)

const filteredAllTasks = computed(() => {
  let list = allTasks.value
  if (taskStF.value==='late') list = list.filter(x=>isLate(x.t))
  else if (taskStF.value)     list = list.filter(x=>x.t.status===taskStF.value)
  if (taskTypeF.value)        list = list.filter(x=>x.t.type===taskTypeF.value)
  return list.sort((a,b)=>(isOpen(b.t)?1:0)-(isOpen(a.t)?1:0)||(a.t.due||'9').localeCompare(b.t.due||'9'))
})

// ===== COUNTS =====
const myOpenCount = computed(() => myTasks.value.filter(x=>isOpen(x.t)).length)
const myLateCount = computed(() => myTasks.value.filter(x=>isLate(x.t)).length)
const myDoneCount = computed(() => myTasks.value.filter(x=>x.t.status==='done').length)

// ===== FEATURED HELPERS =====
const doneCount    = (f: Featured) => f.tasks.filter(t=>t.status==='done').length
const activeCount  = (f: Featured) => f.tasks.filter(t=>t.status!=='cancelled').length
const lateCount    = (f: Featured) => f.tasks.filter(isLate).length
const taskProgress = (f: Featured) => { const a=activeCount(f); return a ? Math.round(doneCount(f)/a*100) : 0 }
const openAssignees= (f: Featured) => [...new Set(f.tasks.filter(isOpen).map(t=>t.assignee))]

// ===== UPDATE TASK STATUS =====
function setTaskStatus(fid: string, tid: string, st: string) {
  const f = extState.value.featured.find(x=>x.id===fid); if (!f) return
  const t = f.tasks.find(x=>x.id===tid); if (!t) return
  if (t.assignee !== myActorKey.value) { showToast('لا يمكنك تغيير حالة مهمة مسندة لشخص آخر'); return }
  t.status = st as any
  const now = new Date().toISOString()
  if (st==='done') { t.doneAt=now; t.doneBy=myActorKey.value }
  else             { t.doneAt=null; t.doneBy=undefined }
  f.updatedAt=now; f.updatedBy=myActorKey.value
  f.history.push({ id:uid(), at:now, by:myActorKey.value, type:'task', action:'status', title:t.title, to:st })
  save(); showToast(`«${t.title}»: ${FT_TASK_ST[st]?.l||st}`)
}

// ===== NAVIGATE =====
function openFeatured(id: string) {
  router.push(`/supervisor/featureddetail?id=${id}`)
}
</script>
