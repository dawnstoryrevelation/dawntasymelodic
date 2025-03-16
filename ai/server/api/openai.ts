// src/server/api/openai.ts
import axios from 'axios';
import { ref } from 'vue';
import { serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/init';

// API Configuration updated for subdomain
const API_URL = import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const API_KEY_RAW = import.meta.env.VITE_OPENAI_API_KEY;
if (!API_KEY_RAW || typeof API_KEY_RAW !== 'string' || API_KEY_RAW.trim() === '') {
  throw new Error('OpenAI API key is missing or invalid');
}
const API_KEY = API_KEY_RAW.trim();
const API_PATH = '/api/openai'; // For proxied requests if needed
const DEFAULT_MODEL = 'gpt-4-turbo-preview';
const FALLBACK_MODEL = 'gpt-3.5-turbo';

export async function callOpenAI(messages: any[], model: string = DEFAULT_MODEL): Promise<string> {
  try {
    const response = await generateCompletion(
      messages[messages.length - 1].content,
      messages.slice(0, -1)
    );
    return response.content || '';
  } catch (error) {
    console.error('Error in callOpenAI:', error);
    throw error;
  }
}

// For external import compatibility
export function sendChatMessage(chatId: string, messages: any[]) {
  return generateCompletion(
    messages[messages.length - 1].content,
    messages.slice(0, -1)
  );
}

// Dawntasy system prompts
const Dawntasy_System_Prompt_QuantumAGI = `🌌 Core Identity & Hyperdimensional Purpose
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
- Casual: Relaxed, slangy (e.g., "Arrays (lists, yo) start at 0—wild, right? 😂 Still stuck?").
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

// Define the system prompts object
export const DAWNTASY_SYSTEM_PROMPTS = {
  default: Dawntasy_System_Prompt_QuantumAGI,
  professional: Dawntasy_System_Prompt_QuantumAGI,
  creative: Dawntasy_System_Prompt_QuantumAGI,
  archmage: Dawntasy_System_Prompt_QuantumAGI
};

// Types
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Custom error class for better error handling
class OpenAIError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'OpenAIError';
    this.status = status;
    this.data = data;
  }
}

const isLoading = ref(false);
const error = ref<string | null>(null);

// Get the appropriate system prompt based on user's plan
const getSystemPrompt = (mode: 'default' | 'archmage' | 'creative' = 'default') => {
  return DAWNTASY_SYSTEM_PROMPTS[mode] || DAWNTASY_SYSTEM_PROMPTS.default;
};

// Basic completion request
const generateCompletion = async (
  userMessage: string,
  chatHistory: ChatMessage[] = [],
  options = {
    mode: 'default' as 'default' | 'archmage' | 'creative',
    temperature: 0.7,
    maxTokens: 1000,
    userPlan: 'free' as 'free' | 'rift' | 'premium'
  }
): Promise<ChatMessage> => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const systemPrompt = getSystemPrompt(options.mode);
    
    const request: ChatRequest = {
      model: options.userPlan === 'rift' ? DEFAULT_MODEL : FALLBACK_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userMessage }
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens
    };
    
    const isProduction = import.meta.env.MODE === 'production';
    const apiEndpoint = isProduction ? API_PATH : API_URL;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await axios.post<ChatResponse>(
        apiEndpoint,
        request, // Use the correctly defined 'request' variable
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      return response.data.choices[0].message;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch (err: any) {
    console.error('OpenAI API error:', err);
    if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
      error.value = 'Request timed out. Please try again.';
    } else if (err.response) {
      error.value = `API Error (${err.response.status}): ${err.response.data.error?.message || 'Unknown error'}`;
      throw new OpenAIError(
        err.response.data.error?.message || 'Unknown error',
        err.response.status,
        err.response.data
      );
    } else {
      error.value = err.message || 'Network error';
    }
    throw err;
  } finally {
    isLoading.value = false;
  }
};

// Stream completions for real-time responses
const streamCompletion = async (
  userMessage: string,
  chatHistory: ChatMessage[] = [],
  options = {
    mode: 'default' as 'default' | 'archmage' | 'creative',
    temperature: 0.7,
    maxTokens: 1000,
    userPlan: 'free' as 'free' | 'rift' | 'premium',
    onChunk: (chunk: string) => {}
  }
): Promise<ChatMessage> => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const systemPrompt = getSystemPrompt(options.mode);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: userMessage }
    ];
    
    let model = options.userPlan === 'rift' ? DEFAULT_MODEL : FALLBACK_MODEL;
    
    const request: ChatRequest = {
      model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true
    };
    
    if (!API_KEY) {
      throw new Error('OpenAI API key is missing');
    }
    
    const isProduction = import.meta.env.MODE === 'production';
    const apiEndpoint = isProduction ? API_PATH : API_URL;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorData = await response.json();
        throw new OpenAIError(
          errorData.error?.message || 'Stream request failed',
          response.status,
          errorData
        );
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream reader not available');
      
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        while (buffer.includes('\n')) {
          const lineEnd = buffer.indexOf('\n');
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                options.onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }
      return { role: 'assistant', content: fullContent };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch (err: any) {
    console.error('OpenAI streaming error:', err);
    if (err.name === 'AbortError') {
      error.value = 'Request timed out. Please try again.';
    } else if (err instanceof OpenAIError) {
      error.value = `API Error (${err.status}): ${err.message}`;
    } else {
      error.value = err.message || 'Stream error';
    }
    throw err;
  } finally {
    isLoading.value = false;
  }
};

// Record chat interaction in Firestore
const recordChatInteraction = async (userId: string, messages: ChatMessage[]) => {
  try {
    if (!userId) return;
    const userChatsRef = doc(db, 'users', userId, 'chats', new Date().toISOString());
    await setDoc(userChatsRef, {
      timestamp: serverTimestamp(),
      messages,
      title: messages[1]?.content.slice(0, 50) + '...' || 'New Chat'
    });
  } catch (err) {
    console.error('Error recording chat:', err);
  }
};

// OpenAI service object
export const openaiService = {
  isLoading,
  error,
  generateCompletion,
  streamCompletion,
  recordChatInteraction
};

// For backward compatibility
export const useOpenAI = () => {
  return openaiService;
};
