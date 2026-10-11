<template>
  <div class="login-screen">
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

      <!-- Name -->
      <div class="field">
        <label>الاسم</label>
        <select v-model="selectedUser">
          <option value="">{{ filteredUsers.length ? 'اختر الاسم' : 'لا توجد نتائج' }}</option>
          <option v-for="u in filteredUsers" :key="u.id" :value="u.username">{{ u.name }}</option>
        </select>
      </div>

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

// ===== FALLBACK STATIC DATA =====
// تظهر فوراً حتى لو الـ API مش شغال
const STATIC_ROLES: Role[] = [
  { value: 'supervisor', label: 'مشرف' },
  { value: 'collector',  label: 'محصل' },
  { value: 'owner',      label: 'مالك' },
]

const STATIC_USERS: Record<string, UserByType[]> = {
  supervisor: [
    { id: 1, name: 'المشرف الأول',  username: 'supervisor1' },
    { id: 2, name: 'المشرف الثاني', username: 'supervisor2' },
    { id: 3, name: 'المشرف الثالث', username: 'supervisor3' },
  ],
  collector: [
    { id: 4, name: 'المحصل الأول',  username: 'collector1' },
    { id: 5, name: 'المحصل الثاني', username: 'collector2' },
    { id: 6, name: 'المحصل الثالث', username: 'collector3' },
  ],
  owner: [
    { id: 7, name: 'المالك الأول',  username: 'owner1' },
    { id: 8, name: 'المالك الثاني', username: 'owner2' },
  ],
}

// ===== STATE =====
const selectedRole = ref('supervisor')
const selectedUser = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const apiReady = ref(false) // هل الـ API ردّ

// قائمة الـ roles — تبدأ من static
const availableRoles = ref<Role[]>(STATIC_ROLES)

// قائمة المستخدمين — تبدأ من static
const usersList = ref<UserByType[]>(STATIC_USERS['supervisor'] ?? [])

const filteredUsers = computed(() => usersList.value)

// ===== MOUNT — جرّب الـ API في الخلفية =====
onMounted(async () => {
  // جرّب جلب الـ roles من API
  try {
    const roles = await auth.roles()
    if (roles.length) availableRoles.value = roles
    apiReady.value = true
  } catch {
    // نكمل بالـ static
  }

  // جرّب جلب المستخدمين
  await fetchUsersFromApi()
})

async function fetchUsersFromApi() {
  try {
    const users = await auth.usersByType(selectedRole.value)
    if (users.length) usersList.value = users
  } catch {
    // نكمل بالـ static
    usersList.value = STATIC_USERS[selectedRole.value] ?? []
  }
}

function selectRole(role: string) {
  selectedRole.value = role
  selectedUser.value = ''
  password.value = ''
  error.value = ''
  // اعرض static فوراً
  usersList.value = STATIC_USERS[role] ?? []
  // ثم حاول الـ API
  fetchUsersFromApi()
}

// ===== LOGIN =====
async function login() {
  error.value = ''
  if (!selectedUser.value) { error.value = 'الرجاء اختيار الاسم'; return }
  if (!password.value)      { error.value = 'الرجاء إدخال كلمة المرور'; return }

  loading.value = true
  try {
    const user = await doLogin(selectedUser.value, password.value, selectedRole.value)
    if (user.type === 'supervisor') {
      navigateTo('/supervisor')
    } else if (user.type === 'collector') {
      navigateTo('/collector')
    } else if (user.type === 'owner') {
      navigateTo('/owner')
    } else {
      navigateTo('/')
    }
  } catch (e: any) {
    const data = e?.data
    if (data?.message) {
      error.value = data.message
    } else if (data?.errors) {
      const firstKey = Object.keys(data.errors)[0]
      error.value = Array.isArray(data.errors[firstKey]) ? data.errors[firstKey][0] : data.errors[firstKey]
    } else {
      error.value = 'تعذّر تسجيل الدخول. تأكد من تشغيل الخادم.'
      console.log(data)
    }
  } finally {
    loading.value = false
  }
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
    #F3EFE8;
  padding: 24px;
}

.login-card {
  background: #fff;
  border: 1px solid #E6DFD3;
  border-radius: 18px;
  width: 100%;
  max-width: 420px;
  padding: 36px 32px 30px;
  box-shadow: 0 20px 50px -25px rgba(46,43,39,.35);
}

.login-head {
  text-align: center;
  margin-bottom: 26px;
}
.logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.login-head h1 {
  font-size: 18px;
  margin: 0 0 4px;
  color: #3A3733;
  font-weight: 800;
}
.login-head p {
  margin: 0;
  color: #8A8479;
  font-size: 13px;
}

.login-error {
  background: #F7E7E2;
  color: #B3452F;
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
  background: #F3EFE8;
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
  color: #8A8479;
  font-weight: 700;
  font-size: 14px;
  transition: .15s;
  cursor: pointer;
}
.role-tab.active {
  background: #3A3733;
  color: #fff;
}

/* Fields */
.field {
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-size: 13px;
  color: #8A8479;
  margin-bottom: 6px;
  font-weight: 700;
}
.field input,
.field select {
  width: 100%;
  padding: 11px 13px;
  border-radius: 10px;
  border: 1.5px solid #E6DFD3;
  background: #F3EFE8;
  color: #2E2B27;
  outline: none;
  transition: .15s;
  font-family: inherit;
  font-size: 15px;
}
.field input:focus,
.field select:focus {
  border-color: #E1712F;
  background: #fff;
}
.field select:disabled {
  opacity: .6;
}

/* Login Button */
.btn-login {
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: #E1712F;
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  cursor: pointer;
  transition: .15s;
  margin-top: 4px;
}
.btn-login:hover:not(:disabled) {
  background: #B85423;
}
.btn-login:disabled {
  opacity: .6;
  cursor: default;
}

.btn-portal {
  width: 100%;
  padding: 13px;
  border: 1.5px solid #E6DFD3;
  border-radius: 10px;
  background: transparent;
  color: #3A3733;
  font-weight: 800;
  font-size: 14.5px;
  cursor: pointer;
  transition: .15s;
  margin-top: 10px;
}
.btn-portal:hover {
  border-color: #3A3733;
}

@media (max-width: 480px) {
  .login-card {
    padding: 26px 18px 22px;
  }
}
</style>
