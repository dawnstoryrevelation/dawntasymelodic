<template>
    <div class="core-wrapper">
      <!-- Core Button -->
      <button class="core-button" @click="showCoreModal = true" title="AI Brain Core">
        <div class="core-button-animation">
          <div class="core-orb"></div>
          <div class="core-ring ring1"></div>
          <div class="core-ring ring2"></div>
          <div class="core-ring ring3"></div>
        </div>
        <span class="core-button-label">Core</span>
      </button>
  
      <!-- Core Modal -->
      <div class="modal-overlay" v-if="showCoreModal" @click.self="showCoreModal = false">
        <div class="core-modal">
          <div class="modal-header">
            <h3>DawntasyAI's Brain</h3>
            <button class="modal-close-btn" @click="showCoreModal = false">&times;</button>
          </div>
          
          <div class="core-modal-content">
            <!-- Welcome Header with Current Topic -->
            <div class="core-welcome-header">
              <div class="thinking-animation">
                <div class="thinking-pulse"></div>
              </div>
              <h4>
                I am thinking about: 
                <span class="dynamic-topic">{{ currentTopic }}</span>
              </h4>
            </div>
            
            <!-- Brain Regions -->
            <div class="brain-regions">
              <button 
                class="brain-region-button reasoning" 
                @click="openReasoningModal" 
                title="Reasoning processes"
              >
                <div class="region-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                    <path d="M12 6a1 1 0 1 0 1 1 1 1 0 0 0-1-1zm0 10a1 1 0 0 0-1 1 1 1 0 1 0 2 0 1 1 0 0 0-1-1zm0-4a1 1 0 1 0 1 1 1 1 0 0 0-1-1z"></path>
                  </svg>
                </div>
                <span>Reasoning</span>
              </button>
              
              <button 
                class="brain-region-button cognition" 
                @click="showNotIntegratedMessage('Cognition')" 
                title="Cognition processes"
              >
                <div class="region-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <span>Cognition</span>
              </button>
              
              <button 
                class="brain-region-button coordination" 
                @click="showNotIntegratedMessage('Coordination')" 
                title="Coordination processes"
              >
                <div class="region-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                  </svg>
                </div>
                <span>Coordination</span>
              </button>
              
              <button 
                class="brain-region-button vitality" 
                @click="showNotIntegratedMessage('Vitality')" 
                title="Vitality processes"
              >
                <div class="region-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <span>Vitality</span>
              </button>
              
              <button 
                class="brain-region-button memory" 
                @click="openMemoryBank" 
                title="Memory systems"
              >
                <div class="region-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                  </svg>
                </div>
                <span>Memory</span>
              </button>
              
              <button 
                class="brain-region-button awareness" 
                @click="showNotIntegratedMessage('Awareness')" 
                title="Awareness systems"
              >
                <div class="region-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M22 12h-4"></path>
                    <path d="M6 12H2"></path>
                    <path d="M12 6V2"></path>
                    <path d="M12 22v-4"></path>
                  </svg>
                </div>
                <span>Awareness</span>
              </button>
            </div>
            
            <!-- Mind Map Visualization Section -->
            <div class="mind-map-section">
              <h4>Thought Connections</h4>
              <div class="mind-map-container" ref="mindMapContainer"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Reasoning Modal -->
      <div class="modal-overlay" v-if="showReasoningModal" @click.self="showReasoningModal = false">
        <div class="reasoning-modal">
          <div class="modal-header">
            <h3>My Thoughts Core Portal</h3>
            <button class="modal-close-btn" @click="showReasoningModal = false">&times;</button>
          </div>
          
          <div class="reasoning-content">
            <div v-if="isThinking" class="thinking-live">
              <div class="thinking-live-header">
                <div class="thinking-indicator">
                  <span class="dot-pulse"></span>
                  <span>Thinking in progress...</span>
                </div>
                <div class="thinking-time">{{ thinkingTime }}</div>
              </div>
              <div class="thinking-stream" v-html="formatThinking(currentReasoning)"></div>
            </div>
            <div v-else class="thinking-complete">
              <div class="thinking-complete-header">
                <div class="thinking-status">Thinking complete</div>
                <div class="thinking-time">{{ thinkingTime }}</div>
              </div>
              <div class="thinking-result" v-html="formatThinking(currentReasoning)"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Not Integrated Message Toast -->
      <div class="toast-notification" v-if="showToast" :class="toastType">
        <div class="toast-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="8"></line>
          </svg>
        </div>
        <div class="toast-content">{{ toastMessage }}</div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import * as d3 from 'd3';
  
  export default {
    name: 'CoreComponent',
    props: {
      messages: {
        type: Array,
        default: () => []
      },
      isThinking: {
        type: Boolean,
        default: false
      },
      thinkingText: {
        type: String,
        default: 'Thinking...'
      }
    },
    setup(props, { emit }) {
      const showCoreModal = ref(false);
      const showReasoningModal = ref(false);
      const mindMapContainer = ref(null);
      const currentTopic = ref('Understanding user needs');
      const currentReasoning = ref('');
      const thinkingTime = ref('00:00');
      const thinkingTimer = ref(null);
      const thinkingSeconds = ref(0);
      
      // Toast notification
      const showToast = ref(false);
      const toastMessage = ref('');
      const toastType = ref('info');
      
      // Watch messages to extract the current topic
      watch(() => props.messages, (newMessages) => {
        if (newMessages.length > 0) {
          const lastMessages = newMessages.slice(-3);
          extractTopic(lastMessages);
        }
      }, { deep: true });
      
      // Watch thinking state to update reasoning
      watch(() => props.isThinking, (newIsThinking) => {
        if (newIsThinking) {
          startThinkingTimer();
          // Start with some initial thinking content
          currentReasoning.value = 'Analyzing the user query...\nProcessing context from conversation history...\nConsidering relevant knowledge and facts...';
          
          // Simulate thinking in progress with periodic updates
          simulateThinkingProgress();
        } else {
          stopThinkingTimer();
          
          // If reasoning is empty but we have thinkingText, use that
          if (currentReasoning.value.length < 50 && props.thinkingText) {
            currentReasoning.value = props.thinkingText;
          }
          
          // Save reasoning as memory
          saveReasoningAsMemory();
        }
      });
      
      // Extract topic from recent messages
      const extractTopic = (messages) => {
        // For demonstration, take the last user message and extract a topic
        const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
        
        if (lastUserMessage) {
          const text = lastUserMessage.content;
          
          // Simple topic extraction - take the first 3-5 words or use NLP in production
          const words = text.split(' ');
          if (words.length > 3) {
            // Take first 3-5 words depending on length
            const topicWords = words.slice(0, Math.min(5, words.length));
            const topic = topicWords.join(' ');
            currentTopic.value = topic.charAt(0).toUpperCase() + topic.slice(1);
          } else {
            currentTopic.value = text;
          }
          
          // Update mind map when topic changes
          nextTick(() => {
            createMindMap(currentTopic.value);
          });
        }
      };
      
      // Create mind map visualization using D3.js
      const createMindMap = (topic) => {
        if (!mindMapContainer.value) return;
        
        // Generate some fake branches related to the topic
        const branches = generateBranches(topic);
        
        // Create SVG container
        const container = mindMapContainer.value;
        d3.select(container).selectAll("*").remove();
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        const svg = d3.select(container)
          .append("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", `0 0 ${width} ${height}`);
        
        // Center coordinates
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Create central node
        svg.append("circle")
          .attr("cx", centerX)
          .attr("cy", centerY)
          .attr("r", 40)
          .attr("fill", "url(#core-gradient)")
          .attr("stroke", "#4f46e5")
          .attr("stroke-width", 2);
        
        // Add gradient definition
        const defs = svg.append("defs");
        const gradient = defs.append("radialGradient")
          .attr("id", "core-gradient")
          .attr("cx", "50%")
          .attr("cy", "50%")
          .attr("r", "50%");
        
        gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "#6366f1");
        
        gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "#4f46e5");
        
        // Add central text
        svg.append("text")
          .attr("x", centerX)
          .attr("y", centerY)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "white")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .text(topic.length > 20 ? topic.substring(0, 20) + "..." : topic);
        
        // Add branches
        const radius = 120;
        branches.forEach((branch, i) => {
          const angle = (i * 2 * Math.PI / branches.length) - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          
          // Draw connection line
          svg.append("line")
            .attr("x1", centerX)
            .attr("y1", centerY)
            .attr("x2", x)
            .attr("y2", y)
            .attr("stroke", "#6366f1")
            .attr("stroke-width", 2)
            .attr("opacity", 0.6)
            .attr("stroke-dasharray", "4,4");
          
          // Draw branch node
          svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 30)
            .attr("fill", "#1e293b")
            .attr("stroke", "#6366f1")
            .attr("stroke-width", 1.5);
          
          // Add branch text
          svg.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "white")
            .attr("font-size", "10px")
            .text(branch.length > 15 ? branch.substring(0, 15) + "..." : branch);
          
          // Add subtle pulse animation to nodes
          svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 30)
            .attr("fill", "none")
            .attr("stroke", "#6366f1")
            .attr("stroke-width", 1)
            .attr("opacity", 0.5)
            .attr("class", "pulse-circle");
        });
        
        // Add animation to the pulse circles
        svg.selectAll(".pulse-circle")
          .append("animate")
          .attr("attributeName", "r")
          .attr("values", "30;35;30")
          .attr("dur", "3s")
          .attr("repeatCount", "indefinite");
        
        svg.selectAll(".pulse-circle")
          .append("animate")
          .attr("attributeName", "opacity")
          .attr("values", "0.5;0.2;0.5")
          .attr("dur", "3s")
          .attr("repeatCount", "indefinite");
      };
      
      // Generate fake branches related to a topic
      const generateBranches = (topic) => {
        // In a real implementation, this would be AI-generated
        const commonBranches = [
          "Definition", "Examples", "Applications", "History", 
          "Benefits", "Challenges", "Future", "Analysis",
          "Impact", "Research", "Methods", "Comparison"
        ];
        
        // Select 5-8 random branches
        const numBranches = Math.floor(Math.random() * 4) + 5;
        const selectedBranches = [];
        
        for (let i = 0; i < numBranches; i++) {
          const randomIndex = Math.floor(Math.random() * commonBranches.length);
          const branch = commonBranches[randomIndex];
          
          if (!selectedBranches.includes(branch)) {
            selectedBranches.push(branch);
          }
        }
        
        return selectedBranches;
      };
      
      // Simulate thinking progress
      const simulateThinkingProgress = () => {
        // This would be replaced with actual AI thinking in production
        const thinkingSteps = [
          "Analyzing query context and intent...",
          "Retrieving relevant facts and knowledge...",
          "Evaluating different perspectives...",
          "Connecting to previous conversation context...",
          "Considering ethical implications...",
          "Formulating comprehensive response...",
          "Organizing information for clarity...",
          "Applying reasoning frameworks...",
          "Checking for logical consistency...",
          "Prioritizing most relevant information..."
        ];
        
        let currentStep = 0;
        const interval = setInterval(() => {
          if (currentStep < thinkingSteps.length && props.isThinking) {
            currentReasoning.value += '\n' + thinkingSteps[currentStep];
            currentStep++;
          } else {
            clearInterval(interval);
          }
        }, 1000);
        
        // Clean up interval if thinking stops
        watch(() => props.isThinking, (isThinking) => {
          if (!isThinking) {
            clearInterval(interval);
          }
        });
      };
      
      // Start thinking timer
      const startThinkingTimer = () => {
        thinkingSeconds.value = 0;
        thinkingTime.value = '00:00';
        
        thinkingTimer.value = setInterval(() => {
          thinkingSeconds.value++;
          const minutes = Math.floor(thinkingSeconds.value / 60);
          const seconds = thinkingSeconds.value % 60;
          thinkingTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
      };
      
      // Stop thinking timer
      const stopThinkingTimer = () => {
        if (thinkingTimer.value) {
          clearInterval(thinkingTimer.value);
          thinkingTimer.value = null;
        }
      };
      
      // Save reasoning as memory
      const saveReasoningAsMemory = () => {
        // In a real implementation, this would call a method from the parent component
        // to save the reasoning to the Memory Bank
        console.log('Saving reasoning as memory:', currentReasoning.value);
        
        // For now, just emit an event that can be handled by the parent
        emit('save-reasoning', {
          content: currentReasoning.value,
          topic: currentTopic.value,
          timestamp: Date.now()
        });
      };
      
      // Format thinking text with syntax highlighting
      const formatThinking = (text) => {
        if (!text) return '';
        
        // Convert line breaks to <br> tags
        let formatted = text.replace(/\n/g, '<br>');
        
        // Highlight certain keywords and phrases
        const highlightPatterns = [
          { pattern: /Analyzing|Analysis|Evaluate|Evaluating|Exploring|Reasoning/gi, class: 'thinking-analysis' },
          { pattern: /Context|Intent|Query|Question|Message|User/gi, class: 'thinking-context' },
          { pattern: /Facts|Knowledge|Information|Data|Evidence|Source/gi, class: 'thinking-knowledge' },
          { pattern: /Ethical|Implications|Considerations|Should|Appropriate/gi, class: 'thinking-ethics' },
          { pattern: /Formulating|Organizing|Structuring|Planning|Drafting/gi, class: 'thinking-planning' },
          { pattern: /Checking|Verifying|Confirming|Ensuring|Validating/gi, class: 'thinking-verification' }
        ];
        
        highlightPatterns.forEach(({ pattern, class: className }) => {
          formatted = formatted.replace(pattern, match => `<span class="${className}">${match}</span>`);
        });
        
        return formatted;
      };
      
      // Show not integrated message
      const showNotIntegratedMessage = (feature) => {
        toastMessage.value = `${feature} is not integrated yet`;
        toastType.value = 'info';
        showToast.value = true;
        
        setTimeout(() => {
          showToast.value = false;
        }, 3000);
      };
      
      // Open memory bank
      const openMemoryBank = () => {
        // Close the core modal
        showCoreModal.value = false;
        
        // Emit event to open memory bank
        emit('open-memory-bank');
      };
      
      // Open reasoning modal
      const openReasoningModal = () => {
        showReasoningModal.value = true;
      };
      
      onMounted(() => {
        // Create initial mind map
        nextTick(() => {
          createMindMap(currentTopic.value);
        });
        
        // Handle window resize for responsive mind map
        const handleResize = () => {
          if (mindMapContainer.value && showCoreModal.value) {
            createMindMap(currentTopic.value);
          }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Clean up
        onUnmounted(() => {
          window.removeEventListener('resize', handleResize);
          if (thinkingTimer.value) {
            clearInterval(thinkingTimer.value);
          }
        });
      });
      
      return {
        showCoreModal,
        showReasoningModal,
        mindMapContainer,
        currentTopic,
        currentReasoning,
        thinkingTime,
        showToast,
        toastMessage,
        toastType,
        formatThinking,
        showNotIntegratedMessage,
        openMemoryBank,
        openReasoningModal
      };
    }
  };
  </script>
  
  <style scoped>
  /* Core Button Styles */
  .core-wrapper {
    position: relative;
    margin-top: 10px;
  }
  
  .core-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.15));
    color: white;
    border: 1px solid rgba(79, 70, 229, 0.4);
    border-radius: 8px;
    padding: 8px 12px;
    margin: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .core-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
    background: linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.3));
    border-color: rgba(79, 70, 229, 0.6);
  }
  
  .core-button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .core-button-animation {
    position: relative;
    width: 24px;
    height: 24px;
  }
  
  .core-orb {
    position: absolute;
    width: 12px;
    height: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
    animation: pulse 2s infinite;
  }
  
  .core-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px dashed rgba(99, 102, 241, 0.7);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.7;
  }
  
  .ring1 {
    width: 16px;
    height: 16px;
    animation: rotate 10s linear infinite;
  }
  
  .ring2 {
    width: 22px;
    height: 22px;
    animation: rotate 15s linear infinite reverse;
  }
  
  .ring3 {
    width: 28px;
    height: 28px;
    animation: rotate 20s linear infinite;
  }
  
  .core-button-label {
    font-weight: 500;
    letter-spacing: 0.5px;
  }
  
  /* Modal Styles */
  .core-modal {
    background: linear-gradient(135deg, #1A1A2E, #0F172A);
    border-radius: 12px;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.2), 0 10px 10px rgba(0, 0, 0, 0.1);
    color: white;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    animation: slideIn 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(99, 102, 241, 0.3);
  }
  
  .core-modal-content {
    padding: 20px;
    overflow-y: auto;
    max-height: calc(90vh - 60px);
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
  }
  
  .core-modal-content::-webkit-scrollbar {
    width: 5px;
  }
  
  .core-modal-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .core-modal-content::-webkit-scrollbar-thumb {
    background-color: rgba(99, 102, 241, 0.3);
    border-radius: 20px;
  }
  
  /* Welcome Header */
  .core-welcome-header {
    display: flex;
    align-items: center;
    background: rgba(15, 23, 42, 0.7);
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
  
  .thinking-animation {
    position: relative;
    width: 20px;
    height: 20px;
    margin-right: 12px;
  }
  
  .thinking-pulse {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #6366f1;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulse 2s infinite;
  }
  
  .core-welcome-header h4 {
    margin: 0;
    font-weight: 500;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .dynamic-topic {
    color: #6366f1;
    font-weight: 600;
    animation: fadeInOut 3s infinite;
  }
  
  /* Brain Regions */
  .brain-regions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 25px;
  }
  
  .brain-region-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    padding: 15px 10px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .brain-region-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
    border-color: rgba(99, 102, 241, 0.6);
    background: rgba(15, 23, 42, 0.9);
  }
  
  .brain-region-button:active {
    transform: translateY(1px);
  }
  
  .region-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.5);
    transition: all 0.3s ease;
  }
  
  .brain-region-button:hover .region-icon {
    background: rgba(99, 102, 241, 0.2);
  }
  
  .brain-region-button span {
    font-size: 14px;
    font-weight: 500;
  }
  
  /* Color variations for different brain regions */
  .reasoning .region-icon {
    color: #6366f1;
  }
  
  .cognition .region-icon {
    color: #8b5cf6;
  }
  
  .coordination .region-icon {
    color: #ec4899;
  }
  
  .vitality .region-icon {
    color: #f43f5e;
  }
  
  .memory .region-icon {
    color: #10b981;
  }
  
  .awareness .region-icon {
    color: #14b8a6;
  }
  
  /* Mind Map Section */
  .mind-map-section {
    background: rgba(15, 23, 42, 0.7);
    border-radius: 8px;
    padding: 15px;
    border: 1px solid rgba(99, 102, 241, 0.2);
  }
  
  .mind-map-section h4 {
    margin-top: 0;
    margin-bottom: 15px;
    font-weight: 500;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .mind-map-container {
    height: 300px;
    width: 100%;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 6px;
    overflow: hidden;
  }
  
  /* Reasoning Modal */
  .reasoning-modal {
    background: linear-gradient(135deg, #1A1A2E, #0F172A);
    border-radius: 12px;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.2), 0 10px 10px rgba(0, 0, 0, 0.1);
    color: white;
    width: 90%;
    max-width: 700px;
    max-height: 90vh;
    animation: slideIn 0.3s ease;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(99, 102, 241, 0.3);
  }
  
  .reasoning-content {
    padding: 15px;
    overflow-y: auto;
    max-height: calc(90vh - 60px);
    scrollbar-width: thin;
    scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
  }
  
  .reasoning-content::-webkit-scrollbar {
    width: 5px;
  }
  
  .reasoning-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .reasoning-content::-webkit-scrollbar-thumb {
    background-color: rgba(99, 102, 241, 0.3);
    border-radius: 20px;
  }
  
  .thinking-live-header,
  .thinking-complete-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
  }
  
  .thinking-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6366f1;
    font-weight: 500;
  }
  
  .dot-pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #6366f1;
    animation: dotPulse 1.5s infinite;
  }
  
  .thinking-time {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .thinking-status {
    color: #10b981;
    font-weight: 500;
  }
  
  .thinking-stream,
  .thinking-result {
    line-height: 1.6;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    white-space: pre-wrap;
  }
  
  /* Thinking syntax highlighting */
  :deep(.thinking-analysis) {
    color: #6366f1;
    font-weight: 500;
  }
  
  :deep(.thinking-context) {
    color: #8b5cf6;
  }
  
  :deep(.thinking-knowledge) {
    color: #14b8a6;
  }
  
  :deep(.thinking-ethics) {
    color: #f43f5e;
  }
  
  :deep(.thinking-planning) {
    color: #f59e0b;
  }
  
  :deep(.thinking-verification) {
    color: #10b981;
  }
  
  /* Animations */
  @keyframes pulse {
    0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  
  @keyframes rotate {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
  
  @keyframes fadeInOut {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes dotPulse {
    0% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0.4; transform: scale(1); }
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .brain-regions {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .core-welcome-header h4 {
      font-size: 14px;
    }
    
    .mind-map-container {
      height: 250px;
    }
    
    .core-modal, .reasoning-modal {
      width: 95%;
      max-height: 85vh;
    }
    
    .core-modal-content, .reasoning-content {
      max-height: calc(85vh - 60px);
    }
  }
  </style>