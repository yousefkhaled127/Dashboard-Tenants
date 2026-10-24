// ============================================================
// useConstants — ثوابت مشتركة بين جميع الصفحات
// بدلاً من تكرار نفس الـ Record في 5-6 صفحات مختلفة
// ============================================================

// ────────────────────────────────────────
// أنواع الوحدات العقارية
// ────────────────────────────────────────
export const LS_TYPES: Record<string, string> = {
  apartment: 'شقة',
  villa:     'فيلا',
  floor:     'دور',
  building:  'عمارة',
  land:      'أرض',
  shop:      'محل تجاري',
  office:    'مكتب',
  warehouse: 'مستودع',
  other:     'أخرى',
}

// ────────────────────────────────────────
// نوع الصفقة
// ────────────────────────────────────────
export const LS_DEAL_TYPES: Record<string, string> = {
  rent:  'إيجار',
  sale:  'بيع',
  both:  'إيجار أو بيع',
}

// ────────────────────────────────────────
// حالات وحدة الوحدة الشاغرة (مهام العقارات)
// ────────────────────────────────────────
export const LS_STATUSES: { k: string; l: string; tone: string }[] = [
  { k: 'name_only',             l: 'عندي الاسم فقط',        tone: 'muted'   },
  { k: 'basic_details',         l: 'تفاصيل أولية',           tone: 'muted'   },
  { k: 'photographed',          l: 'تم التصوير',             tone: 'warn'    },
  { k: 'waiting_video',         l: 'بانتظار الفيديو',        tone: 'warn'    },
  { k: 'website_only',          l: 'بالموقع فقط',            tone: 'orange'  },
  { k: 'awaiting_owner_license',l: 'بانتظار الترخيص',       tone: 'orange'  },
  { k: 'license_issued',        l: 'تم الترخيص',             tone: 'orange'  },
  { k: 'publishing',            l: 'جاري التنزيل',           tone: 'orange'  },
  { k: 'published',             l: 'تم تنزيل الإعلان',       tone: 'ok'      },
  { k: 'license_renewal',       l: 'ترخيص منتهي',            tone: 'danger'  },
  { k: 'license_expired',       l: 'ترخيص منتهي تماماً',     tone: 'danger'  },
]

export function lsStatusLabel(k?: string): string {
  return LS_STATUSES.find(s => s.k === k)?.l ?? (k || '—')
}

export function lsStatusTone(k?: string): string {
  return LS_STATUSES.find(s => s.k === k)?.tone ?? 'muted'
}

// ────────────────────────────────────────
// مراحل التسويق المميز
// ────────────────────────────────────────
export const FT_STAGES: { k: string; l: string; tone: string }[] = [
  { k: 'initial',           l: 'تسويق مبدئي',       tone: 'muted'  },
  { k: 'precise_location',  l: 'موقع دقيق',          tone: 'warn'   },
  { k: 'video',             l: 'تسويق فيديوهات',     tone: 'orange' },
  { k: 'campaign',          l: 'حملة إعلانية',       tone: 'orange' },
  { k: 'full',              l: 'تسويق كامل',         tone: 'ok'     },
]

export function ftStageObj(k: string) {
  return FT_STAGES.find(s => s.k === k) ?? FT_STAGES[0]
}

// ────────────────────────────────────────
// أنواع مهام التسويق المميز
// ────────────────────────────────────────
export const FT_TASK_TYPES: Record<string, string> = {
  photo:    'طلب تصوير',
  video:    'طلب فيديو',
  location: 'طلب موقع دقيق',
  design:   'تصميم إعلان',
  campaign: 'إطلاق حملة إعلانية',
  publish:  'نشر في منصة',
  visit:    'معاينة / زيارة',
  other:    'مهمة أخرى',
}

// ────────────────────────────────────────
// حالات مهام التسويق المميز
// ────────────────────────────────────────
export const FT_TASK_ST: Record<string, { l: string; tone: string }> = {
  open:      { l: 'جديدة',         tone: 'muted'  },
  progress:  { l: 'جاري التنفيذ',  tone: 'orange' },
  done:      { l: 'منجزة',         tone: 'ok'     },
  cancelled: { l: 'ملغاة',         tone: 'danger' },
}

export function ftTaskStObj(k: string) {
  return FT_TASK_ST[k] ?? FT_TASK_ST['open']
}

// ────────────────────────────────────────
// useStaffLoader — تحميل قائمة الموظفين (مشترفون + محصّلون)
// يستخدم في featured.vue, featureddetail.vue, listings.vue
// ────────────────────────────────────────
export function useStaffLoader() {
  const { auth } = useApi()
  const allStaff = ref<{ key: string; name: string }[]>([])
  const staffLoading = ref(false)

  async function loadStaff() {
    staffLoading.value = true
    try {
      const [sups, cols] = await Promise.all([
        auth.usersByType('supervisor'),
        auth.usersByType('collector'),
      ])
      allStaff.value = [
        ...sups.map(u => ({ key: `supervisor:${u.id}`, name: u.name })),
        ...cols.map(u => ({ key: `collector:${u.id}`,  name: u.name })),
      ]
    } catch { /* silent */ } finally {
      staffLoading.value = false
    }
  }

  const actorName = (key: string) =>
    allStaff.value.find(s => s.key === key)?.name
    ?? (key || '—').split(':').pop()
    ?? '—'

  return { allStaff, staffLoading, loadStaff, actorName }
}
