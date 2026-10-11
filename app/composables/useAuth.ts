// ============================================================
// useAuth — مصادقة قائمة على الـ API
// token في cookie (متاح SSR) + user في useState
// ============================================================

import type { AuthUser, LoginResponse } from './useApi'

export function useAuth() {
  const { auth } = useApi()
  const token = useCookie<string>('tahsilat-token', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  const user = useState<AuthUser | null>('auth-user', () => null)

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.type || '')

  /** تسجيل الدخول */
  async function login(login: string, password: string, type: string): Promise<AuthUser> {
    const data = await auth.login({ login, password, type })
    token.value = data.token
    user.value = data.user
    return data.user
  }

  /** تسجيل الخروج */
  async function logout() {
    try {
      await auth.logout()
    } catch {
      // تجاهل الأخطاء — نظّف محليًا على أي حال
    }
    token.value = null
    user.value = null
  }

  /** جلب بيانات المستخدم الحالي (للتحقق من الـ token عند الإقلاع) */
  async function fetchMe() {
    if (!token.value) {
      user.value = null
      return
    }
    try {
      user.value = await auth.me()
    } catch {
      token.value = null
      user.value = null
    }
  }

  /** إعادة توجيه إن لم يكن مسجلاً أو لو النوع لا يطابق */
  function requireRole(expected: string | string[]) {
    const types = Array.isArray(expected) ? expected : [expected]
    if (!token.value || !user.value) {
      navigateTo('/')
      return false
    }
    if (!types.includes(user.value.type)) {
      navigateTo('/')
      return false
    }
    return true
  }

  return { token, user, isLoggedIn, role, login, logout, fetchMe, requireRole }
}
