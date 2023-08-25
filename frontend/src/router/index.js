import { createRouter, createWebHistory } from 'vue-router'
import { useErrorLog } from '@/store/errorLog'

import ScannerView from '../view/ScannerView.vue'
import LogView from '../view/LogView.vue'

function isLogPageAvailable(to, from, next) {
	const errorLog = useErrorLog()
	if (errorLog.isLogEmpty) next('/scanner')
	next()
}

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/scanner',
			name: 'Scanner',
			component: ScannerView
		},
		{
			path: '/log',
			name: 'Log',
			component: LogView,
			beforeEnter: isLogPageAvailable
		},
		{
			path: '/:pathMatch(.*)*',
			redirect: '/scanner'
		}
	]
})

export default router