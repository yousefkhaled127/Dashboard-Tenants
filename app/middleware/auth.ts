// ============================================================
// middleware/auth — حماية المسارات
// يعمل على الـ client فقط (لأن التوكن في cookie + localStorage)
// يُسمى تلقائياً من definePageMeta({ middleware: 'auth' })
// في layouts: supervisor.vue, collector.vue, owner.vue
// ============================================================

import { useAuth } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware((to) => {
  // تشغيل client-side فقط (التوكن مش متاح SSR بشكل موثوق)
  if (import.meta.server) return

  const { token, user } = useAuth()

  // لو ما في توكن — اعمل redirect للصفحة الرئيسية
  if (!token.value) {
    return navigateTo('/')
  }

  // تحديد الدور المطلوب من مسار الـ URL
  const path = to.path

  const SUPERVISOR_TYPES = [
    'supervisor',
    'general_manager',
    'real_estate_supervisor',
    'collection_supervisor',
    'maintenance_supervisor',
  ]

  if (path.startsWith('/supervisor')) {
    if (user.value && !SUPERVISOR_TYPES.includes(user.value.type)) {
      return navigateTo('/')
    }
  } else if (path.startsWith('/collector')) {
    if (user.value && user.value.type !== 'collector') {
      return navigateTo('/')
    }
  } else if (path.startsWith('/owner')) {
    if (user.value && user.value.type !== 'owner') {
      return navigateTo('/')
    }
  }
})
