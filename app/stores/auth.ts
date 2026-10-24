// ============================================================
// stores/auth.ts — Pinia store للمصادقة
// يحل محل: useState('auth-user') + useCookie + localStorage
// scattered across useAuth.ts, index.vue, supervisor/collector/owner.vue
// ============================================================

import { defineStore } from 'pinia'
import type { AuthUser } from '~/composables/useApi'

const TOKEN_COOKIE  = 'tahsilat-token'
const USER_LS_KEY   = 'tahsilat-user'
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7   // 7 أيام

export const useAuthStore = defineStore('auth', () => {
  // ── Token (cookie — متاح SSR) ──
  const token = useCookie<string | null>(TOKEN_COOKIE, {
    maxAge:   TOKEN_MAX_AGE,
    sameSite: 'lax',
    default:  () => null,
  })

  // ── User (useState — shared across SSR + client) ──
  const user = useState<AuthUser | null>('auth-user', () => null)

  // ── Computed ──
  const isLoggedIn = computed(() => !!token.value)
  const role       = computed(() => user.value?.type ?? '')

  const isSupervisor = computed(() =>
    ['general_manager', 'real_estate_supervisor', 'collection_supervisor', 'maintenance_supervisor']
      .includes(role.value)
  )
  const isCollector = computed(() => role.value === 'collector')
  const isOwner     = computed(() => role.value === 'owner')

  // ── Hydrate user from localStorage on client ──
  function hydrateFromStorage() {
    if (!import.meta.client) return
    if (user.value) return              // جاهز
    if (!token.value) return            // ما في session
    try {
      const raw = localStorage.getItem(USER_LS_KEY)
      if (raw) user.value = JSON.parse(raw)
    } catch { /* silent */ }
  }

  // ── setSession — يُستدعى بعد login ──
  function setSession(newToken: string, newUser: AuthUser) {
    token.value = newToken
    user.value  = newUser
    if (import.meta.client) {
      try { localStorage.setItem(USER_LS_KEY, JSON.stringify(newUser)) } catch {}
    }
  }

  // ── clearSession — logout ──
  function clearSession() {
    token.value = null
    user.value  = null
    if (import.meta.client) {
      try { localStorage.removeItem(USER_LS_KEY) } catch {}
    }
  }

  // ── refreshUser — يجلب /auth/me ويحدّث الـ store ──
  async function refreshUser() {
    if (!token.value) return
    hydrateFromStorage()   // اعرض cached user أثناء الانتظار
    try {
      const { auth } = useApi()
      const fresh = await auth.me()
      user.value = fresh
      if (import.meta.client) {
        try { localStorage.setItem(USER_LS_KEY, JSON.stringify(fresh)) } catch {}
      }
    } catch (e: any) {
      // 401 = token انتهى
      if (e?.status === 401 || e?.response?.status === 401) {
        clearSession()
      }
      // network / 404 — خلي الـ cached user
    }
  }

  return {
    token, user,
    isLoggedIn, role, isSupervisor, isCollector, isOwner,
    hydrateFromStorage, setSession, clearSession, refreshUser,
  }
})
