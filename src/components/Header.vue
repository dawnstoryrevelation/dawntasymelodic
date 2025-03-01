<template>
  <header class="bg-cosmic-dark text-white shadow-lg">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <router-link to="/" class="flex items-center">
        <h1 class="text-2xl md:text-3xl font-display font-bold cosmic-glow animate-pulse-slow">
          DawntasyAI
        </h1>
      </router-link>
      
      <div class="flex items-center">
        <div class="relative" ref="profileDropdown">
          <button 
            @click="toggleProfileMenu" 
            class="flex items-center space-x-2 p-2 rounded-full hover:bg-cosmic-light transition-colors duration-200"
          >
            <div class="w-8 h-8 rounded-full bg-cosmic-accent flex items-center justify-center text-white">
              {{ userInitials }}
            </div>
            <span class="hidden md:block">{{ authStore.user?.displayName }}</span>
            <i class="ri-arrow-down-s-line"></i>
          </button>
          
          <div 
            v-if="showProfileMenu" 
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-cosmic-light rounded-md shadow-lg py-1 z-10"
          >
            <router-link 
              to="/profile" 
              class="block px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-cosmic-accent"
              @click="showProfileMenu = false"
            >
              <i class="ri-user-line mr-2"></i> Profile
            </router-link>
            <router-link 
              to="/settings" 
              class="block px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-cosmic-accent"
              @click="showProfileMenu = false"
            >
              <i class="ri-settings-3-line mr-2"></i> Settings
            </router-link>
            <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <button 
              @click="logout" 
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-cosmic-accent"
            >
              <i class="ri-logout-box-line mr-2"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const showProfileMenu = ref(false);
const profileDropdown = ref<HTMLElement | null>(null);

const userInitials = computed(() => {
  const name = authStore.user?.displayName || '';
  if (!name) return '?';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
});

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
}

async function logout() {
  const result = await authStore.signOut();
  if (result.success) {
    router.push('/login');
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  if (profileDropdown.value && !profileDropdown.value.contains(event.target as Node)) {
    showProfileMenu.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
