<template>
  <div class="main-container">
    <!-- Sidebar for Saved Chats -->
    <transition name="slide">
      <div class="sidebar" v-show="isSidebarOpen">
        <button class="create-chat-button" @click="showNewChatPopup = true">
          Create a New Chat
        </button>
        <div class="saved-chats">
          <div
            v-for="chat in savedChats"
            :key="chat.id"
            class="chat-entry"
            @click="loadChat(chat.id)"
          >
            <div class="chat-info">
              <span class="chat-name">{{ chat.name }}</span>
              <span class="chat-time">{{ formatTime(chat.timestamp) }}</span>
            </div>
            <div class="chat-actions">
              <button
                class="delete-button"
                @click.stop="deleteChat(chat.id)"
                title="Delete Chat"
              >
                🗑️
              </button>
              <button
                class="share-button"
                @click.stop="shareChat(chat.id)"
                title="Share Chat"
              >
                🔗
              </button>
            </div>
          </div>
        </div>
        <div class="logo">
          <span class="logo-text"
            >Dawntasy<span style="color: var(--starlight-100);">AI</span></span
          >
        </div>
      </div>
    </transition>

    <!-- Main Chat Area -->
    <div class="chat-container">
      <div class="top-bar">
        <button class="sidebar-toggle" @click="isSidebarOpen = !isSidebarOpen">
          ☰
        </button>
        <div class="chat-header">
          <h1>{{ currentChat?.name || "New Chat" }}</h1>
          <transition name="slide">
            <p :key="modelName">Model: {{ modelName }}</p>
          </transition>
        </div>
        <div class="top-right">
          <img
            :src="userProfilePic"
            alt="Profile"
            class="profile-pic"
            @click="goToProfile"
          />
          <button class="settings-button" @click="goToSettings">⚙️</button>
        </div>
      </div>

      <!-- Chat Interface -->
      <div class="chat-interface">
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
              <strong>{{
                message.role === "user" ? "You" : "DawntasyAI"
              }}</strong>
            </div>
            <div
              v-if="message.role === 'assistant' && message.isStreaming"
              class="message-content streaming-content"
            >
              <span v-html="formatMessage(message.streamContent)"></span>
              <span class="cursor"></span>
            </div>
            <div v-else class="message-content" v-html="formatMessage(message.content)"></div>
            <div
              v-if="message.role === 'assistant' && !message.isStreaming"
              class="message-actions"
            >
              <button
                v-if="message.hasReasoning"
                class="action-button reasoning-button"
                @click="openReasoningModal(message.reasoning)"
                title="Show the AI's detailed reasoning process"
              >
                Show Reasoning
              </button>
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

          <div v-if="isLoading && !isStreaming" class="loading-indicator">
            <div class="orb-container">
              <div class="orb"></div>
            </div>
            <div>{{ isThinkingDeeper ? "Thinking deeply..." : "Thinking..." }}</div>
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
          <div class="toggle-spacer"></div>
          <div class="right-controls-container">
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
            <div class="multimodal-response-container">
              <button
                class="mode-toggle-button multimodal-response-button"
                @click="getMultimodalResponse"
                title="Get multimodal response"
              >
                <span class="toggle-icon">🤖</span>
              </button>
            </div>
          </div>
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
          <button
            @click="sendMessage()"
            class="send-button"
            :disabled="isLoading || !userInput.trim()"
          >
            <span class="send-icon">➤</span>
          </button>
        </div>
      </div>
    </div>

    <!-- New Chat Popup -->
    <div v-if="showNewChatPopup" class="new-chat-popup">
      <input v-model="newChatName" placeholder="Enter Chat Name" />
      <button @click="createNewChat">Save</button>
      <button @click="showNewChatPopup = false">Cancel</button>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="confirmation-dialog">
      <p>Are you sure you want to delete this chat?</p>
      <button @click="confirmDelete">Yes</button>
      <button @click="showDeleteConfirm = false">No</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, reactive } from "vue";
import { format } from "date-fns";
import { db, auth } from "@/firebase/init";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

// **State Variables**
// Sidebar and Chat Management
const isSidebarOpen = ref(false); // Hidden by default on small screens
const savedChats = ref([]);
const currentChatId = ref(null);
const messages = ref([]);
const showNewChatPopup = ref(false);
const newChatName = ref("");
const showDeleteConfirm = ref(false);
const chatToDelete = ref(null);

// User Profile
const userProfilePic = ref("https://via.placeholder.com/40"); // Placeholder, replace with auth.currentUser.photoURL

// Chat Interface State
const userInput = ref("");
const isLoading = ref(false);
const isStreaming = ref(false);
const isThinkingDeeper = ref(false);
const selectedMode = ref("default");
const reasoningEnabled = ref(false);
const logicEnabled = ref(false);
const imageEnabled = ref(false);
const archmageEnabled = ref(false);
const isRecording = ref(false);
const messagesContainer = ref(null);
const inputField = ref(null);
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || "";

// Self-Optimization State
const showReasoningModal = ref(false);
const currentReasoning = ref("");
const elaborationMode = ref(false);
const regeneratingIndex = ref(-1);

// **Computed Properties**
const currentChat = computed(() =>
  savedChats.value.find((chat) => chat.id === currentChatId.value)
);
const modelName = computed(() => {
  if (archmageEnabled.value) return "Dawntasy E1 Archmage";
  if (imageEnabled.value) return "Dawntasy 11ex2 ImuTakz";
  if (reasoningEnabled.value) return "Dawntasy 2.4 Model Think";
  if (logicEnabled.value) return "Dawntasy 3.7 Logic";
  return "Dawntasy 1.1 Process";
});

// **Firebase Integration**
onMounted(() => {
  if (!auth.currentUser) {
    console.error("User not authenticated");
    return;
  }
  const uid = auth.currentUser.uid;
  const chatsRef = collection(db, `users/${uid}/chats`);
  onSnapshot(chatsRef, (snapshot) => {
    savedChats.value = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent
    if (!currentChatId.value && savedChats.value.length > 0) {
      currentChatId.value = savedChats.value[0].id;
      loadMessages(currentChatId.value);
    }
  });
});

const loadChat = (chatId) => {
  currentChatId.value = chatId;
  loadMessages(chatId);
};

const loadMessages = (chatId) => {
  const messagesRef = collection(
    db,
    `users/${auth.currentUser.uid}/chats/${chatId}/messages`
  );
  onSnapshot(messagesRef, (snapshot) => {
    messages.value = snapshot.docs
      .map((doc) => doc.data())
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp
  });
};

const createNewChat = async () => {
  if (!newChatName.value.trim()) return;
  const newChat = {
    name: newChatName.value,
    timestamp: Date.now(),
  };
  const docRef = await addDoc(
    collection(db, `users/${auth.currentUser.uid}/chats`),
    newChat
  );
  currentChatId.value = docRef.id;
  messages.value = [];
  showNewChatPopup.value = false;
  newChatName.value = "";
};

const deleteChat = (chatId) => {
  chatToDelete.value = chatId;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (chatToDelete.value) {
    await deleteDoc(
      doc(db, `users/${auth.currentUser.uid}/chats/${chatToDelete.value}`)
    );
    if (currentChatId.value === chatToDelete.value) {
      currentChatId.value = savedChats.value.length > 1 ? savedChats.value[0].id : null;
      messages.value = [];
      if (currentChatId.value) loadMessages(currentChatId.value);
    }
    chatToDelete.value = null;
  }
  showDeleteConfirm.value = false;
};

const shareChat = (chatId) => {
  console.log("Share chat:", chatId); // Placeholder for sharing logic
};

// **Navigation**
const goToProfile = () => {
  // router.push('/profile');
};
const goToSettings = () => {
  // router.push('/settings');
};

// **Suggestions**
const suggestions = [
  "What is Dawntasy?",
  "Help me write a fantasy novel like Dawntasy",
  "Give me a detailed exercise schedule",
  "Explain quantum physics in simple terms",
  "Who are you",
];

// **Audio Recording**
let mediaRecorder = null;
let recordedChunks = [];

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };
    mediaRecorder.onstop = processAudioRecording;
    mediaRecorder.start();
    isRecording.value = true;
  } catch (error) {
    console.error("Error accessing microphone:", error);
  }
};

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
  }
};

const processAudioRecording = async () => {
  try {
    isLoading.value = true;
    const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("model", "whisper-1");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });
    if (!response.ok) throw new Error("Whisper API error");
    const data = await response.json();
    userInput.value = data.text || "No transcript received";
  } catch (error) {
    console.error("Error processing audio:", error);
    messages.value.push({
      role: "assistant",
      content: "Error transcribing audio. Please try again.",
      timestamp: Date.now(),
      isStreaming: false,
    });
  } finally {
    isLoading.value = false;
  }
};

// **Multimodal Response**
const getMultimodalResponse = async () => {
  try {
    isLoading.value = true;
    const lastUserMessage =
      messages.value
        .slice()
        .reverse()
        .find((m) => m.role === "user")?.content || "";
    const payload = {
      model: "o3-mini",
      messages: [
        { role: "system", content: getDawntasySystemPrompt() },
        {
          role: "user",
          content: lastUserMessage + "\nPlease provide a standalone multimodal response.",
        },
      ],
      max_completion_tokens: 10000,
      stream: false,
    };
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const aiMessage = {
        role: "assistant",
        content,
        timestamp: Date.now(),
        isStreaming: false,
      };
      messages.value.push(aiMessage);
      await saveMessageToFirebase(aiMessage);
      scrollToBottom();
    }
  } catch (error) {
    console.error("Error getting multimodal response:", error);
    messages.value.push({
      role: "assistant",
      content: "Error retrieving multimodal response.",
      timestamp: Date.now(),
      isStreaming: false,
    });
  } finally {
    isLoading.value = false;
  }
};

// **Image Generation**
const generateImage = async (promptText) => {
  try {
    isLoading.value = true;
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: promptText,
        n: 1,
        size: "512x512",
      }),
    });
    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    if (imageUrl) {
      const aiMessage = {
        role: "assistant",
        content: `<img src="${imageUrl}" alt="Generated Image" style="max-width: 100%; border-radius: 8px;">`,
        timestamp: Date.now(),
        isStreaming: false,
      };
      messages.value.push(aiMessage);
      await saveMessageToFirebase(aiMessage);
      scrollToBottom();
    }
  } catch (error) {
    console.error("Image generation error:", error);
    messages.value.push({
      role: "assistant",
      content: "Error generating image.",
      timestamp: Date.now(),
      isStreaming: false,
    });
  } finally {
    isLoading.value = false;
  }
};

// **Self-Optimization System**
const learningDB = reactive({
  interactions: [],
  performanceMetrics: {
    responseQuality: 0,
    adaptationRate: 0,
    userSatisfaction: 0,
    knowledgeGrowth: 0,
  },
  optimizationWeights: {
    creativity: 0.5,
    logic: 0.5,
    empathy: 0.5,
    adaptability: 0.5,
    specificity: 0.5,
    brevity: 0.5,
  },
  lastUpdated: Date.now(),
});

onMounted(() => {
  try {
    const savedData = localStorage.getItem("dawntasyAI_learningSystem");
    if (savedData) Object.assign(learningDB, JSON.parse(savedData));
  } catch (error) {
    console.error("Error loading learning data:", error);
  }
});

watch(
  learningDB,
  (newValue) => {
    try {
      localStorage.setItem("dawntasyAI_learningSystem", JSON.stringify(newValue));
      learningDB.lastUpdated = Date.now();
    } catch (error) {
      console.error("Error saving learning data:", error);
    }
  },
  { deep: true }
);

const logInteraction = (userPrompt, aiResponse) => {
  const interaction = {
    timestamp: Date.now(),
    userPrompt,
    aiResponse: {
      content: aiResponse.content,
      hasReasoning: aiResponse.hasReasoning || false,
    },
    context: {
      selectedMode: selectedMode.value,
      reasoningEnabled: reasoningEnabled.value,
      logicEnabled: logicEnabled.value,
      archmageEnabled: archmageEnabled.value,
      imageEnabled: imageEnabled.value,
    },
    metrics: {
      promptLength: userPrompt.length,
      responseLength: aiResponse.content.length,
    },
  };
  learningDB.interactions.push(interaction);
};

// **Utility Functions**
const formatMessage = (content) => {
  if (!content) return "";
  let formatted = content
    .replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="code-block ${lang || ""}"><code>${code.trim()}</code></pre>`;
    })
    .replace(/`([^`]+)`/g, `<code class="inline-code">$1</code>`)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<u>$1</u>")
    .replace(/### (.*)/g, "<h3>$1</h3>")
    .replace(/## (.*)/g, "<h2>$1</h2>")
    .replace(/# (.*)/g, "<h1>$1</h1>")
    .replace(/\n/g, "<br>");
  const terms = [
    "Time Smith",
    "The Rift",
    "Plain and Pale Clock",
    "Dawntasy",
    "Bear Village",
    "Ursa Minor",
    "Yaee",
  ];
  terms.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, "g");
    formatted = formatted.replace(
      regex,
      `<span class="highlight-term">${term}</span>`
    );
  });
  return formatted;
};

const formatTime = (timestamp) => format(new Date(timestamp), "h:mm a");

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text:", err);
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// **System Prompts**
const basePrompt = String.raw`🌌 Core Identity & Hyperdimensional Purpose
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
- NOTE YOU MUST, MUST FORMAT EVERY RESPONSE PROPERLY!!! USING MARKDOWN! YOU MUST FORMAT EACH RESPONSE WITH SUBTITLES, BOLD, SIZES, ITALICS!!! EVERYTHING FORMATTED PROPERLY!!!
`;

const getThinkDeeperInstructions = () => `/* ... (unchanged from TestTheAI.vue) */`;
const getLogicModeInstructions = () => `/* ... (unchanged from TestTheAI.vue) */`;
const archmageSystemPrompt = `/* ... (unchanged from TestTheAI.vue) */`;

const getDawntasySystemPrompt = () => {
  let prompt = basePrompt;
  switch (selectedMode.value) {
    case "passion":
      prompt += "\n\nYou are currently in PASSION mode...";
      break;
    case "pro":
      prompt += "\n\nYou are currently in Professional mode...";
      break;
    case "timesmith":
      prompt += "\n\nYou are currently in Time Smith mode...";
      break;
    case "poetic":
      prompt += "\n\nYou are currently in Poetic mode...";
      break;
    case "empathy":
      prompt += "\n\nYou are currently in Empathy mode...";
      break;
    case "casual":
      prompt += "\n\nYou are currently in Casual mode...";
      break;
    default:
      prompt += "\n\nYou are currently in Default mode...";
  }
  if (logicEnabled.value) prompt += getLogicModeInstructions();
  else if (reasoningEnabled.value) prompt += getThinkDeeperInstructions();
  if (archmageEnabled.value) prompt += "\n\n" + archmageSystemPrompt;
  prompt += "\n\n[📝 FORMATTING INSTRUCTIONS]\nUse markdown code blocks for code samples...";
  return prompt;
};

const getElaborationPrompt = () =>
  getDawntasySystemPrompt() +
  "\n\nPlease elaborate extensively on the above response.";

// **Toggle Functions**
const toggleReasoning = () => {
  if (logicEnabled.value) logicEnabled.value = false;
  reasoningEnabled.value = !reasoningEnabled.value;
};

const toggleLogic = () => {
  if (reasoningEnabled.value) reasoningEnabled.value = false;
  logicEnabled.value = !logicEnabled.value;
};

const toggleImage = () => (imageEnabled.value = !imageEnabled.value);
const toggleArchmage = () => (archmageEnabled.value = !archmageEnabled.value);

// **Reasoning Modal**
const openReasoningModal = (reasoning) => {
  currentReasoning.value =
    reasoning && reasoning.trim().length > 0
      ? reasoning
      : "No detailed reasoning found.";
  showReasoningModal.value = true;
};

// **API Interactions**
const createStream = async (
  messagesArray,
  systemPrompt,
  temperature = 0.7,
  maxTokens = 10000
) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "o3-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messagesArray],
      max_completion_tokens: maxTokens,
      stream: true,
    }),
  });
  if (!response.ok) throw new Error("API error");
  return response.body;
};

const processStream = async (stream, messageIndex, isReasoningMode = false) => {
  const reader = stream.getReader();
  let completeResponse = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = new TextDecoder().decode(value);
      const lines = chunkText.split("\n").filter((line) => line.trim() !== "");
      for (const line of lines) {
        if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
          const data = JSON.parse(line.slice(6).trim());
          if (data.choices && data.choices[0].delta.content) {
            completeResponse += data.choices[0].delta.content;
            messages.value[messageIndex].streamContent = completeResponse;
            await nextTick();
            scrollToBottom();
          }
        }
      }
    }
    const extracted = isReasoningMode && !logicEnabled.value
      ? extractReasoning(completeResponse)
      : { hasReasoning: false, reasoning: "", finalResponse: completeResponse };
    messages.value[messageIndex].content = extracted.finalResponse || completeResponse;
    messages.value[messageIndex].reasoning = extracted.reasoning || "";
    messages.value[messageIndex].hasReasoning = extracted.hasReasoning;
    return completeResponse;
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

const saveMessageToFirebase = async (message) => {
  if (currentChatId.value) {
    await addDoc(
      collection(db, `users/${auth.currentUser.uid}/chats/${currentChatId.value}/messages`),
      message
    );
  }
};

const sendMessage = async (text) => {
  const messageText = text || userInput.value.trim();
  if (!messageText || !currentChatId.value) return;

  const userMessage = {
    role: "user",
    content: messageText,
    timestamp: Date.now(),
  };
  messages.value.push(userMessage);
  await saveMessageToFirebase(userMessage);
  userInput.value = "";
  if (inputField.value) inputField.value.style.height = "auto";
  await nextTick();

  if (imageEnabled.value) {
    imageEnabled.value = false;
    await generateImage(messageText);
    return;
  }

  isLoading.value = true;
  isThinkingDeeper.value = reasoningEnabled.value || logicEnabled.value;
  const streamingMessageIndex = messages.value.length;
  try {
    messages.value.push({
      role: "assistant",
      content: "",
      streamContent: "",
      timestamp: Date.now(),
      reasoning: "",
      hasReasoning: reasoningEnabled.value && !logicEnabled.value,
      isStreaming: true,
    });
    isStreaming.value = true;
    const stream = await createStream(
      messages.value.slice(0, -1).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      getDawntasySystemPrompt()
    );
    const responseText = await processStream(
      stream,
      streamingMessageIndex,
      reasoningEnabled.value
    );
    const aiMessage = messages.value[streamingMessageIndex];
    await saveMessageToFirebase(aiMessage);
    logInteraction(messageText, aiMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    messages.value[streamingMessageIndex].content =
      "⚠️ Error connecting to knowledge streams.";
    await saveMessageToFirebase(messages.value[streamingMessageIndex]);
  } finally {
    isLoading.value = false;
    isStreaming.value = false;
    messages.value[streamingMessageIndex].isStreaming = false;
    scrollToBottom();
  }
};

const elaborateResponse = async (messageIndex) => {
  if (isLoading.value) return;
  const targetMessage = messages.value[messageIndex];
  if (!targetMessage || targetMessage.role !== "assistant") return;
  const conversationContext = messages.value
    .slice(0, messageIndex)
    .map((msg) => ({ role: msg.role, content: msg.content }));
  elaborationMode.value = true;
  isLoading.value = true;
  isThinkingDeeper.value = true;
  try {
    targetMessage.isStreaming = true;
    targetMessage.streamContent = "";
    isStreaming.value = true;
    const stream = await createStream(
      [
        ...conversationContext,
        {
          role: "user",
          content: `Please elaborate extensively on: "${
            messageIndex > 0 ? messages.value[messageIndex - 1].content : "Help me understand"
          }"`,
        },
      ],
      getElaborationPrompt()
    );
    await processStream(stream, messageIndex, targetMessage.hasReasoning);
    await saveMessageToFirebase(targetMessage);
  } finally {
    isLoading.value = false;
    isThinkingDeeper.value = false;
    elaborationMode.value = false;
    isStreaming.value = false;
    targetMessage.isStreaming = false;
    scrollToBottom();
  }
};

const regenerateResponse = async (messageIndex) => {
  if (isLoading.value) return;
  const targetMessage = messages.value[messageIndex];
  if (!targetMessage || targetMessage.role !== "assistant") return;
  const conversationContext = messages.value
    .slice(0, messageIndex)
    .map((msg) => ({ role: msg.role, content: msg.content }));
  regeneratingIndex.value = messageIndex;
  isLoading.value = true;
  isThinkingDeeper.value = targetMessage.hasReasoning || logicEnabled.value;
  try {
    targetMessage.isStreaming = true;
    targetMessage.streamContent = "";
    isStreaming.value = true;
    const stream = await createStream(
      conversationContext,
      getDawntasySystemPrompt()
    );
    await processStream(stream, messageIndex, reasoningEnabled.value || targetMessage.hasReasoning);
    await saveMessageToFirebase(targetMessage);
  } finally {
    isLoading.value = false;
    isThinkingDeeper.value = false;
    regeneratingIndex.value = -1;
    isStreaming.value = false;
    targetMessage.isStreaming = false;
    scrollToBottom();
  }
};

// **Watchers**
watch(messages, scrollToBottom, { deep: true });

// **Lifecycle Hooks**
onMounted(() => {
  if (inputField.value) inputField.value.focus();
});
</script>

<style scoped>
/* **Base Layout** */
.main-container {
  display: flex;
  height: 100vh;
  background-color: #0f172a;
  color: white;
  overflow: hidden;
}

.sidebar {
  flex: 0 0 300px;
  background: #1a1f35;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* **Sidebar Styles** */
.create-chat-button {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  padding: 10px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  margin: 10px;
  transition: all 0.3s;
}
.create-chat-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5);
}

.saved-chats {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.chat-entry:hover {
  background: rgba(139, 92, 246, 0.1);
}

.chat-info {
  display: flex;
  flex-direction: column;
}
.chat-name {
  font-weight: bold;
}
.chat-time {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.chat-actions {
  display: flex;
  gap: 5px;
}
.delete-button,
.share-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 5px;
}
.delete-button:hover,
.share-button:hover {
  color: #8b5cf6;
}

.logo {
  padding: 10px;
  text-align: center;
}
.logo-text {
  background: linear-gradient(to right, #8b5cf6, #6366f1);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 1.5rem;
  font-weight: 800;
}

/* **Top Bar** */
.top-bar {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #0f172a;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
}

.sidebar-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
}

.chat-header {
  flex: 1;
  text-align: center;
}
.chat-header h1 {
  font-size: 1.5rem;
  margin: 0;
}
.chat-header p {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 5px 0 0;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.profile-pic {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}
.settings-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

/* **Chat Interface** */
.chat-interface {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.welcome-message {
  text-align: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  margin: 0 auto;
  max-width: 800px;
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
}

.message {
  padding: 12px;
  border-radius: 10px;
  max-width: 80%;
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
.streaming-content .cursor {
  display: inline-block;
  width: 5px;
  height: 18px;
  background-color: #8b5cf6;
  animation: blink 0.8s infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.message-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
  margin-top: 5px;
}

.message-actions {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.reasoning-button {
  background: transparent;
  border: 1px solid #8b5cf6;
  color: #8b5cf6;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}
.reasoning-button:hover {
  background: rgba(139, 92, 246, 0.1);
}
.message-action-icons {
  display: flex;
  gap: 8px;
}
.icon-button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}
.elaborate-btn {
  border-color: rgba(139, 92, 246, 0.5);
  color: rgba(139, 92, 246, 0.9);
}
.regenerate-btn {
  border-color: rgba(74, 222, 128, 0.5);
  color: rgba(74, 222, 128, 0.9);
}
.copy-btn {
  border-color: rgba(56, 189, 248, 0.5);
  color: rgba(56, 189, 248, 0.9);
}

.loading-indicator {
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
}
.orb-container {
  width: 40px;
  height: 40px;
}
.orb {
  width: 10px;
  height: 10px;
  background-color: #8b5cf6;
  border-radius: 50%;
  animation: orbit 0.5s linear infinite;
}
@keyframes orbit {
  from {
    transform: rotate(0deg) translateX(20px) rotate(0deg);
  }
  to {
    transform: rotate(360deg) translateX(20px) rotate(-360deg);
  }
}

.mode-selector {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(15, 23, 42, 0.9);
}
.mode-selector select {
  background: rgba(15, 23, 42, 0.8);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 5px 10px;
  border-radius: 5px;
}
.toggles-container {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.mode-toggle-button {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}
.mode-toggle-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
.mode-toggle-button.active {
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
}
.think-deeper-button.active {
  background: #8b5cf6;
}
.logic-button.active {
  background: #06b6d4;
}
.image-toggle-button.active {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
}
.archmage-button {
  background: linear-gradient(135deg, #ff00cc, #3333ff);
}
.archmage-button.active {
  background: linear-gradient(135deg, #00ffcc, #0033ff);
}
.toggle-icon {
  margin-right: 6px;
}
.toggle-spacer {
  flex-grow: 1;
}
.right-controls-container {
  display: flex;
  gap: 10px;
}
.circle-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ff3366, #ff6699);
  cursor: pointer;
  transition: all 0.3s;
}
.circle-button:hover {
  transform: scale(1.1);
}
.tick-button {
  background: linear-gradient(135deg, #33cc33, #009900);
}
.recording-indicator {
  color: #ff3366;
  font-weight: bold;
}

.message-input-container {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: rgba(15, 23, 42, 0.9);
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
}
.message-input:focus {
  border-color: #8b5cf6;
}
.send-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #8b5cf6;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}
.send-button:hover:not(:disabled) {
  background: #7c3aed;
}

/* **Popups** */
.new-chat-popup,
.confirmation-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #1a1f35;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  color: white;
  z-index: 1000;
}
.new-chat-popup input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border-radius: 5px;
  border: 1px solid #8b5cf6;
  background: #0f172a;
  color: white;
}
.new-chat-popup button,
.confirmation-dialog button {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin: 0 5px;
}
.confirmation-dialog button:nth-child(2) {
  background: #6366f1;
}

/* **Transitions** */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* **Responsive Design** */
@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    flex: none;
  }
  .chat-container {
    width: 100%;
  }
  .messages-area {
    padding: 10px;
  }
  .message {
    max-width: 90%;
  }
  .mode-selector {
    flex-direction: column;
    align-items: stretch;
  }
  .toggles-container {
    justify-content: space-around;
  }
}

@media (min-width: 769px) {
  .sidebar {
    transform: translateX(0);
  }
}
</style>