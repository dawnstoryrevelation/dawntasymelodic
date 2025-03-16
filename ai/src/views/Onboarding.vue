<template>
    <div class="onboarding-container">
      <!-- Cosmic Background Effects -->
      <div class="cosmic-particles">
        <div v-for="n in 50" :key="`particle-${n}`" 
            class="cosmic-particle"
            :style="{
               '--size': `${Math.random() * 4 + 1}px`,
               '--x': `${Math.random() * 100}%`,
               '--y': `${Math.random() * 100}%`,
               '--duration': `${Math.random() * 50 + 30}s`,
               '--delay': `${Math.random() * -30}s`,
               '--opacity': Math.random() * 0.5 + 0.2
            }"
        ></div>
      </div>
      
      <!-- Cosmic Portal Animation -->
      <div class="cosmic-portal" ref="cosmicPortal">
        <div class="portal-rings">
          <div class="portal-ring"></div>
          <div class="portal-ring"></div>
          <div class="portal-ring"></div>
        </div>
        <div class="portal-core"></div>
      </div>
      
      <!-- Main Content Card with Steps -->
      <div class="onboarding-card" ref="onboardingCard">
        <!-- Step Indicator -->
        <div class="step-indicator">
          <div 
            v-for="n in totalSteps" 
            :key="`step-${n}`" 
            :class="['step-dot', { 'active': currentStep >= n, 'completed': currentStep > n }]"
            @click="goToStep(n)"
          ></div>
        </div>
        
        <!-- Card Title -->
        <h1 class="onboarding-title" ref="onboardingTitle">
          {{ steps[currentStep - 1].title }}
        </h1>
        
        <!-- Card Content - Multiple Steps -->
        <div class="steps-container">
          <!-- Step 1: Username -->
          <div v-if="currentStep === 1" class="step-content" ref="step1">
            <p class="step-description">Choose a unique username that will identify you across the Dawntasy universe.</p>
            
            <div class="form-group" :class="{ 'error': usernameError }">
              <label for="username" class="form-label">Username</label>
              <div class="input-wrapper">
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  class="form-input"
                  placeholder="Enter your cosmic identity"
                  @input="checkUsername"
                  ref="usernameInput"
                />
                <div class="input-decoration"></div>
              </div>
              <p v-if="usernameError" class="error-message">{{ usernameError }}</p>
              <p v-else-if="usernameAvailable" class="success-message">This cosmic identity is available!</p>
            </div>
          </div>
          
          <!-- Step 2: Theme Preference -->
          <div v-if="currentStep === 2" class="step-content" ref="step2">
            <p class="step-description">Choose the cosmic theme that resonates with your journey.</p>
            
            <div class="theme-options">
              <div
                v-for="theme in themes"
                :key="theme.id"
                class="theme-option"
                :class="{ 'selected': selectedTheme === theme.id }"
                @click="selectTheme(theme.id)"
                :style="{ '--theme-color': theme.color }"
              >
                <div class="theme-preview" :style="{ background: theme.gradient }"></div>
                <div class="theme-name">{{ theme.name }}</div>
              </div>
            </div>
          </div>
          
          <!-- Step 3: AI Assistant Preferences -->
          <div v-if="currentStep === 3" class="step-content" ref="step3">
            <p class="step-description">Choose your preferred AI interaction style.</p>
            
            <div class="ai-preferences">
              <div
                v-for="mode in aiModes"
                :key="mode.id"
                class="ai-mode"
                :class="{ 'selected': selectedAiMode === mode.id }"
                @click="selectAiMode(mode.id)"
              >
                <div class="mode-icon" :class="mode.icon"></div>
                <div class="mode-details">
                  <div class="mode-name">{{ mode.name }}</div>
                  <div class="mode-description">{{ mode.description }}</div>
                </div>
                <div class="selection-indicator"></div>
              </div>
            </div>
          </div>
          
          <!-- Final Step: Completed -->
          <div v-if="currentStep === 4" class="step-content completion-step" ref="step4">
            <div class="completion-animation">
              <div class="completion-circle"></div>
              <div class="completion-check"></div>
            </div>
            
            <h2 class="completion-title">Your journey begins!</h2>
            <p class="completion-message">
              Welcome, <span class="username-highlight">{{ username }}</span>! 
              The cosmic realms of Dawntasy await your exploration.
            </p>
            
            <div class="cosmic-decoration"></div>
          </div>
        </div>
        
        <!-- Navigation Controls -->
        <div class="step-navigation">
          <button
            v-if="currentStep > 1"
            @click="prevStep"
            class="nav-button back-button"
          >
            <span class="button-icon">←</span>
            <span class="button-text">Back</span>
          </button>
          
          <button
            v-if="currentStep < totalSteps"
            @click="nextStep"
            class="nav-button next-button"
            :disabled="!canProceed"
          >
            <span class="button-text">{{ currentStep === totalSteps - 1 ? 'Complete' : 'Next' }}</span>
            <span class="button-icon">→</span>
          </button>
          
          <button
            v-if="currentStep === totalSteps"
            @click="finishOnboarding"
            class="nav-button finish-button"
          >
            <span class="button-text">Enter Dawntasy</span>
            <span class="button-icon">✨</span>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, watch, nextTick } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '@/store/auth';
  import { db } from '@/firebase/init';
  import { collection, query, where, getDocs } from 'firebase/firestore';
  import gsap from 'gsap';
  import { debounce } from 'lodash';
  
  // Router and auth store
  const router = useRouter();
  const authStore = useAuthStore();
  
  // Refs for animations
  const cosmicPortal = ref(null);
  const onboardingCard = ref(null);
  const onboardingTitle = ref(null);
  const step1 = ref(null);
  const step2 = ref(null);
  const step3 = ref(null);
  const step4 = ref(null);
  const usernameInput = ref(null);
  
  // Onboarding state
  const currentStep = ref(1);
  const totalSteps = ref(4);
  const username = ref('');
  const usernameError = ref('');
  const usernameAvailable = ref(false);
  const selectedTheme = ref('cosmic');
  const selectedAiMode = ref('default');
  
  // Define steps for the onboarding process
  const steps = [
    { 
      id: 'username', 
      title: 'Choose Your Cosmic Identity',
      validate: () => username.value.length >= 3 && !usernameError.value
    },
    { 
      id: 'theme', 
      title: 'Select Your Visual Realm',
      validate: () => true // Always valid
    },
    { 
      id: 'ai-mode', 
      title: 'Customize Your AI Guide',
      validate: () => true // Always valid
    },
    { 
      id: 'complete', 
      title: 'Journey Preparation Complete',
      validate: () => true // Always valid
    }
  ];
  
  // Theme options
  const themes = [
    { 
      id: 'cosmic', 
      name: 'Cosmic Void', 
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%)'
    },
    { 
      id: 'ocean', 
      name: 'Abyssal Ocean', 
      color: '#0ea5e9',
      gradient: 'linear-gradient(135deg, #082f49 0%, #0c4a6e 50%, #0e7490 100%)'
    },
    { 
      id: 'time', 
      name: 'Crimson Time', 
      color: '#ff3a70',
      gradient: 'linear-gradient(135deg, #4a044e 0%, #881337 50%, #9f1239 100%)'
    },
    { 
      id: 'rift', 
      name: 'Rift Energy', 
      color: '#06a6ee',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #075985 50%, #0284c7 100%)'
    }
  ];
  
  // AI interaction modes
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
  
  // Computed properties
  const canProceed = computed(() => {
    return steps[currentStep.value - 1].validate();
  });
  
  // Check username availability with debounce
  const checkUsername = debounce(async () => {
    // Reset states
    usernameError.value = '';
    usernameAvailable.value = false;
    
    // Validate username format
    if (username.value.length < 3) {
      usernameError.value = 'Username must be at least 3 characters';
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username.value)) {
      usernameError.value = 'Username can only contain letters, numbers, dashes and underscores';
      return;
    }
    
    try {
      // Check if username exists in Firebase
      const usernamesRef = collection(db(), 'usernames');
      const q = query(usernamesRef, where('name', '==', username.value.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        usernameError.value = 'This cosmic identity is already claimed';
      } else {
        usernameAvailable.value = true;
        
        // Animate success indicator
        gsap.to('.input-decoration', {
          width: '100%',
          opacity: 0.7,
          duration: 0.5,
          background: 'linear-gradient(90deg, transparent, #10b981, transparent)'
        });
      }
    } catch (err) {
      console.error('Error checking username:', err);
      usernameError.value = 'Unable to verify username availability';
    }
  }, 500);
  
  // Navigation methods
  const nextStep = async () => {
    if (currentStep.value < totalSteps.value && canProceed.value) {
      // Save current step data
      await saveStepData();
      
      // Animate transition
      animateStepTransition(currentStep.value, currentStep.value + 1);
      
      // Update step
      currentStep.value++;
    }
  };
  
  const prevStep = () => {
    if (currentStep.value > 1) {
      // Animate transition
      animateStepTransition(currentStep.value, currentStep.value - 1);
      
      // Update step
      currentStep.value--;
    }
  };
  
  const goToStep = (step: number) => {
    // Only allow going to a step if all previous steps are valid
    const canGoToStep = step <= currentStep.value || 
      steps.slice(0, step - 1).every(s => s.validate());
    
    if (canGoToStep) {
      // Animate transition
      animateStepTransition(currentStep.value, step);
      
      // Update step
      currentStep.value = step;
    }
  };
  
  // Save step data to user profile
  const saveStepData = async () => {
    try {
      if (currentStep.value === 1 && usernameAvailable.value) {
        // Update username in auth profile and Firestore
        await authStore.updateUsername(username.value);
      } else if (currentStep.value === 2) {
        // Save theme preference (will be implemented when we get to the final step)
      } else if (currentStep.value === 3) {
        // Save AI mode preference (will be implemented when we get to the final step)
      }
    } catch (err) {
      console.error('Error saving step data:', err);
    }
  };
  
  // Complete onboarding and save all preferences
  const finishOnboarding = async () => {
    try {
      // Create a cosmic portal transition
      const portal = cosmicPortal.value;
      if (portal) {
        gsap.to(portal, {
          opacity: 1,
          duration: 0.5
        });
        
        gsap.to(portal.querySelector('.portal-core'), {
          scale: 30,
          opacity: 1,
          duration: 1.5,
          ease: "power3.in",
          onComplete: async () => {
            try {
              // Save all preferences
              const userRef = doc(db(), 'users', authStore.uid);
              await updateDoc(userRef, {
                preferences: {
                  theme: selectedTheme.value,
                  aiMode: selectedAiMode.value,
                  onboardingCompleted: true
                }
              });
              
              // Redirect to chat
              router.push('/chat');
            } catch (err) {
              console.error('Error completing onboarding:', err);
              router.push('/chat'); // Fallback navigation if save fails
            }
          }
        });
      } else {
        // Fallback if portal animation fails
        router.push('/chat');
      }
    } catch (err) {
      console.error('Error in finishOnboarding:', err);
      router.push('/chat'); // Fallback navigation
    }
  };
  
  // Theme and AI mode selection
  const selectTheme = (themeId: string) => {
    selectedTheme.value = themeId;
    
    // Animate selection
    gsap.fromTo(
      `.theme-option.selected .theme-preview`,
      { scale: 1 },
      { scale: 1.1, duration: 0.3, yoyo: true, repeat: 1 }
    );
  };
  
  const selectAiMode = (modeId: string) => {
    selectedAiMode.value = modeId;
    
    // Animate selection
    gsap.fromTo(
      `.ai-mode.selected .selection-indicator`,
      { opacity: 0.5, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }
    );
  };
  
  // Animation methods
  const animateStepTransition = (from: number, to: number) => {
    const direction = to > from ? 'next' : 'prev';
    const currentContent = document.querySelector(`.step-content:nth-child(${from})`);
    const targetContent = document.querySelector(`.step-content:nth-child(${to})`);
    
    if (currentContent && targetContent) {
      if (direction === 'next') {
        // Current step exits to the left
        gsap.to(currentContent, {
          x: '-50px',
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            gsap.set(currentContent, { display: 'none' });
          }
        });
        
        // New step enters from the right
        gsap.fromTo(
          targetContent,
          { x: '50px', opacity: 0, display: 'block' },
          { x: '0', opacity: 1, duration: 0.5, delay: 0.2, ease: 'power2.out' }
        );
      } else {
        // Current step exits to the right
        gsap.to(currentContent, {
          x: '50px',
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            gsap.set(currentContent, { display: 'none' });
          }
        });
        
        // New step enters from the left
        gsap.fromTo(
          targetContent,
          { x: '-50px', opacity: 0, display: 'block' },
          { x: '0', opacity: 1, duration: 0.5, delay: 0.2, ease: 'power2.out' }
        );
      }
    }
    
    // Animate the title change
    if (onboardingTitle.value) {
      gsap.to(onboardingTitle.value, {
        y: -20,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          nextTick(() => {
            gsap.fromTo(
              onboardingTitle.value,
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
            );
          });
        }
      });
    }
  };
  
  // Initialize animations
  const initAnimations = () => {
    // Animate entrance of card
    gsap.fromTo(
      onboardingCard.value,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    );
    
    // Animate step dots
    gsap.fromTo(
      '.step-dot',
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.5, ease: 'back.out(1.7)' }
    );
    
    // Animate title
    gsap.fromTo(
      onboardingTitle.value,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, delay: 0.7, ease: 'power2.out' }
    );
    
    // Animate first step content
    gsap.fromTo(
      step1.value,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, delay: 0.9, ease: 'power2.out' }
    );
    
    // Animate navigation buttons
    gsap.fromTo(
      '.nav-button',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 1.1, ease: 'power2.out' }
    );
    
    // Animate cosmic portal
    const portalRings = document.querySelectorAll('.portal-ring');
    gsap.fromTo(
      portalRings,
      { scale: 0, opacity: 0 },
      {
        scale: 1,
        opacity: 0.7,
        duration: 1,
        stagger: 0.2,
        ease: 'power2.out'
      }
    );
    
    gsap.fromTo(
      '.portal-core',
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 0.8, duration: 1, delay: 0.6, ease: 'power2.out' }
    );
    
    // Set up continuous animations
    gsap.to('.portal-ring', {
      rotation: 360,
      duration: 20,
      repeat: -1,
      ease: 'none',
      stagger: 5
    });
    
    gsap.to('.portal-core', {
      scale: 1.1,
      opacity: 0.6,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  };
  
  // Auto-focus username input when component mounts
  onMounted(() => {
    // Initialize animations
    initAnimations();
    
    // Focus username input
    nextTick(() => {
      if (usernameInput.value) {
        usernameInput.value.focus();
      }
    });
  });
  
  // Watch current step to adjust UI
  watch(currentStep, () => {
    // Focus username input when on step 1
    if (currentStep.value === 1) {
      nextTick(() => {
        if (usernameInput.value) {
          usernameInput.value.focus();
        }
      });
    }
    
    // Special animations for completion step
    if (currentStep.value === 4) {
      nextTick(() => {
        // Animate completion check
        gsap.fromTo(
          '.completion-circle',
          { scale: 0 },
          { scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );
        
        gsap.fromTo(
          '.completion-check',
          { strokeDashoffset: 100 },
          { strokeDashoffset: 0, duration: 0.8, delay: 0.5, ease: 'power2.out' }
        );
        
        // Animate completion text
        gsap.fromTo(
          '.completion-title',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 1, ease: 'power2.out' }
        );
        
        gsap.fromTo(
          '.completion-message',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 1.2, ease: 'power2.out' }
        );
        
        // Highlight username
        gsap.fromTo(
          '.username-highlight',
          { color: 'white' },
          { 
            color: '#8b5cf6', 
            textShadow: '0 0 10px rgba(139, 92, 246, 0.7)',
            duration: 1,
            delay: 1.4
          }
        );
      });
    }
  });
  </script>
  
  <style lang="scss" scoped>
  /* LEGENDARY COSMIC ONBOARDING STYLES 🚀 */
  
  .onboarding-container {
    @apply min-h-screen flex items-center justify-center p-4 relative;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%);
    overflow: hidden;
  }
  
  /* COSMIC PARTICLES ✨ */
  .cosmic-particles {
    @apply absolute inset-0 pointer-events-none z-0;
  }
  
  .cosmic-particle {
    @apply absolute rounded-full;
    width: var(--size);
    height: var(--size);
    background-color: #8b5cf6;
    box-shadow: 0 0 calc(var(--size) * 2) #8b5cf6;
    opacity: var(--opacity);
    left: var(--x);
    top: var(--y);
    animation: float-particle var(--duration) linear infinite;
    animation-delay: var(--delay);
    filter: blur(1px);
    will-change: transform;
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
  
  /* COSMIC PORTAL ✨ */
  .cosmic-portal {
    @apply fixed inset-0 flex items-center justify-center pointer-events-none opacity-0 z-50;
  }
  
  .portal-rings {
    @apply relative w-64 h-64 flex items-center justify-center;
  }
  
  .portal-ring {
    @apply absolute rounded-full border-4 opacity-60;
  }
  
  .portal-ring:nth-child(1) {
    @apply w-full h-full;
    border-color: #8b5cf6;
  }
  
  .portal-ring:nth-child(2) {
    @apply w-3/4 h-3/4;
    border-color: #06a6ee;
  }
  
  .portal-ring:nth-child(3) {
    @apply w-1/2 h-1/2;
    border-color: #ff3a70;
  }
  
  .portal-core {
    @apply absolute w-16 h-16 rounded-full bg-gradient-to-br from-rift-500 to-time-500 opacity-80;
    box-shadow: 
      0 0 30px #8b5cf6,
      0 0 60px rgba(139, 92, 246, 0.4),
      inset 0 0 20px rgba(255, 255, 255, 0.4);
    z-index: 10;
  }
  
  /* ONBOARDING CARD ✨ */
  .onboarding-card {
    @apply relative bg-void-800/90 rounded-2xl p-8 max-w-md w-full mx-auto z-10;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px -5px rgba(139, 92, 246, 0.5);
    border: 1px solid rgba(139, 92, 246, 0.2);
    backdrop-filter: blur(8px);
    overflow: hidden;
    
    &::before {
      content: '';
      @apply absolute inset-0 z-0;
      background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.2), transparent 70%);
      opacity: 0.6;
    }
  }
  
  /* STEP INDICATORS ✨ */
  .step-indicator {
    @apply flex justify-center space-x-3 mb-6 relative z-10;
  }
  
  .step-dot {
    @apply w-3 h-3 rounded-full cursor-pointer transition-all duration-300;
    background: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &.active {
      @apply w-4 h-4;
      background: rgba(139, 92, 246, 0.7);
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    
    &.completed {
      background: rgba(16, 185, 129, 0.7);
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
  }
  
  /* TITLE ✨ */
  .onboarding-title {
    @apply text-2xl font-display font-bold text-center mb-6 relative z-10;
    background: linear-gradient(to right, #fff 0%, #a78bfa 50%, #fff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
  }
  
  /* STEPS CONTAINER ✨ */
  .steps-container {
    @apply relative min-h-[300px] z-10;
  }
  
  .step-content {
    @apply absolute inset-0;
    
    &:not(:first-child) {
      display: none;
    }
  }
  
  .step-description {
    @apply text-gray-300 text-center mb-8;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  /* FORM ELEMENTS ✨ */
  .form-group {
    @apply mb-6;
    
    &.error {
      .form-input {
        @apply border-time-500;
        box-shadow: 0 0 15px rgba(255, 58, 112, 0.3);
      }
      
      .input-decoration {
        background: linear-gradient(90deg, transparent, rgba(255, 58, 112, 0.7), transparent);
      }
    }
  }
  
  .form-label {
    @apply block text-sm font-medium text-starlight-300 mb-2;
  }
  
  .input-wrapper {
    @apply relative;
  }
  
  .form-input {
    @apply w-full py-3 px-4 bg-void-900/70 rounded-lg border border-void-700 text-white;
    backdrop-filter: blur(4px);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:focus {
      @apply outline-none border-indigo-500;
      box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    &::placeholder {
      @apply text-gray-500;
    }
  }
  
  .input-decoration {
    @apply absolute bottom-0 left-0 h-0.5 w-0 opacity-0;
    transition: all 0.3s ease;
  }
  
  .error-message {
    @apply text-sm text-time-400 mt-2;
    text-shadow: 0 0 10px rgba(255, 58, 112, 0.3);
  }
  
  .success-message {
    @apply text-sm text-green-400 mt-2;
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
  }
  
  /* THEME OPTIONS ✨ */
  .theme-options {
    @apply grid grid-cols-2 gap-4;
  }
  
  .theme-option {
    @apply rounded-lg border border-void-700 p-3 cursor-pointer transition-all duration-300;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
    
    &:hover {
      @apply transform scale-105;
      box-shadow: 0 0 20px rgba(var(--theme-color), 0.3);
      border-color: rgba(var(--theme-color), 0.3);
    }
    
    &.selected {
      box-shadow: 0 0 20px rgba(var(--theme-color), 0.5);
      border-color: rgba(var(--theme-color), 0.5);
      
      .theme-name {
        text-shadow: 0 0 10px rgba(var(--theme-color), 0.7);
      }
    }
  }
  
  .theme-preview {
    @apply h-24 rounded-md mb-3;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .theme-name {
    @apply text-center text-sm font-medium;
  }
  
  /* AI MODE OPTIONS ✨ */
  .ai-preferences {
    @apply space-y-4;
  }
  
  .ai-mode {
    @apply flex items-center p-4 rounded-lg border border-void-700 cursor-pointer transition-all duration-300 relative overflow-hidden;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
    
    &:hover {
      @apply transform scale-[1.02];
      background: rgba(15, 23, 42, 0.7);
      border-color: rgba(139, 92, 246, 0.3);
    }
    
    &.selected {
      border-color: rgba(139, 92, 246, 0.5);
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
      
      .mode-name {
        color: #a78bfa;
        text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
      }
      
      .selection-indicator {
        @apply opacity-100;
      }
    }
  }
  
  .mode-icon {
    @apply w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0;
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.3);
    background: linear-gradient(135deg, #4c1d95, #6d28d9);
    
    &.icon-balance {
      &::before {
        content: "⚖️";
      }
    }
    
    &.icon-creative {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      &::before {
        content: "🎨";
      }
    }
    
    &.icon-archmage {
      background: linear-gradient(135deg, #b45309, #d97706);
      &::before {
        content: "🧙";
      }
    }
  }
  
  .mode-details {
    @apply flex-grow;
  }
  
  .mode-name {
    @apply font-medium mb-1;
  }
  
  .mode-description {
    @apply text-sm text-gray-400;
  }
  
  .selection-indicator {
    @apply absolute inset-0 opacity-0 pointer-events-none;
    background: radial-gradient(circle at top right, rgba(139, 92, 246, 0.2), transparent 70%);
  }
  
  /* COMPLETION STEP ✨ */
  .completion-step {
    @apply flex flex-col items-center justify-center text-center;
  }
  
  .completion-animation {
    @apply relative w-24 h-24 mb-6;
  }
  
  .completion-circle {
    @apply absolute inset-0 rounded-full border-4 border-green-500;
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
  }
  
  .completion-check {
    @apply absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    stroke: #10b981;
    stroke-width: 4;
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='4'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E");
  }
  
  .completion-title {
    @apply text-xl font-semibold mb-3;
    color: #10b981;
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
  }
  
  .completion-message {
    @apply text-gray-300 mb-6;
  }
  
  .username-highlight {
    @apply font-bold;
  }
  
  .cosmic-decoration {
    @apply w-full h-px mt-6;
    background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.7), transparent);
  }
  
  /* NAVIGATION CONTROLS ✨ */
  .step-navigation {
    @apply flex justify-between mt-8 relative z-10;
  }
  
  .nav-button {
    @apply flex items-center py-2 px-4 rounded-lg font-medium transition-all duration-300;
    
    .button-text {
      @apply mx-2;
    }
    
    .button-icon {
      @apply transition-transform duration-300;
    }
  }
  
  .back-button {
    @apply bg-void-700/50 text-white;
    backdrop-filter: blur(4px);
    
    &:hover {
      @apply bg-void-600/50 transform -translate-x-1;
      
      .button-icon {
        @apply transform -translate-x-1;
      }
    }
  }
  
  .next-button {
    @apply bg-indigo-600 text-white;
    box-shadow: 0 0 15px rgba(139, 92, 246, 0.4);
    
    &:hover {
      @apply bg-indigo-500 transform translate-x-1;
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
      
      .button-icon {
        @apply transform translate-x-1;
      }
    }
    
    &:disabled {
      @apply bg-indigo-800 opacity-50 cursor-not-allowed transform-none;
      box-shadow: none;
      
      .button-icon {
        @apply transform-none;
      }
    }
  }
  
  .finish-button {
    @apply bg-green-600 text-white;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    
    &:hover {
      @apply bg-green-500 transform scale-105;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
    }
  }
  </style>