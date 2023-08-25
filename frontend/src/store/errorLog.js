import { defineStore } from 'pinia'

export const useErrorLog = defineStore('errorLog', {
	state() {
		return {
			log: []
		}
	},
	getters: {
		getLog(state) {
			return state.log
		},
		isLogEmpty(state) {
			return state.log.length === 0
		}
	},
	actions: {
		setLog: function(log) {
			this.log.push(log)
		}
	}
})