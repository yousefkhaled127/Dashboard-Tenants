<template>
  <div class="login-screen">

    <!-- Dark mode toggle -->
    <button class="theme-fab" :title="isDark ? 'الوضع الفاتح' : 'الوضع الداكن'" @click="toggleTheme">
      <svg v-if="isDark" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="4.2"/>
        <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
      </svg>
    </button>

    <div class="login-card">

      <!-- Logo + Title -->
      <div class="login-head">
        <div class="logo-wrap">
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
            <path d="M50 8 L84 30 V38 L50 17 L16 38 V30 Z" fill="#3A3733"/>
            <path d="M12 42 L50 18 L88 42 V54 L50 30 L12 54 Z" fill="#E1712F"/>
            <path d="M29 50 L46 40 V70 L29 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
            <path d="M71 50 L54 40 V70 L71 78 Z" fill="none" stroke="#E1712F" stroke-width="6"/>
            <rect x="46" y="42" width="8" height="46" fill="#3A3733"/>
            <rect x="44" y="30" width="6" height="6" fill="#3A3733"/>
            <rect x="52" y="30" width="6" height="6" fill="#3A3733"/>
          </svg>
        </div>
        <h1>نظام إدارة تحصيلات المستأجرين</h1>
        <p>مؤسسة سعود علي السقامي للعقارات</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="login-error">{{ error }}</div>

      <!-- Role Tabs -->
      <div class="role-tabs">
        <button
          v-for="tab in availableRoles"
          :key="tab.value"
          class="role-tab"
          :class="{ active: selectedRole === tab.value }"
          @click="selectRole(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Owner: login by national ID -->
      <template v-if="selectedRole === 'owner'">
        <div class="field">
          <label>رقم الهوية</label>
          <input
            v-model="nationalId"
            inputmode="numeric"
            placeholder="رقم الهوية المسجل لدى المؤسسة"
            @keydown.enter="login"
          />
        </div>
      </template>

      <!-- Supervisor / Collector: dropdown -->
      <template v-else>
        <div class="field">
          <label>الاسم</label>
          <select v-model="selectedUserId">
            <option :value="null">
              {{ loadingUsers ? 'جارٍ التحميل...' : filteredUsers.length ? 'اختر الاسم' : 'لا توجد نتائج' }}
            </option>
            <option v-for="u in filteredUsers" :key="u.id" :value="u.id">
              {{ u.display_name || u.name_with_type || u.name }}
            </option>
          </select>
        </div>
      </template>

      <!-- Password -->
      <div class="field">
        <label>كلمة المرور</label>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          @keydown.enter="login"
        />
      </div>

      <button class="btn-login" :disabled="loading" @click="login">
        {{ loading ? 'جارٍ الدخول...' : 'تسجيل الدخول' }}
      </button>

      <button class="btn-portal" @click="navigateTo('/portal')">بوابة المستأجرين — طلب صيانة</button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi, type Role, type UserByType } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const { auth } = useApi()
const { login: doLogin } = useAuth()

// ===== DARK MODE =====
const isDark = ref(false)

onMounted(() => {
  // اقرأ الوضع الحالي من الـ html element
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark'
})

function toggleTheme() {
  isDark.value = !isDark.value
  const html = document.documentElement
  html.classList.add('theme-anim')
  html.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  try { localStorage.setItem('tahsilat-theme', isDark.value ? 'dark' : 'light') } catch {}
  setTimeout(() => html.classList.remove('theme-anim'), 380)
}

// ===== STATIC FALLBACK DATA =====
const STATIC_ROLES: Role[] = [
  { value: 'supervisor', label: 'مشرف' },
  { value: 'collector',  label: 'محصل' },
  { value: 'owner',      label: 'مالك' },
]

const STATIC_USERS: Record<string, UserByType[]> = {
  supervisor: [
    { id: 1, value: 1, name: 'المشرف العام', username: 'admin', type: 'general_manager', type_label: 'مشرف عام', display_name: 'المشرف العام – مشرف عام' },
    { id: 2, value: 2, name: 'مشرف العقارات', username: 'realestate_supervisor', type: 'real_estate_supervisor', type_label: 'مشرف عقارات', display_name: 'مشرف العقارات – مشرف عقارات' },
    { id: 3, value: 3, name: 'مشرف التحصيل والمتابعة', username: 'collection_supervisor', type: 'collection_supervisor', type_label: 'مشرف تحصيل ومتابعة', display_name: 'مشرف التحصيل والمتابعة – مشرف تحصيل ومتابعة' },
    { id: 4, value: 4, name: 'مشرف الصيانة', username: 'maint1', type: 'maintenance_supervisor', type_label: 'مشرف صيانة', display_name: 'مشرف الصيانة – مشرف صيانة' },
  ],
  collector: [
    { id: 6, value: 6, name: 'المحصل الأول',  username: 'collector_1', type: 'collector', type_label: 'محصل', display_name: 'المحصل الأول' },
    { id: 7, value: 7, name: 'المحصل الثاني', username: 'collector_2', type: 'collector', type_label: 'محصل', display_name: 'المحصل الثاني' },
  ],
  owner: [],
}

// ===== STATE =====
const selectedRole   = ref('supervisor')
const selectedUserId = ref<number | null>(null)
const nationalId     = ref('')
const password       = ref('')
const error          = ref('')
const loading        = ref(false)
const loadingUsers   = ref(false)
const usersList      = ref<UserByType[]>(STATIC_USERS['supervisor'])

const availableRoles = ref<Role[]>(STATIC_ROLES)
const filteredUsers  = computed(() => usersList.value)

// ===== INIT =====
onMounted(async () => {
  // طبّق الثيم المحفوظ
  try {
    const saved = localStorage.getItem('tahsilat-theme')
    if (saved === 'dark' || saved === 'light') {
      isDark.value = saved === 'dark'
      document.documentElement.setAttribute('data-theme', saved)
    }
  } catch {}

  // لا نستخدم API للـ roles — نبقى على STATIC_ROLES دايماً
  await fetchUsers()
})

async function fetchUsers() {
  if (selectedRole.value === 'owner') { usersList.value = []; return }
  loadingUsers.value = true
  usersList.value = STATIC_USERS[selectedRole.value] ?? []
  try {
    const users = await auth.usersByType(selectedRole.value)
    if (users.length) usersList.value = users
  } catch {}
  loadingUsers.value = false
}

function selectRole(role: string) {
  selectedRole.value   = role
  selectedUserId.value = null
  nationalId.value     = ''
  password.value       = ''
  error.value          = ''
  usersList.value = STATIC_USERS[role] ?? []
  fetchUsers()
}

// ===== LOGIN =====
async function login() {
  error.value = ''

  // Owner login — رقم الهوية + كلمة المرور مباشرة للـ API
  if (selectedRole.value === 'owner') {
    if (!nationalId.value.trim()) { error.value = 'الرجاء إدخال رقم الهوية'; return }
    if (!password.value)           { error.value = 'الرجاء إدخال كلمة المرور'; return }
    loading.value = true
    try {
      const data = await auth.loginOwner({
        login: nationalId.value.trim(),
        password: password.value,
      })
      const { token: tk, user: us } = useAuth()
      tk.value = data.token
      us.value = data.user
      if (import.meta.client) localStorage.setItem('tahsilat-user', JSON.stringify(data.user))
      navigateTo('/owner')
    } catch (e: any) {
      error.value = extractError(e)
    } finally {
      loading.value = false
    }
    return
  }

  // Supervisor / Collector
  if (!selectedUserId.value) { error.value = 'الرجاء اختيار الاسم'; return }
  if (!password.value)        { error.value = 'الرجاء إدخال كلمة المرور'; return }

  loading.value = true
  try {
    const user = await doLogin(selectedUserId.value, password.value, selectedRole.value)
    const t = user.type
    if (t === 'owner') {
      navigateTo('/owner')
    } else if (t === 'collector') {
      navigateTo('/collector')
    } else {
      // all supervisor subtypes → /supervisor
      navigateTo('/supervisor')
    }
  } catch (e: any) {
    error.value = extractError(e)
  } finally {
    loading.value = false
  }
}

function extractError(e: any): string {
  const data = e?.data
  if (data?.message)  return data.message
  if (data?.errors) {
    const key = Object.keys(data.errors)[0]
    const val = data.errors[key]
    return Array.isArray(val) ? val[0] : val
  }
  return 'تعذّر تسجيل الدخول. تأكد من تشغيل الخادم.'
}
</script>

<style scoped>
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 15% 15%, rgba(225,113,47,.08), transparent 40%),
    radial-gradient(circle at 85% 85%, rgba(58,55,51,.06), transparent 40%),
    var(--bg);
  padding: 24px;
}

.login-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  width: 100%;
  max-width: 420px;
  padding: 36px 32px 30px;
  box-shadow: 0 20px 50px -25px rgba(46,43,39,.35);
}

.login-head { text-align: center; margin-bottom: 26px; }
.logo-wrap  { display: flex; justify-content: center; margin-bottom: 12px; }
.login-head h1 { font-size: 18px; margin: 0 0 4px; color: var(--charcoal); font-weight: 800; }
.login-head p  { margin: 0; color: var(--muted); font-size: 13px; }

.login-error {
  background: var(--danger-tint);
  color: var(--danger);
  border-radius: 9px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 14px;
  text-align: center;
}

/* Role Tabs */
.role-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: var(--bg);
  padding: 5px;
  border-radius: 12px;
}
.role-tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-weight: 700;
  font-size: 14px;
  transition: .15s;
  cursor: pointer;
}
.role-tab.active { background: var(--charcoal); color: #fff; }

/* Fields */
.field { margin-bottom: 14px; }
.field label {
  display: block;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 6px;
  font-weight: 700;
}
.field input,
.field select {
  width: 100%;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  outline: none;
  transition: .15s;
  font-family: inherit;
  font-size: 15px;
}
.field input:focus,
.field select:focus  { border-color: var(--orange); background: var(--surface); }
.field select:disabled { opacity: .6; }

/* Buttons */
.btn-login {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: var(--orange);
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: .15s;
  margin-top: 4px;
}
.btn-login:hover:not(:disabled) { background: var(--orange-dark); }
.btn-login:disabled { opacity: .6; cursor: default; }

.btn-portal {
  width: 100%;
  padding: 13px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: transparent;
  color: var(--charcoal);
  font-weight: 800;
  font-size: 14.5px;
  cursor: pointer;
  transition: .15s;
  margin-top: 10px;
}
.btn-portal:hover { border-color: var(--charcoal); }

@media (max-width: 480px) {
  .login-card { padding: 26px 18px 22px; }
}
</style>
