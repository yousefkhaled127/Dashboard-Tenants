<template>
  <div>
    <div class="page-title">
      <div><h2>إدارة الأملاك</h2><p>عقارات ووحدات كل مالك</p></div>
      <button class="btn btn-dark btn-sm" @click="showAdd=true">+ إضافة عقار</button>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>المالك</th><th>العقار / الوحدة</th><th></th></tr></thead>
          <tbody>
            <template v-if="sorted.length">
              <tr v-for="p in sorted" :key="p.id">
                <td>{{ ownerName(p.ownerId) }}</td>
                <td>{{ p.unit||'—' }}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-ghost btn-sm" @click="startEdit(p.id)">تعديل</button>
                    <button class="btn btn-danger btn-sm" @click="startDelete(p.id)">حذف</button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else><td colspan="3"><div class="empty-state"><b>لا توجد عقارات مضافة بعد</b></div></td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Add -->
    <div v-if="showAdd" class="modal-overlay" @mousedown.self="showAdd=false">
      <div class="modal">
        <div class="modal-head"><h3>إضافة عقار</h3><button class="modal-close" @click="showAdd=false">×</button></div>
        <div class="field"><label>المالك</label>
          <select v-model="addForm.ownerId"><option value="">اختر المالك</option><option v-for="o in state.owners" :key="o.id" :value="o.id">{{ o.name }}</option></select>
        </div>
        <div class="field"><label>العقار / الوحدة</label><input v-model="addForm.unit" placeholder="برج الأمل - وحدة 12" /></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="showAdd=false">إلغاء</button>
          <button class="btn btn-primary" @click="saveAdd">حفظ</button>
        </div>
      </div>
    </div>
    <!-- Edit -->
    <div v-if="editingId" class="modal-overlay" @mousedown.self="editingId=null">
      <div class="modal">
        <div class="modal-head"><h3>تعديل العقار</h3><button class="modal-close" @click="editingId=null">×</button></div>
        <p class="hint">المالك: <b>{{ ownerName(editingProp?.ownerId||'') }}</b></p>
        <div class="field"><label>العقار / الوحدة</label><input v-model="editUnit" /></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="editingId=null">إلغاء</button>
          <button class="btn btn-primary" @click="saveEdit">حفظ</button>
        </div>
      </div>
    </div>
    <!-- Delete -->
    <div v-if="deletingId" class="modal-overlay" @mousedown.self="deletingId=null">
      <div class="modal">
        <div class="modal-head"><h3>حذف العقار</h3><button class="modal-close" @click="deletingId=null">×</button></div>
        <p>هل أنت متأكد من حذف عقار <b>{{ ownerName(deletingProp?.ownerId||'') }}</b> ({{ deletingProp?.unit }})?</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="deletingId=null">إلغاء</button>
          <button class="btn btn-danger" @click="confirmDelete">تأكيد الحذف</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAppState } from '~/composables/useAppState'
const { state, load, save, uid, ownerName } = useAppState()
onMounted(load)
const showToast = inject<(m:string)=>void>('showToast',()=>{})
const sorted = computed(()=>[...state.value.properties].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')))
// Add
const showAdd = ref(false); const addForm = reactive({ ownerId:'', unit:'' })
function saveAdd(){
  if(!addForm.ownerId){ showToast('الرجاء اختيار المالك'); return }
  state.value.properties.push({ id:uid(), ownerId:addForm.ownerId, unit:addForm.unit.trim(), createdAt:new Date().toISOString() })
  save(); showAdd.value=false; showToast('تم إضافة العقار'); Object.assign(addForm,{ownerId:'',unit:''})
}
// Edit
const editingId=ref<string|null>(null); const editUnit=ref('')
const editingProp=computed(()=>state.value.properties.find(p=>p.id===editingId.value))
function startEdit(id:string){ editingId.value=id; editUnit.value=editingProp.value?.unit||'' }
function saveEdit(){ const p=state.value.properties.find(x=>x.id===editingId.value); if(p) p.unit=editUnit.value.trim(); editingId.value=null; save(); showToast('تم تحديث العقار') }
// Delete
const deletingId=ref<string|null>(null)
const deletingProp=computed(()=>state.value.properties.find(p=>p.id===deletingId.value))
function startDelete(id:string){ deletingId.value=id }
function confirmDelete(){ state.value.properties=state.value.properties.filter(x=>x.id!==deletingId.value); deletingId.value=null; save(); showToast('تم حذف العقار') }
</script>
<style scoped>
.page-title{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:10px;}
.page-title h2{margin:0;font-size:21px;font-weight:800;color:#3A3733;}
.page-title p{margin:2px 0 0;color:#8A8479;font-size:13px;}
.card{background:#fff;border:1px solid #E6DFD3;border-radius:14px;padding:20px;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13.5px;}
th{text-align:right;color:#8A8479;font-weight:700;font-size:12px;padding:9px 10px;border-bottom:1.5px solid #E6DFD3;}
td{padding:11px 10px;border-bottom:1px solid #E6DFD3;vertical-align:middle;}
tr:last-child td{border-bottom:none;}
.empty-state{text-align:center;padding:40px 20px;color:#8A8479;}
.empty-state b{display:block;color:#3A3733;font-size:14.5px;margin-bottom:4px;}
.hint{font-size:12.5px;color:#8A8479;margin-bottom:10px;}
.field{margin-bottom:14px;}
.field label{display:block;font-size:13px;color:#8A8479;margin-bottom:6px;font-weight:700;}
.field input,.field select{width:100%;padding:11px 13px;border-radius:10px;border:1.5px solid #E6DFD3;background:#F3EFE8;color:#2E2B27;outline:none;font-family:inherit;font-size:14px;}
.field input:focus,.field select:focus{border-color:#E1712F;background:#fff;}
.btn{border:none;border-radius:10px;padding:12px 18px;font-weight:800;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:.15s;}
.btn-ghost{background:transparent;color:#3A3733;border:1.5px solid #E6DFD3;}.btn-ghost:hover{border-color:#3A3733;}
.btn-primary{background:#E1712F;color:#fff;}.btn-primary:hover{background:#B85423;}
.btn-dark{background:#3A3733;color:#fff;}.btn-dark:hover{background:#2a2724;}
.btn-danger{background:#F7E7E2;color:#B3452F;}.btn-danger:hover{background:#f0cdc6;}
.btn-sm{padding:7px 12px;font-size:12.5px;border-radius:8px;}
.modal-overlay{position:fixed;inset:0;background:rgba(46,43,39,.5);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
.modal{background:#fff;border-radius:16px;padding:26px;width:100%;max-width:520px;}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;}
.modal-head h3{margin:0;font-size:17px;font-weight:800;}
.modal-close{background:#F3EFE8;border:none;width:30px;height:30px;border-radius:50%;font-size:16px;color:#8A8479;cursor:pointer;}
.modal-actions{display:flex;gap:10px;margin-top:18px;justify-content:flex-end;}
</style>
