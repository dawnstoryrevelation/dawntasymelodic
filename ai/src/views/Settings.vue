<template>
  <div class="settings-container">
    <!-- Sidebar -->
    <div class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
      <div class="sidebar-header">
        <h2>Settings</h2>
        <button class="toggle-btn" @click="toggleSidebar">
          <svg :class="{ 'rotate-180': !isSidebarOpen }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <nav class="sidebar-nav">
        <a href="#account" @click="scrollToSection('account')">Account</a>
        <a href="#model-info" @click="scrollToSection('model-info')">Model Info</a>
        <a href="#contact" @click="scrollToSection('contact')">Contact</a>
      </nav>
      <div class="progress-bar">
        <div class="progress" :style="{ width: `${scrollProgress}%` }"></div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Account Section -->
      <section id="account" class="settings-section">
        <h1>Account</h1>
        <div class="account-details">
          <p><strong>Email:</strong> {{ userEmail }}</p>
          <p><strong>Password:</strong> <span class="password">••••••••</span> <button class="action-btn" @click="showToast('Password change not implemented yet', 'info')">Change</button></p>
          <button class="delete-btn" @click="confirmDeleteAccount">Delete Account</button>
        </div>
      </section>

      <!-- Model Info Section -->
      <section id="model-info" class="settings-section">
        <h1>Model Info</h1>
        <p class="model-note">All models are constructed with OpenAI API.</p>
        <div class="model-list" ref="modelList">
          <div class="model-card" v-for="model in models" :key="model.name" @mouseenter="animateModel($event, model)" @mouseleave="resetModel($event)">
            <h3 :style="{ color: model.color }">{{ model.name }}</h3>
            <p>{{ model.description }}</p>
          </div>
        </div>
        <canvas ref="threeCanvas" class="three-canvas"></canvas>
      </section>

      <!-- Contact Section -->
      <section id="contact" class="settings-section">
        <h1>Contact</h1>
        <div class="contact-details">
          <p><strong>Website:</strong> <a href="https://dawntasy.com" target="_blank">dawntasy.com</a></p>
          <p><strong>Support DawntasyAI:</strong> Want to lend DawntasyAI a hand? Buy the book for only $0.99! <a href="https://www.amazon.com/Dawntasy-Circular-Dawn-astonishing-breathtaking-ebook/dp/B0DT74DLY5/" target="_blank">Get it on Amazon</a></p>
          <p><strong>YouTube:</strong> <a href="https://www.youtube.com/@DawntasyRevelate" target="_blank">DawntasyRevelate</a></p>
          <p><strong>Email:</strong> contact@dawntasy.com</p>
        </div>
      </section>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToastNotification" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteDialog" class="modal-overlay">
      <div class="confirmation-dialog">
        <h3>Delete Account</h3>
        <p>Are you sure? This action cannot be undone.</p>
        <div class="modal-buttons">
          <button class="btn-danger" @click="deleteAccount">Delete</button>
          <button class="btn-secondary" @click="showDeleteDialog = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { getAuth, onAuthStateChanged, deleteUser } from 'firebase/auth';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import gsap from 'gsap';
import * as THREE from 'three';

export default {
  name: 'Settings',
  setup() {
    const auth = getAuth();
    const db = getFirestore();
    const isSidebarOpen = ref(true);
    const scrollProgress = ref(0);
    const userEmail = ref('');
    const showDeleteDialog = ref(false);
    const showToastNotification = ref(false);
    const toastMessage = ref('');
    const toastType = ref('info');
    const modelList = ref(null);
    const threeCanvas = ref(null);

    // Models Data
    const models = [
      { name: 'Dawntasy 1.1 Process', color: '#4f46e5', description: 'Optimized for general tasks, providing quick and reliable responses across various domains.' },
      { name: 'Dawntasy 2.4 Model Think', color: '#6366f1', description: 'Designed for deeper thinking, offering in-depth analysis and nuanced insights.' },
      { name: 'Dawntasy 3.7 Logic', color: '#06b6d4', description: 'Mimics human-like logical reasoning, perfect for structured problem-solving.' },
      { name: 'Dawntasy 11ex2 ImuTakz', color: '#4caf50', description: 'Specialized in image generation, though still refining its capabilities.' },
      { name: 'Dawntasy E1 Archmage', color: '#8b5cf6', description: 'A master of all intelligence dimensions, blending creativity, logic, and depth.' },
    ];

    // Firebase User Data
    onMounted(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          userEmail.value = user.email || 'Not available';
        } else {
          userEmail.value = 'Guest';
        }
      });

      // Scroll Progress
      window.addEventListener('scroll', updateScrollProgress);
      initThreeJS();
      animateSidebar();
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', updateScrollProgress);
    });

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
      animateSidebar();
    };

    const animateSidebar = () => {
      gsap.to('.sidebar', {
        x: isSidebarOpen.value ? 0 : -300,
        duration: 0.5,
        ease: 'power3.inOut',
      });
    };

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.value = (scrollTop / docHeight) * 100;
    };

    const scrollToSection = (sectionId) => {
      const element = document.getElementById(sectionId);
      element.scrollIntoView({ behavior: 'smooth' });
    };

    const showToast = (message, type) => {
      toastMessage.value = message;
      toastType.value = type;
      showToastNotification.value = true;
      setTimeout(() => (showToastNotification.value = false), 3000);
    };

    const confirmDeleteAccount = () => {
      showDeleteDialog.value = true;
    };

    const deleteAccount = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid));
          await deleteUser(user);
          showToast('Account deleted successfully', 'success');
          showDeleteDialog.value = false;
        } catch (error) {
          console.error('Error deleting account:', error);
          showToast('Failed to delete account', 'error');
        }
      }
    };

    // GSAP Animations for Models
    const animateModel = (event, model) => {
      const card = event.currentTarget;
      gsap.to(card, {
        scale: 1.05,
        boxShadow: `0 8px 16px ${model.color}33`,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const resetModel = (event) => {
      const card = event.currentTarget;
      gsap.to(card, {
        scale: 1,
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    // Three.js Setup
    const initThreeJS = () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas.value, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight * 0.5);

      const geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true });
      const torusKnot = new THREE.Mesh(geometry, material);
      scene.add(torusKnot);

      camera.position.z = 30;

      const animate = () => {
        requestAnimationFrame(animate);
        torusKnot.rotation.x += 0.01;
        torusKnot.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();

      window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight * 0.5);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      });
    };

    return {
      isSidebarOpen,
      scrollProgress,
      userEmail,
      models,
      toggleSidebar,
      scrollToSection,
      confirmDeleteAccount,
      deleteAccount,
      showDeleteDialog,
      showToastNotification,
      toastMessage,
      toastType,
      animateModel,
      resetModel,
      modelList,
      threeCanvas,
    };
  },
};
</script>

<style scoped>
.settings-container {
  display: flex;
  height: 100vh;
  background: #0f172a;
  color: white;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #1a1f35;
  padding: 20px;
  position: fixed;
  height: 100%;
  z-index: 10;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.sidebar-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.toggle-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
}

.toggle-btn svg.rotate-180 {
  transform: rotate(180deg);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sidebar-nav a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 16px;
  padding: 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.sidebar-nav a:hover {
  background: rgba(79, 70, 229, 0.2);
  color: white;
}

.progress-bar {
  position: absolute;
  bottom: 20px;
  width: 240px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.progress {
  height: 100%;
  background: #4f46e5;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.main-content {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  margin-left: 280px;
}

.settings-section {
  margin-bottom: 40px;
}

.settings-section h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 20px;
  background: linear-gradient(to right, #4f46e5, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.account-details p {
  margin: 10px 0;
  font-size: 16px;
}

.password {
  font-family: monospace;
}

.action-btn {
  background: #4f46e5;
  border: none;
  padding: 5px 10px;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
}

.action-btn:hover {
  background: #4338ca;
}

.delete-btn {
  background: #ef4444;
  border: none;
  padding: 10px 20px;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 20px;
}

.delete-btn:hover {
  background: #dc2626;
}

.model-note {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20px;
}

.model-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.model-card {
  background: rgba(15, 23, 42, 0.7);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.model-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.model-card p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.three-canvas {
  width: 100%;
  height: 300px;
  margin-top: 20px;
}

.contact-details p {
  margin: 10px 0;
  font-size: 16px;
}

.contact-details a {
  color: #4f46e5;
  text-decoration: none;
}

.contact-details a:hover {
  text-decoration: underline;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 4px;
  color: white;
  z-index: 1000;
}

.toast.success { background: #10b981; }
.toast.error { background: #ef4444; }
.toast.info { background: #3b82f6; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirmation-dialog {
  background: #1a1f35;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  text-align: center;
}

.confirmation-dialog h3 {
  font-size: 20px;
  margin-bottom: 10px;
}

.confirmation-dialog p {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20px;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-danger, .btn-secondary {
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    transform: translateX(-100%);
  }
  .sidebar-open {
    transform: translateX(0);
  }
  .main-content {
    margin-left: 0;
    padding: 20px;
  }
}
</style>