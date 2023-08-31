import { defineStore } from 'pinia'

import { useStore } from './store'

export const useSettings = defineStore('settings', {
  state() {
    return {
      deviceId: localStorage.getItem('barcode_checker_deviceId') || null,
      entranceType: false,
      ticketType: false,
      stageId: null,
      stagesForSelect: [],
      selectedEvents: [],
      colors: {
        success: '#2A9D8FBF',
        pushkin: '#046E8FBF',
        error: '#E76F51BF',
      }
    }
  },
  getters: {
    getDeviceId(state) {
      return state.deviceId
    },
    getStageId(state) {
      return state.stageId
    },
    getColors(state) {
      return state.colors
    },
    getSelectedEvents(state) {
      return state.selectedEvents
    }
  },
  actions: {
    setDeviceId(id) {
      this.deviceId = id
      localStorage.setItem('barcode_checker_deviceId', id)
    },
    setStageId: function(id) {
      this.stageId = id
    },
    setSettings: function(remoteSettings) {
      return new Promise(resolve => {
        this.stageId = remoteSettings.stageId
        this.entranceType = remoteSettings.entranceType
        this.ticketType = remoteSettings.ticketType
        this.colors.success = remoteSettings.colors.success
        this.colors.pushkin = remoteSettings.colors.pushkin
        this.colors.error = remoteSettings.colors.error
        if (Array.isArray(remoteSettings.selectedEvents)) {
          remoteSettings.selectedEvents.forEach(event => {
            this.selectedEvents.push(event)
          })
        }
        resolve()
      })
    },
    setStagesForSelect: function(remoteStages) {
      this.stagesForSelect.splice(0)
      remoteStages.forEach(stage => {
        this.stagesForSelect.push({
          label: stage.StageFullName,
          value: stage.StageId,
          theatre: stage.TheatreFullName
        })
      })
    },
    setSelectedEvents: function(ev, value) {
      if (ev) {
        this.selectedEvents.push(value)
      } else {
        const index = this.selectedEvents.findIndex(ev => ev === value)
        this.selectedEvents.splice(index, 1)
      }
    },

    // requests
    getSettings: async function() {
      const store = useStore()

      try {
        const settings = await store.axios.get('/settings', {
          params: {
            deviceid: this.deviceId
          }
        })

        this.setDeviceId(settings.data.deviceid)

        if (settings.data.settings) {
          await this.setSettings(JSON.parse(settings.data.settings))
        }
      } catch(e) {
        console.log('getSettings || settings.js, error => ', e)
      }
    },
    getStagesForSelect: async function() {
      const store = useStore()

      try {
        const stages = await store.axios.get('/stages', {
          params: {
            deviceid: this.deviceId
          }
        })

        this.setStagesForSelect(stages.data)
      } catch(e) {
        console.log('getStages || settings.js, error => ', e)
      }
    },
    saveSettings: async function(newSettings = {}) {
      const store = useStore()
      const settings = {
        stageId: this.stageId,
        entranceType: this.entranceType,
        ticketType: this.ticketType,
        selectedEvents: this.selectedEvents,
        colors: this.colors
      }
      Object.assign(settings, newSettings)

      try {
        await store.axios.post('/settings', {
          deviceid: this.deviceId,
          settings: JSON.stringify(settings)
        })

        if (newSettings.colors) {
          this.colors.success = newSettings.colors.success
          this.colors.pushkin = newSettings.colors.pushkin
          this.colors.error = newSettings.colors.error
        }

      }catch(e) {
        console.log('saveSettings || settings.js, error => ', e)
      }
    }
  }
})