<template>
    <div class="reasoning-component">
      <!-- Reasoning Toggle Button -->
      <div class="toggle-container">
        <label class="toggle">
          <input 
            type="checkbox" 
            v-model="isReasoningEnabled"
            @change="toggleReasoning"
          >
          <span class="slider"></span>
          <span class="toggle-label">AI Reasoning</span>
        </label>
        <div v-if="isReasoningEnabled" class="tooltip">
          <i class="fas fa-info-circle"></i>
          <div class="tooltip-text">
            AI will show its reasoning process for each response.
          </div>
        </div>
      </div>
      
      <!-- Reasoning Display (for current message) -->
      <div v-if="isReasoningEnabled && reasoning" class="reasoning-display">
        <div class="reasoning-header">
          <div class="thinking-indicator">
            <div class="brain-icon">
              <i class="fas fa-brain"></i>
            </div>
            <h3>AI Reasoning Process</h3>
          </div>
          <button @click="toggleExpanded" class="expand-button">
            <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          </button>
        </div>
        
        <div v-if="isExpanded" class="reasoning-content">
          <div v-if="loadingReasoning" class="reasoning-loading">
            <div class="thinking-steps">
              <div v-for="(step, index) in thinkingSteps" :key="index" class="thinking-step">
                <div class="dot-container">
                  <div class="dot"></div>
                </div>
                <div class="step-text">{{ step }}</div>
              </div>
            </div>
          </div>
          <div v-else class="reasoning-text">
            {{ reasoning }}
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ReasoningComponent',
    
    props: {
      // Reasoning text from parent component
      value: {
        type: String,
        default: ''
      },
      // Initial state of reasoning toggle
      initialEnabled: {
        type: Boolean,
        default: true
      }
    },
    
    data() {
      return {
        isReasoningEnabled: this.initialEnabled,
        isExpanded: true,
        loadingReasoning: false,
        reasoning: '',
        thinkingStepsInterval: null,
        thinkingSteps: [],
        thinkingStepOptions: [
          "Analyzing context...",
          "Identifying key concepts...",
          "Searching knowledge base...",
          "Evaluating alternatives...",
          "Connecting related information...",
          "Examining reasoning patterns...",
          "Structuring response...",
          "Validating conclusions...",
          "Reviewing approach...",
          "Processing implications...",
          "Considering perspectives...",
          "Checking consistency...",
          "Integrating information...",
          "Formulating explanation..."
        ]
      };
    },
    
    watch: {
      value: {
        immediate: true,
        handler(newVal) {
          if (newVal && this.isReasoningEnabled) {
            this.simulateReasoningProcess(newVal);
          } else {
            this.reasoning = newVal;
          }
        }
      }
    },
    
    methods: {
      toggleReasoning() {
        this.$emit('toggle-reasoning', this.isReasoningEnabled);
        
        if (!this.isReasoningEnabled) {
          this.stopThinkingAnimation();
        } else if (this.value) {
          this.simulateReasoningProcess(this.value);
        }
      },
      
      toggleExpanded() {
        this.isExpanded = !this.isExpanded;
      },
      
      simulateReasoningProcess(reasoningText) {
        // Reset state
        this.loadingReasoning = true;
        this.reasoning = '';
        this.thinkingSteps = [];
        this.stopThinkingAnimation();
        
        // Start thinking steps animation
        this.startThinkingAnimation();
        
        // Simulate loading time based on text length (for demo purposes)
        const loadingTime = Math.min(Math.max(reasoningText.length * 5, 1000), 3000);
        
        setTimeout(() => {
          this.loadingReasoning = false;
          this.reasoning = reasoningText;
          this.stopThinkingAnimation();
        }, loadingTime);
      },
      
      startThinkingAnimation() {
        // Initialize with 3 random steps
        this.thinkingSteps = this.getRandomThinkingSteps(3);
        
        // Update thinking steps periodically
        this.thinkingStepsInterval = setInterval(() => {
          // Add a new step if fewer than 6
          if (this.thinkingSteps.length < 6) {
            const newStep = this.getRandomThinkingStep();
            this.thinkingSteps.push(newStep);
          }
          // Otherwise, replace a random step
          else {
            const indexToReplace = Math.floor(Math.random() * this.thinkingSteps.length);
            this.thinkingSteps[indexToReplace] = this.getRandomThinkingStep();
          }
        }, 1200);
      },
      
      stopThinkingAnimation() {
        if (this.thinkingStepsInterval) {
          clearInterval(this.thinkingStepsInterval);
          this.thinkingStepsInterval = null;
        }
      },
      
      getRandomThinkingStep() {
        return this.thinkingStepOptions[Math.floor(Math.random() * this.thinkingStepOptions.length)];
      },
      
      getRandomThinkingSteps(count) {
        const steps = [];
        const options = [...this.thinkingStepOptions];
        
        for (let i = 0; i < count; i++) {
          if (options.length === 0) break;
          
          const randomIndex = Math.floor(Math.random() * options.length);
          steps.push(options[randomIndex]);
          options.splice(randomIndex, 1);
        }
        
        return steps;
      }
    },
    
    beforeDestroy() {
      this.stopThinkingAnimation();
    }
  };
  </script>
  
  <style scoped>
  .reasoning-component {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
  }
  
  /* Toggle Switch Styling */
  .toggle-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .toggle {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
    margin-right: 8px;
  }
  
  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .slider {
    background-color: #4682b4; /* Cerulean */
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
  
  .toggle-label {
    font-size: 0.9rem;
    color: #f0f0f0;
    white-space: nowrap;
  }
  
  /* Tooltip Styling */
  .tooltip {
    position: relative;
    display: inline-block;
    color: #a0a0a0;
    cursor: help;
  }
  
  .tooltip .tooltip-text {
    visibility: hidden;
    width: 200px;
    background-color: #2c2c2c;
    color: #f0f0f0;
    text-align: center;
    border-radius: 6px;
    padding: 8px;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 0.8rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
  
  .tooltip .tooltip-text::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #2c2c2c transparent transparent transparent;
  }
  
  .tooltip:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }
  
  /* Reasoning Display Styling */
  .reasoning-display {
    background-color: rgba(70, 130, 180, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(70, 130, 180, 0.2);
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .reasoning-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: rgba(70, 130, 180, 0.2);
  }
  
  .thinking-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .brain-icon {
    color: #4682b4; /* Cerulean */
    font-size: 1.1rem;
  }
  
  .reasoning-header h3 {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #f0f0f0;
  }
  
  .expand-button {
    background: none;
    border: none;
    color: #a0a0a0;
    cursor: pointer;
    padding: 5px;
    transition: all 0.2s ease;
  }
  
  .expand-button:hover {
    color: #f0f0f0;
  }
  
  .reasoning-content {
    padding: 15px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  /* Loading Animation */
  .reasoning-loading {
    min-height: 80px;
  }
  
  .thinking-steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .thinking-step {
    display: flex;
    align-items: center;
    gap: 10px;
    animation: fadeIn 0.5s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .dot-container {
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    background-color: #4682b4; /* Cerulean */
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  
  .step-text {
    font-size: 0.9rem;
    color: #a0a0a0;
  }
  
  .reasoning-text {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #f0f0f0;
    white-space: pre-wrap;
  }
  </style>