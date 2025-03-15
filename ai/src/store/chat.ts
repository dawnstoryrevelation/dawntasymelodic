// src/store/chat.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { openaiService } from '../../server/api/openai';

export const useChatStore = defineStore('chat', () => {
  // State
  const chats = ref([]);
  const currentChat = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const currentUserId = ref(null);
  
  // Get database reference
  const db = getFirestore();
  const auth = getAuth();
  
  // Computed properties
  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => {
      const dateA = a.updatedAt instanceof Timestamp ? a.updatedAt.toDate() : new Date(a.updatedAt);
      const dateB = b.updatedAt instanceof Timestamp ? b.updatedAt.toDate() : new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    });
  });

  // Set current user ID (call this after auth is initialized)
  function setUserId(userId) {
    currentUserId.value = userId;
    
    // Try to get user from Auth if not provided
    if (!userId && auth.currentUser) {
      currentUserId.value = auth.currentUser.uid;
    }
  }
  
  // Fetch user's chats from Firestore
  async function fetchChats() {
    if (!currentUserId.value && auth.currentUser) {
      currentUserId.value = auth.currentUser.uid;
    }
    
    if (!currentUserId.value) {
      error.value = 'User not authenticated';
      return [];
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const q = query(
        collection(db, 'chats'),
        where('userId', '==', currentUserId.value),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      chats.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return chats.value;
    } catch (err) {
      console.error('Error fetching chats:', err);
      error.value = 'Failed to load chats. Please try again later.';
      return [];
    } finally {
      isLoading.value = false;
    }
  }
  
  // Fetch & Subscribe to Chat (Real-Time Updates)
  async function fetchChat(chatId) {
    if (!currentUserId.value && auth.currentUser) {
      currentUserId.value = auth.currentUser.uid;
    }
    
    if (!currentUserId.value) {
      error.value = 'User not authenticated';
      return null;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const docRef = doc(db, 'chats', chatId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().userId === currentUserId.value) {
        currentChat.value = {
          id: docSnap.id,
          ...docSnap.data()
        };
        
        // Subscribe to real-time updates
        subscribeToChat(chatId);
        
        return currentChat.value;
      } else {
        error.value = 'Chat not found or access denied.';
        currentChat.value = null;
        return null;
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
      error.value = 'Failed to load the chat. Please try again later.';
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Real-time Chat Sync
  let unsubscribe = null;
  
  function subscribeToChat(chatId) {
    if (unsubscribe) {
      unsubscribe(); // Clean up previous listener
    }
    
    const docRef = doc(db, 'chats', chatId);
    unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        currentChat.value = {
          id: doc.id,
          ...doc.data()
        };
      }
    });
  }
  
  // Create a New Chat
  async function createChat(options: { title?: string; initialPrompt?: string } = {}) {
    if (!currentUserId.value && auth.currentUser) {
      currentUserId.value = auth.currentUser.uid;
    }
    
    if (!currentUserId.value) {
      error.value = 'User not authenticated';
      return null;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const newChat = {
        title: options.title || options.initialPrompt?.slice(0, 30) + '...' || 'New Conversation',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: currentUserId.value,
        messages: []
      };
      
      const docRef = await addDoc(collection(db, 'chats'), newChat);
      
      // Add new chat to local state
      const chatWithId = { id: docRef.id, ...newChat, messages: [] };
      chats.value.unshift(chatWithId);
      
      // If there's an initial prompt, send it right away
      if (options?.initialPrompt) {
        currentChat.value = chatWithId;
        await sendMessage(options.initialPrompt);
      }
      
      return docRef.id;
    } catch (err) {
      console.error('Error creating chat:', err);
      error.value = 'Failed to create a new chat.';
      return null;
    } finally {
      isLoading.value = false;
    }
  }
  
  // Send Message with AI Response
  async function sendMessage(content) {
    if (!currentUserId.value && auth.currentUser) {
      currentUserId.value = auth.currentUser.uid;
    }
    
    if (!currentUserId.value || !currentChat.value) {
      error.value = 'User not authenticated or no active chat';
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const chatRef = doc(db, 'chats', currentChat.value.id);

      // Add user message to Firestore
      const userMessage = {
        content,
        role: 'user',
        timestamp: new Date()
      };
      
      await updateDoc(chatRef, {
        messages: arrayUnion(userMessage),
        updatedAt: serverTimestamp()
      });

      // Add message to local state for immediate display
      if (!currentChat.value.messages) {
        currentChat.value.messages = [];
      }
      currentChat.value.messages.push(userMessage);

      // Get previous messages for context
      const messageHistory = currentChat.value.messages
        .slice(0, -1) // Exclude the message we just added
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Get AI Response
      let aiResponse = '';
      
      await openaiService.streamCompletion(
        content,
        messageHistory,
        {
          systemPrompt: 'You are DawntasyAI, a helpful AI assistant from the Dawntasy universe.',
          onChunk: (chunk, fullText) => {
            aiResponse = fullText;
            
            // Update the UI with the partial response
            const lastMessage = currentChat.value?.messages[currentChat.value.messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = aiResponse;
            } else if (currentChat.value) {
              // Add a new message for the assistant's response
              currentChat.value.messages.push({
                content: aiResponse,
                role: 'assistant',
                timestamp: new Date()
              });
            }
          }
        }
      );

      // Once complete, save the final AI response to Firestore
      const aiMessage = {
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date()
      };
      
      await updateDoc(chatRef, {
        messages: arrayUnion(aiMessage),
        updatedAt: serverTimestamp()
      });

      // Auto-update chat title on first message
      if (currentChat.value.messages.length <= 3) {
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        await updateDoc(chatRef, { title });
        if (currentChat.value) {
          currentChat.value.title = title;
        }
      }

      return {
        userMessage,
        aiMessage
      };

    } catch (err) {
      console.error('Error sending message:', err);
      error.value = 'Failed to send the message. Please try again later.';
      
      // Add error message to chat for better UX
      if (currentChat.value && currentChat.value.messages) {
        currentChat.value.messages.push({
          content: "Sorry, I'm having trouble connecting. Please try again.",
          role: 'assistant',
          timestamp: new Date()
        });
      }
      
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    chats,
    currentChat,
    isLoading,
    error,
    sortedChats,
    setUserId,
    fetchChats,
    fetchChat,
    createChat,
    sendMessage
  };
});