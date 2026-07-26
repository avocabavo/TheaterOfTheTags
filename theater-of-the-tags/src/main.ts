import { createApp } from 'vue'
import './style.css'
import './styles/ui.css'
import App from './App.vue'

const roomName = window.location.pathname
document.title = roomName === '/'
  ? 'Theater of the Tags'
  : `Tags - ${decodeURIComponent(roomName.slice(1))}`

createApp(App)
  .mount('#app')
