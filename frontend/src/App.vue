<script setup>
import { onBeforeMount, onMounted } from 'vue'

import { useStore } from './store/store'
import { useCamera } from './store/camera'

const store = useStore()
const camera = useCamera()

// hooks
onBeforeMount(async () => {
  if (!(import.meta.env.VITE_ATOL.toLowerCase() === 'true')) { await camera.initialize() }
  store.initializeTime()
})
onMounted(() => {
  store.initializeAxios()
})
</script>

<template>
  <router-view />
</template>