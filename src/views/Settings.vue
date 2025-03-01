<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="card p-8 dark:bg-cosmic-light">
      <h1 class="text-3xl font-display font-bold cosmic-glow text-center mb-6">
        Settings
      </h1>

      <!-- Theme Selection -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-3">Theme</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            v-for="theme in themes"
            :key="theme.id"
            @click="setTheme(theme.id)"
            :class="[
              'p-4 rounded-lg shadow-md transition-all duration-300',
              theme.id === selectedTheme ? 'ring-2 ring-cosmic-accent' : ''
            ]"
            :style="{ backgroundColor: theme.color }"
          >
            <span class="block text-center text-white font-medium">
              {{ theme.name }}
            </span>
          </button>
        </div>
      </div>

      <!-- Notifications -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-3">Notifications</h2>
        <label class="flex items-center space-x-3 cursor-pointer">
          <input type="checkbox" v-model="notificationsEnabled" class="hidden" />
          <div class="relative w-12 h-6 bg-gray-400 rounded-full transition-all">
            <div
              class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all"
              :class="notificationsEnabled ? 'translate-x-6 bg-cosmic-accent' : ''"
            ></div>
          </div>
          <span class="text-gray-700 dark:text-gray-300">
            Enable Notifications
          </span>
        </label>
      </div>

      <!-- Account Settings -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-3">Account</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-3">
          Signed in as <strong>{{ authStore.user?.email }}</strong>
        </p>
        <button @click="logout" class="btn btn-danger">
          <i class="ri-logout-box-line mr-2"></i> Logout
        </button>
      </div>

      <!-- Save Button -->
      <div class="text-center">
        <button @click="saveSettings" class="btn btn-primary">
          <i class="ri-save-line mr-2"></i> Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useThemeStore } from '../stores/theme';
import { useRouter } from 'vue-router';

// Stores
const authStore = useAuthStore();
const themeStore = useThemeStore();
const router = useRouter();

// Theme settings
const themes = ref([
  { id: 'light', name: 'Light', color: '#ffffff' },
  { id: 'dark', name: 'Dark', color: '#0f172a' },
  { id: 'cosmic', name: 'Cosmic', color: '#8b5cf6' },
  { id: 'ocean', name: 'Ocean', color: '#0ea5e9' }
]);

const selectedTheme = ref(themeStore.currentTheme);
const notificationsEnabled = ref(false);

// Watch theme changes
watchEffect(() => {
  selectedTheme.value = themeStore.currentTheme;
});

// Set theme
function setTheme(themeId: string) {
  selectedTheme.value = themeId;
  themeStore.setTheme(themeId);
}

// Logout function
async function logout() {
  const result = await authStore.signOut();
  if (result.success) {
    router.push('/login');
  }
}

// Save settings
function saveSettings() {
  console.log("Settings saved:", {
    theme: selectedTheme.value,
    notifications: notificationsEnabled.value
  });
  alert("Settings saved successfully!");
}
</script>
