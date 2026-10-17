<template>
  <div v-if="!listing">
    <div class="page-title"><div><h2>الوحدة غير موجودة</h2></div></div>
    <div class="card"><button class="btn btn-ghost btn-sm" @click="goBack">→ رجوع</button></div>
  </div>
  <div v-else>
    <div class="page-title">
      <div>
        <h2><span class="ls-code" style="font-size:14px;">{{ listing.code }}</span> {{ listing.title||'—' }}</h2>
        <p>{{ LS_TYPES[listing.unitType]||'' }} · المالك: {{ lsOwnerName(listing)||'لم يُحدَّد' }}</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" @click="goBack">→ رجوع للقائمة</button>
        <button v-if="listing.vacant" class="btn btn-danger btn-sm" @click="showCloseModal=true">غير شاغرة</button>
        <button v-else class="btn btn-success btn-sm" @click="reopen">إعادة كوحدة شاغرة</button>
        <button v-if="canDelete" class="btn btn-ghost btn-sm" style="color:var(--danger)" @click="confirmDel=true">حذف</button>
      </div>
    </div>

    <!-- Closed banner -->
    <div v-if="!listing.vacant" class="ls-closed">
      هذه الوحدة <b>غير شاغرة</b> — {{ listing.closeReason||'' }}{{ listing.closeNote?' : '+listing.closeNote:'' }}
      · {{ fmtDate((listing.closedAt||'').slice(0,10)) }}
    </div>

    <div class="grid grid-2">
      <!-- LEFT -->
      <div style="min-width:0;">
        <!-- Status & roadmap -->
        <div v-if="listing.kind!=='external'" class="card" style="margin-bottom:16px;">
          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:13px;color:var(--muted);margin-bottom:6px;font-weight:700;">حالة الوحدة</label>
            <select class="ls-status-sel ls-status-big" :class="`ls-tone-${lsStatusObj(listing.status).tone}`"
                    :disabled="!listing.vacant" @change="e=>setStatus((e.target as HTMLSelectElement).value)">
              <optgroup label="مراحل التسويق">
                <option v-for="(s,i) in LS_FLOW" :key="s.k" :value="s.k" :selected="listing.status===s.k">{{ i+1 }}. {{ s.l }}</option>
              </optgroup>
              <optgroup label="حالات الترخيص">
                <option v-for="s in LS_ALERTS" :key="s.k" :value="s.k" :selected="listing.status===s.k">{{ s.l }}</option>
              </optgroup>
            </select>
          </div>
          <!-- Roadmap -->
          <div class="rm-track">
            <div v-for="(s,i) in LS_FLOW" :key="s.k" class="rm-step"
                 :class="i < lsFlowIdx(listing.status) ? 'done' : i === lsFlowIdx(listing.status) ? 'current' : ''">
              <div class="rm-dot">{{ i < lsFlowIdx(listing.status) ? '✓' : i+1 }}</div>
              <div class="rm-label">{{ s.l }}</div>
            </div>
          </div>
        </div>

        <!-- Platforms -->
        <div class="card" style="margin-bottom:16px;">
          <h3>نزول الوحدة في المنصات <span class="muted" style="font-size:12.5px;">({{ publishedPlats.length }} من {{ allPlatforms.length }})</span></h3>
          <div class="plat-grid">
            <div v-for="p in allPlatforms" :key="p.id" class="plat-card" :class="{ on: !!(listing.platforms||{})[p.id] }">
              <div class="plat-head">
                <span style="display:flex;align-items:center;gap:7px;"><span class="plat-dot"></span>{{ p.name }}</span>
              </div>
              <template v-if="(listing.platforms||{})[p.id]">
                <a :href="(listing.platforms||{})[p.id].url" target="_blank" rel="noopener" class="plat-link">{{ (listing.platforms||{})[p.id].url }}</a>
                <div class="muted" style="font-size:11px;">{{ fmtDate(((listing.platforms||{})[p.id].at||'').slice(0,10)) }}</div>
                <div class="plat-actions">
                  <button class="btn btn-ghost btn-sm" @click="openPlatModal(p.id,'edit')">تعديل</button>
                  <button class="btn btn-danger btn-sm" @click="removePlat(p.id)">إلغاء</button>
                </div>
              </template>
              <template v-else>
                <div class="muted" style="font-size:12px;">لم تُنشر بعد</div>
                <div class="plat-actions">
                  <button class="btn btn-dark btn-sm" @click="openPlatModal(p.id,'add')">+ إرفاق الرابط</button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Data form -->
        <div class="card">
          <h3>تحديث بيانات الوحدة</h3>
          <fieldset :disabled="!listing.vacant" style="border:none;padding:0;margin:0;">
            <!-- Step 1: Owner -->
            <div class="ls-step" :class="{ ok: !!(draft.ownerId || draft.ownerName) }">
              <div class="ls-step-head">
                <div class="ls-step-num">{{ !!(draft.ownerId||draft.ownerName) ? '✓' : '1' }}</div>
                <div class="ls-step-title">المالك وعقد الوساطة</div>
              </div>
              <div class="field"><label>اسم المالك *</label><input v-model="draft.ownerName" placeholder="اسم المالك"></div>
              <div class="row2">
                <div class="field"><label>رقم عقد الوساطة</label><input v-model="draft.brokerageNo"></div>
                <div class="field"><label>جوال المالك</label><input v-model="draft.ownerPhone" placeholder="05xxxxxxxx"></div>
              </div>
            </div>

            <!-- Step 2: Details -->
            <div class="ls-step" :class="{ ok: !!(draft.description||'').trim() }">
              <div class="ls-step-head">
                <div class="ls-step-num">{{ (draft.description||'').trim() ? '✓' : '2' }}</div>
                <div class="ls-step-title">الوصف وبيانات الوحدة</div>
              </div>
              <div class="field"><label>الوصف التسويقي</label>
                <textarea v-model="draft.description" placeholder="وصف الوحدة..." rows="3"></textarea>
              </div>
            </div>

            <!-- Step 3: Price -->
            <div class="ls-step" :class="{ ok: hasDraftPrice }">
              <div class="ls-step-head">
                <div class="ls-step-num">{{ hasDraftPrice ? '✓' : '3' }}</div>
                <div class="ls-step-title">نوع العرض والسعر</div>
              </div>
              <div class="field"><label>نوع العرض</label>
                <div class="radio-group">
                  <div v-for="(lbl,k) in LS_DEALS" :key="k" class="radio-opt" :class="{ sel: draft.dealType===k }" @click="draft.dealType=k">{{ lbl }}</div>
                </div>
              </div>
              <div class="row2">
                <div v-if="draft.dealType!=='sale'" class="field"><label>سعر الإيجار (ر.س)</label><input v-model.number="draft.rentPrice" type="number" min="0"></div>
                <div v-if="draft.dealType!=='rent'" class="field"><label>سعر البيع (ر.س)</label><input v-model.number="draft.salePrice" type="number" min="0"></div>
              </div>
            </div>

            <!-- Step 4: Photos -->
            <div class="ls-step" :class="{ ok: (draft.photos||[]).length>0 }">
              <div class="ls-step-head">
                <div class="ls-step-num">{{ (draft.photos||[]).length>0 ? '✓' : '4' }}</div>
                <div class="ls-step-title">الصور ({{ (draft.photos||[]).length }})</div>
              </div>
              <div v-if="listing.vacant">
                <div class="filepick" :class="{ has:(draft.photos||[]).length>0 }" @click="$refs.photoInput.click()">
                  {{ (draft.photos||[]).length ? `${(draft.photos||[]).length} صورة ✓ — اضغط للإضافة` : 'اضغط لاختيار صور الوحدة' }}
                </div>
                <input ref="photoInput" type="file" accept="image/*" multiple style="display:none" @change="handlePhotos">
              </div>
              <div v-if="(draft.photos||[]).length" class="ls-media">
                <div v-for="(ph,i) in (draft.photos||[])" :key="i" class="media-thumb-wrap">
                  <img :src="ph.data" class="media-thumb">
                  <button v-if="listing.vacant" class="media-remove" @click="removePhoto(i)">×</button>
                </div>
              </div>
            </div>

            <!-- Step 5: License -->
            <div class="ls-step" :class="{ ok: !!(draft.license?.number&&draft.license?.file) }">
              <div class="ls-step-head">
                <div class="ls-step-num">{{ (draft.license?.number&&draft.license?.file) ? '✓' : '5' }}</div>
                <div class="ls-step-title">الترخيص الإعلاني</div>
              </div>
              <div class="row2">
                <div class="field"><label>رقم الترخيص</label><input v-model="draft.license.number"></div>
                <div class="field"><label>تاريخ الانتهاء</label><input type="date" v-model="draft.license.expiry"></div>
              </div>
              <div v-if="listing.vacant">
                <div class="filepick" :class="{ has:!!draft.license?.file }" @click="$refs.licFile.click()">
                  {{ draft.license?.file ? (draft.license.file.name||'الترخيص') + ' ✓ (اضغط للتغيير)' : 'ارفع ملف الترخيص (صورة أو PDF)' }}
                </div>
                <input ref="licFile" type="file" accept="image/*,application/pdf,.pdf" style="display:none" @change="handleLicense">
              </div>
            </div>

            <!-- Step 6: Guard -->
            <div class="ls-step" :class="{ ok: !!(draft.guard?.name||draft.guard?.phone) }">
              <div class="ls-step-head">
                <div class="ls-step-num">{{ (draft.guard?.name||draft.guard?.phone) ? '✓' : '6' }}</div>
                <div class="ls-step-title">الحارس والموقع الجغرافي</div>
              </div>
              <div class="row2">
                <div class="field"><label>اسم الحارس</label><input v-model="draft.guard.name"></div>
                <div class="field"><label>جوال الحارس</label><input v-model="draft.guard.phone" placeholder="05xxxxxxxx"></div>
              </div>
              <div class="field"><label>كود الوحدة / الدخول</label><input v-model="draft.guard.unitCode"></div>
              <div class="field"><label>رابط Google Maps (للصق)</label>
                <input v-model="gmapsInput" dir="ltr" placeholder="https://maps.google.com/...">
                <div class="hint" v-if="draft.location">📍 الإحداثيات: {{ draft.location.lat.toFixed(5) }}, {{ draft.location.lng.toFixed(5) }}
                  {{ draft.location.address ? ' — '+draft.location.address : '' }}
                  <a :href="`https://maps.google.com/?q=${draft.location.lat},${draft.location.lng}`" target="_blank" class="loc-link">فتح في خرائط Google ↗</a>
                </div>
              </div>
            </div>
          </fieldset>

          <!-- Save bar -->
          <div v-if="listing.vacant" class="ls-savebar">
            <span class="ls-dirty" :class="{ show: isDirty }">{{ isDirty ? '● توجد تغييرات غير محفوظة' : 'جميع التغييرات محفوظة' }}</span>
            <button class="btn btn-ghost btn-sm" @click="discardDraft">تراجع</button>
            <button class="btn btn-primary btn-sm" @click="saveDraft">حفظ التحديث</button>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div style="min-width:0;">
        <!-- Info -->
        <div class="card" style="margin-bottom:16px;">
          <h3>معلومات الوحدة</h3>
          <div class="kv"><span class="k">الكود</span><span class="v">{{ listing.code }}</span></div>
          <div class="kv"><span class="k">النوع</span><span class="v">{{ LS_TYPES[listing.unitType]||'—' }}</span></div>
          <div class="kv"><span class="k">أُضيفت بواسطة</span><span class="v">{{ actorName(listing.createdBy) }}</span></div>
          <div class="kv"><span class="k">تاريخ الإضافة</span><span class="v">{{ fmtDate((listing.createdAt||'').slice(0,10)) }}</span></div>
          <div class="kv"><span class="k">آخر تحديث</span><span class="v">{{ fmtDate((listing.updatedAt||'').slice(0,10)) }}</span></div>
          <div class="field" style="margin-top:12px;">
            <label>المسؤول عن الوحدة</label>
            <select v-if="listing.vacant" :value="listing.responsible" @change="e=>changeResponsible((e.target as HTMLSelectElement).value)">
              <option v-for="s in allStaff" :key="s.key" :value="s.key">{{ s.name }} — {{ s.role }}</option>
            </select>
            <div v-else style="font-weight:800;">{{ actorName(listing.responsible) }}</div>
          </div>
        </div>

        <!-- Checklist -->
        <div class="card" style="margin-bottom:16px;">
          <h3>اكتمال البيانات <span class="muted" style="font-size:13px;">{{ checklistPct }}%</span></h3>
          <div class="progress" :class="{ ok: checklistPct>=100 }" style="margin-bottom:10px;">
            <div :style="`width:${checklistPct}%`"></div>
          </div>
          <div class="ls-checklist">
            <div v-for="item in checklist" :key="item.label" class="ci" :class="{ ok:item.ok, miss:!item.ok, req:item.req }">
              <span class="ic">{{ item.ok ? '✓' : item.req ? '!' : '·' }}</span>
              <span>{{ item.label }}{{ item.req&&!item.ok ? ' (إلزامي)' : '' }}</span>
            </div>
          </div>
        </div>

        <!-- History -->
        <div class="card">
          <h3>سجل الإجراءات ({{ (listing.history||[]).length }})</h3>
          <div class="ls-hist">
            <div v-if="!(listing.history||[]).length" class="muted" style="font-size:12.5px;">لا توجد إجراءات</div>
            <div v-for="h in [...(listing.history||[])].reverse()" :key="h.id||h.at" class="hi">
              <div>{{ histText(h) }}</div>
              <div class="meta">{{ actorName(h.by) }} · {{ fmtDate((h.at||'').slice(0,10)) }} {{ (h.at||'').slice(11,16) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Platform -->
    <div v-if="platModal" class="modal-overlay" @click.self="platModal=null">
      <div class="modal">
        <div class="modal-head">
          <h3>رابط الوحدة في {{ allPlatforms.find(p=>p.id===platModal.pid)?.name }}</h3>
          <button class="modal-close" @click="platModal=null">×</button>
        </div>
        <div class="field"><label>رابط صفحة الوحدة *</label><input v-model="platModal.url" dir="ltr" placeholder="https://..."></div>
        <div class="field"><label>رقم الإعلان (اختياري)</label><input v-model="platModal.adNo"></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="platModal=null">إلغاء</button>
          <button class="btn btn-primary" @click="savePlat">تأكيد النشر</button>
        </div>
      </div>
    </div>

    <!-- MODAL: Close -->
    <div v-if="showCloseModal" class="modal-overlay" @click.self="showCloseModal=false">
      <div class="modal">
        <div class="modal-head"><h3>الوحدة غير شاغرة</h3><button class="modal-close" @click="showCloseModal=false">×</button></div>
        <div class="field"><label>السبب</label>
          <div class="radio-group">
            <div v-for="r in CLOSE_REASONS" :key="r" class="radio-opt" :class="{ sel:closeForm.reason===r }" @click="closeForm.reason=r">{{ r }}</div>
          </div>
        </div>
        <div class="field"><label>ملاحظة (اختياري)</label><textarea v-model="closeForm.note" rows="2"></textarea></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showCloseModal=false">إلغاء</button>
          <button class="btn btn-danger" @click="closeListing">تأكيد — غير شاغرة</button>
        </div>
      </div>
    </div>

    <!-- MODAL: Delete confirm -->
    <div v-if="confirmDel" class="modal-overlay" @click.self="confirmDel=false">
      <div class="modal">
        <div class="modal-head"><h3>حذف الوحدة</h3><button class="modal-close" @click="confirmDel=false">×</button></div>
        <p>سيتم حذف <b>{{ listing.code }} — {{ listing.title }}</b> نهائيًا مع صورها وسجلها. هل أنت متأكد؟</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="confirmDel=false">إلغاء</button>
          <button class="btn btn-danger" @click="deleteListing">تأكيد الحذف</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExtState, type Listing } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const { extState, load, save, uid, lsOwnerName, getListing, lsNextCode } = useExtState()
const { fmtDate, fmtMoney, todayISO } = useFormat()
const { auth } = useApi()
const route  = useRoute()
const router = useRouter()

const showToast = inject<(m:string)=>void>('showToast', m => console.log(m))
const supervisorSession = inject<any>('supervisorSession')

onMounted(async () => {
  load()
  try {
    const [sups, cols] = await Promise.all([auth.usersByType('supervisor'), auth.usersByType('collector')])
    allStaff.value = [
      ...sups.map(u => ({ key:`supervisor:${u.id}`, name:u.name, role:u.type_label||'مشرف' })),
      ...cols.map(u => ({ key:`collector:${u.id}`,  name:u.name, role:'محصل' })),
    ]
  } catch {}
  initDraft()
})

const allStaff = ref<{key:string;name:string;role:string}[]>([])
const myActorKey = computed(() => { const s = supervisorSession?.value; return s ? `supervisor:${s.id}` : '' })

const listingId = computed(() => String(route.query.id||''))
const listing   = computed(() => getListing(listingId.value))

// ===== CONSTANTS =====
const LS_TYPES: Record<string,string> = { apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة', land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى' }
const LS_DEALS: Record<string,string> = { rent:'إيجار', sale:'بيع', both:'بيع أو إيجار' }
const CLOSE_REASONS = ['تم التأجير','تم البيع','سحبها المالك','أخرى']
const LS_FLOW = [
  {k:'name_only', l:'عندي الاسم فقط', tone:'muted'},
  {k:'basic_details', l:'تفاصيل أولية', tone:'muted'},
  {k:'photographed', l:'تم التصوير', tone:'warn'},
  {k:'waiting_video', l:'بانتظار الفيديو', tone:'warn'},
  {k:'website_only', l:'بالموقع فقط', tone:'orange'},
  {k:'awaiting_owner_license', l:'بانتظار الترخيص', tone:'warn'},
  {k:'license_issued', l:'تم الترخيص', tone:'orange'},
  {k:'publishing', l:'جاري تنزيل الإعلان', tone:'orange'},
  {k:'published', l:'تم تنزيل الإعلان', tone:'ok'},
]
const LS_ALERTS = [
  {k:'license_renewal', l:'ترخيص منتهي — مطلوب تجديد', tone:'danger'},
  {k:'license_expired', l:'ترخيص منتهي تماماً', tone:'danger'},
]
const lsStatusObj = (k:string) => [...LS_FLOW, ...LS_ALERTS].find(s=>s.k===k) || LS_FLOW[0]
const lsFlowIdx   = (k:string) => LS_FLOW.findIndex(s=>s.k===k)
const allPlatforms = computed(() => extState.value.listingPlatforms || [])
const publishedPlats = computed(() => allPlatforms.value.filter(p => !!(listing.value?.platforms||{})[p.id]))
const canDelete = computed(() => true) // general supervisor only in real app

// ===== DRAFT =====
const draft = ref<any>({})
const isDirty = ref(false)
const gmapsInput = ref('')

function initDraft() {
  const l = listing.value; if (!l) return
  draft.value = {
    ownerName: l.ownerName||'', ownerPhone: l.ownerPhone||'', brokerageNo: l.brokerageNo||'',
    description: l.description||'', dealType: l.dealType||'', rentPrice: l.rentPrice||'', salePrice: l.salePrice||'',
    photos: [...(l.photos||[])], license: { ...( l.license||{} ) }, guard: { ...(l.guard||{}) },
    location: l.location ? {...l.location} : null,
  }
  isDirty.value = false
}

watch(draft, () => { isDirty.value = true }, { deep: true })

const hasDraftPrice = computed(() => {
  const d = draft.value
  if (d.dealType==='rent') return Number(d.rentPrice)>0
  if (d.dealType==='sale') return Number(d.salePrice)>0
  if (d.dealType==='both') return Number(d.rentPrice)>0 && Number(d.salePrice)>0
  return false
})

function discardDraft() { initDraft(); showToast('تم التراجع') }
function saveDraft() {
  const l = listing.value; if (!l) return
  if (!draft.value.ownerName.trim()) { showToast('الرجاء إدخال اسم المالك'); return }
  Object.assign(l, {
    ownerName: draft.value.ownerName.trim(), ownerPhone: draft.value.ownerPhone.trim(),
    brokerageNo: draft.value.brokerageNo.trim(), description: draft.value.description.trim(),
    dealType: draft.value.dealType, rentPrice: String(draft.value.rentPrice||''),
    salePrice: String(draft.value.salePrice||''), photos: draft.value.photos,
    license: draft.value.license, guard: draft.value.guard, location: draft.value.location,
    updatedAt: new Date().toISOString(), updatedBy: myActorKey.value,
  })
  // Try to parse Google Maps link
  if (gmapsInput.value) {
    const coords = parseGmaps(gmapsInput.value)
    if (coords) { l.location = coords; draft.value.location = coords; gmapsInput.value = '' }
    else showToast('تعذّر استخراج الإحداثيات من الرابط')
  }
  l.history = l.history || []
  l.history.push({ id:uid(), at:new Date().toISOString(), by:myActorKey.value, type:'update', sections:['بيانات الوحدة'] })
  save(); isDirty.value=false; showToast('تم حفظ التحديث')
}

function parseGmaps(s: string) {
  const m = s.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
    || s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    || s.match(/^(-?\d{1,2}\.\d+)\s*[,،]\s*(-?\d{1,3}\.\d+)$/)
  if (!m) return null
  return { lat: Number(m[1]), lng: Number(m[2]), address: '' }
}

// ===== STATUS =====
function setStatus(k: string) {
  const l = listing.value; if (!l) return
  const now = new Date().toISOString()
  const from = l.status; l.status = k
  l.updatedAt = now; l.updatedBy = myActorKey.value
  l.history = l.history || []
  l.history.push({ id:uid(), at:now, by:myActorKey.value, type:'status', from, to:k })
  save(); showToast('تم تحديث الحالة: '+lsStatusObj(k).l)
}

// ===== RESPONSIBLE =====
function changeResponsible(key: string) {
  const l = listing.value; if (!l) return
  const from = l.responsible, now = new Date().toISOString()
  l.responsible = key; l.updatedAt=now; l.updatedBy=myActorKey.value
  l.history.push({ id:uid(), at:now, by:myActorKey.value, type:'responsible', from, to:key })
  save(); showToast(`المسؤول الآن: ${actorName(key)}`)
}

// ===== PHOTOS =====
const photoInput = ref<HTMLInputElement>()
async function handlePhotos(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files||[])
  for (const f of files) {
    if (f.size > 12*1024*1024) { showToast(`${f.name} أكبر من 12MB`); continue }
    const data = await readFile(f)
    draft.value.photos.push({ type: f.type, name: f.name, data })
  }
  isDirty.value = true
  ;(e.target as HTMLInputElement).value = ''
}
function removePhoto(i: number) { draft.value.photos.splice(i,1); isDirty.value=true }

// ===== LICENSE =====
const licFile = ref<HTMLInputElement>()
async function handleLicense(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return
  if (f.size > 5*1024*1024) { showToast('ملف الترخيص أكبر من 5MB'); return }
  const data = await readFile(f)
  draft.value.license = { ...draft.value.license, file: { name:f.name, type:f.type, data } }
  isDirty.value = true
  ;(e.target as HTMLInputElement).value = ''
}

function readFile(f: File): Promise<string> {
  return new Promise(res => { const r=new FileReader(); r.onload=e=>res(e.target!.result as string); r.readAsDataURL(f) })
}

// ===== PLATFORMS =====
const platModal = ref<{pid:string;mode:string;url:string;adNo:string}|null>(null)
function openPlatModal(pid: string, mode: string) {
  const existing = (listing.value?.platforms||{})[pid]
  platModal.value = { pid, mode, url: existing?.url||'', adNo: existing?.adNo||'' }
}
function savePlat() {
  const m = platModal.value, l = listing.value; if (!m||!l) return
  if (!m.url.trim()) { showToast('الرجاء إدخال الرابط'); return }
  if (!l.platforms) l.platforms = {}
  l.platforms[m.pid] = { url: m.url.trim(), adNo: m.adNo.trim(), at: new Date().toISOString(), by: myActorKey.value }
  l.updatedAt = new Date().toISOString(); l.updatedBy = myActorKey.value
  l.history.push({ id:uid(), at:l.updatedAt, by:myActorKey.value, type:'platform', action:m.mode==='add'?'add':'edit', name: allPlatforms.value.find(p=>p.id===m.pid)?.name||'', url:m.url })
  save(); platModal.value=null; showToast('تم تأكيد النشر')
}
function removePlat(pid: string) {
  const l = listing.value; if (!l) return
  const pName = allPlatforms.value.find(p=>p.id===pid)?.name||pid
  delete l.platforms[pid]; l.updatedAt=new Date().toISOString(); l.updatedBy=myActorKey.value
  l.history.push({ id:uid(), at:l.updatedAt, by:myActorKey.value, type:'platform', action:'remove', name:pName })
  save(); showToast(`تم إلغاء النشر في ${pName}`)
}

// ===== CLOSE / REOPEN =====
const showCloseModal = ref(false)
const closeForm = ref({ reason:'تم التأجير', note:'' })
function closeListing() {
  const l = listing.value; if (!l) return
  const now = new Date().toISOString()
  l.vacant=false; l.closedAt=now; l.closedBy=myActorKey.value; l.closeReason=closeForm.value.reason; l.closeNote=closeForm.value.note.trim()
  l.updatedAt=now; l.updatedBy=myActorKey.value
  l.history.push({ id:uid(), at:now, by:myActorKey.value, type:'close', reason:closeForm.value.reason, note:closeForm.value.note })
  save(); showCloseModal.value=false; showToast('تم نقل الوحدة إلى «غير شاغرة»')
}
function reopen() {
  const l = listing.value; if (!l) return
  const now = new Date().toISOString()
  l.vacant=true; l.closedAt=undefined; l.closedBy=undefined; l.closeReason=''; l.closeNote=''
  l.updatedAt=now; l.updatedBy=myActorKey.value
  l.history.push({ id:uid(), at:now, by:myActorKey.value, type:'reopen' })
  save(); showToast('أُعيدت الوحدة إلى قائمة العقارات الشاغرة')
}

// ===== DELETE =====
const confirmDel = ref(false)
function deleteListing() {
  extState.value.listings = extState.value.listings.filter(l => l.id !== listingId.value)
  extState.value.featured  = extState.value.featured.filter(f => f.listingId !== listingId.value)
  save(); showToast('تم حذف الوحدة'); goBack()
}

// ===== CHECKLIST =====
const checklist = computed(() => {
  const l = listing.value, d = draft.value
  if (!l) return []
  return [
    { label:'المالك', ok:!!(d.ownerName||l.ownerName), req:true },
    { label:'رقم عقد الوساطة', ok:!!(d.brokerageNo||l.brokerageNo), req:false },
    { label:'الوصف', ok:!!(d.description||l.description), req:false },
    { label:'نوع العرض والسعر', ok:hasDraftPrice.value||(Number(l.rentPrice)>0||Number(l.salePrice)>0), req:true },
    { label:'الصور', ok:(d.photos||l.photos||[]).length>0, req:true },
    { label:'الترخيص الإعلاني', ok:!!(d.license?.number&&d.license?.file), req:false },
    { label:'الحارس', ok:!!(d.guard?.name||d.guard?.phone), req:false },
    { label:'الموقع على الخريطة', ok:!!(d.location||l.location), req:false },
  ]
})
const checklistPct = computed(() => {
  const items = checklist.value; if (!items.length) return 0
  return Math.round(items.filter(i=>i.ok).length/items.length*100)
})

// ===== HISTORY TEXT =====
function histText(h: any): string {
  switch (h.type) {
    case 'create':      return h.text || 'أنشأ المهمة'
    case 'status':      return `غيّر الحالة${h.from?` من «${lsStatusObj(h.from).l}»`:''} إلى «${lsStatusObj(h.to).l}»`
    case 'update':      return `حدّث بيانات: ${(h.sections||[]).join('، ')}`
    case 'responsible': return `غيّر المسؤول إلى ${actorName(h.to)}`
    case 'platform':    return h.action==='remove' ? `ألغى النشر في ${h.name}` : `${h.action==='edit'?'عدّل':'أكّد'} نزول الوحدة في ${h.name}`
    case 'close':       return `أغلق المهمة — ${h.reason||''}${h.note?': '+h.note:''}`
    case 'reopen':      return 'أعاد الوحدة إلى العقارات الشاغرة'
    case 'review':      return h.action==='accept'?`قَبَل الوحدة (${h.from}→${h.to})`:h.action==='reject'?`رفض الوحدة: ${h.note||''}`:h.action==='info'?`طلب استكمال: ${h.note||''}`:h.action==='reopen'?'أعاد الوحدة للمراجعة':''
    default:            return ''
  }
}

// ===== HELPERS =====
function actorName(key: string) {
  if (!key) return '—'
  return allStaff.value.find(s => s.key===key)?.name || key.split(':')[1] || key
}
function goBack() {
  router.push('/supervisor/listings')
}

watch(() => route.query.id, () => { initDraft() })
</script>
