import { createApp } from 'vue'
import { createPinia } from 'pinia'

// import element plus theme
import ElementPlus from 'element-plus'
import ru from 'element-plus/dist/locale/ru.mjs'

// font awesome icons
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(faSpinner)

// styles
import 'element-plus/dist/index.css'
import './assets/styles.css'
import './assets/font/stylesheet.css'


import App from './App.vue'
import router from './router'

const app = createApp(App)

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: ru })
app.mount('#app')