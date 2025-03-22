<template>
    <div class="mindmaps-container">
      <div class="top-bar">
        <button class="back-button" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
          <span>Back</span>
        </button>
        <h1>Saved Mind Maps</h1>
        <button class="create-button" @click="goToChat">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"></path>
          </svg>
          <span>New Mind Map</span>
        </button>
      </div>
      
      <div class="mindmaps-grid">
        <div v-if="isLoading" class="loading-indicator">
          <div class="spinner"></div>
          <span>Loading mind maps...</span>
        </div>
        
        <div v-else-if="mindMaps.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h3>No Mind Maps Found</h3>
          <p>Create your first mind map to visualize concepts and ideas.</p>
          <button class="btn-primary" @click="goToChat">Create Mind Map</button>
        </div>
        
        <div v-else class="mindmap-tiles">
          <div 
            v-for="mindMap in mindMaps" 
            :key="mindMap.id"
            class="mindmap-tile"
            @click="openMindMap(mindMap)"
          >
            <div class="mindmap-preview">
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle cx="50" cy="50" r="10" fill="#8b5cf6" />
                <circle cx="30" cy="30" r="6" fill="#6366f1" />
                <circle cx="70" cy="30" r="6" fill="#6366f1" />
                <circle cx="30" cy="70" r="6" fill="#6366f1" />
                <circle cx="70" cy="70" r="6" fill="#6366f1" />
                <line x1="50" y1="50" x2="30" y2="30" stroke="#6366f1" stroke-width="1" />
                <line x1="50" y1="50" x2="70" y2="30" stroke="#6366f1" stroke-width="1" />
                <line x1="50" y1="50" x2="30" y2="70" stroke="#6366f1" stroke-width="1" />
                <line x1="50" y1="50" x2="70" y2="70" stroke="#6366f1" stroke-width="1" />
              </svg>
            </div>
            <div class="mindmap-info">
              <h3 class="mindmap-name">{{ mindMap.name }}</h3>
              <div class="mindmap-subidea">{{ mindMap.subIdea }}</div>
              <div class="mindmap-meta">
                <span class="mindmap-date">{{ formatDate(mindMap.createdAt) }}</span>
                <span class="mindmap-badge">{{ getChatName(mindMap.chatId) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
  import { db } from '@/firebase/init';
  import { getAuth } from 'firebase/auth';
  import { format } from 'date-fns';
  
  const router = useRouter();
  const auth = getAuth();
  const mindMaps = ref([]);
  const isLoading = ref(true);
  const chats = ref([]);
  
  onMounted(async () => {
    await loadMindMaps();
    await loadChats();
  });
  
  const loadMindMaps = async () => {
    try {
      isLoading.value = true;
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error("User not authenticated");
        isLoading.value = false;
        return;
      }
      
      const mindMapsRef = collection(db, 'mindMaps');
      const q = query(
        mindMapsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      mindMaps.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
    } catch (error) {
      console.error("Error loading mind maps:", error);
    } finally {
      isLoading.value = false;
    }
  };
  
  const loadChats = async () => {
    try {
      const userId = auth.currentUser?.uid;
      
      if (!userId) return;
      
      const chatsRef = collection(db, `users/${userId}/chats`);
      const q = query(chatsRef);
      
      const querySnapshot = await getDocs(q);
      chats.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };
  
  const getChatName = (chatId) => {
    const chat = chats.value.find(c => c.id === chatId);
    return chat?.name || 'Unknown Chat';
  };
  
  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'MMM d, yyyy');
  };
  
  const openMindMap = (mindMap) => {
    router.push(`/mind-map/${mindMap.id}`);
  };
  
  const goBack = () => {
    router.back();
  };
  
  const goToChat = () => {
    router.push('/chat');
  };
  </script>
  
  <style scoped>
  .mindmaps-container {
    height: 100vh;
    background-color: var(--bg-main);
    color: white;
    display: flex;
    flex-direction: column;
  }
  
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--bg-main);
    border-bottom: 1px solid var(--border-light);
  }
  
  .top-bar h1 {
    font-size: 18px;
    margin: 0;
    font-weight: 500;
  }
  
  .back-button,
  .create-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .back-button:hover,
  .create-button:hover {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .create-button {
    background: var(--primary);
    border-color: var(--primary);
  }
  
  .create-button:hover {
    background: var(--primary-hover);
    border-color: var(--primary-hover);
  }
  
  .mindmaps-grid {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--text-secondary);
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top-color: var(--primary);
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 20px;
    color: var(--text-secondary);
  }
  
  .empty-icon {
    margin-bottom: 16px;
    opacity: 0.7;
  }
  
  .empty-state h3 {
    font-size: 18px;
    margin-bottom: 8px;
    color: white;
  }
  
  .empty-state p {
    margin-bottom: 24px;
    max-width: 400px;
  }
  
  .mindmap-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  
  .mindmap-tile {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .mindmap-tile:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    border-color: rgba(139, 92, 246, 0.4);
  }
  
  .mindmap-preview {
    height: 140px;
    background: rgba(15, 23, 42, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .mindmap-info {
    padding: 16px;
  }
  
  .mindmap-name {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    color: white;
  }
  
  .mindmap-subidea {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }
  
  .mindmap-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .mindmap-badge {
    background: rgba(139, 92, 246, 0.2);
    color: rgba(139, 92, 246, 0.9);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
  }
  
  @media (max-width: 768px) {
    .mindmap-tiles {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
  }
  </style>