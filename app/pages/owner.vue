<template>
  <AppSidebar
    :userName="user?.name || '...'"
    roleLabel="مالك وحدة"
    :navItems="navItems"
    :syncTime="syncTime"
    :toast="toast"
    @refresh="refresh"
    @logout="logout"
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
  { to: '/owner',            label: 'نظرة عامة' },
  { to: '/owner/payments',   label: 'سدادات وحداتي' },
  { to: '/owner/properties', label: 'إدارة أملاكي' },
  { to: '/owner/vacancies',  label: 'الشقق الشاغرة' },
  { to: '/owner/listings',   label: 'مهام العقارات الشاغرة' },
  { to: '/owner/settings',   label: 'كلمة المرور' },
]

async function logout() {
  await authLogout()
  navigateTo('/')
}

onMounted(async () => {
  await fetchMe()
  syncTime.value = getNow()
})
</script>
