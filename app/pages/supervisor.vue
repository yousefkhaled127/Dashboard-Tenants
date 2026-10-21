<template>
  <div class="shell">

    <!-- ===== MOBILE TOPBAR ===== -->
    <div class="mobile-topbar">
      <button class="menu-toggle" @click="mobileOpen = !mobileOpen">☰</button>
      <div style="display:flex;align-items:center;gap:8px;">
        <svg width="26" height="26" viewBox="0 0 100 100" fill="none">
          <path d="M50 8 L84 30 V38 L50 17 L16 38 V30 Z" fill="#3A3733"/>
          <path d="M12 42 L50 18 L88 42 V54 L50 30 L12 54 Z" fill="#E1712F"/>
          <path d="M29 50 L46 40 V70 L29 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
          <path d="M71 50 L54 40 V70 L71 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
          <rect x="46" y="42" width="8" height="46" fill="#3A3733"/>
          <rect x="44" y="30" width="6" height="6" fill="#3A3733"/>
          <rect x="52" y="30" width="6" height="6" fill="#3A3733"/>
        </svg>
        <div>
          <div style="font-weight:800;font-size:13px;color:#fff;">مؤسسة سعود علي السقامي</div>
          <div style="font-size:9px;color:#E1712F;letter-spacing:.3px;">SAUD ALI ALSAQAMI · TAHSILAT</div>
        </div>
      </div>
      <div style="width:38px"></div>
    </div>

    <!-- overlay -->
    <div class="sidebar-overlay" :class="{ show: mobileOpen }" @click="mobileOpen = false" />

    <!-- ===== SIDEBAR ===== -->
    <aside class="sidebar" :class="{ open: mobileOpen }">

      <!-- Brand Block -->
      <div class="brand-block">
        <svg width="42" height="42" viewBox="0 0 100 100" fill="none" style="flex-shrink:0;">
          <path d="M50 8 L84 30 V38 L50 17 L16 38 V30 Z" fill="#3A3733"/>
          <path d="M12 42 L50 18 L88 42 V54 L50 30 L12 54 Z" fill="#E1712F"/>
          <path d="M29 50 L46 40 V70 L29 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
          <path d="M71 50 L54 40 V70 L71 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
          <rect x="46" y="42" width="8" height="46" fill="#3A3733"/>
          <rect x="44" y="30" width="6" height="6" fill="#3A3733"/>
          <rect x="52" y="30" width="6" height="6" fill="#3A3733"/>
        </svg>
        <div class="brand-text">
          <div class="brand-ar">مؤسسة سعود علي السقامي</div>
          <div class="brand-en">SAUD ALI ALSAQAMI · TAHSILAT</div>
        </div>
      </div>

      <!-- User Info -->
      <div class="side-user">
        <div class="side-user-name">{{ session.name }}</div>
        <div class="side-user-role">مشرف نظام</div>
      </div>

      <!-- Nav -->
      <nav class="nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-btn"
          :class="{ active: $route.path === item.to }"
          @click="mobileOpen = false"
        >
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </NuxtLink>
      </nav>

      <!-- Sync -->
      <div class="sync-box">
        <div class="sync-row">
          <button class="sync-btn" @click="refresh">↻ تحديث البيانات</button>
          <button class="theme-sq" @click="toggleTheme" :title="isDark ? 'الوضع الفاتح' : 'الوضع الداكن'">
            <svg v-if="isDark" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="4.2"/>
              <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
            </svg>
          </button>
        </div>
        <div class="sync-time">آخر مزامنة: {{ syncTime }}</div>
      </div>

      <button class="logout-btn" @click="logout">تسجيل الخروج</button>
      <div class="version-tag">v1.0 (معتمد)</div>
    </aside>

    <!-- ===== MAIN ===== -->
    <main class="main">
      <NuxtPage />
    </main>

    <!-- ===== TOAST ===== -->
    <Transition name="toast-fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useAppState } from '~/composables/useAppState'

const { user, fetchMe, requireRole, logout: authLogout } = useAuth()
const { supervisor } = useApi()

// useAppState فقط للصفحات التي لم تُربط بالـ API بعد (إشعارات/صيانة)
const { load, pendingNoticeRequests, pendingNoticeDeliveries, pendingMaintReqCount } = useAppState()

// ── session (متاح للصفحات الفرعية عبر inject) ──
const session = computed(() => ({ id: String(user.value?.id || ''), name: user.value?.name || '', role: user.value?.type || '' }))

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
  const html = document.documentElement
  html.classList.add('theme-anim')
  applyTheme(next)
  try { localStorage.setItem('tahsilat-theme', next) } catch {}
  setTimeout(() => html.classList.remove('theme-anim'), 380)
  showToastMsg(next === 'dark' ? 'تم التبديل إلى الوضع الداكن' : 'تم التبديل إلى الوضع الفاتح')
}

// ── mobile ──
const mobileOpen = ref(false)
watch(() => useRoute().path, () => { mobileOpen.value = false })

// ── sync time ──
const syncTime = ref('—')

function getNow() {
  return new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
}

const pendingCount        = ref(0)
const pendingOwnerPays    = ref(0)   // سدادات الملاك الجديدة
let   _pollTimer: ReturnType<typeof setInterval> | null = null

async function refresh() {
  await fetchDashboardData()
  syncTime.value = getNow()
  showToastMsg('تم تحديث البيانات')
}

async function fetchDashboardData() {
  try {
    const data = await supervisor.approvals({ tab: 'pending' })
    pendingCount.value = data.tabs.pending_count
  } catch { /* تجاهل */ }
  // load useAppState للصفحات غير المرتبطة بالـ API
  load()
}

onMounted(async () => {
  // تطبيق الثيم المحفوظ
  try {
    const saved = localStorage.getItem('tahsilat-theme')
    if (saved === 'dark' || saved === 'light') {
      isDark.value = saved === 'dark'
      applyTheme(saved)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark
      applyTheme(prefersDark ? 'dark' : 'light')
    }
  } catch {}
  if (!requireRole('supervisor')) return
  await fetchMe()
  if (!requireRole('supervisor')) return
  syncTime.value = getNow()
  await fetchDashboardData()
})

// ── polling كل 10 ثواني لتحديث الـ badges ──
onMounted(() => {
  _pollTimer = setInterval(() => fetchDashboardData(), 10000)
})
onUnmounted(() => {
  if (_pollTimer) clearInterval(_pollTimer)
})

// ── تحديث الـ badges عند التنقل بين الصفحات ──
watch(() => useRoute().path, () => {
  fetchDashboardData()
})

// ── toast ──
const toast = ref('')
function showToastMsg(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2400)
}
provide('showToast', showToastMsg)
provide('supervisorSession', session)
// ── provide pendingCount عشان الصفحات الفرعية تقدر تحدّثه فور رفع سداد ──
provide('refreshBadges', fetchDashboardData)
provide('pendingCount', pendingCount)

// ── nav ──
const navItems = computed(() => [
  { to: '/supervisor',                label: 'نظرة عامة' },
  { to: '/supervisor/import',         label: 'استيراد إكسل' },
  { to: '/supervisor/tenants',        label: 'المستأجرون' },
  { to: '/supervisor/vacancies',      label: 'الشقق الشاغرة' },
  { to: '/supervisor/listings',       label: 'مهام العقارات الشاغرة' },
  { to: '/supervisor/featured',       label: 'التسويق المميز للعقارات' },
  { to: '/supervisor/collectors',     label: 'المستخدمون والصلاحيات' },
  { to: '/supervisor/payments',       label: 'اعتماد السدادات',          badge: pendingCount.value || null },
  { to: '/supervisor/ownerpayments',  label: 'سدادات الملاك' },
  { to: '/supervisor/notices',        label: 'الإشعارات',                badge: (pendingNoticeRequests.value.length + pendingNoticeDeliveries.value.length) || null },
  { to: '/supervisor/properties',     label: 'إدارة الأملاك والعقود' },
  { to: '/supervisor/maintenance',    label: 'أعمال الصيانة' },
  { to: '/supervisor/tenantrequests', label: 'طلبات صيانة المستأجرين',   badge: pendingMaintReqCount.value || null },
  { to: '/supervisor/reports',        label: 'التقارير الشهرية' },
  { to: '/supervisor/smslog',         label: 'سجل رسائل SMS' },
  { to: '/supervisor/settings',       label: 'كلمة المرور والبيانات' },
])

async function logout() {
  await authLogout()
  navigateTo('/')
}
</script>

<style scoped>
/* ── shell ── */
.shell { display:flex; min-height:100vh; }

/* ── sidebar ── */
.sidebar {
  width:236px; flex-shrink:0; background:#3A3733; color:#fff;
  display:flex; flex-direction:column; padding:20px 16px;
  position:sticky; top:0; height:100vh; overflow-y:auto;
}

/* Brand block */
.brand-block {
  display:flex; align-items:center; gap:12px;
  padding-bottom:16px;
  border-bottom:1px solid rgba(255,255,255,.1);
  flex-shrink:0;
}
.brand-text { line-height:1.3; }
.brand-ar { font-weight:800; font-size:13.5px; color:#fff; }
.brand-en { 
      font-weight: 700;
    font-size: 11px;
    color: var(--orange);
    letter-spacing: .3px;
}

/* User */
.side-user { margin:16px 0 4px; padding:12px 14px; background:rgba(255,255,255,.07); border-radius:12px; flex-shrink:0; }
.side-user-name { font-weight:800; font-size:14px; }
.side-user-role { font-size:11.5px; color:#D9C9BB; margin-top:2px; }

/* Nav */
.nav { display:flex; flex-direction:column; gap:3px; margin-top:14px; flex:1; overflow-y:auto; min-height:0; }
.nav::-webkit-scrollbar { width:4px; }
.nav::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:10px; }

.nav-btn {
  display:flex; align-items:center; gap:10px; padding:10px 12px;
  border-radius:10px; color:#D8D3CC; font-weight:700; font-size:13px;
  text-decoration:none; transition:.15s;
}
.nav-btn:hover { background:rgba(255,255,255,.07); color:#fff; }
.nav-btn.active { background:#E1712F; color:#fff; }

.nav-badge {
  margin-right: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 20px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
  animation: badgePop .25s ease;
}
@keyframes badgePop {
  0%   { transform: scale(0); }
  80%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Sync */
.sync-box { padding-top:10px; flex-shrink:0; }
.sync-row { display:flex; gap:6px; margin-bottom:6px; }
.sync-btn {
  flex:1; background:rgba(225,113,47,.18); border:none; color:#F3C7A6;
  padding:9px 12px; border-radius:9px; font-weight:700; font-size:12.5px;
  cursor:pointer; font-family:inherit; transition:.15s;
}
.sync-btn:hover { background:rgba(225,113,47,.32); color:#fff; }
.theme-sq {
  flex-shrink:0; width:40px; border:none; border-radius:9px;
  background:rgba(255,255,255,.08); color:#F3C7A6;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:.15s;
}
.theme-sq:hover { background:rgba(255,255,255,.18); color:#fff; }
.sync-time { font-size:10.5px; color:#9A948B; text-align:center; margin-bottom:8px; }

/* Logout */
.logout-btn {
  background:rgba(255,255,255,.07); border:none; color:#D8D3CC;
  padding:11px 12px; border-radius:10px; font-weight:700; font-size:13px;
  text-align:right; cursor:pointer; flex-shrink:0; width:100%;
  font-family:inherit; transition:.15s;
}
.logout-btn:hover { background:rgba(255,255,255,.14); color:#fff; }

.version-tag { font-size:10px; color:#7A756D; text-align:center; margin-top:6px; letter-spacing:.3px; flex-shrink:0; }

/* Main */
.main { flex:1; min-width:0; padding:28px 32px; }

/* Mobile topbar */
.mobile-topbar { display:none; }
.sidebar-overlay { display:none; }

@media(max-width:900px) {
  .shell { flex-direction:column; }
  .mobile-topbar {
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    background:#3A3733; color:#fff; padding:12px 16px;
    position:sticky; top:0; z-index:60;
  }
  .menu-toggle {
    background:rgba(255,255,255,.1); border:none; color:#fff;
    width:38px; height:38px; border-radius:9px; font-size:18px; cursor:pointer;
  }
  .sidebar-overlay {
    display:block; position:fixed; inset:0;
    background:rgba(20,18,16,.5); z-index:70;
    opacity:0; pointer-events:none; transition:opacity .2s;
  }
  .sidebar-overlay.show { opacity:1; pointer-events:auto; }
  .sidebar {
    position:fixed; top:0; right:0; height:100vh; z-index:80;
    width:78vw; max-width:280px;
    transform:translateX(100%); transition:transform .25s;
    box-shadow:-14px 0 34px rgba(0,0,0,.3);
  }
  .sidebar.open { transform:translateX(0); }
  .main { padding:18px 14px; }
}

/* Toast */
.toast {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
  background:#3A3733; color:#fff; padding:12px 22px; border-radius:10px;
  font-weight:700; font-size:13.5px; z-index:200;
  box-shadow:0 10px 30px rgba(0,0,0,.25); white-space:nowrap;
}
.toast-fade-enter-active, .toast-fade-leave-active { transition:opacity .25s, transform .25s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity:0; transform:translateX(-50%) translateY(10px); }
</style>
