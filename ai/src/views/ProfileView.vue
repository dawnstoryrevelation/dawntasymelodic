<template>
    <div class="profile-container">
      <!-- Three.js Canvas Background -->
      <canvas ref="threeJsCanvas" class="cosmic-background"></canvas>
      
      <!-- Overlay & Particles -->
      <div class="bg-overlay"></div>
      <div class="particles-container" ref="particlesContainer"></div>
      
      <!-- Floating Magic Runes -->
      <div v-for="(rune, index) in 5" :key="`rune-${index}`" 
          :class="`magic-rune rune-${index}`" :ref="`rune${index}`"></div>
      
      <!-- Cosmic Portals -->
      <div class="cosmic-portal portal-left"></div>
      <div class="cosmic-portal portal-right"></div>
      
      <!-- Loading Animation -->
      <div v-if="loading" class="loading-container">
        <div class="magic-loader">
          <div class="loader-orbit">
            <div class="loader-planet"></div>
          </div>
          <div class="loader-orbit orbit-2">
            <div class="loader-moon"></div>
          </div>
          <div class="loading-text">Summoning Profile...</div>
        </div>
      </div>
      
      <!-- Main Content -->
      <div v-else class="profile-content">
        <!-- Progress Tracker -->
        <div class="progress-container">
          <div class="progress-bar" ref="progressBar"></div>
        </div>
        
        <!-- Profile Header -->
        <header class="profile-header">
          <div class="cosmic-frame" ref="profileFrame">
            <div class="avatar-container" ref="avatarContainer">
              <div class="avatar-circle" ref="avatarCircle">
                <img :src="userData.photoURL || defaultAvatar" alt="Profile" class="avatar-image" ref="avatarImage">
                <div class="avatar-aura"></div>
              </div>
              <svg class="avatar-orbit" width="200" height="200" ref="avatarOrbit">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#9d4edd" stroke-width="1" stroke-dasharray="5 3"/>
                <circle class="orbit-dot" cx="100" cy="10" r="4" fill="#ff7b54"/>
              </svg>
            </div>
            
            <h1 class="profile-name" ref="profileName">{{ userData.displayName || 'Mysterious Traveler' }}</h1>
            <p class="profile-tagline" ref="profileTagline">
              {{ userData.tagline || 'Wanderer of the Cosmic Realms' }}
            </p>
            
            <!-- Cosmic Badge -->
            <div class="cosmic-badge" v-if="userData.premium" ref="cosmicBadge">
              <div class="badge-star"></div>
              <span>Premium Voyager</span>
            </div>
          </div>
        </header>
        
        <!-- User Stats with Magical Cards -->
        <section class="stats-section" ref="statsSection">
          <h2 class="section-title" ref="statsTitle">Cosmic Journey Stats</h2>
          
          <div class="stats-grid">
            <div v-for="(stat, index) in userStats" :key="`stat-${index}`" 
                class="stat-card" :ref="`statCard${index}`">
              <div class="stat-icon" :class="stat.icon"></div>
              <div class="stat-value" ref="statValues">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
              <svg class="card-decoration" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0,0 L100,0 L100,100 L0,100 Z" class="card-outline" ref="cardOutlines"/>
              </svg>
            </div>
          </div>
        </section>
        
        <!-- User Bio with Portal Effect -->
        <section class="bio-section tilt-card" ref="bioSection">
          <div class="section-header">
            <h2 class="section-title" ref="bioTitle">About Me</h2>
            <div class="magic-underline"></div>
          </div>
          
          <div class="tilt-inner" ref="bioCard">
            <div class="bio-content">
              <p class="bio-text" ref="bioText">{{ userData.bio || 'This traveler has not yet written their cosmic tale...' }}</p>
            </div>
            <div class="magical-corner top-left"></div>
            <div class="magical-corner top-right"></div>
            <div class="magical-corner bottom-left"></div>
            <div class="magical-corner bottom-right"></div>
          </div>
        </section>
        
        <!-- Activity Timeline -->
        <section class="timeline-section" ref="timelineSection">
          <h2 class="section-title" ref="timelineTitle">Recent Adventures</h2>
          
          <div class="timeline-container">
            <div class="timeline-track"></div>
            
            <div v-for="(activity, index) in userActivities" :key="`activity-${index}`" 
                 class="timeline-item" :ref="`timelineItem${index}`" :class="{ 'right-aligned': index % 2 !== 0 }">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-date">{{ activity.date }}</div>
                <div class="timeline-title">{{ activity.title }}</div>
                <div class="timeline-description">{{ activity.description }}</div>
                <div class="timeline-glow"></div>
              </div>
            </div>
            
            <div v-if="userActivities.length === 0" class="empty-timeline" ref="emptyTimeline">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-title">Begin Your Journey</div>
                <div class="timeline-description">Your adventures will be chronicled here as you explore the universe.</div>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Achievements with Floating Cards -->
        <section class="achievements-section" ref="achievementsSection">
          <h2 class="section-title" ref="achievementsTitle">Legendary Achievements</h2>
          
          <div class="achievements-container">
            <div v-for="(achievement, index) in userAchievements" :key="`achievement-${index}`" 
                 class="achievement-card" :ref="`achievementCard${index}`" :class="{ 'locked': !achievement.unlocked }">
              <div class="achievement-icon" :class="achievement.icon"></div>
              <div class="achievement-info">
                <div class="achievement-name">{{ achievement.name }}</div>
                <div class="achievement-description">{{ achievement.description }}</div>
              </div>
              <div class="achievement-progress" v-if="achievement.progress">
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: `${achievement.progress}%` }"></div>
                </div>
                <div class="progress-text">{{ achievement.progress }}%</div>
              </div>
              <div class="achievement-lock" v-if="!achievement.unlocked">
                <i class="fas fa-lock"></i>
              </div>
              <div class="achievement-glow" v-if="achievement.unlocked"></div>
            </div>
            
            <div v-if="userAchievements.length === 0" class="empty-achievements" ref="emptyAchievements">
              <div class="achievement-icon"><i class="fas fa-trophy"></i></div>
              <div class="achievement-text">Complete quests to earn cosmic achievements</div>
            </div>
          </div>
        </section>
        
        <!-- Friends Portal -->
        <section class="friends-section" ref="friendsSection">
          <h2 class="section-title" ref="friendsTitle">Fellow Voyagers</h2>
          
          <div class="portal-container">
            <div class="portal-frame" ref="friendsPortal">
              <div class="portal-energy"></div>
              
              <div class="friends-grid">
                <div v-for="(friend, index) in userFriends" :key="`friend-${index}`" 
                     class="friend-card" :ref="`friendCard${index}`">
                  <div class="friend-avatar">
                    <img :src="friend.photoURL || defaultAvatar" :alt="friend.displayName">
                  </div>
                  <div class="friend-info">
                    <div class="friend-name">{{ friend.displayName }}</div>
                    <div class="friend-status" :class="friend.online ? 'online' : 'offline'">
                      {{ friend.online ? 'Online' : 'Offline' }}
                    </div>
                  </div>
                </div>
                
                <div v-if="userFriends.length === 0" class="empty-friends" ref="emptyFriends">
                  <div class="empty-icon"><i class="fas fa-user-friends"></i></div>
                  <div class="empty-text">Forge connections across the cosmos</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Edit Profile Button -->
        <div class="edit-profile-container" ref="editButtonContainer">
          <button class="cosmic-button edit-profile-button" @click="openEditProfile" ref="editButton">
            <span class="button-text">Edit Your Cosmic Profile</span>
            <div class="button-glow"></div>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted, computed } from 'vue';
  import { getDatabase, ref as dbRef, onValue } from 'firebase/database';
  import * as THREE from 'three';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import anime from 'animejs/lib/anime.es.js';
  
  export default {
    name: 'ProfileView',
    props: {
      userId: {
        type: String,
        required: true
      }
    },
    setup(props) {
      // Register GSAP plugins
      gsap.registerPlugin(ScrollTrigger);
      
      // Refs for animations and data
      const threeJsCanvas = ref(null);
      const particlesContainer = ref(null);
      const progressBar = ref(null);
      const loading = ref(true);
      const userData = ref({});
      const defaultAvatar = 'https://i.imgur.com/7PrLCGU.png'; // Default cosmic avatar
      
      // Three.js scene variables
      let scene, camera, renderer, stars, nebula;
      let animationFrameId = null;
      
      // Sample user stats (will be replaced with Firebase data)
      const userStats = ref([
        { label: 'Days Active', value: 0, icon: 'fas fa-calendar-alt' },
        { label: 'Friends', value: 0, icon: 'fas fa-user-friends' },
        { label: 'Achievements', value: 0, icon: 'fas fa-trophy' },
        { label: 'Experience', value: 0, icon: 'fas fa-star' }
      ]);
      
      // Sample activities (will be replaced with Firebase data)
      const userActivities = ref([]);
      
      // Sample achievements (will be replaced with Firebase data)
      const userAchievements = ref([]);
      
      // Sample friends (will be replaced with Firebase data)
      const userFriends = ref([]);
      
      // Fetch user data from Firebase
      const fetchUserData = () => {
        const database = getDatabase();
        const userRef = dbRef(database, `users/${props.userId}`);
        
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            userData.value = data;
            
            // Update stats with real data
            if (data.stats) {
              userStats.value[0].value = data.stats.daysActive || 0;
              userStats.value[1].value = data.stats.friendsCount || 0;
              userStats.value[2].value = data.stats.achievementsCount || 0;
              userStats.value[3].value = data.stats.experience || 0;
            }
            
            // Update activities with real data
            if (data.activities) {
              userActivities.value = Object.values(data.activities)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5); // Get 5 most recent activities
            }
            
            // Update achievements with real data
            if (data.achievements) {
              userAchievements.value = Object.values(data.achievements);
            }
            
            // Update friends with real data
            if (data.friends) {
              userFriends.value = Object.values(data.friends);
            }
          }
          
          // Set loading to false after data is fetched
          setTimeout(() => {
            loading.value = false;
            // Initialize animations after data is loaded
            initAnimations();
          }, 1500); // Add slight delay for smoother transition
        });
      };
      
      // Initialize Three.js scene for cosmic background
      const initThreeJsScene = () => {
        if (!threeJsCanvas.value) return;
        
        // Setup scene
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(
          60,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.z = 30;
        
        // Setup renderer
        renderer = new THREE.WebGLRenderer({
          canvas: threeJsCanvas.value,
          antialias: true,
          alpha: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Create stars
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.1,
          transparent: true
        });
        
        const starVertices = [];
        const starColors = [];
        const colorOptions = [0xffffff, 0xc8a2ff, 0xa88cff, 0x9373ff, 0xf8f7ff];
        
        for (let i = 0; i < 10000; i++) {
          const x = (Math.random() - 0.5) * 2000;
          const y = (Math.random() - 0.5) * 2000;
          const z = (Math.random() - 0.5) * 2000;
          const color = new THREE.Color(colorOptions[Math.floor(Math.random() * colorOptions.length)]);
          
          starVertices.push(x, y, z);
          starColors.push(color.r, color.g, color.b);
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        starMaterial.vertexColors = true;
        
        stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
        
        // Create nebula
        const nebulaGeometry = new THREE.BufferGeometry();
        const nebulaMaterial = new THREE.PointsMaterial({
          color: 0x9d4edd,
          size: 0.2,
          transparent: true,
          opacity: 0.4
        });
        
        const nebulaVertices = [];
        for (let i = 0; i < 3000; i++) {
          // Create cloud-like formations
          const theta = Math.random() * Math.PI * 2;
          const radius = 20 + Math.random() * 30;
          const y = (Math.random() - 0.5) * 30;
          
          const x = Math.cos(theta) * radius;
          const z = Math.sin(theta) * radius;
          
          nebulaVertices.push(x, y, z);
        }
        
        nebulaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nebulaVertices, 3));
        nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        scene.add(nebula);
        
        // Handle window resize
        window.addEventListener('resize', handleWindowResize);
        
        // Start animation loop
        animateThreeJs();
      };
      
      // Three.js animation loop
      const animateThreeJs = () => {
        animationFrameId = requestAnimationFrame(animateThreeJs);
        
        // Rotate stars slightly
        if (stars) {
          stars.rotation.y += 0.0002;
          stars.rotation.x += 0.0001;
        }
        
        // Animate nebula
        if (nebula) {
          nebula.rotation.y += 0.0003;
        }
        
        renderer.render(scene, camera);
      };
      
      // Handle window resize
      const handleWindowResize = () => {
        if (!camera || !renderer) return;
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      
      // Create floating particles
      const createParticles = () => {
        if (!particlesContainer.value) return;
        
        const container = particlesContainer.value;
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.classList.add('particle');
          
          // Randomize particle properties
          const size = Math.random() * 3 + 2;
          const xPos = Math.random() * 100;
          const delay = Math.random() * 15;
          const duration = Math.random() * 10 + 10;
          const opacity = Math.random() * 0.5 + 0.3;
          const drift = Math.random() * 200 - 100;
          
          particle.style.left = `${xPos}vw`;
          particle.style.bottom = '-5px';
          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          particle.style.animationDelay = `${delay}s`;
          particle.style.setProperty('--duration', `${duration}s`);
          particle.style.setProperty('--opacity', opacity);
          particle.style.setProperty('--drift', `${drift}px`);
          
          container.appendChild(particle);
        }
      };
      
      // Initialize all animations after data is loaded
      const initAnimations = () => {
        // Progress bar scroll tracking
        window.addEventListener('scroll', () => {
          if (!progressBar.value) return;
          
          const winScroll = document.documentElement.scrollTop;
          const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const scrolled = (winScroll / height) * 100;
          progressBar.value.style.width = `${scrolled}%`;
        });
        
        // GSAP animations for profile elements
        initGsapAnimations();
        
        // Anime.js animations for decorative elements
        initAnimeAnimations();
        
        // Set up 3D tilt effect for bio card
        setupTiltEffect();
      };
      
      // GSAP animations
      const initGsapAnimations = () => {
        // Profile header animations
        gsap.from(".avatar-container", {
          y: 50,
          opacity: 0,
          duration: 1,
          ease: "power3.out"
        });
        
        gsap.from(".profile-name", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          delay: 0.3,
          ease: "power3.out"
        });
        
        gsap.from(".profile-tagline", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          delay: 0.5,
          ease: "power3.out"
        });
        
        if (userData.value.premium) {
          gsap.from(".cosmic-badge", {
            scale: 0,
            opacity: 0,
            duration: 0.8,
            delay: 0.7,
            ease: "elastic.out(1, 0.5)"
          });
        }
        
        // Stats cards animations
        gsap.from(".stat-card", {
          scrollTrigger: {
            trigger: ".stats-section",
            start: "top 80%"
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out"
        });
        
        // Bio section animation
        gsap.from(".bio-section", {
          scrollTrigger: {
            trigger: ".bio-section",
            start: "top 80%"
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out"
        });
        
        // Timeline items animations
        gsap.from(".timeline-item", {
          scrollTrigger: {
            trigger: ".timeline-section",
            start: "top 80%"
          },
          x: (i) => i % 2 === 0 ? -50 : 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out"
        });
        
        // Achievements animations
        gsap.from(".achievement-card", {
          scrollTrigger: {
            trigger: ".achievements-section",
            start: "top 80%"
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out"
        });
        
        // Friends portal animation
        gsap.from(".portal-frame", {
          scrollTrigger: {
            trigger: ".friends-section",
            start: "top 80%"
          },
          scale: 0.8,
          opacity: 0,
          duration: 1,
          ease: "power3.out"
        });
        
        // Friends cards animations
        gsap.from(".friend-card", {
          scrollTrigger: {
            trigger: ".friends-section",
            start: "top 70%"
          },
          scale: 0.8,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)"
        });
        
        // Edit button animation
        gsap.from(".edit-profile-button", {
          scrollTrigger: {
            trigger: ".edit-profile-container",
            start: "top 90%"
          },
          y: 30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out"
        });
        
        // Section titles animations
        gsap.utils.toArray('.section-title').forEach(title => {
          gsap.from(title, {
            scrollTrigger: {
              trigger: title,
              start: "top 85%"
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
          });
        });
      };
      
      // Anime.js animations
      const initAnimeAnimations = () => {
        // Avatar orbit animation
        anime({
          targets: '.orbit-dot',
          translateX: '-50%',
          translateY: '-50%',
          rotate: 360,
          duration: 10000,
          loop: true,
          easing: 'linear',
          transformOrigin: '100px 100px'
        });
        
        // Avatar pulse animation
        anime({
          targets: '.avatar-aura',
          scale: [1, 1.2],
          opacity: [0.5, 0.2],
          easing: 'easeInOutSine',
          duration: 1500,
          loop: true,
          direction: 'alternate'
        });
        
        // Stat number counting animation
        anime({
          targets: '.stat-value',
          innerHTML: (el) => [0, el.innerHTML],
          round: 1,
          easing: 'easeInOutExpo',
          duration: 2000,
          delay: anime.stagger(200)
        });
        
        // Card outline animation
        anime({
          targets: '.card-outline',
          strokeDashoffset: [anime.setDashoffset, 0],
          easing: 'easeInOutSine',
          duration: 1500,
          delay: anime.stagger(150)
        });
        
        // Timeline dot pulse
        anime({
          targets: '.timeline-dot',
          scale: [1, 1.3],
          opacity: [0.7, 1],
          easing: 'easeInOutSine',
          duration: 1500,
          loop: true,
          direction: 'alternate'
        });
        
        // Magic runes animations
        anime({
          targets: '.magic-rune',
          opacity: [0, 0.25],
          scale: [0.5, 1],
          delay: anime.stagger(300),
          duration: 2000,
          easing: 'easeOutElastic(1, .5)'
        });
        
        // Portal energy animation
        anime({
          targets: '.portal-energy',
          rotate: 360,
          duration: 20000,
          loop: true,
          easing: 'linear'
        });
        
        // Achievement glow pulse
        anime({
          targets: '.achievement-glow',
          scale: [1, 1.2],
          opacity: [0.3, 0.8],
          easing: 'easeInOutSine',
          duration: 2000,
          loop: true,
          direction: 'alternate'
        });
        
        // Button glow effect
        anime({
          targets: '.button-glow',
          opacity: [0.5, 1],
          scale: [1, 1.2],
          easing: 'easeInOutSine',
          duration: 1500,
          loop: true,
          direction: 'alternate'
        });
        
        // Magical corners animation
        anime({
          targets: '.magical-corner',
          opacity: [0.3, 0.8],
          scale: [0.8, 1.1],
          easing: 'easeInOutSine',
          duration: 3000,
          loop: true,
          direction: 'alternate',
          delay: anime.stagger(500)
        });
      };
      
      // 3D tilt effect for bio card
      const setupTiltEffect = () => {
        const bioCard = document.querySelector('.tilt-inner');
        if (!bioCard) return;
        
        bioCard.addEventListener('mousemove', (e) => {
          const rect = bioCard.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          
          const rotateY = ((x - centerX) / centerX) * 5;
          const rotateX = ((centerY - y) / centerY) * 5;
          
          gsap.to(bioCard, {
            rotateY: rotateY,
            rotateX: rotateX,
            transformPerspective: 1000,
            ease: 'power1.out',
            duration: 0.3
          });
        });
        
        bioCard.addEventListener('mouseleave', () => {
          gsap.to(bioCard, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.5,
            ease: 'power1.out'
          });
        });
      };
      
      // Handle edit profile button click
      const openEditProfile = () => {
        // Navigate to edit profile page or open modal
        console.log('Edit profile clicked');
        // Implementation will depend on your app's routing
      };
      
      // Initialize everything on component mount
      onMounted(() => {
        // Fetch user data from Firebase
        fetchUserData();
        
        // Initialize Three.js background
        initThreeJsScene();
        
        // Create floating particles
        createParticles();
      });
      
      // Clean up on component unmount
      onUnmounted(() => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        
        window.removeEventListener('resize', handleWindowResize);
        
        // Dispose Three.js resources
        if (renderer) {
          renderer.dispose();
        }
        
        // Clean up GSAP animations
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      });
      
      return {
        threeJsCanvas,
        particlesContainer,
        progressBar,
        loading,
        userData,
        defaultAvatar,
        userStats,
        userActivities,
        userAchievements,
        userFriends,
        openEditProfile
      };
    }
  };
  </script>
  
  <style scoped>
  /* Base Styles */
  :root {
    --primary-color: #6237a0;
    --secondary-color: #9d4edd;
    --accent-color: #ff7b54;
    --text-light: #f9f7ff;
    --text-dark: #2d1b4b;
    --cosmic-bg-dark: #0f0826;
    --cosmic-gradient: linear-gradient(135deg, #6237a0, #9d4edd);
    --cosmic-glow: 0 0 20px rgba(157, 78, 221, 0.6);
    --cosmic-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    --cosmic-border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .profile-container {
    position: relative;
    min-height: 100vh;
    width: 100%;
    color: var(--text-light);
    font-family: 'Montserrat', sans-serif;
    overflow-x: hidden;
    background-color: #050208;
  }
  
  /* THREE.js Canvas Background */
  .cosmic-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
  
  /* Background Overlay */
  .bg-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, rgba(10, 5, 20, 0.4) 0%, rgba(5, 2, 10, 0.9) 100%);
    z-index: -1;
  }
  
  /* Floating Particles */
  .particles-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: -1;
    pointer-events: none;
  }
  
  .particle {
    position: absolute;
    width: 3px;
    height: 3px;
    background-color: rgba(255, 255, 255, 0.7);
    box-shadow: 0 0 10px rgba(157, 78, 221, 0.6);
    border-radius: 50%;
    animation: floatParticle var(--duration) linear infinite;
    opacity: var(--opacity);
  }
  
  @keyframes floatParticle {
    0% {
      transform: translateY(0) translateX(0);
      opacity: var(--opacity);
    }
    100% {
      transform: translateY(-100vh) translateX(var(--drift));
      opacity: 0;
    }
  }
  
  /* Magic Runes */
  .magic-rune {
    position: fixed;
    width: 100px;
    height: 100px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0;
    z-index: -1;
    pointer-events: none;
    filter: hue-rotate(60deg) brightness(1.5);
  }
  
  .rune-0 {
    top: 10%;
    left: 5%;
    animation: floatRune 20s infinite alternate ease-in-out;
  }
  
  .rune-1 {
    top: 70%;
    right: 5%;
    animation: floatRune 25s infinite alternate-reverse ease-in-out;
  }
  
  .rune-2 {
    bottom: 20%;
    left: 8%;
    animation: floatRune 22s infinite alternate ease-in-out;
  }
  
  .rune-3 {
    top: 30%;
    right: 8%;
    animation: floatRune 18s infinite alternate-reverse ease-in-out;
  }
  
  .rune-4 {
    bottom: 60%;
    left: 50%;
    animation: floatRune 30s infinite alternate ease-in-out;
  }
  
  @keyframes floatRune {
    0% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-15px) rotate(5deg);
    }
    100% {
      transform: translateY(15px) rotate(-5deg);
    }
  }
  
  /* Cosmic Portals */
  .cosmic-portal {
    position: fixed;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle at center, rgba(157, 78, 221, 0.2) 0%, rgba(13, 27, 42, 0) 70%);
    filter: blur(20px);
    opacity: 0.4;
    z-index: -1;
    animation: portalPulse 8s infinite alternate ease-in-out;
  }
  
  .portal-left {
    top: 40%;
    left: -150px;
  }
  
  .portal-right {
    bottom: 30%;
    right: -150px;
  }
  
  @keyframes portalPulse {
    0% {
      transform: scale(1);
      opacity: 0.3;
      filter: blur(20px);
    }
    100% {
      transform: scale(1.3);
      opacity: 0.5;
      filter: blur(25px);
    }
  }
  
  /* Loading Animation */
  .loading-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(5, 2, 10, 0.9);
    z-index: 100;
  }
  
  .magic-loader {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .loader-orbit {
    position: absolute;
    width: 120px;
    height: 120px;
    border: 2px dashed rgba(157, 78, 221, 0.5);
    border-radius: 50%;
    animation: spin 4s linear infinite;
  }
  
  .loader-planet {
    position: absolute;
    width: 24px;
    height: 24px;
    background: var(--cosmic-gradient);
    border-radius: 50%;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 20px rgba(157, 78, 221, 0.8);
  }
  
  .orbit-2 {
    width: 80px;
    height: 80px;
    animation-direction: reverse;
    animation-duration: 3s;
  }
  
  .loader-moon {
    width: 12px;
    height: 12px;
    background: var(--accent-color);
    top: -6px;
  }
  
  .loading-text {
    position: absolute;
    bottom: -40px;
    color: var(--text-light);
    font-size: 1.2rem;
    font-weight: 500;
    text-align: center;
    animation: pulse 1.5s infinite alternate;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes pulse {
    from {
      opacity: 0.6;
    }
    to {
      opacity: 1;
    }
  }
  
  /* Main Content Styles */
  .profile-content {
    position: relative;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    z-index: 1;
  }
  
  /* Progress Bar */
  .progress-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: transparent;
    z-index: 100;
  }
  
  .progress-bar {
    height: 100%;
    background: var(--cosmic-gradient);
    width: 0%;
    box-shadow: var(--cosmic-glow);
    transition: width 0.2s ease;
  }
  
  /* Profile Header Styles */
  .profile-header {
    position: relative;
    margin-top: 30px;
    margin-bottom: 50px;
    text-align: center;
  }
  
  .cosmic-frame {
    position: relative;
    padding: 40px 20px;
    background-color: rgba(15, 8, 38, 0.6);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: var(--cosmic-shadow);
    border: var(--cosmic-border);
    overflow: hidden;
  }
  
  .cosmic-frame::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(98, 55, 160, 0.1) 0%, transparent 100%);
    z-index: -1;
  }
  
  .avatar-container {
    position: relative;
    width: 200px;
    height: 200px;
    margin: 0 auto 20px;
  }
  
  .avatar-circle {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto;
    border: 3px solid transparent;
    background: linear-gradient(#0f0826, #0f0826) padding-box, 
                var(--cosmic-gradient) border-box;
    box-shadow: var(--cosmic-shadow);
    z-index: 2;
  }
  
  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  
  .avatar-aura {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(157, 78, 221, 0.3) 0%, transparent 70%);
    z-index: 1;
  }
  
  .avatar-orbit {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  
  .profile-name {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 10px;
    background: linear-gradient(to right, var(--text-light), var(--secondary-color), var(--text-light));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 0 10px rgba(157, 78, 221, 0.3);
  }
  
  .profile-tagline {
    font-size: 1.2rem;
    color: var(--text-light);
    opacity: 0.9;
    margin-bottom: 20px;
  }
  
  .cosmic-badge {
    display: inline-flex;
    align-items: center;
    padding: 8px 15px;
    background: linear-gradient(135deg, rgba(255, 123, 84, 0.2), rgba(157, 78, 221, 0.2));
    border-radius: 20px;
    margin-top: 10px;
    border: 1px solid rgba(255, 123, 84, 0.3);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
  
  .badge-star {
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ff7b54'%3E%3Cpath d='M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'/%3E%3C/svg%3E");
    background-size: contain;
    margin-right: 8px;
  }
  
  /* Stats Section Styles */
  .stats-section {
    margin-bottom: 50px;
  }
  
  .section-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 30px;
    text-align: center;
    color: var(--text-light);
    position: relative;
    display: inline-block;
    left: 50%;
    transform: translateX(-50%);
    padding-bottom: 15px;
  }
  
  .section-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 3px;
    background: linear-gradient(to right, transparent, var(--accent-color), transparent);
    border-radius: 3px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  
  .stat-card {
    position: relative;
    background-color: rgba(15, 8, 38, 0.6);
    border-radius: 15px;
    padding: 25px 20px;
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: var(--cosmic-border);
    overflow: hidden;
  }
  
  .stat-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--cosmic-shadow);
  }
  
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--cosmic-gradient);
    border-radius: 3px 3px 0 0;
  }
  
  .stat-icon {
    font-size: 1.8rem;
    margin-bottom: 15px;
    color: var(--secondary-color);
  }
  
  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 5px;
    background: linear-gradient(to right, var(--text-light), var(--secondary-color));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .stat-label {
    font-size: 1rem;
    color: var(--text-light);
    opacity: 0.8;
  }
  
  .card-decoration {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
  }
  
  .card-outline {
    fill: none;
    stroke: rgba(157, 78, 221, 0.3);
    stroke-width: 1;
    stroke-dasharray: 5 3;
  }
  
  /* Bio Section Styles */
  .bio-section {
    margin-bottom: 50px;
    perspective: 1000px;
  }
  
  .section-header {
    position: relative;
    margin-bottom: 20px;
  }
  
  .magic-underline {
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 2px;
    background: var(--cosmic-gradient);
    border-radius: 2px;
  }
  
  .tilt-inner {
    position: relative;
    background-color: rgba(15, 8, 38, 0.6);
    border-radius: 15px;
    padding: 30px;
    box-shadow: var(--cosmic-shadow);
    border: var(--cosmic-border);
    transform-style: preserve-3d;
    transition: transform 0.5s ease;
  }
  
  .bio-content {
    position: relative;
    z-index: 1;
  }
  
  .bio-text {
    font-size: 1.1rem;
    line-height: 1.8;
    color: var(--text-light);
    opacity: 0.9;
  }
  
  .magical-corner {
    position: absolute;
    width: 30px;
    height: 30px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='%239d4edd' stroke-width='2'%3E%3Cpath d='M20 0 L0 0 L0 20'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.5;
    z-index: 0;
  }
  
  .top-left {
    top: 10px;
    left: 10px;
  }
  
  .top-right {
    top: 10px;
    right: 10px;
    transform: rotate(90deg);
  }
  
  .bottom-left {
    bottom: 10px;
    left: 10px;
    transform: rotate(270deg);
  }
  
  .bottom-right {
    bottom: 10px;
    right: 10px;
    transform: rotate(180deg);
  }
  
  /* Timeline Section Styles */
  .timeline-section {
    margin-bottom: 50px;
  }
  
  .timeline-container {
    position: relative;
    padding: 20px 0;
  }
  
  .timeline-track {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    background: linear-gradient(to bottom, transparent, var(--secondary-color), transparent);
    transform: translateX(-50%);
  }
  
  .timeline-item {
    position: relative;
    margin-bottom: 30px;
    display: flex;
    justify-content: flex-end;
    padding-right: 50%;
  }
  
  .timeline-item.right-aligned {
    justify-content: flex-start;
    padding-right: 0;
    padding-left: 50%;
  }
  
  .timeline-dot {
    position: absolute;
    top: 20px;
    left: 50%;
    width: 12px;
    height: 12px;
    background: var(--accent-color);
    border-radius: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 10px rgba(255, 123, 84, 0.8);
    z-index: 1;
  }
  
  .timeline-content {
    position: relative;
    width: 80%;
    background-color: rgba(15, 8, 38, 0.6);
    border-radius: 15px;
    padding: 20px;
    box-shadow: var(--cosmic-shadow);
    border: var(--cosmic-border);
    margin-right: 30px;
  }
  
  .timeline-item.right-aligned .timeline-content {
    margin-right: 0;
    margin-left: 30px;
  }
  
  .timeline-date {
    font-size: 0.9rem;
    color: var(--accent-color);
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .timeline-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--text-light);
  }
  
  .timeline-description {
    font-size: 1rem;
    color: rgba(249, 247, 255, 0.8);
    line-height: 1.6;
  }
  
  .timeline-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 15px;
    background: radial-gradient(circle at 30% 30%, rgba(157, 78, 221, 0.1) 0%, transparent 70%);
    pointer-events: none;
    z-index: -1;
  }
  
  .empty-timeline {
    position: relative;
    width: 60%;
    margin: 0 auto;
    background-color: rgba(15, 8, 38, 0.6);
    border-radius: 15px;
    padding: 20px;
    text-align: center;
    box-shadow: var(--cosmic-shadow);
    border: var(--cosmic-border);
  }
  
  /* Achievements Section Styles */
  .achievements-section {
    margin-bottom: 50px;
  }
  
  .achievements-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  
  .achievement-card {
    position: relative;
    display: flex;
    flex-direction: column;
    background-color: rgba(15, 8, 38, 0.6);
    border-radius: 15px;
    padding: 20px;
    box-shadow: var(--cosmic-shadow);
    border: var(--cosmic-border);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    overflow: hidden;
  }
  
  .achievement-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  }
  
  .achievement-icon {
    font-size: 2rem;
    margin-bottom: 15px;
    color: var(--secondary-color);
  }
  
  .achievement-info {
    flex-grow: 1;
  }
  
  .achievement-name {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--text-light);
  }
  
  .achievement-description {
    font-size: 0.9rem;
    color: rgba(249, 247, 255, 0.8);
    line-height: 1.6;
    margin-bottom: 15px;
  }
  
  .achievement-progress {
    margin-top: 10px;
  }
  
  .progress-track {
    height: 6px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 5px;
  }
  
  .progress-fill {
    height: 100%;
    background: var(--cosmic-gradient);
    border-radius: 3px;
    transition: width 1s ease;
  }
  
  .progress-text {
    font-size: 0.8rem;
    color: var(--accent-color);
    text-align: right;
  }
  
  .achievement-lock {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 30px;
    height: 30px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .achievement-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at top right, rgba(255, 123, 84, 0.2) 0%, transparent 70%);
    pointer-events: none;
    z-index: -1;
  }
  
  .locked {
    filter: grayscale(0.8);
  }
  
  .empty-achievements {
    text-align: center;
    padding: 40px 20px;
    background-color: rgba(15, 8, 38, 0.4);
    border-radius: 15px;
    border: 1px dashed rgba(157, 78, 221, 0.3);
  }
  
  .empty-achievements .achievement-icon {
    font-size: 3rem;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  .empty-achievements .achievement-text {
    font-size: 1.1rem;
    color: rgba(249, 247, 255, 0.7);
  }
  
  /* Friends Section Styles */
  .friends-section {
    margin-bottom: 50px;
  }
  
  .portal-container {
    position: relative;
    padding: 20px;
  }
  
  .portal-frame {
    position: relative;
    background-color: rgba(15, 8, 38, 0.6);
    border-radius: 20px;
    padding: 30px;
    box-shadow: var(--cosmic-shadow);
    border: var(--cosmic-border);
    overflow: hidden;
  }
  
  .portal-energy {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, rgba(157, 78, 221, 0.1) 20%, transparent 70%);
    pointer-events: none;
  }
  
  .friends-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    position: relative;
    z-index: 1;
  }
  
  .friend-card {
    display: flex;
    align-items: center;
    background-color: rgba(10, 5, 20, 0.6);
    border-radius: 15px;
    padding: 15px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
    border: var(--cosmic-border);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .friend-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  }
  
  .friend-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 15px;
    border: 2px solid transparent;
    background: linear-gradient(#0f0826, #0f0826) padding-box, 
                var(--cosmic-gradient) border-box;
  }
  
  .friend-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .friend-info {
    flex-grow: 1;
  }
  
  .friend-name {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 5px;
    color: var(--text-light);
  }
  
  .friend-status {
    font-size: 0.8rem;
    display: flex;
    align-items: center;
  }
  
  .friend-status::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 5px;
  }
  
  .friend-status.online {
    color: #4CAF50;
  }
  
  .friend-status.online::before {
    background-color: #4CAF50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.8);
  }
  
  .friend-status.offline {
    color: #9e9e9e;
  }
  
  .friend-status.offline::before {
    background-color: #9e9e9e;
  }
  
  .empty-friends {
    text-align: center;
    padding: 40px 20px;
  }
  
  .empty-friends .empty-icon {
    font-size: 3rem;
    margin-bottom: 20px;
    color: rgba(157, 78, 221, 0.5);
  }
  
  .empty-friends .empty-text {
    font-size: 1.1rem;
    color: rgba(249, 247, 255, 0.7);
  }
  
  /* Edit Profile Button */
  .edit-profile-container {
    text-align: center;
    margin: 50px 0;
  }
  
  .cosmic-button {
    position: relative;
    padding: 12px 30px;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    border-radius: 30px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    z-index: 1;
  }
  
  .cosmic-button:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  }
  
  .button-text {
    position: relative;
    z-index: 1;
  }
  
  .button-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    z-index: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .cosmic-button:hover .button-glow {
    opacity: 1;
  }
  
  /* Responsive Styles */
  @media (max-width: 992px) {
    .profile-name {
      font-size: 2rem;
    }
    
    .timeline-item {
      justify-content: flex-start;
      padding-right: 0;
      padding-left: 60px;
    }
    
    .timeline-item.right-aligned {
      padding-left: 60px;
    }
    
    .timeline-track {
      left: 30px;
    }
    
    .timeline-dot {
      left: 30px;
    }
    
    .timeline-content {
      width: calc(100% - 40px);
      margin-right: 0;
    }
    
    .timeline-item.right-aligned .timeline-content {
      margin-left: 0;
    }
  }
  
  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .achievements-container {
      grid-template-columns: 1fr;
    }
    
    .friends-grid {
      grid-template-columns: 1fr;
    }
    
    .avatar-container {
      width: 160px;
      height: 160px;
    }
    
    .avatar-circle {
      width: 120px;
      height: 120px;
    }
    
    .avatar-aura {
      width: 120px;
      height: 120px;
    }
    
    .section-title {
      font-size: 1.8rem;
    }
  }
  
    @media (max-width: 576px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .profile-name {
        font-size: 1.8rem;
      }
      
      .profile-tagline {
        font-size: 1rem;
      }
      
      .cosmic-button {
        padding: 10px 25px;
        font-size: 1rem;
      }
    }
  </style>