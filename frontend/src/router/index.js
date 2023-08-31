import { createRouter, createWebHistory } from 'vue-router'
import { useErrorLog } from '@/store/errorLog'
import {isUserAuth, isUserUnAuth } from '@/router/authGuard'

import LoginView from '../view/LoginView.vue'
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
			path: '/login',
			name: 'Login',
			component: LoginView,
			beforeEnter: isUserUnAuth,
		},
		{
			path: '/scanner',
			name: 'Scanner',
			component: ScannerView,
			beforeEnter: isUserAuth,
		},
		{
			path: '/log',
			name: 'Log',
			component: LogView,
			beforeEnter: [isUserAuth, isLogPageAvailable]
		},
		{
			path: '/:pathMatch(.*)*',
			redirect: '/login'
		}
	]
})

export default router