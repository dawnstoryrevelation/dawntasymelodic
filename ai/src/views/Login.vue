<template>
  <div class="login-container">
    <!-- Cosmic background with animated particles -->
    <div class="cosmic-particles">
      <div v-for="n in 50" :key="`particle-${n}`" 
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
    
    <!-- Galaxy effect -->
    <div class="cosmic-galaxy"></div>
    
    <div class="login-content">
      <!-- Login card (similar to Claude's clean auth UI) -->
      <div class="login-card">
        <!-- Logo and title -->
        <div class="login-header">
          <div class="login-logo">
            <div class="logo-core"></div>
            <div class="logo-orbit"></div>
          </div>
          <h1 class="login-title">Welcome to DawntasyAI</h1>
          <p class="login-subtitle">Sign in to continue your cosmic journey</p>
        </div>
        
        <!-- Login form -->
        <form @submit.prevent="login" class="login-form">
          <!-- Email input -->
          <div class="form-group" :class="{ 'error': errors.email }">
            <label for="email" class="form-label">Email</label>
            <div class="input-wrapper">
              <input 
                id="email" 
                v-model="credentials.email" 
                type="email" 
                class="form-input"
                placeholder="your@email.com"
                required
                @input="clearError('email')"
              />
              <div class="input-icon">
                <i class="ri-mail-line"></i>
              </div>
            </div>
            <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
          </div>
          
          <!-- Password input -->
          <div class="form-group" :class="{ 'error': errors.password }">
            <label for="password" class="form-label">Password</label>
            <div class="input-wrapper">
              <input 
                id="password" 
                v-model="credentials.password" 
                :type="showPassword ? 'text' : 'password'" 
                class="form-input"
                placeholder="••••••••••"
                required
                @input="clearError('password')"
              />
              <button 
                type="button"
                class="input-icon clickable"
                @click="togglePassword"
              >
                <i :class="showPassword ? 'ri-eye-line' : 'ri-eye-off-line'"></i>
              </button>
            </div>
            <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
          </div>
          
          <!-- Remember me & forgot password -->
          <div class="form-options">
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                v-model="rememberMe"
              />
              <span class="checkmark"></span>
              <span>Remember me</span>
            </label>
            
            <button 
              type="button" 
              class="forgot-password-link"
              @click="forgotPassword"
            >
              Forgot password?
            </button>
          </div>
          
          <!-- Login error message -->
          <div v-if="loginError" class="login-error">
            <i class="ri-error-warning-line error-icon"></i>
            <span>{{ loginError }}</span>
          </div>
          
          <!-- Submit button -->
          <button 
            type="submit" 
            class="login-button"
            :disabled="isLoading"
          >
            <span v-if="!isLoading">Sign In</span>
            <div v-else class="button-loader"></div>
          </button>
          
          <!-- Register link -->
          <div class="register-link">
            Don't have an account? 
            <router-link to="/register">Create account</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

// Store references
const authStore = useAuthStore();
const router = useRouter();

// Form state
const credentials = reactive({
  email: '',
  password: ''
});

const errors = reactive({
  email: '',
  password: ''
});

const rememberMe = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);
const loginError = ref('');

// Methods
function togglePassword() {
  showPassword.value = !showPassword.value;
}

function clearError(field) {
  errors[field] = '';
  loginError.value = '';
}

async function login() {
  // Reset errors
  errors.email = '';
  errors.password = '';
  loginError.value = '';
  
  // Validate form
  let isValid = true;
  
  if (!credentials.email) {
    errors.email = 'Email is required';
    isValid = false;
  } else if (!/^\S+@\S+\.\S+$/.test(credentials.email)) {
    errors.email = 'Please enter a valid email';
    isValid = false;
  }
  
  if (!credentials.password) {
    errors.password = 'Password is required';
    isValid = false;
  }
  
  if (!isValid) return;
  
  // Submit form
  isLoading.value = true;
  
  try {
    const result = await authStore.loginUser(
      credentials.email, 
      credentials.password,
      rememberMe.value
    );
    
    if (result.success) {
      router.push('/');
    } else {
      loginError.value = result.error || 'Failed to sign in. Please check your credentials.';
    }
  } catch (error) {
    console.error('Login error:', error);
    loginError.value = 'An unexpected error occurred. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

function forgotPassword() {
  if (!credentials.email) {
    errors.email = 'Please enter your email to reset password';
    return;
  }
  
  authStore.resetPassword(credentials.email)
    .then(result => {
      if (result.success) {
        loginError.value = '';
        alert('Password reset instructions have been sent to your email.');
      } else {
        loginError.value = result.error || 'Failed to send reset email. Please try again.';
      }
    })
    .catch(error => {
      console.error('Password reset error:', error);
      loginError.value = 'An unexpected error occurred. Please try again.';
    });
}
</script>

<style scoped>

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%);
  position: relative;
  overflow: hidden;
}

/* Cosmic particles background */
.cosmic-particles {
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

/* Galaxy effect */
.cosmic-galaxy {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  opacity: 0.6;
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
  animation: galaxy-pulse 15s infinite alternate ease-in-out;
}

@keyframes galaxy-pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.4;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.7;
  }
}

/* Login content */
.login-content {
  max-height:100vh;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 450px;
  padding: 2rem;
}

/* Login card */
.login-card {
  max-height:100vh;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* Login header */
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
}

.logo-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: #8b5cf6;
  border-radius: 50%;
  box-shadow: 0 0 20px #8b5cf6;
  animation: core-pulse 4s infinite ease-in-out;
}

.logo-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border: 2px solid #8b5cf6;
  border-radius: 50%;
  animation: orbit-rotate 10s infinite linear;
}

.logo-orbit::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: #4cc9f0;
  border-radius: 50%;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 10px #4cc9f0;
}

@keyframes core-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

@keyframes orbit-rotate {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: white;
  background: linear-gradient(to right, #fff, #8b5cf6, #fff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}

.login-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
}

/* Login form */
.login-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
  background: rgba(15, 23, 42, 0.7);
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.125rem;
}

.input-icon.clickable {
  left: auto;
  right: 0.75rem;
  cursor: pointer;
}

.error-message {
  margin-top: 0.5rem;
  color: #f87171;
  font-size: 0.875rem;
}

.form-group.error .form-input {
  border-color: #f87171;
  box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.3);
}

/* Form options */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

/* Custom checkbox */
.checkbox-container {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 28px;
  cursor: pointer;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.checkbox-container:hover input ~ .checkmark {
  background-color: rgba(15, 23, 42, 0.7);
  border-color: rgba(255, 255, 255, 0.3);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #8b5cf6;
  border-color: #8b5cf6;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Forgot password link */
.forgot-password-link {
  background: none;
  border: none;
  color: #8b5cf6;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.forgot-password-link:hover {
  color: #a78bfa;
  text-decoration: underline;
}

/* Login error */
.login-error {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(248, 113, 113, 0.1);
  border-left: 3px solid #f87171;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  color: #f87171;
  font-size: 0.875rem;
}

.error-icon {
  margin-right: 0.5rem;
  font-size: 1.125rem;
}

/* Login button */
.login-button {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  margin-bottom: 1.5rem;
}

.login-button:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-loader {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Register link */
.register-link {
  text-align: center;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.register-link a {
  color: #8b5cf6;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.register-link a:hover {
  color: #a78bfa;
  text-decoration: underline;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .login-card {
    padding: 2rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
  
  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>