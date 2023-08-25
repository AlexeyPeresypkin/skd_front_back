<script setup>
import { computed } from 'vue'

import { useStore } from '@/store/store'
import { useSettings } from '@/store/settings'

const store = useStore()
const settings = useSettings()

const wrapperStyle = computed(() => {
	let style = {}
	switch(true) {
    case !store.ticketCheckResult:
			break
    case store.ticketCheckResult &&
         (store.ticketCheckResult.Result === 10 || store.ticketCheckResult.Result === 0) &&
         !!store.ticketCheckResult.PushkinCardText:
      style.background = settings.colors.pushkin
      break
    case store.ticketCheckResult &&
         store.ticketCheckResult.Result === 0:  // проход разрешен
      style.background = settings.colors.success
			break
    case store.ticketCheckResult && store.ticketCheckResult.Result === 1:
    case store.ticketCheckResult && store.ticketCheckResult.Result === 2:
    case store.ticketCheckResult && store.ticketCheckResult.Result === 3:
    case store.ticketCheckResult && store.ticketCheckResult.Result === 4:   // проход по билету осуществлен
      style.background = settings.colors.error
			break
  }

	return style
})
const ticketNumber = computed(() => {
  if (!store.ticketCheckResult || !store.ticketCheckResult.TicketNumber) return ''
  return `№ Билета ${store.ticketCheckResult.TicketNumber}`
})
const dateProhod = computed(() => {
	if (!store.ticketCheckResult || !store.ticketCheckResult.DateProhod) return ''
  return store.ticketCheckResult.DateProhod.replace('T', ' ').replace(/\.[0-9]*/g, '')
})
const eventName = computed(() => {
	return store.ticketCheckResult ? store.ticketCheckResult.EventName : ''
})
const statusText = computed(() => {
	return store.ticketCheckResult ? store.ticketCheckResult.StatusText : ''
})

</script>

<template>
  <div
    class='display-wrapper'
    :style='wrapperStyle'
  >
    <div class='ticket-number'>{{ ticketNumber }}</div>
    <div class='pass-time'>{{ dateProhod }}</div>
    <div class='event-name'>{{ eventName }}</div>
    <div class='status-text'>{{ statusText }}</div>
  </div>
</template>

<style scoped>
.display-wrapper {
  overflow: auto;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  grid-column: span 2;

  padding: 10px;

  height: 100%;
  width: 100%;

  border-radius: 3px;
  border: 1px solid var(--el-border-color);

  background: white;
}

.ticket-number {
  margin-bottom: 10px;

  text-align: center;
  font-size: 1.5rem;
  background: none;
}
.pass-time {
  margin-bottom: 10px;

  text-align: center;
  font-size: 1.5rem;
  background: none;
  word-break: break-word;
}
.event-name {
  margin-bottom: 10px;

  text-align: center;
  font-size: 1.85rem;
  background: none;
  word-break: break-word;
}
.status-text {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  background: none;
  word-break: break-word;
}
</style>