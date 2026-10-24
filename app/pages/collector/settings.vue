<template>
  <div>
    <div class="page-title"><div><h2>تغيير كلمة المرور</h2><p>خاصة بحسابك فقط</p></div></div>
    <div class="card" style="max-width:420px;">
      <div v-if="success" style="background:var(--success-tint);color:var(--success);border-radius:9px;padding:10px 12px;font-size:13px;font-weight:700;margin-bottom:14px;text-align:center;">{{ success }}</div>
      <div v-if="error"   style="background:var(--danger-tint);color:var(--danger);border-radius:9px;padding:10px 12px;font-size:13px;font-weight:700;margin-bottom:14px;text-align:center;">{{ error }}</div>
      <div class="field"><label>كلمة المرور الحالية</label><input v-model="curPass" type="password" placeholder="••••••••" @keydown.enter="changePass" /></div>
      <div class="field"><label>كلمة المرور الجديدة</label><input v-model="newPass" type="password" placeholder="••••••••" @keydown.enter="changePass" /></div>
      <div class="field"><label>تأكيد كلمة المرور</label><input v-model="confirmPass" type="password" placeholder="••••••••" @keydown.enter="changePass" /></div>
      <button class="btn btn-primary" style="width:100%;" :disabled="saving" @click="changePass">
        {{ saving ? 'جارٍ الحفظ...' : 'تحديث كلمة المرور' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { logout } = useAuth()
const config = useRuntimeConfig()
const curPass = ref(''); const newPass = ref(''); const confirmPass = ref('')
const error = ref(''); const success = ref(''); const saving = ref(false)
const showToast = inject<(m:string)=>void>('showToast', () => {})

async function changePass() {
  error.value = ''; success.value = ''
  if (!curPass.value)                        { error.value = 'الرجاء إدخال كلمة المرور الحالية'; return }
  if (!newPass.value || newPass.value.length < 6) { error.value = 'كلمة المرور الجديدة 6 أحرف على الأقل'; return }
  if (newPass.value !== confirmPass.value)   { error.value = 'كلمتا المرور غير متطابقتين'; return }
  saving.value = true
  try {
    await $fetch(config.public.apiBase + '/auth/password/update', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${useCookie('tahsilat-token').value}`, 'Accept': 'application/json' },
      body: { current_password: curPass.value, password: newPass.value, password_confirmation: confirmPass.value },
    })
    success.value = 'تم تحديث كلمة المرور — سيتم تسجيل خروجك'
    showToast('تم تحديث كلمة المرور')
    curPass.value = ''; newPass.value = ''; confirmPass.value = ''
    setTimeout(async () => { await logout(); navigateTo('/') }, 2000)
  } catch (e: any) {
    const d = e?.data
    if (d?.message) error.value = d.message
    else if (d?.errors) { const k=Object.keys(d.errors)[0]; const v=d.errors[k]; error.value=Array.isArray(v)?v[0]:v }
    else if (e?.status === 404) error.value = 'خاصية تغيير كلمة المرور غير متاحة حاليًا — تواصل مع المشرف'
    else error.value = 'حدث خطأ غير متوقع'
  } finally {
    saving.value = false
  }
}
</script>
