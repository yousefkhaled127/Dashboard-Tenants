<template>
  <!-- TOOLBAR -->
  <div class="print-toolbar no-print">
    <button class="tb-btn tb-pdf" @click="printPdf">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="11" x2="12" y2="17"/>
        <polyline points="9 14 12 17 15 14"/>
      </svg>
      طباعة / حفظ PDF
    </button>
    <button class="tb-btn tb-img" :disabled="savingImg" @click="saveImage">
      <svg v-if="!savingImg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>{{ savingImg ? 'جارٍ الحفظ...' : 'حفظ كصورة PNG' }}</span>
    </button>
  </div>

  <!-- DOCUMENT -->
  <div class="doc-wrap">
    <div ref="pageRef" class="page" dir="rtl">

      <!-- watermark -->
      <div class="watermark" aria-hidden="true">
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 10 L100 36 L100 100 L20 100 L20 36 Z" stroke="#c8a98a" stroke-width="3" fill="none"/>
          <path d="M60 10 L20 36" stroke="#c8a98a" stroke-width="3"/>
          <path d="M60 10 L100 36" stroke="#c8a98a" stroke-width="3"/>
          <rect x="47" y="68" width="26" height="32" rx="2" stroke="#c8a98a" stroke-width="2.5" fill="none"/>
          <rect x="24" y="56" width="18" height="14" rx="1.5" stroke="#c8a98a" stroke-width="2" fill="none"/>
          <rect x="78" y="56" width="18" height="14" rx="1.5" stroke="#c8a98a" stroke-width="2" fill="none"/>
          <line x1="60" y1="68" x2="60" y2="100" stroke="#c8a98a" stroke-width="1.5"/>
          <circle cx="60" cy="8" r="5" fill="#c05050"/>
        </svg>
      </div>

      <!-- ══ HEADER ══ -->
      <div class="hdr">
        <!-- top-right triangles -->
        <div class="tri-corner tri-top-right">
          <div class="tri tr-pink-tr"></div>
          <!-- <div class="tri tr-gray-tr"></div> -->
        </div>

        <!-- logo center -->
        <div class="logo-center">
        <AppLogo :size="82" />

          <div class="logo-name-ar">مؤسسة سعود على السقامي للعقارات</div>
          <div class="logo-name-en">SAUD ALI ALSAQAMI REAL ESTATE EST.</div>
        </div>

        <!-- top-left triangles -->
        <div class="tri-corner tri-top-left">
          <div class="tri tr-gray-tl"></div>
          <!-- <div class="tri tr-pink-tl"></div> -->
        </div>
      </div>

      <!-- divider line -->
      <div class="hdr-line"></div>

      <!-- date -->
      <div class="date-row">{{ today }}</div>

      <!-- ══ TITLE ══ -->
      <div class="title-wrap">
        <h1 class="title-payment">إشعار سداد</h1>
      </div>

      <!-- ══ BODY ══ -->
      <div class="body">

        <div class="info-box">
          <p class="info-unit">({{ propertyUnit }})</p>
          <p class="info-tenant"><strong>المستأجر المحترم / {{ tenantName }}</strong></p>
        </div>

        <p class="greeting">السلام عليكم ورحمة الله وبركاته،</p>

        <p class="para">
          نفيدكم علمًا بأنه بالرجوع إلى السجلات المالية الخاصة بعقد الإيجار المبرم معكم، تبين عدم سدادكم للدفعة المستحقة
          والمبلغ الإجمالي قدره: <span class="amount">{{ amount }} ريال.</span>
        </p>

        <p class="para">
          وحيث إنه قد تم التنبيه والتذكير سابقًا دون الوصول لتسوية للمبلغ المتأخر، فإننا نأمل منكم سرعة السداد.
        </p>

        <p class="para">
          <strong><u>المطلوب:</u></strong> نرجو المبادرة بسداد المبلغ المستحق كاملًا خلال مهلة أقصاها 5 أيام من تاريخ هذا الإشعار، وذلك بمنصة إيجار.
        </p>

        <ul class="bullets">
          <li>في حال انقضاء المهلة المحددة دون السداد أو التواصل للتسوية، سنكون متأسفين لاتخاذ الإجراءات النظامية والقانونية.</li>
          <li>إحالة عقد الإيجار إلى محكمة التنفيذ / منصة إيجار للتنفيذ على السند التنفيذي وفق الأنظمة واللوائح.</li>
          <li>المطالبة بالإخلاء الفوري للعقار وتحميلكم كافة الرسوم والتكاليف القانونية والقضائية الناتجة عن التأخير.</li>
        </ul>

      </div>

      <!-- ══ FOOTER ══ -->
      <div class="ftr">
        <div class="ftr-sig">
          <div class="ftr-company">مؤسسة سعود علي السقامي للعقارات</div>
          <div class="ftr-dept">إدارة التحصيل والعقود</div>
          <div class="ftr-phone">هاتف / واتساب: 0503802216</div>
        </div>
        <div class="ftr-seal">
          <span>الختم:</span>
        </div>
      </div>

      <!-- ══ BOTTOM BAR ══ -->
      <div class="bottom-bar">
        <div class="tri-corner tri-bot-left">
          <div class="tri tr-pink-bl"></div>
          <!-- <div class="tri tr-gray-bl"></div> -->
        </div>
        <div class="bottom-info" dir="ltr">
          <span>Tel: 0112004744</span>
          <span>Email: alsaqami.realestate@gmail.com</span>
          <span>Commercial Register: 1010738209</span>
          <span>Address: الرياض / البنية / شارع آل مرشد / المملكة العربية السعودية</span>
        </div>
      </div>

    </div><!-- /page -->
  </div><!-- /doc-wrap -->
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route   = useRoute()
const pageRef = ref<HTMLElement | null>(null)

const tenantName    = computed(() => decodeURIComponent(String(route.query.tenant  ?? '')))
const propertyUnit  = computed(() => decodeURIComponent(String(route.query.unit    ?? '')))
const rawAmount     = computed(() => decodeURIComponent(String(route.query.amount  ?? '')))
const noticeContent = computed(() => decodeURIComponent(String(route.query.content ?? '')))

const amount = computed(() => {
  if (rawAmount.value && rawAmount.value !== '0') return rawAmount.value
  const m = noticeContent.value.match(/[\d,،]+(?:\.\d+)?/)
  return m ? m[0].replace(/,/g, '') : '—'
})

const today = computed(() => {
  const d = new Date()
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} م`
})

// إخفاء الـ sidebar
onMounted(() => {
  const s = document.querySelector('.sidebar')      as HTMLElement | null
  const t = document.querySelector('.mobile-topbar') as HTMLElement | null
  const sh = document.querySelector('.shell')       as HTMLElement | null
  const m = document.querySelector('.main')         as HTMLElement | null
  if (s)  s.style.display  = 'none'
  if (t)  t.style.display  = 'none'
  if (sh) sh.style.display = 'block'
  if (m)  { m.style.padding = '0'; m.style.width = '100%' }
  onUnmounted(() => {
    if (s)  s.style.display  = ''
    if (t)  t.style.display  = ''
    if (sh) sh.style.display = ''
    if (m)  { m.style.padding = ''; m.style.width = '' }
  })
})

function printPdf() { window.print() }

const savingImg = ref(false)
async function saveImage() {
  if (!pageRef.value) return
  savingImg.value = true
  try {
    const h2c = (await import('html2canvas')).default
    const canvas = await h2c(pageRef.value, { scale: 2, useCORS: true, backgroundColor: '#fff' })
    const a = document.createElement('a')
    a.download = `إشعار-سداد-${tenantName.value || 'مستأجر'}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  } finally { savingImg.value = false }
}
</script>

<style>
*  { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Tajawal', Arial, sans-serif;
  background: #d9d9d9;
  color: #1a1a1a;
  direction: rtl;
}

/* wrapper */
.doc-wrap {
  padding: 24px 0 40px;
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

/* A4 page */
.page {
  position: relative;
  width: 794px;
  min-height: 1123px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── WATERMARK ── */
.watermark {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 340px; height: 340px;
  opacity: 0.055;
  pointer-events: none;
  z-index: 0;
}
.watermark svg { width: 100%; height: 100%; }

/* keep content above watermark */
.hdr, .hdr-line, .date-row, .title-wrap,
.body, .ftr, .bottom-bar { position: relative; z-index: 1; }

/* ── HEADER ── */
.hdr {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0;
}

/* logo center */
.logo-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 22px 0 14px;
  gap: 5px;
}
.logo-svg { width: 82px; height: 82px; }
.logo-name-ar {
  font-size: 11.5px;
  font-weight: 700;
  color: #5a4535;
  letter-spacing: 0.2px;
}
.logo-name-en {
  font-size: 9px;
  font-weight: 700;
  color: #c05050;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

/* ── TRIANGLES ── */
.tri-corner { display: flex; flex-direction: column; }

/* top-right */
.tri-top-right { align-items: flex-end; }
.tr-pink-tr {
  width: 0; height: 0;
  border-left: 72px solid transparent;
  border-top: 72px solid #d97070;
}
.tr-gray-tr {
  width: 0; height: 0;
  border-left: 52px solid transparent;
  border-top: 52px solid #9a9a9a;
  margin-top: -14px;
}

/* top-left */
.tri-top-left { align-items: flex-start; }
.tr-gray-tl {
  width: 0; height: 0;
  border-right: 72px solid transparent;
  border-top: 72px solid #9a9a9a;
}
.tr-pink-tl {
  width: 0; height: 0;
  border-right: 52px solid transparent;
  border-top: 52px solid #d97070;
  margin-top: -14px;
}

/* bottom-left */
.tri-bot-left { position: absolute; bottom: 0; left: 0; align-items: flex-end; }
.tr-pink-bl {
  width: 0; height: 0;
  border-right: 80px solid transparent;
  border-bottom: 80px solid #d97070;
}
.tr-gray-bl {
  width: 0; height: 0;
  border-right: 58px solid transparent;
  border-bottom: 58px solid #9a9a9a;
  margin-left: -16px;
}

/* ── DIVIDER ── */
.hdr-line {
  height: 2px;
  background: linear-gradient(to left, #d97070, #c8a98a 50%, #9a9a9a);
  margin: 0 32px;
}

/* ── DATE ── */
.date-row {
  text-align: left;
  direction: ltr;
  padding: 10px 32px 0;
  font-size: 12.5px;
  font-weight: 700;
  color: #222;
}

/* ── TITLE ── */
.title-wrap {
  text-align: center;
  margin: 22px 0 18px;
}
.title-payment {
  font-size: 22px;
  font-weight: 900;
  color: #c05050;
}

/* ── BODY ── */
.body {
  flex: 1;
  padding: 0 44px;
}

.info-box {
  margin-bottom: 20px;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 3px;
  text-align: right;
}
.info-unit   { font-size: 14px; font-weight: 800; margin-bottom: 7px; }
.info-tenant { font-size: 14px; font-weight: 700; }

.greeting {
  font-size: 13px;
  line-height: 1.9;
  margin-bottom: 14px;
}
.para {
  font-size: 13px;
  line-height: 2;
  margin-bottom: 14px;
  text-align: justify;
}
.amount {
  color: #c05050;
  font-weight: 900;
  font-size: 14.5px;
}
.bullets {
  padding-right: 24px;
  margin-bottom: 20px;
}
.bullets li {
  font-size: 12.5px;
  line-height: 2;
  margin-bottom: 4px;
}

/* ── FOOTER ── */
.ftr {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 24px 68px 12px;
  margin-top: auto;
}
.ftr-company { font-size: 13px; font-weight: 900; margin-bottom: 3px; }
.ftr-dept    { font-size: 12px; color: #333; margin-bottom: 3px; }
.ftr-phone   { font-size: 12px; color: #333; }
.ftr-seal    { font-size: 12px; color: #555; }

/* ── BOTTOM BAR ── */
.bottom-bar {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 72px;
  margin-top: 10px;
}
.bottom-info {
  flex: 1;
  font-size: 9px;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 2px;
    padding: 8px 72px 10px;
  direction: ltr;
  text-align: left;
}

/* ── TOOLBAR ── */
.print-toolbar {
  position: sticky;
  top: 0;
  z-index: 999;
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 13px 20px;
  background: #3a3733;
}
.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-family: 'Tajawal', sans-serif;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: .15s;
}
.tb-btn:disabled { opacity: .6; cursor: default; }
.tb-pdf  { background: #c05050; color: #fff; }
.tb-pdf:hover:not(:disabled)  { background: #a03838; }
.tb-img  { background: #fff; color: #3a3733; border: 2px solid #c8a98a; }
.tb-img:hover:not(:disabled)  { background: #f5ede3; }

/* ── PRINT ── */
@media print {
  .no-print { display: none !important; }
  body { background: #fff; }
  .doc-wrap { padding: 0; }
  .page { width: 100%; min-height: auto; box-shadow: none; }
  @page { size: A4; margin: 0; }
}
</style>
