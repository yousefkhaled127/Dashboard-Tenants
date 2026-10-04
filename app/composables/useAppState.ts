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
    { id: 'sup1', name: 'المشرف الأول',  password: 'Admin@123' },
    { id: 'sup2', name: 'المشرف الثاني', password: 'Admin@123' },
    { id: 'sup3', name: 'المشرف الثالث', password: 'Admin@123' },
  ],
  collectors: [
    { id: 'col1', name: 'المحصل الأول',  password: '1234', phone: '' },
    { id: 'col2', name: 'المحصل الثاني', password: '1234', phone: '' },
    { id: 'col3', name: 'المحصل الثالث', password: '1234', phone: '' },
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
    myTenants, ownerTenants,
    pendingNoticeRequests, pendingNoticeDeliveries, pendingMaintReqCount,
    ownerMaintenance, acceptedMaintenance,
    orgRatingAvg, starsDisplay,
    addSms, paymentTypeLabel, maintReportNum,
  }
}
