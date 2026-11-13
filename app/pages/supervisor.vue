<template>
  <AppSidebar
    :userName="session.name"
    :roleLabel="roleLabel"
    :navItems="navItems"
    :syncTime="syncTime"
    :toast="toast"
    :isDark="isDark"
    :showTheme="true"
    @refresh="refresh"
    @logout="logout"
    @toggleTheme="toggleTheme"
  >
    <NuxtPage />
  </AppSidebar>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useAppState, useExtState } from '~/composables/useAppState'

definePageMeta({ middleware: 'auth' })

const { user, fetchMe, logout: authLogout } = useAuth()
const { manager } = useApi()
const { load, pendingNoticeRequests, pendingNoticeDeliveries } = useAppState()
const { extState } = useExtState()

// عدد طلبات الصيانة من بوابة المستأجرين (portal localStorage)
const pendingMaintReqCount = ref(0)
function loadPortalBadge() {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem('portal-maintenance-requests')
    const reqs = raw ? JSON.parse(raw) : []
    pendingMaintReqCount.value = reqs.filter((r: any) => r.status === 'pending').length
  } catch { pendingMaintReqCount.value = 0 }
}

// ── session ──
const session = computed(() => ({
  id:   String(user.value?.id  || ''),
  name: user.value?.name       || '',
  role: user.value?.type       || '',
}))

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    general_manager:          'مشرف عام',
    real_estate_supervisor:   'مشرف عقارات',
    collection_supervisor:    'مشرف تحصيل',
    maintenance_supervisor:   'مشرف صيانة',
    supervisor:               'مشرف نظام',
  }
  return map[user.value?.type ?? ''] || user.value?.type_label || 'مشرف'
})

// ── dark mode ──
const isDark = ref(false)
function applyTheme(t: string) {
  document.documentElement.setAttribute('data-theme', t)
  const m = document.querySelector('meta[name="theme-color"]')
  if (m) m.setAttribute('content', t === 'dark' ? '#0E0D0B' : '#3A3733')
}
function toggleTheme() {
  isDark.value = !isDark.value
  const next = isDark.value ? 'dark' : 'light'
  document.documentElement.classList.add('theme-anim')
  applyTheme(next)
  try { localStorage.setItem('tahsilat-theme', next) } catch {}
  setTimeout(() => document.documentElement.classList.remove('theme-anim'), 380)
  showToastMsg(next === 'dark' ? 'تم التبديل إلى الوضع الداكن' : 'تم التبديل إلى الوضع الفاتح')
}

// ── sync / badges ──
const syncTime = ref('—')
const pendingCount = ref(0)
let _pollTimer: ReturnType<typeof setInterval> | null = null

// عدد طلبات التسويق الإضافي المعلّقة (من localStorage)
const pendingMrCount = computed(() =>
  extState.value.listings
    .flatMap(l => l.marketingRequests ?? [])
    .filter(mr => mr.status === 'pending').length
)

function getNow() {
  return new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
}

async function fetchDashboardData() {
  try {
    const data = await manager.approvals({ tab: 'pending' })
    pendingCount.value = data.tabs.pending_count
  } catch { /* silent */ }
  load()
  loadPortalBadge()
}

async function refresh() {
  await fetchDashboardData()
  syncTime.value = getNow()
  showToastMsg('تم تحديث البيانات')
}

// ── toast ──
const toast = ref('')
function showToastMsg(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2400)
}

// ── provide (للصفحات الفرعية) ──
provide('showToast',        showToastMsg)
provide('supervisorSession', session)
provide('refreshBadges',    fetchDashboardData)
provide('pendingCount',     pendingCount)

// ── nav ──
const navItems = computed(() => {
  const type = user.value?.type ?? ''
  const noticeBadge = (pendingNoticeRequests.value.length + pendingNoticeDeliveries.value.length) || null

  // مشرف الصيانة — قائمة مخصوصة
  if (type === 'maintenance_supervisor') {
    return [
      { to: '/supervisor/listings',       label: 'مهام العقارات الشاغرة' },
      { to: '/supervisor/featured',       label: 'التسويق المميز للعقارات' },
      { to: '/supervisor/maintenance',    label: 'أعمال الصيانة' },
      { to: '/supervisor/tenantrequests', label: 'طلبات صيانة المستأجرين', badge: pendingMaintReqCount.value || null },
      { to: '/supervisor/notices',        label: 'الإشعارات', badge: noticeBadge },
      { to: '/supervisor/smslog',         label: 'رسائلي (SMS)' },
      { to: '/supervisor/settings',       label: 'كلمة المرور والبيانات' },
    ]
  }

  // مشرف العقارات — بدون استيراد إكسل، صلاحيات، صيانة
  if (type === 'real_estate_supervisor') {
    return [
      { to: '/supervisor',                label: 'نظرة عامة' },
      { to: '/supervisor/tenants',        label: 'المستأجرون' },
      { to: '/supervisor/vacancies',      label: 'الشقق الشاغرة' },
      { to: '/supervisor/listings',       label: 'مهام العقارات الشاغرة' },
      { to: '/supervisor/featured',       label: 'التسويق المميز للعقارات' },
      { to: '/supervisor/unitreports',    label: 'تقارير الوحدات',           badge: pendingMrCount.value || null },
      { to: '/supervisor/payments',       label: 'اعتماد السدادات',   badge: pendingCount.value || null },
      { to: '/supervisor/ownerpayments',  label: 'سدادات الملاك' },
      { to: '/supervisor/notices',        label: 'الإشعارات',         badge: noticeBadge },
      { to: '/supervisor/properties',     label: 'إدارة الأملاك والعقود' },
      { to: '/supervisor/reports',        label: 'التقارير الشهرية' },
      { to: '/supervisor/smslog',         label: 'سجل رسائل SMS' },
      { to: '/supervisor/settings',       label: 'كلمة المرور والبيانات' },
    ]
  }

  // باقي المشرفين — القائمة الكاملة
  return [
    { to: '/supervisor',                label: 'نظرة عامة' },
    { to: '/supervisor/import',         label: 'استيراد إكسل' },
    { to: '/supervisor/tenants',        label: 'المستأجرون' },
    { to: '/supervisor/vacancies',      label: 'الشقق الشاغرة' },
    { to: '/supervisor/listings',       label: 'مهام العقارات الشاغرة' },
    { to: '/supervisor/featured',       label: 'التسويق المميز للعقارات' },
    { to: '/supervisor/unitreports',    label: 'تقارير الوحدات',                badge: pendingMrCount.value || null },
    { to: '/supervisor/collectors',     label: 'المستخدمون والصلاحيات' },
    { to: '/supervisor/payments',       label: 'اعتماد السدادات',          badge: pendingCount.value || null },
    { to: '/supervisor/ownerpayments',  label: 'سدادات الملاك' },
    { to: '/supervisor/notices',        label: 'الإشعارات',                badge: noticeBadge },
    { to: '/supervisor/properties',     label: 'إدارة الأملاك والعقود' },
    { to: '/supervisor/maintenance',    label: 'أعمال الصيانة' },
    { to: '/supervisor/tenantrequests', label: 'طلبات صيانة المستأجرين',   badge: pendingMaintReqCount.value || null },
    { to: '/supervisor/reports',        label: 'التقارير الشهرية' },
    { to: '/supervisor/smslog',         label: 'سجل رسائل SMS' },
    { to: '/supervisor/settings',       label: 'كلمة المرور والبيانات' },
  ]
})

async function logout() {
  await authLogout()
  navigateTo('/')
}

// ── lifecycle ──
onMounted(async () => {
  // ثيم
  try {
    const saved = localStorage.getItem('tahsilat-theme')
    if (saved === 'dark' || saved === 'light') {
      isDark.value = saved === 'dark'; applyTheme(saved)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark; applyTheme(prefersDark ? 'dark' : 'light')
    }
  } catch {}

  await fetchMe()
  syncTime.value = getNow()
  await fetchDashboardData()

  // polling كل 10 ثواني
  _pollTimer = setInterval(fetchDashboardData, 10_000)
})

onUnmounted(() => { if (_pollTimer) clearInterval(_pollTimer) })

// تحديث badges عند التنقل
watch(() => useRoute().path, fetchDashboardData)
</script>
