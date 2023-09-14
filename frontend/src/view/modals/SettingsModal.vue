<script setup>
import { ref, reactive, watch} from 'vue'

import { useSettings } from '@/store/settings'
import { useStore } from '@/store/store'
import { useCamera } from '@/store/camera'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
    required: true
  }
})

const store = useStore()
const camera = useCamera()
const settings = useSettings()

const modalState = ref(false)
const selectedStageId = ref(null)
const colors = reactive({
  success: '',
  error: '',
  pushkin: '',
})
const atolMode = ref(false)

watch(() => props.modelValue, async (val) => {
  modalState.value = val

  if (val) {
    await camera.destroyInstance()
    await settings.getStagesForSelect()

    selectedStageId.value = settings.getStageId || null
    colors.success = settings.getColors.success
    colors.pushkin = settings.getColors.pushkin
    colors.error = settings.getColors.error
    atolMode.value = settings.getAtolMode
  }
})
watch(modalState, () => {
  emit('update:modelValue', modalState.value)
})

function clearSelect() {
  selectedStageId.value = null
}
async function saveSettings() {
  await settings.saveSettings({
    stageId: selectedStageId.value || 0,
    colors,
    atolMode: atolMode.value
  })
  settings.setStageId(selectedStageId.value || 0)

  await store.getRepertoire()
  store.getRepertoireWss()

  await closeSettingsModal()
}
async function beforeSettingsModalClose(done) {
  if (!settings.stageId && settings.stageId !== 0) return
  if (!settings.atolMode) await camera.initialize()
  done()
}
async function closeSettingsModal() {
  if (!settings.stageId && settings.stageId !== 0) return
  if (!settings.atolMode) await camera.initialize()
  modalState.value = false
}

</script>

<template>
  <el-dialog
    v-model='modalState'
    title='Выберите сцену:'
    width='90%'
    :showClose = 'true'
    :beforeClose='beforeSettingsModalClose'
  >
    <div class='select-wrapper'>
      <el-select
        v-model='selectedStageId'
        class='stage-select'
        popper-class='popper-stage-select'
        placeholder='Выберите сцену'
        :clearable='true'
        :filterable='true'
      >
        <el-option
          v-for='stage in settings.stagesForSelect'
          :key='stage'
          :label='`${stage.label} ${stage.gate ? `<<${stage.gate}>>` : ""} (${stage.theatre})`'
          :value='stage.value'
        />
      </el-select>
      <el-button
        type='primary'
        :plain='true'
        @click='clearSelect'
      >
        Очистить
      </el-button>
    </div>
    <div class='checkbox-wrapper'>
      <el-checkbox
        v-model='atolMode'
        label='Сканер АТОЛ'
        :border='true'
      />
    </div>
    <div class='color-wrapper'>
      <div class='color-title'>Цветовая схема:</div>

      <el-form
        label-position='left'
        label-width='150'
      >
        <el-form-item
          label='Успешный проход:'>
          <el-color-picker
            v-model='colors.success'
            class='color-picker'
          />
        </el-form-item>
        <el-form-item
          label='Карта Пушкина:'
        >
          <el-color-picker
            v-model='colors.pushkin'
            class='color-picker'
          />
        </el-form-item>
        <el-form-item
          label='Ошибка:'
        >
          <el-color-picker
            v-model='colors.error'
            class='color-picker'
          />
        </el-form-item>
      </el-form>

    </div>
    <template #footer>
      <el-button
        type='primary'
        :plain='true'
        @click='closeSettingsModal'
      >
        Отмена
      </el-button>
      <el-button
        type='primary'
        @click='saveSettings'
      >
        Сохранить
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.select-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin: 0 10px;
  padding: 0 0 20px;

  border-bottom: 1px solid var(--el-border-color);
}
.checkbox-wrapper {
  margin: 0 10px;
  padding: 20px 0;

  border-bottom: 1px solid var(--el-border-color);
}
.stage-select {
  width: 100%;
  margin-right: 10px;
}
.color-wrapper {
  margin: 10px 10px 0;
}
.color-title {
  margin-bottom: 10px;
  line-height: var(--el-dialog-font-line-height);
  font-size: var(--el-dialog-title-font-size);
  color: var(--el-text-color-primary);
}
:global(.popper-stage-select) {
  max-width: calc(100vw - 40px);
  overflow-x: auto;
}
:global(.el-color-picker), :global(.el-color-picker__trigger) {
  width: 100px;
}
:global(.el-dialog__body) {
  padding: 10px;
}
</style>