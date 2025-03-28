<template>
  <!-- Core Button - Animated Celestial Button -->
  <div class="core-button-container">
    <button 
      @click="toggleCoreModal" 
      class="core-button"
      :class="{ 'pulse': isThinking }"
    >
      <div class="celestial-animation">
        <div class="orbit">
          <div class="planet"></div>
        </div>
        <div class="core-icon">
          <svg viewBox="0 0 24 24" class="brain-icon">
            <path d="M12,2C14.21,2 16,3.79 16,6V8H17C18.1,8 19,8.9 19,10V20C19,21.1 18.1,22 17,22H7C5.9,22 5,21.1 5,20V10C5,8.9 5.9,8 7,8H8V6C8,3.79 9.79,2 12,2M12,4C10.9,4 10,4.9 10,6V8H14V6C14,4.9 13.1,4 12,4M12,12C10.9,12 10,12.9 10,14C10,15.1 10.9,16 12,16C13.1,16 14,15.1 14,14C14,12.9 13.1,12 12,12Z" />
          </svg>
        </div>
      </div>
      <span>Core</span>
    </button>
  </div>

  <!-- Core Modal - DawntasyAI's Brain -->
  <div v-if="showCoreModal" class="modal-overlay" @click="closeCoreModal">
    <div class="core-modal" @click.stop>
      <div class="modal-header">
        <h2>DawntasyAI's Brain</h2>
        <button @click="closeCoreModal" class="close-button">×</button>
      </div>
      
      <div class="modal-welcome">
        <div class="orbital-animation">
          <div class="orbital-ring"></div>
          <div class="orbital-core"></div>
        </div>
        <div class="thinking-about">
          <span>I am thinking about:</span>
          <div class="thinking-topic">
            <span class="typing-animation">{{ currentTopic }}</span>
          </div>
        </div>
      </div>
      
      <div class="brain-regions">
        <button 
          v-for="region in brainRegions" 
          :key="region.id"
          @click="handleRegionClick(region)"
          class="region-button"
          :class="{ 'integrated': region.integrated }"
        >
          <div class="region-icon">
            <component :is="region.icon" />
          </div>
          <span>{{ region.name }}</span>
        </button>
      </div>
      
      <div class="mind-map-container">
        <h3>Thought Process</h3>
        <div ref="mindMapContainer" class="mind-map"></div>
      </div>
    </div>
  </div>
  
  <!-- Reasoning Modal - My Thoughts Core Portal -->
  <div v-if="showReasoningModal" class="modal-overlay" @click="closeReasoningModal">
    <div class="reasoning-modal" @click.stop>
      <div class="modal-header">
        <h2>My Thoughts Core Portal</h2>
        <button @click="closeReasoningModal" class="close-button">×</button>
      </div>
      
      <div class="reasoning-content">
        <div class="thinking-status" :class="{ 'active': isThinking }">
          <div class="thinking-pulse"></div>
          <span>{{ isThinking ? 'Thinking in progress...' : 'Thought complete' }}</span>
        </div>
        
        <div class="reasoning-text" v-html="formattedReasoningText"></div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';

// Brain region icons as Vue components
const ReasoningIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,3C7.58,3 4,5.58 4,9C4,11.07 5.31,12.86 7.24,13.86L6,15.93C5.46,16.61 5.46,17.59 6,18.27L7,19.65C7.41,20.17 8.14,20.17 8.55,19.65L12,15.82L15.45,19.65C15.86,20.17 16.59,20.17 17,19.65L18,18.27C18.54,17.59 18.54,16.61 18,15.93L16.76,13.86C18.69,12.86 20,11.07 20,9C20,5.58 16.42,3 12,3Z" />
    </svg>
  `
};

const CognitionIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.5,12C18,12 20,14 20,16.5C20,17.38 19.75,18.21 19.31,18.9L22.39,22L21,23.39L17.88,20.32C17.19,20.75 16.37,21 15.5,21C13,21 11,19 11,16.5C11,14 13,12 15.5,12M15.5,14C14.12,14 13,15.12 13,16.5C13,17.88 14.12,19 15.5,19C16.88,19 18,17.88 18,16.5C18,15.12 16.88,14 15.5,14M5,3H19C20.11,3 21,3.89 21,5V13.03C20.5,12.23 19.81,11.54 19,11V5H5V19H9.16C9.06,19.5 9,20 9,20.5V21H5C3.89,21 3,20.11 3,19V5C3,3.89 3.89,3 5,3Z" />
    </svg>
  `
};

const CoordinationIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M5,14H19V15H5V14M5,11H19V12H5V11M14,5H5V9H14V5M15,5V9H19V5H15M19,10H5V17H19V10M5,18V21H19V18H5Z" />
    </svg>
  `
};

const VitalityIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,10.5A1.5,1.5 0 0,1 13.5,12A1.5,1.5 0 0,1 12,13.5A1.5,1.5 0 0,1 10.5,12A1.5,1.5 0 0,1 12,10.5M7.5,10.5A1.5,1.5 0 0,1 9,12A1.5,1.5 0 0,1 7.5,13.5A1.5,1.5 0 0,1 6,12A1.5,1.5 0 0,1 7.5,10.5M16.5,10.5A1.5,1.5 0 0,1 18,12A1.5,1.5 0 0,1 16.5,13.5A1.5,1.5 0 0,1 15,12A1.5,1.5 0 0,1 16.5,10.5Z" />
    </svg>
  `
};

const MemoryIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
    </svg>
  `
};

const AwarenessIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M15,12C13.89,12 13,12.89 13,14A2,2 0 0,0 15,16A2,2 0 0,0 17,14C17,12.89 16.1,12 15,12M12,20V10H7.27C11.34,6.43 18.66,6.43 22.73,10H18V14H16V12H15C12.79,12 11,13.79 11,16A5,5 0 0,0 16,21H17V22H18V21C20.21,21 22,19.21 22,17V10.27C22,7.23 17.04,4.2 12,4.2C6.96,4.2 2,7.23 2,10.27V17C2,19.21 3.79,21 6,21H7V22H8V21H9V20H6A3,3 0 0,1 3,17V12H6V10H10V20H12Z" />
    </svg>
  `
};

export default {
  name: 'DawntasyAICore',
  components: {
    ReasoningIcon,
    CognitionIcon,
    CoordinationIcon,
    VitalityIcon,
    MemoryIcon,
    AwarenessIcon
  },
  props: {
    // Current chat messages to determine topic
    messages: {
      type: Array,
      default: () => []
    },
    // Function to open Memory Bank modal
    openMemoryBank: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      showCoreModal: false,
      showReasoningModal: false,
      isThinking: false,
      currentTopic: 'Starting up...',
      reasoningText: '',
      brainRegions: [
        { 
          id: 'reasoning', 
          name: 'Reasoning', 
          integrated: true, 
          icon: 'ReasoningIcon',
          action: this.openReasoningModal
        },
        { 
          id: 'cognition', 
          name: 'Cognition', 
          integrated: false, 
          icon: 'CognitionIcon',
          action: this.showNotIntegrated
        },
        { 
          id: 'coordination', 
          name: 'Coordination', 
          integrated: false, 
          icon: 'CoordinationIcon',
          action: this.showNotIntegrated
        },
        { 
          id: 'vitality', 
          name: 'Vitality', 
          integrated: false, 
          icon: 'VitalityIcon',
          action: this.showNotIntegrated
        },
        { 
          id: 'memory', 
          name: 'Memory', 
          integrated: true, 
          icon: 'MemoryIcon',
          action: this.openMemoryBankModal
        },
        { 
          id: 'awareness', 
          name: 'Awareness', 
          integrated: false, 
          icon: 'AwarenessIcon',
          action: this.showNotIntegrated
        }
      ],
      mindMapData: {
        name: "Core Thought",
        children: []
      },
      previousReasoning: null
    };
  },
  computed: {
    formattedReasoningText() {
      // Add styling to certain keywords to make the reasoning text more engaging
      if (!this.reasoningText) return '';
      
      return this.reasoningText
        .replace(/Hmm/g, '<span class="thinking-keyword">Hmm</span>')
        .replace(/Okay/g, '<span class="thinking-keyword">Okay</span>')
        .replace(/let me think/g, '<span class="thinking-keyword">let me think</span>')
        .replace(/I thought about it/g, '<span class="thinking-emphasis">I thought about it</span>')
        .replace(/Let's think/g, '<span class="thinking-keyword">Let\'s think</span>')
        .replace(/How can I/g, '<span class="thinking-keyword">How can I</span>');
    }
  },
  watch: {
    // Watch for new messages and trigger the thinking process
    messages: {
      handler(newMessages, oldMessages) {
        if (newMessages.length > oldMessages.length) {
          const latestMessage = newMessages[newMessages.length - 1];
          
          // Only trigger if the latest message is from the user
          if (latestMessage && latestMessage.sender === 'user') {
            this.determineThinkingNecessity(latestMessage.content);
            this.updateCurrentTopic();
          }
        }
      },
      deep: true
    },
    // When reasoning changes, update the mind map
    reasoningText(newReasoning) {
      if (newReasoning) {
        this.generateMindMap(newReasoning);
      }
    }
  },
  mounted() {
    // Initialize mind map
    this.initMindMap();
    
    // Set initial topic based on messages
    this.updateCurrentTopic();
  },
  methods: {
    toggleCoreModal() {
      this.showCoreModal = !this.showCoreModal;
      if (this.showCoreModal) {
        this.$nextTick(() => {
          this.updateMindMap();
        });
      }
    },
    closeCoreModal() {
      this.showCoreModal = false;
    },
    openReasoningModal() {
      this.showReasoningModal = true;
    },
    closeReasoningModal() {
      this.showReasoningModal = false;
    },
    openMemoryBankModal() {
      this.closeCoreModal();
      this.openMemoryBank();
    },
    showNotIntegrated(region) {
      alert(`${region.name} is not integrated yet.`);
    },
    handleRegionClick(region) {
      if (region.integrated) {
        region.action(region);
      } else {
        this.showNotIntegrated(region);
      }
    },
    updateCurrentTopic() {
      // Extract the most recent topic from messages
      if (this.messages.length > 0) {
        const recentMessages = this.messages.slice(-3); // Look at the last 3 messages
        
        // Simple extraction of key topics
        const text = recentMessages.map(m => m.content).join(' ');
        const words = text.split(/\s+/);
        const nouns = words.filter(word => 
          word.length > 3 && 
          !['about', 'these', 'those', 'their', 'there', 'would', 'should', 'could'].includes(word.toLowerCase())
        );
        
        if (nouns.length > 0) {
          // Pick the most frequent noun as the topic
          const wordCount = {};
          nouns.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
          });
          
          const sortedWords = Object.keys(wordCount).sort((a, b) => wordCount[b] - wordCount[a]);
          this.currentTopic = sortedWords[0];
        } else {
          this.currentTopic = "the conversation";
        }
      } else {
        this.currentTopic = "starting a conversation";
      }
    },
    determineThinkingNecessity(message) {
      // Check if thinking is necessary based on message complexity or keywords
      const complexityThreshold = 15; // words
      const words = message.split(/\s+/);
      
      const complexityTriggers = ['why', 'how', 'what', 'explain', 'help', 'understand', 'problem'];
      const containsComplexTrigger = complexityTriggers.some(trigger => 
        message.toLowerCase().includes(trigger)
      );
      
      const needsThinking = words.length > complexityThreshold || containsComplexTrigger;
      
      if (needsThinking) {
        this.startThinking(message);
      } else {
        // Even for simple messages, generate brief reasoning
        this.generateSimpleReasoning(message);
      }
    },
    startThinking(message) {
      // Store previous reasoning before starting new thinking
      if (this.reasoningText) {
        this.previousReasoning = this.reasoningText;
        this.convertReasoningToMemory(this.previousReasoning);
      }
      
      // Start thinking animation
      this.isThinking = true;
      this.reasoningText = '';
      
      // Generate AI reasoning in real-time (simulated)
      this.generateReasoning(message);
      
      // Emit event for chat to show "Thinking..." indicator
      this.$emit('thinking-started');
    },
    generateReasoning(message) {
      // Dynamic generation of reasoning based on the message
      // In a real implementation, this would connect to your AI's thinking process
      
      // Clear existing reasoning
      this.reasoningText = '';
      
      // Get context from previous reasoning if available
      const contextFromPrevious = this.previousReasoning ? 
        this.extractContextFromPreviousReasoning(this.previousReasoning) : '';
      
      // Dynamic reasoning generation simulation (would be replaced by actual AI reasoning)
      const totalWords = Math.floor(Math.random() * 150) + 50; // Between 50-200 words
      
      // Starting phrases
      const startingPhrases = [
        "Hmm. Let me think about this.",
        "Okay, so the user is talking about",
        "I need to consider how to respond to this.",
        "Let's think through this step by step."
      ];
      
      // Middle reasoning patterns
      const reasoningPatterns = [
        "From an emotional perspective, I should consider",
        "Looking at this cognitively, I can analyze",
        "If I were to apply philosophical thinking here",
        "Scientifically speaking, this relates to",
        "In terms of practical advice, I could suggest"
      ];
      
      // Concluding thoughts
      const conclusions = [
        "I think the best approach would be to",
        "Given all considerations, I should focus on",
        "The user would probably benefit most from",
        "I'll structure my response around"
      ];
      
      // Start with context from previous reasoning if available
      let fullReasoning = contextFromPrevious ? 
        `${contextFromPrevious}\n\n` : '';
      
      // Add a starting phrase
      fullReasoning += startingPhrases[Math.floor(Math.random() * startingPhrases.length)] + ' ';
      
      // Extract potential topic from message
      const potentialTopics = words.filter(word => word.length > 3).slice(0, 3);
      const topic = potentialTopics.length > 0 ? 
        potentialTopics[Math.floor(Math.random() * potentialTopics.length)] : 
        'this topic';
      
      fullReasoning += `${topic}. `;
      
      // Add reasoning patterns
      const patternsToUse = Math.min(3, Math.floor(totalWords / 50));
      for (let i = 0; i < patternsToUse; i++) {
        const pattern = reasoningPatterns[Math.floor(Math.random() * reasoningPatterns.length)];
        fullReasoning += `${pattern} ${topic}. `;
      }
      
      // Add conclusion
      const conclusion = conclusions[Math.floor(Math.random() * conclusions.length)];
      fullReasoning += `${conclusion} providing helpful insights about ${topic}.`;
      
      // Progressive display of reasoning (simulating real-time thinking)
      const words = fullReasoning.split(' ');
      let currentIndex = 0;
      
      const displayInterval = setInterval(() => {
        if (currentIndex < words.length) {
          this.reasoningText += words[currentIndex] + ' ';
          currentIndex++;
        } else {
          clearInterval(displayInterval);
          this.isThinking = false;
          this.$emit('thinking-completed', this.reasoningText);
        }
      }, 100); // Adjust speed as needed
    },
    generateSimpleReasoning(message) {
      // For simple messages, generate brief reasoning
      this.isThinking = true;
      
      const simplePatterns = [
        "This seems straightforward. The user is just saying hello.",
        "A simple message that doesn't need deep analysis.",
        "I should keep my response light and friendly here.",
        "No need for complex reasoning, just a friendly response."
      ];
      
      const reasoning = simplePatterns[Math.floor(Math.random() * simplePatterns.length)];
      
      // Simulate thinking process
      setTimeout(() => {
        this.reasoningText = reasoning;
        this.isThinking = false;
        this.$emit('thinking-completed', reasoning);
      }, 500);
    },
    extractContextFromPreviousReasoning(previousReasoning) {
      // Extract useful context from previous reasoning to inform new reasoning
      const sentences = previousReasoning.split(/\.\s+/);
      
      // Select a few key sentences for context
      const keyContextSentences = sentences.filter(sentence => 
        sentence.includes('I thought') || 
        sentence.includes('user') || 
        sentence.includes('consider')
      ).slice(0, 2);
      
      if (keyContextSentences.length > 0) {
        return `From our previous discussion, I thought about: ${keyContextSentences.join('. ')}.`;
      }
      
      return '';
    },
    convertReasoningToMemory(reasoning) {
      // Convert reasoning to memory for storage in Memory Bank
      if (!reasoning) return;
      
      const date = new Date().toLocaleDateString();
      
      // Extract key topic
      const topicMatch = reasoning.match(/talking about\s+(\w+)/i);
      const topic = topicMatch ? topicMatch[1] : this.currentTopic;
      
      // Create summary
      const summary = `On ${date}, the user was discussing ${topic}. I thought about it, and provided relevant insights.`;
      
      // Determine memory type based on content
      let memoryType = 'Insight';
      if (reasoning.includes('emotional') || reasoning.includes('feel')) {
        memoryType = 'Emotional';
      } else if (reasoning.includes('science') || reasoning.includes('data')) {
        memoryType = 'Knowledge';
      } else if (reasoning.includes('suggest') || reasoning.includes('advice')) {
        memoryType = 'Advice';
      }
      
      // Create memory object
      const memory = {
        type: memoryType,
        date,
        summary,
        details: reasoning.substring(0, 100) + '...' // Truncate for storage
      };
      
      // Emit event to store in Memory Bank
      this.$emit('store-memory', memory);
    },
    initMindMap() {
      // Initialize empty mind map
      this.mindMapData = {
        name: this.currentTopic || "Core Thought",
        children: []
      };
    },
    generateMindMap(reasoning) {
      // Generate mind map data from reasoning text
      if (!reasoning) return;
      
      // Extract main concept (use current topic)
      const mainConcept = this.currentTopic;
      
      // Extract branches from reasoning text
      const sentences = reasoning.split(/\.\s+/);
      const branches = [];
      
      sentences.forEach(sentence => {
        // Extract key phrases that could be branches
        const keywordPatterns = [
          'consider', 'perspective', 'approach', 'thinking', 
          'emotional', 'cognitive', 'scientific', 'philosophical'
        ];
        
        keywordPatterns.forEach(pattern => {
          if (sentence.includes(pattern)) {
            // Extract phrase around the keyword
            const words = sentence.split(/\s+/);
            const patternIndex = words.findIndex(word => word.includes(pattern));
            
            if (patternIndex !== -1) {
              // Get 3-5 words around the keyword
              const start = Math.max(0, patternIndex - 2);
              const end = Math.min(words.length, patternIndex + 3);
              const phrase = words.slice(start, end).join(' ');
              
              if (phrase.length > 5 && !branches.some(b => b.name === phrase)) {
                branches.push({
                  name: phrase,
                  children: []
                });
              }
            }
          }
        });
      });
      
      // If we don't have enough branches, add some generic ones
      if (branches.length < 3) {
        const genericBranches = [
          "Emotional response",
          "Logical analysis",
          "Practical suggestions",
          "Knowledge application",
          "User perspective"
        ];
        
        while (branches.length < 3) {
          const generic = genericBranches[branches.length];
          branches.push({
            name: generic,
            children: []
          });
        }
      }
      
      // Limit to 5 branches maximum
      const limitedBranches = branches.slice(0, 5);
      
      // Create mind map data structure
      this.mindMapData = {
        name: mainConcept,
        children: limitedBranches
      };
      
      // Update mind map visualization if visible
      if (this.showCoreModal) {
        this.$nextTick(() => {
          this.updateMindMap();
        });
      }
    },
    updateMindMap() {
      // Use D3.js to render the mind map
      if (!this.$refs.mindMapContainer) return;
      
      const container = this.$refs.mindMapContainer;
      const width = container.clientWidth;
      const height = container.clientHeight || 300;
      
      // Clear previous visualization
      d3.select(container).selectAll("*").remove();
      
      // Create SVG
      const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
      
      // Create hierarchical layout
      const root = d3.hierarchy(this.mindMapData);
      const radius = Math.min(width, height) / 2 - 50;
      
      // Create radial tree layout
      const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
      
      tree(root);
      
      // Draw links
      svg.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y)
        )
        .style("fill", "none")
        .style("stroke", "#555")
        .style("stroke-opacity", 0.6)
        .style("stroke-width", 1.5);
      
      // Create node groups
      const node = svg.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", d => `node ${d.children ? "node--internal" : "node--leaf"}`)
        .attr("transform", d => `translate(${radialPoint(d.x, d.y)})`);
      
      // Add circles to nodes
      node.append("circle")
        .attr("r", d => d.depth === 0 ? 15 : 8)
        .style("fill", d => d.depth === 0 ? "#4285f4" : "#69b3a2")
        .style("stroke", "white")
        .style("stroke-width", 2);
      
      // Add labels to nodes
      node.append("text")
        .attr("dy", ".31em")
        .attr("x", d => d.x < Math.PI ? 15 : -15)
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .text(d => d.data.name)
        .style("font-size", "12px")
        .style("fill", "#333");
      
      // Helper function to convert polar to Cartesian coordinates
      function radialPoint(x, y) {
        return [y * Math.cos(x), y * Math.sin(x)];
      }
    }
  }
};
</script>

<style scoped>
.core-button-container {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.core-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 10px 20px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.core-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.core-button.pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(66, 133, 244, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(66, 133, 244, 0);
  }
}

.celestial-animation {
  position: relative;
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.core-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brain-icon {
  width: 20px;
  height: 20px;
  fill: white;
}

.orbit {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: rotate 8s linear infinite;
}

.planet {
  position: absolute;
  top: 0;
  left: 50%;
  width: 6px;
  height: 6px;
  background-color: #fff;
  border-radius: 50%;
  transform: translateX(-50%);
  animation: orbit 8s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes orbit {
  0% {
    transform: rotate(0deg) translateX(16px) rotate(0deg);
  }
  100% {
    transform: rotate(360deg) translateX(16px) rotate(-360deg);
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.core-modal {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.reasoning-modal {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 15px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #777;
}

.modal-welcome {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  border-radius: 8px;
}

.orbital-animation {
  position: relative;
  width: 60px;
  height: 60px;
  margin-right: 20px;
}

.orbital-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(66, 133, 244, 0.3);
  border-radius: 50%;
  animation: rotate 10s linear infinite;
}

.orbital-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #4285f4, #0f9d58);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 15px rgba(66, 133, 244, 0.6);
}

.thinking-about {
  flex: 1;
}

.thinking-about span {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.thinking-topic {
  font-size: 1.4rem;
  font-weight: bold;
  color: #333;
}

.typing-animation {
  border-right: 2px solid #4285f4;
  padding-right: 5px;
  animation: typing 1s infinite;
}

@keyframes typing {
  0%, 100% {
    border-color: transparent;
  }
  50% {
    border-color: #4285f4;
  }
}

.brain-regions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.region-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.region-button.integrated {
  background: linear-gradient(to bottom, #f9f9f9, #e9e9e9);
  border-color: #ccc;
}

.region-button:not(.integrated) {
  opacity: 0.7;
  background: #eee;
}

.region-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.region-icon {
  width: 30px;
  height: 30px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.region-icon svg {
  width: 100%;
  height: 100%;
  color: #4285f4;
}

.mind-map-container {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.mind-map-container h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2rem;
  color: #555;
}

.mind-map {
  width: 100%;
  height: 300px;
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
}

.reasoning-content {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.thinking-status {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 8px 12px;
  background-color: #eee;
  border-radius: 4px;
}

.thinking-status.active {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.thinking-pulse {
  width: 10px;
  height: 10px;
  background-color: #999;
  border-radius: 50%;
  margin-right: 10px;
}

.thinking-status.active .thinking-pulse {
  background-color: #2196f3;
  animation: pulse-thinking 1s infinite;
}

@keyframes pulse-thinking {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.reasoning-text {
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

.thinking-keyword {
  color: #4285f4;
  font-weight: bold;
}

.thinking-emphasis {
  color: #0f9d58;
  font-weight: bold;
  font-style: italic;
}
</style>