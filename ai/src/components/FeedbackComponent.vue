<template>
    <div class="feedback-panel" :class="{ 'active': showFeedback }">
      <div class="feedback-header">
        <h3>Was this response helpful?</h3>
        <button @click="closeFeedback" class="close-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      
      <div class="rating-section">
        <div class="rating-stars">
          <button 
            v-for="star in 5" 
            :key="star"
            @click="submitRating(star)"
            :class="['star-btn', selectedRating >= star ? 'selected' : '']"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
        <div class="rating-labels">
          <span>Not helpful</span>
          <span>Very helpful</span>
        </div>
      </div>
      
      <div v-if="selectedRating > 0" class="feedback-comment">
        <textarea 
          v-model="feedbackText"
          placeholder="Any specific feedback? (optional)"
          rows="3"
        ></textarea>
      </div>
      
      <div v-if="selectedRating > 0" class="feedback-actions">
        <button 
          @click="submitFeedback"
          class="submit-btn"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">
            <svg class="loading-spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="4" />
            </svg>
          </span>
          <span v-else>Submit Feedback</span>
        </button>
      </div>
      
      <div v-if="feedbackSubmitted" class="success-message">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>Thank you! Your feedback helps the AI learn and improve.</span>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue';
  import { collectExplicitFeedback } from './feedbackSystem.js';
  
  const props = defineProps({
    conversationId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    lastResponseIndex: {
      type: Number,
      required: true
    },
    messages: {
      type: Array,
      required: true
    }
  });
  
  const showFeedback = ref(false);
  const selectedRating = ref(0);
  const feedbackText = ref('');
  const isSubmitting = ref(false);
  const feedbackSubmitted = ref(false);
  
  onMounted(() => {
    // Show feedback panel after response is fully loaded
    setTimeout(() => {
      showFeedback.value = true;
    }, 1500);
  });
  
  watch(() => props.lastResponseIndex, (newVal) => {
    if (newVal !== -1) {
      // Reset the feedback state for a new response
      selectedRating.value = 0;
      feedbackText.value = '';
      feedbackSubmitted.value = false;
      
      // Show feedback panel again
      setTimeout(() => {
        showFeedback.value = true;
      }, 1500);
    }
  });
  
  const closeFeedback = () => {
    showFeedback.value = false;
  };
  
  const submitRating = (rating) => {
    selectedRating.value = rating;
  };
  
  const submitFeedback = async () => {
    if (selectedRating.value === 0) return;
    
    isSubmitting.value = true;
    
    try {
      // Get the AI message that's being rated
      const aiMessage = props.messages[props.lastResponseIndex];
      
      // Calculate response time (time between user message and this AI response)
      let responseTime = 0;
      if (props.lastResponseIndex > 0) {
        const userMsgIndex = props.lastResponseIndex - 1;
        const userMessage = props.messages[userMsgIndex];
        responseTime = aiMessage.timestamp - userMessage.timestamp;
      }
      
      // Submit explicit feedback
      await collectExplicitFeedback(
        props.conversationId,
        selectedRating.value,
        feedbackText.value,
        props.userId,
        [], // Knowledge IDs used (would come from recursive thinking)
        responseTime
      );
      
      feedbackSubmitted.value = true;
      
      // Auto-close after showing success message
      setTimeout(() => {
        showFeedback.value = false;
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Something went wrong submitting your feedback. Please try again.');
    } finally {
      isSubmitting.value = false;
    }
  };
  </script>
  
  <style scoped>
  .feedback-panel {
    background-color: var(--card-bg, #f8f9fa);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    margin: 16px 0;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease-out;
  }
  
  .feedback-panel.active {
    max-height: 300px;
    opacity: 1;
    transform: translateY(0);
    padding: 16px;
  }
  
  .feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .feedback-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #1e293b);
  }
  
  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary, #64748b);
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-button:hover {
    background-color: var(--hover-bg, #e2e8f0);
  }
  
  .rating-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .rating-stars {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .star-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--star-inactive, #cbd5e0);
    padding: 0;
    transition: transform 0.2s, color 0.2s;
  }
  
  .star-btn:hover {
    transform: scale(1.1);
  }
  
  .star-btn.selected {
    color: var(--star-active, #f59e0b);
  }
  
  .rating-labels {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 12px;
    color: var(--text-secondary, #64748b);
  }
  
  .feedback-comment {
    margin-bottom: 16px;
  }
  
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    transition: border-color 0.2s;
  }
  
  textarea:focus {
    outline: none;
    border-color: var(--primary-color, #3b82f6);
  }
  
  .feedback-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .submit-btn {
    background-color: var(--primary-color, #3b82f6);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 40px;
    min-width: 120px;
  }
  
  .submit-btn:hover {
    background-color: var(--primary-dark, #2563eb);
  }
  
  .submit-btn:disabled {
    background-color: var(--disabled-color, #94a3b8);
    cursor: not-allowed;
  }
  
  .loading-spinner {
    width: 20px;
    height: 20px;
    animation: spin 1.5s linear infinite;
    stroke-dasharray: 60;
    stroke-dashoffset: 50;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .success-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background-color: var(--success-bg, #dcfce7);
    border-radius: 6px;
    color: var(--success-text, #166534);
    font-size: 14px;
    margin-top: 16px;
  }
  
  .success-message svg {
    color: var(--success-icon, #16a34a);
    flex-shrink: 0;
  }
  </style>