<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-cosmic-dark py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-display font-bold cosmic-glow">DawntasyAI</h1>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Or
          <router-link to="/register" class="font-medium text-cosmic-accent hover:text-cosmic-glow">
            create a new account
          </router-link>
        </p>
      </div>
      
      <div class="mt-8 card p-6">
        <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {{ error }}
        </div>
        
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <div class="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="email"
                class="input"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div class="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                v-model="password"
                class="input"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              class="btn btn-primary w-full flex justify-center"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="mr-2">
                <i class="ri-loader-4-line animate-spin"></i>
              </span>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

async function handleLogin() {
  isLoading.value = true;
  error.value = '';
  
  const result = await authStore.login(email.value, password.value);
  
  if (result.success) {
    router.push('/');
  } else {
    error.value = result.error || 'Failed to sign in. Please check your credentials.';
  }
  
  isLoading.value = false;
}
</script>
