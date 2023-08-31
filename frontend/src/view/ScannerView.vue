<script setup>
import DisplayView from './DisplayView.vue'
import CameraModal from './CameraModal.vue'

import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useStore } from '@/store/store'
import { useErrorLog } from '@/store/errorLog'
import { useSettings } from '@/store/settings'
import { useCamera } from '@/store/camera'

const router = useRouter()
const store = useStore()
const errorLog = useErrorLog()
const settings = useSettings()
const camera = useCamera()

const stageModal = ref(false)
const cameraModal = ref(false)
const ticketNumberContainer = ref(null)
const selectedStageId = ref(null)
const colors = reactive({
  success: '',
  error: '',
  pushkin: '',
})

const isEventChecked = computed(() => (ev) => {
	return !!settings.selectedEvents.find(event => event === ev)
})
const showCameraButton = computed(() => {
	return !(import.meta.env.VITE_ATOL.toLowerCase() === 'true')
})

// focus on input
watch(stageModal, (val) => {
  if(!val) ticketNumberContainer.value.focus()
})
watch(cameraModal, (val) => {
  if(!val) ticketNumberContainer.value.focus()
})
watch(() => store.ticketNumber, (val) => {
  if (!val) ticketNumberContainer.value.focus()
})
watch(() => settings.ticketType, () => {
  ticketNumberContainer.value.focus()
})
watch(() => settings.entranceType, () => {
  ticketNumberContainer.value.focus()
})

// log
function showLog() {
	router.push({ name: 'Log'})
}

// settings modal
function openSelectStageModal() {
  selectedStageId.value = settings.getStageId || null
  colors.success = settings.getColors.success
  colors.pushkin = settings.getColors.pushkin
  colors.error = settings.getColors.error
  stageModal.value = true
}
function closeSelectStageModal() {
  if (!settings.stageId && settings.stageId !== 0) return
  stageModal.value = false
}
function beforeSelectStageModalClose(done) {
	if (!settings.stageId && settings.stageId !== 0) return
  done()
}
// camera modal
function openCameraModal() {
  cameraModal.value = true
}
// event table helper
function formatDate(date) {
	if(!date) return
  return `${date.split('T')[0]}:${date.split('T')[1]}`
}

// ticket request
async function checkTicket() {
	await store.checkTicket()
  ticketNumberContainer.value.focus()
}

// settings
function clearSelect() {
  selectedStageId.value = null
}
async function saveSelectedStage() {
  await settings.saveSettings({
    stageId: selectedStageId.value || 0,
    colors
  })
  settings.setStageId(selectedStageId.value || 0)

  await store.getRepertoire()
  store.getRepertoireWss()

  closeSelectStageModal()
}
async function selectEvent(ev, value) {
  settings.setSelectedEvents(ev, value)

  try {
    await settings.saveSettings()

    ElMessage({
      type: 'success',
      message: 'Настройки изменены'
    })
  } catch(e) {
    settings.setSelectedEvents(!ev, value)
    ElMessage({
      type: 'error',
      message: 'Произошла ошибка, повторите позже'
    })
    console.log('selectEvent || ScannerView.vue, error => ', e)
  }
}
async function saveSettings() {
  try {
    await settings.saveSettings()

    ElMessage({
      type: 'success',
      message: 'Настройки изменены'
    })
  } catch(e) {
    console.log('saveSettings || ScannerView error => ', e)
  }
}

onMounted(async () => {
  await settings.getSettings()
  store.initializeWss()

  selectedStageId.value = settings.getStageId || null
  colors.success = settings.getColors.success
  colors.pushkin = settings.getColors.pushkin
  colors.error = settings.getColors.error
  await settings.getStagesForSelect()

  if (!settings.stageId && settings.stageId !== 0) openSelectStageModal()
  if (settings.stageId || settings.stageId === 0) {
		await store.getRepertoire()
		store.getRepertoireWss()
	}
})
</script>

<template>
  <div
    class='scanner-wrapper'
    v-loading='store.loader'
  >
    <DisplayView />
    <div class='number-wrapper'>
      <el-input
        v-model='store.ticketNumber'
        class='number-input'
        ref='ticketNumberContainer'
        :autofocus='true'
        type='number'
        @keydown.enter='checkTicket'
      />
      <el-button
        class='number-scan-button'
        type='primary'
        :plain='true'
        @click='checkTicket'
      >
        Проверить
      </el-button>
      <el-button
        v-if='showCameraButton'
        class='number-scan-button'
        type='primary'
        :plain='true'
        :disabled='camera.isCameraButtonDisabled'
        @click='openCameraModal'
      >
        Камера
      </el-button>
    </div>
    <div class='settings-wrapper'>
      <el-radio-group class='settings-group' v-model='settings.$state.entranceType' @change='saveSettings'>
        <el-radio class='settings-radio' :label='false' size='large' border>Проход</el-radio>
        <el-radio class='settings-radio' :label='true' size='large' border>Выход на перерыв</el-radio>
      </el-radio-group>
    </div>
    <div class='settings-wrapper'>
      <el-radio-group class='settings-group' v-model='settings.$state.ticketType' @change='saveSettings'>
        <el-radio class='settings-radio' :label='false' size='large' border>Все билеты</el-radio>
        <el-radio class='settings-radio' :label='true' size='large' border>Электронные билеты</el-radio>
      </el-radio-group>
    </div>
    <div class='event-wrapper'>
      <el-table
        :data='store.events'
        :border='true'
        :highlight-current-row='true'
      >
        <el-table-column width='50' align='center'>
          <template #default='scope'>
            <el-checkbox
              :checked='isEventChecked(scope.row.ActionId)'
              @change='selectEvent($event, scope.row.ActionId)'
            />
          </template>
        </el-table-column>
        <el-table-column
          label='Мероприятие'
          prop='EventFullName'
          header-align='center'
          min-width='250'
        />
        <el-table-column label='Дата' prop='EventDate' header-align='center' align='center' min-width='155'>
          <template #default='scope'>
            {{ formatDate(scope.row.EventDate) }}
          </template>
        </el-table-column>
        <el-table-column
          label='Сцена'
          prop='StageFullName'
          header-align='center'
          min-width='200'
          :sortable='true'
        />
        <el-table-column label='Всего' prop='countall' header-align='center' align='center' width='100' />
        <el-table-column label='Проход' prop='countio' header-align='center' align='center' width='100' />
      </el-table>
    </div>
    <div class='time-wrapper'>
      <div class='time'>{{ store.time }}</div>
      <el-button
        class='settings-button'
        type='primary'
        :plain='true'
        :disabled='errorLog.isLogEmpty'
        @click='showLog'
      >
        <svg
          :class='[errorLog.isLogEmpty ? "gray-log" : "red-log"]'
          width='20px'
             height='20px'
             viewBox="0 0 1024 1024"
             xmlns="http://www.w3.org/2000/svg">
          <path d="M510.65 962C264.6 962 63.3 760.26 63.3 513.7S264.6 65.41 510.65 65.41 958 267.14 958 513.7 756.69 962 510.65 962zM655 857.61a377.28 377.28 0 0 0 198.65-199.12 371.82 371.82 0 0 0 0-289.58A377.18 377.18 0 0 0 655 169.79a369.15 369.15 0 0 0-288.64 0 377.09 377.09 0 0 0-198.71 199.12 371.82 371.82 0 0 0 0 289.58A377.12 377.12 0 0 0 366.33 857.6a369.21 369.21 0 0 0 288.64 0z" />
          <path d="M474 662m0-37.5l0-338q0-37.5 37.5-37.5l0 0q37.5 0 37.5 37.5l0 338q0 37.5-37.5 37.5l0 0q-37.5 0-37.5-37.5Z" />
          <path d="M514.5 741.5m-37.5 0a37.5 37.5 0 1 0 75 0 37.5 37.5 0 1 0-75 0Z" />
        </svg>
      </el-button>
      <el-button
        class='settings-button'
        type='primary'
        :plain='true'
        @click='openSelectStageModal'
      >
        <svg
             xmlns="http://www.w3.org/2000/svg"
             height="20px" width="20px" viewBox="0,0,512,512" focusable="false"
        >
          <path d="M499.029,184.32h-51.14c-1.638-5.461-3.428-9.059-5.363-13.319l36.024-36.195c5.329-5.33,5.332-14.056,0.005-19.389 L396.586,33.31c-2.561-2.564-6.036-4.025-9.661-4.025c-3.624,0-7.098,1.431-9.66,3.995l-36.177,35.874 c-4.29-1.969-7.946-3.798-13.408-5.467V12.971C327.68,5.431,322.25,0,314.709,0H198.656c-7.541,0-14.336,5.431-14.336,12.971 V63.17c-4.096,1.694-8.77,3.555-13.222,5.576l-35.363-35.489c-5.33-5.325-13.883-5.323-19.214,0.003l-82.066,82.065 c-5.333,5.33-5.314,13.974,0.016,19.309l35.317,35.671c-2.06,4.488-3.947,8.555-5.676,14.017H14.336 C6.795,184.32,0,189.751,0,197.291v116.053c0,7.539,6.795,14.336,14.336,14.336h49.776c1.726,4.096,3.622,8.835,5.677,13.317 L34.45,376.166c-2.561,2.561-4,5.95-3.999,9.574c0.001,3.624,1.442,7.053,4.005,9.613l82.153,82.039 c5.33,5.325,13.967,5.315,19.296-0.011l35.186-35.486c4.452,2.019,9.131,3.876,13.227,5.572v50.198 c0,7.539,6.795,14.336,14.336,14.336h116.053c7.541,0,12.971-6.797,12.971-14.336v-50.717c5.461-1.67,9.122-3.514,13.413-5.485 l36.001,36.195c2.56,2.564,6.205,4.305,9.829,4.305c0.001,0,0.001,0,0.003,0c3.622,0,7.096-1.739,9.657-4.301l82.016-82.189 c2.56-2.561,3.998-6.119,3.996-9.742c-0.001-3.622-1.44-7.137-4.002-9.697l-36.058-35.714c1.931-4.253,3.718-8.544,5.355-12.64 h51.141c7.541,0,12.971-6.797,12.971-14.336V197.291C512,189.751,506.57,184.32,499.029,184.32z M484.693,300.373h-46.525 c-5.945,0-11.207,3.506-13.01,9.172c-2.986,9.384-6.78,18.396-11.278,27.124c-2.721,5.278-1.716,11.627,2.485,15.826 l33.266,33.202l-62.703,62.717l-33.067-33.12c-4.213-4.219-10.68-5.22-15.968-2.467c-8.765,4.567-18.317,8.415-27.715,11.446 c-5.64,1.819-9.804,7.066-9.804,12.992v47.429h-88.747v-46.987c0-5.964-3.529-11.238-9.22-13.025 c-9.572-3.008-18.773-6.857-27.684-11.446c-5.274-2.713-11.613-1.714-15.812,2.479l-32.696,32.696l-62.819-62.768l32.582-32.57 c4.213-4.213,5.213-10.671,2.463-15.958c-4.65-8.936-8.552-17.987-11.603-27.57c-1.804-5.665-7.063-9.172-13.008-9.172H27.307 v-88.747h46.525c5.945,0,11.207-4.187,13.01-9.854c3.053-9.591,6.959-19.157,11.612-28.097c2.75-5.282,1.757-11.825-2.453-16.039 l-32.543-32.607l62.804-62.79l32.741,32.687c4.197,4.192,10.621,5.19,15.895,2.475c8.921-4.59,17.949-8.443,27.509-11.446 c5.689-1.787,9.22-7.064,9.22-13.028V27.307h88.747V73.37c0,5.927,4.164,11.177,9.806,12.995 c9.398,3.03,18.776,6.88,27.536,11.444c5.291,2.757,11.839,1.761,16.055-2.46l33.113-33.112l62.688,62.738l-33.227,33.239 c-4.198,4.2-5.196,10.63-2.475,15.909c4.5,8.733,8.3,18.261,11.287,27.648c1.802,5.665,7.068,9.855,13.013,9.855h46.524V300.373z"/>
          <path d="M256,114.005c-77.92,0-141.312,63.392-141.312,141.312S178.08,396.629,256,396.629s141.312-63.392,141.312-141.312 S333.92,114.005,256,114.005z M256,369.323c-62.863,0-114.005-51.143-114.005-114.005S193.137,141.312,256,141.312 s114.005,51.143,114.005,114.005S318.863,369.323,256,369.323z"/>
          <path d="M256,178.859c-42.159,0-76.459,34.299-76.459,76.459c0,42.16,34.3,76.459,76.459,76.459s76.459-34.299,76.459-76.459 C332.459,213.157,298.159,178.859,256,178.859z M256,304.469c-27.103,0-49.152-22.049-49.152-49.152s22.049-49.152,49.152-49.152 s49.152,22.049,49.152,49.152S283.103,304.469,256,304.469z"/>
        </svg>
      </el-button>
    </div>

    <el-dialog
      v-model='stageModal'
      title='Выберите сцену:'
      width='90%'
      :showClose = 'true'
      :beforeClose='beforeSelectStageModalClose'
    >
      <div class='select-wrapper'>
        <el-select
          v-model='selectedStageId'
          class='stage-select'
          placeholder='Выберите сцену'
          :clearable='true'
          :fit-input-width='true'
        >
          <el-option
            v-for='stage in settings.stagesForSelect'
            :key='stage'
            :label='`${stage.label} (${stage.theatre})`'
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
      <div class='color-wrapper'>
        <div class='color-title'>Цветовая схема:</div>
        <el-form label-position='left' label-width='150'>
          <el-form-item label='Успешный проход:'>
            <el-color-picker v-model='colors.success' class='color-picker' />
          </el-form-item>
          <el-form-item label='Карта Пушкина:'>
            <el-color-picker v-model='colors.pushkin' class='color-picker' />
          </el-form-item>
          <el-form-item label='Ошибка:'>
            <el-color-picker v-model='colors.error' class='color-picker' />
          </el-form-item>
        </el-form>

      </div>
      <template #footer>
        <el-button
          type='primary'
          :plain='true'
          @click='closeSelectStageModal'
        >
          Отмена
        </el-button>
        <el-button
          type='primary'
          @click='saveSelectedStage'
        >
          Сохранить
        </el-button>
      </template>
    </el-dialog>
    <CameraModal v-model='cameraModal' />
  </div>
</template>
