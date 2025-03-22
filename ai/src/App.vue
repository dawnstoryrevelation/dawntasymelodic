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

// Dynamically import components—laziness LEVEL 9000! 

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

// Initialize auth state—let's get WILD with Firebase! 🎉
onMounted(() => {
  // Fix for mobile viewport height issues with URL bar
  const setVh = () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  // Set the initial value
  setVh();
  
  // Update on resize and orientation change
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);
  
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
    window.removeEventListener('resize', setVh);
    window.removeEventListener('orientationchange', setVh);
    console.log('Cleanup crew reporting—BROOM BROOM! 🧹');
  };
}); // BOSS DEFEATED—HP: -9999! 💥

</script>

<style>
.dawntasy-app-container {
  max-height: 100vh;
  max-height: calc(var(--vh, 1vh) * 100);
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%);
  /* Cosmic vibes—SPARKLE SPARKLE! ✨ */
}

.quantum-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: calc(var(--vh, 1vh) * 100);
  /* Layout so cool it's basically a superhero! 🦸 */
}

.quantum-content {
  flex: 1;
  padding: 1rem;
  min-height: 100vh;
  min-height: calc(var(--vh, 1vh) * 100);
  height: 1200px;
  /* Content area—ready to SHINE! 🌟 */
}

.quantum-content.with-sidebar {
  margin-left: 16rem;
  /* Sidebar's best friend—HUGS! 🤗 */
}

@media (max-width: 768px) {
  .quantum-content.with-sidebar {
    margin-left: 4rem;
    /* Tiny screen, tiny hugs—SQUEEZE! 🐾 */
  }
}

/* Mind Map specific styles that need to be global */
:root {
  --vh: 1vh;
}

/* Fix for overflowing content on mobile */
.modal-overlay {
  z-index: 1000;
  position: fixed;
}

/* Ensure modals are properly sized on mobile */
@media (max-width: 768px) {
  .mind-map-modal,
  .mind-map-visualization-modal,
  .subtopic-modal,
  .saved-mind-maps-modal {
    max-height: calc(var(--vh, 1vh) * 80);
    overflow: auto;
  }
}
</style>