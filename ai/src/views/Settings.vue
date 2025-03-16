<template>
  <div class="settings-container">
    <!-- Cosmic background -->
    <div class="cosmic-background">
      <div v-for="n in 30" :key="`particle-${n}`" 
          class="cosmic-particle"
          :style="{
             '--size': `${Math.random() * 3 + 1}px`,
             '--x': `${Math.random() * 100}%`,
             '--y': `${Math.random() * 100}%`,
             '--duration': `${Math.random() * 40 + 20}s`,
             '--delay': `${Math.random() * -20}s`,
             '--opacity': Math.random() * 0.4 + 0.1
          }"
      ></div>
    </div>
    
    <div class="container mx-auto px-4 py-8 max-w-3xl">
      <div class="settings-card">
        <h1 class="settings-title">Settings</h1>
        
        <!-- Theme Selection -->
        <section class="settings-section">
          <h2 class="section-title">Appearance</h2>
          <div class="theme-grid">
            <button
              v-for="theme in themes"
              :key="theme.id"
              @click="setTheme(theme.id)"
              class="theme-option"
              :class="{ 'selected': selectedTheme === theme.id }"
              :style="{ '--theme-color': theme.color }"
            >
              <div class="theme-preview" :style="{ background: theme.gradient }"></div>
              <div class="theme-name">{{ theme.name }}</div>
              <div class="selection-indicator"></div>
            </button>
          </div>
        </section>

        <!-- AI Mode Settings -->
        <section class="settings-section">
          <h2 class="section-title">AI Personality</h2>
          <p class="section-description">Choose your preferred AI interaction style.</p>
          
          <div class="ai-modes">
            <div
              v-for="mode in aiModes"
              :key="mode.id"
              @click="selectAiMode(mode.id)"
              class="ai-mode-option"
              :class="{ 'selected': selectedAiMode === mode.id }"
            >
              <div class="mode-icon" :class="mode.icon"></div>
              <div class="mode-details">
                <div class="mode-name">{{ mode.name }}</div>
                <div class="mode-description">{{ mode.description }}</div>
              </div>
              <div class="selection-dot"></div>
            </div>
          </div>
        </section>

        <!-- Notifications -->
        <section class="settings-section">
          <h2 class="section-title">Notifications</h2>
          <div class="setting-row">
            <div class="setting-info">
              <h3 class="setting-name">Enable Notifications</h3>
              <p class="setting-description">Receive notifications about new features and updates</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="notificationsEnabled" @change="saveNotificationSetting">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </section>

        <!-- Account Settings -->
        <section class="settings-section">
          <h2 class="section-title">Account</h2>
          <div class="account-info">
            <div class="user-avatar">
              <img :src="userAvatar" :alt="userName" class="avatar-image">
            </div>
            <div class="user-details">
              <h3 class="user-name">{{ userName }}</h3>
              <p class="user-email">{{ userEmail }}</p>
              <p class="user-plan" :class="userPlan">{{ userPlanName }}</p>
            </div>
          </div>
          
          <div class="account-actions">
            <button @click="openProfileEdit" class="btn btn-secondary">
              <i class="ri-user-settings-line mr-2"></i> Edit Profile
            </button>
            <button @click="logout" class="btn btn-danger">
              <i class="ri-logout-box-line mr-2"></i> Logout
            </button>
          </div>
        </section>

        <!-- Save Button -->
        <div class="settings-footer">
          <button @click="saveSettings" class="btn btn-primary save-btn">
            <i class="ri-save-line mr-2"></i> Save Changes
          </button>
        </div>
      </div>
    </div>
    
    <!-- Success notification (Claude-like toast) -->
    <div v-if="showSuccessMessage" class="settings-saved-message">
      <span class="success-icon">✓</span> Settings saved successfully
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useThemeStore } from '../store/theme';

// Store references
const authStore = useAuthStore();
const themeStore = useThemeStore();
const router = useRouter();

// Theme settings
const themes = [
  { id: 'light', name: 'Light', color: '#ffffff', gradient: 'linear-gradient(135deg, #f0f0f0, #ffffff)' },
  { id: 'dark', name: 'Dark', color: '#0f172a', gradient: 'linear-gradient(135deg, #0f172a, #1e293b)' },
  { id: 'cosmic', name: 'Cosmic', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #4c1d95, #7e22ce)' },
  { id: 'ocean', name: 'Ocean', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0c4a6e, #0891b2)' }
];

// AI modes
const aiModes = [
  {
    id: 'default',
    name: 'Balanced Guide',
    description: 'Clear, precise, and thoughtful responses with balanced detail.',
    icon: 'icon-balance'
  },
  {
    id: 'creative',
    name: 'Creative Muse',
    description: 'Imaginative, artistic responses with metaphorical flourishes.',
    icon: 'icon-creative' 
  },
  {
    id: 'archmage',
    name: 'ARCHMAGE',
    description: 'Deep, philosophical answers that explore profound dimensions.',
    icon: 'icon-archmage'
  }
];

// Reactive state
const selectedTheme = ref(themeStore.currentTheme);
const selectedAiMode = ref('default');
const notificationsEnabled = ref(false);
const showSuccessMessage = ref(false);

// Computed properties for user info
const userName = computed(() => authStore.displayName || 'User');
const userEmail = computed(() => authStore.user?.email || '');
const userAvatar = computed(() => authStore.photoURL || getDefaultAvatar());
const userPlan = computed(() => authStore.userProfile?.plan || 'free');
const userPlanName = computed(() => {
  switch (userPlan.value) {
    case 'premium': return 'Premium Plan';
    case 'rift': return 'Rift Plan';
    default: return 'Free Plan';
  }
});

// Methods
function getDefaultAvatar() {
  const name = userName.value;
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const colors = ['8B5CF6', '6D28D9', '4F46E5', '4338CA', '3730A3'];
  const colorIndex = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length);
  const bgColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&size=200`;
}

function setTheme(themeId) {
  selectedTheme.value = themeId;
}

function selectAiMode(modeId) {
  selectedAiMode.value = modeId;
}

function saveNotificationSetting() {
  localStorage.setItem('notifications-enabled', notificationsEnabled.value);
}

function openProfileEdit() {
  router.push('/profile');
}

async function logout() {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

function saveSettings() {
  // Save theme
  themeStore.setTheme(selectedTheme.value);
  
  // Save AI mode preference
  localStorage.setItem('preferred-ai-mode', selectedAiMode.value);
  
  // Save notification preferences
  localStorage.setItem('notifications-enabled', notificationsEnabled.value.toString());
  
  // Save user preferences to profile if authenticated
  if (authStore.isAuthenticated && authStore.userProfile) {
    authStore.updatePreferences({
      theme: selectedTheme.value,
      aiMode: selectedAiMode.value,
      notificationsEnabled: notificationsEnabled.value
    });
  }
  
  // Show success message
  showSuccessMessage.value = true;
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 3000);
}

// Initialize settings from stored values
onMounted(() => {
  // Get theme from store
  selectedTheme.value = themeStore.currentTheme;
  
  // Get AI mode from localStorage or profile
  const storedMode = localStorage.getItem('preferred-ai-mode');
  selectedAiMode.value = storedMode || authStore.userProfile?.preferences?.aiMode || 'default';
  
  // Get notification settings
  const storedNotifications = localStorage.getItem('notifications-enabled');
  notificationsEnabled.value = storedNotifications === 'true';
});
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A0068 0%, #26007B 1e1b4b 50%, #42008D 100%);
  position: relative;
}

/* Cosmic background */
.cosmic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.cosmic-particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background-color: #8b5cf6;
  box-shadow: 0 0 calc(var(--size) * 2) #8b5cf6;
  border-radius: 50%;
  opacity: var(--opacity);
  left: var(--x);
  top: var(--y);
  animation: float-particle var(--duration) linear infinite;
  animation-delay: var(--delay);
  filter: blur(1px);
}

@keyframes float-particle {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: var(--opacity);
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

/* Main container */
.container {
  position: relative;
  z-index: 1;
}

/* Settings card */
.settings-card {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.settings-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
  background: linear-gradient(to right, #fff, #8b5cf6, #fff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 15px rgba(139, 92, 246, 0.7);
}

/* Settings sections */
.settings-section {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.settings-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: white;
}

.section-description {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

/* Theme selection */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.theme-option {
  border: 2px solid transparent;
  border-radius: 0.75rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background: none;
  text-align: center;
}

.theme-option:hover {
  transform: translateY(-3px);
  border-color: rgba(139, 92, 246, 0.3);
}

.theme-option.selected {
  border-color: var(--theme-color);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
}

.theme-preview {
  height: 80px;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.theme-name {
  font-size: 0.875rem;
  color: white;
}

.selection-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.7);
  transform: scale(0);
  transition: transform 0.3s ease;
}

.theme-option.selected .selection-indicator {
  transform: scale(1);
}

/* AI Modes */
.ai-modes {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ai-mode-option {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.ai-mode-option:hover {
  background: rgba(139, 92, 246, 0.1);
  transform: translateX(5px);
}

.ai-mode-option.selected {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
}

.mode-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
  font-size: 1.25rem;
  color: white;
}

.icon-balance::before {
  content: "⚖️";
}

.icon-creative::before {
  content: "🎨";
}

.icon-archmage::before {
  content: "🧙";
}

.mode-details {
  flex: 1;
}

.mode-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: white;
}

.mode-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.selection-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(139, 92, 246, 0.5);
  margin-left: 1rem;
  position: relative;
  flex-shrink: 0;
}

.selection-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #8b5cf6;
  transition: transform 0.3s ease;
}

.ai-mode-option.selected .selection-dot::after {
  transform: translate(-50%, -50%) scale(1);
}

/* Toggle switch */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.setting-info {
  flex: 1;
}

.setting-name {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: white;
}

.setting-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 54px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  transition: .4s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}

input:checked + .toggle-slider {
  background-color: #8b5cf6;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* Account section */
.account-info {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  border: 2px solid #8b5cf6;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: white;
}

.user-email {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.user-plan {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-plan.free {
  background: rgba(100, 116, 139, 0.2);
  color: #cbd5e1;
}

.user-plan.premium {
  background: rgba(234, 179, 8, 0.2);
  color: #fcd34d;
}

.user-plan.rift {
  background: rgba(139, 92, 246, 0.2);
  color: #c4b5fd;
}

.account-actions {
  display: flex;
  gap: 1rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(139, 92, 246, 0.5);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.settings-footer {
  text-align: center;
  margin-top: 1rem;
}

.save-btn {
  min-width: 200px;
}

/* Success message toast */
.settings-saved-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9));
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  animation: slide-in 0.5s ease-out forwards;
  backdrop-filter: blur(10px);
  z-index: 100;
}

.success-icon {
  margin-right: 0.75rem;
  font-size: 1.25rem;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive styles */
@media (max-width: 768px) {
  .theme-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .account-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .settings-card {
    padding: 1.5rem;
  }
  
  .account-info {
    flex-direction: column;
    text-align: center;
  }
  
  .user-avatar {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>