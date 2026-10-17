<template>
  <div>
    <div class="page-title"><div><h2>تغيير كلمة المرور</h2><p>خاصة بحسابك فقط</p></div></div>
    <div class="card" style="max-width:420px;">
      <div v-if="error"   class="form-error">{{ error }}</div>
      <div v-if="success" class="form-success">{{ success }}</div>
      <div class="field"><label>كلمة المرور الجديدة</label><input v-model="newPass" type="password" /></div>
      <div class="field"><label>تأكيد كلمة المرور</label><input v-model="confirmPass" type="password" /></div>
      <button class="btn btn-primary" :disabled="saving" @click="changePass">
        {{ saving ? 'جارٍ الحفظ...' : 'تحديث كلمة المرور' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const newPass     = ref('')
const confirmPass = ref('')
const error       = ref('')
const success     = ref('')
const saving      = ref(false)

async function changePass() {
  error.value = ''; success.value = ''
  if (!newPass.value || newPass.value.length < 4) { error.value = 'كلمة المرور قصيرة جدًا (4 أحرف على الأقل)'; return }
  if (newPass.value !== confirmPass.value) { error.value = 'كلمتا المرور غير متطابقتين'; return }
  saving.value = true
  try {
    // TODO: ربط بـ API تغيير كلمة المرور عند توفّره
    await new Promise(r => setTimeout(r, 600))
    success.value = 'تم تحديث كلمة المرور بنجاح'
    newPass.value = ''; confirmPass.value = ''
    setTimeout(() => { success.value = '' }, 3000)
  } finally {
    saving.value = false
  }
}
</script>



