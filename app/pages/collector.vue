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

    <!-- Overlay -->
    <div class="sidebar-overlay" :class="{ show: mobileOpen }" @click="mobileOpen = false" />

    <!-- ===== SIDEBAR ===== -->
    <aside class="sidebar" :class="{ open: mobileOpen }">

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

      <div class="side-user">
        <div class="side-user-name">{{ session.name }}</div>
        <div class="side-user-role">محصّل</div>
      </div>

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

      <div class="sync-box">
        <button class="sync-btn" @click="refresh">↻ تحديث البيانات</button>
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
import { useAppState } from '~/composables/useAppState'

const { state, load, myTenants, collectorAlerts } = useAppState()

const session = ref({ name: '', id: '' })
const mobileOpen = ref(false)
const syncTime = ref('—')
const toast = ref('')

watch(() => useRoute().path, () => { mobileOpen.value = false })

function getNow() {
  return new Date().toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
}

function refresh() {
  load()
  syncTime.value = getNow()
  showToastMsg('تم تحديث البيانات')
}

onMounted(() => {
  load()
  syncTime.value = getNow()
  try {
    const raw = localStorage.getItem('tahsilat-session')
    if (!raw) { navigateTo('/'); return }
    const s = JSON.parse(raw)
    if (s.role !== 'collector') { navigateTo('/'); return }
    session.value = s
  } catch { navigateTo('/') }
})

function showToastMsg(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2400)
}
provide('showToast', showToastMsg)
provide('collectorSession', session)

// ── nav badges ──
const alertsCount = computed(() => {
  if (!session.value.id) return 0
  return collectorAlerts(session.value.id).length
})

const noticesToDeliver = computed(() => {
  if (!session.value.id) return 0
  return state.value.notices.filter(n => n.collectorId === session.value.id && n.status === 'issued').length
})

const navItems = computed(() => [
  { to: '/collector',          label: 'محفظتي' },
  { to: '/collector/tenants',  label: 'مستأجروني' },
  { to: '/collector/submit',   label: 'رفع سداد' },
  { to: '/collector/payments', label: 'سداداتي' },
  { to: '/collector/notices',  label: 'طلبات الإشعارات', badge: noticesToDeliver.value || null },
  { to: '/collector/alerts',   label: 'التنبيهات',        badge: alertsCount.value || null },
  { to: '/collector/settings', label: 'كلمة المرور' },
])

function logout() {
  localStorage.removeItem('tahsilat-session')
  navigateTo('/')
}
</script>

<style scoped>
.shell { display:flex; min-height:100vh; }
.sidebar {
  width:236px; flex-shrink:0; background:#3A3733; color:#fff;
  display:flex; flex-direction:column; padding:20px 16px;
  position:sticky; top:0; height:100vh; overflow-y:auto;
}
.brand-block { display:flex; align-items:center; gap:12px; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,.1); flex-shrink:0; }
.brand-text { line-height:1.3; }
.brand-ar { font-weight:800; font-size:13.5px; color:#fff; }
.brand-en { 
      font-weight: 700;
    font-size: 11px;
    color: var(--orange);
    letter-spacing: .3px;
}
.side-user { margin:16px 0 4px; padding:12px 14px; background:rgba(255,255,255,.07); border-radius:12px; flex-shrink:0; }
.side-user-name { font-weight:800; font-size:14px; }
.side-user-role { font-size:11.5px; color:#D9C9BB; margin-top:2px; }
.nav { display:flex; flex-direction:column; gap:3px; margin-top:14px; flex:1; overflow-y:auto; min-height:0; }
.nav::-webkit-scrollbar { width:4px; }
.nav::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:10px; }
.nav-btn { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; color:#D8D3CC; font-weight:700; font-size:13px; text-decoration:none; transition:.15s; }
.nav-btn:hover { background:rgba(255,255,255,.07); color:#fff; }
.nav-btn.active { background:#E1712F; color:#fff; }
.nav-badge { margin-right:auto; background:#B3452F; color:#fff; font-size:10px; font-weight:800; border-radius:20px; padding:1px 7px; }
.sync-box { padding-top:10px; flex-shrink:0; }
.sync-btn { width:100%; background:rgba(225,113,47,.18); border:none; color:#F3C7A6; padding:9px 12px; border-radius:9px; font-weight:700; font-size:12.5px; margin-bottom:6px; cursor:pointer; font-family:inherit; transition:.15s; }
.sync-btn:hover { background:rgba(225,113,47,.32); color:#fff; }
.sync-time { font-size:10.5px; color:#9A948B; text-align:center; margin-bottom:8px; }
.logout-btn { background:rgba(255,255,255,.07); border:none; color:#D8D3CC; padding:11px 12px; border-radius:10px; font-weight:700; font-size:13px; text-align:right; cursor:pointer; flex-shrink:0; width:100%; font-family:inherit; transition:.15s; }
.logout-btn:hover { background:rgba(255,255,255,.14); color:#fff; }
.version-tag { font-size:10px; color:#7A756D; text-align:center; margin-top:6px; letter-spacing:.3px; flex-shrink:0; }
.main { flex:1; min-width:0; padding:28px 32px; }
.mobile-topbar { display:none; }
.sidebar-overlay { display:none; }
@media(max-width:900px) {
  .shell { flex-direction:column; }
  .mobile-topbar { display:flex; align-items:center; justify-content:space-between; gap:10px; background:#3A3733; color:#fff; padding:12px 16px; position:sticky; top:0; z-index:60; }
  .menu-toggle { background:rgba(255,255,255,.1); border:none; color:#fff; width:38px; height:38px; border-radius:9px; font-size:18px; cursor:pointer; }
  .sidebar-overlay { display:block; position:fixed; inset:0; background:rgba(20,18,16,.5); z-index:70; opacity:0; pointer-events:none; transition:opacity .2s; }
  .sidebar-overlay.show { opacity:1; pointer-events:auto; }
  .sidebar { position:fixed; top:0; right:0; height:100vh; z-index:80; width:78vw; max-width:280px; transform:translateX(100%); transition:transform .25s; box-shadow:-14px 0 34px rgba(0,0,0,.3); }
  .sidebar.open { transform:translateX(0); }
  .main { padding:18px 14px; }
}
.toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#3A3733; color:#fff; padding:12px 22px; border-radius:10px; font-weight:700; font-size:13.5px; z-index:200; box-shadow:0 10px 30px rgba(0,0,0,.25); white-space:nowrap; }
.toast-fade-enter-active, .toast-fade-leave-active { transition:opacity .25s, transform .25s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity:0; transform:translateX(-50%) translateY(10px); }
</style>
