<template>
  <div>

    <!-- ============================================================ -->
    <!-- ==================== DETAIL VIEW ========================== -->
    <!-- ============================================================ -->
    <template v-if="detailListing">

      <!-- Header -->
      <div class="page-title">
        <div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" @click="detailListing = null">→ رجوع</button>
            <button class="btn btn-ghost btn-sm" @click="exportDetailPdf">↓ PDF</button>
            <button class="btn btn-ghost btn-sm" @click="exportDetailPng">↓ صورة PNG</button>
            <button class="btn btn-ghost btn-sm" @click="exportDetailExcel">↓ Excel</button>
          </div>
          <h2 style="margin:10px 0 2px;">{{ detailListing.title || '—' }}</h2>
          <p>التقرير التسويقي لوحدتك</p>
        </div>
      </div>

      <!-- ملف الوحدة -->
      <div class="card" style="margin-bottom:16px;">
        <div class="unit-profile-grid">
          <div class="kv-item"><span class="kv-k">الوحدة</span><span class="kv-v">{{ detailListing.title || '—' }}</span></div>
          <div class="kv-item"><span class="kv-k">العمارة</span><span class="kv-v">{{ detailPropertyName(detailListing) || '—' }}</span></div>
          <div class="kv-item"><span class="kv-k">رقم الوحدة</span><span class="kv-v">{{ detailListing.unitNo || '—' }}</span></div>
          <div class="kv-item"><span class="kv-k">النوع</span><span class="kv-v">{{ LS_TYPES[detailListing.unitType] || '—' }}</span></div>
          <div class="kv-item">
            <span class="kv-k">العرض والسعر</span>
            <span class="kv-v">
              <span class="badge badge-neutral" style="margin-left:4px;">{{ detailListing.dealType === 'rent' ? 'إيجار' : 'بيع' }}</span>
              {{ detailListing.rentPrice ? Number(detailListing.rentPrice).toLocaleString('ar-SA-u-nu-latn') + ' ر.س' : '—' }}
            </span>
          </div>
        </div>
      </div>

      <!-- روابط المنصات -->
      <div class="card" style="margin-bottom:16px;">
        <h3>روابط وحدتك في المنصات</h3>
        <div v-if="publishedLinks(detailListing).length" class="platforms-grid">
          <a v-for="p in publishedLinks(detailListing)" :key="p.id"
             :href="(detailListing.platforms || {})[p.id]?.url || '#'"
             target="_blank" class="platform-chip">
            <span>🔗</span>
            <div>
              <div class="plat-name">{{ p.name }}</div>
            </div>
          </a>
        </div>
        <div v-else class="empty-inline">لم تُنشر الوحدة في أي منصة بعد</div>
      </div>

      <!-- البوستر التقريري -->
      <div class="report-poster" ref="posterRef" style="margin-bottom:16px;">

        <!-- رأس البوستر -->
        <div class="poster-head">
          <div class="poster-logo">
            <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
              <path d="M50 8 L84 30 V38 L50 17 L16 38 V30 Z" fill="#fff"/>
              <path d="M12 42 L50 18 L88 42 V54 L50 30 L12 54 Z" fill="#E1712F"/>
              <path d="M29 50 L46 40 V70 L29 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
              <path d="M71 50 L54 40 V70 L71 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
              <rect x="46" y="42" width="8" height="46" fill="#fff"/>
            </svg>
            <div>
              <div style="font-weight:800;font-size:13px;color:#fff;">مؤسسة سعود علي السقامي للعقارات</div>
              <div style="font-size:10px;color:#E1712F;letter-spacing:.5px;">SAUD ALI ALSAQAMI REAL ESTATE EST.</div>
            </div>
          </div>
          <div class="poster-title-wrap">
            <div class="poster-unit-name">تقرير {{ detailListing.title }}</div>
            <div class="poster-sub">تقرير تسويقي وتشغيلي للوحدة</div>
            <div class="poster-insight-btn">📊 ملخص الأداء الحالي والتوصيات التسويقية</div>
          </div>
        </div>

        <!-- تنبيه لا قراءات -->
        <div v-if="!detailReadings.length" class="poster-no-data">
          لا توجد قراءات مسجلة بعد – الأرقام أدناه أصفار مؤقتة
        </div>

        <!-- مؤشرات الأداء -->
        <div class="poster-section-title">📊 مؤشرات الأداء الرئيسية</div>
        <div class="kpis-grid">
          <div v-for="kpi in kpiCards" :key="kpi.key" class="kpi-card">
            <div class="kpi-icon">{{ kpi.icon }}</div>
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-val">{{ kpi.val }}</div>
          </div>
        </div>

        <!-- قنوات + قراءة سريعة -->
        <div class="poster-two-col">
          <div class="poster-box">
            <div class="poster-box-title">📈 قنوات الاستفسار</div>
            <div class="channels-row">
              <div v-for="ch in channels" :key="ch.key" class="ch-item">
                <div class="ch-val">{{ ch.val }}</div>
                <div class="ch-icon">{{ ch.icon }}</div>
                <div class="ch-label">{{ ch.label }}</div>
              </div>
            </div>
          </div>
          <div class="poster-box">
            <div class="poster-box-title">🔍 قراءة سريعة</div>
            <div v-if="detailReadings.length" class="insight-text">{{ quickInsight }}</div>
            <div v-else class="insight-text" style="color:#aaa;">لم تُسجّل أي قراءة تسويقية بعد.</div>
          </div>
        </div>

        <!-- الخطوات العملية -->
        <div class="poster-section-title" style="margin-top:20px;">✨ الخطوات اللازمة لزيادة المخرجات التسويقية للوحدة</div>
        <div class="steps-grid">
          <div v-for="(step, i) in actionSteps" :key="i" class="step-card">
            <div class="step-num">{{ i + 1 }}</div>
            <div class="step-text">{{ step }}</div>
          </div>
        </div>

        <!-- التوصية العامة -->
        <div class="poster-recommendation">
          <span class="rec-label">التوصية العامة</span>
          <span class="rec-text">{{ generalRecommendation }}</span>
        </div>

        <!-- ذيل -->
        <div class="poster-footer">
          <span>مقا نحو فرص أكبر</span>
          <span>صادر بتاريخ {{ fmtDate(todayISO()) }}</span>
          <span>استثمار اليوم.. لقاء أفضل غداً</span>
        </div>
      </div>

      <!-- سجل القراءات -->
      <div class="card" style="margin-bottom:16px;">
        <h3>سجل القراءات</h3>
        <template v-if="detailReadings.length">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>تاريخ التنزيل</th>
                  <th>المشاهدات</th>
                  <th>رسائل الواتساب</th>
                  <th>محادثات بيوت</th>
                  <th>محادثات حراج</th>
                  <th>محادثات عقار</th>
                  <th>اتصالات الواردة</th>
                  <th>اتصالات مرسلة</th>
                  <th>عملاء مهتمون</th>
                  <th>زيارات منسقة</th>
                  <th>زيارات تامة</th>
                  <th>معربنون</th>
                  <th>منفّذون</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in detailReadings" :key="r.id">
                  <td style="white-space:nowrap;">📅 {{ fmtDate(r.date) }}</td>
                  <td><b>{{ r.views ?? 0 }}</b></td>
                  <td>{{ r.wa ?? 0 }}</td>
                  <td>{{ r.bayut ?? 0 }}</td>
                  <td>{{ r.haraj ?? 0 }}</td>
                  <td>{{ r.aqar ?? 0 }}</td>
                  <td>{{ r.callsIn ?? 0 }}</td>
                  <td>{{ r.callsOut ?? 0 }}</td>
                  <td>{{ r.followup ?? 0 }}</td>
                  <td>{{ r.visitsPlanned ?? 0 }}</td>
                  <td>{{ r.visitsDone ?? 0 }}</td>
                  <td>{{ r.deposits ?? 0 }}</td>
                  <td>{{ r.executed ?? 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="empty-inline">لا توجد قراءات مسجلة لهذه الوحدة</div>
      </div>

      <!-- اطلب تسويقاً إضافياً -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
          <h3 style="margin:0;">اطلب تسويقاً إضافياً لوحدتك</h3>
        </div>
        <p class="muted" style="font-size:12.5px;margin-bottom:16px;">
          اختر نوع التسويق المناسب. تصلك الإدارة بعد مراجعة الطلب. بعض الأنواع المدفوعة تُحسب بالأسعار الموضحة.
        </p>

        <!-- بطاقات الأنواع -->
        <div class="mr-cards-grid">
          <div v-for="(item, k) in MR_CATALOG" :key="k"
               class="mr-catalog-card"
               :class="item.price === null ? 'free' : 'paid'">
            <div class="mr-cat-title">{{ item.label }}</div>
            <div class="mr-cat-desc muted">{{ item.desc }}</div>
            <div class="mr-cat-price" :style="item.price ? 'color:var(--orange)' : 'color:var(--success,#3F7D52)'">
              {{ item.price ? item.price + ' ر.س' : 'مجانية' }}
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:10px;width:100%;"
                    @click="quickSubmitMR(k, item)">اطلب هذا النوع</button>
          </div>
        </div>

        <!-- Modal: طلب تسويق إضافي -->
        <Teleport to="body">
          <div v-if="mrModal.open" class="modal-overlay" @mousedown.self="mrModal.open = false">
            <div class="modal">
              <div class="modal-head">
                <h3>طلب تسويق إضافي</h3>
                <button class="modal-close" @click="mrModal.open = false">×</button>
              </div>
              <div class="kv-row"><span class="kv-k">الوحدة</span><span class="kv-v fw7">{{ detailListing?.title || '—' }}</span></div>
              <div class="kv-row"><span class="kv-k">نوع التسويق</span><span class="kv-v fw7">{{ mrModal.label }}</span></div>
              <div class="kv-row">
                <span class="kv-k">التكلفة</span>
                <span class="kv-v fw7" :style="mrModal.price ? 'color:var(--orange)' : 'color:#3F7D52'">
                  {{ mrModal.price ? mrModal.price + ' ر.س' : 'مجانية' }}
                </span>
              </div>
              <div class="field" style="margin-top:14px;">
                <label>ملاحظات للإدارة (اختياري)</label>
                <textarea v-model="mrModal.note" rows="3" placeholder="أي تفاصيل تريد إضافتها للطلب..."></textarea>
              </div>
              <p v-if="mrModal.price" class="hint-text" style="margin-bottom:12px;">
                سيتم تأكيد التكلفة النهائية من الإدارة قبل التنفيذ.
              </p>
              <div class="modal-actions">
                <button class="btn btn-ghost" @click="mrModal.open = false">إلغاء</button>
                <button class="btn btn-primary" @click="confirmMR">إرسال الطلب</button>
              </div>
            </div>
          </div>
        </Teleport>
        <div style="margin-top:18px;">
          <h3 style="margin:0 0 10px;">طلباتي لهذه الوحدة</h3>
          <template v-if="detailMRs.length">
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>نوع الطلب</th><th>ملاحظة</th><th>التاريخ</th><th>الحالة</th></tr>
                </thead>
                <tbody>
                  <tr v-for="mr in detailMRs" :key="mr.id">
                    <td><span class="badge badge-neutral">{{ mr.typeLabel }}</span></td>
                    <td><span class="muted" style="font-size:12.5px;">{{ mr.note || '—' }}</span></td>
                    <td style="font-size:12px;white-space:nowrap;">{{ fmtDate(mr.requestedAt.slice(0,10)) }}</td>
                    <td><span class="badge" :class="mrStatusCls(mr.status)">{{ mrStatusLabel(mr.status) }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <div v-else class="empty-inline">لا توجد طلبات تسويق</div>
        </div>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- ====================== LIST VIEW ========================== -->
    <!-- ============================================================ -->
    <template v-else>

      <!-- Header -->
      <div class="page-title">
        <div>
          <h2>تقارير وحداتي</h2>
          <p>الأرقام التسويقية لوحداتك — أرقام المشاهدات والاستفسارات وروابط الإعلانات</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" @click="exportExcel">↓ Excel</button>
          <button class="btn btn-ghost btn-sm" @click="exportPdf">↓ PDF</button>
        </div>
      </div>

      <!-- Filter -->
      <div class="card filter-bar" style="margin-bottom:18px;">
        <label>الفترة:</label>
        <select v-model="periodMode">
          <option value="cumulative">تقرير مجمّع (حتى تاريخه)</option>
          <option value="monthly">تقرير شهري</option>
        </select>
        <span class="hint-text">
          {{ periodMode === 'cumulative'
            ? 'القراءات: تركمة التقرير الشهري بعرض الإجمالي حتى نهاية الشهر المشار عليه داخله'
            : 'عرض قراءات شهر محدد فقط' }}
        </span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="card" style="text-align:center;padding:40px;">
        <div class="spinner" style="margin:0 auto 12px;"></div>
        <div class="muted">جارٍ التحميل...</div>
      </div>

      <template v-else>
        <!-- لا توجد وحدات -->
        <div v-if="!myListings.length" class="card" style="text-align:center;padding:48px;">
          <div style="font-size:36px;margin-bottom:10px;">📊</div>
          <b>لا توجد وحدات مرتبطة بحسابك</b>
          <p class="muted" style="margin-top:6px;font-size:13px;">يتم ربط الوحدات باسمك من قِبَل المشرف</p>
        </div>

        <template v-else>
          <!-- Report paper -->
          <div class="report-paper" ref="reportRef">
            <div class="rp-head">
              <div class="rp-logo">
                <svg width="42" height="42" viewBox="0 0 100 100" fill="none">
                  <path d="M50 8 L84 30 V38 L50 17 L16 38 V30 Z" fill="#3A3733"/>
                  <path d="M12 42 L50 18 L88 42 V54 L50 30 L12 54 Z" fill="#E1712F"/>
                  <path d="M29 50 L46 40 V70 L29 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
                  <path d="M71 50 L54 40 V70 L71 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
                  <rect x="46" y="42" width="8" height="46" fill="#3A3733"/>
                </svg>
                <div>
                  <div class="rp-org">مؤسسة سعود علي السقامي للعقارات</div>
                  <div class="rp-org-en">SAUD ALI ALSAQAMI REAL ESTATE EST.</div>
                </div>
              </div>
              <div class="rp-meta">
                <div class="rp-title">تقرير الوحدات التسويقي – {{ ownerDisplayName }}</div>
                <div class="rp-sub">التقرير المجمّع (حتى تاريخه)</div>
                <div class="rp-date">تاريخ الإصدار: {{ fmtDate(todayISO()) }}</div>
              </div>
            </div>

            <!-- KPIs -->
            <div class="kpi-row">
              <div class="kpi-box"><div class="kpi-lbl">عدد الوحدات</div><div class="kpi-val">{{ myListings.length }}</div></div>
              <div class="kpi-box"><div class="kpi-lbl">إجمالي المشاهدات</div><div class="kpi-val">{{ totalViews }}</div></div>
              <div class="kpi-box"><div class="kpi-lbl">إجمالي الاستفسارات</div><div class="kpi-val">{{ totalInquiries }}</div></div>
              <div class="kpi-box"><div class="kpi-lbl">الزيارات التامة</div><div class="kpi-val">{{ totalVisits }}</div></div>
              <div class="kpi-box"><div class="kpi-lbl">العملاء المعربنون</div><div class="kpi-val">{{ totalDeposits }}</div></div>
            </div>

            <!-- جدول -->
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الوحدة</th>
                    <th>المشاهدات</th><th>واتساب</th><th>بيوت</th><th>حراج</th><th>عقار</th>
                    <th>اتصالات واردة</th><th>متابعة مرسلة</th><th>عملاء مهتمون</th>
                    <th>زيارات منسقة</th><th>زيارات تامة</th><th>معربنون</th><th>منفّذون</th>
                    <th>الروابط</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="l in myListings" :key="l.id" class="clickable" @click="openDetail(l)">
                    <td>
                      <span class="ls-code">{{ l.code }}</span>
                      <div class="unit-title">{{ l.title || '—' }}</div>
                    </td>
                    <td><b>{{ unitStat(l,'views') }}</b></td>
                    <td>{{ unitStat(l,'wa') }}</td>
                    <td>{{ unitStat(l,'bayut') }}</td>
                    <td>{{ unitStat(l,'haraj') }}</td>
                    <td>{{ unitStat(l,'aqar') }}</td>
                    <td>{{ unitStat(l,'callsIn') }}</td>
                    <td>{{ unitStat(l,'callsOut') }}</td>
                    <td>{{ unitStat(l,'followup') }}</td>
                    <td>{{ unitStat(l,'visitsPlanned') }}</td>
                    <td>{{ unitStat(l,'visitsDone') }}</td>
                    <td>{{ unitStat(l,'deposits') }}</td>
                    <td>{{ unitStat(l,'executed') }}</td>
                    <td>
                      <div v-if="publishedLinks(l).length" class="chips-wrap">
                        <a v-for="p in publishedLinks(l)" :key="p.id"
                           :href="(l.platforms||{})[p.id]?.url||'#'"
                           target="_blank" class="chip chip-link" @click.stop>{{ p.name }}</a>
                      </div>
                      <span v-else class="muted">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="rp-footer">صادر آلياً عن نظام تحصيلات المستأجرين — مؤسسة سعود علي السقامي للعقارات</div>
          </div>

          <!-- طلبات التسويق الإضافي الخاصة بي -->
          <div class="card" style="margin-top:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
              <h3 style="margin:0;">طلبات التسويق الإضافي الخاصة بي</h3>
            </div>
            <p v-if="allMyMRs.length" class="muted" style="font-size:12px;margin-bottom:10px;">
              إجمالي التكلفة المعتمدة:
              <b style="color:var(--orange);">{{ totalApprovedCost.toLocaleString('ar-SA-u-nu-latn') }} ر.س</b>
            </p>
            <template v-if="allMyMRs.length">
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>الوحدة</th>
                      <th>نوع التسويق</th>
                      <th>ملاحظة</th>
                      <th>التكلفة</th>
                      <th>تاريخ الطلب</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="mr in allMyMRs" :key="mr.id">
                      <td>
                        <span class="ls-code">{{ listingCode(mr.listingId) }}</span>
                        <div class="unit-title">{{ listingTitle(mr.listingId) }}</div>
                      </td>
                      <td><span class="badge badge-neutral">{{ mr.typeLabel }}</span></td>
                      <td><span class="muted" style="font-size:12.5px;">{{ mr.note || '—' }}</span></td>
                      <td>
                        <b v-if="mrPrice(mr)" style="color:var(--orange);">{{ mrPrice(mr) }} ر.س</b>
                        <span v-else class="muted">—</span>
                      </td>
                      <td style="font-size:12px;white-space:nowrap;">{{ fmtDate(mr.requestedAt.slice(0,10)) }}</td>
                      <td><span class="badge" :class="mrStatusCls(mr.status)">{{ mrStatusLabel(mr.status) }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <div v-else class="empty-inline">لا توجد طلبات تسويق — اضغط على أي وحدة لإضافة طلب</div>
          </div>
        </template>
      </template>
    </template>

  </div>
</template>

<script setup lang="ts">
import { useExtState, type Listing, type MarketingRequest } from '~/composables/useAppState'
import { useFormat } from '~/composables/useFormat'
import { useAuthStore } from '~/stores/auth'

const { extState, load, save, mrNextId, lsOwnerName, getListing } = useExtState()
const { fmtDate, todayISO } = useFormat()
const authStore = useAuthStore()
const showToast = inject<(m: string) => void>('showToast', () => {})

// ── auth ──
const ownerDisplayName = computed(() => authStore.user?.name || '—')
const loading = ref(true)
onMounted(() => { load(); loading.value = false })

// ── الوحدات المرتبطة بالمالك ──
const myListings = computed<Listing[]>(() => {
  const name = ownerDisplayName.value.trim().toLowerCase()
  const uid_ = authStore.user?.id
  return extState.value.listings.filter(l => {
    if (l.kind === 'external') return false
    if (uid_ && l.ownerId && String(l.ownerId) === String(uid_)) return true
    const ln = (lsOwnerName(l) || '').trim().toLowerCase()
    return name && ln && ln === name
  })
})

const LS_TYPES: Record<string, string> = {
  apartment:'شقة', villa:'فيلا', floor:'دور', building:'عمارة',
  land:'أرض', shop:'محل تجاري', office:'مكتب', warehouse:'مستودع', other:'أخرى',
}

const publishedLinks = (l: Listing) =>
  (extState.value.listingPlatforms || []).filter(p => (l.platforms || {})[p.id]?.url)

function unitStat(l: Listing, field: string): number {
  const readings: any[] = (l as any).readings ?? []
  if (!readings.length) return 0
  return [...readings].sort((a, b) => b.date.localeCompare(a.date))[0]?.[field] ?? 0
}

const totalViews     = computed(() => myListings.value.reduce((s, l) => s + unitStat(l, 'views'), 0))
const totalInquiries = computed(() => myListings.value.reduce((s, l) =>
  s + unitStat(l,'wa') + unitStat(l,'aqar') + unitStat(l,'bayut') + unitStat(l,'haraj') + unitStat(l,'callsIn'), 0))
const totalVisits    = computed(() => myListings.value.reduce((s, l) => s + unitStat(l, 'visitsDone'), 0))
const totalDeposits  = computed(() => myListings.value.reduce((s, l) => s + unitStat(l, 'deposits'), 0))

const periodMode = ref<'cumulative' | 'monthly'>('cumulative')

// ── MR ──
const MR_TYPES: Record<string, string> = { photo:'تصوير', video:'فيديو', campaign:'حملة إعلانية', other:'أخرى' }
const mrStatusCls   = (s: string) => s==='approved'?'badge-approved':s==='rejected'?'badge-rejected':s==='in_progress'?'badge-done':s==='done'?'badge-done':'badge-pending'
const mrStatusLabel = (s: string) => ({pending:'بانتظار المراجعة',approved:'معتمد',rejected:'مرفوض',in_progress:'تم التنفيذ',done:'تم التنفيذ'} as any)[s]??s

const listingCode  = (lid: string) => getListing(lid)?.code  || lid
const listingTitle = (lid: string) => getListing(lid)?.title || '—'

// كل طلبات التسويق للمالك (للقائمة الرئيسية)
const allMyMRs = computed<MarketingRequest[]>(() =>
  myListings.value.flatMap(l => l.marketingRequests ?? [])
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
)

const mrPrice = (mr: MarketingRequest) => {
  const p = (mr as any).approvedPrice
  return p ? Number(p).toLocaleString('ar-SA-u-nu-latn') : null
}

const totalApprovedCost = computed(() =>
  allMyMRs.value.reduce((s, m) => s + Number((m as any).approvedPrice || 0), 0)
)

// ============================================================
// DETAIL VIEW
// ============================================================
const detailListing = ref<Listing | null>(null)

function openDetail(l: Listing) {
  detailListing.value = l
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const detailPropertyName = (l: Listing) => {
  if (l.propertyId) {
    const p = extState.value.properties.find(x => x.id === l.propertyId)
    if (p) return (p as any).name || ''
  }
  return ''
}

interface Reading {
  id: string; date: string
  views: number; wa: number; aqar: number; bayut: number; haraj: number
  callsIn: number; callsOut: number; followup: number
  visitsPlanned: number; visitsDone: number; deposits: number; executed: number
  note: string
}

const detailReadings = computed<Reading[]>(() =>
  ((detailListing.value as any)?.readings ?? []) as Reading[]
)

const detailMRs = computed<MarketingRequest[]>(() =>
  detailListing.value?.marketingRequests ?? []
)

const lastReading = computed<Reading | null>(() => {
  const rs = detailReadings.value
  if (!rs.length) return null
  return [...rs].sort((a, b) => b.date.localeCompare(a.date))[0]
})

const kpiCards = computed(() => {
  const r = lastReading.value
  return [
    { key:'callsIn',       icon:'📞', label:'عدد الاتصالات الواردة',                                   val: r?.callsIn      ?? 0 },
    { key:'callsOut',      icon:'📲', label:'عدد الاتصالات المرسلة - عملاء تعاد متابعتهم',              val: r?.callsOut     ?? 0 },
    { key:'haraj',         icon:'🏘️', label:'عدد محادثات حراج',                                        val: r?.haraj        ?? 0 },
    { key:'aqar',          icon:'🏠', label:'عدد محادثات عقار',                                         val: r?.aqar         ?? 0 },
    { key:'bayut',         icon:'🏢', label:'عدد محادثات بيوت',                                         val: r?.bayut        ?? 0 },
    { key:'wa',            icon:'💬', label:'عدد رسائل الواتساب الواردة',                               val: r?.wa           ?? 0 },
    { key:'followup',      icon:'👥', label:'عدد العملاء المهتمين في مرحلة المتابعة - مهتمين',          val: r?.followup     ?? 0 },
    { key:'visitsPlanned', icon:'📅', label:'عدد الزيارات المنسقة',                                     val: r?.visitsPlanned?? 0 },
    { key:'visitsDone',    icon:'✅', label:'عدد الزيارات التامة',                                       val: r?.visitsDone   ?? 0 },
    { key:'deposits',      icon:'💰', label:'عدد العملاء المعربنين',                                    val: r?.deposits     ?? 0 },
    { key:'executed',      icon:'🔑', label:'عدد العملاء المنفّذين',                                    val: r?.executed     ?? 0 },
    { key:'views',         icon:'👁️', label:'عدد المشاهدات بجميع المنصات',                             val: r?.views        ?? 0 },
  ]
})

const channels = computed(() => {
  const r = lastReading.value
  return [
    { key:'wa',      icon:'💬', label:'الواتساب',         val: r?.wa      ?? 0 },
    { key:'haraj',   icon:'🏘️', label:'حراج',             val: r?.haraj   ?? 0 },
    { key:'bayut',   icon:'🏢', label:'بيوت',             val: r?.bayut   ?? 0 },
    { key:'aqar',    icon:'🏠', label:'عقار',             val: r?.aqar    ?? 0 },
    { key:'callsIn', icon:'📞', label:'اتصالات الواردة',   val: r?.callsIn ?? 0 },
  ]
})

const quickInsight = computed(() => {
  const r = lastReading.value
  if (!r) return ''
  const total = (r.wa??0)+(r.aqar??0)+(r.bayut??0)+(r.haraj??0)+(r.callsIn??0)
  if (r.deposits > 0) return 'تحقّق الوحدة تفاعلًا جيدًا مع وجود عميل دافع للعربون؛ يُنصح بمتابعة إجراءات توقيع العقد.'
  if (r.visitsDone > 0) return `تمّت ${r.visitsDone} زيارة ميدانية – يُنصح بالمتابعة الفورية مع الزوار لتحويلهم إلى عربون.`
  if (total > 20) return 'الوحدة تحقق تفاعلاً إعلانياً جيداً – ركّز على تحويل الاستفسارات إلى زيارات مجدولة.'
  if (total > 5)  return 'تفاعل متوسط – يُنصح بتحديث الصور وترقية الإعلان في المنصات لرفع معدل الاستفسارات.'
  return 'تفاعل منخفض – يُنصح بمراجعة جودة الإعلان والسعر وإضافة جولة فيديو لزيادة الظهور.'
})

const generalRecommendation = computed(() => {
  if (!detailReadings.value.length) return 'ابدأ بإدخال قراءة تسويقية أولى لتظهر التوصيات المناسبة لوضعها.'
  const r = lastReading.value
  if (!r) return ''
  if (r.deposits > 0) return 'الاستمرار في المتابعة الهاتفية مع العملاء المهتمين وتثبيت العربون.'
  return 'تكثيف جهود التسويق الرقمي مع تحديث محتوى الإعلانات في المنصات.'
})

const actionSteps = [
  'نشر الوحدة عن طريق الشباب في جميع قروبات والأنساب المسوقين وفي السوشيال ميديا (خاصة بيع)',
  'نشر الفيديو المولّد في جميع منصات التواصل الاجتماعي (حملة الزيارات – مشاهدات)',
  'استخدام خاصية الموقع الدقيق (إدراج الموقع) والتسجيل بيزيد من ظهور الإعلان بنسبة 30%',
  'ترقية الإعلان في جميع المنصات',
  'تفعيل خاصية عقار بلس للحصول على تكيوت لتكون مصادر الإرسال للمسوقين والتقارير الدقيقة',
  'عمل حملة إعلانية مدفوعة على تيكتوك وسناب ثبات',
  'التواصل مع جميع العملاء القدامى المهتمين بهذا النوع من الوحدات',
]

// كتالوج طلبات التسويق
const MR_CATALOG: Record<string, { label: string; desc: string; price: number | null }> = {
  share_free:    { label:'شدوا حيلكم عليها',              desc:'كيف حفد فريق التسويق والمسوّقين في تسويق وحدتك', price: null },
  video_free:    { label:'برسلكم فيديوهات ترويجية ضيفوها', desc:'ترسل لكم فيديوهات ترويجية جاهزة لإضافتها في الإعلان', price: null },
  video_promo:   { label:'ضيفوا فيديوهات ترويجية من عندكم', desc:'يُضيف فيديوهات ترويجية جاهزة لإضافتها في الإعلان للمالك', price: null },
  video_paid:    { label:'سووا حملة فيديوهات بالمنصات',    desc:'حملة فيديوهات على المنصات — يحدد المشرف السعر', price: 0 },
  upgrade_basic: { label:'سووا ترقية للإعلان بمنصة واحدة', desc:'ترقية الإعلان ليظهر بشكل أعلى في منصة واحدة', price: 50 },
  upgrade_all:   { label:'سووا حملة ترقية بالمنصات الأساسية', desc:'ترقية الإعلان على المنصات الأساسية كلها', price: 200 },
  campaign_basic:{ label:'سووا حملة إعلانية بمنصة واحدة',  desc:'حملة إعلانية مدفوعة موجّهة على منصة واحدة', price: 1000 },
  campaign_all:  { label:'سووا حملة إعلانية مموّلة بالمنصات الأساسية', desc:'حملة إعلانية مدفوعة موجّهة على المنصات الأساسية', price: 3000 },
}

// Modal طلب التسويق
const mrModal = reactive({ open: false, type: '', label: '', price: null as number | null, note: '' })

function quickSubmitMR(type: string, item: { label: string; desc: string; price: number | null }) {
  if (!detailListing.value) return
  mrModal.type  = type
  mrModal.label = item.label
  mrModal.price = item.price
  mrModal.note  = ''
  mrModal.open  = true
}

function confirmMR() {
  if (!detailListing.value) return
  const target = extState.value.listings.find(l => l.id === detailListing.value!.id)
  if (!target) return
  const mr: MarketingRequest = {
    id: mrNextId(),
    listingId: detailListing.value.id,
    type: mrModal.type as any,
    typeLabel: mrModal.label,
    note: mrModal.note.trim() || undefined,
    status: 'pending',
    requestedBy: `owner:${authStore.user?.id || '0'}`,
    requestedAt: new Date().toISOString(),
  }
  if (!target.marketingRequests) target.marketingRequests = []
  target.marketingRequests.push(mr)
  save()
  mrModal.open = false
  showToast(`تم إرسال طلب: ${mrModal.label}`)
}

// ── تصدير التفصيل ──
const posterRef = ref<HTMLElement | null>(null)

async function exportDetailPng() {
  if (!posterRef.value) return
  showToast('جارٍ تصدير الصورة...')
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(posterRef.value, { backgroundColor:'#2B2520', scale:2, useCORS:true, logging:false })
    const link = document.createElement('a')
    link.download = `تقرير_${detailListing.value?.code || 'الوحدة'}_${todayISO()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast('تم تنزيل الصورة')
  } catch { showToast('تعذّر تصدير الصورة') }
}

function exportDetailPdf() {
  if (!posterRef.value) return
  const pw = window.open('', '_blank', 'width=1100,height=800')
  if (!pw) { showToast('السماح بالنوافذ المنبثقة لاستخدام الطباعة'); return }
  pw.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تقرير الوحدة</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#2B2520;font-family:'Segoe UI',Tahoma,sans-serif;padding:20px;}
    ${Array.from(document.styleSheets).flatMap(s=>{try{return Array.from(s.cssRules).map(r=>r.cssText)}catch{return[]}}).join('\n')}
    </style></head><body>${posterRef.value.outerHTML}</body></html>`)
  pw.document.close(); pw.focus()
  setTimeout(() => { pw.print(); pw.close() }, 800)
}

async function exportDetailExcel() {
  if (!detailListing.value) return
  const l = detailListing.value
  const readings: Reading[] = (l as any).readings ?? []
  if (!readings.length) { showToast('لا توجد قراءات للتصدير'); return }
  try {
    const XLSX = await import('xlsx')
    const rows = readings.map(r => ({
      'التاريخ': r.date, 'المشاهدات': r.views, 'واتساب': r.wa,
      'بيوت': r.bayut, 'حراج': r.haraj, 'عقار': r.aqar,
      'اتصالات واردة': r.callsIn, 'متابعة مرسلة': r.callsOut,
      'عملاء مهتمون': r.followup, 'زيارات منسقة': r.visitsPlanned,
      'زيارات تامة': r.visitsDone, 'معربنون': r.deposits, 'منفّذون': r.executed,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, l.code || 'الوحدة')
    XLSX.writeFile(wb, `تقرير_${l.code || 'الوحدة'}_${todayISO()}.xlsx`)
    showToast('تم تصدير Excel')
  } catch { showToast('تعذّر تصدير Excel') }
}

// ── تصدير القائمة ──
const reportRef = ref<HTMLElement | null>(null)

function exportPdf() {
  if (!reportRef.value) return
  const pw = window.open('', '_blank', 'width=1200,height=900')
  if (!pw) { showToast('السماح بالنوافذ المنبثقة'); return }
  pw.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تقارير وحداتي</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',Tahoma,sans-serif;padding:24px;color:#3A3733;background:#fff;}
    ${Array.from(document.styleSheets).flatMap(s=>{try{return Array.from(s.cssRules).map(r=>r.cssText)}catch{return[]}}).join('\n')}
    </style></head><body>${reportRef.value.outerHTML}</body></html>`)
  pw.document.close(); pw.focus()
  setTimeout(() => { pw.print(); pw.close() }, 800)
}

async function exportExcel() {
  if (!myListings.value.length) { showToast('لا توجد بيانات'); return }
  try {
    const XLSX = await import('xlsx')
    const rows = myListings.value.map(l => ({
      'الكود': l.code, 'الوحدة': l.title||'—',
      'المشاهدات': unitStat(l,'views'), 'واتساب': unitStat(l,'wa'),
      'بيوت': unitStat(l,'bayut'), 'حراج': unitStat(l,'haraj'), 'عقار': unitStat(l,'aqar'),
      'اتصالات واردة': unitStat(l,'callsIn'), 'متابعة مرسلة': unitStat(l,'callsOut'),
      'عملاء مهتمون': unitStat(l,'followup'), 'زيارات منسقة': unitStat(l,'visitsPlanned'),
      'زيارات تامة': unitStat(l,'visitsDone'), 'معربنون': unitStat(l,'deposits'), 'منفّذون': unitStat(l,'executed'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'تقارير الوحدات')
    XLSX.writeFile(wb, `تقارير_وحداتي_${todayISO()}.xlsx`)
    showToast('تم تصدير Excel')
  } catch { showToast('تعذّر تصدير Excel') }
}
</script>

<style scoped>
.page-title { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px; }
.page-title h2 { margin:0;font-size:21px;font-weight:800;color:var(--charcoal,#3A3733); }
.page-title p  { margin:4px 0 0;color:var(--muted,#8A8479);font-size:12.5px; }

.card { background:var(--surface,#fff);border:1px solid var(--line,#E6DFD3);border-radius:14px;padding:20px; }
.card h3 { margin:0 0 14px;font-size:15px;font-weight:800;color:var(--charcoal,#3A3733); }

/* filter */
.filter-bar { display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:14px 18px; }
.filter-bar label { font-weight:700;font-size:13px;color:var(--muted,#8A8479);white-space:nowrap; }
.filter-bar select { padding:8px 12px;border-radius:9px;border:1.5px solid var(--line,#E6DFD3);background:var(--surface,#fff);font-family:inherit;font-size:13px;outline:none;color:var(--charcoal,#3A3733); }
.hint-text { font-size:12px;color:var(--muted,#8A8479);line-height:1.5; }

/* unit profile */
.unit-profile-grid { display:grid;grid-template-columns:repeat(5,1fr);gap:10px 20px; }
@media(max-width:900px){ .unit-profile-grid{ grid-template-columns:repeat(2,1fr); } }
.kv-item { display:flex;flex-direction:column;gap:3px;padding:8px 0;border-bottom:1px solid var(--line,#E6DFD3); }
.kv-k { font-size:11.5px;color:var(--muted,#8A8479);font-weight:700; }
.kv-v { font-size:13px;color:var(--charcoal,#3A3733);font-weight:600; }

/* platforms */
.platforms-grid { display:flex;flex-wrap:wrap;gap:10px; }
.platform-chip { display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg,#F3EFE8);border-radius:10px;text-decoration:none;color:var(--charcoal,#3A3733);border:1px solid var(--line,#E6DFD3);transition:.15s; }
.platform-chip:hover { border-color:var(--orange,#E1712F); }
.plat-name { font-weight:800;font-size:13px;color:var(--orange,#E1712F); }

/* report paper */
.report-paper { background:var(--surface,#fff);border:1px solid var(--line,#E6DFD3);border-radius:14px;padding:28px;margin-bottom:4px; }
.rp-head { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;flex-wrap:wrap;gap:12px; }
.rp-logo { display:flex;align-items:center;gap:10px; }
.rp-org    { font-weight:800;font-size:14px;color:var(--charcoal,#3A3733); }
.rp-org-en { font-size:10px;color:#E1712F;letter-spacing:.5px; }
.rp-meta   { text-align:left; }
.rp-title  { font-size:17px;font-weight:900;color:var(--charcoal,#3A3733); }
.rp-sub    { font-size:12px;color:var(--muted,#8A8479);margin-top:3px; }
.rp-date   { font-size:12px;color:var(--muted,#8A8479);margin-top:2px; }
.rp-footer { margin-top:18px;padding-top:12px;border-top:1px solid var(--line,#E6DFD3);font-size:11.5px;color:var(--muted,#8A8479);text-align:center; }

.kpi-row { display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px; }
@media(max-width:900px){ .kpi-row{ grid-template-columns:repeat(3,1fr); } }
.kpi-box { background:var(--bg,#F3EFE8);border-radius:12px;padding:14px 12px;text-align:center;border:1px solid var(--line,#E6DFD3); }
.kpi-lbl { font-size:11.5px;color:var(--muted,#8A8479);font-weight:700;margin-bottom:6px; }
.kpi-val { font-size:24px;font-weight:900;color:var(--charcoal,#3A3733); }

/* poster */
.report-poster { background:#2B2520;border-radius:16px;padding:28px;color:#fff;font-family:inherit; }
.poster-head { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px; }
.poster-logo { display:flex;align-items:center;gap:10px; }
.poster-title-wrap { text-align:left; }
.poster-unit-name { font-size:20px;font-weight:900;color:#fff; }
.poster-sub { font-size:12px;color:#aaa;margin-top:2px; }
.poster-insight-btn { display:inline-block;margin-top:8px;padding:6px 14px;background:rgba(255,255,255,.1);border-radius:20px;font-size:12px;color:#E1712F;border:1px solid rgba(225,113,47,.4); }
.poster-no-data { text-align:center;padding:10px 20px;background:rgba(255,255,255,.07);border-radius:10px;color:#aaa;font-size:13px;margin-bottom:16px; }
.poster-section-title { font-size:14px;font-weight:800;color:#E1712F;margin-bottom:12px; }

.kpis-grid { display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px; }
@media(max-width:900px){ .kpis-grid{ grid-template-columns:repeat(3,1fr); } }
.kpi-card { background:rgba(255,255,255,.07);border-radius:12px;padding:12px 10px;text-align:center;border:1px solid rgba(255,255,255,.1); }
.kpi-icon  { font-size:20px;margin-bottom:4px; }
.kpi-label { font-size:10px;color:#aaa;line-height:1.3;min-height:28px; }
.kpi-val   { font-size:22px;font-weight:900;color:black;margin-top:4px; }

.poster-two-col { display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px; }
@media(max-width:700px){ .poster-two-col{ grid-template-columns:1fr; } }
.poster-box { background:rgba(255,255,255,.07);border-radius:12px;padding:16px;border:1px solid rgba(255,255,255,.1); }
.poster-box-title { font-size:13px;font-weight:800;color:#E1712F;margin-bottom:12px; }
.channels-row { display:flex;gap:8px;flex-wrap:wrap;justify-content:center; }
.ch-item { text-align:center;min-width:50px; }
.ch-val   { font-size:20px;font-weight:900;color:#fff; }
.ch-icon  { font-size:16px; }
.ch-label { font-size:10px;color:#aaa;margin-top:2px; }
.insight-text { font-size:13px;color:#ccc;line-height:1.7; }

.steps-grid { display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:20px; }
@media(max-width:1000px){ .steps-grid{ grid-template-columns:repeat(3,1fr); } }
.step-card { background:rgba(255,255,255,.07);border-radius:12px;padding:12px 10px;text-align:center;border:1px solid rgba(255,255,255,.1);position:relative; }
.step-num { position:absolute;top:-10px;right:50%;transform:translateX(50%);background:#E1712F;color:#fff;width:22px;height:22px;border-radius:50%;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center; }
.step-text { font-size:11px;color:#ccc;line-height:1.5;margin-top:8px; }
.poster-recommendation { background:rgba(225,113,47,.15);border:1px solid rgba(225,113,47,.4);border-radius:12px;padding:14px 18px;display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap; }
.rec-label { background:#E1712F;color:#fff;font-size:12px;font-weight:800;padding:3px 10px;border-radius:20px;white-space:nowrap;flex-shrink:0; }
.rec-text  { color:#fff;font-size:13px;line-height:1.6; }
.poster-footer { display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,.1);font-size:11.5px;color:#888;flex-wrap:wrap;gap:6px; }

/* MR catalog */
.mr-cards-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:12px; }
@media(max-width:900px){ .mr-cards-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:500px){ .mr-cards-grid{ grid-template-columns:1fr; } }
.mr-catalog-card         { border-radius:12px;padding:14px;border:1.5px solid var(--line,#E6DFD3); }
.mr-catalog-card.free    { background:#fff;border-color:var(--line,#E6DFD3); }
.mr-catalog-card.paid    { background:#FFFBEA;border-color:#F0C040; }
.mr-cat-title { font-weight:800;font-size:13px;color:var(--charcoal,#3A3733);margin-bottom:4px; }
.mr-cat-desc  { font-size:11.5px;line-height:1.5;margin-bottom:6px; }
.mr-cat-price { font-size:13px;font-weight:800; }

/* table */
.table-wrap { overflow-x:auto; }
table { width:100%;border-collapse:collapse;font-size:13px; }
th { text-align:right;color:var(--muted,#8A8479);font-weight:700;font-size:11.5px;padding:9px 10px;border-bottom:1.5px solid var(--line,#E6DFD3);white-space:nowrap;background:var(--bg,#F3EFE8); }
td { padding:11px 10px;border-bottom:1px solid var(--line,#E6DFD3);vertical-align:middle; }
tr:last-child td { border-bottom:none; }
tr.clickable { cursor:pointer; }
tr.clickable:hover { background:var(--bg,#F3EFE8); }

.ls-code { background:var(--bg,#F3EFE8);color:var(--charcoal,#3A3733);font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;white-space:nowrap; }
.unit-title { font-weight:700;font-size:12.5px;color:var(--charcoal,#3A3733);margin-top:3px; }
.muted { color:var(--muted,#8A8479); }
.chips-wrap { display:flex;flex-wrap:wrap;gap:4px; }
.chip { background:var(--bg,#F3EFE8);color:var(--charcoal,#3A3733);font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px; }
.chip-link { color:var(--orange,#E1712F);text-decoration:none; }
.chip-link:hover { text-decoration:underline; }
.empty-inline { color:var(--muted,#8A8479);font-size:13px;padding:16px 0;text-align:center; }

.badge          { display:inline-block;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:800; }
.badge-pending  { background:#FBEEDA;color:#B8791E; }
.badge-approved { background:#E4F1E7;color:#3F7D52; }
.badge-rejected { background:#F7E7E2;color:#B3452F; }
.badge-inprogress { background:#E8F0FE;color:#1A56DB; }
.badge-done     { background:#E4F1E7;color:#3F7D52;font-weight:900; }
.badge-neutral  { background:var(--bg,#F3EFE8);color:var(--charcoal,#3A3733); }

.btn { border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:.15s;font-family:inherit; }
.btn-primary { background:var(--orange,#E1712F);color:#fff; }
.btn-primary:hover { background:#B85423; }
.btn-ghost   { background:transparent;color:var(--charcoal,#3A3733);border:1.5px solid var(--line,#E6DFD3); }
.btn-ghost:hover { border-color:var(--charcoal,#3A3733); }
.btn-sm { padding:7px 12px;font-size:12.5px;border-radius:8px; }

.spinner { width:32px;height:32px;border:3px solid var(--line,#E6DFD3);border-top-color:var(--orange,#E1712F);border-radius:50%;animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* modal */
.modal-overlay { position:fixed;inset:0;background:rgba(46,43,39,.5);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px; }
.modal { background:var(--surface,#fff);border-radius:16px;padding:26px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto; }
.modal-head { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:10px; }
.modal-head h3 { margin:0;font-size:17px;font-weight:800;color:var(--charcoal,#3A3733); }
.modal-close { background:var(--bg,#F3EFE8);border:none;width:30px;height:30px;border-radius:50%;font-size:18px;color:var(--muted,#8A8479);cursor:pointer;flex-shrink:0; }
.modal-actions { display:flex;gap:10px;justify-content:flex-end;margin-top:14px; }
.kv-row { display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line,#E6DFD3);font-size:13px; }
.kv-row .kv-k { color:var(--muted,#8A8479);font-weight:700; }
.kv-row .kv-v { color:var(--charcoal,#3A3733); }
.fw7 { font-weight:700; }
.field textarea { width:100%;padding:10px 12px;border-radius:9px;border:1.5px solid var(--line,#E6DFD3);background:var(--bg,#F3EFE8);color:var(--charcoal,#3A3733);font-family:inherit;font-size:13.5px;outline:none;box-sizing:border-box;resize:vertical; }
.field textarea:focus { border-color:var(--orange,#E1712F);background:#fff; }
</style>
