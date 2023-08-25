import { defineStore } from 'pinia'
import * as xing from '@zxing/library'

import { ElMessage } from 'element-plus'

export const useCamera = defineStore('camera', {
  state() {
    return {
      reader: null,
      currentDevice: null,
      devices: [],
    }
  },
  getters: {
    isCameraButtonDisabled(state) {
      return state.devices.length < 1
    },
    getDevices(state) {
      return state.devices
    }
  },
  actions: {
    async initialize() {
			try {
				this.reader = new xing.BrowserMultiFormatReader()
				this.devices = await this.reader.listVideoInputDevices()
				this.currentDevice = this.devices[0] ? this.devices[0].deviceId : null
			} catch(e) {
				console.log('initialize || camera.js, error => ', e)
				ElMessage({
					type: 'error',
					message: 'Не удалось инициализировать камеру'
				})
			}
    },
    scan(container) {
      return new Promise(async (resolve) => {
        try {
          await this.reader.decodeFromVideoDevice(this.currentDevice, container, (result) => {
            if (result) {
              result.status = result.format ? 0 : 1
              resolve(result)
            }
          })
        } catch(e) {
          resolve({ status: 999 })
        }
      })
    },
    preventScan() {
      this.reader.reset()
    }
  },
})