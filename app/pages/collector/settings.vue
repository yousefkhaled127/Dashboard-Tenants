<template>
  <div>
    <div class="page-title"><div><h2>تغيير كلمة المرور</h2><p>خاصة بحسابك فقط</p></div></div>
    <div class="card" style="max-width:420px;">
      <div v-if="error"   class="form-error">{{ error }}</div>
      <div v-if="success" class="form-success">{{ success }}</div>
      <div class="field"><label>كلمة المرور الحالية</label><input v-model="curPass" type="password" /></div>
      <div class="field"><label>كلمة المرور الجديدة</label><input v-model="newPass" type="password" /></div>
      <button class="btn btn-primary" @click="changePass">تحديث كلمة المرور</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'

const { state, load, save } = useAppState()
onMounted(load)

const session  = inject<Ref<{ id: string }>>('collectorSession', ref({ id: '' }))
const curPass  = ref(''); const newPass = ref(''); const error = ref(''); const success = ref('')

function changePass() {
  error.value = ''; success.value = ''
  const col = state.value.collectors.find(c => c.id === session.value.id)
  if (!col)                              { error.value = 'المستخدم غير موجود'; return }
  if (col.password !== curPass.value)    { error.value = 'كلمة المرور الحالية غير صحيحة'; return }
  if (!newPass.value || newPass.value.length < 4) { error.value = 'كلمة المرور الجديدة قصيرة جدًا'; return }
  col.password = newPass.value; save()
  success.value = 'تم تحديث كلمة المرور بنجاح'
  curPass.value = ''; newPass.value = ''
  setTimeout(() => success.value = '', 3000)
}
</script>

<style scoped>
.page-title { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; }
.page-title h2 { margin:0; font-size:21px; font-weight:800; color:#3A3733; }
.page-title p  { margin:2px 0 0; color:#8A8479; font-size:13px; }
.card { background:#fff; border:1px solid #E6DFD3; border-radius:14px; padding:20px; }
.field { margin-bottom:14px; }
.field label { display:block; font-size:13px; color:#8A8479; margin-bottom:6px; font-weight:700; }
.field input { width:100%; padding:11px 13px; border-radius:10px; border:1.5px solid #E6DFD3; background:#F3EFE8; color:#2E2B27; outline:none; font-family:inherit; font-size:14px; }
.field input:focus { border-color:#E1712F; background:#fff; }
.form-error   { background:#F7E7E2; color:#B3452F; border-radius:9px; padding:10px 12px; font-size:13px; font-weight:700; margin-bottom:14px; }
.form-success { background:#E4F1E7; color:#3F7D52; border-radius:9px; padding:10px 12px; font-size:13px; font-weight:700; margin-bottom:14px; }
.btn { border:none; border-radius:10px; padding:13px 18px; font-weight:800; font-size:14px; cursor:pointer; transition:.15s; width:100%; }
.btn-primary { background:#E1712F; color:#fff; } .btn-primary:hover { background:#B85423; }
</style>
