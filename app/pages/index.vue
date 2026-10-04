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
          v-for="tab in roles"
          :key="tab.value"
          class="role-tab"
          :class="{ active: selectedRole === tab.value }"
          @click="selectRole(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Owner Search -->
      <div v-if="selectedRole === 'owner'" class="field">
        <label>ابحث باسمك</label>
        <input v-model="ownerSearch" placeholder="اكتب اسمك للبحث..." />
      </div>

      <!-- Name -->
      <div class="field">
        <label>الاسم</label>
        <select v-model="selectedUser">
          <option value="">{{ filteredUsers.length ? 'اختر الاسم' : 'لا توجد نتائج' }}</option>
          <option v-for="u in filteredUsers" :key="u.id" :value="u.id">{{ u.name }}</option>
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

      <button class="btn-login" @click="login">تسجيل الدخول</button>

      <button class="btn-portal" @click="navigateTo('/portal')">بوابة المستأجرين — طلب صيانة</button>

    </div>
  </div>
</template>

<script setup lang="ts">
// ===== DATA =====
const users = {
  supervisor: [
    { id: 'sup1', name: 'المشرف الأول',  password: 'Admin@123' },
    { id: 'sup2', name: 'المشرف الثاني', password: 'Admin@123' },
    { id: 'sup3', name: 'المشرف الثالث', password: 'Admin@123' },
  ],
  collector: [
    { id: 'col1', name: 'المحصل الأول',  password: '1234' },
    { id: 'col2', name: 'المحصل الثاني', password: '1234' },
    { id: 'col3', name: 'المحصل الثالث', password: '1234' },
  ],
  owner: [
    { id: 'own1', name: 'المالك الأول',  password: '1234' },
    { id: 'own2', name: 'المالك الثاني', password: '1234' },
  ],
}

const roles = [
  { value: 'supervisor', label: 'مشرف' },
  { value: 'collector',  label: 'محصل' },
  { value: 'owner',      label: 'مالك'  },
]

// ===== STATE =====
const selectedRole = ref<'supervisor' | 'collector' | 'owner'>('supervisor')
const selectedUser = ref('')
const password     = ref('')
const ownerSearch  = ref('')
const error        = ref('')

// ===== COMPUTED =====
const filteredUsers = computed(() => {
  const list = users[selectedRole.value]
  const q = ownerSearch.value.trim().toLowerCase()
  if (selectedRole.value === 'owner' && q) {
    return list.filter(u => u.name.toLowerCase().includes(q))
  }
  return list
})

// ===== METHODS =====
function selectRole(role: 'supervisor' | 'collector' | 'owner') {
  selectedRole.value = role
  selectedUser.value = ''
  password.value     = ''
  ownerSearch.value  = ''
  error.value        = ''
}

function login() {
  error.value = ''
  if (!selectedUser.value) { error.value = 'الرجاء اختيار الاسم'; return }

  const list = users[selectedRole.value]
  const user = list.find(u => u.id === selectedUser.value)
  if (!user) { error.value = 'المستخدم غير موجود'; return }
  if (user.password !== password.value) { error.value = 'كلمة المرور غير صحيحة'; return }

  // حفظ الجلسة
  localStorage.setItem('tahsilat-session', JSON.stringify({ role: selectedRole.value, id: user.id, name: user.name }))

  if (selectedRole.value === 'supervisor') {
    navigateTo('/supervisor')
  } else if (selectedRole.value === 'collector') {
    navigateTo('/collector')
  } else {
    navigateTo('/owner')
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
.btn-login:hover {
  background: #B85423;
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
