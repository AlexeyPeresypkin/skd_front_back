<script setup>
import { onBeforeMount, onMounted } from 'vue'

import { useStore } from './store/store'
import { useCamera } from './store/camera'

const store = useStore()
const camera = useCamera()

// hooks
onBeforeMount(async () => {
  store.initializeTime()
	store.initializeAxios()
})
</script>

<template>
  <router-view />
</template>