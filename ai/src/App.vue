<template>
  <div 
    :class="{ 'dark': isDarkMode }" 
    class="dawntasy-app-container"
    @mousemove="handleMouseMove"
    aria-live="polite"
  >
    <!-- App Layout -->
    <div class="quantum-layout">
      <!-- App Header -->
      <AppHeader 
        v-if="isAuthenticated" 
        :user-profile="userProfile"
        aria-labelledby="main-navigation"
      />

      <!-- Sidebar -->
      <AppSidebar 
        v-if="isAuthenticated && showSidebar" 
        :active-route="currentRoute"
        aria-label="Application Sidebar"
      />

      <!-- Main Content -->
      <main 
        class="quantum-content" 
        :class="{ 'with-sidebar': isAuthenticated && showSidebar }"
        role="main"
      >
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
// Import components and Vue APIs, including defineAsyncComponent to fix the error
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/init';
import { useChatStore } from './store/chat';

// Dynamically import components to prevent initial loading issues
const AppHeader = defineAsyncComponent(() => import('./components/AppHeader.vue'));
const AppSidebar = defineAsyncComponent(() => import('./components/AppSidebar.vue'));

// Simple reactive state
const isDarkMode = ref(true);
const isAuthenticated = ref(false);
const userProfile = ref(null);
const chatStore = useChatStore();

// Get current route
const route = useRoute();

// Compute current route name
const currentRoute = computed(() => route.name);

// Compute whether to show sidebar
const showSidebar = computed(() => {
  const publicRoutes = ['Landing', 'Login', 'Register', 'NotFound'];
  return !publicRoutes.includes(route.name);
});

// Mouse move handler
const handleMouseMove = (event) => {
  // Simple throttling
  if (!window.lastMoveTime || Date.now() - window.lastMoveTime > 50) {
    window.lastMoveTime = Date.now();
    // Your mouse move logic here
  }
};

// Initialize auth state
onMounted(() => {
    isAuthenticated.value = !!user;
    
    if (user) {
      userProfile.value = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
      };
      chatStore.setUserId(user.uid);
    } else {
      userProfile.value = null;
      chatStore.setUserId(null);
    }
  });
  
  // Clean up the subscription when component unmounts
  return () => unsubscribe();
});
</script>

<style>
.dawntasy-app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%);
}

.quantum-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.quantum-content {
  flex: 1;
  padding: 1rem;
}

.quantum-content.with-sidebar {
  margin-left: 16rem;
}

@media (max-width: 768px) {
  .quantum-content.with-sidebar {
    margin-left: 4rem;
  }
}
</style>