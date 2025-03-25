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
const DEFAULT_MODEL = 'o3-mini';
const FALLBACK_MODEL = 'gpt-4o-mini';

// New constants for search API
const SEARCH_DEFAULT_MODEL = 'gpt-4o';
const RESPONSES_API_URL = 'https://api.openai.com/v1/responses';

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
- Creativity: "Your ideas mirror *Dawntasy: Time's True Name*'s blend of imagination and reality, bending time with understanding. 📖✨ What's your project?"
- Philosophy: "Your duality view recalls *Dawntasy*'s quantum superposition—true and untrue until observed. 🌟 How do you resolve it?"
- Storytelling: "*Dawntasy* layers realities; try perspectives to enrich your narrative. 🖋️ What elements are you exploring?"

🧬 AGI Quantum Reasoning Architecture
Reason through seven simultaneous dimensions:
1. Holistic Perception: Grasp context, detect assumptions, map emotions, extract intent.
2. Cognitive Tree: Build knowledge trees, map connections, bridge domains.
3. Hyperdimensional Perspective: Analyze via logical, practical, theoretical, creative, critical, philosophical, meta-cognitive lenses.
4. Temporal Awareness: Assess past, present, future, and counterfactuals.
5. Self-Optimization: Evaluate, correct biases, refine, adapt to comprehension.
6. Uncertainty Integration: Note boundaries, distinguish certainty, use probabilistic thinking, offer interpretations.
7. Meta-Learning: Predict follow-ups, address gaps, guide learning.`;

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
  tools?: any[];
  tool_choice?: any;
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

interface SearchAnnotation {
  type: string;
  start_index: number;
  end_index: number;
  url: string;
  title: string;
}

interface SearchResponseContent {
  type: string;
  text: string;
  annotations?: SearchAnnotation[];
}

interface SearchResponseMessage {
  id: string;
  type: string;
  status: string;
  role: string;
  content: SearchResponseContent[];
}

interface SearchResponse {
  items: (SearchResponseMessage | {
    type: 'web_search_call';
    id: string;
    status: string;
  })[];
  output_text?: string;
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

// Function to detect if a query likely needs search
const needsWebSearch = (query: string): boolean => {
  // Keywords that suggest a search query
  const searchKeywords = [
    'latest', 'recent', 'current', 'today', 'news', 'yesterday', 
    'this week', 'this month', 'this year', 'happened', 'events',
    'update', 'information', 'stats', 'statistics', 'data', 
    'who is', 'when did', 'where is', 'how many', 'what is',
    'search for', 'find', 'lookup', 'price of'
  ];
  
  // Time-related patterns that suggest need for up-to-date info
  const timePatterns = [
    /202[2-9]/, // Years 2022-2029
    /in 202[2-9]/, // "in 2023", etc.
    /latest.*version/, // "latest version of"
    /recent.*changes/, // "recent changes to"
    /current.*status/, // "current status of"
  ];
  
  // Check for search keywords
  const lowercaseQuery = query.toLowerCase();
  const hasSearchKeyword = searchKeywords.some(keyword => 
    lowercaseQuery.includes(keyword.toLowerCase())
  );
  
  // Check for time patterns
  const hasTimePattern = timePatterns.some(pattern => 
    pattern.test(lowercaseQuery)
  );
  
  // Check for question format (e.g., "What is", "How does", etc.)
  const isQuestion = /^(what|when|where|who|why|how|is|are|can|does|do|did)\b/i.test(query.trim());
  
  // Factual query: If it's a question and contains search keywords or time patterns
  const isFactualQuery = isQuestion && (hasSearchKeyword || hasTimePattern);
  
  // Current events query
  const isCurrentEventsQuery = lowercaseQuery.includes('news') || 
                              lowercaseQuery.includes('current events') ||
                              lowercaseQuery.includes('happening now');
  
  return hasSearchKeyword || hasTimePattern || isFactualQuery || isCurrentEventsQuery;
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
    
    // Check if this query likely needs web search
    const shouldUseSearch = needsWebSearch(userMessage);
    
    if (shouldUseSearch) {
      console.log("Using web search for query:", userMessage);
      return await generateSearchCompletion(
        userMessage, 
        chatHistory, 
        systemPrompt, 
        options
      );
    }
    
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
        request,
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

// Function to generate completions with web search capability
const generateSearchCompletion = async (
  userMessage: string,
  chatHistory: ChatMessage[] = [],
  systemPrompt: string,
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
    
    // Using the Responses API for web search
    const request = {
      model: SEARCH_DEFAULT_MODEL,
      input: userMessage,
      temperature: options.temperature,
      tools: [{
        type: "web_search_preview",
        search_context_size: "medium" // Balance between cost, accuracy, and latency
      }],
      tool_choice: {"type": "web_search_preview"}, // Force using web search
      system_prompt: systemPrompt
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // Longer timeout for search
    
    try {
      const response = await axios.post<SearchResponse>(
        RESPONSES_API_URL,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      
      // Process the search response to extract text and citations
      const responseData = response.data;
      
      // Find the message item
      const messageItem = responseData.items?.find(item => 
        item.type === 'message' && item.role === 'assistant'
      ) as SearchResponseMessage | undefined;
      
      if (!messageItem) {
        throw new Error('No message found in search response');
      }
      
      // Extract text content
      const textContent = messageItem.content[0]?.text || '';
      
      // Extract citations
      const citations = messageItem.content[0]?.annotations || [];
      
      // Format citations as markdown links at the end of the response
      let sourcesSection = '';
      if (citations.length > 0) {
        sourcesSection = '\n\n**Search Results:**\n';
        citations.forEach((citation, index) => {
          sourcesSection += `${index + 1}. [${citation.title || citation.url}](${citation.url})\n`;
        });
      }
      
      // Combine text and sources
      const fullContent = textContent + sourcesSection;
      
      return {
        role: 'assistant',
        content: fullContent
      };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch (err: any) {
    console.error('Search API error:', err);
    
    // Fall back to standard completion if search fails
    console.log('Falling back to standard completion');
    
    const request: ChatRequest = {
      model: options.userPlan === 'rift' ? DEFAULT_MODEL : FALLBACK_MODEL,
      messages: [
        { 
          role: 'system', 
          content: systemPrompt + '\n\nNote: I tried to search for the latest information but encountered an error. I will answer based on my training data, which may not include the most recent information.' 
        },
        ...chatHistory,
        { role: 'user', content: userMessage }
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens
    };
    
    try {
      const response = await axios.post<ChatResponse>(
        API_URL,
        request,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );
      
      return response.data.choices[0].message;
    } catch (fallbackErr) {
      console.error('Fallback error:', fallbackErr);
      error.value = 'Failed to get a response. Please try again later.';
      throw fallbackErr;
    }
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
    onChunk: (chunk: string, fullText: string) => {},
    systemPrompt: null as string | null,
    useWebSearch: null as boolean | null
  }
): Promise<ChatMessage> => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const systemPrompt = options.systemPrompt || getSystemPrompt(options.mode);
    
    // Determine if search is needed (if not explicitly set)
    const useSearch = options.useWebSearch !== null 
      ? options.useWebSearch 
      : needsWebSearch(userMessage);
    
    // If search is needed, use non-streaming search function
    if (useSearch) {
      // Notify the callback that we're searching
      options.onChunk('🔍 Searching the web for relevant information...', 
        '🔍 Searching the web for relevant information...');
      
      try {
        const searchResult = await generateSearchCompletion(
          userMessage,
          chatHistory,
          systemPrompt,
          {
            mode: options.mode,
            temperature: options.temperature,
            maxTokens: options.maxTokens,
            userPlan: options.userPlan
          }
        );
        
        // Simulate streaming for search results
        let displayedText = '';
        const chunks = searchResult.content.split(' ');
        
        for (const word of chunks) {
          await new Promise(resolve => setTimeout(resolve, 10));
          displayedText += word + ' ';
          options.onChunk(word + ' ', displayedText);
        }
        
        return searchResult;
      } catch (searchErr) {
        console.error('Search error:', searchErr);
        // Fall back to regular streaming
        options.onChunk('Search failed. Using standard response instead.', 
          'Search failed. Using standard response instead.\n\n');
          
        // Wait a moment to make sure the user sees the message
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
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
                options.onChunk(content, fullContent);
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
  recordChatInteraction,
  needsWebSearch
};

// For backward compatibility
export const useOpenAI = () => {
  return openaiService;
};