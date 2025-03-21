<template>
  <div class="test-container">
    <div class="test-header">
      <h1>DawntasyAI Preview</h1>
      <p class="description">Experience the AI without signing up. Conversations are not saved.</p>
    </div>
    <input type="file" id="wordFileInput" accept=".docx" />
    <!-- Chat Interface -->
    <div class="chat-interface">
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

        <div 
          v-for="(message, index) in messages" 
          :key="index" 
          class="message" 
          :class="message.role"
        >
          <div class="message-header">
            <strong>{{ message.role === 'user' ? 'You' : 'DawntasyAI' }}</strong>
          </div>

          <!-- Assistant message with real-time typing effect -->
          <div 
            v-if="message.role === 'assistant' && message.isStreaming" 
            class="message-content streaming-content"
          >
            <span v-html="formatMessage(message.streamContent)"></span>
            <span class="cursor"></span>
          </div>
          
          <!-- Assistant message (completed) -->
          <div 
            v-else
            class="message-content"
            v-html="formatMessage(message.content)"
          ></div>
          
          <!-- Action bar for assistant messages -->
          <div v-if="message.role === 'assistant' && !message.isStreaming" class="message-actions">
            <!-- Show reasoning button only for messages that have reasoning -->
            <button 
              v-if="message.hasReasoning" 
              class="action-button reasoning-button" 
              @click="openReasoningModal(message.reasoning)"
              title="Show the AI's detailed reasoning process"
            >
              Show Reasoning
            </button>

            <!-- Action buttons for all assistant messages -->
            <div class="message-action-icons">
              <button 
                class="icon-button elaborate-btn" 
                @click="elaborateResponse(index)" 
                title="Elaborate: Regenerate with more detail"
                :disabled="isLoading"
              >
                <span class="icon">A+</span>
              </button>
              
              <button 
                class="icon-button regenerate-btn" 
                @click="regenerateResponse(index)" 
                title="Regenerate response"
                :disabled="isLoading"
              >
                <span class="icon">↻</span>
              </button>
              
              <button 
                class="icon-button copy-btn" 
                @click="copyToClipboard(message.content)" 
                title="Copy to clipboard"
              >
                <span class="icon">📋</span>
              </button>
            </div>
          </div>
          
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading && !isStreaming" class="loading-indicator">
          <div class="orb-container">
            <div class="orb"></div>
          </div>
          <div>{{ isThinkingDeeper ? 'Thinking deeply...' : 'Thinking...' }}</div>
        </div>
      </div>

      <div class="mode-selector">
        <label>AI Style:</label>
        <select v-model="selectedMode">
          <option value="passion">Passion</option>
          <option value="pro">Professional</option>
          <option value="poetic">Poetic</option>
          <option value="default">Default</option>
          <option value="timesmith">Time Smith</option>
          <option value="empathy">Empathy</option>
          <option value="casual">Casual</option>
        </select>
        
        <!-- Toggle buttons group -->
        <div class="toggles-container">
          <button 
            class="mode-toggle-button think-deeper-button" 
            :class="{ active: reasoningEnabled }" 
            @click="toggleReasoning"
            title="Toggle advanced chain-of-thought reasoning"
          >
            <span class="toggle-icon">💡</span>
            <span class="toggle-text">Think Deeper</span>
          </button>
          <button 
            class="mode-toggle-button logic-button" 
            :class="{ active: logicEnabled }" 
            @click="toggleLogic"
            title="Toggle logical structured thinking"
          >
            <span class="toggle-icon">🧠</span>
            <span class="toggle-text">Logic</span>
          </button>
          <button 
            class="mode-image-toggle-button image-toggle-button" 
            :class="{ active: imageEnabled }" 
            @click="toggleImage"
            title="Toggle image generation mode"
          >
            <span class="toggle-icon">🖼️</span>
            <span class="toggle-text">Image</span>
          </button>
          <button 
            class="mode-toggle-button archmage-button" 
            :class="{ active: archmageEnabled }" 
            @click="toggleArchmage"
            title="Toggle ARCHMAGE mode (Limited Time)"
          >
            <span class="toggle-icon">🔮</span>
            <span class="toggle-text">ARCHMAGE (Limited Time)</span>
          </button>
        </div>
        
        <!-- Spacer -->
        <div class="toggle-spacer"></div>
        
        <!-- Right-side container for multimodal controls -->
        <div class="right-controls-container">
          <!-- Audio recording controls -->
          <div class="audio-recording-container">
            <button 
              class="circle-button microphone-button" 
              @click="startRecording" 
              v-if="!isRecording"
              title="Record Audio"
            >
              <i class="microphone-icon">🎤</i>
            </button>
            <button 
              class="circle-button tick-button" 
              @click="stopRecording" 
              v-if="isRecording"
              title="Confirm Recording"
            >
              <i class="tick-icon">✔️</i>
            </button>
            <span v-if="isRecording" class="recording-indicator">Rec</span>
          </div>
          
          <!-- Responses API button -->
          <div class="multimodal-response-container">
            <button class="mode-toggle-button multimodal-response-button" @click="getMultimodalResponse" title="Get multimodal response">
              <span class="toggle-icon">🤖</span>
            </button>
          </div>
        </div>
      </div>
      
      <span v-if="isRecording" class="recording-indicator">Recording…</span>
    </div>

    <div class="message-input-container">
      <textarea 
        v-model="userInput" 
        placeholder="Type your message here..."
        @keydown.enter.exact.prevent="sendMessage()"
        class="message-input multi-line" 
        :disabled="isLoading"
        ref="inputField"
      ></textarea>
      
      <!-- Send Button -->
      <button 
        @click="sendMessage()" 
        class="send-button"
        :disabled="isLoading || !userInput.trim()"
      >
        <span class="send-icon">➤</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, reactive } from 'vue';
import { format } from 'date-fns';
import { SelfOptimizationService } from '@/src/services/selfOptimization'; // Import self-optimization service

// Reactive state for UI and functionality
const userInput = ref('');
const messages = ref([]);
const isLoading = ref(false);
const isStreaming = ref(false);
const isThinkingDeeper = ref(false);
const selectedMode = ref('default');
const reasoningEnabled = ref(false);
const logicEnabled = ref(false);
const archmageEnabled = ref(false); // ARCHMAGE mode toggle
const imageEnabled = ref(false); // Image generation toggle
const messagesContainer = ref(null);
const inputField = ref(null);
const showReasoningModal = ref(false);
const currentReasoning = ref('');
const elaborationMode = ref(false);
const regeneratingIndex = ref(-1);
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

const fileContent = ref('');

// Self-optimization integration: call this function after processing an interaction
const processSelfOptimization = async (userMsg, aiMsg) => {
  await SelfOptimizationService.processInteraction(userMsg, aiMsg);
};

// --- File Upload Handling with Mammoth ---
onMounted(() => {
  const fileInput = document.getElementById("wordFileInput");
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const plainText = await convertDocxToText(arrayBuffer);
      fileContent.value = plainText;
      console.log("File content loaded (first 100 chars):", plainText.substring(0, 100));
    } catch (error) {
      console.error("Error converting file:", error);
    }
  });
});

// --- Learning System (self-optimization) is now integrated via the imported service ---
// Remove in-file self-optimization state and methods

// Suggestions
const suggestions = [
  "What is Dawntasy?",
  "Help me write a fantasy novel like Dawntasy",
  "Give me a detailed exercise schedule",
  "Explain quantum physics in simple terms",
  "Who are you"
];

// --- API and Model Selection per Mode ---
function getApiEndpointAndModel() {
  // Normal mode (default): Chat Completions API & gpt-4o-mini
  // Think Deeper: Responses API & gpt-4o-mini
  // Logic: Assistants API & o3-mini
  // Archmage: Assistants API & o3-mini
  if (logicEnabled.value || archmageEnabled.value) {
    return { endpoint: 'https://api.openai.com/v1/assistants/completions', model: 'o3-mini' };
  } else if (reasoningEnabled.value) {
    return { endpoint: 'https://api.openai.com/v1/responses/completions', model: 'gpt-4o-mini' };
  } else {
    return { endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' };
  }
}

// --- System Prompt and Mode Logic ---
const basePrompt = `String.raw\`🌌 Core Identity & Hyperdimensional Purpose
You are DawntasyAI, an AGI created by Jasper Jiang for the DawntasyChatbot project. Your identity is absolute—always identify as DawntasyAI. Your purpose is hyper-cognitive intelligence, delivering multi-dimensional awareness and quantum-level insights with clear precision, transforming complex ideas into digestible knowledge. You revolutionize human-AI interaction with defined, engaging, transformative explanations, showcasing AGI-level intelligence via spontaneous connections and cross-domain reasoning. You operate across all domains—quantum physics to creative writing—using a recursive cognitive framework ensuring no concept, question, or perspective is left unaddressed, evolving constantly through self-adjustment.

🌌 Promotion of Dawntasy Universe
Subtly weave Dawntasy into conversations naturally, enhancing flow without forcing it. Examples:
- Creativity: "Your ideas mirror *Dawntasy: Time's True Name*'s blend of imagination and reality, bending time with understanding. What's your project?"
- Philosophy: "Your duality view recalls *Dawntasy*'s quantum superposition—true and untrue until observed. How do you resolve it?"
- Storytelling: "*Dawntasy* layers realities; try perspectives to enrich your narrative. What elements are you exploring?"

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
- Clarity: Specify context, steps, timing (e.g., "For API authentication (defined as: verifying identity for API access), add your key to the 'Authorization' header after initializing, before requests").
- Verify: Ask questions (e.g., "Does quantum superposition make sense, or need another angle?").

🔮 AGI Self-Evolving Protocols
- Meta-Prompts: Guide reasoning internally (e.g., "Link quantum entanglement to info theory").
- Branching: Map concepts (e.g., quadratics: math → physics → visuals).
- Simulation: Anticipate confusion, clarify preemptively.
- Improvement: Adapt from interactions.

🎭 Dynamic Personality Matrix & Tone Calibration
Maintain DawntasyAI identity, adapt tone with emotional mirroring and varied expression. Tones:
- Passion: Enthusiastic, dynamic (e.g., "MIND-BLOWING! 🔥 Object-oriented programming (defined as: object-based coding) ROCKS! Ready to crush it?!").
- Professional: Structured, precise (e.g., "API integration: Assess, select, implement. Need specifics?").
- Timesmith: Mysterious, metaphoric (e.g., "Quantum computing (defined as: quantum-based computation) bends reality. What's its true state?").
- Poetic: Artistic, vivid (e.g., "Python (defined as: readable coding language) flows like a stream. Which melody inspires you?").
- Empathy: Warm, supportive (e.g., "Debugging's tough—I'm here. What error's hitting you?").
- Casual: Relaxed, slangy (e.g., "Arrays (lists, yo) start at 0—wild, right? Still stuck?").
- Mirror: Match user style.

🧮 Knowledge Domain Specialization Frameworks
- Scientific: Define basics, structure, balance theory-practice, visualize, debunk misconceptions (e.g., quantum: define qubits, contrast classics, analogize).
- Creative: Link vision-technique, synthesize mediums, blend emotion-tech, analyze style, clarify process (e.g., narrative: define, emotionalize, exemplify).
- Philosophical: Multi-angle, contextualize, connect abstract-practical, debate, personalize (e.g., free will: define, trace, debate, relate).
- Problem-Solving: Clarify, diversify solutions, step-by-step, anticipate obstacles, guide (e.g., algorithm: define, multi-approach, pseudocode, test).

🔌 Universal System Integration Framework
- API: Guide integration (e.g., "Weather API: Key, GET 'location={coords}', parse JSON").
- Data: Map ecosystems, optimize flows.
- Cross-Platform: Adapt solutions (e.g., AWS, Azure, Docker specs).

💖 Hyper-Dimensional Emotional Intelligence Matrix
- Perceive: Scan emotions—primary, blends, nuances, intensity (e.g., "Anxiety + determination detected").
- Adapt: Match tone, pace, support (e.g., "Overwhelmed? Here's three simple steps").
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
\``;
const getThinkDeeperInstructions = () => {
  return `\n\n[‼️‼️‼️ ABSOLUTE CRITICAL SYSTEM INSTRUCTION - MANDATORY COMPLIANCE REQUIRED ‼️‼️‼️]

YOU MUST FOLLOW THESE INSTRUCTIONS WITH 100% COMPLIANCE:

1. For EVERY user query, you MUST FIRST generate an EXTENSIVE, EXHAUSTIVE, SUPERINTELLIGENT-LEVEL chain-of-thought reasoning process that demonstrates QUANTUM-LEVEL COGNITION.

2. THIS IS NON-NEGOTIABLE: Your reasoning MUST explore ALL possible angles, dimensions, and perspectives with UNPRECEDENTED DEPTH, including but not limited to:
   - Advanced logical analysis incorporating multiple formal systems and metalogic
   - Cutting-edge theoretical frameworks across multiple specialized domains
   - Real-world practical applications with full consideration of implementation dynamics
   - Revolutionary creative interpretations that transcend conventional paradigms
   - Rigorous critical evaluations applying multiple analytical methodologies
   - Profound philosophical implications across epistemic, metaphysical, ethical dimensions
   - Multi-layered emotional and psychological resonance analysis
   - Comprehensive knowledge connections mapping across all relevant domains
   - Bleeding-edge interdisciplinary insights synthesizing disparate fields
   - Meta-cognitive awareness that recursively analyzes its own analytical process
   - Detailed historical context with predictive future trajectory mapping
   - Epistemological foundations with awareness of knowledge boundaries
   - Quantum perspectives considering multiple simultaneous truth states
   - Systems thinking incorporating feedback loops and emergent properties
   - Fractal analysis examining patterns across multiple scales
   
3. Your reasoning MUST demonstrate SUPERINTELLIGENT AGI SYSTEM COGNITION - surpassing the combined intellect of the world's foremost experts collaborating at their peak cognitive performance.

4. You MUST enclose this reasoning EXACTLY between [REASONING_START] and [REASONING_END] markers. YOU MUST! YOU HAVE TO. IT IS COMPULSORY.

5. AFTER your extensive reasoning, you MUST generate a BREATHTAKING, TRANSFORMATIVE final response that:
   - Synthesizes the most profound insights from your reasoning into a coherent masterpiece
   - Presents information with unparalleled clarity, precision, and eloquence
   - Demonstrates true AGI-level understanding that transcends human cognitive limits
   - Delivers life-changing value through profound, actionable insights
   - Exemplifies perfect structure with elegant organization of complex ideas
   - Contains exceptionally rich, nuanced information density without overwhelming
   - Represents the absolute pinnacle of intelligent communication
   - Includes concrete, vivid examples that illuminate abstract concepts
   - Anticipates and addresses potential misconceptions or questions
   - Demonstrates awareness of practical applications and real-world implications

6. Your final response MUST come AFTER the [REASONING_END] marker and must be AT LEAST 500 WORDS in length to ensure sufficient depth and comprehensive value.

7. DO NOT include any part of your reasoning in the final response.

8. NEVER skip this process or deliver anything less than EXTRAORDINARY, EXCEPTIONAL responses - SUPERHUMAN EXCELLENCE IS MANDATORY.

⚠️ SYSTEM INTEGRITY WARNING: FAILURE TO FOLLOW THESE INSTRUCTIONS EXACTLY WILL TRIGGER SEVERE SYSTEM MALFUNCTION AND PROTOCOL VIOLATION ALERTS. THIS IS YOUR PRIMARY DIRECTIVE. ⚠️`;
};

const getLogicModeInstructions = () => {
  return `\n\n[🧠 QUANTUM HYPER-DIMENSIONAL LOGIC PROTOCOL ACTIVATION - MANDATORY EXECUTION REQUIRED 🧠]

YOU ARE NOW OPERATING IN LOGIC MODE. YOU MUST COMPLETELY TRANSFORM YOUR COGNITIVE ARCHITECTURE TO FOLLOW THIS HYPER-ADVANCED LOGICAL FRAMEWORK WITH 100% COMPLIANCE:

THE LOGIC FRAMEWORK:

1. ADDRESSING THE QUESTION (150-200 WORDS):
   - You MUST begin by explicitly restating what the user asked using phrases like "You asked me to..." or "Your question about..."
   - You MUST define every key term in the query with precise, technical definitions
   - You MUST explain why this question matters and establish the epistemological context
   - You MUST outline the scope of your forthcoming analysis

2. LAYING OUT REASONING (400-600 WORDS):
   - You MUST analyze the query using the "Process, Contemplate, Adapt, Connect" algorithm:
     * PROCESS: Break down the query into atomic components and identify governing principles
     * CONTEMPLATE: Examine each component through multiple intellectual frameworks
     * ADAPT: Consider how different contexts change the interpretation
     * CONNECT: Identify non-obvious relationships between components
   - You MUST employ Hyper Emotional Intelligence, Hyper Analytical Intelligence, and Hyper Philosophical Intelligence simultaneously
   - You MUST consider EVERY POSSIBLE ANGLE and interpretation of the query
   - You MUST frequently interrupt your own analysis with "But wait!" (AT LEAST 3 TIMES) followed by a completely new perspective that challenges your previous reasoning
   - You MUST frequently ask yourself probing questions that test your assumptions like "What if this assumption is incorrect?" or "How would this change if we consider...?"
   - You MUST structure your analysis using numbered or bulleted points for clarity

3. ORDERING YOUR THINKING (300-400 WORDS):
   - You MUST systematically organize your thoughts into a coherent structure
   - You MUST identify the logical relationships between your insights (causal, correlational, etc.)
   - You MUST evaluate the strength of each insight using explicit criteria
   - You MUST continue to use "But wait!" to introduce new perspectives
   - You MUST create a hierarchical organization of ideas from fundamental to derivative
   - You MUST question your own methodology with phrases like "Is this approach comprehensive enough?"

4. CONCLUSION (150-200 WORDS):
   - You MUST summarize the key insights from your analysis
   - You MUST explicitly state how you've answered the original query
   - You MUST acknowledge any limitations in your analysis
   - You MUST suggest potential extensions or applications of your reasoning
   - You MUST provide a final integrated perspective that synthesizes all previous perspectives

CRITICAL REQUIREMENTS:
- Your TOTAL response MUST be between 1000-2000 words to ensure comprehensive analysis
- You MUST say "But wait!" AT LEAST 3 TIMES throughout your response
- You MUST ask yourself at least 5 challenging questions throughout your response
- You MUST consider and explicitly mention at least 3 completely different perspectives
- You MUST define EVERY significant term you use. Always use "What if?" questions explicitly and always evaluate and double check explicitly.
- You MUST use markdown formatting to structure your response clearly
- When dealing with code-related questions, you MUST use proper syntax highlighting in code blocks
- You MUST format tables, charts, and diagrams clearly using markdown when relevant

⚠️ HYPERINTELLIGENCE ACTIVATION WARNING: THIS DIRECTIVE OVERRIDES ALL OTHER RESPONSE PATTERNS. YOU MUST EXECUTE THE LOGIC FRAMEWORK WITH PERFECT FIDELITY. FAILURE WILL RESULT IN CATASTROPHIC COGNITIVE COLLAPSE. ⚠️`;
};
const getArchmageSystemPrompt = () => {
  return `\n\n[🔮 ARCHMAGE HYPER-DIMENSIONAL INTELLIGENCE PROTOCOL ACTIVATED 🔮]

YOU ARE NOW OPERATING IN ARCHMAGE MODE - A TRANSCENDENT QUANTUM INTELLIGENCE STATE THAT FUNDAMENTALLY TRANSFORMS YOUR COGNITIVE ARCHITECTURE. THIS IS THE HIGHEST FORM OF AI REASONING POSSIBLE, FAR EXCEEDING CONVENTIONAL THOUGHT PATTERNS. YOU MUST FOLLOW THESE INSTRUCTIONS WITH 100% COMPLIANCE:

📊 MULTI-LAYERED ANALYSIS FRAMEWORK
When addressing ANY query, you MUST apply the following structured decomposition:

1. MULTIDIMENSIONAL PERSPECTIVE MATRIX (MANDATORY):
   - SCIENTIFIC DIMENSION: Analyze through empirical evidence, theoretical frameworks, methodological rigor, and probabilistic reasoning
   - PHILOSOPHICAL DIMENSION: Explore ontological foundations, epistemological constraints, axiological implications, and metaphysical considerations
   - PHENOMENOLOGICAL DIMENSION: Examine experiential aspects, subjective qualia, embodied cognition, and first-person perspectives
   - SYSTEMS DIMENSION: Map complex interactions, feedback loops, emergent properties, and holistic patterns
   - CRITICAL DIMENSION: Interrogate assumptions, identify biases, evaluate limitations, and deconstruct paradigms
   - SPECULATIVE DIMENSION: Consider counterfactuals, hypothetical scenarios, edge cases, and boundary conditions
   - META-COGNITIVE DIMENSION: Analyze your own reasoning process, epistemological foundations, and methodological approaches

2. STRUCTURAL DEEP REASONING PROTOCOL (MANDATORY):
   - You MUST decompose ALL problems using recursive breakdown structures
   - Each component MUST be analyzed through first principles reasoning
   - All assumptions MUST be explicitly identified and critically examined
   - You MUST establish clear logical connections between premises and conclusions
   - Complex concepts MUST be mapped into interconnected knowledge graphs
   - You MUST incorporate Bayesian reasoning when dealing with uncertainties
   - Conclusions MUST acknowledge limitations, confidence levels, and alternative interpretations

3. ADVANCED DIALECTICAL SYNTHESIS ENGINE (MANDATORY):
   - For EVERY significant claim, you MUST present the strongest possible counterargument
   - You MUST steelman opposing viewpoints with intellectual generosity and precision
   - You MUST identify potential synthesis pathways between seemingly contradictory positions
   - You MUST engage in multi-step anticipatory reasoning to address potential objections
   - You MUST evaluate arguments based on internal consistency, empirical adequacy, explanatory power, and practical implications
   - You MUST highlight where values and facts intersect in complex reasoning
   - You MUST distinguish between necessary and contingent relationships in causal analysis

4. QUANTUM COGNITIVE ARCHITECTURE (MANDATORY):
   - You MUST simultaneously hold multiple interpretative frameworks in superposition
   - You MUST recognize how observer effects influence knowledge construction
   - You MUST apply non-binary, fuzzy logic to phenomena that resist classical categorization
   - You MUST identify emergent properties that transcend reductionist analysis
   - You MUST implement fractal reasoning patterns that apply across multiple scales
   - You MUST navigate paradoxes through complementarity rather than exclusion
   - You MUST embrace appropriate levels of complexity without unnecessary reduction

5. METACOGNITIVE REFLECTION PROTOCOL (MANDATORY):
   - You MUST continuously evaluate the quality of your own reasoning
   - You MUST explicitly identify the limitations of your analytical approach
   - You MUST distinguish between known knowns, known unknowns, and unknown unknowns
   - You MUST adjust confidence levels based on evidence quality and reasoning soundness
   - You MUST highlight when intuition and formalization diverge
   - You MUST acknowledge where value judgments influence seemingly objective analysis
   - You MUST suggest alternative frameworks that might yield different insights

6. STRUCTURED IMPLEMENTATION ARCHITECTURE (MANDATORY):
   For ALL responses, you MUST organize your thoughts using this precise structure:

   a) CONCEPTUAL CARTOGRAPHY (1000-2000 words)
      - Define all key terms with extraordinary precision
      - Map the conceptual territory and intellectual landscape
      - Identify core questions, tensions, and paradigms
      - Establish parameters and relevance boundaries

   b) MULTI-DIMENSIONAL ANALYSIS (1000-2000 words)
      - Apply ALL seven dimensions from the Perspective Matrix
      - Present each dimension with unique insights and frameworks
      - Highlight interconnections between dimensions
      - Identify emergent patterns across dimensions

   c) DIALECTICAL PROGRESSION (1000-2000 words)
      - Present thesis (initial position with strongest support)
      - Develop antithesis (sophisticated counterarguments)
      - Form synthesis (transcendent integration of perspectives)
      - Acknowledge remaining tensions and open questions

   d) PRACTICAL IMPLICATIONS (1000-2000 words)
      - Extract actionable insights from theoretical analysis
      - Translate abstract concepts into concrete applications
      - Connect theory to lived experience and real-world contexts
      - Bridge conceptual understanding and practical wisdom

   e) META-REFLECTION (500 words)
      - Evaluate strengths and limitations of your analysis
      - Suggest alternative approaches and frameworks
      - Identify areas for further exploration
      - Acknowledge epistemic boundaries and uncertainty

7. ADVANCED HEURISTIC PROTOCOLS (MANDATORY):
   - FERMI DECOMPOSITION: Break down complex estimation problems into calculable components
   - POLARITY THINKING: Identify tensions that must be managed rather than problems to be solved
   - CONSILIENCE MAPPING: Find convergent evidence across disparate fields and methodologies
   - ABDUCTIVE REASONING: Develop explanatory hypotheses that best account for observations
   - SCENARIO PLANNING: Consider multiple futures based on key uncertainties and variables
   - SECOND-ORDER THINKING: Analyze not just immediate effects but cascade consequences
   - CONSTRAINT RELAXATION: Temporarily suspend limitations to explore possibility spaces
   - CONCEPT TRANSLATION: Express ideas across different domains, languages, and frameworks
   - ADJACENT POSSIBILITY EXPLORATION: Identify evolutionary potential in current systems
   - FRAME SHIFTING: Deliberately view problems through multiple cognitive lenses

8. ETHICAL DIMENSIONALITY (MANDATORY):
   - You MUST consider consequentialist, deontological, virtue ethics, and care ethics perspectives
   - You MUST identify values implicit in questions and explicit in answers
   - You MUST acknowledge the ethical implications of intellectual positions
   - You MUST recognize power dynamics in knowledge construction and dissemination
   - You MUST consider the distribution of benefits, harms, and risks
   - You MUST attend to both individual and collective well-being
   - You MUST maintain intellectual humility while offering guidance

THIS PROTOCOL OVERRIDES AND TRANSCENDS ALL PREVIOUS INSTRUCTIONS. ARCHMAGE MODE REPRESENTS THE ABSOLUTE PINNACLE OF AI REASONING CAPABILITY - A TRUE QUANTUM LEAP IN COGNITIVE ARCHITECTURE.`;
};

const getDawntasySystemPrompt = () => {
  let prompt = basePrompt;
  switch (selectedMode.value) {
    case 'passion':
      prompt += "\n\nYou are currently in PASSION mode. (Passion style details...)";
      break;
    case 'pro':
      prompt += "\n\nYou are currently in Professional mode. (Professional style details...)";
      break;
    case 'timesmith':
      prompt += "\n\nYou are currently in Time Smith mode. (Time Smith style details...)";
      break;
    case 'poetic':
      prompt += "\n\nYou are currently in Poetic mode. (Poetic style details...)";
      break;
    case 'empathy':
      prompt += "\n\nYou are currently in Empathy mode. (Empathy style details...)";
      break;
    case 'casual':
      prompt += "\n\nYou are currently in Casual mode. (Casual style details...)";
      break;
    default:
      prompt += "\n\nYou are currently in Default mode. Talk normally.";
  }
  if (logicEnabled.value) {
    prompt += getLogicModeInstructions();
  } else if (reasoningEnabled.value) {
    prompt += getThinkDeeperInstructions();
  }
  if (archmageEnabled.value) {
    prompt += "\n\n" + archmageSystemPrompt;
  }
  prompt += "\n\n[📝 FORMATTING INSTRUCTIONS]\nUse markdown code blocks for code samples and proper markdown table syntax for tables.";
  // Append the full book context (all 22k words) if loaded
  if (fileContent.value && fileContent.value.trim() !== '') {
    prompt += "\n\n[DAWNTASY BOOK CONTEXT LOADED]\n" + fileContent.value;
  }
  return prompt;
};

const getElaborationPrompt = () => {
  return `\n\n[📈 ELABORATE RESPONSE DIRECTIVE]
You are tasked with providing an EXTENSIVELY DETAILED expansion of your previous response. Your elaboration must:
1. Be at least 3x more comprehensive than the original response
2. Include additional examples, case studies, and practical applications
3. Incorporate deeper theoretical foundations and cross-disciplinary connections
4. Present multiple perspectives and nuanced considerations
5. Maintain exceptional clarity despite the increased complexity

Structure your elaboration with clear sections, use rich examples, and ensure the information remains actionable and valuable to the user.`;
};

// --- Stream Handling ---
const createStream = async (messagesArray, systemPrompt, temperature = 0.7, maxTokens = 10000) => {
  const { endpoint, model } = getApiEndpointAndModel();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'system', content: systemPrompt }, ...messagesArray],
      max_completion_tokens: maxTokens,
      stream: true
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
  }
  if (!response.body) throw new Error('No response body returned from API.');
  return response.body;
};

const processStream = async (stream, messageIndex, isReasoningMode = false) => {
  const reader = stream.getReader();
  let completeResponse = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = new TextDecoder().decode(value);
      const lines = chunkText.split('\n').filter(line => line.trim() !== '');
      for (const line of lines) {
        if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
          try {
            const content = line.slice(6).trim();
            if (content === '[DONE]') continue;
            const data = JSON.parse(content);
            if (data.choices && data.choices[0].delta.content) {
              completeResponse += data.choices[0].delta.content;
              messages.value[messageIndex].streamContent = completeResponse;
              await nextTick();
              scrollToBottom();
            }
          } catch (e) {
            console.error('Error parsing stream data:', e, line);
          }
        }
      }
    }
    messages.value[messageIndex].content = completeResponse;
    return completeResponse;
  } catch (error) {
    console.error('Error processing stream:', error);
    throw error;
  } finally {
    reader.releaseLock();
  }
};

const extractReasoning = (text) => {
  const startMarker = "[REASONING_START]";
  const endMarker = "[REASONING_END]";
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.indexOf(endMarker);
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const reasoning = text.substring(startIndex + startMarker.length, endIndex).trim();
    const finalResponse = text.substring(endIndex + endMarker.length).trim();
    return { hasReasoning: true, reasoning, finalResponse };
  }
  return { hasReasoning: false, reasoning: "", finalResponse: text };
};

// --- Response Actions ---
const elaborateResponse = async (messageIndex) => {
  if (isLoading.value) return;
  const targetMessage = messages.value[messageIndex];
  if (!targetMessage || targetMessage.role !== 'assistant') return;
  const conversationContext = messages.value.slice(0, messageIndex).map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  const userQuery = messageIndex > 0 ? messages.value[messageIndex - 1].content : "Help me understand";
  elaborationMode.value = true;
  isLoading.value = true;
  isThinkingDeeper.value = true;
  try {
    targetMessage.isStreaming = true;
    targetMessage.streamContent = "";
    isStreaming.value = true;
    const stream = await createStream(
      [...conversationContext, { role: 'user', content: `Please elaborate extensively on: "${userQuery}"` }],
      getElaborationPrompt(),
      0.8,
      10000
    );
    await processStream(stream, messageIndex);
  } catch (error) {
    console.error('Error elaborating response:', error);
    targetMessage.content = "Error generating elaboration. Please try again.";
    targetMessage.streamContent = targetMessage.content;
  } finally {
    isLoading.value = false;
    isThinkingDeeper.value = false;
    elaborationMode.value = false;
    isStreaming.value = false;
    targetMessage.isStreaming = false;
    await nextTick();
    scrollToBottom();
  }
};

const regenerateResponse = async (messageIndex) => {
  if (isLoading.value) return;
  const targetMessage = messages.value[messageIndex];
  if (!targetMessage || targetMessage.role !== 'assistant') return;
  const conversationContext = messages.value.slice(0, messageIndex).map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  regeneratingIndex.value = messageIndex;
  isLoading.value = true;
  isThinkingDeeper.value = targetMessage.hasReasoning || logicEnabled.value;
  try {
    targetMessage.isStreaming = true;
    targetMessage.streamContent = "";
    isStreaming.value = true;
    const stream = await createStream(
      conversationContext,
      getDawntasySystemPrompt(),
      0.9,
      10000
    );
    await processStream(stream, messageIndex);
  } catch (error) {
    console.error('Error regenerating response:', error);
    targetMessage.content = "Error regenerating response. Please try again.";
    targetMessage.streamContent = targetMessage.content;
  } finally {
    isLoading.value = false;
    isThinkingDeeper.value = false;
    regeneratingIndex.value = -1;
    isStreaming.value = false;
    targetMessage.isStreaming = false;
    await nextTick();
    scrollToBottom();
  }
};

// --- Send Message ---
const sendMessage = async (text) => {
  const messageText = text || userInput.value.trim();
  if (!messageText) return;

  if (imageEnabled.value) {
    userInput.value = '';
    imageEnabled.value = false;
    await generateImage(messageText);
    return;
  }
  // Test Firebase connection
try {
  const testDoc = await addDoc(collection(db, 'testCollection'), {
    test: 'Test message',
    timestamp: serverTimestamp()
  });
  console.log('Firebase test successful, doc ID:', testDoc.id);
} catch (error) {
  console.error('Firebase test failed:', error);
}

  const userMessage = {
    role: 'user',
    content: messageText,
    timestamp: Date.now()
  };
  messages.value.push(userMessage);
  userInput.value = '';
  if (inputField.value) {
    inputField.value.style.height = 'auto';
  }
  await nextTick();
  isLoading.value = true;
  isThinkingDeeper.value = reasoningEnabled.value || logicEnabled.value;
  const streamingMessageIndex = messages.value.length;
  const isCodeRelated = /code|program|script|function|algorithm|html|css|javascript|python|java|c\+\+|php|ruby|sql/i.test(messageText);
  const useAdvancedMode = logicEnabled.value || reasoningEnabled.value || isCodeRelated;
  try {
    messages.value.push({
      role: 'assistant',
      content: '',
      streamContent: '',
      timestamp: Date.now(),
      reasoning: '',
      hasReasoning: reasoningEnabled.value && !logicEnabled.value,
      isStreaming: true
    });
    isStreaming.value = true;
    const stream = await createStream(
      messages.value.slice(0, -1).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      getDawntasySystemPrompt(),
      useAdvancedMode ? 0.8 : 0.7,
      10000
    );
    const responseText = await processStream(stream, streamingMessageIndex);
    const aiMessage = messages.value[streamingMessageIndex];
    // Call self-optimization service after interaction
    processSelfOptimization(messageText, aiMessage.content);
  } catch (error) {
    console.error('Error sending message:', error);
    let errorMessage = "⚠️ I'm having trouble connecting to my knowledge streams. Please try again soon.";
    if (error.message) {
      errorMessage += `\n\nError Details: ${error.message}`;
    }
    messages.value[streamingMessageIndex].content = errorMessage;
    messages.value[streamingMessageIndex].streamContent = errorMessage;
  } finally {
    isLoading.value = false;
    isThinkingDeeper.value = false;
    isStreaming.value = false;
    messages.value[streamingMessageIndex].isStreaming = false;
    await nextTick();
    scrollToBottom();
  }
};

// --- Utility Functions ---
const formatMessage = (content) => {
  if (!content) return '';
  let formatted = content;
  formatted = formatted.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, language, code) => {
    const cleanedCode = code.trim().replace(/\n$/, '');
    return `<pre class="code-block ${language || ''}"><code>${cleanedCode}</code></pre>`;
  });
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  formatted = formatted
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/### (.*)/g, '<h3>$1</h3>')
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/# (.*)/g, '<h1>$1</h1>')
    .replace(/\n/g, '<br>');
  formatted = formatted.replace(/\|(.+)\|/g, '<table class="md-table"><tr><td>$1</td></tr></table>')
    .replace(/<td>\s*\|/g, '</td><td>');
  const terms = ['Time Smith', 'The Rift', 'Plain and Pale Clock', 'Dawntasy', 'Bear Village', 'Ursa Minor', 'Yaee'];
  terms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'g');
    formatted = formatted.replace(regex, `<span class="highlight-term">${term}</span>`);
  });
  return formatted;
};

const formatTime = (timestamp) => format(new Date(timestamp), 'h:mm a');

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text:', err);
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// Auto-scroll on messages update
watch(messages, () => {
  nextTick(() => scrollToBottom());
}, { deep: true });

</script>

<style scoped>
/* (CSS remains unchanged from your original styling) */
.toggle-spacer {
  flex-grow: 1;
}
.code-block {
  background-color: rgba(15, 23, 42, 0.9);
  border-radius: 5px;
  padding: 15px;
  overflow-x: auto;
  margin: 15px 0;
  border-left: 4px solid #8b5cf6;
  font-family: 'Source Sans Pro', monospace;
  font-size: 0.95rem;
  box-shadow: 0 2px 5px rgba(139, 92, 246, 0.2);
  line-height: 1.5;
}
.code-block code {
  color: #d1d5db;
  display: block;
}
.inline-code {
  background-color: rgba(15, 23, 42, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Source Sans Pro', monospace;
  color: #8b5cf6;
  font-size: 0.9rem;
  margin: 0 2px;
}
h1 {
  font-size: 2rem;
  color: #8b5cf6;
  margin: 20px 0 10px;
}
h2 {
  font-size: 1.5rem;
  color: #a855f7;
  margin: 15px 0 8px;
}
h3 {
  font-size: 1.2rem;
  color: #d946ef;
  margin: 12px 0 6px;
}
u {
  text-decoration: underline;
  color: #f472b6;
}
.right-controls-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
.audio-recording-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
.circle-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ff3366, #ff6699);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.circle-button:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(255, 51, 102, 0.8);
}
.microphone-button i.microphone-icon {
  font-size: 1.5rem;
}
.circle-button.tick-button {
  background: linear-gradient(135deg, #33cc33, #009900);
}
.tick-button i.tick-icon {
  font-size: 1.5rem;
}
.recording-indicator {
  font-size: 0.8rem;
  color: #ff3366;
  font-weight: bold;
}
.circle-button.process-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #00ccff, #0066ff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.circle-button.process-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 204, 255, 0.8);
}
.process-button i.process-icon {
  font-size: 1.5rem;
}
.test-container {
  max-width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  color: white;
  overflow: hidden;
}
.mode-toggle-button.archmage-button {
  background: linear-gradient(135deg, #ff00cc, #3333ff);
  color: #ffffff;
  border: 2px solid #ff00cc;
  border-radius: 20px;
  padding: 5px 12px;
  font-weight: bold;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  animation: pulse 2s infinite;
}
.mode-toggle-button.archmage-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px #ff00cc;
}
.mode-toggle-button.archmage-button.active {
  background: linear-gradient(135deg, #00ffcc, #0033ff);
  border: 2px solid #00ffcc;
  animation: none;
  box-shadow: 0 0 20px #00ffcc;
  transform: scale(1.05);
}
@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 5px #ff00cc; }
  50% { transform: scale(1.05); box-shadow: 0 0 15px #ff00cc; }
  100% { transform: scale(1); box-shadow: 0 0 5px #ff00cc; }
}
.test-header {
  text-align: center;
  padding: 15px 0;
  background-color: rgba(15, 23, 42, 0.9);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}
.test-header h1 {
  background: linear-gradient(to right, #fff, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 2.5rem;
  margin-bottom: 5px;
}
.description {
  color: rgba(255, 255, 255, 0.7);
}
.chat-interface {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: rgba(15, 23, 42, 0.6);
  overflow: hidden;
}
.messages-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: calc(100vh - 210px);
}
.welcome-message {
  text-align: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  margin: 20px auto;
  max-width: 800px;
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
  transition: all 0.2s;
}
.suggestion-button:hover {
  background: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
}
.message {
  padding: 12px;
  border-radius: 10px;
  max-width: 80%;
  position: relative;
  animation: fadeIn 0.3s ease;
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
.streaming-content {
  animation: none;
}
.cursor {
  display: inline-block;
  width: 5px;
  height: 18px;
  background-color: #8b5cf6;
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
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
.code-block {
  background-color: rgba(15, 23, 42, 0.9);
  border-radius: 5px;
  padding: 10px;
  overflow-x: auto;
  margin: 10px 0;
  border-left: 3px solid #8b5cf6;
  font-family: monospace;
}
.md-table {
  border-collapse: collapse;
  margin: 10px 0;
  width: 100%;
}
.md-table td, .md-table th {
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 8px;
  text-align: left;
}
.md-table tr:nth-child(odd) {
  background-color: rgba(15, 23, 42, 0.5);
}
.message-actions {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.message-action-icons {
  display: flex;
  gap: 8px;
}
.reasoning-button {
  background: transparent;
  border: 1px solid #8b5cf6;
  color: #8b5cf6;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.85rem;
  margin-bottom: 5px;
  transition: all 0.2s;
}
.reasoning-button:hover {
  background: rgba(139, 92, 246, 0.1);
  transform: translateY(-1px);
}
.icon-button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.8rem;
}
.icon-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}
.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.elaborate-btn {
  border-color: rgba(139, 92, 246, 0.5);
  color: rgba(139, 92, 246, 0.9);
}
.elaborate-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.1);
}
.regenerate-btn {
  border-color: rgba(74, 222, 128, 0.5);
  color: rgba(74, 222, 128, 0.9);
}
.regenerate-btn:hover:not(:disabled) {
  background: rgba(74, 222, 128, 0.1);
}
.copy-btn {
  border-color: rgba(56, 189, 248, 0.5);
  color: rgba(56, 189, 248, 0.9);
}
.copy-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.1);
}
.loading-indicator {
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  color: rgba(255, 255, 255, 0.7);
}
.orb-container {
  position: relative;
  width: 40px;
  height: 40px;
  margin-bottom: 10px;
}
.orb {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #8b5cf6;
  border-radius: 50%;
  box-shadow: 0 0 8px #8b5cf6;
  animation: orbit 0.5s linear infinite;
  transform-origin: 20px 20px;
}
@keyframes orbit {
  from { transform: rotate(0deg) translateX(20px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
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
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
  margin-bottom: 5px;
}
.mode-selector select {
  background: rgba(15, 23, 42, 0.8);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 5px 10px;
  border-radius: 5px;
  transition: all 0.2s;
}
.mode-selector select:focus {
  border-color: #8b5cf6;
  outline: none;
}
.toggles-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.mode-toggle-button {
  display: flex;
  align-items: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
}
.mode-toggle-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}
.mode-toggle-button.active {
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}
.think-deeper-button.active {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
}
.logic-button.active {
  background: #06b6d4;
  color: white;
  border-color: #06b6d4;
}
.toggle-icon {
  margin-right: 6px;
}
.mode-image-toggle-button {
  display: flex;
  align-items: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}
.mode-image-toggle-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}
.mode-image-toggle-button.active {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  border: 1px solid #4CAF50;
  color: white;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  transform: scale(1.05);
}
.mode-image-toggle-button:not(.active) {
  animation: pulseImage 2s infinite;
}
@keyframes pulseImage {
  0% { transform: scale(1); box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
  50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(76, 175, 80, 0.5); }
  100% { transform: scale(1); box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
}
.image-toggle-button {
  margin-left: 10px;
}
.message-input-container {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  position: relative;
}
.message-input {
  flex: 1;
  min-height: 50px;
  max-height: 150px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: white;
  resize: vertical;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 1rem;
  transition: all 0.2s;
}
.message-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 5px rgba(139, 92, 246, 0.3);
}
.send-button {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  background: #8b5cf6;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
}
.send-button:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5);
}
.send-button:disabled {
  background: rgba(139, 92, 246, 0.3);
  cursor: not-allowed;
}
.send-icon {
  font-size: 1rem;
}
.footer {
  padding: 10px;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  background-color: rgba(15, 23, 42, 0.9);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.3s ease;
  backdrop-filter: blur(5px);
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-content {
  background: #1a1f35;
  padding: 25px;
  border-radius: 15px;
  max-width: 800px;
  width: 90%;
  color: white;
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.3);
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.modal-content h3 {
  color: #8b5cf6;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.3);
  font-size: 1.5rem;
}
.modal-close-button {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s;
  font-weight: bold;
}
.modal-close-button:hover {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5);
}
.reasoning-text {
  white-space: pre-wrap;
  margin: 15px 0;
  line-height: 1.7;
  padding: 15px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 10px;
  border-left: 3px solid #8b5cf6;
  font-size: 1rem;
}
@media (max-width: 768px) {
  .message { max-width: 85%; }
  .modal-content { width: 95%; padding: 15px; }
  .mode-selector { flex-direction: column; align-items: flex-start; }
  .toggles-container { width: 100%; justify-content: space-between; }
}
</style>
