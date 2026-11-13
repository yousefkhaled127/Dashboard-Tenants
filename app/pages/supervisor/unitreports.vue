<template>
  <div>

    <!-- ============================================================ -->
    <!-- ==================== DETAIL PAGE VIEW ====================== -->
    <!-- ============================================================ -->
    <template v-if="detailListing">
      <!-- Header -->
      <div class="page-title">
        <div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" @click="closeDetail">→ رجوع للقائمة</button>
            <button class="btn btn-ghost btn-sm" @click="openTaskModal(detailListing)">فتح مهمة الوحدة</button>
            <button class="btn btn-primary btn-sm" @click="openReadingModal">+ إضافة قراءة جديدة</button>
            <button class="btn btn-ghost btn-sm" @click="printDetail">↓ PDF</button>
            <button class="btn btn-ghost btn-sm" @click="exportPng">↓ صورة PNG</button>
            <button class="btn btn-ghost btn-sm" @click="exportExcel">↓ Excel</button>
          </div>
          <h2 style="margin:10px 0 2px;">{{ detailListing.title || '—' }}</h2>
          <p>ملف الوحدة وتقاريرها التسويقية</p>
        </div>
      </div>

      <!-- ملف الوحدة -->
      <div class="card" style="margin-bottom:16px;">
        <h3 class="section-title">ملف الوحدة</h3>
        <div class="unit-profile-grid">
          <div class="kv-item">
            <span class="kv-k">اسم الوحدة</span>
            <span class="kv-v">{{ detailListing.title || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">كود الوحدة</span>
            <span class="kv-v"><span class="ls-code">{{ detailListing.code }}</span></span>
          </div>
          <div class="kv-item">
            <span class="kv-k">العمارة</span>
            <span class="kv-v">{{ propertyName(detailListing) || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">رقم الوحدة</span>
            <span class="kv-v">{{ detailListing.unitNo || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">نوع الوحدة</span>
            <span class="kv-v">{{ LS_TYPES[detailListing.unitType] || detailListing.unitType || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">العرض والسعر</span>
            <span class="kv-v">
              <span class="badge badge-neutral" style="margin-left:4px;">{{ detailListing.dealType === 'rent' ? 'إيجار' : 'بيع' }}</span>
              {{ detailListing.rentPrice ? Number(detailListing.rentPrice).toLocaleString('ar-SA-u-nu-latn') + ' ر.س' : '—' }}
              <span v-if="detailListing.rentCycle" class="muted"> / {{ detailListing.rentCycle }}</span>
            </span>
          </div>
          <div class="kv-item">
            <span class="kv-k">اسم المالك</span>
            <span class="kv-v">{{ lsOwnerName(detailListing) || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">جوال المالك</span>
            <span class="kv-v">{{ detailListing.ownerPhone || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">المسؤول عن الوحدة</span>
            <span class="kv-v fw7">{{ actorName(detailListing.responsible) || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">اسم الحارس</span>
            <span class="kv-v">{{ detailListing.guard?.name || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">جوال الحارس</span>
            <span class="kv-v">{{ detailListing.guard?.phone || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">كود الداربزين للوحدة</span>
            <span class="kv-v">{{ detailListing.guard?.unitCode || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">رقم عقد الوساطة</span>
            <span class="kv-v">{{ detailListing.brokerageNo || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">الترخيص الإعلاني</span>
            <span class="kv-v">{{ detailListing.license?.number || '—' }}</span>
          </div>
          <div class="kv-item">
            <span class="kv-k">حالة المهمة</span>
            <span class="kv-v">
              <span class="badge badge-neutral">{{ statusLabel(detailListing.status) }}</span>
            </span>
          </div>
          <div class="kv-item">
            <span class="kv-k">الشاغرة</span>
            <span class="kv-v">{{ detailListing.vacant ? 'نعم' : 'لا' }}</span>
          </div>
        </div>
      </div>

      <!-- روابط المنصات -->
      <div class="card" style="margin-bottom:16px;">
        <h3 class="section-title">روابط الوحدة في المنصات</h3>
        <div v-if="publishedLinks(detailListing).length" class="platforms-grid">
          <a
            v-for="p in publishedLinks(detailListing)" :key="p.id"
            :href="detailListing.platforms[p.id]?.url || '#'"
            target="_blank"
            class="platform-chip"
          >
            <span class="plat-icon">🔗</span>
            <div>
              <div class="plat-name">{{ p.name }}</div>
              <div class="plat-no muted" style="font-size:11px;">{{ detailListing.platforms[p.id]?.adNo || '' }}</div>
            </div>
          </a>
        </div>
        <div v-else class="empty-inline">لم تُنشر الوحدة في أي منصة بعد</div>
      </div>

      <!-- التقرير التسويقي - بوستر مظلم -->
      <div class="report-poster" style="margin-bottom:16px;" ref="posterRef">
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

        <!-- مؤشرات الأداء الرئيسية -->
        <div class="poster-section-title">📊 مؤشرات الأداء الرئيسية</div>
        <div class="kpis-grid">
          <div class="kpi-card" v-for="kpi in kpiCards" :key="kpi.key">
            <div class="kpi-icon">{{ kpi.icon }}</div>
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-val">{{ kpi.val }}</div>
          </div>
        </div>

        <!-- قنوات الاستفسار + قراءة سريعة -->
        <div class="poster-two-col">
          <!-- قنوات الاستفسار -->
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
          <!-- قراءة سريعة -->
          <div class="poster-box">
            <div class="poster-box-title">🔍 قراءة سريعة</div>
            <div v-if="detailReadings.length" class="insight-text">
              {{ quickInsight }}
            </div>
            <div v-else class="insight-text muted" style="color:#aaa;">
              لم تُسجّل أي قراءة تسويقية لهذه الوحدة بعد.<br>سيظهر هنا ملخص الأداء فور إدخال أول قراءة.
            </div>
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

        <!-- تاريخ -->
        <div class="poster-footer">
          <span>مقا نحو فرص أكبر</span>
          <span>صادر بتاريخ {{ fmtDate(todayISO()) }}</span>
          <span>استثمار اليوم.. لقاء أفضل غداً</span>
        </div>
      </div>

      <!-- سجل القراءات -->
      <div class="card" style="margin-bottom:16px;">
        <h3 class="section-title">سجل القراءات</h3>
        <template v-if="detailReadings.length">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>مشاهدات</th>
                  <th>واتساب</th>
                  <th>عقار</th>
                  <th>بيوت</th>
                  <th>حراج</th>
                  <th>اتصالات واردة</th>
                  <th>متابعة صادرة</th>
                  <th>مهتمون</th>
                  <th>زيارات مجدولة</th>
                  <th>زيارات تامة</th>
                  <th>عربون</th>
                  <th>منفّذ</th>
                  <th>ملاحظة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in detailReadings" :key="r.id">
                  <td style="white-space:nowrap;">{{ fmtDate(r.date) }}</td>
                  <td><b>{{ r.views ?? 0 }}</b></td>
                  <td>{{ r.wa ?? 0 }}</td>
                  <td>{{ r.aqar ?? 0 }}</td>
                  <td>{{ r.bayut ?? 0 }}</td>
                  <td>{{ r.haraj ?? 0 }}</td>
                  <td>{{ r.callsIn ?? 0 }}</td>
                  <td>{{ r.callsOut ?? 0 }}</td>
                  <td>{{ r.followup ?? 0 }}</td>
                  <td>{{ r.visitsPlanned ?? 0 }}</td>
                  <td>{{ r.visitsDone ?? 0 }}</td>
                  <td>{{ r.deposits ?? 0 }}</td>
                  <td>{{ r.executed ?? 0 }}</td>
                  <td><span class="muted" style="font-size:12px;">{{ r.note || '—' }}</span></td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-ghost btn-sm" @click="openEditReading(r)">تعديل</button>
                      <button class="btn btn-danger btn-sm" @click="deleteReading(r.id)">حذف</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="empty-inline">لا توجد قراءات مسجلة لهذه الوحدة</div>
      </div>

      <!-- طلبات التسويق الإضافي لهذه الوحدة -->
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
          <h3 class="section-title" style="margin:0;">طلبات التسويق الإضافي لهذه الوحدة</h3>
          <button class="btn btn-ghost btn-sm" @click="showAddMrInline = !showAddMrInline">+ إضافة طلب</button>
        </div>

        <!-- إضافة طلب inline -->
        <div v-if="showAddMrInline" class="add-mr-box">
          <div class="grid grid-3" style="gap:10px;margin-bottom:10px;">
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
          <button class="btn btn-primary btn-sm" @click="addMR">إرسال الطلب</button>
        </div>

        <template v-if="detailMRs.length">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>نوع الطلب</th>
                  <th>ملاحظة</th>
                  <th>مقدّم الطلب</th>
                  <th>التاريخ</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mr in detailMRs" :key="mr.id">
                  <td><span class="badge badge-neutral">{{ mr.typeLabel }}</span></td>
                  <td><span class="muted" style="font-size:12.5px;">{{ mr.note || '—' }}</span></td>
                  <td>{{ actorName(mr.requestedBy) }}</td>
                  <td style="white-space:nowrap;font-size:12px;">{{ fmtDate(mr.requestedAt.slice(0,10)) }}</td>
                  <td><span class="badge" :class="mrStatusCls(mr.status)">{{ mrStatusLabel(mr.status) }}</span></td>
                  <td>
                    <div v-if="mr.status === 'pending'" style="display:flex;gap:6px;">
                      <button class="btn btn-primary btn-sm" @click="openApproveMR(mr)">اعتماد</button>
                      <button class="btn btn-danger btn-sm"  @click="decideMR(mr.id, 'rejected')">رفض</button>
                    </div>
                    <div v-else-if="mr.status === 'approved'" style="display:flex;gap:6px;">
                      <button class="btn btn-dark btn-sm" @click="confirmDoneDirect(mr.id)">بدء التنفيذ</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="empty-inline">لا توجد طلبات تسويق</div>
      </div>
    </template>

    <!-- ============================================================ -->
    <!-- ====================== LIST VIEW ========================== -->
    <!-- ============================================================ -->
    <template v-else>
      <!-- Header -->
      <div class="page-title">
        <div>
          <h2>تقارير الوحدات</h2>
          <p>متابعة ما يتم من تسويق على كل وحدة – أرقام المشاهدات والاستفسارات، مع ملف الوحدة كاملاً</p>
        </div>
      </div>

      <!-- Stat Cards -->
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

      <!-- Tabs -->
      <div class="pill-tabs" style="margin-bottom:14px;">
        <button class="pill-tab" :class="{ active: activeTab === 'units' }" @click="activeTab = 'units'">
          الوحدات ({{ lsOffice.length }})
        </button>
        <button class="pill-tab" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">
          طلبات التسويق الإضافي ({{ pendingMrCount }})
        </button>
      </div>

      <!-- TAB: UNITS -->
      <template v-if="activeTab === 'units'">
        <div class="search-bar">
          <select v-model="filterType">
            <option value="">كل الوحدات</option>
            <option v-for="(lbl, k) in LS_TYPES" :key="k" :value="k">{{ lbl }}</option>
          </select>
          <input v-model="searchQ" placeholder="ابحث باسم الوحدة، المالك، العمارة، الكود أو الحارس..." />
        </div>

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
                    <td><div class="stat-num">{{ (l.views ?? 0).toLocaleString('ar-SA-u-nu-latn') }}</div></td>
                    <td>
                      <div class="stat-num">{{ (l.inquiries?.total ?? 0).toLocaleString('ar-SA-u-nu-latn') }}</div>
                      <div v-if="l.inquiries?.total" class="muted" style="font-size:11px;">
                        {{ l.inquiries.related }} متعلقة · {{ l.inquiries.calls }} اتصال
                      </div>
                    </td>
                    <td><div class="stat-num">{{ l.visitsComplete ?? 0 }}</div></td>
                    <td>
                      <div v-if="publishedLinks(l).length" class="chips-wrap">
                        <a v-for="p in publishedLinks(l)" :key="p.id"
                           :href="l.platforms[p.id]?.url || '#'" target="_blank"
                           class="chip chip-link" @click.stop>{{ p.name }}</a>
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
                  <td colspan="8">
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

      <!-- TAB: MARKETING REQUESTS -->
      <template v-else>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
            <h3 style="margin:0;">طلبات التسويق الإضافي</h3>
            <select v-model="mrFilter" style="padding:8px 12px;border-radius:9px;border:1.5px solid var(--line);background:var(--bg);font-family:inherit;font-size:13px;outline:none;">
              <option value="">كل الطلبات</option>
              <option value="pending">بانتظار المراجعة</option>
              <option value="approved">مقبولة</option>
              <option value="rejected">مرفوضة</option>
            </select>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الوحدة</th><th>نوع الطلب</th><th>ملاحظة</th>
                  <th>مقدّم الطلب</th><th>تاريخ الطلب</th><th>الحالة</th><th></th>
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
                    <td><span class="badge" :class="mrStatusCls(mr.status)">{{ mrStatusLabel(mr.status) }}</span></td>
                    <td>
                      <div v-if="mr.status === 'pending'" style="display:flex;gap:6px;">
                        <button class="btn btn-primary btn-sm" @click="openApproveMR(mr)">اعتماد</button>
                        <button class="btn btn-danger btn-sm" @click="decideMR(mr.id, 'rejected')">رفض</button>
                      </div>
                      <div v-else-if="mr.status === 'approved'" style="display:flex;gap:6px;">
                        <button class="btn btn-dark btn-sm" @click="confirmDoneDirect(mr.id)">بدء التنفيذ</button>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="7">
                    <div class="empty-state">
                      <div class="empty-icon">📋</div>
                      <b>لا توجد طلبات</b>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>

    <!-- MODAL: تم التنفيذ -->
    <Teleport to="body">
      <div v-if="doneModal.open" class="modal-overlay" @mousedown.self="doneModal.open = false">
        <div class="modal">
          <div class="modal-head">
            <h3>تأكيد إتمام التنفيذ</h3>
            <button class="modal-close" @click="doneModal.open = false">×</button>
          </div>
          <p class="hint" style="margin-bottom:14px;font-weight:700;">
            {{ doneModal.typeLabel }} — {{ doneModal.unitTitle }}
          </p>
          <div class="field">
            <label>ملاحظة للمالك (اختياري)</label>
            <textarea v-model="doneModal.note" rows="3" placeholder="مثال: تم تنفيذ الحملة وتحقق 500 مشاهدة..."></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="doneModal.open = false">إلغاء</button>
            <button class="btn btn-primary" @click="confirmDone">تأكيد — تم التنفيذ</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================================ -->
    <!-- ============== MODAL: اعتماد طلب التسويق ================= -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <div v-if="approveMRModal.open" class="modal-overlay" @mousedown.self="approveMRModal.open = false">
        <div class="modal">
          <div class="modal-head">
            <h3>اعتماد الطلب</h3>
            <button class="modal-close" @click="approveMRModal.open = false">×</button>
          </div>
          <p class="hint" style="margin-bottom:14px;font-weight:700;">
            {{ approveMRModal.typeLabel }} — {{ approveMRModal.unitTitle }}
          </p>
          <div class="field">
            <label>سعر الحملة (ريال) *</label>
            <input v-model="approveMRModal.price" type="number" min="0" placeholder="مثال: 500" />
          </div>
          <div class="field">
            <label>ملاحظة للمالك (اختياري)</label>
            <textarea v-model="approveMRModal.note" rows="3" placeholder="أي تفاصيل..."></textarea>
          </div>
          <p class="hint" style="font-size:12px;color:var(--muted);margin-bottom:12px;">
            سيتم إشعار المالك بسعر الحملة وملاحظات الإدارة.
          </p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="approveMRModal.open = false">إلغاء</button>
            <button class="btn btn-primary" @click="confirmApproveMR">اعتماد</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================================ -->
    <!-- ============== MODAL: إضافة قراءة جديدة =================== -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <div v-if="showReadingModal" class="modal-overlay" @mousedown.self="showReadingModal = false">
        <div class="modal modal-lg">
          <div class="modal-head">
            <h3>{{ editingReadingId ? 'تعديل القراءة التسويقية' : 'إضافة قراءة تسويقية جديدة' }}</h3>
            <button class="modal-close" @click="showReadingModal = false">×</button>
          </div>

          <div class="field">
            <label>تاريخ القراءة</label>
            <input v-model="readingForm.date" type="date" />
          </div>

          <div class="grid grid-4" style="margin-bottom:4px;">
            <div class="field"><label>المشاهدات الكلية</label><input v-model.number="readingForm.views" type="number" min="0" /></div>
            <div class="field"><label>رسائل الواتساب</label><input v-model.number="readingForm.wa" type="number" min="0" /></div>
            <div class="field"><label>محادثات عقار</label><input v-model.number="readingForm.aqar" type="number" min="0" /></div>
            <div class="field"><label>محادثات بيوت</label><input v-model.number="readingForm.bayut" type="number" min="0" /></div>
          </div>
          <div class="grid grid-4" style="margin-bottom:4px;">
            <div class="field"><label>محادثات حراج</label><input v-model.number="readingForm.haraj" type="number" min="0" /></div>
            <div class="field"><label>الاتصالات الواردة</label><input v-model.number="readingForm.callsIn" type="number" min="0" /></div>
            <div class="field"><label>اتصالات المتابعة الصادرة</label><input v-model.number="readingForm.callsOut" type="number" min="0" /></div>
            <div class="field"><label>عملاء المتابعة المهتمون</label><input v-model.number="readingForm.followup" type="number" min="0" /></div>
          </div>
          <div class="grid grid-4" style="margin-bottom:4px;">
            <div class="field"><label>الزيارات المجدولة</label><input v-model.number="readingForm.visitsPlanned" type="number" min="0" /></div>
            <div class="field"><label>الزيارات المنفّذة</label><input v-model.number="readingForm.visitsDone" type="number" min="0" /></div>
            <div class="field"><label>دافعو العربون</label><input v-model.number="readingForm.deposits" type="number" min="0" /></div>
            <div class="field"><label>منفّذون</label><input v-model.number="readingForm.executed" type="number" min="0" /></div>
          </div>
          <div class="field">
            <label>ملاحظة القراءة (اختياري)</label>
            <input v-model="readingForm.note" placeholder="مثال: إقبال ممتاز بعد تحديث الصور..." />
          </div>

          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showReadingModal = false">إلغاء</button>
            <button class="btn btn-primary" @click="saveReading">{{ editingReadingId ? 'حفظ التعديل' : 'حفظ القراءة' }}</button>
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
const LS_STATUS_LABELS: Record<string, string> = {
  name_only: 'عندي الاسم فقط', basic_details: 'التفاصيل الأولية', photographed: 'تم التصوير',
  waiting_video: 'انتظار الفيديو', website_only: 'تم تنزيل الموقع فقط',
  awaiting_owner_license: 'انتظار الترخيص', license_issued: 'تم إصدار الترخيص',
  publishing: 'جاري التنزيل', published: 'تم تنزيل الإعلان',
}
const MR_TYPES: Record<string, string> = {
  photo: 'تصوير', video: 'فيديو', campaign: 'حملة إعلانية', other: 'أخرى',
}
const statusLabel = (s: string) => LS_STATUS_LABELS[s] || s || '—'

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
      ...cols.map(u => ({ key: `collector:${u.id}`, name: u.name })),
    ]
  } catch {
    const s = supervisorSession?.value
    if (s?.id) allStaff.value = [{ key: `supervisor:${s.id}`, name: s.name || 'أنا' }]
  }
})

// ── helpers ──
const propertyName = (l: Listing) => {
  if (l.propertyId) {
    const p = extState.value.properties.find(x => x.id === l.propertyId)
    if (p) return p.name
  }
  if (l.vacancyId) {
    const vac = extState.value.vacancies.find(v => v.id === l.vacancyId)
    if (vac) return vac.propertyName
  }
  return ''
}

const publishedLinks = (l: Listing) =>
  (extState.value.listingPlatforms || []).filter(p => l.platforms?.[p.id]?.url)

const listingCode  = (lid: string) => getListing(lid)?.code  || lid
const listingTitle = (lid: string) => getListing(lid)?.title || '—'

// ── list stats ──
const withReports = computed(() =>
  lsOffice.value.filter(l => (l.views ?? 0) > 0 || (l.inquiries?.total ?? 0) > 0).length
)
const totalViews = computed(() => lsOffice.value.reduce((s, l) => s + (l.views ?? 0), 0))
const totalInquiries = computed(() => lsOffice.value.reduce((s, l) => s + (l.inquiries?.total ?? 0), 0))
const allMR = computed<MarketingRequest[]>(() => lsOffice.value.flatMap(l => l.marketingRequests ?? []))
const pendingMrCount = computed(() => allMR.value.filter(m => m.status === 'pending').length)

// ── filter / search ──
const activeTab  = ref<'units' | 'requests'>('units')
const searchQ    = ref('')
const filterType = ref('')

const filteredUnits = computed(() => {
  let list = lsOffice.value
  if (filterType.value) list = list.filter(l => l.unitType === filterType.value)
  const q = searchQ.value.trim().toLowerCase()
  if (q) list = list.filter(l =>
    [l.code, l.title, lsOwnerName(l), propertyName(l), l.guard?.name].join(' ').toLowerCase().includes(q)
  )
  return list
})

const mrFilter = ref('')
const filteredMR = computed(() => {
  let list = allMR.value
  if (mrFilter.value) list = list.filter(m => m.status === mrFilter.value)
  return [...list].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
})

const mrStatusCls   = (s: string) => s === 'approved' ? 'badge-approved' : s === 'rejected' ? 'badge-rejected' : s === 'in_progress' ? 'badge-done' : s === 'done' ? 'badge-done' : 'badge-pending'
const mrStatusLabel = (s: string) => ({ pending: 'بانتظار المراجعة', approved: 'معتمد', rejected: 'مرفوض', in_progress: 'تم التنفيذ', done: 'تم التنفيذ' } as any)[s] ?? s

// ── modal اعتماد الطلب ──
const approveMRModal = reactive({
  open: false, mrId: '', typeLabel: '', unitTitle: '', price: '', note: ''
})

function openApproveMR(mr: MarketingRequest) {
  const listing = extState.value.listings.find(l => l.id === mr.listingId)
  approveMRModal.mrId      = mr.id
  approveMRModal.typeLabel = mr.typeLabel
  approveMRModal.unitTitle = listing?.title || mr.listingId
  approveMRModal.price     = ''
  approveMRModal.note      = ''
  approveMRModal.open      = true
}

function confirmApproveMR() {
  for (const l of extState.value.listings) {
    const mr = (l.marketingRequests || []).find(m => m.id === approveMRModal.mrId)
    if (mr) {
      mr.status    = 'approved'
      mr.decidedBy = myActorKey.value
      mr.decidedAt = new Date().toISOString()
      ;(mr as any).approvedPrice = approveMRModal.price || null
      ;(mr as any).approvedNote  = approveMRModal.note.trim() || null
      save()
      approveMRModal.open = false
      showToast('تم اعتماد الطلب — تم إرسال إشعار للمالك ✓')
      return
    }
  }
}

function confirmDoneDirect(mrId: string) {
  for (const l of extState.value.listings) {
    const mr = (l.marketingRequests || []).find(m => m.id === mrId)
    if (mr) {
      mr.status    = 'done'
      mr.decidedBy = myActorKey.value
      mr.decidedAt = new Date().toISOString()
      save()
      showToast('تم التنفيذ ✓')
      return
    }
  }
}

// ── modal بدء التنفيذ ──
const inProgressModal = reactive({
  open: false, mrId: '', typeLabel: '', unitTitle: '', note: ''
})

function openInProgressMR(mr: MarketingRequest) {
  const listing = extState.value.listings.find(l => l.id === mr.listingId)
  inProgressModal.mrId      = mr.id
  inProgressModal.typeLabel = mr.typeLabel
  inProgressModal.unitTitle = listing?.title || mr.listingId
  inProgressModal.note      = ''
  inProgressModal.open      = true
}

function confirmInProgress() {
  for (const l of extState.value.listings) {
    const mr = (l.marketingRequests || []).find(m => m.id === inProgressModal.mrId)
    if (mr) {
      mr.status    = 'in_progress'
      mr.decidedBy = myActorKey.value
      mr.decidedAt = new Date().toISOString()
      ;(mr as any).inProgressNote = inProgressModal.note.trim() || null
      save()
      inProgressModal.open = false
      showToast('تم بدء التنفيذ')
      return
    }
  }
}

// ── modal تم التنفيذ ──
const doneModal = reactive({ open: false, mrId: '', typeLabel: '', unitTitle: '', note: '' })

function openDoneMR(mr: MarketingRequest) {
  const listing = extState.value.listings.find(l => l.id === mr.listingId)
  doneModal.mrId      = mr.id
  doneModal.typeLabel = mr.typeLabel
  doneModal.unitTitle = listing?.title || mr.listingId
  doneModal.note      = ''
  doneModal.open      = true
}

function confirmDone() {
  for (const l of extState.value.listings) {
    const mr = (l.marketingRequests || []).find(m => m.id === doneModal.mrId)
    if (mr) {
      mr.status    = 'done'
      mr.decidedBy = myActorKey.value
      mr.decidedAt = new Date().toISOString()
      ;(mr as any).doneNote = doneModal.note.trim() || null
      save()
      doneModal.open = false
      showToast('تم إغلاق الطلب — تم التنفيذ ✓')
      return
    }
  }
}

function decideMR(mrId: string, decision: 'rejected') {
  for (const l of extState.value.listings) {
    const mr = (l.marketingRequests || []).find(m => m.id === mrId)
    if (mr) {
      mr.status    = decision
      mr.decidedBy = myActorKey.value
      mr.decidedAt = new Date().toISOString()
      save()
      showToast('تم رفض الطلب')
      return
    }
  }
}

// ============================================================
// ==================== DETAIL VIEW ==========================
// ============================================================

// نوع القراءة - نخزنها في readings[] على الـ Listing
interface Reading {
  id: string; date: string
  views: number; wa: number; aqar: number; bayut: number; haraj: number
  callsIn: number; callsOut: number; followup: number
  visitsPlanned: number; visitsDone: number; deposits: number; executed: number
  note: string
}

// نضيف readings للـ Listing type عند الوصول (dynamic field)
const detailListing = ref<Listing | null>(null)

const detailReadings = computed<Reading[]>(() => {
  if (!detailListing.value) return []
  return ((detailListing.value as any).readings ?? []) as Reading[]
})

const detailMRs = computed<MarketingRequest[]>(() => {
  if (!detailListing.value) return []
  return (detailListing.value.marketingRequests ?? [])
})

// آخر قراءة للـ KPIs
const lastReading = computed<Reading | null>(() => {
  const rs = detailReadings.value
  if (!rs.length) return null
  return [...rs].sort((a, b) => b.date.localeCompare(a.date))[0]
})

// KPI cards
const kpiCards = computed(() => {
  const r = lastReading.value
  return [
    { key: 'callsIn',      icon: '📞', label: 'عدد الاتصالات الواردة',                val: r?.callsIn ?? 0 },
    { key: 'callsOut',     icon: '📲', label: 'عدد الاتصالات المرسلة - عملاء تعاد متابعتهم', val: r?.callsOut ?? 0 },
    { key: 'haraj',        icon: '🏘️', label: 'عدد محادثات حراج',                     val: r?.haraj ?? 0 },
    { key: 'aqar',         icon: '🏠', label: 'عدد محادثات عقار',                     val: r?.aqar ?? 0 },
    { key: 'bayut',        icon: '🏢', label: 'عدد محادثات بيوت',                     val: r?.bayut ?? 0 },
    { key: 'wa',           icon: '💬', label: 'عدد رسائل الواتساب الواردة',            val: r?.wa ?? 0 },
    { key: 'followup',     icon: '👥', label: 'عدد العملاء المهتمين في مرحلة المتابعة - مهتمين', val: r?.followup ?? 0 },
    { key: 'visitsPlanned',icon: '📅', label: 'عدد الزيارات المنسقة',                  val: r?.visitsPlanned ?? 0 },
    { key: 'visitsDone',   icon: '✅', label: 'عدد الزيارات التامة',                   val: r?.visitsDone ?? 0 },
    { key: 'deposits',     icon: '💰', label: 'عدد العملاء المعربنين',                 val: r?.deposits ?? 0 },
    { key: 'executed',     icon: '🔑', label: 'عدد العملاء المنفّذين',                 val: r?.executed ?? 0 },
    { key: 'views',        icon: '👁️', label: 'عدد المشاهدات بجميع المنصات',           val: r?.views ?? 0 },
  ]
})

// قنوات الاستفسار
const channels = computed(() => {
  const r = lastReading.value
  return [
    { key: 'wa',      icon: '💬', label: 'الواتساب', val: r?.wa ?? 0 },
    { key: 'haraj',   icon: '🏘️', label: 'حراج',    val: r?.haraj ?? 0 },
    { key: 'bayut',   icon: '🏢', label: 'بيوت',    val: r?.bayut ?? 0 },
    { key: 'aqar',    icon: '🏠', label: 'عقار',    val: r?.aqar ?? 0 },
    { key: 'callsIn', icon: '📞', label: 'اتصالات الواردة', val: r?.callsIn ?? 0 },
  ]
})

// قراءة سريعة
const quickInsight = computed(() => {
  const r = lastReading.value
  if (!r) return ''
  const total = (r.wa ?? 0) + (r.aqar ?? 0) + (r.bayut ?? 0) + (r.haraj ?? 0) + (r.callsIn ?? 0)
  if (r.deposits > 0) return 'تحقّق الوحدة تفاعلًا جيدًا مع وجود عميل دافع للعربون؛ يُنصح بمتابعة إجراءات توقيع العقد.'
  if (r.visitsDone > 0) return `تمّت ${r.visitsDone} زيارة ميدانية – يُنصح بالمتابعة الفورية مع الزوار لتحويلهم إلى عربون.`
  if (total > 20) return 'الوحدة تحقق تفاعلاً إعلانياً جيداً – ركّز على تحويل الاستفسارات إلى زيارات مجدولة.'
  if (total > 5)  return 'تفاعل متوسط – يُنصح بتحديث الصور وترقية الإعلان في المنصات لرفع معدل الاستفسارات.'
  return 'تفاعل منخفض – يُنصح بمراجعة جودة الإعلان والسعر وإضافة جولة فيديو لزيادة الظهور.'
})

// التوصية العامة
const generalRecommendation = computed(() => {
  if (!detailReadings.value.length) return 'ابدأ بإدخال قراءة تسويقية أولى لتظهر التوصيات المناسبة لوضعها.'
  const r = lastReading.value
  if (!r) return ''
  if (r.deposits > 0) return 'الاستمرار في المتابعة الهاتفية مع العملاء المهتمين وتثبيت العربون.'
  return 'تكثيف جهود التسويق الرقمي مع تحديث محتوى الإعلانات في المنصات.'
})

// الخطوات العملية
const actionSteps = [
  'نشر الوحدة عن طريق الشباب في جميع قروبات والأنساب المسوقين وفي السوشيال ميديا (خاصة بيع)',
  'نشر الفيديو المولّد في جميع منصات التواصل الاجتماعي (حملة الزيارات – مشاهدات)',
  'استخدام خاصية الموقع الدقيق (إدراج الموقع) والتسجيل بيزيد من ظهور الإعلان بنسبة 30%',
  'ترقية الإعلان في جميع المنصات',
  'تفعيل خاصية عقار بلس للحصول على تكيوت لتكون مصادر الإرسال للمسوقين والتقارير الدقيقة',
  'عمل حملة إعلانية مدفوعة على تيكتوك وسناب ثبات',
  'التواصل مع جميع العملاء القدامى المهتمين بهذا النوع من الوحدات',
]

// ── open / close detail ──
function openDetail(l: Listing) {
  detailListing.value = l
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeDetail() {
  detailListing.value = null
}

function openTaskModal(_l: Listing) {
  showToast('انتقل إلى صفحة مهام العقارات الشاغرة لفتح المهمة')
}

// ── إضافة قراءة ──
const showReadingModal = ref(false)
const editingReadingId = ref<string | null>(null)
const emptyReading = (): Omit<Reading, 'id'> => ({
  date: todayISO(), views: 0, wa: 0, aqar: 0, bayut: 0, haraj: 0,
  callsIn: 0, callsOut: 0, followup: 0, visitsPlanned: 0, visitsDone: 0, deposits: 0, executed: 0, note: '',
})
const readingForm = ref(emptyReading())

function openReadingModal() {
  editingReadingId.value = null
  readingForm.value = emptyReading()
  showReadingModal.value = true
}

function openEditReading(r: Reading) {
  editingReadingId.value = r.id
  readingForm.value = { date: r.date, views: r.views, wa: r.wa, aqar: r.aqar, bayut: r.bayut, haraj: r.haraj,
    callsIn: r.callsIn, callsOut: r.callsOut, followup: r.followup, visitsPlanned: r.visitsPlanned,
    visitsDone: r.visitsDone, deposits: r.deposits, executed: r.executed, note: r.note }
  showReadingModal.value = true
}

function saveReading() {
  if (!detailListing.value) return
  const target = extState.value.listings.find(l => l.id === detailListing.value!.id)
  if (!target) return

  if (!(target as any).readings) (target as any).readings = []

  if (editingReadingId.value) {
    // تعديل قراءة موجودة
    const readings: Reading[] = (target as any).readings
    const idx = readings.findIndex(r => r.id === editingReadingId.value)
    if (idx !== -1) readings[idx] = { id: editingReadingId.value, ...readingForm.value }
  } else {
    // إضافة قراءة جديدة
    const newReading: Reading = { id: uid(), ...readingForm.value }
    ;(target as any).readings.push(newReading)
  }

  // تحديث آخر قراءة على الـ listing
  const readings: Reading[] = (target as any).readings
  const last = [...readings].sort((a, b) => b.date.localeCompare(a.date))[0]
  if (last) {
    target.views = last.views
    target.inquiries = {
      total: (last.wa ?? 0) + (last.aqar ?? 0) + (last.bayut ?? 0) + (last.haraj ?? 0) + (last.callsIn ?? 0),
      related: (last.aqar ?? 0) + (last.bayut ?? 0) + (last.haraj ?? 0),
      calls: last.callsIn ?? 0,
    }
    target.visitsComplete = last.visitsDone
    target.lastRead = last.date
  }

  save()
  showReadingModal.value = false
  editingReadingId.value = null
  showToast(editingReadingId.value ? 'تم تحديث القراءة' : 'تم حفظ القراءة التسويقية')
}

function deleteReading(rid: string) {
  if (!detailListing.value) return
  const target = extState.value.listings.find(l => l.id === detailListing.value!.id)
  if (!target) return
  const readings: Reading[] = (target as any).readings ?? []
  ;(target as any).readings = readings.filter(r => r.id !== rid)
  save()
  showToast('تم حذف القراءة')
}

// ── marketing requests in detail ──
const showAddMrInline = ref(false)
const newMR = reactive({ type: 'photo', note: '' })

function addMR() {
  if (!detailListing.value) return
  const mr: MarketingRequest = {
    id: mrNextId(),
    listingId: detailListing.value.id,
    type: newMR.type as any,
    typeLabel: MR_TYPES[newMR.type] ?? newMR.type,
    note: newMR.note.trim() || undefined,
    status: 'pending',
    requestedBy: myActorKey.value,
    requestedAt: new Date().toISOString(),
  }
  const target = extState.value.listings.find(l => l.id === detailListing.value!.id)
  if (target) {
    if (!target.marketingRequests) target.marketingRequests = []
    target.marketingRequests.push(mr)
    save()
    showToast('تم إرسال طلب التسويق')
    newMR.note = ''
    showAddMrInline.value = false
  }
}

// ── print / export ──
const posterRef = ref<HTMLElement | null>(null)

function printDetail() {
  if (!posterRef.value) return
  const el = posterRef.value
  const original = document.body.innerHTML
  const printContent = el.outerHTML
  const printWindow = window.open('', '_blank', 'width=1100,height=800')
  if (!printWindow) { showToast('السماح بالنوافذ المنبثقة لاستخدام الطباعة'); return }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير السوقة</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #2B2520; font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; }
        ${Array.from(document.styleSheets).flatMap(s => { try { return Array.from(s.cssRules).map(r => r.cssText) } catch { return [] } }).join('\n')}
      </style>
    </head>
    <body>${printContent}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => { printWindow.print(); printWindow.close() }, 800)
}

async function exportPng() {
  if (!posterRef.value) return
  showToast('جارٍ تصدير الصورة...')
  try {
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(posterRef.value, {
      backgroundColor: '#2B2520',
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const link = document.createElement('a')
    link.download = `تقرير_${detailListing.value?.code || 'الوحدة'}_${new Date().toISOString().slice(0,10)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast('تم تنزيل الصورة')
  } catch (e) {
    showToast('تعذّر تصدير الصورة')
  }
}

function exportExcel() {
  showToast('ميزة تصدير Excel قريباً')
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

/* ── Card ── */
.card { background:var(--surface,#fff); border:1px solid var(--line,#E6DFD3); border-radius:14px; padding:20px; }
.stat-card { border-right:4px solid var(--orange,#E1712F); }
.stat-card .lbl  { color:var(--muted,#8A8479); font-size:12px; font-weight:700; margin-bottom:4px; }
.stat-card .val  { font-size:26px; font-weight:900; color:var(--charcoal,#3A3733); line-height:1; }
.stat-card .sub  { font-size:11.5px; color:var(--muted,#8A8479); margin-top:4px; }
.card h3 { margin:0 0 14px; font-size:15px; font-weight:800; color:var(--charcoal,#3A3733); }
.section-title { font-size:15px; font-weight:800; color:var(--charcoal,#3A3733); margin:0 0 14px; }

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
  flex:1; min-width:200px; padding:10px 14px; border-radius:10px;
  border:1.5px solid var(--line,#E6DFD3); background:var(--surface,#fff);
  font-size:14px; outline:none; font-family:inherit;
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

/* ── Unit profile grid ── */
.unit-profile-grid {
  display:grid; grid-template-columns:repeat(4,1fr); gap:10px 20px;
}
@media(max-width:900px){ .unit-profile-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:500px){ .unit-profile-grid{ grid-template-columns:1fr; } }

.kv-item { display:flex; flex-direction:column; gap:3px; padding:8px 0; border-bottom:1px solid var(--line,#E6DFD3); }
.kv-k { font-size:11.5px; color:var(--muted,#8A8479); font-weight:700; }
.kv-v { font-size:13px; color:var(--charcoal,#3A3733); font-weight:600; }

/* ── Platforms ── */
.platforms-grid { display:flex; flex-wrap:wrap; gap:10px; }
.platform-chip {
  display:flex; align-items:center; gap:8px; padding:10px 14px;
  background:var(--bg,#F3EFE8); border-radius:10px; text-decoration:none;
  color:var(--charcoal,#3A3733); border:1px solid var(--line,#E6DFD3); transition:.15s;
}
.platform-chip:hover { border-color:var(--orange,#E1712F); background:#fff; }
.plat-icon { font-size:16px; }
.plat-name { font-weight:800; font-size:13px; color:var(--orange,#E1712F); }

/* ── Report poster ── */
.report-poster {
  background:#2B2520; border-radius:16px; padding:28px; color:#fff;
  font-family:inherit;
}

.poster-head {
  display:flex; justify-content:space-between; align-items:flex-start;
  margin-bottom:20px; flex-wrap:wrap; gap:12px;
}
.poster-logo { display:flex; align-items:center; gap:10px; }
.poster-title-wrap { text-align:left; }
.poster-unit-name { font-size:20px; font-weight:900; color:#fff; }
.poster-sub { font-size:12px; color:#aaa; margin-top:2px; }
.poster-insight-btn {
  display:inline-block; margin-top:8px; padding:6px 14px;
  background:rgba(255,255,255,.1); border-radius:20px; font-size:12px; color:#E1712F;
  border:1px solid rgba(225,113,47,.4);
}

.poster-no-data {
  text-align:center; padding:10px 20px; background:rgba(255,255,255,.07);
  border-radius:10px; color:#aaa; font-size:13px; margin-bottom:16px;
}

.poster-section-title {
  font-size:14px; font-weight:800; color:#E1712F; margin-bottom:12px;
}

/* KPIs grid */
.kpis-grid {
  display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin-bottom:20px;
}
@media(max-width:900px){ .kpis-grid{ grid-template-columns:repeat(3,1fr); } }
@media(max-width:500px){ .kpis-grid{ grid-template-columns:repeat(2,1fr); } }

.kpi-card {
  background:rgba(255,255,255,.07); border-radius:12px; padding:12px 10px;
  text-align:center; border:1px solid rgba(255,255,255,.1);
}
.kpi-icon  { font-size:20px; margin-bottom:4px; }
.kpi-label { font-size:10px; color:#aaa; line-height:1.3; min-height:28px; }
.kpi-val   { font-size:22px; font-weight:900; color:#fff; margin-top:4px; }

/* two col */
.poster-two-col {
  display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px;
}
@media(max-width:700px){ .poster-two-col{ grid-template-columns:1fr; } }

.poster-box {
  background:rgba(255,255,255,.07); border-radius:12px; padding:16px;
  border:1px solid rgba(255,255,255,.1);
}
.poster-box-title { font-size:13px; font-weight:800; color:#E1712F; margin-bottom:12px; }

/* channels */
.channels-row { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.ch-item { text-align:center; min-width:50px; }
.ch-val   { font-size:20px; font-weight:900; color:#fff; }
.ch-icon  { font-size:16px; }
.ch-label { font-size:10px; color:#aaa; margin-top:2px; }

/* insight */
.insight-text { font-size:13px; color:#ccc; line-height:1.7; }

/* steps */
.steps-grid {
  display:grid; grid-template-columns:repeat(7,1fr); gap:8px; margin-bottom:20px;
}
@media(max-width:1000px){ .steps-grid{ grid-template-columns:repeat(3,1fr); } }
@media(max-width:500px){ .steps-grid{ grid-template-columns:1fr; } }

.step-card {
  background:rgba(255,255,255,.07); border-radius:12px; padding:12px 10px;
  text-align:center; border:1px solid rgba(255,255,255,.1); position:relative;
}
.step-num {
  position:absolute; top:-10px; right:50%; transform:translateX(50%);
  background:#E1712F; color:#fff; width:22px; height:22px; border-radius:50%;
  font-size:12px; font-weight:900; display:flex; align-items:center; justify-content:center;
}
.step-text { font-size:11px; color:#ccc; line-height:1.5; margin-top:8px; }

/* recommendation */
.poster-recommendation {
  background:rgba(225,113,47,.15); border:1px solid rgba(225,113,47,.4);
  border-radius:12px; padding:14px 18px; display:flex; align-items:flex-start; gap:10px; flex-wrap:wrap;
}
.rec-label {
  background:#E1712F; color:#fff; font-size:12px; font-weight:800;
  padding:3px 10px; border-radius:20px; white-space:nowrap; flex-shrink:0;
}
.rec-text { color:#fff; font-size:13px; line-height:1.6; }

/* footer */
.poster-footer {
  display:flex; justify-content:space-between; margin-top:16px;
  padding-top:12px; border-top:1px solid rgba(255,255,255,.1);
  font-size:11.5px; color:#888; flex-wrap:wrap; gap:6px;
}

/* ── Misc ── */
.ls-code { background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733); font-size:11px; font-weight:800; padding:2px 8px; border-radius:6px; white-space:nowrap; }
.unit-title { font-weight:700; font-size:13px; color:var(--charcoal,#3A3733); margin-top:3px; }
.fw7  { font-weight:700; }
.muted { color:var(--muted,#8A8479); }
.stat-num { font-weight:800; font-size:15px; color:var(--charcoal,#3A3733); }
.chips-wrap { display:flex; flex-wrap:wrap; gap:4px; }
.chip { background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733); font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px; }
.chip-link { color:var(--orange,#E1712F); text-decoration:none; }
.chip-link:hover { text-decoration:underline; }
.empty-state { text-align:center; padding:48px 20px; }
.empty-state .empty-icon { font-size:36px; margin-bottom:10px; }
.empty-state b    { display:block; font-size:14.5px; color:var(--charcoal,#3A3733); margin-bottom:4px; }
.empty-state span { font-size:12.5px; color:var(--muted,#8A8479); }
.empty-inline { color:var(--muted,#8A8479); font-size:13px; padding:16px 0; text-align:center; }

/* ── Badge ── */
.badge          { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:800; }
.badge-pending  { background:#FBEEDA; color:#B8791E; }
.badge-approved { background:#E4F1E7; color:#3F7D52; }
.badge-rejected { background:#F7E7E2; color:#B3452F; }
.badge-inprogress { background:#E8F0FE; color:#1A56DB; }
.badge-done       { background:#E4F1E7; color:#3F7D52; font-weight:900; }
.badge-neutral  { background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733); }

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
.btn-dark    { background:var(--charcoal,#3A3733); color:#fff; }
.btn-dark:hover:not(:disabled) { background:#1a1816; }
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
.modal-lg { max-width:860px; }
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

/* ── Fields ── */
.field { margin-bottom:14px; }
.field label { display:block; font-size:12.5px; color:var(--muted,#8A8479); margin-bottom:5px; font-weight:700; }
.field input, .field select {
  width:100%; padding:10px 12px; border-radius:9px; border:1.5px solid var(--line,#E6DFD3);
  background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733);
  font-family:inherit; font-size:13.5px; outline:none; box-sizing:border-box;
}
.field input:focus, .field select:focus { border-color:var(--orange,#E1712F); background:var(--surface,#fff); }
.field textarea {
  width:100%; padding:10px 12px; border-radius:9px; border:1.5px solid var(--line,#E6DFD3);
  background:var(--bg,#F3EFE8); color:var(--charcoal,#3A3733);
  font-family:inherit; font-size:13.5px; outline:none; box-sizing:border-box; resize:vertical;
}
.field textarea:focus { border-color:var(--orange,#E1712F); background:var(--surface,#fff); }

/* ── Add MR inline box ── */
.add-mr-box {
  background:var(--bg,#F3EFE8); border-radius:12px; padding:16px; margin-bottom:14px;
}
</style>
