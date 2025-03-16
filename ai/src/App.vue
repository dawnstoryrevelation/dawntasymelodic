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
// Import ALL the shiny toys—including our VIP defineAsyncComponent! ✨
import { ref, computed, onMounted, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/init'; // Firebase magic—BOOP BOOP! 🔥
import { useChatStore } from './store/chat';

// Dynamically import components—laziness LEVEL 9000! 😴
const AppHeader = defineAsyncComponent(() => import('./components/AppHeader.vue'));
const AppSidebar = defineAsyncComponent(() => import('./components/AppSidebar.vue'));

// Reactive goodies—time to get BOUNCY! 🦘
const isDarkMode = ref(true);
const isAuthenticated = ref(false);
const userProfile = ref(null);
const chatStore = useChatStore();

// Grab that route like a treasure map! 🗺️
const route = useRoute();

// Compute current route name—ooh, so fancy! 💃
const currentRoute = computed(() => route.name);

// Compute sidebar visibility—peekaboo, I see you! 👀
const showSidebar = computed(() => {
  const publicRoutes = ['Landing', 'Login', 'Register', 'NotFound'];
  return !publicRoutes.includes(route.name);
});

// Mouse move handler—wiggle wiggle, mousey! 🐭
const handleMouseMove = (event) => {
  if (!window.lastMoveTime || Date.now() - window.lastMoveTime > 50) {
    window.lastMoveTime = Date.now();
    // Mousey dance party—SHAKE IT! 💃🕺
  }
};

// Initialize auth state—let’s get WILD with Firebase! 🎉
onMounted(() => {
  // Listen for auth changes like a ninja on a sugar rush! 🥷🍬
  const unsubscribe = onAuthStateChanged(auth, (user) => { // Fixed: auth, not auth()!
    isAuthenticated.value = !!user;
    
    if (user) {
      userProfile.value = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
      };
      chatStore.setUserId(user.uid);
      console.log('User logged in—PARTY TIME! 🎈');
    } else {
      userProfile.value = null;
      chatStore.setUserId(null);
      console.log('User vanished—POOF! 💨');
    }
  });
  
  // Cleanup INSIDE onMounted—no escapees allowed! 🚨
  return () => {
    unsubscribe();
    console.log('Cleanup crew reporting—BROOM BROOM! 🧹');
  };
}); // BOSS DEFEATED—HP: -9999! 💥

</script>

<style>
.dawntasy-app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%);
  /* Cosmic vibes—SPARKLE SPARKLE! ✨ */
}

.quantum-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* Layout so cool it’s basically a superhero! 🦸 */
}

.quantum-content {
  flex: 1;
  padding: 1rem;
  /* Content area—ready to SHINE! 🌟 */
}

.quantum-content.with-sidebar {
  margin-left: 16rem;
  /* Sidebar’s best friend—HUGS! 🤗 */
}

@media (max-width: 768px) {
  .quantum-content.with-sidebar {
    margin-left: 4rem;
    /* Tiny screen, tiny hugs—SQUEEZE! 🐾 */
  }
}
</style>