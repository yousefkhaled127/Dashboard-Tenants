// ============================================================
// useAppState — البيانات المركزية محفوظة في localStorage
// لتغيير إلى API حقيقي: عدّل loadState / saveState فقط
// ============================================================

const STORAGE_KEY = 'tahsilat-v2'

// ==================== TYPES ====================
export interface Supervisor { id: string; name: string; password: string }
export interface Collector  { id: string; name: string; password: string; phone: string }
export interface Owner      { id: string; name: string; password: string; phone: string }

export interface TenantNote    { id: string; text: string; by: string; at: string }
export interface TenantPromise { id: string; date: string; note: string }
export interface TenantDue     { id: string; period: string; dueDate: string; amount: number }

export interface Tenant {
  id: string; name: string; tenantNumber: string; phone: string
  unit: string; ownerId: string | null; dueDate: string
  collectorId: string; monthlyTarget: number
  idNumber: string; birthDate: string
  notes: TenantNote[]; dues: Record<string, TenantDue[]>; promises: TenantPromise[]
}

export interface PaymentComment { id: string; text: string; by: string; at: string }
export interface Payment {
  id: string; tenantId: string | null; collectorId: string | null
  ownerId: string | null; unit: string; type: string
  receiptNumber: string | null; image: string | null; imageName: string | null
  amount: number; month: string; submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string; reviewedAt?: string
  rejectReason?: string; editedAt?: string
  comments: PaymentComment[]
}

export interface Notice {
  id: string; tenantId: string; collectorId: string
  requestNote: string; requestedAt: string
  status: 'requested' | 'issued' | 'delivered_pending' | 'approved' | 'rejected'
  noticeText?: string; issuedAt?: string
  deliveryImage?: string; deliveryNote?: string; deliveredAt?: string
  rejectReason?: string; reviewedAt?: string
}

export interface Property { id: string; ownerId: string; unit: string; createdAt: string }

export interface MediaFile { type: string; data: string; name: string }
export interface MaintenanceRating { stars: number; comment: string; ratedAt: string }
export interface Maintenance {
  id: string; ownerId: string; unit: string; title: string
  description: string; media: MediaFile[]; sentBy: string; sentAt: string
  rating: MaintenanceRating | null
  ownerStatus: 'pending' | 'accepted' | 'rejected'
  ownerDecisionAt: string | null; ownerDecisionNote: string
}

export interface MaintenanceRequest {
  id: string; tenantId: string | null; requesterName: string
  idNumber: string; birthDate: string; phone: string
  ownerId: string | null; unit: string; title: string; description: string
  media: MediaFile[]; status: 'pending' | 'approved' | 'rejected'
  supervisorNote: string; requestedAt: string
  decidedAt: string | null; decidedBy: string | null
  ownerStatus: '—' | 'pending' | 'accepted' | 'rejected'
  ownerDecisionAt: string | null; ownerDecisionNote: string
}

export interface OrgRating { id: string; ownerId: string; stars: number; comment: string; ratedAt: string }
export interface SmsLog    { id: string; toRole: string; toId: string; toName: string; toPhone: string; body: string; kind: string; createdAt: string; read: boolean }

export interface AppState {
  supervisors: Supervisor[]
  collectors:  Collector[]
  owners:      Owner[]
  tenants:     Tenant[]
  payments:    Payment[]
  notices:     Notice[]
  properties:  Property[]
  maintenance: Maintenance[]
  maintenanceRequests: MaintenanceRequest[]
  orgRatings:  OrgRating[]
  smsLog:      SmsLog[]
}

// ==================== DEFAULT DATA ====================
const DEFAULT: AppState = {
  supervisors: [
    { id: 'sup1', name: 'ابو حيدر',  password: 'Admin@123' },
    { id: 'sup2', name: 'صديق', password: 'Admin@123' },
    { id: 'sup3', name: 'المشرف الثالث', password: 'Admin@123' },
  ],
  collectors: [
    { id: 'col1', name: 'عبد الرحمن',  password: '1234', phone: '' },
    { id: 'col2', name: 'ابو عبد الله', password: '1234', phone: '' },
    { id: 'col3', name: 'ياسر', password: '1234', phone: '' },
  ],
  owners: [
    { id: 'own1', name: 'المالك الأول',  password: '1234', phone: '' },
    { id: 'own2', name: 'المالك الثاني', password: '1234', phone: '' },
  ],
  tenants: [], payments: [], notices: [], properties: [],
  maintenance: [], maintenanceRequests: [], orgRatings: [], smsLog: [],
}

// ==================== SINGLETON STATE ====================
const state = ref<AppState>(JSON.parse(JSON.stringify(DEFAULT)))
const _loaded = ref(false)

// ==================== COMPOSABLE ====================
export function useAppState() {

  // ---------- load / save ----------
  function load() {
    if (!import.meta.client) return
    if (_loaded.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AppState
        // ensure all arrays exist
        const keys = Object.keys(DEFAULT) as (keyof AppState)[]
        keys.forEach(k => { if (!parsed[k]) (parsed as any)[k] = [] })
        state.value = parsed
      } else {
        state.value = JSON.parse(JSON.stringify(DEFAULT))
        save()
      }
    } catch { state.value = JSON.parse(JSON.stringify(DEFAULT)) }
    _loaded.value = true
  }

  function save() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  }

  // ---------- helpers ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

  const monthKey = (d = new Date()) =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')

  const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                     'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

  const monthLabel = (mk: string) => {
    const [y, m] = mk.split('-').map(Number)
    return MONTHS_AR[m - 1] + ' ' + y
  }

  const fmtDate = (iso: string) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('ar-SA-u-nu-latn',
      { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const fmtMoney = (n: number | string) =>
    (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ر.س'

  const todayISO = () => new Date().toISOString().slice(0, 10)

  const lastNMonths = (n: number) => {
    const arr: string[] = []
    const d = new Date()
    for (let i = n - 1; i >= 0; i--) {
      const dd = new Date(d.getFullYear(), d.getMonth() - i, 1)
      arr.push(monthKey(dd))
    }
    return arr
  }

  // ---------- lookups ----------
  const collectorName  = (id: string) => state.value.collectors.find(c => c.id === id)?.name  ?? '—'
  const ownerName      = (id: string) => state.value.owners.find(o => o.id === id)?.name       ?? '—'
  const tenantName     = (id: string) => state.value.tenants.find(t => t.id === id)?.name      ?? '—'
  const supervisorName = (id: string) => state.value.supervisors.find(s => s.id === id)?.name  ?? '—'
  const getTenant      = (id: string) => state.value.tenants.find(t => t.id === id) ?? null

  // ---------- payment helpers ----------
  const approvedPayments = computed(() => state.value.payments.filter(p => p.status === 'approved'))
  const pendingPayments  = computed(() => state.value.payments.filter(p => p.status === 'pending'))

  const collectedForMonth = (collectorId: string, mk: string) =>
    approvedPayments.value
      .filter(p => p.collectorId === collectorId && p.month === mk)
      .reduce((s, p) => s + Number(p.amount), 0)

  const collectedForTenantMonth = (tenantId: string, mk: string) =>
    approvedPayments.value
      .filter(p => p.tenantId === tenantId && p.month === mk)
      .reduce((s, p) => s + Number(p.amount), 0)

  const targetForCollector = (collectorId: string) =>
    state.value.tenants
      .filter(t => t.collectorId === collectorId)
      .reduce((s, t) => s + Number(t.monthlyTarget || 0), 0)

  const myTenants    = (collectorId: string) => state.value.tenants.filter(t => t.collectorId === collectorId)
  const ownerTenants = (ownerId: string)     => state.value.tenants.filter(t => t.ownerId === ownerId)

  // ---------- collector alerts (overdue / soon promises) ----------
  const collectorAlerts = (collectorId: string) => {
    const alerts: { promise: TenantPromise; tenant: Tenant; status: 'due' | 'soon' }[] = []
    const now = new Date(); now.setHours(0, 0, 0, 0)
    for (const t of state.value.tenants.filter(t => t.collectorId === collectorId)) {
      for (const p of t.promises) {
        const diff = Math.round((new Date(p.date).getTime() - now.getTime()) / 86400000)
        if (diff < 0)       alerts.push({ promise: p, tenant: t, status: 'due' })
        else if (diff <= 2) alerts.push({ promise: p, tenant: t, status: 'soon' })
      }
    }
    return alerts.sort((a, b) => new Date(a.promise.date).getTime() - new Date(b.promise.date).getTime())
  }

  // ---------- notice helpers ----------
  const pendingNoticeRequests   = computed(() => state.value.notices.filter(n => n.status === 'requested'))
  const pendingNoticeDeliveries = computed(() => state.value.notices.filter(n => n.status === 'delivered_pending'))

  // ---------- maintenance ----------
  const pendingMaintReqCount = computed(() =>
    state.value.maintenanceRequests.filter(r => r.status === 'pending').length)

  const ownerMaintenance = (ownerId: string) =>
    state.value.maintenance.filter(m => m.ownerId === ownerId)
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt))

  const acceptedMaintenance = (ownerId: string | null) =>
    state.value.maintenance
      .filter(m => m.ownerStatus === 'accepted' && (!ownerId || m.ownerId === ownerId))
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt))

  // ---------- org rating ----------
  const orgRatingAvg = computed(() => {
    const list = state.value.orgRatings
    if (!list.length) return 0
    return list.reduce((s, r) => s + r.stars, 0) / list.length
  })

  const starsDisplay = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

  // ---------- SMS ----------
  const addSms = (toRole: string, toId: string, toName: string, toPhone: string, body: string, kind: string) => {
    state.value.smsLog.push({
      id: uid(), toRole, toId, toName: toName || '—',
      toPhone: toPhone || '—', body, kind,
      createdAt: new Date().toISOString(), read: false,
    })
  }

  const paymentTypeLabel = (t: string) =>
    ({ cash: 'كاش بالمكتب', platform: 'سداد بالمنصة', transfer: 'تحويل بنكي' } as any)[t] ?? t

  const maintReportNum = (sentAt: string) =>
    'MR-' + sentAt.replace(/[^0-9]/g, '').slice(0, 12)

  return {
    state, load, save, uid,
    monthKey, monthLabel, fmtDate, fmtMoney, todayISO, lastNMonths,
    collectorName, ownerName, tenantName, supervisorName, getTenant,
    approvedPayments, pendingPayments,
    collectedForMonth, collectedForTenantMonth, targetForCollector,
    myTenants, ownerTenants, collectorAlerts,
    pendingNoticeRequests, pendingNoticeDeliveries, pendingMaintReqCount,
    ownerMaintenance, acceptedMaintenance,
    orgRatingAvg, starsDisplay,
    addSms, paymentTypeLabel, maintReportNum,
  }
}

// ============================================================
// ==================== EXTENDED TYPES (v3) ====================
// ============================================================

// ---------- Vacancies ----------
export interface VacancyHistory { status: string; collectorId: string | null; note: string; at: string; by: string }
export interface VacancyHandover { mode: 'rent' | 'sale'; name: string; phone: string; idNumber: string; price: number; managed: boolean; propertyId?: string; tenantId?: string; contractId?: string; unit?: string; start?: string; end?: string; cycle?: number; total?: number }
export interface Vacancy {
  id: string; propertyId: string | null; propertyName: string; unit: string
  price: number; priceCycle: string; rooms: number; location: string; notes: string
  status: 'vacant' | 'deposit' | 'rented'
  depositBy: string | null; depositAmount: number; depositDate: string
  rentedBy: string | null; rentedDate: string; rentPrice: number
  tenantName: string; tenantPhone: string
  history: VacancyHistory[]; handover: VacancyHandover | null
  createdAt: string; createdBy: string; updatedAt: string
}

// ---------- Contracts ----------
export interface Contract {
  id: string; propertyId: string; unit: string; tenantId: string | null
  startDate: string; endDate: string; totalAmount: number
  cycle: number; installment: number; notes: string
  status: 'active' | 'renewed' | 'ended'
  renewedFromId?: string | null; renewedToId?: string | null; renewedAt?: string
  createdAt: string; createdBy: string; editedAt?: string
}

// ---------- Property (extended) ----------
export interface PropertyFull { id: string; ownerId: string; name: string; location: string; createdAt: string }

// ---------- Listings ----------
export interface ListingHistory { id: string; at: string; by: string; type: string; [key: string]: any }
export interface ListingPlatformEntry { url: string; adNo: string; at: string; by: string }
export interface ListingLicense { number?: string; issue?: string; expiry?: string; file?: { name: string; type: string; data: string } | null }
export interface ListingGuard { name?: string; phone?: string; unitCode?: string }
export interface ListingLocation { lat: number; lng: number; address: string; accuracy?: number | null }
export interface ListingExtSource { name?: string; phone?: string; note?: string }
export interface Listing {
  id: string; code: string; extCode?: string; kind: 'office' | 'external'
  source: string; title: string; unitType: string
  status: string; vacant: boolean
  responsible: string; createdBy: string; createdAt: string; updatedAt: string; updatedBy: string
  propertyId: string | null; unitNo: string
  ownerMode: 'linked' | 'manual'; ownerId: string | null; ownerName: string; ownerPhone: string
  brokerageNo: string; brokerageDate: string; description: string
  answers: Record<string, any>; dealType: string
  rentPrice: string; rentCycle: string; salePrice: string
  photos: { type: string; name: string; data: string }[]
  videos: { type: string; name: string; data: string }[]
  videoUrl: string; license: ListingLicense; guard: ListingGuard
  location: ListingLocation | null; platforms: Record<string, ListingPlatformEntry>
  history: ListingHistory[]; vacancyId?: string
  // outside-office review
  review?: 'pending' | 'needs_info' | 'accepted' | 'rejected'
  extSource?: ListingExtSource; extNote?: string; extRejectReason?: string
  extDecidedAt?: string; extDecidedBy?: string
  // close data
  closedAt?: string; closedBy?: string; closeReason?: string; closeNote?: string
  closeParty?: any
}

// ---------- Featured ----------
export interface FeaturedTask {
  id: string; type: string; title: string; assignee: string; due: string; note: string
  status: 'open' | 'progress' | 'done' | 'cancelled'
  createdBy: string; createdAt: string; updatedAt?: string; updatedBy?: string
  doneAt?: string | null; doneBy?: string | null
}
export interface Featured {
  id: string; listingId: string; stage: string
  addedBy: string; addedAt: string; updatedAt: string; updatedBy: string
  tasks: FeaturedTask[]; history: ListingHistory[]
}

// ---------- SMS Settings ----------
export interface SmsSettings { enabled: boolean; webhookUrl: string }

// ---------- Listing platform config ----------
export interface ListingPlatform { id: string; name: string; domain: string; custom?: boolean; createdBy?: string; createdAt?: string }

export interface ExtendedAppState {
  vacancies: Vacancy[]
  contracts: Contract[]
  properties: PropertyFull[]
  listings: Listing[]
  featured: Featured[]
  listingPlatforms: ListingPlatform[]
  listingSeq: number
  extSeq: number
  smsSettings: SmsSettings
}

// ==================== DEFAULT LISTING PLATFORMS ====================
export const LS_DEFAULT_PLATFORMS: ListingPlatform[] = [
  { id: 'website', name: 'الموقع الإلكتروني', domain: '' },
  { id: 'aqar',    name: 'عقار',   domain: 'aqar.fm' },
  { id: 'haraj',   name: 'حراج',   domain: 'haraj.com.sa' },
  { id: 'bayut',   name: 'بيوت',   domain: 'bayut.sa, bayut.com' },
  { id: 'wasalt',  name: 'وصلت',   domain: 'wasalt.sa, wasalt.com' },
  { id: 'deal',    name: 'ديل',    domain: '' },
  { id: 'mktml',   name: 'مكتمل',  domain: '' },
]

// ==================== EXTENDED STATE COMPOSABLE ====================
const extState = ref<ExtendedAppState>({
  vacancies: [], contracts: [], properties: [],
  listings: [], featured: [], listingPlatforms: JSON.parse(JSON.stringify(LS_DEFAULT_PLATFORMS)),
  listingSeq: 0, extSeq: 0,
  smsSettings: { enabled: false, webhookUrl: '' },
})

const EXT_STORAGE_KEY = 'tahsilat-ext-v1'

export function useExtState() {
  function load() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(EXT_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ExtendedAppState>
        if (parsed.vacancies)         extState.value.vacancies         = parsed.vacancies
        if (parsed.contracts)         extState.value.contracts         = parsed.contracts
        if (parsed.properties)        extState.value.properties        = parsed.properties
        if (parsed.listings)          extState.value.listings          = parsed.listings
        if (parsed.featured)          extState.value.featured          = parsed.featured
        if (parsed.listingPlatforms && parsed.listingPlatforms.length)
                                      extState.value.listingPlatforms  = parsed.listingPlatforms
        if (parsed.listingSeq != null) extState.value.listingSeq       = parsed.listingSeq
        if (parsed.extSeq != null)     extState.value.extSeq           = parsed.extSeq
        if (parsed.smsSettings)       extState.value.smsSettings       = parsed.smsSettings
      }
    } catch { /* silent */ }
  }

  function save() {
    if (!import.meta.client) return
    localStorage.setItem(EXT_STORAGE_KEY, JSON.stringify(extState.value))
  }

  // uid
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

  // ---------- Vacancy helpers ----------
  const vacanciesSorted = computed(() =>
    [...extState.value.vacancies].sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
  )
  const vacantCount = computed(() => extState.value.vacancies.filter(v => v.status === 'vacant').length)
  const vacPropName = (v: Vacancy) => {
    if (v.propertyId) {
      const p = extState.value.properties.find(x => x.id === v.propertyId)
      if (p) return p.name
    }
    return v.propertyName || '—'
  }

  // ---------- Listing helpers ----------
  const getListing  = (id: string) => extState.value.listings.find(l => l.id === id) ?? null
  const lsOffice    = computed(() => extState.value.listings.filter(l => l.kind !== 'external'))
  const exAll       = computed(() => extState.value.listings.filter(l => l.kind === 'external'))
  const ftLive      = computed(() => extState.value.featured.filter(f => getListing(f.listingId)))
  const ftByListing = (lid: string) => extState.value.featured.find(f => f.listingId === lid) ?? null

  const lsMyOpenCount = (actorKey: string) =>
    lsOffice.value.filter(l => l.vacant && l.responsible === actorKey && l.status !== 'published').length

  const exPendingCount = computed(() =>
    exAll.value.filter(l => l.review === 'pending' || l.review === 'needs_info').length
  )

  const ftMyOpenCount = (actorKey: string) => {
    let count = 0
    ftLive.value.forEach(f => {
      f.tasks.forEach(t => { if (t.assignee === actorKey && (t.status === 'open' || t.status === 'progress')) count++ })
    })
    return count
  }

  const lsNextCode = () => {
    extState.value.listingSeq = (Number(extState.value.listingSeq) || 0) + 1
    return 'VU-' + String(extState.value.listingSeq).padStart(4, '0')
  }
  const exNextCode = () => {
    extState.value.extSeq = (Number(extState.value.extSeq) || 0) + 1
    return 'EX-' + String(extState.value.extSeq).padStart(4, '0')
  }

  const lsOwnerName = (l: Listing) => {
    if (l.ownerId) {
      const o = (useState<any>('tahsilat-owners')?.value || []).find((x: any) => x.id === l.ownerId)
      return o?.name || l.ownerName || ''
    }
    return l.ownerName || ''
  }

  // ---------- Contract helpers ----------
  const getProperty      = (id: string) => extState.value.properties.find(p => p.id === id) ?? null
  const propertyContracts= (pid: string) => extState.value.contracts.filter(c => c.propertyId === pid)
  const currentContracts = (pid: string) =>
    propertyContracts(pid).filter(c => c.status !== 'renewed' && c.status !== 'ended')
      .sort((a, b) => String(a.unit).localeCompare(String(b.unit), 'ar', { numeric: true }))
  const contractState = (c: Contract) => {
    if (c.status === 'renewed') return 'renewed'
    if (c.status === 'ended')   return 'ended'
    const today = new Date().toISOString().slice(0, 10)
    if (c.endDate < today) return 'expired'
    const diff = Math.round((new Date(c.endDate).getTime() - new Date(today).getTime()) / 86400000)
    if (diff <= 30) return 'expiring'
    return 'active'
  }
  const contractsNeedingRenewal = computed(() =>
    extState.value.contracts
      .filter(c => { const s = contractState(c); return s === 'expiring' || s === 'expired' })
      .sort((a, b) => (a.endDate || '').localeCompare(b.endDate || ''))
  )
  const expiringContractsCount = computed(() => contractsNeedingRenewal.value.length)

  return {
    extState, load, save, uid,
    vacanciesSorted, vacantCount, vacPropName,
    getListing, lsOffice, exAll, ftLive, ftByListing,
    lsMyOpenCount, exPendingCount, ftMyOpenCount, lsNextCode, exNextCode, lsOwnerName,
    getProperty, propertyContracts, currentContracts, contractState,
    contractsNeedingRenewal, expiringContractsCount,
  }
}
