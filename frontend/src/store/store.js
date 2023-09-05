import { ElMessageBox } from 'element-plus'
import { defineStore } from 'pinia'

import { useRouter } from 'vue-router'
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

			token: localStorage.getItem('profticket_skd') || null
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
			const router = useRouter()

			axios.defaults.baseURL = `${import.meta.env.VITE_BASE_URL}:${import.meta.env.VITE_BASE_PORT}`
			if (this.token) axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
			this.axios = axios.create()

			this.axios.interceptors.response.use((response) => {
				return response
			}, async (error) => {
				switch(true) {
					case error.response.status === 401 && error.response.data.detail !== 'Incorrect username or password':
						this.removeToken()
						await ElMessageBox({
							message:
								`<div class='warning-message'>
						 			<span class='warning-title'>Время действия токена авторизации истекло. <br/> Вы будете перенаправлены на страницу авторизации.</span>
<!--						  <span class='warning-subtitle'>При возникновении этой ситуации несколько раз подряд при входе в систему обратитесь к техническому специалисту</span>-->
            		</div>`,
							dangerouslyUseHTMLString: true,
							showConfirmButton: true,
							closeOnClickModal: false,
							closeOnPressEscape: false,
							showClose: true,
						})
						await router.push({name: 'Login'})
						break
					default:
						ElNotification({
							title: 'Внимание',
							type: 'error',
							message: 'Возникла ошибка'
						})
				}
				return Promise.reject(error)
			})
		},
		initializeWss: function() {
			this.ws = new WebSocket(`${import.meta.env.VITE_WSS_URL}:${import.meta.env.VITE_BASE_PORT}/repertoire`)

			this.ws.onopen = () => {
				console.log('ws connection established')
			}
			this.ws.onmessage = async (message) => {
				const resp = JSON.parse(message.data)
				if (resp && resp.detail === 'invalid token') {
					this.removeToken()
					await ElMessageBox({
						message:
						`<div class='warning-message'>
						 	<span class='warning-title'>Время действия токена авторизации истекло. <br/> Вы будете перенаправлены на страницу авторизации.</span>
<!--						  <span class='warning-subtitle'>При возникновении этой ситуации несколько раз подряд при входе в систему обратитесь к техническому специалисту</span>-->
            </div>`,
						dangerouslyUseHTMLString: true,
						showConfirmButton: false
					})
					return
				}
				this.setEvents(JSON.parse(message.data))
			}
			this.ws.onclose = () => {
				console.log('ws connection was closed, trying to reconnect')
				setTimeout(() => {
					location.reload()
				}, 5000)
			}
			this.ws.onerror = () => {
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
				token: this.token,
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

			const res = await this.axios.post('/barcode', request)

			this.ticketCheckResult = res.data
			this.ticketCheckResult.TicketNumber = this.ticketNumber
			this.ticketNumber = null

			if (res.data.Result !== 0) {
				this.ticketCheckResult.ErrorTime = Date.now()
				errorLog.setLog(this.ticketCheckResult)
			}

			this.loader = false
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
		setToken: function(token) {
			this.token = token
			window.localStorage.setItem('profticket_skd', token)
			this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
		},
		removeToken: function() {
			this.token = null
			window.localStorage.removeItem('profticket_skd')
			this.axios.defaults.headers.common['Authorization'] = ''
		}
	},
})
