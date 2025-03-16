<template>
  <div class="landing-container" ref="landingContainer">
    <!-- 3D Cosmic Background -->
    <canvas ref="cosmicCanvas" class="cosmic-canvas"></canvas>
    
    <!-- Floating Meteors -->
    <div class="meteors-container">
      <div v-for="n in 5" :key="`meteor-${n}`" 
          class="meteor"
          :style="{
             '--delay': `${n * 3}s`,
             '--duration': `${Math.random() * 3 + 4}s`,
             '--top': `${Math.random() * 30}%`,
             '--left': `${Math.random() * 100}%`
          }"
      ></div>
    </div>
    
    <!-- Hero Section with Parallax -->
    <section class="hero-section" ref="heroSection">
      <div class="cosmic-overlay" ref="cosmicOverlay"></div>
      
      <div class="hero-content" ref="heroContent">
        <h1 class="hero-title" ref="heroTitle">
          <span class="title-dawn">Dawn</span><span class="title-tasy">tasy</span>
          <span class="title-ai">AI</span>
        </h1>
        
        <p class="hero-subtitle" ref="heroSubtitle"></p>
        
        <div class="hero-cta" ref="heroCta">
          <router-link to="/register" class="cta-button register">
            <span class="button-text">Begin Journey</span>
            <span class="button-icon">→</span>
            <div class="button-glow"></div>
          </router-link>
          
          <router-link to="/login" class="cta-button login">
            <span class="button-text">Resume Journey</span>
            <div class="button-border"></div>
          </router-link>
        </div>
      </div>
      
      <!-- Floating Elements -->
      <div class="floating-elements">
        <div class="clock-element" ref="clockElement">
          <div class="clock-face"></div>
          <div class="clock-hand hour-hand"></div>
          <div class="clock-hand minute-hand"></div>
          <div class="clock-glow"></div>
        </div>
        
        <div class="rift-portal" ref="riftPortal">
          <div class="portal-core"></div>
          <div class="portal-ring"></div>
          <div class="portal-particles">
            <div v-for="n in 5" :key="`portal-particle-${n}`" class="portal-particle"></div>
          </div>
        </div>
        
        <div class="cosmic-rune" ref="cosmicRune"></div>
      </div>
    </section>
    
    <!-- Features Section with Scroll-Driven Animations -->
    <section class="features-section" ref="featuresSection">
      <h2 class="section-title" ref="featuresTitle">Explore The Cosmic Features</h2>
      
      <div class="features-grid" ref="featuresGrid">
        <!-- Feature Card 1 -->
        <div class="feature-card" 
            ref="featureCard1"
            @mouseenter="animateFeature"
            @mouseleave="resetFeature"
        >
          <div class="feature-glow"></div>
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <h3 class="feature-title">The ARCHMAGE Tool</h3>
          <p class="feature-description">
            Experience multifaceted analysis that unlocks new dimensions of understanding, 
            just as Time Smith understood The Rift's true nature.
          </p>
        </div>
        
        <!-- Feature Card 2 -->
        <div class="feature-card" 
            ref="featureCard2"
            @mouseenter="animateFeature"
            @mouseleave="resetFeature"
        >
          <div class="feature-glow"></div>
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"></path>
            </svg>
          </div>
          <h3 class="feature-title">Memory Code</h3>
          <p class="feature-description">
            Your AI companion remembers every interaction, creating a 
            continuous narrative woven through time.
          </p>
        </div>
        
        <!-- Feature Card 3 -->
        <div class="feature-card" 
            ref="featureCard3"
            @mouseenter="animateFeature"
            @mouseleave="resetFeature"
        >
          <div class="feature-glow"></div>
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <h3 class="feature-title">Dawntasy Database</h3>
          <p class="feature-description">
            Access the complete lore of the Dawntasy universe, from Bear Village 
            to the secrets of The Rift.
          </p>
        </div>
      </div>
    </section>
    
    <!-- Call to Action Section -->
    <section class="cta-section" ref="ctaSection">
      <div class="cosmic-particles">
        <div v-for="n in 20" :key="`cta-particle-${n}`" class="cosmic-particle"></div>
      </div>
      
      <div class="cta-content" ref="ctaContent">
        <h2 class="cta-title">Begin Your Dawntasy Journey</h2>
        <p class="cta-description">
          The Plain and Pale Clock is ticking. Will you discover the truth behind The Rift?
        </p>
        <router-link to="/register" class="cta-button-large">
          <span class="button-text">Enter The Rift</span>
          <div class="button-pulse"></div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue/dist/vue.esm-bundler';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Typed from 'typed.js';
import * as THREE from 'three';
import anime from 'animejs';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Refs
const landingContainer = ref<HTMLElement | null>(null);
const cosmicCanvas = ref<HTMLCanvasElement | null>(null);
const heroSection = ref<HTMLElement | null>(null);
const heroContent = ref<HTMLElement | null>(null);
const heroTitle = ref<HTMLElement | null>(null);
const heroSubtitle = ref<HTMLElement | null>(null);
const heroCta = ref<HTMLElement | null>(null);
const cosmicOverlay = ref<HTMLElement | null>(null);
const clockElement = ref<HTMLElement | null>(null);
const riftPortal = ref<HTMLElement | null>(null);
const cosmicRune = ref<HTMLElement | null>(null);
const featuresSection = ref<HTMLElement | null>(null);
const featuresTitle = ref<HTMLElement | null>(null);
const featuresGrid = ref<HTMLElement | null>(null);
const featureCard1 = ref<HTMLElement | null>(null);
const featureCard2 = ref<HTMLElement | null>(null);
const featureCard3 = ref<HTMLElement | null>(null);
const ctaSection = ref<HTMLElement | null>(null);
const ctaContent = ref<HTMLElement | null>(null);

// Three.js objects
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let starField: THREE.Points;
let nebulaMaterial: THREE.ShaderMaterial;
let animationFrameId: number;

// Typed.js instance
let typed: Typed;

// Methods
const animateFeature = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  const glow = target.querySelector('.feature-glow') as HTMLElement;
  const icon = target.querySelector('.feature-icon') as HTMLElement;
  
  // Card glow effect
  gsap.to(glow, {
    opacity: 0.8,
    scale: 1.1,
    duration: 0.4
  });
  
  // Card scale effect
  gsap.to(target, {
    y: -10,
    scale: 1.03,
    boxShadow: '0 20px 25px -5px rgba(97, 61, 244, 0.25)',
    duration: 0.4,
    ease: 'power2.out'
  });
  
  // Icon animation
  anime({
    targets: icon,
    scale: 1.2,
    rotate: [0, 15, 0, -15, 0],
    duration: 1000,
    easing: 'easeInOutQuad'
  });
  
  // SVG animation
  const svg = icon.querySelector('svg');
  if (svg) {
    anime({
      targets: svg,
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 1000,
      easing: 'easeInOutSine'
    });
  }
};

const resetFeature = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  const glow = target.querySelector('.feature-glow') as HTMLElement;
  
  gsap.to(glow, {
    opacity: 0,
    scale: 1,
    duration: 0.4
  });
  
  gsap.to(target, {
    y: 0,
    scale: 1,
    boxShadow: '0 10px 15px -3px rgba(97, 61, 244, 0.15)',
    duration: 0.4,
    ease: 'power2.out'
  });
};

// Initialize 3D cosmic background
const initCosmicBackground = () => {
  if (!cosmicCanvas.value) return;
  
  // Create scene
  scene = new THREE.Scene();
  
  // Create camera with perspective
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 300;
  camera.position.y = 0;
  camera.lookAt(0, 0, 0);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({
    canvas: cosmicCanvas.value,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Create star field
  const starGeometry = new THREE.BufferGeometry();
  const starVerticies = [];
  const starSizes = [];
  const starColors = [];
  
  // Generate 2000 stars with varied sizes and colors
  for (let i = 0; i < 2000; i++) {
    // Position stars in a sphere
    const radius = 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    starVerticies.push(x, y, z);
    
    // Random star size
    const size = Math.random() * 2 + 0.5;
    starSizes.push(size);
    
    // Star colors - blues, purples and whites
    const r = Math.random() * 0.5 + 0.5; // 0.5-1.0
    const g = Math.random() * 0.5 + 0.5; // 0.5-1.0
    const b = Math.random() * 0.3 + 0.7; // 0.7-1.0
    
    starColors.push(r, g, b);
  }
  
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVerticies, 3));
  starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
  
  // Custom shader material for stars with glow effect
  const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        vColor = color;
        
        // Add subtle movement
        vec3 pos = position;
        pos.x += sin(time * 0.1 + position.z * 0.01) * 2.0;
        pos.y += cos(time * 0.1 + position.x * 0.01) * 2.0;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / length(mvPosition.xyz));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        // Create circular point with soft edge
        float r = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (r > 0.5) discard;
        
        // Glow effect
        float glow = 0.5 - r;
        
        gl_FragColor = vec4(vColor, glow * 2.0);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true
  });
  
  starField = new THREE.Points(starGeometry, starMaterial);
  scene.add(starField);
  
  // Add nebula effect (volume rendering)
  const nebulaGeometry = new THREE.SphereGeometry(400, 32, 32);
  
  nebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      varying vec3 vPosition;
      
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPosition;
      uniform float time;
      
      // Noise functions from https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
      float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
      vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
      
      float noise(vec3 p){
        vec3 a = floor(p);
        vec3 d = p - a;
        d = d * d * (3.0 - 2.0 * d);
        
        vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
        vec4 k1 = perm(b.xyxy);
        vec4 k2 = perm(k1.xyxy + b.zzww);
        
        vec4 c = k2 + a.zzzz;
        vec4 k3 = perm(c);
        vec4 k4 = perm(c + 1.0);
        
        vec4 o1 = fract(k3 * (1.0 / 41.0));
        vec4 o2 = fract(k4 * (1.0 / 41.0));
        
        vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
        vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
        
        return o4.y * d.y + o4.x * (1.0 - d.y);
      }
      
      void main() {
        // Define nebula colors - cosmic purples and blues
        vec3 color1 = vec3(0.3, 0.0, 0.5); // Deep purple
        vec3 color2 = vec3(0.2, 0.4, 0.8); // Cosmic blue
        
        // Get noise value based on position and time
        float n = noise(vPosition * 0.01 + time * 0.01);
        
        // Add second layer of noise for complexity
        float n2 = noise(vPosition * 0.02 - time * 0.02);
        
        // Combine noise layers
        float finalNoise = n * 0.6 + n2 * 0.4;
        
        // Calculate opacity based on noise (only show higher values)
        float opacity = smoothstep(0.6, 0.8, finalNoise) * 0.2;
        
        // Mix colors based on noise
        vec3 color = mix(color1, color2, finalNoise);
        
        // Set the final color with opacity
        gl_FragColor = vec4(color, opacity);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    side: THREE.BackSide // Render inside of sphere
  });
  
  const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
  scene.add(nebula);
  
  // Resize handler
  const resizeHandler = () => {
    if (!renderer) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
  };
  
  window.addEventListener('resize', resizeHandler);
  
  // Animation loop
  let time = 0;
  
  const animate = () => {
    time += 0.005;
    animationFrameId = requestAnimationFrame(animate);
    
    // Update uniforms
    if (starField.material instanceof THREE.ShaderMaterial) {
      starField.material.uniforms.time.value = time;
    }
    
    if (nebulaMaterial) {
      nebulaMaterial.uniforms.time.value = time;
    }
    
    // Rotate star field slowly
    starField.rotation.y += 0.0002;
    starField.rotation.x += 0.0001;
    
    // Camera subtle movement
    camera.position.x = Math.sin(time * 0.1) * 10;
    camera.position.y = Math.cos(time * 0.1) * 10;
    camera.lookAt(0, 0, 0);
    
    // Render scene
    renderer.render(scene, camera);
  };
  
  animate();
};

// Initialize parallax effects
const initParallaxEffects = () => {
  document.addEventListener('mousemove', (e) => {
    if (!landingContainer.value) return;
    
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    
    // Parallax for hero content
    if (heroContent.value) {
      gsap.to(heroContent.value, {
        x: mouseX * -30,
        y: mouseY * -30,
        duration: 1,
        ease: 'power2.out'
      });
    }
    
    // Parallax for clock element
    if (clockElement.value) {
      gsap.to(clockElement.value, {
        x: mouseX * 50,
        y: mouseY * 50,
        duration: 1.5,
        ease: 'power2.out'
      });
    }
    
    // Parallax for rift portal
    if (riftPortal.value) {
      gsap.to(riftPortal.value, {
        x: mouseX * -60,
        y: mouseY * -60,
        duration: 1.8,
        ease: 'power2.out'
      });
    }
    
    // Parallax for cosmic rune
    if (cosmicRune.value) {
      gsap.to(cosmicRune.value, {
        x: mouseX * 40,
        y: mouseY * 40,
        duration: 1.2,
        ease: 'power2.out'
      });
    }
  });
};

// Initialize scroll-driven animations
const initScrollAnimations = () => {
  // Hero section fade effect on scroll
  if (heroSection.value && cosmicOverlay.value) {
    ScrollTrigger.create({
      trigger: heroSection.value,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        // Increase overlay opacity as we scroll down
        gsap.to(cosmicOverlay.value, {
          opacity: self.progress * 0.7,
          duration: 0.1
        });
        
        // Move hero content up as we scroll
        gsap.to(heroContent.value, {
          y: self.progress * -100,
          opacity: 1 - self.progress,
          duration: 0.1
        });
      }
    });
  }
  
  // Features section entrance animation
  if (featuresSection.value) {
    ScrollTrigger.create({
      trigger: featuresSection.value,
      start: 'top 80%',
      onEnter: () => {
        // Animate title
        gsap.fromTo(
          featuresTitle.value,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
        );
        
        // Animate feature cards with stagger
        const cards = [featureCard1.value, featureCard2.value, featureCard3.value];
        gsap.fromTo(
          cards,
          { y: 70, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.8, 
            stagger: 0.15, 
            ease: 'back.out(1.4)',
            delay: 0.3
          }
        );
      }
    });
  }
  
  // CTA section entrance with cosmic particles
  if (ctaSection.value) {
    ScrollTrigger.create({
      trigger: ctaSection.value,
      start: 'top 70%',
      onEnter: () => {
        // Animate content
        gsap.fromTo(
          ctaContent.value,
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.7)' }
        );
        
        // Animate particles
        anime({
          targets: '.cosmic-particle',
          translateX: () => anime.random(-100, 100),
          translateY: () => anime.random(-100, 100),
          scale: () => anime.random(0.5, 2),
          opacity: [0, 0.4, 0],
          easing: 'easeOutExpo',
          duration: () => anime.random(1000, 3000),
          delay: anime.stagger(100),
          complete: (anim) => {
            // Loop the animation
            anim.restart();
          }
        });
      }
    });
  }
};

// Initialize hero animations
const initHeroAnimations = () => {
  // Animate hero title entrance
  if (heroTitle.value) {
    gsap.fromTo(
      heroTitle.value,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
    );
    
    // Add continuous glow animation to AI part
    const aiPart = heroTitle.value.querySelector('.title-ai');
    if (aiPart) {
      gsap.to(aiPart, {
        textShadow: '0 0 20px rgba(255, 58, 112, 0.8), 0 0 30px rgba(255, 58, 112, 0.5)',
        repeat: -1,
        yoyo: true,
        duration: 2
      });
    }
  }
  
  // Typed.js for subtitle
  if (heroSubtitle.value) {
    typed = new Typed(heroSubtitle.value, {
      strings: [
        'Your gateway to the Dawntasy universe',
        'Consult The Rift for cosmic insights',
        'Explore the secrets of Time\'s True Name',
        'Chat with an AI that understands reality\'s fabric'
      ],
      typeSpeed: 40,
      backSpeed: 20,
      backDelay: 1800,
      startDelay: 1000,
      loop: true,
      smartBackspace: true
    });
  }
  
  // Animate CTA buttons
  if (heroCta.value) {
    gsap.fromTo(
      heroCta.value.querySelectorAll('.cta-button'),
      { y: 30, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 0.8, 
        stagger: 0.2, 
        delay: 0.8,
        ease: 'back.out(1.7)'
      }
    );
  }
  
  // Animate register button glow
  const registerBtn = document.querySelector('.cta-button.register .button-glow') as HTMLElement;
  if (registerBtn) {
    gsap.to(registerBtn, {
      opacity: 0.7,
      scale: 1.2,
      repeat: -1,
      yoyo: true,
      duration: 1.5
    });
  }
  
  // Animate login button border
  const loginBorder = document.querySelector('.cta-button.login .button-border') as HTMLElement;
  if (loginBorder) {
    gsap.to(loginBorder, {
      backgroundPosition: '200% 0',
      duration: 3,
      repeat: -1,
      ease: 'linear'
    });
  }
  
  // Animate floating elements
  if (clockElement.value) {
    // Clock face rotation
    gsap.to(clockElement.value.querySelector('.clock-face'), {
      rotation: 360,
      repeat: -1,
      duration: 60,
      ease: 'linear'
    });
    
    // Hour hand rotation
    gsap.to(clockElement.value.querySelector('.hour-hand'), {
      rotation: 360,
      repeat: -1,
      duration: 60 * 12, // 12 hours
      ease: 'linear'
    });
    
    // Minute hand rotation
    gsap.to(clockElement.value.querySelector('.minute-hand'), {
      rotation: 360,
      repeat: -1,
      duration: 60, // 60 minutes
      ease: 'linear'
    });
    
    // Clock float animation
    gsap.to(clockElement.value, {
      y: -20,
      repeat: -1,
      yoyo: true,
      duration: 4,
      ease: 'power1.inOut'
    });
    
    // Clock glow
    gsap.to(clockElement.value.querySelector('.clock-glow'), {
      opacity: 0.8,
      scale: 1.2,
      repeat: -1,
      yoyo: true,
      duration: 2,
      ease: 'sine.inOut'
    });
  }
  
  if (riftPortal.value) {
    // Portal core pulse
    gsap.to(riftPortal.value.querySelector('.portal-core'), {
      scale: 1.3,
      opacity: 0.8,
      repeat: -1,
      yoyo: true,
      duration: 2,
      ease: 'sine.inOut'
    });
    
    // Portal ring rotation
    gsap.to(riftPortal.value.querySelector('.portal-ring'), {
      rotation: 360,
      repeat: -1,
      duration: 20,
      ease: 'linear'
    });
    
    // Portal float animation
    gsap.to(riftPortal.value, {
      y: 15,
      repeat: -1,
      yoyo: true,
      duration: 5,
      ease: 'power1.inOut'
    });
    
    // Portal particles
    anime({
      targets: '.portal-particle',
      translateX: () => anime.random(-50, 50),
      translateY: () => anime.random(-50, 50),
      scale: [0, 1, 0],
      opacity: [0, 0.7, 0],
      easing: 'easeInOutQuad',
      duration: () => anime.random(1000, 3000),
      delay: anime.stagger(300),
      loop: true
    });
  }
  
  if (cosmicRune.value) {
    // Rune rotation
    gsap.to(cosmicRune.value, {
      rotation: 360,
      repeat: -1,
      duration: 30,
      ease: 'linear'
    });
    
    // Rune float animation
    gsap.to(cosmicRune.value, {
      y: -10,
      repeat: -1,
      yoyo: true,
      duration: 3,
      ease: 'sine.inOut'
    });
  }
};

// Handle window resize
const handleResize = () => {
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
};

// Lifecycle hooks
onMounted(async () => {
  await nextTick();
  
  // Initialize 3D cosmic background
  initCosmicBackground();
  
  // Initialize hero animations
  initHeroAnimations();
  
  // Initialize parallax effects
  initParallaxEffects();
  
  // Initialize scroll animations
  initScrollAnimations();
  
  // Add resize handler
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  // Cleanup Typed.js
  if (typed) {
    typed.destroy();
  }
  
  // Cleanup Three.js
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  if (renderer) {
    renderer.dispose();
  }
  
// Remove resize handler
  window.removeEventListener('resize', handleResize);
});
</script>