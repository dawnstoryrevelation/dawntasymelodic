<template>
  <div class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <!-- Logo and Toggle -->
    <div class="sidebar-header">
      <div class="logo-container">
        <span v-if="!isCollapsed" class="logo-text">DawntasyAI</span>
      </div>
      <button class="toggle-btn" @click="toggleSidebar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
    </div>

    <!-- New Chat Button -->
    <div class="new-chat-container">
      <button class="new-chat-btn" @click="createNewChat">
        <div class="btn-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span v-if="!isCollapsed">New Chat</span>
        </div>
      </button>
    </div>

    <!-- Recent Chats -->
    <div class="section-title" v-if="!isCollapsed && userChats.length > 0">
      Recent Chats
    </div>
    <div class="chats-container" v-if="userChats.length > 0">
      <div 
        v-for="chat in userChats" 
        :key="chat.id" 
        class="chat-item" 
        :class="{ 'active': activeChatId === chat.id }"
        @click="selectChat(chat.id)"
      >
        <div class="chat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div class="chat-details" v-if="!isCollapsed">
          <div class="chat-title">{{ truncateTitle(chat.title) }}</div>
          <div class="chat-date">{{ formatDate(chat.lastUpdated) }}</div>
        </div>
        <div class="chat-actions" v-if="!isCollapsed">
          <button class="action-btn" @click.stop="renameChat(chat.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
          <button class="action-btn delete" @click.stop="confirmDeleteChat(chat.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" v-if="!isCollapsed && userChats.length === 0 && !isLoading">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div class="empty-text">
        No chats yet. Start a new conversation with DawntasyAI!
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-if="!isCollapsed && isLoading">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <div class="loading-text">Loading your chats...</div>
    </div>

    <!-- Folders (Premium Feature) -->
    <div class="section-title" v-if="!isCollapsed && isPremiumUser && userFolders.length > 0">
      Folders
    </div>
    <div class="folders-container" v-if="!isCollapsed && isPremiumUser && userFolders.length > 0">
      <div 
        v-for="folder in userFolders" 
        :key="folder.id" 
        class="folder-item"
        @click="toggleFolder(folder.id)"
      >
        <div class="folder-header">
          <div class="folder-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="folder-title">{{ folder.name }}</div>
          <div class="folder-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'rotated': openFolders.includes(folder.id) }">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        <div class="folder-chats" v-if="openFolders.includes(folder.id)">
          <div 
            v-for="chat in getFolderChats(folder.id)" 
            :key="chat.id" 
            class="folder-chat-item"
            :class="{ 'active': activeChatId === chat.id }"
            @click.stop="selectChat(chat.id)"
          >
            <div class="chat-title">{{ truncateTitle(chat.title) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Profile Section -->
    <div class="user-section">
      <div 
        class="user-profile"
        @click="toggleUserMenu"
      >
        <div class="user-avatar">
          <img v-if="user && user.photoURL" :src="user.photoURL" alt="User avatar" />
          <div v-else class="avatar-placeholder">{{ getUserInitials() }}</div>
        </div>
        <div class="user-info" v-if="!isCollapsed">
          <div class="user-name">{{ user ? (user.displayName || user.email) : 'Guest' }}</div>
          <div class="user-plan" :class="{ 'premium': isPremiumUser }">
            {{ isPremiumUser ? 'Premium' : 'Free' }}
          </div>
        </div>
        <div class="user-menu-toggle" v-if="!isCollapsed">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'rotated': isUserMenuOpen }">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      <!-- User Menu Dropdown -->
      <div class="user-menu" v-if="!isCollapsed && isUserMenuOpen">
        <div class="menu-item" @click="goToProfile">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Profile</span>
        </div>
        <div class="menu-item" @click="goToSettings">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>Settings</span>
        </div>
        <div class="menu-item" v-if="!isPremiumUser" @click="upgradeToPremium">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span>Upgrade to Premium</span>
        </div>
        <div class="menu-item" @click="logout">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Sign Out</span>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" v-if="showDeleteModal" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">Delete Chat</div>
        <div class="modal-body">
          Are you sure you want to delete this chat? This action cannot be undone.
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showDeleteModal = false">Cancel</button>
          <button class="delete-btn" @click="deleteChat">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export default {
  name: 'AppSidebar',
  
  setup() {
    const isCollapsed = ref(false);
    const userChats = ref([]);
    const userFolders = ref([]);
    const openFolders = ref([]);
    const isLoading = ref(true);
    const activeChatId = ref(null);
    const user = ref(null);
    const isPremiumUser = ref(false);
    const isUserMenuOpen = ref(false);
    const showDeleteModal = ref(false);
    const chatToDelete = ref(null);
    
    const router = useRouter();
    
    // Toggle sidebar collapse state
    const toggleSidebar = () => {
      isCollapsed.value = !isCollapsed.value;
      localStorage.setItem('sidebarCollapsed', isCollapsed.value);
    };
    
    // Create a new chat
    const createNewChat = async () => {
      try {
        if (!user.value) return;
        
        const db = getFirestore();
        const chatData = {
          title: 'New Chat',
          userId: user.value.uid,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          messages: []
        };
        
        const docRef = await addDoc(collection(db, 'chats'), chatData);
        const newChatId = docRef.id;
        
        // Navigate to the new chat
        router.push(`/chat/${newChatId}`);
        
        // Refresh chats
        fetchUserChats();
      } catch (error) {
        console.error('Error creating new chat:', error);
      }
    };
    
    // Select a chat
    const selectChat = (chatId) => {
      activeChatId.value = chatId;
      router.push(`/chat/${chatId}`);
    };
    
    // Rename chat
    const renameChat = async (chatId) => {
      const chat = userChats.value.find(c => c.id === chatId);
      if (!chat) return;
      
      const newTitle = prompt('Enter a new name for this chat:', chat.title);
      if (!newTitle || newTitle === chat.title) return;
      
      try {
        const db = getFirestore();
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
          title: newTitle,
          lastUpdated: serverTimestamp()
        });
        
        // Update local list
        fetchUserChats();
      } catch (error) {
        console.error('Error renaming chat:', error);
      }
    };
    
    // Show delete confirmation modal
    const confirmDeleteChat = (chatId) => {
      chatToDelete.value = chatId;
      showDeleteModal.value = true;
    };
    
    // Delete chat
    const deleteChat = async () => {
      if (!chatToDelete.value) return;
      
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, 'chats', chatToDelete.value));
        
        // If active chat is deleted, navigate to home
        if (activeChatId.value === chatToDelete.value) {
          router.push('/');
        }
        
        // Refresh chats
        fetchUserChats();
        
        // Close modal
        showDeleteModal.value = false;
        chatToDelete.value = null;
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    };
    
    // Toggle folder open/closed state
    const toggleFolder = (folderId) => {
      if (openFolders.value.includes(folderId)) {
        openFolders.value = openFolders.value.filter(id => id !== folderId);
      } else {
        openFolders.value.push(folderId);
      }
    };
    
    // Get chats for a specific folder
    const getFolderChats = (folderId) => {
      return userChats.value.filter(chat => chat.folderId === folderId);
    };
    
    // Toggle user menu
    const toggleUserMenu = () => {
      isUserMenuOpen.value = !isUserMenuOpen.value;
    };
    
    // Get user initials for avatar placeholder
    const getUserInitials = () => {
      if (!user.value) return '?';
      
      if (user.value.displayName) {
        return user.value.displayName
          .split(' ')
          .map(name => name[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      }
      
      return user.value.email ? user.value.email[0].toUpperCase() : '?';
    };
    
    // Navigation methods
    const goToProfile = () => {
      router.push('/profile');
      isUserMenuOpen.value = false;
    };
    
    const goToSettings = () => {
      router.push('/settings');
      isUserMenuOpen.value = false;
    };
    
    const upgradeToPremium = () => {
      router.push('/upgrade');
      isUserMenuOpen.value = false;
    };
    
    const logout = async () => {
      try {
        const auth = getAuth();
        await signOut(auth);
        router.push('/login');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };
    
    // Format date for display
    const formatDate = (timestamp) => {
      if (!timestamp) return '';
      
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return 'Today';
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };
    
    // Truncate chat title for display
    const truncateTitle = (title) => {
      if (!title) return 'New Chat';
      return title.length > 25 ? title.substring(0, 22) + '...' : title;
    };
    
    // Fetch user's chats from Firestore
    const fetchUserChats = async () => {
      isLoading.value = true;
      
      try {
        if (!user.value) return;
        
        const db = getFirestore();
        const chatsRef = collection(db, 'chats');
        const q = query(
          chatsRef,
          where('userId', '==', user.value.uid),
          orderBy('lastUpdated', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        userChats.value = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // If there's a chat in the URL, set it as active
        const currentPath = router.currentRoute.value.path;
        if (currentPath.startsWith('/chat/')) {
          activeChatId.value = currentPath.split('/')[2];
        } else if (userChats.value.length > 0) {
          // Set first chat as active if none is selected
          activeChatId.value = userChats.value[0].id;
        }
        
        // Fetch folders if premium user
        if (isPremiumUser.value) {
          await fetchUserFolders();
        }
      } catch (error) {
        console.error('Error fetching user chats:', error);
      } finally {
        isLoading.value = false;
      }
    };
    
    // Fetch user's folders from Firestore
    const fetchUserFolders = async () => {
      try {
        if (!user.value) return;
        
        const db = getFirestore();
        const foldersRef = collection(db, 'folders');
        const q = query(
          foldersRef,
          where('userId', '==', user.value.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        userFolders.value = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Open first folder by default
        if (userFolders.value.length > 0 && openFolders.value.length === 0) {
          openFolders.value = [userFolders.value[0].id];
        }
      } catch (error) {
        console.error('Error fetching user folders:', error);
      }
    };
    
    // Check if user has premium subscription
    const checkPremiumStatus = async (userId) => {
      try {
        const db = getFirestore();
        const userRef = doc(db, 'users', userId);
        const userSnapshot = await getDoc(userRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          isPremiumUser.value = userData.isPremium || false;
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      }
    };
    
    // Initialize component
    onMounted(() => {
      // Restore sidebar collapsed state from localStorage
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        isCollapsed.value = savedState === 'true';
      }
      
      // Set up auth state listener
      const auth = getAuth();
      onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser;
        
        if (currentUser) {
          // Check premium status
          checkPremiumStatus(currentUser.uid);
          
          // Fetch user data
          fetchUserChats();
        } else {
          // Clear user data
          userChats.value = [];
          userFolders.value = [];
          isPremiumUser.value = false;
          
          // Redirect to login if not already there
          if (!router.currentRoute.value.path.includes('/login')) {
            router.push('/login');
          }
        }
      });
      
      // Listen for route changes to update active chat
      router.afterEach((to) => {
        if (to.path.startsWith('/chat/')) {
          activeChatId.value = to.path.split('/')[2];
        }
      });
    });
    
    return {
      isCollapsed,
      userChats,
      userFolders,
      openFolders,
      isLoading,
      activeChatId,
      user,
      isPremiumUser,
      isUserMenuOpen,
      showDeleteModal,
      chatToDelete,
      toggleSidebar,
      createNewChat,
      selectChat,
      renameChat,
      confirmDeleteChat,
      deleteChat,
      toggleFolder,
      getFolderChats,
      toggleUserMenu,
      getUserInitials,
      goToProfile,
      goToSettings,
      upgradeToPremium,
      logout,
      formatDate,
      truncateTitle
    };
  }
};
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  height: 100vh;
  background: rgba(10, 10, 15, 0.95);
  border-right: 1px solid rgba(30, 77, 217, 0.2);
  transition: width 0.3s ease;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(30, 77, 217, 0.5) transparent;
}

.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background-color: rgba(30, 77, 217, 0.5);
  border-radius: 4px;
}

.sidebar.collapsed {
  width: 70px;
}

/* Sidebar Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(30, 77, 217, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  width: 28px;
  height: 28px;
  margin-right: 10px;
  filter: drop-shadow(0 0 5px rgba(30, 77, 217, 0.5));
}

.logo-text {
  font-weight: 600;
  font-size: 18px;
  color: white;
  background: linear-gradient(90deg, #ffffff, #1e4dd9);
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.toggle-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: rgba(30, 77, 217, 0.2);
  color: white;
}

.sidebar.collapsed .toggle-btn svg {
  transform: rotate(180deg);
}

/* New Chat Button */
.new-chat-container {
  padding: 16px;
}

.new-chat-btn {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  background: rgba(30, 77, 217, 0.2);
  border: 1px solid rgba(30, 77, 217, 0.4);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.new-chat-btn:hover {
  background: rgba(30, 77, 217, 0.3);
  box-shadow: 0 0 10px rgba(30, 77, 217, 0.3);
}

/* Section Titles */
.section-title {
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Chats Container */
.chats-container {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  gap: 4px;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.chat-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.chat-item.active {
  background: rgba(30, 77, 217, 0.15);
  border-left: 3px solid #1e4dd9;
}

.chat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  width: 24px;
  height: 24px;
  margin-right: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.chat-details {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.chat-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.chat-item:hover .chat-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn.delete:hover {
  background: rgba(255, 50, 50, 0.2);
  color: #ff5555;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.empty-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 77, 217, 0.1);
  border-radius: 50%;
  color: rgba(30, 77, 217, 0.8);
}

.empty-text {
  font-size: 14px;
  line-height: 1.5;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(30, 77, 217, 0.3);
  border-top-color: #1e4dd9;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
}

/* Folders */
.folders-container {
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  gap: 4px;
}

.folder-item {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 4px;
}

.folder-header {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.folder-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.folder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 10px;
  color: rgba(255, 255, 255, 0.7);
}

.folder-title {
  flex: 1;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.folder-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-toggle svg {
  transition: transform 0.2s ease;
}

.folder-toggle svg.rotated {
  transform: rotate(180deg);
}

.folder-chats {
  padding-left: 20px;
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.folder-chat-item {
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.folder-chat-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.folder-chat-item.active {
  background: rgba(30, 77, 217, 0.15);
}

/* User Section */
.user-section {
  margin-top: auto;
  border-top: 1px solid rgba(30, 77, 217, 0.1);
  padding: 16px;
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.user-profile:hover {
  background: rgba(255, 255, 255, 0.05);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 77, 217, 0.2);
  border: 1px solid rgba(30, 77, 217, 0.4);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-plan {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.user-plan.premium {
  color: #FFD700;
}

.user-menu-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-menu-toggle svg {
  transition: transform 0.2s ease;
}

.user-menu-toggle svg.rotated {
  transform: rotate(180deg);
}

/* User Menu */
.user-menu {
  position: absolute;
  bottom: 100%;
  left: 16px;
  right: 16px;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(30, 77, 217, 0.2);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  color: rgba(255, 255, 255, 0.8);
}

.menu-item:hover {
  background: rgba(30, 77, 217, 0.15);
  color: white;
}

/* Delete Confirmation Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  width: 350px;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(30, 77, 217, 0.3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(30, 77, 217, 0.2);
}

.modal-header {
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 20px 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.5;
}

.modal-footer {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn {
  padding: 8px 16px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.delete-btn {
  padding: 8px 16px;
  border-radius: 6px;
  background: rgba(255, 50, 50, 0.2);
  border: 1px solid rgba(255, 50, 50, 0.4);
  color: #ff5555;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(255, 50, 50, 0.3);
  box-shadow: 0 0 10px rgba(255, 50, 50, 0.2);
}

/* Cosmic effects and animations */
.chat-item.active::before {
  content: '';
  position: absolute;
  left: -3px;
  top: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(0deg, rgba(30, 77, 217, 0.3), #1e4dd9, rgba(30, 77, 217, 0.3));
  box-shadow: 0 0 8px rgba(30, 77, 217, 0.6);
}

.user-profile::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(30, 77, 217, 0.3), transparent);
}
</style>