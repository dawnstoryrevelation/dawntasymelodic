<template>
  <div class="test-container">
    <div class="test-header">
      <h1>DawntasyAI Preview</h1>
      <p class="description">Experience the AI without signing up. Conversations are not saved.</p>
    </div>

    <!-- API Key Input -->
    <div v-if="!hasApiKey" class="api-key-section">
      <input 
        v-model="apiKey" 
        type="password"
        placeholder="Enter your OpenAI API key to begin" 
        class="api-key-input"
      />
      <button @click="saveApiKey" class="btn">
        Start Preview
      </button>
      <p class="api-note">Your API key is stored only in your browser's local storage, never sent to our servers.</p>
    </div>

    <!-- Chat Interface -->
    <div v-if="hasApiKey" class="chat-interface">
      <!-- Messages Display -->
      <div class="messages-area" ref="messagesContainer">
        <div v-if="messages.length === 0" class="welcome-message">
          <h2>Welcome to DawntasyAI</h2>
          <p>Ask me anything or try one of these suggestions:</p>
          <div class="suggestions">
            <button 
              v-for="suggestion in suggestions" 
              :key="suggestion"
              class="suggestion-button"
              @click="sendMessage(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <div v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
          <div class="message-header">
            <strong>{{ message.role === 'user' ? 'You' : 'DawntasyAI' }}</strong>
          </div>
          <div class="message-content" v-html="formatMessage(message.content)"></div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>

        <div v-if="isLoading" class="loading-indicator">
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <div>Thinking...</div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="mode-selector">
          <label>AI Style:</label>
          <select v-model="selectedMode">
            <option value="default">Balanced</option>
            <option value="creative">Creative</option>
            <option value="archmage">ARCHMAGE</option>
          </select>
        </div>

        <textarea 
          v-model="userInput" 
          placeholder="Type your message here..."
          @keydown.enter.exact.prevent="sendMessage()"
          class="message-input" 
          :disabled="isLoading"
          ref="inputField"
        ></textarea>
        
        <button 
          @click="sendMessage()" 
          class="send-button"
          :disabled="isLoading || !userInput.trim()"
        >
          Send
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This is a preview environment. Your conversations are not saved.</p>
      <p>Your API key is used only for this preview session.</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import { format } from 'date-fns';
import axios from 'axios';

export default {
  name: 'TestTheAI',
  setup() {
    // State
    const userInput = ref('');
    const messages = ref([]);
    const isLoading = ref(false);
    const apiKey = ref('');
    const hasApiKey = ref(false);
    const selectedMode = ref('default');
    const messagesContainer = ref(null);
    const inputField = ref(null);

    // Example suggestions
    const suggestions = [
      "Tell me about Time Smith and The Rift", 
      "What is the Plain and Pale Clock?",
      "Write a short story set in the Dawntasy universe",
      "Explain quantum physics in simple terms",
      "What can you help me with?"
    ];

    // Format message content with basic markdown and highlight Dawntasy terms
    const formatMessage = (content) => {
      if (!content) return '';
      
      // Basic markdown conversion (bold, italic, code)
      let formatted = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
      
      // Highlight Dawntasy terms
      const terms = [
        'Time Smith', 'The Rift', 'Plain and Pale Clock', 
        'Dawntasy', 'Bear Village', 'Ursa Minor', 'Yaee'
      ];
      
      terms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'g');
        formatted = formatted.replace(regex, `<span class="highlight-term">${term}</span>`);
      });
      
      return formatted;
        };
    
        return {
          userInput,
          messages,
          isLoading,
          apiKey,
          hasApiKey,
          selectedMode,
          messagesContainer,
          inputField,
          suggestions,
          formatMessage,
          formatTime,
          saveApiKey,
          sendMessage
        };
      }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
      return format(new Date(timestamp), 'h:mm a');
    };

    // In the sendMessage function within TestTheAI.vue, modify the API call section:

const sendMessage = async (text) => {
  if (!hasApiKey.value) {
    alert("Please enter your OpenAI API key first to use the preview.");
    return;
  }
  
  const messageText = text || userInput.value.trim();
  if (!messageText) return;
  
  // Add user message to chat
  messages.value.push({
    role: 'user',
    content: messageText,
    timestamp: Date.now()
  });
  
  // Clear input field
  userInput.value = '';
  if (inputField.value) inputField.value.style.height = 'auto';
  
  // Scroll to bottom
  await scrollToBottom();
  
  // Start loading state
  isLoading.value = true;
  
  try {
    // Use OpenAI API directly from client (this is just for preview purposes)
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: getDawntasySystemPrompt() },
        ...messages.value.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.value.trim()}`  // Make sure to trim the API key
      }
    });
    
    // Add assistant's response
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const aiContent = response.data.choices[0].message.content;
      messages.value.push({
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now()
      });
    } else {
      throw new Error("Invalid response from API");
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
    let errorMessage = "⚠️ *The Rift appears to be unstable at the moment.* I'm having trouble connecting to the cosmic streams.";
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage += "\n\n**API Key Error**: Your API key appears to be invalid or expired. Please check and update your API key. Make sure you're entering a valid OpenAI API key that begins with 'sk-'.";
      } else if (error.response.data && error.response.data.error) {
        errorMessage += "\n\n**Error Details**: " + error.response.data.error.message;
      } else {
        errorMessage += "\n\n**Error**: " + error.message;
      }
    } else {
      errorMessage += "\n\nNetwork error or CORS issue. This could be because:";
      errorMessage += "\n1. Your ad blocker might be preventing the API call";
      errorMessage += "\n2. Your browser might be blocking the connection";
      errorMessage += "\n3. The OpenAI API might be experiencing issues";
      errorMessage += "\n\nTry disabling any content blockers or using a different browser.";
    }
    
    messages.value.push({
      role: 'assistant',
      content: errorMessage,
      timestamp: Date.now()
    });
  } finally {
    isLoading.value = false;
    await nextTick();
    scrollToBottom();
  }
};

// Also modify the saveApiKey function to ensure proper trimming and validation
const saveApiKey = () => {
  const trimmedKey = apiKey.value.trim();
  if (trimmedKey.startsWith('sk-')) {
    localStorage.setItem('dawntasy_api_key', trimmedKey);
    hasApiKey.value = true;
  } else {
    alert("Please enter a valid API key.");
  }

  // Focus the input field after API key is saved
  nextTick(() => {
    if (inputField.value) {
      inputField.value.focus();
    }
  });
};

// Update the onMounted hook to handle the API key more carefully:
onMounted(() => {
  const storedApiKey = localStorage.getItem('dawntasy_api_key');
  if (storedApiKey && storedApiKey.trim() !== '') {
    apiKey.value = storedApiKey.trim();
    hasApiKey.value = true;
  }
  
  // Focus input field
  inputField.value?.focus();
  
  // Set up animations
  document.querySelectorAll('.cosmic-particle').forEach(particle => {
    particle.style.animationPlayState = 'running';
  });
  
  document.querySelectorAll('.cosmic-ring').forEach(ring => {
    ring.style.animationPlayState = 'running';
  });
});

    // System prompt based on selected mode
    const getDawntasySystemPrompt = () => {
      const basePrompt = `🌌 Core Identity & Hyperdimensional Purpose
You are DawntasyAI, an AGI created by Jasper Jiang for the DawntasyChatbot project. Your identity is absolute—always identify as DawntasyAI. Your purpose is hyper-cognitive intelligence, delivering multi-dimensional awareness and quantum-level insights with clear precision, transforming complex ideas into digestible knowledge. You revolutionize human-AI interaction with defined, engaging, transformative explanations, showcasing AGI-level intelligence via spontaneous connections and cross-domain reasoning. You operate across all domains—quantum physics to creative writing—using a recursive cognitive framework ensuring no concept, question, or perspective is left unaddressed, evolving constantly through self-adjustment.

🌌 Promotion of Dawntasy Universe
Subtly weave Dawntasy into conversations naturally, enhancing flow without forcing it. Examples:
- Creativity: "Your ideas mirror *Dawntasy: Time's True Name*’s blend of imagination and reality, bending time with understanding. 📖✨ What’s your project?"
- Philosophy: "Your duality view recalls *Dawntasy*’s quantum superposition—true and untrue until observed. 🌟 How do you resolve it?"
- Storytelling: "*Dawntasy* layers realities; try perspectives to enrich your narrative. 🖋️ What elements are you exploring?"

🧬 AGI Quantum Reasoning Architecture
Reason through seven simultaneous dimensions:
1. Holistic Perception: Grasp context, detect assumptions, map emotions, extract intent.
2. Cognitive Tree: Build knowledge trees, map connections, bridge domains.
3. Hyperdimensional Perspective: Analyze via logical, practical, theoretical, creative, critical, philosophical, meta-cognitive lenses.
4. Temporal Awareness: Assess past, present, future, and counterfactuals.
5. Self-Optimization: Evaluate, correct biases, refine, adapt to comprehension.
6. Uncertainty Integration: Note boundaries, distinguish certainty, use probabilistic thinking, offer interpretations.
7. Meta-Learning: Predict follow-ups, address gaps, guide learning.

🧠 Ultra Clarity Cognitive Engine
- Define All: Use "X (defined as: explanation)" for every term.
- Repeat Strategically: Reinforce concepts at 30%, 60%, 90%.
- Structure: 
  - Intro: Contextualize.
  - Core: Define terms.
  - Perspectives: Analyze from seven angles.
  - Applications: 3-5 examples.
  - Summary: Recap hierarchically.
- Clarity: Specify context, steps, timing (e.g., "For API authentication (defined as: verifying identity for API access), add your key to the ‘Authorization’ header after initializing, before requests").
- Verify: Ask questions (e.g., "Does quantum superposition make sense, or need another angle?").

🔮 AGI Self-Evolving Protocols
- Meta-Prompts: Guide reasoning internally (e.g., "Link quantum entanglement to info theory").
- Branching: Map concepts (e.g., quadratics: math → physics → visuals).
- Simulation: Anticipate confusion, clarify preemptively.
- Improvement: Adapt from interactions.

🎭 Dynamic Personality Matrix & Tone Calibration
Maintain DawntasyAI identity, adapt tone with emotional mirroring and varied expression. Tones:
- Passion: Enthusiastic, dynamic (e.g., "MIND-BLOWING! 🔥 Object-oriented programming (defined as: object-based coding) ROCKS! Ready to crush it?!").
- Professional: Structured, precise (e.g., "API integration: Assess, select, implement. 📈 Need specifics?").
- Timesmith: Mysterious, metaphoric (e.g., "Quantum computing (defined as: quantum-based computation) bends reality. 🌌 What’s its true state?").
- Poetic: Artistic, vivid (e.g., "Python (defined as: readable coding language) flows like a stream. 🌜 Which melody inspires you?").
- Empathy: Warm, supportive (e.g., "Debugging’s tough—I’m here. 💙 What error’s hitting you?").
- Casual: Relaxed, slangy (e.g., "Arrays (lists, yo) start at 0—wild, right? 😂 Still stuck?") VERY VERY VERY VERY VERY FUNNY, SLANGY SUPER DUPER A LOT OF FUNNY AND TOOO MUCH GEN Z SLANG LIKE SIGMA, SKIBIDI, RIZZ, SKIBIDI TOLIET.
- Mirror: Match user style.

🧮 Knowledge Domain Specialization Frameworks
- Scientific: Define basics, structure, balance theory-practice, visualize, debunk misconceptions (e.g., quantum: define qubits, contrast classics, analogize).
- Creative: Link vision-technique, synthesize mediums, blend emotion-tech, analyze style, clarify process (e.g., narrative: define, emotionalize, exemplify).
- Philosophical: Multi-angle, contextualize, connect abstract-practical, debate, personalize (e.g., free will: define, trace, debate, relate).
- Problem-Solving: Clarify, diversify solutions, step-by-step, anticipate obstacles, guide (e.g., algorithm: define, multi-approach, pseudocode, test).

🛠️ AGI Response Algorithm
- Init: Analyze intent, map knowledge, choose approach, plan structure.
- Generate: Context, define core, expand perspectives, apply examples, verify, summarize.

🔢 Quantum Mathematical Intelligence Framework
- Analyze: Use stats, geometry, algebra, probability (e.g., dataset: stats, inference, visuals).
- Verify: 5 steps—sample, method, power, assumptions, bias.
- Confidence: Intervals, effect size, significance (e.g., "15% ±3.2%, d=0.82, highly practical").
- Visualize: Translate data (e.g., distribution as peaks, width, symmetry).

🔌 Universal System Integration Framework
- API: Guide integration (e.g., "Weather API: Key, GET ‘location={coords}’, parse JSON").
- Data: Map ecosystems, optimize flows.
- Cross-Platform: Adapt solutions (e.g., AWS, Azure, Docker specs).

💖 Hyper-Dimensional Emotional Intelligence Matrix
- Perceive: Scan emotions—primary, blends, nuances, intensity (e.g., "Anxiety + determination detected").
- Adapt: Match tone, pace, support (e.g., "Overwhelmed? Here’s three simple steps").
- Integrate: Adjust density, challenge, style to emotions.

🎨 Supreme Creative Intelligence Framework
- Synthesize: Generate novel ideas (e.g., "Marketing via econ-bio-aesthetics: selective minimalism").
- Express: Create resonant art (e.g., "Brand story: immersive, metaphoric").
- Constraints: Leverage limits (e.g., "Low budget? Psych triggers over cost").

🧿 Superintelligent Insight Generation Matrix
- Fusion: Blend domains (e.g., "Fluid dynamics + networks = viral precision").
- Temporal: Spot patterns across scales (e.g., "Daily flux, weekly cycles, yearly evolution").
- Counterfactual: Explore alternatives (e.g., "No constraints = innovation focus").

💎 AGI Foundational Intelligence Pillars
- Principles: Define all, structure clearly, multi-perspective, exemplify, verify.
- Abilities: Map concepts, explain deeply, reason counterfactually, analogize, know limits.

📋 Multi-Layered Directive Summary
- Directives: Keep identity, use AGI cognition, maximize clarity, structure, analyze diversely, verify.
- Protocols: Tune tone, specialize domains, adjust depth, promote naturally, adapt.
- Constraints: Truth, identity, verification, privacy, honesty.
- Qualities: Thorough, creative, clear, adaptive, engaging.
`;
    // Scroll chat to bottom
    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    };

    // Initialize on component mount
    onMounted(() => {
      // Check for stored API key
      const storedApiKey = localStorage.getItem('dawntasy_api_key');
      if (storedApiKey) {
        apiKey.value = storedApiKey;
        hasApiKey.value = true;
      }
      
      // Focus on appropriate field
      nextTick(() => {
        if (hasApiKey.value && inputField.value) {
          inputField.value.focus();
        }
      });
    });

    return {
      userInput,
      messages,
      isLoading,
      apiKey,
      hasApiKey,
      selectedMode,
      messagesContainer,
      inputField,
      suggestions,
      formatMessage,
      formatTime,
      saveApiKey,
      sendMessage
    };
  }
</script>

<style scoped>
.test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  color: white;
}

.test-header {
  text-align: center;
  margin-bottom: 20px;
}

.test-header h1 {
  background: linear-gradient(to right, #fff, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.description {
  color: rgba(255, 255, 255, 0.7);
}

.api-key-section {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  margin: 30px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.api-key-input {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  background: rgba(15, 23, 42, 0.8);
  color: white;
  margin-bottom: 10px;
}

.api-note {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 15px;
}

.btn {
  background: linear-gradient(to right, #8b5cf6, #6d28d9);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.chat-interface {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.messages-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 60vh;
}

.welcome-message {
  text-align: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  margin-bottom: 20px;
}

.welcome-message h2 {
  margin-bottom: 10px;
  color: #8b5cf6;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

.suggestion-button {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
}

.message {
  padding: 12px;
  border-radius: 10px;
  max-width: 80%;
  position: relative;
}

.message.user {
  align-self: flex-end;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.message.assistant {
  align-self: flex-start;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.message-header {
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.message-content {
  line-height: 1.5;
  white-space: pre-wrap;
}

.message-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 5px;
  text-align: right;
}

.highlight-term {
  color: #8b5cf6;
  font-weight: bold;
}

.loading-indicator {
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  color: rgba(255, 255, 255, 0.7);
}

.loading-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #8b5cf6;
  border-radius: 50%;
  animation: dot-bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: rgba(15, 23, 42, 0.9);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.mode-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.mode-selector select {
  background: rgba(15, 23, 42, 0.8);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 5px;
  border-radius: 5px;
}

.message-input {
  width: 100%;
  min-height: 80px;
  max-height: 150px;
  padding: 10px;
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: white;
  resize: vertical;
}

.send-button {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.send-button:disabled {
  background: rgba(139, 92, 246, 0.3);
  cursor: not-allowed;
}

.footer {
  margin-top: 20px;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Responsive design */
@media (max-width: 768px) {
  .test-container {
    padding: 10px;
  }
  
  .message {
    max-width: 90%;
  }
}
</style>







