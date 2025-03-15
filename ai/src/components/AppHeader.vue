<template>
  <header class="cosmic-header" ref="headerElement">
    <!-- Constellation Background aaa -->
    <div class="constellation-bg" ref="constellationBg"></div>
    
    <!-- Animated Logo & Navigation -->
    <div class="container mx-auto px-4 py-3 flex justify-between items-center relative z-10">
      <!-- Logo Section -->
      <router-link to="/" class="logo-container" ref="logoContainer">
        <div class="logo-glow"></div>
        <h1 class="text-2xl md:text-3xl font-display font-bold">
          <span class="text-rift-400">Dawn</span><span class="text-white">tasy</span><span class="text-time-400">AI</span>
        </h1>
      </router-link>
      
      <!-- Nav Links - Animated on Hover -->
      <nav class="hidden md:flex items-center space-x-6" ref="navLinks">
        <router-link 
          v-for="link in navigationLinks" 
          :key="link.path" 
          :to="link.path"
          class="nav-link"
          @mouseenter="animateNavLink"
          @mouseleave="resetNavLink"
        >
          <i :class="link.icon" class="mr-2"></i>
          {{ link.label }}
        </router-link>
      </nav>
      
      <!-- User Profile Menu -->
      <div class="relative" ref="profileDropdown">
        <button 
          @click="toggleProfileMenu" 
          class="profile-button"
          ref="profileButton"
        >
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-rift-500 to-time-500 flex items-center justify-center text-white">
            {{ userInitials }}
          </div>
          <span class="hidden md:block ml-2">{{ authStore.displayName || 'User' }}</span>
          <i class="ri-arrow-down-s-line ml-1 transition-transform" :class="{ 'rotate-180': showProfileMenu }"></i>
        </button>
      </div>
      
      <!-- Mobile Navigation Toggle -->
      <button 
        class="md:hidden cosmic-menu-toggle"
        @click="toggleMobileMenu"
        ref="mobileMenuBtn"
      >
        <div class="menu-bar"></div>
        <div class="menu-bar"></div>
        <div class="menu-bar"></div>
      </button>
    </div>
    
    <!-- Mobile Navigation Drawer -->
    <transition name="drawer-slide">
      <div 
        v-if="mobileMenuOpen"
        class="mobile-nav-drawer"
        ref="mobileDrawer"
      >
        <div class="drawer-links">
          <router-link 
            v-for="link in navigationLinks" 
            :key="link.path" 
            :to="link.path"
            class="drawer-link"
            @click="mobileMenuOpen = false"
          >
            <i :class="link.icon" class="mr-2"></i>
            {{ link.label }}
          </router-link>
        </div>
      </div>
    </transition>

    <!-- Profile Menu Transition -->
    <transition
      name="menu-transition"
      @enter="onMenuEnter"
      @leave="onMenuLeave"
    >
      <div 
        v-if="showProfileMenu" 
        class="profile-dropdown"
        ref="dropdown"
      >
        <router-link 
          to="/profile" 
          class="dropdown-item"
          @click="closeMenu"
        >
          <i class="ri-user-line mr-2"></i> Profile
        </router-link>
        <router-link 
          to="/settings" 
          class="dropdown-item"
          @click="closeMenu"
        >
          <i class="ri-settings-3-line mr-2"></i> Settings
        </router-link>
        <div class="border-t border-void-700 my-1"></div>
        <button 
          @click="logout" 
          class="dropdown-item text-left w-full"
        >
          <i class="ri-logout-box-line mr-2"></i> Logout
        </button>
      </div>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'vue-router';
import gsap from 'gsap';
import anime from 'animejs';
import * as THREE from 'three';

// Service initialization
const authStore = useAuthStore();
const router = useRouter();

// State
const showProfileMenu = ref(false);
const mobileMenuOpen = ref(false);

// Refs
const headerElement = ref<HTMLElement | null>(null);
const constellationBg = ref<HTMLElement | null>(null);
const logoContainer = ref<HTMLElement | null>(null);
const navLinks = ref<HTMLElement | null>(null);
const profileDropdown = ref<HTMLElement | null>(null);
const profileButton = ref<HTMLElement | null>(null);
const dropdown = ref<HTMLElement | null>(null);
const mobileMenuBtn = ref<HTMLElement | null>(null);
const mobileDrawer = ref<HTMLElement | null>(null);

// Three.js objects
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let stars: THREE.Points;
let constellationCanvas: HTMLCanvasElement;
let animationFrameId: number;

// Navigation links
const navigationLinks = [
  { label: 'Home', path: '/', icon: 'ri-home-line' },
  { label: 'Chats', path: '/chats', icon: 'ri-chat-3-line' },
  { label: 'AI', path: '/chat', icon: 'ri-robot-line' },
  { label: 'About', path: '/about', icon: 'ri-information-line' }
];

// Computed values
const userInitials = computed(() => {
  const name = authStore.displayName || '';
  if (!name) return '?';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
});

// Methods
function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
}

function closeMenu() {
  showProfileMenu.value = false;
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  
  // Animate menu button
  if (mobileMenuBtn.value) {
    const bars = mobileMenuBtn.value.querySelectorAll('.menu-bar');
    
    if (mobileMenuOpen.value) {
      // Transform to X
      gsap.to(bars[0], { 
        rotate: 45, 
        y: 8,
        backgroundColor: '#ff3a70',
        duration: 0.3
      });
      gsap.to(bars[1], { 
        opacity: 0, 
        x: -10,
        duration: 0.3
      });
      gsap.to(bars[2], { 
        rotate: -45, 
        y: -8,
        backgroundColor: '#ff3a70',
        duration: 0.3
      });
    } else {
      // Reset to hamburger
      gsap.to(bars[0], { 
        rotate: 0, 
        y: 0,
        backgroundColor: 'white',
        duration: 0.3
      });
      gsap.to(bars[1], { 
        opacity: 1, 
        x: 0,
        duration: 0.3
      });
      gsap.to(bars[2], { 
        rotate: 0, 
        y: 0,
        backgroundColor: 'white',
        duration: 0.3
      });
    }
  }
}

async function logout() {
  try {
    // Animate logout
    if (profileButton.value) {
      gsap.to(profileButton.value, {
        scale: 0.8,
        opacity: 0.5,
        duration: 0.3,
        onComplete: async () => {
          const result = await authStore.logout();
          if (result) {
            router.push('/login');
          }
        }
      });
    } else {
      const result = await authStore.logout();
      if (result) {
        router.push('/login');
      }
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

function animateNavLink(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  
  // Glow effect
  gsap.to(target, {
    textShadow: "0 0 8px rgba(139, 92, 246, 0.8)",
    color: "#8b5cf6",
    y: -2,
    duration: 0.3
  });
  
  // Add particle effect
  const particle = document.createElement('div');
  particle.className = 'nav-particle';
  target.appendChild(particle);
  
  gsap.fromTo(particle,
    { scale: 0, opacity: 0.8 },
    { 
      scale: 1.5, 
      opacity: 0, 
      duration: 0.8,
      onComplete: () => particle.remove()
    }
  );
}

function resetNavLink(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement;
  
  gsap.to(target, {
    textShadow: "none",
    color: "white",
    y: 0,
    duration: 0.3
  });
}

function onMenuEnter(el: Element, done: () => void) {
  gsap.set(el, { 
    opacity: 0, 
    scale: 0.95, 
    transformOrigin: 'top right' 
  });
  
  gsap.to(el, {
    opacity: 1,
    scale: 1,
    duration: 0.3,
    ease: "back.out(1.7)",
    onComplete: done
  });
}

function onMenuLeave(el: Element, done: () => void) {
  gsap.to(el, {
    opacity: 0,
    scale: 0.95,
    duration: 0.2,
    onComplete: done
  });
}

// Initialize constellation background
function initConstellation() {
  if (!constellationBg.value) return;
  
  constellationCanvas = document.createElement('canvas');
  constellationBg.value.appendChild(constellationCanvas);
  
  // Create scene
  scene = new THREE.Scene();
  
  // Set up renderer
  renderer = new THREE.WebGLRenderer({
    canvas: constellationCanvas,
    alpha: true,
    antialias: true
  });
  
  // Configure camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / 60, 0.1, 2000);
  camera.position.z = 500;
  
  // Create stars
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];
  const starColors = [];
  
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 500;
    
    starVertices.push(x, y, z);
    
    // Random star colors between white, purple and blue
    const r = Math.random() * 0.3 + 0.7; // 0.7-1.0
    const g = Math.random() * 0.3 + 0.7; // 0.7-1.0
    const b = 1; // Full blue
    
    starColors.push(r, g, b);
  }
  
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
  
  const starMaterial = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });
  
  stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  
  // Create connections between stars (constellation lines)
  const lineGeometry = new THREE.BufferGeometry();
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x8b5cf6,
    transparent: true,
    opacity: 0.2
  });
  
  const lineVertices = [];
  const positions = starGeometry.attributes.position.array;
  
  // Connect some stars with lines (not all - just a subset)
  for (let i = 0; i < positions.length - 6; i += 9) {
    if (Math.random() > 0.7) continue; // Only connect some stars
    
    const x1 = positions[i];
    const y1 = positions[i + 1];
    const z1 = positions[i + 2];
    
    const x2 = positions[i + 3];
    const y2 = positions[i + 4];
    const z2 = positions[i + 5];
    
    // Calculate distance between stars
    const distance = Math.sqrt(
      Math.pow(x2 - x1, 2) + 
      Math.pow(y2 - y1, 2) + 
      Math.pow(z2 - z1, 2)
    );
    
    // Only connect stars that are relatively close
    if (distance < 300) {
      lineVertices.push(x1, y1, z1);
      lineVertices.push(x2, y2, z2);
    }
  }
  
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lines);
  
  // Resize handler
  const resizeHandler = () => {
    if (!headerElement.value) return;
    
    const width = window.innerWidth;
    const height = headerElement.value.clientHeight;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  
  // Initial sizing
  resizeHandler();
  window.addEventListener('resize', resizeHandler);
  
  // Animation loop
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    
    // Subtle movement
    stars.rotation.y += 0.0005;
    stars.rotation.x += 0.0002;
    
    // Mouse parallax effect if available
    if (window.mouseX !== undefined) {
      stars.rotation.y += (window.mouseX * 0.00001);
      stars.rotation.x += (window.mouseY * 0.00001);
    }
    
    renderer.render(scene, camera);
  };
  
  animate();
}

// Lifecycle hooks
onMounted(() => {
  // Initialize animations
  initHeaderAnimations();
  
  // Initialize constellation background
  initConstellation();
  
  // Handle clicks outside profile menu
  document.addEventListener('click', handleClickOutside);
  
  // Track mouse position for parallax
  document.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('mousemove', handleMouseMove);
  
  // Clean up three.js
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  if (renderer) {
    renderer.dispose();
  }
  
  if (constellationCanvas && constellationCanvas.parentNode) {
    constellationCanvas.parentNode.removeChild(constellationCanvas);
  }
});

// Initialize animations
function initHeaderAnimations() {
  // Logo animation
  if (logoContainer.value) {
    const logoGlow = logoContainer.value.querySelector('.logo-glow');
    
    gsap.fromTo(logoGlow,
      { scale: 0.8, opacity: 0.5 },
      { 
        scale: 1.2, 
        opacity: 0.8, 
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      }
    );
  }
  
  // Nav links entrance
  if (navLinks.value) {
    const links = navLinks.value.querySelectorAll('.nav-link');
    
    gsap.from(links, {
      y: -10,
      opacity: 0,
      stagger: 0.1,
      duration: 0.5,
      ease: "power2.out"
    });
  }
  
  // Profile button entrance
  if (profileButton.value) {
    gsap.from(profileButton.value, {
      x: 20,
      opacity: 0,
      duration: 0.5,
      delay: 0.4,
      ease: "back.out(1.7)"
    });
  }
}

// Handle click outside of profile menu
function handleClickOutside(event: MouseEvent) {
  if (profileDropdown.value && !profileDropdown.value.contains(event.target as Node)) {
    showProfileMenu.value = false;
  }
}

// Handle mouse move for parallax
function handleMouseMove(event: MouseEvent) {
  window.mouseX = event.clientX - window.innerWidth / 2;
  window.mouseY = event.clientY - window.innerHeight / 2;
}

// Watch for route changes to close mobile menu
watch(() => router.currentRoute.value.path, () => {
  mobileMenuOpen.value = false;
});
</script>

<style lang="scss" scoped>
.cosmic-header {
  @apply relative bg-void-900 bg-opacity-90 text-white overflow-hidden;
  backdrop-filter: blur(10px);
  height: 64px;
  box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.constellation-bg {
  @apply absolute inset-0 w-full h-full overflow-hidden;
  z-index: 1;
}

.logo-container {
  @apply relative flex items-center;
  z-index: 10;
  
  .logo-glow {
    @apply absolute inset-0 rounded-full;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0) 70%);
    z-index: -1;
  }
  
  &:hover {
    @apply transform;
    text-shadow: 0 0 10px theme('colors.rift.500');
  }
}

.nav-link {
  @apply relative flex items-center py-2 px-1 text-sm font-medium transition-all duration-300;
  z-index: 10;
  
  &::after {
    content: '';
    @apply absolute left-0 bottom-0 w-0 h-0.5 bg-rift-500 transition-all duration-300;
  }
  
  &:hover::after, &.router-link-active::after {
    @apply w-full;
  }
  
  &.router-link-active {
    @apply text-rift-400;
  }
  
  .nav-particle {
    @apply absolute inset-0 rounded-full pointer-events-none;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0) 70%);
    z-index: -1;
  }
}

.profile-button {
  @apply flex items-center py-1 px-2 rounded-full border border-void-700 bg-void-800 transition-all duration-300;
  z-index: 10;
  
  &:hover {
    @apply border-void-600 bg-void-700 transform scale-105;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
  }
}

.profile-dropdown {
  @apply absolute right-0 mt-2 w-48 bg-void-800 rounded-lg shadow-xl border border-void-700 overflow-hidden;
  z-index: 20;
  
  .dropdown-item {
    @apply flex items-center px-4 py-2 text-sm text-white hover:bg-void-700 transition-colors duration-200;
    
    &:hover {
      @apply bg-rift-900 bg-opacity-30;
    }
  }
}

.cosmic-menu-toggle {
  @apply relative w-8 h-8 flex flex-col justify-center items-center;
  z-index: 30;
  
  .menu-bar {
    @apply w-6 h-0.5 bg-white rounded my-0.5 transition-all duration-300;
  }
}

.mobile-nav-drawer {
  @apply fixed inset-0 bg-void-900 bg-opacity-95 pt-16 z-20;
  backdrop-filter: blur(5px);
  
  .drawer-links {
    @apply flex flex-col w-full p-4;
    
    .drawer-link {
      @apply flex items-center py-4 px-4 text-lg border-b border-void-700 transition-all duration-200;
      
      &:hover, &.router-link-active {
        @apply bg-void-800 text-rift-400;
        padding-left: 1.5rem;
      }
    }
  }
}

.menu-transition-enter-active,
.menu-transition-leave-active {
  transition: all 0.3s ease-out;
}

.menu-transition-enter-from,
.menu-transition-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: all 0.3s ease-out;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
