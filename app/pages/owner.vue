<template>
  <AppSidebar
    :userName="user?.name || '...'"
    roleLabel="مالك وحدة"
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
import { useApi  } from '~/composables/useApi'
import { useExtState } from '~/composables/useAppState'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth' })

const { user, fetchMe, logout: authLogout } = useAuth()
const { owner } = useApi()
const { extState, load, lsOwnerName } = useExtState()
const authStore = useAuthStore()

const syncTime = ref('—')
const toast    = ref('')

// ── badge counts ──
const pendingMaintCount = ref(0)   // أعمال الصيانة بانتظار قرار المالك
const pendingSmsCount   = ref(0)   // طلبات صيانة محوّلة للمالك (الرسائل)
const pendingPayCount   = ref(0)   // سدادات قيد المراجعة

// عدد طلبات التسويق الإضافي المعلّقة (من localStorage)
const pendingMrCount = computed(() => {
  const ownerName = authStore.user?.name?.trim().toLowerCase() || ''
  const ownerId   = authStore.user?.id
  return extState.value.listings
    .filter(l => {
      if (l.kind === 'external') return false
      if (ownerId && l.ownerId && String(l.ownerId) === String(ownerId)) return true
      const ln = (lsOwnerName(l) || '').trim().toLowerCase()
      return ownerName && ln && ln === ownerName
    })
    .flatMap(l => l.marketingRequests ?? [])
    .filter(mr => mr.status === 'pending').length
})

let _pollTimer: ReturnType<typeof setInterval> | null = null

async function fetchDashboardData() {
  try {
    const [maintRes, reqRes, payRes] = await Promise.allSettled([
      owner.maintenanceWorks({}),
      owner.maintenanceRequests({}),
      owner.payments({ status: 'pending', page: 1 }),
    ])

    if (maintRes.status === 'fulfilled') {
      pendingMaintCount.value = maintRes.value?.counters?.pending_count
        ?? (maintRes.value?.pending_list?.length || 0)
    }

    if (reqRes.status === 'fulfilled') {
      pendingSmsCount.value = reqRes.value?.counters?.pending_count
        ?? (reqRes.value?.pending_requests?.length || 0)
    }

    if (payRes.status === 'fulfilled') {
      pendingPayCount.value = payRes.value?.pagination?.total ?? 0
    }
  } catch { /* silent */ }
}

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

async function refresh() {
  await fetchDashboardData()
  syncTime.value = getNow()
  showToastMsg('تم التحديث')
}

function showToastMsg(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2400)
}

provide('showToast',      showToastMsg)
provide('refreshBadges',  fetchDashboardData)
provide('ownerSession', computed(() => ({
  id:   user.value?.id,
  name: user.value?.name,
  role: user.value?.type,
})))

const navItems = computed(() => [
  { to: '/owner',             label: 'نظرة عامة' },
  { to: '/owner/payments',    label: 'سدادات وحداتي',   badge: pendingPayCount.value   || null },
  { to: '/owner/properties',  label: 'إدارة أملاكي' },
  { to: '/owner/maintenance', label: 'أعمال الصيانة',   badge: pendingMaintCount.value || null },
  { to: '/owner/sms',         label: 'الرسائل (SMS)',    badge: pendingSmsCount.value   || null },
  { to: '/owner/unitreports', label: 'تقارير وحداتي',   badge: pendingMrCount.value || null },
  { to: '/owner/reports',     label: 'التقارير الشهرية' },
  { to: '/owner/settings',    label: 'كلمة المرور' },
])

async function logout() {
  await authLogout()
  navigateTo('/')
}

// تحديث badges عند التنقل بين الصفحات
watch(() => useRoute().path, fetchDashboardData)

onMounted(async () => {
  load()  // تحميل extState عشان يحسب pendingMrCount
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
</script>
