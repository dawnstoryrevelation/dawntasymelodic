<template>
  <div class="min-h-screen flex flex-col">
    <Header v-if="authStore.isAuthenticated" />
    <div class="flex-grow flex">
      <Sidebar v-if="authStore.isAuthenticated" />
      <main class="flex-grow">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Header from './components/Header.vue';
import Sidebar from './components/Sidebar.vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

onMounted(async () => {
  await authStore.initAuth();

  if (!authStore.isAuthenticated && router.currentRoute.value.meta.requiresAuth) {
    router.push('/login');
  }
});
</script>
