import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Create application
const app = createApp(App)

// Use Pinia for state management
app.use(createPinia())

// Use router
app.use(router)

// Handle redirects from 404.html
const redirectParam = new URLSearchParams(window.location.search).get('redirect')
if (redirectParam) {
  // Remove the base path from the redirected route
  const basePath = '/dawntasymelodic/ai'
  const redirectPath = redirectParam.startsWith(basePath) 
    ? redirectParam.slice(basePath.length) 
    : redirectParam
  
  // Use the router to navigate to the correct route
  router.push(redirectPath || '/')
  
  // Clean up the URL
  window.history.replaceState(null, '', window.location.pathname)
}

// Mount the app
app.mount('#app')