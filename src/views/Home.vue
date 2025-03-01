<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <div class="card p-8 dark:bg-cosmic-light">
      <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-display font-bold mb-4 cosmic-glow">
          Start your day with DawntasyAI
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300">
          Your cosmic AI assistant is ready to help with anything you need.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="card bg-gray-50 dark:bg-cosmic-dark p-6 hover:shadow-cosmic transition-all duration-300">
          <div class="flex items-center mb-4">
            <i class="ri-chat-new-line text-2xl text-cosmic-accent mr-3"></i>
            <h2 class="text-xl font-semibold">New Conversation</h2>
          </div>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            Start a fresh conversation with DawntasyAI.
          </p>
          <button @click="startNewChat" class="btn btn-primary w-full">
            <i class="ri-add-line mr-2"></i> New Chat
          </button>
        </div>
        
        <div class="card bg-gray-50 dark:bg-cosmic-dark p-6 hover:shadow-cosmic transition-all duration-300">
          <div class="flex items-center mb-4">
            <i class="ri-history-line text-2xl text-cosmic-accent mr-3"></i>
            <h2 class="text-xl font-semibold">Recent Chats</h2>
          </div>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            Continue where you left off.
          </p>
          <button @click="goToChats" class="btn btn-primary w-full">
            <i class="ri-chat-3-line mr-2"></i> View Chats
          </button>
        </div>
      </div>
      
      <div class="card bg-gray-50 dark:bg-cosmic-dark p-6 hover:shadow-cosmic transition-all duration-300">
        <div class="flex items-center mb-4">
          <i class="ri-magic-line text-2xl text-cosmic-accent mr-3"></i>
          <h2 class="text-xl font-semibold">Quick Start</h2>
        </div>
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Try asking DawntasyAI about one of these topics:
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button @click="startChatWithPrompt('Tell me about the cosmos and stars')" class="btn btn-secondary">
            <i class="ri-star-line mr-2"></i> Cosmos & Stars
          </button>
          <button @click="startChatWithPrompt('Write a short cosmic fantasy story')" class="btn btn-secondary">
            <i class="ri-book-open-line mr-2"></i> Fantasy Story
          </button>
          <button @click="startChatWithPrompt('Help me plan my day efficiently')" class="btn btn-secondary">
            <i class="ri-calendar-todo-line mr-2"></i> Daily Planning
          </button>
          <button @click="startChatWithPrompt('Explain quantum physics in simple terms')" class="btn btn-secondary">
            <i class="ri-atom-line mr-2"></i> Quantum Physics
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChatStore } from '../stores/chat';

const router = useRouter();
const chatStore = useChatStore();

onMounted(() => {
  chatStore.fetchChats();
});

async function startNewChat() {
  const chatId = await chatStore.createChat();
  if (chatId) {
    router.push(`/chat/${chatId}`);
  }
}

function goToChats() {
  router.push('/chats');
}

async function startChatWithPrompt(prompt: string) {
  const chatId = await chatStore.createChat();
  if (chatId) {
    router.push(`/chat/${chatId}`);
    // The message will be sent after navigation in the Chat component
    setTimeout(() => {
      localStorage.setItem('initialPrompt', prompt);
    }, 100);
  }
}
</script>
