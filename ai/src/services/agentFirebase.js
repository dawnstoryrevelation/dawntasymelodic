// src/services/agentFirebase.js
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    Timestamp, 
    serverTimestamp 
  } from 'firebase/firestore';
  import { db, auth } from '@/firebase/init';
  
  /**
   * Service for handling agent chat data in Firebase
   */
  export function useFirebaseChat() {
    /**
     * Get user ID, returning null if not authenticated
     */
    const getUserId = () => {
      const user = auth.currentUser;
      return user ? user.uid : null;
    };
    
    /**
     * Save a chat to Firestore
     */
    const saveChat = async (chatId, messages) => {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      try {
        // Clean up message data before saving (removing large data and circularities)
        const cleanMessages = messages.map(message => {
          // Create a clean copy without files data and other large objects
          const cleanMessage = {
            role: message.role,
            content: message.content,
            timestamp: message.timestamp || new Date(),
          };
          
          // Include reasoning if present
          if (message.reasoning) {
            cleanMessage.reasoning = message.reasoning;
          }
          
          // Include metadata about files without the actual file data
          if (message.files && message.files.length > 0) {
            cleanMessage.fileMetadata = message.files.map(file => ({
              name: file.name,
              type: file.type,
              size: file.size
            }));
          }
          
          // Include browser usage flag if present
          if (message.usedBrowser !== undefined) {
            cleanMessage.usedBrowser = message.usedBrowser;
          }
          
          return cleanMessage;
        });
        
        // Get the chat document reference
        const chatRef = doc(db, 'agentChats', chatId);
        
        // Check if the chat already exists
        const chatDoc = await getDoc(chatRef);
        
        if (chatDoc.exists()) {
          // Update existing chat
          await updateDoc(chatRef, {
            messages: cleanMessages,
            updatedAt: serverTimestamp(),
            lastMessage: cleanMessages[cleanMessages.length - 1]?.content || ''
          });
        } else {
          // Create new chat
          await setDoc(chatRef, {
            id: chatId,
            userId,
            messages: cleanMessages,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            title: getDefaultChatTitle(cleanMessages),
            lastMessage: cleanMessages[cleanMessages.length - 1]?.content || ''
          });
          
          // Also add to user's chats collection for easier queries
          const userChatRef = doc(db, 'users', userId, 'agentChats', chatId);
          await setDoc(userChatRef, {
            chatId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            title: getDefaultChatTitle(cleanMessages)
          });
        }
        
        return { success: true, chatId };
      } catch (error) {
        console.error('Error saving chat:', error);
        throw new Error(`Failed to save chat: ${error.message}`);
      }
    };
    
    /**
     * Load a chat from Firestore
     */
    const loadChat = async (chatId) => {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      try {
        // Get the chat document
        const chatRef = doc(db, 'agentChats', chatId);
        const chatDoc = await getDoc(chatRef);
        
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          
          // Verify this chat belongs to the current user
          if (chatData.userId !== userId) {
            throw new Error('You do not have permission to access this chat');
          }
          
          // Convert Firestore timestamps to JavaScript Dates
          const messages = chatData.messages.map(message => {
            // Convert timestamp if it's a Firestore Timestamp
            let timestamp = message.timestamp;
            if (timestamp && typeof timestamp.toDate === 'function') {
              timestamp = timestamp.toDate();
            } else if (timestamp) {
              // If timestamp is a string or number, convert to Date
              timestamp = new Date(timestamp);
            } else {
              timestamp = new Date();
            }
            
            return {
              ...message,
              timestamp
            };
          });
          
          return {
            id: chatId,
            title: chatData.title || 'Untitled Chat',
            messages,
            createdAt: chatData.createdAt?.toDate() || new Date(),
            updatedAt: chatData.updatedAt?.toDate() || new Date()
          };
        } else {
          throw new Error('Chat not found');
        }
      } catch (error) {
        console.error('Error loading chat:', error);
        throw new Error(`Failed to load chat: ${error.message}`);
      }
    };
    
    /**
     * Get user's recent chats
     */
    const getRecentChats = async (limit = 10) => {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      try {
        // Query the user's chats subcollection
        const chatsRef = collection(db, 'users', userId, 'agentChats');
        const q = query(
          chatsRef,
          orderBy('updatedAt', 'desc'),
          limit(limit)
        );
        
        const querySnapshot = await getDocs(q);
        
        const chats = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          
          // Convert timestamps to dates
          const createdAt = data.createdAt?.toDate() || new Date();
          const updatedAt = data.updatedAt?.toDate() || new Date();
          
          chats.push({
            id: data.chatId,
            title: data.title || 'Untitled Chat',
            createdAt,
            updatedAt
          });
        });
        
        return chats;
      } catch (error) {
        console.error('Error getting recent chats:', error);
        throw new Error(`Failed to get recent chats: ${error.message}`);
      }
    };
    
    /**
     * Delete a chat
     */
    const deleteChat = async (chatId) => {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      try {
        // Delete from main chats collection
        const chatRef = doc(db, 'agentChats', chatId);
        
        // Verify ownership before deleting
        const chatDoc = await getDoc(chatRef);
        if (!chatDoc.exists()) {
          throw new Error('Chat not found');
        }
        
        const chatData = chatDoc.data();
        if (chatData.userId !== userId) {
          throw new Error('You do not have permission to delete this chat');
        }
        
        // Delete from main chats collection
        await setDoc(chatRef, {
          deleted: true,
          deletedAt: serverTimestamp()
        }, { merge: true });
        
        // Delete from user's chats subcollection
        const userChatRef = doc(db, 'users', userId, 'agentChats', chatId);
        await setDoc(userChatRef, {
          deleted: true,
          deletedAt: serverTimestamp()
        }, { merge: true });
        
        return { success: true };
      } catch (error) {
        console.error('Error deleting chat:', error);
        throw new Error(`Failed to delete chat: ${error.message}`);
      }
    };
    
    /**
     * Update chat title
     */
    const updateChatTitle = async (chatId, title) => {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      try {
        // Update in main chats collection
        const chatRef = doc(db, 'agentChats', chatId);
        await updateDoc(chatRef, {
          title,
          updatedAt: serverTimestamp()
        });
        
        // Update in user's chats subcollection
        const userChatRef = doc(db, 'users', userId, 'agentChats', chatId);
        await updateDoc(userChatRef, {
          title,
          updatedAt: serverTimestamp()
        });
        
        return { success: true };
      } catch (error) {
        console.error('Error updating chat title:', error);
        throw new Error(`Failed to update chat title: ${error.message}`);
      }
    };
    
    /**
     * Helper function to generate a default chat title from messages
     */
    const getDefaultChatTitle = (messages) => {
      // Try to get the first user message
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      
      if (firstUserMessage) {
        // Truncate and clean the message to create a title
        const content = firstUserMessage.content || '';
        const truncated = content.substring(0, 30);
        return truncated + (content.length > 30 ? '...' : '');
      }
      
      // Fallback title
      return 'New Agent Chat';
    };
    
    return {
      saveChat,
      loadChat,
      getRecentChats,
      deleteChat,
      updateChatTitle
    };
  }