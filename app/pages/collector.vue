<template>
  <AppSidebar
    :userName="session.name"
    roleLabel="محصّل"
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
import { useAppState } from '~/composables/useAppState'

definePageMeta({ middleware: 'auth' })

const { user, fetchMe, logout: authLogout } = useAuth()
const { collector } = useApi()
const { state, load } = useAppState()

const session = computed(() => ({
  id:   String(user.value?.id  || ''),
  name: user.value?.name       || '',
  role: user.value?.type       || '',
}))

const syncTime = ref('—')
const toast    = ref('')
const alertsCount      = ref(0)
const noticesToDeliver = ref(0)

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

function getNow() {
  return new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
}

const monthKey = () =>
  new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0')

async function fetchDashboardData() {
  try {
    await collector.tenants({ period: monthKey() })
    alertsCount.value = 0
  } catch { /* silent */ }
  load()
  noticesToDeliver.value = state.value.notices.filter(
    n => n.collectorId === String(user.value?.id || '') && n.status === 'issued'
  ).length
}

async function refresh() {
  await fetchDashboardData()
  syncTime.value = getNow()
  showToastMsg('تم تحديث البيانات')
}

function showToastMsg(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2400)
}

provide('showToast',        showToastMsg)
provide('collectorSession', session)

const navItems = computed(() => [
  { to: '/collector',           label: 'محفظتي' },
  { to: '/collector/tenants',   label: 'مستأجروني' },
  { to: '/collector/submit',    label: 'رفع سداد' },
  { to: '/collector/payments',  label: 'سداداتي' },
  { to: '/collector/notices',   label: 'طلبات الإشعارات', badge: noticesToDeliver.value || null },
  { to: '/collector/vacancies', label: 'الشقق الشاغرة' },
  { to: '/collector/listings',  label: 'مهام العقارات الشاغرة' },
  { to: '/collector/featured',  label: 'التسويق المميز' },
  { to: '/collector/alerts',    label: 'التنبيهات',       badge: alertsCount.value || null },
  { to: '/collector/settings',  label: 'كلمة المرور' },
])

async function logout() {
  await authLogout()
  navigateTo('/')
}

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
})
</script>
