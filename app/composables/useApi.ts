// ============================================================
// useApi — API client موحّد لكل الـ endpoints
// يعتمد على token في cookie + base URL من runtimeConfig
// ============================================================

// ==================== TYPES ====================
export interface Role { value: string; label: string }
export interface UserByType { id: number; name: string; username: string }

export interface AuthUser {
  id: number
  name: string
  username: string
  type: string
  type_label: string
}

export interface LoginResponse {
  token: string
  token_type: string
  user: AuthUser
}

export interface CollectorRef { id: number; name: string }
export interface OwnerRef { id: number; name: string }

export interface TenantListItem {
  id: number
  user_id?: number
  tenant_number: string
  name: string
  phone: string
  property_unit: string
  due_date: string
  due_date_formatted: string
  monthly_target: number
  paid_amount: number
  remaining_amount: number
  collector: CollectorRef
  owner: OwnerRef
  status: string
  status_label: string
}

export interface TenantInfo {
  id: number
  user_id?: number
  name: string
  tenant_number: string
  phone: string
  property_unit: string
  due_date: string
  due_date_formatted: string
  monthly_target: number
  collector: CollectorRef
  owner: OwnerRef
  national_id?: string
  birth_date?: string
  notes?: string
  status?: string
}

export interface MonthTarget {
  period: string
  target_amount: number
  collected_amount: number
  remaining_amount: number
  percentage: number
  due_date?: string
  due_date_formatted?: string
}

export interface PaymentLedgerItem {
  id: number
  payment_date: string
  payment_date_formatted: string
  payment_method: string
  receipt_number: string | null
  amount: number
  period: string
  status: string
  status_label: string
  notes?: string
}

export interface PromiseItem {
  id: number
  promise_date: string
  promise_date_formatted: string
  note: string
  status: string
  created_by?: CollectorRef
  created_at?: string
}

export interface NoteItem {
  id: number
  content: string
  author_name: string
  author_role: string
  created_at: string
  created_at_time: string
}

export interface TenantDetail {
  tenant_info: TenantInfo
  current_month_target: MonthTarget
  payments_ledger: PaymentLedgerItem[]
  promises: PromiseItem[]
  notes_list: NoteItem[]
}

export interface PaymentApprovalItem {
  id: number
  tenant: {
    id: number
    tenant_number: string
    property_unit: string
    name: string
    phone: string
  }
  payment_date: string
  payment_date_formatted: string
  payment_method: string
  receipt_number: string | null
  amount: number
  period: string
  status: string
  status_label: string
  collector?: CollectorRef
  rejection_reason?: string
  notes?: string
}

export interface PaymentApprovalTabs {
  active_tab: string
  pending_count: number
  all_count: number
  approved_count: number
  rejected_count: number
}

export interface OwnerPaymentItem {
  id: number
  owner: OwnerRef
  tenant: {
    id: number
    tenant_number: string
    property_unit: string
    name: string
    phone: string
  }
  collector?: CollectorRef
  payment_method: string
  receipt_number: string | null
  amount: number
  period: string
  payment_date: string
  payment_date_formatted: string
  status: string
  status_label: string
  notes?: string
}

export interface CollectorPaymentItem {
  id: number
  tenant: {
    id: number
    tenant_number: string
    property_unit: string
    name: string
    phone: string
  }
  payment_date: string
  payment_date_formatted: string
  payment_method: string
  receipt_number: string | null
  attachment_path: string | null
  attachment_url: string | null
  amount: number
  period: string
  status: string
  status_label: string
  notes?: string
}

export interface ImportResult {
  total: number
  imported: number
  updated: number
  failed: number
  errors: string[]
}

interface Pagination {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

// ==================== COMPOSABLE ====================
export function useApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const token = useCookie<string>('tahsilat-token', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })

  /** Low-level request wrapper — unwraps `{ success, message, data }` */
  async function req<T = any>(url: string, opts: Record<string, any> = {}): Promise<T> {
    const res = await $fetch<{ success: boolean; message: string; data: T }>(base + url, {
      ...opts,
      headers: {
        Accept: 'application/json',
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        ...opts.headers,
      },
    })
    return res.data
  }

  // ---------- AUTH ----------
  const auth = {
    roles: () => req<Role[]>('/auth/roles'),
    usersByType: (type: string) => req<UserByType[]>(`/auth/users-by-type?type=${type}`),
    login: (body: { login: string; password: string; type: string }) =>
      req<LoginResponse>('/auth/login', { method: 'POST', body }),
    me: () => req<AuthUser>('/auth/me'),
    logout: () => req('/auth/logout', { method: 'POST' }),
  }

  // ---------- SUPERVISOR ----------
  const supervisor = {
    tenants: (params: { search?: string; collector_id?: number; period?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.collector_id) q.set('collector_id', String(params.collector_id))
      if (params.period) q.set('period', params.period)
      if (params.page) q.set('page', String(params.page))
      return req<{ tenants: TenantListItem[]; pagination: Pagination; period: string }>(`/supervisor/tenants?${q}`)
    },
    showTenant: (id: number, period?: string) => {
      const q = period ? `?period=${period}` : ''
      return req<TenantDetail>(`/supervisor/tenants/${id}${q}`)
    },
    createTenant: (body: Record<string, any>) => req<TenantDetail>('/supervisor/tenants', { method: 'POST', body }),
    updateTenant: (id: number, body: Record<string, any>) => req<TenantInfo>(`/supervisor/tenants/${id}`, { method: 'PUT', body }),
    addPromise: (id: number, body: { promise_date: string; note: string }) =>
      req<PromiseItem>(`/supervisor/tenants/${id}/promises`, { method: 'POST', body }),
    addNote: (id: number, body: { content: string }) =>
      req<NoteItem>(`/supervisor/tenants/${id}/notes`, { method: 'POST', body }),
    addPayment: (id: number, body: Record<string, any>) =>
      req<PaymentLedgerItem>(`/supervisor/tenants/${id}/payments`, { method: 'POST', body }),
    importTemplate: () => `${base}/supervisor/tenants/import/template`,
    importExcel: (formData: FormData) =>
      req<ImportResult>('/supervisor/tenants/import', { method: 'POST', body: formData }),
    approvals: (params: { tab?: string; search?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.tab) q.set('tab', params.tab)
      if (params.search) q.set('search', params.search)
      if (params.page) q.set('page', String(params.page))
      return req<{ payments: PaymentApprovalItem[]; pagination: Pagination; tabs: PaymentApprovalTabs }>(`/supervisor/payments/approvals?${q}`)
    },
    approvePayment: (id: number) => req(`/supervisor/payments/approvals/${id}/approve`, { method: 'POST' }),
    rejectPayment: (id: number, body: { rejection_reason: string }) =>
      req(`/supervisor/payments/approvals/${id}/reject`, { method: 'POST', body }),
    editPayment: (id: number, body: Record<string, any>) =>
      req(`/supervisor/payments/approvals/${id}`, { method: 'PUT', body }),
    deletePayment: (id: number) => req(`/supervisor/payments/approvals/${id}`, { method: 'DELETE' }),
    ownerPayments: (params: { search?: string; period?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.period) q.set('period', params.period)
      if (params.page) q.set('page', String(params.page))
      return req<{ payments: OwnerPaymentItem[]; pagination: Pagination; statistics: any }>(`/supervisor/owner-payments?${q}`)
    },
    updateOwnerPaymentNotes: (id: number, body: { notes: string }) =>
      req(`/supervisor/owner-payments/${id}/notes`, { method: 'PUT', body }),
  }

  // ---------- COLLECTOR ----------
  const collector = {
    tenants: (params: { search?: string; period?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.period) q.set('period', params.period)
      if (params.page) q.set('page', String(params.page))
      return req<{ tenants: TenantListItem[]; pagination: Pagination; period: string }>(`/collector/tenants?${q}`)
    },
    showTenant: (id: number, period?: string) => {
      const q = period ? `?period=${period}` : ''
      return req<TenantDetail>(`/collector/tenants/${id}${q}`)
    },
    addPromise: (id: number, body: { promise_date: string; note: string }) =>
      req<PromiseItem>(`/collector/tenants/${id}/promises`, { method: 'POST', body }),
    addNote: (id: number, body: { content: string }) =>
      req<NoteItem>(`/collector/tenants/${id}/notes`, { method: 'POST', body }),
    addPaymentForTenant: (id: number, body: Record<string, any>) =>
      req<PaymentLedgerItem>(`/collector/tenants/${id}/payments`, { method: 'POST', body }),
    payments: (params: { search?: string; period?: string; status?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.period) q.set('period', params.period)
      if (params.status) q.set('status', params.status)
      if (params.page) q.set('page', String(params.page))
      return req<{ payments: CollectorPaymentItem[]; pagination: Pagination; statistics: any }>(`/collector/payments?${q}`)
    },
    createPayment: (formData: FormData) =>
      req<CollectorPaymentItem>('/collector/payments', { method: 'POST', body: formData }),
  }

  // ---------- OWNER ----------
  const owner = {
    overview: (period?: string) => {
      const q = period ? `?period=${period}` : ''
      return req<OwnerOverviewData>(`/owner/overview${q}`)
    },
    payments: (params: { search?: string; period?: string; status?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.period) q.set('period', params.period)
      if (params.status) q.set('status', params.status)
      if (params.page)   q.set('page', String(params.page))
      return req<{ payments: OwnerPaymentItem[]; pagination: Pagination; statistics: OwnerPaymentStats }>(`/owner/payments?${q}`)
    },
    getPaymentNotes: (id: number) =>
      req<{ payment: { id: number; property_unit: string; amount: number; period: string }; notes: OwnerPaymentNote[] }>(`/owner/payments/${id}/notes`),
    addPaymentNote: (id: number, body: { content: string }) =>
      req<OwnerPaymentNote>(`/owner/payments/${id}/notes`, { method: 'POST', body }),
    properties: (period?: string) => {
      const q = period ? `?period=${period}` : ''
      return req<OwnerPropertiesData>(`/owner/properties${q}`)
    },
  }

  return { auth, supervisor, collector, owner, base, token }
}

// ==================== OWNER TYPES ====================
export interface OwnerKpis {
  collected_this_month: number
  target_this_month: number
  collection_percentage: number
  total_collected_all_time: number
  total_units_count: number
}

export interface OwnerMonthlyProgress {
  target: number
  collected: number
  remaining: number
  percentage: number
  label: string
}

export interface OwnerAssignedCollector {
  id: number
  name: string
  units_count: number
  target_amount: number
  collected_amount: number
  percentage: number
}

export interface OwnerChartMonth {
  period: string
  month_label: string
  collected_amount: number
}

export interface OwnerOverviewData {
  period: string
  period_formatted: string
  kpis: OwnerKpis
  monthly_progress: OwnerMonthlyProgress
  assigned_collectors: OwnerAssignedCollector[]
  chart_last_6_months: OwnerChartMonth[]
}

export interface OwnerPaymentStats {
  total_count: number
  total_amount: number
  approved_amount: number
  pending_amount: number
}

export interface OwnerPaymentNote {
  id: number
  payment_id?: number
  content: string
  author_name: string
  author_role: string
  created_at: string
  created_at_time: string
}

export interface OwnerPropertySummary {
  name: string
  units_count: number
  total_monthly_target: number
  total_collected: number
  collection_percentage: number
}

export interface OwnerPropertyTenant {
  id: number
  property_unit: string
  tenant_name: string
  tenant_phone: string
  collector_name: string
  monthly_target: number
  paid_amount: number
  remaining_amount: number
  status: string
  status_label: string
}

export interface OwnerPropertiesStats {
  total_units: number
  total_target: number
  total_collected: number
  collection_percentage: number
}

export interface OwnerPropertiesData {
  period: string
  period_formatted: string
  has_properties: boolean
  properties: OwnerPropertySummary[]
  tenants: OwnerPropertyTenant[]
  statistics: OwnerPropertiesStats
}
