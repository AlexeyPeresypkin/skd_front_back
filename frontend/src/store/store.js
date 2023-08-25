import { defineStore } from 'pinia'

import { useErrorLog } from './errorLog'
import { useSettings } from './settings'

import moment from 'moment'
import 'moment/dist/locale/ru'

import axios from 'axios'
import { ElNotification } from 'element-plus'

export const useStore = defineStore('store',{
	state: () => {
		return {
			ticketNumber: null,
			ticketCheckResult: null,
			events: [],

			time: null,
			axios: null,
			ws: null,
			loader: false,
		}
	},
	actions: {
		// initialize
		initializeTime: function() {
			moment.locale('ru')
			setInterval(() => {
				this.time = moment().format('DD MMM YYYY [г.] HH:mm:ss')
			}, 1000)
		},
		initializeAxios: function() {
			axios.defaults.baseURL = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_BASE_PORT}`

			this.axios = axios.create()

			this.axios.interceptors.response.use((response) => {
				return response
			}, async (error) => {
				ElNotification({
					title: 'Внимание',
					type: 'error',
					message: 'Возникла ошибка'
				})

				return Promise.reject(error)
			})
		},
		initializeWss: function() {
			this.ws = new WebSocket(`${import.meta.env.VITE_WSS_URL}:${import.meta.env.VITE_BASE_PORT}/repertoire`)

			this.ws.onopen = (event) => {
				console.log('ws connection established')
			}
			this.ws.onmessage = (message) => {
				this.setEvents(JSON.parse(message.data))
			}
			this.ws.onclose = (event) => {
				console.log('ws connection was closed, trying to reconnect')
				setTimeout(() => {
					location.reload()
				}, 5000)
			}
			this.ws.onerror = (event) => {
				console.log('an error occurred during ws connection, trying to reconnect')
				setTimeout(() => {
					location.reload()
				}, 5000)
			}
		},
		// requests
		getRepertoire: async function() {
			const settings = useSettings()

			try {
				const res = await this.axios.get('/getrepertoire', {
					params: {
						deviceid: settings.getDeviceId,
						st: settings.getStageId || 0
					}
				})
				this.setEvents(res.data)
			} catch(e) {
				console.log('getRepertoire || store.js, error => ', e)
			}
		},
		getRepertoireWss: function() {
			const settings = useSettings()

			this.ws.send(JSON.stringify({
				action: 'init',
				deviceId: settings.getDeviceId
			}))
		},
		checkTicket: async function() {
			if (!this.ticketNumber) return

			const settings = useSettings()
			const errorLog = useErrorLog()

			this.loader = true

			const request = {
				actionid1: settings.selectedEvents[0] || 0,
				actionid2: settings.selectedEvents[1] || 0,
				actionid3: settings.selectedEvents[2] || 0,
				actionid4: settings.selectedEvents[3] || 0,
				actionid5: settings.selectedEvents[4] || 0,
				barcode: this.ticketNumber,
				deviceid: settings.getDeviceId,
				ischecktickettype: settings.ticketType,
				ischeckenterrelease: settings.entranceType,
			}
			if (settings.stageId) {
				request.stageid = settings.stageId
			}
			
			try {
				const res = await this.axios.post('/barcode', request)

				this.ticketCheckResult = res.data
				this.ticketCheckResult.TicketNumber = this.ticketNumber
				this.ticketNumber = null

				if (res.data.Result !== 0) {
					this.ticketCheckResult.ErrorTime = Date.now()
					errorLog.setLog(this.ticketCheckResult)
				}

				this.loader = false
			} catch(e) {
				console.log('checkTicket || store.js error => ', e)
				this.loader = false
			}
		},
		// helper
		setEvents: function(remoteEvents) {
			const settings = useSettings()

			remoteEvents.forEach(event => {
				const exist = this.events.find(item => item.ActionId === event.ActionId)
				if (exist) {
					exist.countall = event.countall
					exist.countio = event.countio
				} else {
					this.events.push(event)
				}
			})

			this.events.forEach((event, index) => {
				const exist = remoteEvents.find(item => item.ActionId === event.ActionId)
				if (!exist) {
					this.events.splice(index, 1)
				}
			})

			// проверка в настройках на старые мероприятия и чистка настроек от них
			if (settings.getSelectedEvents.length) {
				for(let i = settings.getSelectedEvents.length - 1; i >= 0; i--) {
					const exist = this.events.find(item => item.ActionId === settings.getSelectedEvents[i])
					if (!exist) settings.getSelectedEvents.splice(i, 1)
				}
			}
		},
	},
})
