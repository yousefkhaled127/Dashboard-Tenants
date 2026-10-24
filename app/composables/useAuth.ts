// ============================================================
// useAuth — واجهة موحّدة للمصادقة
// الحالة تُخزَّن في Pinia store (useAuthStore)
// الـ composable ده هو الـ public API — لا تُكسَر التوافقية
// ============================================================

import { useAuthStore } from '~/stores/auth'

export function useAuth() {
  const store = useAuthStore()
  const { auth } = useApi()

  // ── expose store state مباشرة (reactive) ──
  const { token, user, isLoggedIn, role, isSupervisor, isCollector, isOwner } = storeToRefs(store)

  /** تسجيل الدخول — user_id رقم (من قائمة users-by-type) */
  async function login(userId: number, password: string, type: string) {
    const data = await auth.login({ user_id: userId, password, type })
    store.setSession(data.token, data.user)
    return data.user
  }

  /** تسجيل الخروج */
  async function logout() {
    try { await auth.logout() } catch { /* silent */ }
    store.clearSession()
  }

  /** جلب بيانات المستخدم الحالي من /auth/me */
  async function fetchMe() {
    await store.refreshUser()
  }

  /**
   * التحقق من الدور — يعيد false ويعمل redirect لو الـ role غلط.
   * لا يزال مستخدماً في layout files كـ safety net إضافية.
   */
  function requireRole(expected: string | string[]): boolean {
    const types = Array.isArray(expected) ? expected : [expected]
    if (!token.value) { navigateTo('/'); return false }
    if (!user.value) return true   // لسه بيتحمّل
    const normalized = types
      .flatMap(t => t === 'supervisor'
        ? ['supervisor', 'general_manager', 'real_estate_supervisor', 'collection_supervisor', 'maintenance_supervisor']
        : [t])
    if (!normalized.includes(user.value.type)) { navigateTo('/'); return false }
    return true
  }

  return {
    token, user,
    isLoggedIn, role, isSupervisor, isCollector, isOwner,
    login, logout, fetchMe, requireRole,
  }
}
