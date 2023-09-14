<script setup>
import { ref, watch } from 'vue'

import { useCamera } from '@/store/camera'
import { useStore } from '@/store/store'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
    required: true
  }
})

// local variables
const modalState = ref(false)
const showCameraBlock = ref(false)
// refs
const cameraContainer = ref(null)
// stores
const camera = useCamera()
const store = useStore()

watch(() => props.modelValue, (val) => {
  modalState.value = val
})
watch(modalState, () => {
  emit('update:modelValue', modalState.value)
})
watch(() => camera.currentDevice, () => {
  if (modalState.value) {
    camera.preventScan()
    onCameraModalOpen()
  }
})

async function onCameraModalOpen() {
  const result = await camera.scan(cameraContainer.value)

  switch(true) {
    case result.status === 0:
      store.ticketNumber = result.text
      closeCameraModal()
      await store.checkTicket()
      break
    case result.status === 1:
      const ticketResult = {}
      ticketResult.Result = 1
      ticketResult.StatusText = 'Формат данного кода не доступен для сканирования через камеру'
      store.ticketCheckResult = ticketResult
      closeCameraModal()
      break
    case result.status === 999:
      showCameraBlock.value = true
      break
  }
}
function onCameraModalClose() {
  camera.preventScan()
}
function closeCameraModal() {
  modalState.value = false
}

</script>

<template>
  <el-dialog
    v-model='modalState'
    title='Отсканируйте штрихкод'
    :fullscreen='true'
    @opened='onCameraModalOpen'
    @closed='onCameraModalClose'
  >
    <template #default>
      <div v-show='!showCameraBlock'>
        <video id='camera' ref='cameraContainer'></video>
        <el-select class='camera-select' v-model='camera.currentDevice'>
          <el-option
            v-for='device in camera.getDevices'
            :key='device'
            :value='device.deviceId'
            :label='device.label'
          />
        </el-select>
      </div>
      <div
        v-show='showCameraBlock'
        class='camera-block'
      >
        Доступ к камере заблокирован.
        <br />
        Разрешите приложению доступ к камере и перезагрузите страницу.
      </div>
    </template>
    <template #footer>
      <el-button
        type='primary'
        :plain='true'
        @click='closeCameraModal'
      >
        Отмена
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
#camera {
  width: 100%;
  height: 65vh;
}
.camera-select {
  margin-top: 20px;
  width: 100%
}
.camera-block {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 50vh;

  color: black;

  font-size: 20px;
  text-align: center;
}

:global(.el-dialog__body) {
  padding: 10px;
}
</style>