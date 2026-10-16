// ============================================================
// useAuth — مصادقة قائمة على الـ API (v2)
// login يستخدم user_id (number) بدل login (string)
// token في cookie (متاح SSR) + user في useState
// ============================================================

import type { AuthUser } from './useApi'

export function useAuth() {
  const { auth } = useApi()
  const token = useCookie<string>('tahsilat-token', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  const user = useState<AuthUser | null>('auth-user', () => null)

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.type || '')

  /** تسجيل الدخول — user_id رقم (من قائمة users-by-type) */
  async function login(userId: number, password: string, type: string): Promise<AuthUser> {
    const data = await auth.login({ user_id: userId, password, type })
    token.value = data.token
    user.value = data.user
    // احفظ الـ user في localStorage عشان يتحمل بعد page navigation
    if (import.meta.client) {
      localStorage.setItem('tahsilat-user', JSON.stringify(data.user))
    }
    return data.user
  }

  /** تسجيل الخروج */
  async function logout() {
    try { await auth.logout() } catch { /* تجاهل */ }
    token.value = null
    user.value = null
    if (import.meta.client) localStorage.removeItem('tahsilat-user')
  }

  /** جلب بيانات المستخدم الحالي */
  async function fetchMe() {
    if (!token.value) { user.value = null; return }
    // أولاً حاول تحمل من localStorage
    if (!user.value && import.meta.client) {
      try {
        const raw = localStorage.getItem('tahsilat-user')
        if (raw) user.value = JSON.parse(raw)
      } catch {}
    }
    // بعدين جرب تحدّث من الـ API
    try {
      const fresh = await auth.me()
      user.value = fresh
      if (import.meta.client) localStorage.setItem('tahsilat-user', JSON.stringify(fresh))
    } catch (e: any) {
      // لو 401 يعني الـ token انتهى — اطلع
      if (e?.status === 401 || e?.response?.status === 401) {
        token.value = null
        user.value = null
        if (import.meta.client) localStorage.removeItem('tahsilat-user')
      }
      // أي error تاني (404, network) — خلي الـ user المحمّل من localStorage
    }
  }

  /** التحقق من الدور وإعادة التوجيه */
  function requireRole(expected: string | string[]) {
    const types = Array.isArray(expected) ? expected : [expected]
    if (!token.value) { navigateTo('/'); return false }
    // لو user مش محمّل بعد، اسمح بالمرور — fetchMe هيتحقق بعدين
    if (!user.value) return true
    // نقبل general_manager كـ supervisor
    const userType = user.value.type
    const normalized = types.map(t => t === 'supervisor' ? ['supervisor', 'general_manager', 'real_estate_supervisor', 'collection_supervisor', 'maintenance_supervisor'] : [t]).flat()
    if (!normalized.includes(userType)) { navigateTo('/'); return false }
    return true
  }

  return { token, user, isLoggedIn, role, login, logout, fetchMe, requireRole }
}
