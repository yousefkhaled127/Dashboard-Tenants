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

definePageMeta({ middleware: 'auth' })

const { user, fetchMe, logout: authLogout } = useAuth()

const syncTime = ref('—')
const toast    = ref('')

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
  syncTime.value = getNow()
  showToastMsg('تم التحديث')
}

function showToastMsg(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2400)
}

provide('showToast',    showToastMsg)
provide('ownerSession', computed(() => ({
  id:   user.value?.id,
  name: user.value?.name,
  role: user.value?.type,
})))

const navItems = [
  { to: '/owner',             label: 'نظرة عامة' },
  { to: '/owner/payments',    label: 'سدادات وحداتي' },
  { to: '/owner/properties',  label: 'إدارة أملاكي' },
  { to: '/owner/maintenance', label: 'أعمال الصيانة' },
  { to: '/owner/sms',         label: 'الرسائل (SMS)' },
  { to: '/owner/reports',     label: 'التقارير الشهرية' },
  { to: '/owner/settings',    label: 'كلمة المرور' },
]

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
})
</script>
