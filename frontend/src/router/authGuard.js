import { useStore } from '@/store/store'

export const isUserAuth = () => {
	const store = useStore()

	if (!store.token) {
		return { name: 'Login' }
	}
}

export const isUserUnAuth = (to, from) => {
	const rest = useStore()

	if (rest.token && !!from.name) {
		return false
	} else if (rest.token) {
		return { name: 'Scanner' }
	}
}