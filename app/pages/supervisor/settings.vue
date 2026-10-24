<template>
  <div>
    <div class="page-title">
      <div><h2>كلمة المرور والبيانات</h2><p>خاصة بحسابك فقط</p></div>
    </div>

    <div class="card" style="max-width:480px;">
      <div v-if="success" class="alert-ok">{{ success }}</div>
      <div v-if="error"   class="alert-err">{{ error }}</div>

      <div class="field">
        <label>كلمة المرور الجديدة <span class="req">*</span></label>
        <input v-model="newPass" type="password" placeholder="4 أحرف على الأقل"
               autocomplete="new-password" @keydown.enter="changePass" />
      </div>
      <div class="field">
        <label>تأكيد كلمة المرور الجديدة <span class="req">*</span></label>
        <input v-model="confirmPass" type="password" placeholder="••••••••"
               autocomplete="new-password" @keydown.enter="changePass" />
      </div>

      <button class="btn btn-primary" style="width:100%;" :disabled="saving" @click="changePass">
        {{ saving ? 'جارٍ الحفظ...' : 'تحديث كلمة المرور' }}
      </button>

      <p style="font-size:12px;color:var(--muted);margin-top:10px;text-align:center;line-height:1.7;">
        بعد تغيير كلمة المرور سيتم تسجيل الخروج تلقائياً.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const { manager } = useApi()
const { user, logout } = useAuth()

const newPass     = ref('')
const confirmPass = ref('')
const error       = ref('')
const success     = ref('')
const saving      = ref(false)
const showToast   = inject<(m:string)=>void>('showToast', () => {})

async function changePass() {
  error.value = ''; success.value = ''
  if (!newPass.value || newPass.value.length < 4) {
    error.value = 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل'; return
  }
  if (newPass.value !== confirmPass.value) {
    error.value = 'كلمتا المرور غير متطابقتين'; return
  }
  if (!user.value?.id) { error.value = 'لم يتم التعرف على المستخدم'; return }

  saving.value = true
  try {
    // جيب البيانات الكاملة أولاً لضمان إرسال phone و type الصحيحين
    const current = await manager.showSupervisor(user.value.id)
    await manager.updateSupervisor(user.value.id, {
      name:     current.name,
      type:     current.type,
      phone:    current.phone ?? '',
      password: newPass.value,
    })
    success.value = 'تم تحديث كلمة المرور بنجاح — سيتم تسجيل الخروج'
    showToast('تم تحديث كلمة المرور')
    newPass.value = ''; confirmPass.value = ''
    setTimeout(async () => { await logout(); navigateTo('/') }, 2000)
  } catch (e: any) {
    const d = e?.data
    if (d?.message)  error.value = d.message
    else if (d?.errors) {
      const k = Object.keys(d.errors)[0]
      const v = d.errors[k]
      error.value = Array.isArray(v) ? v[0] : v
    } else error.value = 'تعذّر تحديث كلمة المرور — تأكد من تشغيل الخادم'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:10px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:var(--charcoal); }
.page-title p  { margin:2px 0 0; color:var(--muted); font-size:13px; }
.card { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:24px; }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:var(--muted); margin-bottom:6px; font-weight:700; }
.field input { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid var(--line); background:var(--bg); color:var(--charcoal); outline:none; font-family:inherit; font-size:14px; box-sizing:border-box; }
.field input:focus { border-color:var(--orange); background:var(--surface); }
.btn { border:none; border-radius:10px; padding:12px 18px; font-weight:800; font-size:14px; display:inline-flex; align-items:center; justify-content:center; gap:8px; cursor:pointer; transition:.15s; }
.btn:disabled { opacity:.6; cursor:not-allowed; }
.btn-primary { background:var(--orange); color:#fff; } .btn-primary:hover:not(:disabled) { background:#B85423; }
.alert-ok  { background:var(--success-tint); color:var(--success); border-radius:9px; padding:10px 12px; font-size:13px; font-weight:700; margin-bottom:14px; text-align:center; }
.alert-err { background:var(--danger-tint);  color:var(--danger);  border-radius:9px; padding:10px 12px; font-size:13px; font-weight:700; margin-bottom:14px; text-align:center; }
.req { color:var(--danger); }
</style>
