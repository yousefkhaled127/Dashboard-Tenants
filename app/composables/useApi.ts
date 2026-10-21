// ============================================================
// useApi — API client موحّد لكل الـ endpoints (v2)
// يعتمد على token في cookie + base URL من runtimeConfig
// ============================================================

// ==================== AUTH TYPES ====================
export interface Role { value: string; label: string }

export interface UserByType {
  id: number
  value: number
  name: string
  username: string
  type: string
  type_label: string
  type_description?: string
  display_name?: string
  name_with_type?: string
  label?: string
  national_id?: string   // رقم الهوية — يُرسَل من الـ API لحساب المالك
  phone?: string
}

export interface AuthUser {
  id: number
  name: string
  username: string
  email?: string
  phone?: string
  type: string
  type_label: string
  is_active?: boolean
}

export interface LoginResponse {
  token: string
  token_type: string
  user: AuthUser
}

// ==================== SHARED REFS ====================
export interface CollectorRef { id: number; name: string }
export interface OwnerRef { id: number; name: string }

// ==================== TENANT TYPES ====================
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

// ==================== PAYMENT TYPES ====================
export interface PaymentApprovalItem {
  id: number
  tenant: { id: number; tenant_number: string; property_unit: string; name: string; phone: string }
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
  attachment_url?: string | null
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
  tenant: { id: number; tenant_number: string; property_unit: string; name: string; phone: string }
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
  attachment_url?: string | null
}

export interface CollectorPaymentItem {
  id: number
  tenant: { id: number; tenant_number: string; property_unit: string; name: string; phone: string }
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

// ==================== USER MANAGEMENT TYPES ====================
export interface SupervisorUser {
  id: number
  name: string
  username: string
  email?: string
  phone?: string
  national_id?: string
  type: string
  type_label: string
  type_description?: string
  is_active: boolean
  is_current_user?: boolean
  tenants_count?: number | null
  collected_this_month?: number | null
  target_this_month?: number | null
  properties_count?: number | null
  created_at?: string
}

export interface CollectorUser {
  id: number
  name: string
  username: string
  email?: string
  phone?: string
  national_id?: string
  type: string
  type_label: string
  type_description?: string
  is_active: boolean
  tenants_count?: number
  collected_this_month?: number
  target_this_month?: number
  created_at?: string
}

export interface OwnerUser {
  id: number
  name: string
  username: string
  email?: string
  phone?: string
  national_id?: string
  type: string
  type_label: string
  type_description?: string
  is_active: boolean
  properties_count?: number
  tenants_count?: number
  created_at?: string
}

export interface UserTypeInfo {
  value: string
  label: string
  description: string
}

export interface UserStatistics {
  all_count: number
  active_count: number
  inactive_count: number
  general_manager_count?: number
  real_estate_count?: number
  collection_count?: number
  maintenance_count?: number
}

export interface TabsCounts {
  supervisors: number
  collectors: number
  owners: number
}

// ==================== NOTICE TYPES ====================
export interface NoticeRequest {
  id: number
  tenant: { id: number; name: string; phone: string; tenant_number: string; property_unit: string }
  collector: CollectorRef
  reason: string
  status: string
  status_label: string
  notice_content?: string | null
  notice_file_url?: string | null
  delivery_proof_url?: string | null
  created_at?: string
}

export interface NoticeStatistics {
  new_requests_count: number
  pending_approval_count: number
  all_count: number
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

// ==================== PAGINATION ====================
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
        'ngrok-skip-browser-warning': 'true',
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        ...opts.headers,
      },
    })
    return res.data
  }

  // ---------- AUTH ----------
  const auth = {
    roles: () => req<Role[]>('/auth/roles'),

    usersByType: (type: string) =>
      req<UserByType[]>(`/auth/users-by-type?type=${type}`),

    /** v2: body uses user_id (number) + device_name */
    login: (body: { user_id: number; password: string; type: string; device_name?: string }) =>
      req<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { device_name: 'web', ...body },
      }),

    /** owner login برقم الهوية أو الجوال أو البريد مباشرة */
    loginOwner: (body: { login: string; password: string }) =>
      req<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { device_name: 'web', type: 'owner', ...body },
      }),

    me: () => req<AuthUser>('/auth/me'),
    logout: () => req('/auth/logout', { method: 'POST' }),

    /** تغيير كلمة المرور — يتطلب token سارٍ */
    changePassword: (body: { current_password: string; password: string; password_confirmation: string }) =>
      req('/auth/password/update', { method: 'POST', body }),
  }

  // ---------- GENERAL MANAGER (supervisor module — v2 prefix) ----------
  const manager = {
    // Tenants
    tenants: (params: { search?: string; collector_id?: number; period?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search)       q.set('search', params.search)
      if (params.collector_id) q.set('collector_id', String(params.collector_id))
      if (params.period)       q.set('period', params.period)
      if (params.page)         q.set('page', String(params.page))
      return req<{ tenants: TenantListItem[]; pagination: Pagination; period: string }>(`/general-manager/tenants?${q}`)
    },
    showTenant: (id: number, period?: string) =>
      req<TenantDetail>(`/general-manager/tenants/${id}${period ? `?period=${period}` : ''}`),
    createTenant: (body: Record<string, any>) =>
      req<TenantDetail>('/general-manager/tenants', { method: 'POST', body }),
    updateTenant: (id: number, body: Record<string, any>) =>
      req<TenantInfo>(`/general-manager/tenants/${id}`, { method: 'PUT', body }),
    deleteTenant: (id: number) =>
      req(`/general-manager/tenants/${id}`, { method: 'DELETE' }),
    addPromise: (id: number, body: { promise_date: string; note: string }) =>
      req<PromiseItem>(`/general-manager/tenants/${id}/promises`, { method: 'POST', body }),
    deletePromise: (tenantId: number, promiseId: number) =>
      req(`/general-manager/tenants/${tenantId}/promises/${promiseId}`, { method: 'DELETE' }),
    addNote: (id: number, body: { content: string }) =>
      req<NoteItem>(`/general-manager/tenants/${id}/notes`, { method: 'POST', body }),
    deleteNote: (tenantId: number, noteId: number) =>
      req(`/general-manager/tenants/${tenantId}/notes/${noteId}`, { method: 'DELETE' }),
    addPayment: (id: number, body: Record<string, any>) =>
      req<PaymentLedgerItem>(`/general-manager/tenants/${id}/payments`, { method: 'POST', body }),
    deletePayment: (tenantId: number, paymentId: number) =>
      req(`/general-manager/tenants/${tenantId}/payments/${paymentId}`, { method: 'DELETE' }),

    // Excel import
    importTemplate: () => `${base}/general-manager/tenants/import/template`,
    importExcel: (formData: FormData) =>
      req<ImportResult>('/general-manager/tenants/import', { method: 'POST', body: formData }),

    // Payment approvals
    approvals: (params: { tab?: string; search?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.tab)    q.set('tab', params.tab)
      if (params.search) q.set('search', params.search)
      if (params.page)   q.set('page', String(params.page))
      return req<{ payments: PaymentApprovalItem[]; pagination: Pagination; tabs: PaymentApprovalTabs }>(`/general-manager/payments/approvals?${q}`)
    },
    showApproval: (id: number) =>
      req<PaymentApprovalItem>(`/general-manager/payments/approvals/${id}`),
    approvePayment: (id: number) =>
      req(`/general-manager/payments/approvals/${id}/approve`, { method: 'POST' }),
    rejectPayment: (id: number, body: { rejection_reason: string }) =>
      req(`/general-manager/payments/approvals/${id}/reject`, { method: 'POST', body }),
    editPayment: (id: number, body: Record<string, any>) =>
      req(`/general-manager/payments/approvals/${id}`, { method: 'PUT', body }),
    deleteApproval: (id: number) =>
      req(`/general-manager/payments/approvals/${id}`, { method: 'DELETE' }),

    // Owner payments
    ownerPayments: (params: { search?: string; owner_id?: number; period?: string; status?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search)   q.set('search', params.search)
      if (params.owner_id) q.set('owner_id', String(params.owner_id))
      if (params.period)   q.set('period', params.period)
      if (params.status)   q.set('status', params.status)
      if (params.page)     q.set('page', String(params.page))
      return req<{ payments: OwnerPaymentItem[]; pagination: Pagination; statistics: any }>(`/general-manager/owner-payments?${q}`)
    },
    updateOwnerPaymentNotes: (id: number, body: { notes: string }) =>
      req(`/general-manager/owner-payments/${id}/notes`, { method: 'PUT', body }),

    // Notice requests (new v2 endpoint)
    noticeRequests: (params: { tab?: string; search?: string; collector_id?: number; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.tab)          q.set('tab', params.tab)
      if (params.search)       q.set('search', params.search)
      if (params.collector_id) q.set('collector_id', String(params.collector_id))
      if (params.page)         q.set('page', String(params.page))
      return req<{ requests: NoticeRequest[]; pagination: Pagination; statistics: NoticeStatistics }>(`/general-manager/notice-requests?${q}`)
    },
    showNoticeRequest: (id: number) =>
      req<NoticeRequest>(`/general-manager/notice-requests/${id}`),
    issueNotice: (id: number, formData: FormData) =>
      req<NoticeRequest>(`/general-manager/notice-requests/${id}/issue`, { method: 'POST', body: formData }),
    approveNoticeDelivery: (id: number) =>
      req<NoticeRequest>(`/general-manager/notice-requests/${id}/approve-delivery`, { method: 'POST' }),
    rejectNoticeRequest: (id: number, body: { rejection_reason: string }) =>
      req<NoticeRequest>(`/general-manager/notice-requests/${id}/reject`, { method: 'POST', body }),

    // ─── Properties & Contracts ───────────────────────────────
    properties: (params: { search?: string; owner_id?: number; period?: string } = {}, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') => {
      const q = new URLSearchParams()
      if (params.search)   q.set('search', params.search)
      if (params.owner_id) q.set('owner_id', String(params.owner_id))
      if (params.period)   q.set('period', params.period)
      return req<PropertyListResponse>(`/${role}/properties?${q}`)
    },
    showProperty: (id: number, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') =>
      req<PropertyDetailResponse>(`/${role}/properties/${id}`),
    createProperty: (body: { owner_id: number; name: string; location?: string }, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') =>
      req<PropertyItem>(`/${role}/properties`, { method: 'POST', body }),
    updateProperty: (id: number, body: { owner_id?: number; name?: string; location?: string }, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') =>
      req<PropertyItem>(`/${role}/properties/${id}`, { method: 'PUT', body }),
    deleteProperty: (id: number, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') =>
      req(`/${role}/properties/${id}`, { method: 'DELETE' }),

    // Contract operations
    contractOptions: (propertyId: number, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') =>
      req<ContractOptionsResponse>(`/${role}/properties/${propertyId}/contracts/options`),
    createContract: (propertyId: number, body: ContractCreateBody, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') =>
      req<ContractItem>(`/${role}/properties/${propertyId}/contracts`, { method: 'POST', body }),
    updateContract: (propertyId: number, contractId: number, body: Record<string, any>, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') =>
      req<ContractItem>(`/${role}/properties/${propertyId}/contracts/${contractId}`, { method: 'PUT', body }),
    terminateContract: (propertyId: number, contractId: number, body: { closure_reason: string }, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') =>
      req<ContractItem>(`/${role}/properties/${propertyId}/contracts/${contractId}/terminate`, { method: 'POST', body }),
    renewContract: (propertyId: number, contractId: number, body: ContractRenewBody, role: 'general-manager' | 'real-estate-supervisor' = 'general-manager') =>
      req<ContractItem>(`/${role}/properties/${propertyId}/contracts/${contractId}/renew`, { method: 'POST', body }),

    // User management — Supervisors
    supervisors: (params: { search?: string; type?: string } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.type)   q.set('type', params.type)
      return req<{ supervisors: SupervisorUser[]; statistics: UserStatistics; types: UserTypeInfo[] }>(`/general-manager/supervisors?${q}`)
    },
    showSupervisor: (id: number) =>
      req<SupervisorUser>(`/general-manager/supervisors/${id}`),
    createSupervisor: (body: { name: string; type: string; phone?: string; password: string }) =>
      req<SupervisorUser>('/general-manager/supervisors', { method: 'POST', body }),
    updateSupervisor: (id: number, body: Record<string, any>) =>
      req<SupervisorUser>(`/general-manager/supervisors/${id}`, { method: 'PUT', body }),
    toggleSupervisor: (id: number) =>
      req<SupervisorUser>(`/general-manager/supervisors/${id}/toggle-status`, { method: 'POST' }),
    deleteSupervisor: (id: number) =>
      req(`/general-manager/supervisors/${id}`, { method: 'DELETE' }),

    // User management — Collectors
    collectors: (params: { search?: string; is_active?: string } = {}) => {
      const q = new URLSearchParams()
      if (params.search)    q.set('search', params.search)
      if (params.is_active) q.set('is_active', params.is_active)
      return req<{ collectors: CollectorUser[]; statistics: UserStatistics; tabs_counts: TabsCounts }>(`/general-manager/collectors?${q}`)
    },
    showCollector: (id: number) =>
      req<CollectorUser>(`/general-manager/collectors/${id}`),
    createCollector: (body: { name: string; phone?: string; password: string }) =>
      req<CollectorUser>('/general-manager/collectors', { method: 'POST', body }),
    updateCollector: (id: number, body: Record<string, any>) =>
      req<CollectorUser>(`/general-manager/collectors/${id}`, { method: 'PUT', body }),
    toggleCollector: (id: number) =>
      req<CollectorUser>(`/general-manager/collectors/${id}/toggle-status`, { method: 'PATCH' }),
    deleteCollector: (id: number) =>
      req(`/general-manager/collectors/${id}`, { method: 'DELETE' }),

    // User management — Owners
    owners: (params: { search?: string; is_active?: string } = {}) => {
      const q = new URLSearchParams()
      if (params.search)    q.set('search', params.search)
      if (params.is_active) q.set('is_active', params.is_active)
      return req<{ owners: OwnerUser[]; statistics: UserStatistics; tabs_counts: TabsCounts }>(`/general-manager/owners?${q}`)
    },
    showOwner: (id: number) =>
      req<OwnerUser>(`/general-manager/owners/${id}`),
    createOwner: (body: { name: string; national_id: string; phone?: string; password: string }) =>
      req<OwnerUser>('/general-manager/owners', { method: 'POST', body }),
    updateOwner: (id: number, body: Record<string, any>) =>
      req<OwnerUser>(`/general-manager/owners/${id}`, { method: 'PUT', body }),
    toggleOwner: (id: number) =>
      req<OwnerUser>(`/general-manager/owners/${id}/toggle-status`, { method: 'PATCH' }),
    deleteOwner: (id: number) =>
      req(`/general-manager/owners/${id}`, { method: 'DELETE' }),
  }

  // ---------- COLLECTOR ----------
  const collector = {
    tenants: (params: { search?: string; period?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.period) q.set('period', params.period)
      if (params.page)   q.set('page', String(params.page))
      return req<{ tenants: TenantListItem[]; pagination: Pagination; period: string }>(`/collector/tenants?${q}`)
    },
    showTenant: (id: number, period?: string) =>
      req<TenantDetail>(`/collector/tenants/${id}${period ? `?period=${period}` : ''}`),
    addPromise: (id: number, body: { promise_date: string; note: string }) =>
      req<PromiseItem>(`/collector/tenants/${id}/promises`, { method: 'POST', body }),
    addNote: (id: number, body: { content: string }) =>
      req<NoteItem>(`/collector/tenants/${id}/notes`, { method: 'POST', body }),
    addPaymentForTenant: (id: number, formData: FormData) =>
      req<PaymentLedgerItem>(`/collector/tenants/${id}/payments`, { method: 'POST', body: formData }),
    payments: (params: { search?: string; period?: string; status?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.period) q.set('period', params.period)
      if (params.status) q.set('status', params.status)
      if (params.page)   q.set('page', String(params.page))
      return req<{ payments: CollectorPaymentItem[]; pagination: Pagination; statistics: any }>(`/collector/payments?${q}`)
    },
    showPayment: (id: number) =>
      req<CollectorPaymentItem>(`/collector/payments/${id}`),
    createPayment: (formData: FormData) =>
      req<CollectorPaymentItem>('/collector/payments', { method: 'POST', body: formData }),

    // Notice requests (new v2)
    noticeRequests: (params: { search?: string; status?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.status) q.set('status', params.status)
      if (params.page)   q.set('page', String(params.page))
      return req<{ requests: NoticeRequest[]; pagination: Pagination; statistics: any }>(`/collector/notice-requests?${q}`)
    },
    showNoticeRequest: (id: number) =>
      req<NoticeRequest>(`/collector/notice-requests/${id}`),
    createNoticeRequest: (body: { tenant_id: number; reason: string }) =>
      req<NoticeRequest>('/collector/notice-requests', { method: 'POST', body }),
    submitDeliveryProof: (id: number, formData: FormData) =>
      req<NoticeRequest>(`/collector/notice-requests/${id}/delivery-proof`, { method: 'POST', body: formData }),
  }

  // ---------- OWNER ----------
  const owner = {
    overview: (period?: string) =>
      req<OwnerOverviewData>(`/owner/overview${period ? `?period=${period}` : ''}`),
    payments: (params: { search?: string; period?: string; status?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.period) q.set('period', params.period)
      if (params.status) q.set('status', params.status)
      if (params.page)   q.set('page', String(params.page))
      return req<{ payments: OwnerPaymentItem[]; pagination: Pagination; statistics: OwnerPaymentStats }>(`/owner/payments?${q}`)
    },
    showPayment: (id: number) =>
      req<OwnerPaymentItem>(`/owner/payments/${id}`),
    getPaymentNotes: (id: number) =>
      req<{ payment: { id: number; property_unit: string; amount: number; period: string }; notes: OwnerPaymentNote[] }>(`/owner/payments/${id}/notes`),
    addPaymentNote: (id: number, body: { content: string }) =>
      req<OwnerPaymentNote>(`/owner/payments/${id}/notes`, { method: 'POST', body }),
    properties: (period?: string) =>
      req<OwnerPropertiesData>(`/owner/properties${period ? `?period=${period}` : ''}`),
  }

  return { auth, manager, collector, owner, base, token }
}

// ============================================================
// ==================== PROPERTIES & CONTRACTS TYPES ===========
// ============================================================
export interface PropertyOwnerRef { id: number; name: string; username?: string; phone?: string; email?: string }
export interface PropertyItem {
  id: number; name: string; location: string
  owner_id: number; owner_name: string; owner: PropertyOwnerRef
  units_count: number; active_contracts_count: number
  collected_this_month: number; collected_this_month_formatted: string
  overdue_amount: number; overdue_amount_formatted: string
  created_at: string; updated_at: string
}
export interface PropertyListResponse {
  properties: PropertyItem[]
  statistics: { properties_count: number; active_contracts_count: number; subtitle: string }
  owners: { id: number; name: string }[]
}
export interface ActiveContract {
  id: number; contract_number?: string; unit_number: string
  tenant_name: string; tenant_phone: string; national_id: string
  start_date_formatted: string; end_date_formatted: string
  installment_cycle_formatted: string; total_amount_formatted: string
  collected_amount_formatted: string; overdue_amount_formatted: string
  status: string; status_label: string
}
export interface PropertyDetailResponse {
  property: { id: number; name: string; location: string; owner_id: number; owner_name: string }
  statistics: {
    active_contracts_count: number; renewal_notice: string
    active_contracts_total_value: number; active_contracts_total_value_formatted: string
    active_contracts_collected: number; active_contracts_collected_formatted: string
    collected_this_month: number; collected_this_month_formatted: string
    total_overdue: number; total_overdue_formatted: string
  }
  active_contracts: ActiveContract[]
  tenants_without_active_contract: any[]
  previous_contracts: ActiveContract[]
}
export interface ContractOptionsResponse {
  payment_cycles:        { value: string; label: string }[]
  claim_generation_modes:{ value: string; label: string }[]
  contract_statuses:     { value: string; label: string }[]
  collectors:            { id: number; name: string }[]
  tenants:               { id: number; tenant_number: string; name: string; phone: string; national_id: string; property_name: string; property_unit: string; display_label: string }[]
}
export interface ContractItem {
  id: number; contract_number: string; unit_number: string
  tenant_id?: number; tenant_name: string; tenant_phone: string; national_id: string
  start_date: string; start_date_formatted: string
  end_date: string; end_date_formatted: string
  payment_cycle: string; payment_cycle_label: string
  installment_amount: number; installment_amount_formatted: string
  installment_cycle_formatted: string
  total_amount: number; total_amount_formatted: string
  collected_amount: number; collected_amount_formatted: string
  overdue_amount: number; overdue_amount_formatted: string
  claim_generation_mode?: string; claim_generation_mode_label?: string
  status: string; status_label: string; notes?: string
  closure_reason?: string
}
export interface ContractCreateBody {
  is_new_tenant: boolean
  tenant_id?: number
  // new tenant fields
  name?: string; phone?: string; national_id?: string; collector_id?: number
  unit_number: string
  start_date: string; end_date: string
  total_amount: number; payment_cycle: string; installment_amount: number
  claim_generation_mode: string; notes?: string
}
export interface ContractRenewBody {
  start_date: string; end_date: string
  total_amount: number; payment_cycle: string; installment_amount: number
  claim_generation_mode: string; notes?: string
}
export interface VacancyItem {
  id: number
  property_id: number | null
  property_name: string
  unit: string
  price: number
  price_cycle: string
  rooms: number
  location: string
  notes: string
  status: 'vacant' | 'deposit' | 'rented'
  deposit_by: number | null
  deposit_by_name?: string
  deposit_amount: number
  deposit_date: string
  rented_by: number | null
  rented_by_name?: string
  rented_date: string
  rent_price: number
  tenant_name: string
  tenant_phone: string
  history: { status: string; collector_id: number | null; note: string; at: string }[]
  created_at: string
  updated_at: string
}

export interface VacancyStats {
  vacant_count: number
  deposit_count: number
  rented_count: number
  rented_this_month: number
}

// ============================================================
// ==================== LISTINGS TYPES ====================
// ============================================================
export interface ListingItem {
  id: number
  code: string
  ext_code?: string
  kind: 'office' | 'external'
  title: string
  unit_type: string
  unit_no: string
  status: string
  vacant: boolean
  responsible_id: number | null
  responsible_name?: string
  responsible_role?: string
  owner_id: number | null
  owner_name: string
  owner_phone: string
  brokerage_no: string
  brokerage_date: string
  description: string
  deal_type: string
  rent_price: string
  rent_cycle: string
  sale_price: string
  photos_count: number
  first_photo_url?: string | null
  published_platforms: string[]
  license_number?: string
  license_expiry?: string
  guard_name?: string
  guard_phone?: string
  guard_unit_code?: string
  location_lat?: number | null
  location_lng?: number | null
  location_address?: string
  // outside-office
  review?: 'pending' | 'needs_info' | 'accepted' | 'rejected'
  ext_note?: string
  ext_reject_reason?: string
  // close data
  close_reason?: string
  close_note?: string
  closed_at?: string
  created_at: string
  updated_at: string
}

export interface ListingDetail extends ListingItem {
  answers: Record<string, any>
  photos: { id: number; url: string; name: string }[]
  videos: { id: number; url: string; name: string }[]
  video_url?: string
  license_file_url?: string
  platforms: Record<string, { url: string; ad_no: string; at: string; by_name: string }>
  history: { id: string; type: string; at: string; by_name: string; by_role: string; text: string }[]
  checklist_pct: number
  available_platforms: { id: string; name: string; domain: string }[]
}

export interface ListingStats {
  active_count: number
  published_count: number
  license_alerts_count: number
  closed_count: number
  external_pending_count: number
}

// ============================================================
// ==================== FEATURED TYPES ====================
// ============================================================
// FeaturedTask is defined in useAppState.ts — imported from there
// export interface FeaturedTask — removed to avoid duplicate

export interface FeaturedItem {
  id: number
  listing_id: number
  listing_code: string
  listing_title: string
  listing_unit_type?: string
  listing_rent_price?: string
  listing_sale_price?: string
  listing_deal_type?: string
  listing_vacant?: boolean
  listing_status?: string
  stage: string
  added_by_name: string
  added_at: string
  updated_at: string
  tasks: FeaturedTask[]
  open_tasks_count: number
  late_tasks_count: number
  done_tasks_count: number
  open_assignees: string[]
}

export interface FeaturedStats {
  total_count: number
  open_tasks_count: number
  late_tasks_count: number
  done_tasks_count: number
  my_open_tasks_count: number
}

// ============================================================
// ==================== EXTENDED useApi ====================
// ============================================================
export function useVacanciesApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const token = useCookie<string>('tahsilat-token')

  async function req<T = any>(url: string, opts: Record<string, any> = {}): Promise<T> {
    const res = await $fetch<{ success: boolean; message: string; data: T }>(base + url, {
      ...opts,
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        ...opts.headers,
      },
    })
    return res.data
  }

  // ---------- SUPERVISOR ----------
  const supervisor = {
    list: (params: { search?: string; status?: string; property_id?: number; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search)      q.set('search', params.search)
      if (params.status)      q.set('status', params.status)
      if (params.property_id) q.set('property_id', String(params.property_id))
      if (params.page)        q.set('page', String(params.page))
      return req<{ vacancies: VacancyItem[]; statistics: VacancyStats; pagination: any }>(`/general-manager/vacancies?${q}`)
    },
    create: (body: Record<string, any>) =>
      req<VacancyItem>('/general-manager/vacancies', { method: 'POST', body }),
    update: (id: number, body: Record<string, any>) =>
      req<VacancyItem>(`/general-manager/vacancies/${id}`, { method: 'PUT', body }),
    delete: (id: number) =>
      req(`/general-manager/vacancies/${id}`, { method: 'DELETE' }),
    updateStatus: (id: number, body: Record<string, any>) =>
      req<VacancyItem>(`/general-manager/vacancies/${id}/status`, { method: 'POST', body }),
  }

  // ---------- COLLECTOR ----------
  const collector = {
    list: (params: { status?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.status) q.set('status', params.status)
      if (params.page)   q.set('page', String(params.page))
      return req<{ vacancies: VacancyItem[]; statistics: VacancyStats; pagination: any }>(`/collector/vacancies?${q}`)
    },
    updateStatus: (id: number, body: Record<string, any>) =>
      req<VacancyItem>(`/collector/vacancies/${id}/status`, { method: 'POST', body }),
  }

  // ---------- OWNER ----------
  const owner = {
    list: (params: { status?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.status) q.set('status', params.status)
      if (params.page)   q.set('page', String(params.page))
      return req<{ vacancies: VacancyItem[]; statistics: VacancyStats; pagination: any }>(`/owner/vacancies?${q}`)
    },
  }

  return { supervisor, collector, owner }
}

export function useListingsApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const token = useCookie<string>('tahsilat-token')

  async function req<T = any>(url: string, opts: Record<string, any> = {}): Promise<T> {
    const res = await $fetch<{ success: boolean; message: string; data: T }>(base + url, {
      ...opts,
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        ...opts.headers,
      },
    })
    return res.data
  }

  // ---------- SUPERVISOR ----------
  const supervisor = {
    list: (params: { search?: string; status?: string; unit_type?: string; deal_type?: string; responsible_id?: number; tab?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search)         q.set('search', params.search)
      if (params.status)         q.set('status', params.status)
      if (params.unit_type)      q.set('unit_type', params.unit_type)
      if (params.deal_type)      q.set('deal_type', params.deal_type)
      if (params.responsible_id) q.set('responsible_id', String(params.responsible_id))
      if (params.tab)            q.set('tab', params.tab)
      if (params.page)           q.set('page', String(params.page))
      return req<{ listings: ListingItem[]; statistics: ListingStats; pagination: any }>(`/general-manager/listings?${q}`)
    },
    show: (id: number) =>
      req<ListingDetail>(`/general-manager/listings/${id}`),
    create: (body: Record<string, any>) =>
      req<ListingDetail>('/general-manager/listings', { method: 'POST', body }),
    update: (id: number, body: Record<string, any>) =>
      req<ListingDetail>(`/general-manager/listings/${id}`, { method: 'PUT', body }),
    delete: (id: number) =>
      req(`/general-manager/listings/${id}`, { method: 'DELETE' }),
    updateStatus: (id: number, body: { status: string }) =>
      req<ListingDetail>(`/general-manager/listings/${id}/status`, { method: 'POST', body }),
    close: (id: number, body: { reason: string; note?: string }) =>
      req<ListingDetail>(`/general-manager/listings/${id}/close`, { method: 'POST', body }),
    reopen: (id: number) =>
      req<ListingDetail>(`/general-manager/listings/${id}/reopen`, { method: 'POST' }),
    addPlatform: (id: number, platformId: string, body: { url: string; ad_no?: string }) =>
      req<ListingDetail>(`/general-manager/listings/${id}/platforms/${platformId}`, { method: 'POST', body }),
    removePlatform: (id: number, platformId: string) =>
      req<ListingDetail>(`/general-manager/listings/${id}/platforms/${platformId}`, { method: 'DELETE' }),
    // outside-office review (general manager only)
    exDecide: (id: number, body: { action: 'accept' | 'reject' | 'info'; note?: string }) =>
      req<ListingDetail>(`/general-manager/listings/${id}/review`, { method: 'POST', body }),
    exReopen: (id: number) =>
      req<ListingDetail>(`/general-manager/listings/${id}/review/reopen`, { method: 'POST' }),
  }

  // ---------- COLLECTOR ----------
  const collector = {
    list: (params: { search?: string; status?: string; unit_type?: string; tab?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search)    q.set('search', params.search)
      if (params.status)    q.set('status', params.status)
      if (params.unit_type) q.set('unit_type', params.unit_type)
      if (params.tab)       q.set('tab', params.tab)
      if (params.page)      q.set('page', String(params.page))
      return req<{ listings: ListingItem[]; statistics: ListingStats; pagination: any }>(`/collector/listings?${q}`)
    },
    show: (id: number) =>
      req<ListingDetail>(`/collector/listings/${id}`),
    create: (body: Record<string, any>) =>
      req<ListingDetail>('/collector/listings', { method: 'POST', body }),
    updateStatus: (id: number, body: { status: string }) =>
      req<ListingDetail>(`/collector/listings/${id}/status`, { method: 'PATCH', body }),
  }

  // ---------- OWNER ----------
  const ownerApi = {
    list: (params: { search?: string; unit_type?: string; tab?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search)    q.set('search', params.search)
      if (params.unit_type) q.set('unit_type', params.unit_type)
      if (params.tab)       q.set('tab', params.tab)
      if (params.page)      q.set('page', String(params.page))
      return req<{ listings: ListingItem[]; statistics: ListingStats; pagination: any }>(`/owner/listings?${q}`)
    },
  }

  return { supervisor, collector, owner: ownerApi }
}

export function useFeaturedApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const token = useCookie<string>('tahsilat-token')

  async function req<T = any>(url: string, opts: Record<string, any> = {}): Promise<T> {
    const res = await $fetch<{ success: boolean; message: string; data: T }>(base + url, {
      ...opts,
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        ...opts.headers,
      },
    })
    return res.data
  }

  // ---------- SUPERVISOR ----------
  const supervisor = {
    list: (params: { search?: string; stage?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.search) q.set('search', params.search)
      if (params.stage)  q.set('stage', params.stage)
      if (params.page)   q.set('page', String(params.page))
      return req<{ featured: FeaturedItem[]; statistics: FeaturedStats; pagination: any }>(`/general-manager/featured?${q}`)
    },
    show: (id: number) =>
      req<FeaturedItem>(`/general-manager/featured/${id}`),
    add: (body: { listing_id: number }) =>
      req<FeaturedItem>('/general-manager/featured', { method: 'POST', body }),
    remove: (id: number) =>
      req(`/general-manager/featured/${id}`, { method: 'DELETE' }),
    updateStage: (id: number, body: { stage: string }) =>
      req<FeaturedItem>(`/general-manager/featured/${id}/stage`, { method: 'PATCH', body }),
    addTask: (id: number, body: { type: string; title: string; assignee_id: number; due?: string; note?: string }) =>
      req<FeaturedItem>(`/general-manager/featured/${id}/tasks`, { method: 'POST', body }),
    updateTask: (id: number, taskId: string, body: Record<string, any>) =>
      req<FeaturedItem>(`/general-manager/featured/${id}/tasks/${taskId}`, { method: 'PUT', body }),
    updateTaskStatus: (id: number, taskId: string, body: { status: string }) =>
      req<FeaturedItem>(`/general-manager/featured/${id}/tasks/${taskId}/status`, { method: 'PATCH', body }),
    deleteTask: (id: number, taskId: string) =>
      req(`/general-manager/featured/${id}/tasks/${taskId}`, { method: 'DELETE' }),
  }

  // ---------- COLLECTOR ----------
  const collector = {
    list: (params: { tab?: string; page?: number } = {}) => {
      const q = new URLSearchParams()
      if (params.tab)  q.set('tab', params.tab)
      if (params.page) q.set('page', String(params.page))
      return req<{ featured: FeaturedItem[]; statistics: FeaturedStats; pagination: any }>(`/collector/featured?${q}`)
    },
    myTasks: () =>
      req<{ tasks: (FeaturedTask & { featured_id: number; listing_code: string; listing_title: string })[] }>('/collector/featured/my-tasks'),
    updateTaskStatus: (featuredId: number, taskId: string, body: { status: string }) =>
      req<FeaturedItem>(`/collector/featured/${featuredId}/tasks/${taskId}/status`, { method: 'PATCH', body }),
  }

  return { supervisor, collector }
}
