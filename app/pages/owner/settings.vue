<template>
  <div>
    <div class="page-title"><div><h2>تغيير كلمة المرور</h2><p>خاصة بحسابك فقط</p></div></div>
    <div class="card" style="max-width:420px;">

      <!-- رسالة نجاح -->
      <div v-if="success" style="background:var(--success-tint);color:var(--success);border-radius:9px;padding:10px 12px;font-size:13px;font-weight:700;margin-bottom:14px;text-align:center;">
        {{ success }}
      </div>

      <!-- رسالة خطأ -->
      <div v-if="error" style="background:var(--danger-tint);color:var(--danger);border-radius:9px;padding:10px 12px;font-size:13px;font-weight:700;margin-bottom:14px;text-align:center;">
        {{ error }}
      </div>

      <div class="field">
        <label>كلمة المرور الحالية</label>
        <input v-model="currentPass" type="password" placeholder="••••••••" @keydown.enter="changePass" />
      </div>
      <div class="field">
        <label>كلمة المرور الجديدة</label>
        <input v-model="newPass" type="password" placeholder="••••••••" @keydown.enter="changePass" />
      </div>
      <div class="field">
        <label>تأكيد كلمة المرور الجديدة</label>
        <input v-model="confirmPass" type="password" placeholder="••••••••" @keydown.enter="changePass" />
      </div>

      <button class="btn btn-primary" style="width:100%;" :disabled="saving" @click="changePass">
        {{ saving ? 'جارٍ الحفظ...' : 'تحديث كلمة المرور' }}
      </button>

      <p style="font-size:12px;color:var(--muted);margin-top:10px;text-align:center;line-height:1.7;">
        تغيير كلمة المرور يتطلب تسجيل الخروج وإعادة الدخول بالكلمة الجديدة.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const { auth }   = useApi()
const { logout } = useAuth()

const currentPass = ref('')
const newPass     = ref('')
const confirmPass = ref('')
const error       = ref('')
const success     = ref('')
const saving      = ref(false)

const showToast = inject<(m: string) => void>('showToast', m => console.log(m))

async function changePass() {
  error.value = ''; success.value = ''

  if (!currentPass.value)                   { error.value = 'الرجاء إدخال كلمة المرور الحالية'; return }
  if (!newPass.value || newPass.value.length < 6) { error.value = 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'; return }
  if (newPass.value !== confirmPass.value)   { error.value = 'كلمتا المرور غير متطابقتين'; return }

  saving.value = true
  try {
    // محاولة استدعاء الـ API — الـ endpoint يُحدَّد لاحقًا من الـ backend
    await $fetch(useRuntimeConfig().public.apiBase + '/auth/password/update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useCookie('tahsilat-token').value}`,
        'Accept': 'application/json',
      },
      body: {
        current_password: currentPass.value,
        password: newPass.value,
        password_confirmation: confirmPass.value,
      },
    })
    success.value = 'تم تحديث كلمة المرور بنجاح — سيتم تسجيل خروجك'
    showToast('تم تحديث كلمة المرور')
    currentPass.value = ''; newPass.value = ''; confirmPass.value = ''
    // logout بعد ثانيتين
    setTimeout(async () => {
      await logout()
      navigateTo('/')
    }, 2000)
  } catch (e: any) {
    const data = e?.data
    if (data?.message) {
      error.value = data.message
    } else if (data?.errors) {
      const key = Object.keys(data.errors)[0]
      const val = data.errors[key]
      error.value = Array.isArray(val) ? val[0] : val
    } else if (e?.status === 404) {
      // الـ endpoint غير متاح بعد في الـ backend
      error.value = 'خاصية تغيير كلمة المرور غير متاحة حاليًا — تواصل مع المشرف'
    } else {
      error.value = 'حدث خطأ غير متوقع، حاول مرة أخرى'
    }
  } finally {
    saving.value = false
  }
}
</script>
