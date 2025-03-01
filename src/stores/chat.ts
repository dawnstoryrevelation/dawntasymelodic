import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import { firestore } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { callOpenAI } from '../services/openai';

export interface Message {
  id?: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Timestamp | Date;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  userId: string;
  messages: Message[];
}

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore();
  
  const chats = ref<Chat[]>([]);
  const currentChat = ref<Chat | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // Computed
  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => {
      const dateA = a.updatedAt instanceof Timestamp ? a.updatedAt.toDate() : new Date(a.updatedAt);
      const dateB = b.updatedAt instanceof Timestamp ? b.updatedAt.toDate() : new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    });
  });
  
  // Actions
  async function fetchChats() {
    if (!authStore.user?.uid) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const q = query(
        collection(firestore, 'chats'),
        where('userId', '==', authStore.user.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      chats.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }
  
  async function fetchChat(chatId: string) {
    if (!authStore.user?.uid) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const docRef = doc(firestore, 'chats', chatId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().userId === authStore.user.uid) {
        currentChat.value = {
          id: docSnap.id,
          ...docSnap.data()
        } as Chat;
        
        // Subscribe to real-time updates for this chat
        subscribeToChat(chatId);
      } else {
        error.value = 'Chat not found or access denied';
        currentChat.value = null;
      }
    } catch (err: any) {
      console.error('Error fetching chat:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }
  
  let unsubscribe: (() => void) | null = null;
  
  function subscribeToChat(chatId: string) {
    // Unsubscribe from previous listener if exists
    if (unsubscribe) {
      unsubscribe();
    }
    
    const docRef = doc(firestore, 'chats', chatId);
    unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        currentChat.value = {
          id: doc.id,
          ...doc.data()
        } as Chat;
      }
    });
  }
  
  async function createChat() {
    if (!authStore.user?.uid) return null;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const newChat = {
        title: 'New Conversation',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: authStore.user.uid,
        messages: []
      };
      
      const docRef = await addDoc(collection(firestore, 'chats'), newChat);
      
      // Add to local state
      const chatWithId = {
        id: docRef.id,
        ...newChat,
        messages: []
      };
      
      chats.value.unshift(chatWithId as Chat);
      
      return docRef.id;
    } catch (err: any) {
      console.error('Error creating chat:', err);
      error.value = err.message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  async function sendMessage(content: string) {
    if (!authStore.user?.uid || !currentChat.value) return;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      // Add user message
      const userMessage: Message = {
        content,
        role: 'user',
        timestamp: new Date()
      };
      
      // Update Firestore
      const chatRef = doc(firestore, 'chats', currentChat.value.id);
      
      await updateDoc(chatRef, {
        messages: [...currentChat.value.messages, userMessage],
        updatedAt: serverTimestamp()
      });
      
      // Get AI response
      const aiResponse = await callOpenAI(content, currentChat.value.messages);
      
      // Add AI message
      const aiMessage: Message = {
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date()
      };
      
      // Update Firestore with AI response
      await updateDoc(chatRef, {
        messages: [...currentChat.value.messages, userMessage, aiMessage],
        updatedAt: serverTimestamp()
      });
      
      // Update chat title if this is the first message
      if (currentChat.value.messages.length === 0) {
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        await updateDoc(chatRef, { title });
      }
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }
  
  // For testing purposes
  async function writeTestChat() {
    if (!authStore.user?.uid || !currentChat.value) return;
    
    try {
      // Add test messages
      const userMessage: Message = {
        content: "This is a test message from the user",
        role: 'user',
        timestamp: new Date()
      };
      
      const aiMessage: Message = {
        content: "This is a test response from DawntasyAI. I'm here to assist you with anything you need!",
        role: 'assistant',
        timestamp: new Date()
      };
      
      // Update Firestore
      const chatRef = doc(firestore, 'chats', currentChat.value.id);
      
      await updateDoc(chatRef, {
        messages: [...currentChat.value.messages, userMessage, aiMessage],
        updatedAt: serverTimestamp()
      });
      
    } catch (err: any) {
      console.error('Error writing test chat:', err);
      error.value = err.message;
    }
  }
  
  return {
    chats,
    currentChat,
    isLoading,
    error,
    sortedChats,
    fetchChats,
    fetchChat,
    createChat,
    sendMessage,
    writeTestChat
  };
});
