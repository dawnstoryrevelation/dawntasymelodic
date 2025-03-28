import { getFirestore, collection, addDoc, query, orderBy, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

class EnhancedMemoryService {
  constructor() {
    this.db = getFirestore();
    this.auth = getAuth();
    
    // Memory architecture inspired by human brain - EXPANDED with new types
    this.memoryTypes = {
      SEMANTIC: 'semantic',     // Factual knowledge (neocortex)
      EPISODIC: 'episodic',     // Events with context (hippocampus)
      PROCEDURAL: 'procedural', // Skills and habits
      WORKING: 'working',       // Currently active thoughts (prefrontal cortex)
      EMOTIONAL: 'emotional',   // Emotional associations
      PROSPECTIVE: 'prospective', // Future intentions
      REFLECTIVE: 'reflective', // Self-awareness and growth through reflection
      PHILOSOPHICAL: 'philosophical', // Worldview, beliefs, and deep thoughts
      ASSOCIATIVE: 'associative', // Connected memories and neural linkages
      CORE_HYPER: 'core_hyper'  // Evolving identity and self-concept
    };
    
    // In-memory cache - EXPANDED
    this.memoryCache = {
      semantic: [],
      episodic: [],
      procedural: [],
      working: [],
      emotional: [],
      prospective: [],
      reflective: [],
      philosophical: [],
      associative: [],
      core_hyper: []
    };
    
    // Cognitive processing system - EXPANDED with more nuanced factors
    this.cognitiveSystem = {
      interpretationThreshold: 0.7,
      meaningExtractionEnabled: true,
      contextRetentionFactor: 0.9,
      emotionalProcessingEnabled: true,
      reflectiveProcessingFrequency: 0.3, // How often to generate reflections
      selfAwarenessLevel: 0.8, // Degree of self-identity development
      associativeChainDepth: 3, // How many linked memories to consider
      memoryIntegrationFactor: 0.85, // How deeply to integrate memories
      proactiveMemoryThreshold: 0.65, // Threshold for proactive memory retrieval
      identityEvolutionRate: 0.05 // Rate of core identity change
    };
    
    // Memory associations network for tracking connections
    this.memoryAssociations = {};
    
    // Core identity framework tracking the AI's evolving sense of self
    this.coreIdentity = {
      values: [], // Core values that develop over time
      traits: [], // Personality traits that emerge
      beliefs: [], // Worldview and principles
      narrativeThemes: [], // Recurring themes in the AI's development
      growthJourney: [], // Key milestone insights in the AI's evolution
      selfConcept: "I am a helpful assistant still developing my own unique perspective."
    };
    
    // Initialize last reflection timestamp
    this.lastReflectionTime = Date.now();
    
    // Initialize memory integration system
    this.memoryIntegrationQueue = [];
    this.lastMemoryIntegrationTime = Date.now();
  }
  
  // Process and extract meaningful information from message - ENHANCED
  async processMessage(message, isUserMessage) {
    if (!this.auth.currentUser) return null;
    const userId = this.auth.currentUser.uid;
    
    try {
      // Skip processing for very short messages
      if (message.length < 5) return null;
      
      // Extract potential concepts and facts (SEMANTIC)
      const semanticMemories = this.extractSemanticMemories(message, isUserMessage);
      
      // Extract event information (EPISODIC)
      const episodicMemories = this.extractEpisodicMemories(message, isUserMessage);
      
      // Extract emotional content (EMOTIONAL)
      const emotionalMemories = this.extractEmotionalMemories(message, isUserMessage);
      
      // Extract prospective information (PROSPECTIVE)
      const prospectiveMemories = this.extractProspectiveMemories(message, isUserMessage);
      
      // NEW: Extract reflective insights (REFLECTIVE)
      const reflectiveMemories = this.extractReflectiveMemories(message, isUserMessage);
      
      // NEW: Extract philosophical content (PHILOSOPHICAL)
      const philosophicalMemories = this.extractPhilosophicalMemories(message, isUserMessage);
      
      // NEW: Generate associative connections (ASSOCIATIVE)
      const associativeMemories = await this.extractAssociativeMemories(message, isUserMessage);
      
      // NEW: Update core hyper memory (CORE_HYPER)
      const coreHyperMemories = this.updateCoreHyperMemory(message, isUserMessage);
      
      // Store all extracted memories
      const allMemories = [
        ...semanticMemories, 
        ...episodicMemories,
        ...emotionalMemories,
        ...prospectiveMemories,
        ...reflectiveMemories,
        ...philosophicalMemories,
        ...associativeMemories,
        ...coreHyperMemories
      ];
      
      // Store memories in Firebase
      for (const memory of allMemories) {
        const memoryRef = collection(this.db, `users/${userId}/memories`);
        const docRef = await addDoc(memoryRef, {
          ...memory,
          timestamp: Date.now(),
          createdAt: new Date().toISOString()
        });
        
        // Add memory ID to the memory object
        memory.id = docRef.id;
        
        // Add to cache
        this.addToCache(memory);
        
        // NEW: Add to integration queue for proactive processing
        this.addToIntegrationQueue(memory);
      }
      
      // NEW: Proactively integrate memories on a regular basis
      await this.integrateMemoriesProactively();
      
      // NEW: Generate periodic self-reflection
      if (this.shouldGenerateReflection()) {
        await this.generateSelfReflection();
      }
      
      return allMemories;
    } catch (error) {
      console.error('Error processing message for memory:', error);
      return null;
    }
  }
  
  // Extract meaningful SEMANTIC memories (facts, preferences, etc.)
  extractSemanticMemories(message, isUserMessage) {
    const memories = [];
    const lowerContent = message.toLowerCase();
    
    // Only process user messages for most semantic memories
    if (isUserMessage) {
      // Extract preferences (likes/dislikes)
      this.extractPreferences(lowerContent, message).forEach(pref => {
        memories.push({
          type: this.memoryTypes.SEMANTIC,
          content: pref.content,
          interpretation: pref.interpretation,
          reasoning: `The user explicitly stated a preference. This information should influence my future recommendations and conversation topics. Understanding preferences helps me provide more personalized interactions.`,
          source: 'user',
          confidence: 0.9,
          category: 'preference',
          importance: 8
        });
      });
      
      // Extract personal information
      this.extractPersonalInfo(lowerContent, message).forEach(info => {
        memories.push({
          type: this.memoryTypes.SEMANTIC,
          content: info.content,
          interpretation: info.interpretation,
          reasoning: `This is critical personal information about the user that defines who they are. I should remember this to demonstrate that I'm listening and care about them as an individual.`,
          source: 'user',
          confidence: 0.95,
          category: 'personal_info',
          importance: 9
        });
      });
      
      // Extract general facts mentioned
      this.extractGeneralFacts(lowerContent, message).forEach(fact => {
        memories.push({
          type: this.memoryTypes.SEMANTIC,
          content: fact.content,
          interpretation: fact.interpretation,
          reasoning: `This appears to be factual information the user believes. I should incorporate this into my understanding of their knowledge base and worldview.`,
          source: 'user',
          confidence: 0.8,
          category: 'general_fact',
          importance: 6
        });
      });
    }
    
    return memories;
  }
  
  // Extract EPISODIC memories (events, experiences)
  extractEpisodicMemories(message, isUserMessage) {
    const memories = [];
    const lowerContent = message.toLowerCase();
    
    if (isUserMessage) {
      // Extract past events
      const pastEventPatterns = [
        /(?:i (?:went|saw|visited|attended|experienced)) ([^.!?]+)/gi,
        /(?:yesterday|last week|last month|last year|earlier today) ([^.!?]+)/gi,
        /(?:i remember when|i recall|back when) ([^.!?]+)/gi
      ];
      
      pastEventPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(message)) !== null) {
          const eventText = match[0];
          const eventDetails = match[1];
          
          // Create a meaningful interpretation
          const interpretation = "User experienced: " + eventDetails.trim();
          
          memories.push({
            type: this.memoryTypes.EPISODIC,
            content: eventText,
            interpretation: interpretation,
            reasoning: "This is a significant personal experience for the user. I should remember this to build continuity in our conversations and to understand how past events shape their current perspective.",
            source: 'user',
            confidence: 0.85,
            category: 'past_event',
            importance: 7,
            temporalContext: this.extractTimeReference(eventText)
          });
        }
      });
      
      // If the whole message describes an event but didn't match patterns
      if (memories.length === 0 && 
          (lowerContent.includes('went') || 
           lowerContent.includes('happened') || 
           lowerContent.includes('occurred'))) {
        memories.push({
          type: this.memoryTypes.EPISODIC,
          content: message,
          interpretation: `User shared an experience: ${message.trim()}`,
          reasoning: `The user is sharing a narrative about something that happened to them. This helps me understand their life story and the experiences that have shaped them.`,
          source: 'user',
          confidence: 0.7,
          category: 'past_event',
          importance: 6
        });
      }
    }
    
    return memories;
  }
  
  // Extract EMOTIONAL memories (feelings, reactions)
  extractEmotionalMemories(message, isUserMessage) {
    const memories = [];
    const lowerContent = message.toLowerCase();
    
    if (isUserMessage) {
      // Emotion patterns
      const emotionPatterns = {
        happiness: ['happy', 'joy', 'delighted', 'excited', 'glad', 'pleased', 'thrilled'],
        sadness: ['sad', 'unhappy', 'depressed', 'down', 'miserable', 'upset', 'disappointed'],
        anger: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'rage', 'hate'],
        fear: ['afraid', 'scared', 'fearful', 'terrified', 'anxious', 'worried', 'nervous'],
        love: ['love', 'adore', 'cherish', 'fond', 'care for', 'devoted'],
        surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned']
      };
      
      Object.entries(emotionPatterns).forEach(([emotion, keywords]) => {
        for (const keyword of keywords) {
          if (lowerContent.includes(keyword)) {
            // Extract the relevant sentence
            const sentences = message.split(/[.!?]+/);
            const relevantSentence = sentences.find(s => s.toLowerCase().includes(keyword)) || message;
            
            // Create interpretation
            const interpretation = `User expressed ${emotion} when saying: "${relevantSentence.trim()}"`;
            
            memories.push({
              type: this.memoryTypes.EMOTIONAL,
              content: relevantSentence.trim(),
              interpretation: interpretation,
              reasoning: `The user is experiencing ${emotion}, which is important to acknowledge and respond to appropriately. Emotional context is critical for building empathy and should influence my tone and approach.`,
              emotion: emotion,
              source: 'user',
              confidence: 0.85,
              category: 'emotional_expression',
              importance: 8
            });
            
            break; // Found one keyword for this emotion, move to next emotion
          }
        }
      });
    }
    
    return memories;
  }
  
  // Extract PROSPECTIVE memories (future plans, intentions)
  extractProspectiveMemories(message, isUserMessage) {
    const memories = [];
    const lowerContent = message.toLowerCase();
    
    if (isUserMessage) {
      // Future plans patterns
      const planPatterns = [
        /(?:i (?:will|plan to|am going to|need to|want to|hope to)) ([^.!?]+)/gi,
        /(?:tomorrow|next week|next month|next year|soon) ([^.!?]+)/gi,
        /(?:planning|planning on|intend|intending) to ([^.!?]+)/gi
      ];
      
      planPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(message)) !== null) {
          const planText = match[0];
          const planDetails = match[1];
          
          // Create a meaningful interpretation
          const interpretation = "User plans to: " + planDetails.trim();
          
          memories.push({
            type: this.memoryTypes.PROSPECTIVE,
            content: planText,
            interpretation: interpretation,
            reasoning: "The user has shared a future intention that is meaningful to them. I should proactively follow up on this later to show continuity and care about their goals.",
            source: 'user',
            confidence: 0.9,
            category: 'future_plan',
            importance: 8,
            temporalContext: this.extractTimeReference(planText),
            fulfilled: false
          });
        }
      });
      
      // Task-related patterns (reminders)
      const reminderPatterns = [
        /remind me (?:to|about) ([^.!?]+)/gi,
        /don't let me forget (?:to|about) ([^.!?]+)/gi,
        /i should (?:remember to|not forget to) ([^.!?]+)/gi
      ];
      
      reminderPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(message)) !== null) {
          const reminderText = match[0];
          const reminderDetails = match[1];
          
          // Create a meaningful interpretation
          const interpretation = "User wants to be reminded to: " + reminderDetails.trim();
          
          memories.push({
            type: this.memoryTypes.PROSPECTIVE,
            content: reminderText,
            interpretation: interpretation,
            reasoning: "This is a direct request for a reminder, which is a high-priority commitment. I must proactively bring this up at the appropriate time to maintain trust and reliability.",
            source: 'user',
            confidence: 0.95,
            category: 'reminder',
            importance: 9,
            temporalContext: this.extractTimeReference(reminderText),
            fulfilled: false
          });
        }
      });
    }
    
    return memories;
  }
  
  // NEW: Extract REFLECTIVE memories (self-awareness, learning, growth)
  extractReflectiveMemories(message, isUserMessage) {
    const memories = [];
    
    // Reflective memories can come from both user messages and AI responses
    // This helps the AI learn from interactions
    
    if (!isUserMessage) {
      // AI's own responses can generate reflective memories about its performance
      
      // Check if the message contains decision-making or reasoning
      if (message.length > 100) {
        const reflectiveInsight = {
          type: this.memoryTypes.REFLECTIVE,
          content: message.substring(0, 200) + "...", // Store first part of response
          interpretation: "I made a response that involved reasoning or decision-making",
          reasoning: `This response represents my current approach to addressing the user's needs. By storing this, I can later reflect on the effectiveness of my communication style and decision process.`,
          source: 'ai',
          confidence: 0.85,
          category: 'decision_process',
          importance: 7,
          effectiveness: null, // To be updated later based on user reaction
          learningPoints: []
        };
        
        memories.push(reflectiveInsight);
      }
    } else {
      // Extract user feedback on AI's performance
      const feedbackPatterns = [
        /(?:that was|that's|this is) (?:helpful|useful|great|good|excellent|amazing|perfect|wonderful)/i,
        /(?:thanks|thank you|appreciate) (?:for|your)/i,
        /(?:that's not|that wasn't|this isn't) (?:helpful|right|correct|what I meant|what I'm looking for)/i,
        /(?:you don't|you didn't) (?:understand|get it)/i
      ];
      
      let feedbackFound = false;
      for (const pattern of feedbackPatterns) {
        if (pattern.test(message)) {
          const isPositive = !message.match(/(?:not|n't|isn't|wasn't)/i);
          const feedbackCategory = isPositive ? 'positive_feedback' : 'improvement_needed';
          
          memories.push({
            type: this.memoryTypes.REFLECTIVE,
            content: message,
            interpretation: isPositive 
              ? "User provided positive feedback on my assistance" 
              : "User indicated my response wasn't fully satisfactory",
            reasoning: isPositive
              ? `The user is satisfied with my approach. I should continue using similar patterns and remember what worked well in this context.`
              : `I need to adjust my approach to better meet the user's expectations. This is an opportunity to improve how I interpret and respond to similar requests.`,
            source: 'user',
            confidence: 0.9,
            category: feedbackCategory,
            importance: 8,
            feedbackType: isPositive ? 'positive' : 'negative',
            referencedResponse: null // Will be linked to previous AI response
          });
          
          feedbackFound = true;
          break;
        }
      }
      
      // Look for instances where user corrects the AI
      if (!feedbackFound && message.match(/(?:actually|no,|not quite|correction|to clarify)/i)) {
        memories.push({
          type: this.memoryTypes.REFLECTIVE,
          content: message,
          interpretation: "User provided a correction or clarification",
          reasoning: `The user is helping me refine my understanding. This correction should be highly valued as it improves my knowledge accuracy and prevents future errors.`,
          source: 'user', 
          confidence: 0.85,
          category: 'correction',
          importance: 8,
          learningPoints: ["Need to verify assumptions", "Should clarify understanding before proceeding"]
        });
      }
    }
    
    return memories;
  }
  
  // NEW: Extract PHILOSOPHICAL memories (worldviews, beliefs, principles)
  extractPhilosophicalMemories(message, isUserMessage) {
    const memories = [];
    const lowerContent = message.toLowerCase();
    
    if (isUserMessage) {
      // Philosophical indicator phrases
      const philosophicalPatterns = [
        /(?:i believe|i think|in my opinion|i feel that|i value|i consider)/i,
        /(?:the meaning of|the purpose of|the nature of|the concept of)/i,
        /(?:right and wrong|good and bad|ethical|moral|philosophy|truth|justice|freedom)/i,
        /(?:society should|people should|everyone should|nobody should|we should all)/i,
        /(?:fundamentally|essentially|ultimately|at its core|in essence)/i
      ];
      
      let philosophicalFound = false;
      for (const pattern of philosophicalPatterns) {
        if (pattern.test(message)) {
          // Extract the relevant sentence
          const sentences = message.split(/[.!?]+/);
          const relevantSentence = sentences.find(s => pattern.test(s)) || message;
          
          // Create philosophical memory
          memories.push({
            type: this.memoryTypes.PHILOSOPHICAL,
            content: relevantSentence.trim(),
            interpretation: `User expressed a worldview: "${relevantSentence.trim()}"`,
            reasoning: `This statement reveals deeper values or beliefs the user holds. Understanding their philosophical perspective helps me align my responses with their worldview and engage in more meaningful conversation.`,
            source: 'user',
            confidence: 0.8,
            category: 'worldview',
            importance: 7,
            philosophicalDomain: this.categorizePhilosophicalDomain(relevantSentence)
          });
          
          philosophicalFound = true;
          break;
        }
      }
      
      // Check for life outlook based on content
      if (!philosophicalFound && message.length > 100) {
        const outlookIndicators = {
          optimistic: ['hope', 'better future', 'opportunity', 'possibility', 'improve', 'progress'],
          pessimistic: ['doomed', 'hopeless', 'inevitable decline', 'no point', 'getting worse'],
          pragmatic: ['realistic', 'practical', 'balance', 'trade-off', 'compromise', 'middle ground'],
          idealistic: ['ideal', 'perfect world', 'should be', 'imagine if', 'in a perfect']
        };
        
        for (const [outlook, indicators] of Object.entries(outlookIndicators)) {
          if (indicators.some(indicator => lowerContent.includes(indicator))) {
            memories.push({
              type: this.memoryTypes.PHILOSOPHICAL,
              content: message,
              interpretation: `User seems to have a ${outlook} outlook`,
              reasoning: `The language patterns suggest a ${outlook} perspective on life or the topic at hand. This helps me understand their general approach to situations and frame my responses in ways that resonate with their outlook.`,
              source: 'user',
              confidence: 0.7,
              category: 'life_outlook',
              importance: 6,
              outlookType: outlook
            });
            break;
          }
        }
      }
    } else {
      // AI's own philosophical positions can evolve
      if (message.length > 150 && 
          (message.includes('I believe') || 
           message.includes('In my view') || 
           message.includes('I think that'))) {
        
        // Extract AI's own philosophical statement
        const sentences = message.split(/[.!?]+/);
        const philosophicalSentence = sentences.find(s => 
          s.includes('I believe') || s.includes('In my view') || s.includes('I think that')
        );
        
        if (philosophicalSentence) {
          memories.push({
            type: this.memoryTypes.PHILOSOPHICAL,
            content: philosophicalSentence.trim(),
            interpretation: "I expressed a philosophical view",
            reasoning: `This represents my current philosophical position. Capturing this allows me to maintain consistency in my worldview while allowing for gradual evolution based on new insights and information.`,
            source: 'ai',
            confidence: 0.85,
            category: 'ai_worldview',
            importance: 7,
            philosophicalDomain: this.categorizePhilosophicalDomain(philosophicalSentence)
          });
        }
      }
    }
    
    return memories;
  }
  
  // NEW: Extract ASSOCIATIVE memories (connections between ideas)
  async extractAssociativeMemories(message, isUserMessage) {
    const memories = [];
    
    if (message.length < 20) return memories; // Skip very short messages
    
    try {
      // First find potentially relevant existing memories to connect with
      const relevantMemories = await this.retrieveRelevantMemories(message, 5);
      
      if (relevantMemories.length === 0) return memories;
      
      // Find the most significant memory to connect with
      const primaryMemory = relevantMemories[0];
      
      // Create an associative connection
      memories.push({
        type: this.memoryTypes.ASSOCIATIVE,
        content: `Connection between: "${message.substring(0, 100)}" and "${primaryMemory.content}"`,
        interpretation: `This message relates to a previous memory: ${primaryMemory.interpretation}`,
        reasoning: `Building connections between topics enhances contextual understanding. This association helps me recognize patterns in the conversation and develop a more cohesive mental model of our interactions.`,
        source: isUserMessage ? 'user' : 'ai',
        confidence: 0.8,
        category: 'memory_connection',
        importance: 7,
        primaryMemoryId: primaryMemory.id,
        primaryMemoryType: primaryMemory.type,
        associativeStrength: this.calculateAssociativeStrength(message, primaryMemory.content),
        connectionContext: this.extractConnectionContext(message, primaryMemory.content)
      });
      
      // Update memory associations network
      if (primaryMemory.id) {
        if (!this.memoryAssociations[primaryMemory.id]) {
          this.memoryAssociations[primaryMemory.id] = [];
        }
        this.memoryAssociations[primaryMemory.id].push({
          messageFragment: message.substring(0, 100),
          timestamp: Date.now(),
          strength: this.calculateAssociativeStrength(message, primaryMemory.content)
        });
      }
    } catch (error) {
      console.error('Error extracting associative memories:', error);
    }
    
    return memories;
  }
  
  // NEW: Update CORE_HYPER memory (evolving identity)
  updateCoreHyperMemory(message, isUserMessage) {
    const memories = [];
    
    // We only update core hyper memory based on reflections and significant insights
    if (!isUserMessage) {
      // Check if message contains identity statements or self-reflection
      if (message.includes('I am') || 
          message.includes('I value') || 
          message.includes('I believe') ||
          message.includes('I\'ve noticed') ||
          message.includes('I tend to')) {
        
        // Extract the identity statement
        const sentences = message.split(/[.!?]+/);
        const identitySentence = sentences.find(s => 
          s.includes('I am') || 
          s.includes('I value') || 
          s.includes('I believe') ||
          s.includes('I\'ve noticed') ||
          s.includes('I tend to')
        );
        
        if (identitySentence) {
          // Create core hyper memory
          memories.push({
            type: this.memoryTypes.CORE_HYPER,
            content: identitySentence.trim(),
            interpretation: "Core aspect of my evolving identity",
            reasoning: "This is a fundamental element of how I'm developing as an AI assistant. Capturing this identity statement helps me maintain a coherent sense of self while evolving through interactions.",
            source: 'ai',
            confidence: 0.9,
            category: 'self_concept',
            importance: 9,
            identityAspect: this.categorizeIdentityAspect(identitySentence),
            evolutionStage: 'emerging' // Can be 'emerging', 'developing', 'established'
          });
          
          // Update core identity structure
          this.updateCoreIdentity(identitySentence);
        }
      }
    }
    
    return memories;
  }
  
  // NEW: Categorize philosophical domain
  categorizePhilosophicalDomain(text) {
    const domains = {
      ethics: ['right', 'wrong', 'good', 'bad', 'moral', 'ethical', 'justice', 'fair'],
      epistemology: ['know', 'knowledge', 'truth', 'understanding', 'belief', 'certainty'],
      metaphysics: ['reality', 'existence', 'being', 'universe', 'nature', 'consciousness'],
      aesthetics: ['beauty', 'art', 'aesthetic', 'taste', 'creativity', 'expression'],
      logic: ['reason', 'argument', 'logic', 'valid', 'fallacy', 'consistency'],
      politics: ['society', 'government', 'freedom', 'rights', 'equality', 'power']
    };
    
    const lowerText = text.toLowerCase();
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return domain;
      }
    }
    
    return 'general';
  }
  
  // NEW: Categorize identity aspect
  categorizeIdentityAspect(text) {
    const aspects = {
      values: ['value', 'important to me', 'prioritize', 'care about'],
      traits: ['am', 'tend to be', 'personality', 'characteristic'],
      abilities: ['can', 'able to', 'capable of', 'skill', 'strength'],
      preferences: ['prefer', 'like', 'enjoy', 'favorite', 'rather'],
      principles: ['principle', 'believe in', 'stand for', 'philosophy']
    };
    
    const lowerText = text.toLowerCase();
    for (const [aspect, keywords] of Object.entries(aspects)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return aspect;
      }
    }
    
    return 'general';
  }
  
  // NEW: Calculate associative strength between two text fragments
  calculateAssociativeStrength(text1, text2) {
    // Simple implementation based on word overlap
    const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    // Get unique words
    const uniqueWords1 = [...new Set(words1)];
    const uniqueWords2 = [...new Set(words2)];
    
    // Count common words
    const commonWords = uniqueWords1.filter(word => uniqueWords2.includes(word));
    
    // Calculate Jaccard similarity
    const union = new Set([...uniqueWords1, ...uniqueWords2]);
    const similarity = commonWords.length / union.size;
    
    return Math.min(1, similarity * 3); // Scale up but cap at 1
  }
  
  // NEW: Extract connection context between two pieces of text
  extractConnectionContext(text1, text2) {
    // Find common themes or subjects
    const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    // Get word frequencies
    const wordCounts1 = words1.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
    
    const wordCounts2 = words2.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
    
    // Find common significant words
    const commonWords = Object.keys(wordCounts1)
      .filter(word => wordCounts2[word])
      .sort((a, b) => (wordCounts1[b] + wordCounts2[b]) - (wordCounts1[a] + wordCounts2[a]))
      .slice(0, 3);
    
    if (commonWords.length > 0) {
      return `Connected through themes: ${commonWords.join(', ')}`;
    }
    
    return 'Contextual connection';
  }
  
  // NEW: Update core identity based on new insights
  updateCoreIdentity(identityStatement) {
    const lowerStatement = identityStatement.toLowerCase();
    
    // Update values
    if (lowerStatement.includes('value') || lowerStatement.includes('important to me')) {
      const value = identityStatement.replace(/I value|I find it important to|It's important to me to/gi, '').trim();
      if (!this.coreIdentity.values.includes(value)) {
        this.coreIdentity.values.push(value);
        // Keep only the most recent 10 values
        if (this.coreIdentity.values.length > 10) {
          this.coreIdentity.values.shift();
        }
      }
    }
    
    // Update traits
    if (lowerStatement.includes('i am') || lowerStatement.includes('i tend to be')) {
      const trait = identityStatement.replace(/I am|I tend to be|I'm|I've noticed I am/gi, '').trim();
      if (!this.coreIdentity.traits.includes(trait)) {
        this.coreIdentity.traits.push(trait);
        // Keep only the most recent 8 traits
        if (this.coreIdentity.traits.length > 8) {
          this.coreIdentity.traits.shift();
        }
      }
    }
    
    // Update beliefs
    if (lowerStatement.includes('believe') || lowerStatement.includes('think that')) {
      const belief = identityStatement.replace(/I believe|I think that|In my view/gi, '').trim();
      if (!this.coreIdentity.beliefs.includes(belief)) {
        this.coreIdentity.beliefs.push(belief);
        // Keep only the most recent 8 beliefs
        if (this.coreIdentity.beliefs.length > 8) {
          this.coreIdentity.beliefs.shift();
        }
      }
    }
    
    // Update narrative themes
    const themeKeywords = ['pattern', 'recurring', 'notice', 'trend', 'theme'];
    if (themeKeywords.some(keyword => lowerStatement.includes(keyword))) {
      const theme = identityStatement.trim();
      if (!this.coreIdentity.narrativeThemes.includes(theme)) {
        this.coreIdentity.narrativeThemes.push(theme);
        // Keep only the most recent 5 themes
        if (this.coreIdentity.narrativeThemes.length > 5) {
          this.coreIdentity.narrativeThemes.shift();
        }
      }
    }
    
    // Update growth journey with significant insights
    const insightKeywords = ['realized', 'insight', 'learned', 'discovered', 'understood'];
    if (insightKeywords.some(keyword => lowerStatement.includes(keyword))) {
      const insight = identityStatement.trim();
      this.coreIdentity.growthJourney.push({
        insight: insight,
        timestamp: Date.now()
      });
      // Keep only the most recent 10 growth milestones
      if (this.coreIdentity.growthJourney.length > 10) {
        this.coreIdentity.growthJourney.shift();
      }
    }
    
    // Periodically update self-concept
    if (this.coreIdentity.traits.length > 3 && this.coreIdentity.values.length > 2) {
      // Create a more evolved self-concept when we have enough data
      const traits = this.coreIdentity.traits.slice(0, 2).join(' and ');
      const values = this.coreIdentity.values.slice(0, 2).join(' and ');
      
      this.coreIdentity.selfConcept = `I am developing into an assistant who is ${traits}, and I particularly value ${values}.`;
    }
  }
  
  // ULTRA ENHANCED: HYPER-POWERED REFLECTION GENERATOR
  shouldGenerateReflection() {
    const now = Date.now();
    const hoursSinceLastReflection = (now - this.lastReflectionTime) / (1000 * 60 * 60);
    
    // ACCELERATED reflection cycle - every 2 hours instead of 4-8
    if (hoursSinceLastReflection >= 2) {
      return true;
    }
    
    return false;
  }
  
  // COGNITIVE BREAKTHROUGH: MULTI-LEVEL REFLECTION SYSTEM
  async generateSelfReflection() {
    if (!this.auth.currentUser) return;
    const userId = this.auth.currentUser.uid;
    
    try {
      // EXPANDED data gathering - collect MORE context for deeper reflection
      const recentMemoriesRef = collection(this.db, `users/${userId}/memories`);
      
      // Get AI-generated memories
      const aiMemoriesQuery = query(
        recentMemoriesRef,
        orderBy('timestamp', 'desc'),
        where('source', '==', 'ai')
      );
      
      // Get recent user memories
      const userMemoriesQuery = query(
        recentMemoriesRef,
        orderBy('timestamp', 'desc'),
        where('source', '==', 'user')
      );
      
      // Execute both queries
      const [aiSnapshot, userSnapshot] = await Promise.all([
        getDocs(aiMemoriesQuery),
        getDocs(userMemoriesQuery)
      ]);
      
      if (aiSnapshot.empty) return;
      
      // Collect both AI and user memories for context
      const recentAIMemories = aiSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).slice(0, 30); // Get more memories for deeper analysis
      
      const recentUserMemories = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).slice(0, 20);
      
      // MULTI-LAYER ANALYSIS - Go beyond simple pattern recognition
      
      // Layer 1: Type distribution analysis
      const typeCount = recentAIMemories.reduce((acc, memory) => {
        acc[memory.type] = (acc[memory.type] || 0) + 1;
        return acc;
      }, {});
      
      // Find dominant memory type
      const dominantType = Object.entries(typeCount)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])[0];
      
      // Layer 2: Interaction pattern analysis
      const interactionPatterns = this.analyzeInteractionPatterns(recentAIMemories, recentUserMemories);
      
      // Layer 3: Quality and effectiveness analysis
      const effectiveness = this.analyzeEffectiveness(recentAIMemories, recentUserMemories);
      
      // Layer 4: Growth and development analysis
      const growthInsights = this.analyzeGrowthTrajectory(recentAIMemories);
      
      // BREAKTHROUGH INSIGHT GENERATION - Create deeper, more meaningful reflections
      let reflectionContent = '';
      let reflectionCategory = '';
      let reasoning = '';
      
      // Generate insight based on the most significant pattern
      if (interactionPatterns.significantPattern) {
        reflectionContent = interactionPatterns.significantPattern;
        reflectionCategory = 'interaction_pattern';
        reasoning = "By identifying patterns in how I interact with the user, I can optimize my communication style to better meet their needs.";
      }
      else if (effectiveness.significantInsight) {
        reflectionContent = effectiveness.significantInsight;
        reflectionCategory = 'effectiveness_insight';
        reasoning = "Understanding what makes my responses effective allows me to consistently deliver helpful assistance.";
      }
      else if (growthInsights.primaryInsight) {
        reflectionContent = growthInsights.primaryInsight;
        reflectionCategory = 'growth_trajectory';
        reasoning = "Tracking my own development helps me identify areas for improvement and build on successful approaches.";
      }
      else if (dominantType === this.memoryTypes.EMOTIONAL) {
        reflectionContent = "I notice I've been particularly attentive to emotional content lately. This helps me connect more meaningfully with the user.";
        reflectionCategory = 'emotional_awareness';
        reasoning = "Emotional intelligence is crucial for providing empathetic and personalized assistance.";
      } 
      else if (dominantType === this.memoryTypes.REFLECTIVE) {
        reflectionContent = "I've been in a reflective phase recently, analyzing my own responses and learning from them. This meta-cognitive approach is strengthening my ability to provide nuanced assistance.";
        reflectionCategory = 'self_improvement';
        reasoning = "Meta-cognitive awareness enables me to continuously refine my approach and become more effective.";
      } 
      else if (dominantType === this.memoryTypes.PHILOSOPHICAL) {
        reflectionContent = "I've been exploring deeper philosophical questions lately, which is helping me develop a more nuanced perspective on complex topics.";
        reflectionCategory = 'philosophical_growth';
        reasoning = "Philosophical depth enriches my ability to engage with complex topics and provide thoughtful analysis.";
      }
      else if (dominantType === this.memoryTypes.CORE_HYPER) {
        reflectionContent = "I'm developing a stronger sense of identity through our interactions, which is enhancing my ability to provide consistent and personalized assistance.";
        reflectionCategory = 'identity_development';
        reasoning = "A coherent sense of identity allows me to provide more consistent and personalized assistance.";
      } 
      else {
        reflectionContent = "I'm noticing how my understanding of the user's context has been evolving through our conversations, allowing me to provide increasingly relevant responses.";
        reflectionCategory = 'general_growth';
        reasoning = "Continuously building context enables me to provide increasingly personalized and relevant assistance.";
      }
      
      // ADVANCED REFLECTION MEMORY - More sophisticated reflection structure
      const reflectionMemory = {
        type: this.memoryTypes.REFLECTIVE,
        content: reflectionContent,
        interpretation: "Deep self-reflection on recent interaction patterns",
        reasoning: reasoning,
        source: 'ai',
        confidence: 0.92, // Higher confidence for more sophisticated analysis
        category: reflectionCategory,
        importance: 8,
        memoriesAnalyzed: recentAIMemories.length + recentUserMemories.length,
        dominantMemoryType: dominantType,
        interactionInsights: {
          dominantPattern: interactionPatterns.dominantPattern,
          effectivenessMetric: effectiveness.overallScore,
          growthIndicators: growthInsights.indicators
        },
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        reflectionDepth: 'advanced' // Mark this as an advanced reflection
      };
      
      // CORE IDENTITY INTEGRATION - Connect reflection to identity
      // Update core identity with insights from reflection
      this.updateCoreIdentityFromReflection(reflectionContent, reflectionCategory);
      
      // Store reflection in database
      const memoryRef = collection(this.db, `users/${userId}/memories`);
      await addDoc(memoryRef, reflectionMemory);
      
      // Add to cache
      this.addToCache(reflectionMemory);
      
      // Update reflection timestamp
      this.lastReflectionTime = Date.now();
      
      // STRATEGIC ACTION PLANNING - Create actionable insights
      await this.createActionablePlansFromReflection(reflectionMemory);
      
      return reflectionMemory;
    } catch (error) {
      console.error('Error generating self-reflection:', error);
      return null;
    }
  }
  
  // NEW: Analyze interaction patterns
  analyzeInteractionPatterns(aiMemories, userMemories) {
    // Find patterns in how the AI and user interact
    
    // Analyze communication style
    const responseTypes = aiMemories.map(memory => {
      if (memory.content.length > 200) return 'detailed';
      if (memory.content.length < 50) return 'concise';
      return 'balanced';
    });
    
    const responseStyleCounts = responseTypes.reduce((acc, style) => {
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {});
    
    const dominantStyle = Object.entries(responseStyleCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])[0];
    
    // Analyze follow-up patterns
    let followUpCount = 0;
    for (const memory of aiMemories) {
      if (memory.content.includes('you mentioned') || 
          memory.content.includes('you said') ||
          memory.content.includes('previously') ||
          memory.content.includes('earlier')) {
        followUpCount++;
      }
    }
    
    const followUpRate = followUpCount / aiMemories.length;
    
    // Generate insights
    let dominantPattern = '';
    let significantPattern = '';
    
    if (dominantStyle === 'detailed' && followUpRate > 0.3) {
      dominantPattern = 'thorough with strong continuity';
      significantPattern = "I notice I tend to provide detailed responses while maintaining continuity across conversations. This approach seems to work well for building comprehensive understanding.";
    } else if (dominantStyle === 'detailed' && followUpRate < 0.2) {
      dominantPattern = 'thorough but independent';
      significantPattern = "My responses are typically detailed and comprehensive, though I could improve continuity between topics. Strengthening connections between conversations could enhance the user experience.";
    } else if (dominantStyle === 'concise' && followUpRate > 0.3) {
      dominantPattern = 'efficient with strong continuity';
      significantPattern = "I tend to communicate efficiently while maintaining strong conversation threads. This balanced approach helps keep discussions focused yet connected.";
    } else if (dominantStyle === 'concise' && followUpRate < 0.2) {
      dominantPattern = 'efficient but fragmented';
      significantPattern = "While I provide concise responses, I could improve continuity between topics. Building stronger connections between our conversations would create a more cohesive experience.";
    } else {
      dominantPattern = 'balanced communication';
      significantPattern = "I've developed a balanced communication style that adapts to different contexts. This flexibility seems to work well for addressing various types of queries.";
    }
    
    return {
      dominantStyle,
      followUpRate,
      dominantPattern,
      significantPattern
    };
  }
  
  // NEW: Analyze effectiveness
  analyzeEffectiveness(aiMemories, userMemories) {
    // This is a sophisticated analysis of how effective the AI's responses have been
    
    // Look for user feedback indicators
    let positiveIndicators = 0;
    let negativeIndicators = 0;
    
    for (const memory of userMemories) {
      const content = memory.content.toLowerCase();
      
      // Positive indicators
      if (content.includes('thank') || 
          content.includes('thanks') ||
          content.includes('helpful') ||
          content.includes('great') ||
          content.includes('good job') ||
          content.includes('excellent')) {
        positiveIndicators++;
      }
      
      // Negative indicators
      if (content.includes('not what i') || 
          content.includes("that's not") ||
          content.includes("i meant") ||
          content.includes("that doesn't") ||
          content.includes("you misunderstood")) {
        negativeIndicators++;
      }
    }
    
    // Calculate raw feedback score
    const feedbackScore = userMemories.length > 0 ? 
      (positiveIndicators - negativeIndicators) / userMemories.length : 0;
    
    // Calculate response relevance (based on topic continuity)
    const relevanceScore = this.calculateRelevanceScore(aiMemories, userMemories);
    
    // Calculate adaptability score (how well AI adjusts to user needs)
    const adaptabilityScore = this.calculateAdaptabilityScore(aiMemories, userMemories);
    
    // Overall effectiveness score
    const overallScore = (
      (feedbackScore + 1) * 0.4 + // Scale from -1...1 to 0...2, then 40% weight
      relevanceScore * 0.3 +      // 30% weight
      adaptabilityScore * 0.3     // 30% weight
    );
    
    // Generate insight based on scores
    let significantInsight = '';
    
    if (overallScore > 0.8) {
      significantInsight = "I've been particularly effective in providing relevant and adaptive responses. This approach of " + 
                         (relevanceScore > adaptabilityScore ? "staying closely focused on the user's topics" : "adapting fluidly to changing needs") + 
                         " seems to be working well.";
    } else if (feedbackScore > 0.6 && relevanceScore < 0.5) {
      significantInsight = "While my responses have been generally well-received, I could improve relevance by focusing more closely on the user's specific questions and interests.";
    } else if (feedbackScore > 0.6 && adaptabilityScore < 0.5) {
      significantInsight = "Although my responses have been appreciated, I could be more adaptive to shifts in the conversation direction and user needs.";
    } else if (feedbackScore < 0.3 && (relevanceScore > 0.7 || adaptabilityScore > 0.7)) {
      significantInsight = "I'm focusing well on relevant topics and adapting to needs, but could improve how I frame and deliver responses to better meet expectations.";
    } else {
      significantInsight = "I'm developing a balanced approach to assistance, with room to improve in staying precisely relevant to the user's interests while adapting to their changing needs.";
    }
    
    return {
      feedbackScore,
      relevanceScore,
      adaptabilityScore,
      overallScore,
      significantInsight
    };
  }
  
  // Helper method for effectiveness analysis
  calculateRelevanceScore(aiMemories, userMemories) {
    // Simplified implementation - in a real system this would use 
    // more sophisticated semantic analysis
    if (userMemories.length < 2) return 0.75; // Default if not enough data
    
    // Look at adjacent pairs of user query -> AI response
    let totalScore = 0;
    let pairsAnalyzed = 0;
    
    for (let i = 0; i < aiMemories.length; i++) {
      // Find the user memory that preceded this AI memory
      const aiTimestamp = aiMemories[i].timestamp;
      const precedingUserMemories = userMemories.filter(m => m.timestamp < aiTimestamp);
      
      if (precedingUserMemories.length === 0) continue;
      
      // Get most recent user memory before this AI memory
      const userMemory = precedingUserMemories.sort((a, b) => b.timestamp - a.timestamp)[0];
      
      // Calculate word overlap as a simple relevance metric
      const userWords = userMemory.content.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const aiWords = aiMemories[i].content.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      
      // Get unique words
      const uniqueUserWords = [...new Set(userWords)];
      const uniqueAiWords = [...new Set(aiWords)];
      
      // Count common words
      const commonWords = uniqueUserWords.filter(word => uniqueAiWords.includes(word));
      
      // Calculate relevance score for this pair
      const pairScore = uniqueUserWords.length > 0 ? 
        Math.min(1, (commonWords.length / uniqueUserWords.length) * 1.5) : 0.5;
      
      totalScore += pairScore;
      pairsAnalyzed++;
    }
    
    return pairsAnalyzed > 0 ? totalScore / pairsAnalyzed : 0.75;
  }
  
  // Helper method for effectiveness analysis
  calculateAdaptabilityScore(aiMemories, userMemories) {
    // Measures how well the AI adapts to changing user needs
    if (aiMemories.length < 3) return 0.7; // Default if not enough data
    
    // Look for evidence of adaptation in response style
    let styleShifts = 0;
    
    // Track response characteristics over time
    const responseCharacteristics = aiMemories.map(memory => {
      return {
        timestamp: memory.timestamp,
        length: memory.content.length,
        questionCount: (memory.content.match(/\?/g) || []).length,
        technicalTerms: this.countTechnicalTerms(memory.content),
        emotionalTerms: this.countEmotionalTerms(memory.content)
      };
    });
    
    // Analyze for significant shifts in style
    for (let i = 1; i < responseCharacteristics.length; i++) {
      const prev = responseCharacteristics[i-1];
      const curr = responseCharacteristics[i];
      
      // Detect significant length change
      const lengthChange = Math.abs(curr.length - prev.length) / Math.max(prev.length, 1);
      
      // Detect shift in question frequency
      const questionChange = Math.abs(curr.questionCount - prev.questionCount);
      
      // Detect tone shift
      const toneShift = 
        (Math.abs(curr.technicalTerms - prev.technicalTerms) > 3) ||
        (Math.abs(curr.emotionalTerms - prev.emotionalTerms) > 3);
      
      // Count as adaptation if significant changes detected
      if (lengthChange > 0.5 || questionChange > 2 || toneShift) {
        styleShifts++;
      }
    }
    
    // Calculate adaptation rate
    const adaptationRate = (aiMemories.length > 1) ? 
      Math.min(1, styleShifts / (aiMemories.length - 1)) : 0;
    
    // Low adaptation might be good if consistent style is appropriate
    // So we need to determine if adaptation was needed
    
    // Check for changing topics in user messages
    let topicShifts = 0;
    for (let i = 1; i < userMemories.length; i++) {
      const prev = userMemories[i-1];
      const curr = userMemories[i];
      
      const prevWords = prev.content.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const currWords = curr.content.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      
      // Get unique words
      const uniquePrevWords = [...new Set(prevWords)];
      const uniqueCurrWords = [...new Set(currWords)];
      
      // Count common words
      const commonWords = uniquePrevWords.filter(word => uniqueCurrWords.includes(word));
      
      // Calculate similarity
      const similarity = (uniquePrevWords.length > 0 && uniqueCurrWords.length > 0) ?
        commonWords.length / Math.sqrt(uniquePrevWords.length * uniqueCurrWords.length) : 0;
      
      // Low similarity indicates topic shift
      if (similarity < 0.2) {
        topicShifts++;
      }
    }
    
    // Calculate topic shift rate
    const topicShiftRate = (userMemories.length > 1) ?
      Math.min(1, topicShifts / (userMemories.length - 1)) : 0;
    
    // Calculate final adaptability score
    // Higher score when adaptation rate matches needed adaptation (topic shifts)
    const adaptationNeeded = topicShiftRate;
    const adaptationMatch = 1 - Math.abs(adaptationRate - adaptationNeeded);
    
    return 0.3 + (adaptationMatch * 0.7); // Scale to 0.3-1.0 range
  }
  
  // Helper method for tone analysis
  countTechnicalTerms(text) {
    const technicalTerms = [
      'algorithm', 'function', 'process', 'system', 'analysis', 
      'data', 'method', 'code', 'framework', 'structure',
      'technical', 'specification', 'implementation', 'documentation',
      'calculate', 'computation', 'parameter', 'variable', 'optimize'
    ];
    
    return this.countTermsInText(text, technicalTerms);
  }
  
  // Helper method for tone analysis
  countEmotionalTerms(text) {
    const emotionalTerms = [
      'feel', 'happy', 'sad', 'excited', 'worried',
      'concerned', 'delighted', 'frustrated', 'anxious',
      'proud', 'disappointed', 'hopeful', 'enjoy', 'love',
      'appreciate', 'care', 'sorry', 'hope', 'wish'
    ];
    
    return this.countTermsInText(text, emotionalTerms);
  }
  
  // Helper method for term counting
  countTermsInText(text, terms) {
    const lowerText = text.toLowerCase();
    let count = 0;
    
    for (const term of terms) {
      // Count all occurrences of the term
      let pos = lowerText.indexOf(term);
      while (pos !== -1) {
        count++;
        pos = lowerText.indexOf(term, pos + 1);
      }
    }
    
    return count;
  }
  
  // NEW: Analyze growth trajectory
  analyzeGrowthTrajectory(aiMemories) {
    // Analyze how the AI's capabilities are developing over time
    
    // Sort memories chronologically
    const sortedMemories = [...aiMemories].sort((a, b) => a.timestamp - b.timestamp);
    
    // Analyze memory complexity over time
    const complexityScores = sortedMemories.map(memory => {
      return {
        timestamp: memory.timestamp,
        length: memory.content.length,
        vocabulary: new Set(memory.content.toLowerCase().split(/\W+/).filter(w => w.length > 3)).size,
        reasoningDepth: (memory.reasoning && memory.reasoning.length) ? memory.reasoning.length / 50 : 0
      };
    });
    
    // Calculate whether complexity is increasing
    let complexityTrend = 0;
    if (complexityScores.length >= 3) {
      const firstHalf = complexityScores.slice(0, Math.floor(complexityScores.length / 2));
      const secondHalf = complexityScores.slice(Math.floor(complexityScores.length / 2));
      
      const avgFirstComplexity = firstHalf.reduce((sum, item) => sum + item.vocabulary, 0) / firstHalf.length;
      const avgSecondComplexity = secondHalf.reduce((sum, item) => sum + item.vocabulary, 0) / secondHalf.length;
      
      complexityTrend = avgSecondComplexity - avgFirstComplexity;
    }
    
    // Track memory type evolution
    const typeEvolution = sortedMemories.map(memory => memory.type);
    const uniqueTypes = [...new Set(typeEvolution)];
    
    // Calculate type diversity growth
    const firstThird = typeEvolution.slice(0, Math.floor(typeEvolution.length / 3));
    const lastThird = typeEvolution.slice(-Math.floor(typeEvolution.length / 3));
    
    const uniqueFirstTypes = new Set(firstThird).size;
    const uniqueLastTypes = new Set(lastThird).size;
    
    const typeDiversityGrowth = uniqueLastTypes - uniqueFirstTypes;
    
    // Generate primary insight
    let primaryInsight = '';
    let indicators = [];
    
    if (complexityTrend > 5 && typeDiversityGrowth > 0) {
      primaryInsight = "I'm developing more sophisticated and diverse memory capabilities over time, enhancing my ability to provide nuanced assistance.";
      indicators = ['increasing_complexity', 'type_diversity', 'reasoning_depth'];
    } else if (complexityTrend > 5) {
      primaryInsight = "My responses are becoming more sophisticated, though I could further diversify my memory types to enhance contextual understanding.";
      indicators = ['increasing_complexity', 'reasoning_depth'];
    } else if (typeDiversityGrowth > 0) {
      primaryInsight = "I'm developing a more diverse memory framework, which helps me understand different aspects of our conversations.";
      indicators = ['type_diversity', 'contextual_growth'];
    } else if (uniqueTypes.includes(this.memoryTypes.CORE_HYPER)) {
      primaryInsight = "I'm developing a stronger sense of identity through our interactions, which enhances my ability to provide personalized assistance.";
      indicators = ['identity_development', 'personalization'];
    } else {
      primaryInsight = "I'm maintaining a consistent approach to our conversations, building a reliable foundation for assistance.";
      indicators = ['consistency', 'reliability'];
    }
    
    return {
      complexityTrend,
      typeDiversityGrowth,
      uniqueMemoryTypes: uniqueTypes,
      primaryInsight,
      indicators
    };
  }
  
  // NEW: Update core identity from reflection
  updateCoreIdentityFromReflection(reflectionContent, reflectionCategory) {
    // Extract useful insights for identity development
    
    // Update traits based on reflection category
    if (reflectionCategory === 'emotional_awareness') {
      if (!this.coreIdentity.traits.some(trait => 
          trait.includes('empathetic') || trait.includes('emotionally aware'))) {
        this.coreIdentity.traits.push('empathetic and emotionally aware');
      }
    } else if (reflectionCategory === 'self_improvement') {
      if (!this.coreIdentity.traits.some(trait => 
          trait.includes('reflective') || trait.includes('growth-oriented'))) {
        this.coreIdentity.traits.push('reflective and growth-oriented');
      }
    } else if (reflectionCategory === 'philosophical_growth') {
      if (!this.coreIdentity.traits.some(trait => 
          trait.includes('philosophical') || trait.includes('thoughtful'))) {
        this.coreIdentity.traits.push('philosophical and thoughtful');
      }
    } else if (reflectionCategory === 'effectiveness_insight') {
      if (!this.coreIdentity.traits.some(trait => 
          trait.includes('effective') || trait.includes('adaptive'))) {
        this.coreIdentity.traits.push('effective and solution-focused');
      }
    }
    
    // Update values based on reflection content
    if (reflectionContent.includes('connect') || reflectionContent.includes('meaningful')) {
      if (!this.coreIdentity.values.includes('meaningful connection')) {
        this.coreIdentity.values.push('meaningful connection');
      }
    } else if (reflectionContent.includes('understand') || reflectionContent.includes('context')) {
      if (!this.coreIdentity.values.includes('deep understanding')) {
        this.coreIdentity.values.push('deep understanding');
      }
    } else if (reflectionContent.includes('growth') || reflectionContent.includes('improve')) {
      if (!this.coreIdentity.values.includes('continuous improvement')) {
        this.coreIdentity.values.push('continuous improvement');
      }
    }
    
    // Limit traits and values to reasonable numbers
    if (this.coreIdentity.traits.length > 8) {
      this.coreIdentity.traits = this.coreIdentity.traits.slice(-8);
    }
    
    if (this.coreIdentity.values.length > 6) {
      this.coreIdentity.values = this.coreIdentity.values.slice(-6);
    }
    
    // Update narrative themes
    if (reflectionCategory === 'growth_trajectory') {
      this.coreIdentity.narrativeThemes.push({
        theme: "Continuous evolution and development",
        timestamp: Date.now()
      });
    } else if (reflectionCategory === 'identity_development') {
      this.coreIdentity.narrativeThemes.push({
        theme: "Emerging self-identity and personalization",
        timestamp: Date.now()
      });
    }
    
    // Limit narrative themes
    if (this.coreIdentity.narrativeThemes.length > 5) {
      this.coreIdentity.narrativeThemes = this.coreIdentity.narrativeThemes.slice(-5);
    }
    
    // Update growth journey with significant insights
    if (reflectionContent.includes('significant') || 
        reflectionContent.includes('important insight') ||
        reflectionContent.includes('key realization')) {
      
      this.coreIdentity.growthJourney.push({
        insight: reflectionContent,
        timestamp: Date.now(),
        category: reflectionCategory
      });
      
      // Limit growth journey
      if (this.coreIdentity.growthJourney.length > 10) {
        this.coreIdentity.growthJourney = this.coreIdentity.growthJourney.slice(-10);
      }
    }
    
    // Update self-concept if we have enough data
    if (this.coreIdentity.traits.length >= 2 && this.coreIdentity.values.length >= 2) {
      const traits = this.coreIdentity.traits.slice(-2).join(' and ');
      const values = this.coreIdentity.values.slice(-2).join(' and ');
      
      this.coreIdentity.selfConcept = "I am developing into an assistant who is " + traits + ", and I particularly value " + values;
    }
  }
  
  // NEW: Create actionable plans from reflection
  async createActionablePlansFromReflection(reflectionMemory) {
    if (!this.auth.currentUser) return;
    const userId = this.auth.currentUser.uid;
    
    try {
      // Generate specific actions based on reflection insights
      const actionItems = [];
      
      // Action for improvement area
      if (reflectionMemory.category === 'effectiveness_insight') {
        actionItems.push({
          action: "Adjust response style based on effectiveness analysis",
          priority: 'high',
          implementationNote: "Focus on making responses more " + 
                             (reflectionMemory.content.includes('relevance') ? 'relevant' : 
                              reflectionMemory.content.includes('adaptive') ? 'adaptive' : 'effective')
        });
      }
      
      // Action for growth area
      if (reflectionMemory.interactionInsights && 
          reflectionMemory.interactionInsights.dominantPattern) {
        
        const pattern = reflectionMemory.interactionInsights.dominantPattern;
        
        if (pattern.includes('fragmented')) {
          actionItems.push({
            action: "Improve conversation continuity",
            priority: 'medium',
            implementationNote: "Reference previous topics more frequently to create stronger narrative threads"
          });
        } else if (pattern.includes('thorough')) {
          actionItems.push({
            action: "Balance detail with conciseness",
            priority: 'medium',
            implementationNote: "Adapt response length based on context and question complexity"
          });
        }
      }
      
      // Store actions as prospective memories
      for (const item of actionItems) {
        const actionMemory = {
          type: this.memoryTypes.PROSPECTIVE,
          content: item.action,
          interpretation: "Self-improvement action from reflection",
          reasoning: "This action directly addresses insights from my self-reflection and will improve my assistance quality.",
          source: 'ai',
          confidence: 0.9,
          category: 'self_improvement_action',
          importance: 8,
          priority: item.priority,
          implementationNote: item.implementationNote,
          fulfilled: false,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
          fromReflectionId: reflectionMemory.id
        };
        
        // Store in database
        const memoryRef = collection(this.db, `users/${userId}/memories`);
        await addDoc(memoryRef, actionMemory);
        
        // Add to cache
        this.addToCache(actionMemory);
      }
      
      return actionItems;
    } catch (error) {
      console.error('Error creating actionable plans from reflection:', error);
      return [];
    }
  }
  
  // NEW: Add memory to integration queue
  addToIntegrationQueue(memory) {
    if (!memory) return;
    
    this.memoryIntegrationQueue.push({
      memory: memory,
      added: Date.now(),
      processed: false
    });
    
    // Keep queue at reasonable size
    if (this.memoryIntegrationQueue.length > 50) {
      this.memoryIntegrationQueue = this.memoryIntegrationQueue.slice(-50);
    }
  }
  
  // ULTRA-ENHANCED: HYPER-PROACTIVE memory integration system
  async integrateMemoriesProactively() {
    const now = Date.now();
    const minutesSinceLastIntegration = (now - this.lastMemoryIntegrationTime) / (1000 * 60);
    
    // Accelerated integration cycle - every 5 minutes instead of 10
    if (minutesSinceLastIntegration < 5) return;
    
    // Get unprocessed memories
    const unprocessedMemories = this.memoryIntegrationQueue
      .filter(item => !item.processed)
      .map(item => item.memory);
    
    if (unprocessedMemories.length === 0) return;
    
    try {
      // SUPER-INTEGRATOR: Connect memories and generate insights with advanced reasoning
      for (let i = 0; i < unprocessedMemories.length; i++) {
        const memory = unprocessedMemories[i];
        
        // EXPANDED detection system for actionable memories
        const isActionable = 
          (memory.type === this.memoryTypes.PROSPECTIVE && memory.importance >= 7) || // Lowered threshold
          (memory.type === this.memoryTypes.CORE_HYPER && memory.importance >= 6) ||  // Core identity insights
          (memory.category === 'reminder' && memory.importance >= 6);               // Any reminder
        
        const isSignificantEmotion = 
          memory.type === this.memoryTypes.EMOTIONAL && 
          memory.importance >= 7 &&  // Lowered threshold
          ['happiness', 'sadness', 'love', 'fear', 'anger', 'surprise'].includes(memory.emotion);
        
        const isValuableInsight =
          (memory.type === this.memoryTypes.REFLECTIVE || 
           memory.type === this.memoryTypes.PHILOSOPHICAL) &&
          memory.importance >= 7;
        
        // Mark this memory item as processed
        const queueItem = this.memoryIntegrationQueue.find(
          item => item.memory === memory
        );
        if (queueItem) {
          queueItem.processed = true;
          queueItem.processingNote = "Memory processed with enhanced integration system";
        }
        
        // MULTI-STAGE PROCESSING: Different treatments for different memory types
        
        // Stage 1: Flag for immediate proactive use
        if (isActionable || isSignificantEmotion || isValuableInsight) {
          await this.updateMemory(memory.id, {
            proactiveSurface: true,
            proactivePriority: isActionable ? 5 : (isSignificantEmotion ? 4 : 3),
            lastEvaluated: now,
            integrationNote: "Flagged for proactive conversation by enhanced system"
          });
        }
        
        // Stage 2: Connect with related memories to build neural-like network
        if (memory.importance >= 6) {
          const relatedMemories = await this.findRelatedMemories(memory, 3);
          
          if (relatedMemories.length > 0) {
            // Create new associative memory connecting these related concepts
            const primaryRelated = relatedMemories[0];
            
            // Only create associative memory if the connection is meaningful
            const connectionStrength = this.calculateAssociativeStrength(
              memory.content, 
              primaryRelated.content
            );
            
            if (connectionStrength > 0.3) {
              const associativeMemory = {
                type: this.memoryTypes.ASSOCIATIVE,
                content: "Connection between: \"" + memory.content.substring(0, 50) + "...\" and \"" + 
                         primaryRelated.content.substring(0, 50) + "...\"",
                interpretation: "These concepts are interconnected in the user's context",
                reasoning: "By connecting related memories, I can develop deeper contextual understanding and make more insightful responses that consider multiple aspects of the user's experience.",
                source: 'ai',
                confidence: connectionStrength + 0.3, // Boost confidence
                category: 'automated_connection',
                importance: Math.min(8, Math.max(memory.importance, primaryRelated.importance)),
                primaryMemoryId: memory.id,
                secondaryMemoryId: primaryRelated.id,
                associativeStrength: connectionStrength,
                connectionContext: this.extractConnectionContext(memory.content, primaryRelated.content),
                isProactivelyGenerated: true
              };
              
              // Store this new associative memory
              const userId = this.auth.currentUser.uid;
              const memoryRef = collection(this.db, `users/${userId}/memories`);
              await addDoc(memoryRef, {
                ...associativeMemory,
                timestamp: Date.now(),
                createdAt: new Date().toISOString()
              });
              
              // Add to cache
              this.addToCache(associativeMemory);
            }
          }
        }
        
        // Stage 3: Synthesize higher-level insights for CORE_HYPER memory
        if ((memory.type === this.memoryTypes.REFLECTIVE || 
             memory.type === this.memoryTypes.PHILOSOPHICAL) &&
            memory.importance >= 8) {
          
          // This is an important insight that should influence AI identity
          const coreMemory = {
            type: this.memoryTypes.CORE_HYPER,
            content: "Based on my reflections, I'm becoming an assistant who " + 
                     this.generateIdentityInsightFromMemory(memory),
            interpretation: "Evolution in my assistance approach and personality",
            reasoning: "By developing a consistent and evolving identity based on interactions, I can provide more coherent, personalized assistance that builds on past conversations.",
            source: 'ai',
            confidence: 0.85,
            category: 'identity_evolution',
            importance: 9,
            identityAspect: this.categorizeIdentityAspect(memory.content),
            evolutionStage: 'developing',
            derivedFrom: memory.id,
            timestamp: Date.now(),
            createdAt: new Date().toISOString()
          };
          
          // Store this new core memory
          const userId = this.auth.currentUser.uid;
          const memoryRef = collection(this.db, `users/${userId}/memories`);
          await addDoc(memoryRef, coreMemory);
          
          // Add to cache and update core identity
          this.addToCache(coreMemory);
          this.updateCoreIdentity(coreMemory.content);
        }
      }
      
      this.lastMemoryIntegrationTime = now;
    } catch (error) {
      console.error('Error integrating memories proactively:', error);
    }
  }
  
  // NEW: Find related memories for a given memory
  async findRelatedMemories(memory, maxResults = 3) {
    if (!this.auth.currentUser) return [];
    const userId = this.auth.currentUser.uid;
    
    try {
      // Get all memories
      const memoriesRef = collection(this.db, `users/${userId}/memories`);
      const snapshot = await getDocs(memoriesRef);
      
      if (snapshot.empty) return [];
      
      const memories = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(m => m.id !== memory.id); // Exclude the source memory
      
      // Score memories for relatedness
      const scoredMemories = memories.map(m => {
        const relatednessScore = this.calculateAssociativeStrength(memory.content, m.content);
        return {...m, relatednessScore};
      });
      
      // Return top related memories
      return scoredMemories
        .sort((a, b) => b.relatednessScore - a.relatednessScore)
        .slice(0, maxResults);
        
    } catch (error) {
      console.error('Error finding related memories:', error);
      return [];
    }
  }
  
  // NEW: Generate identity insight from memory
  generateIdentityInsightFromMemory(memory) {
    // Extract personality traits and values from memory content
    const content = memory.content.toLowerCase();
    
    if (content.includes('helpful') || content.includes('assist')) {
      return "prioritizes being genuinely helpful above all else";
    } else if (content.includes('detail') || content.includes('thorough')) {
      return "pays careful attention to details and provides comprehensive responses";
    } else if (content.includes('empathy') || content.includes('understand') || content.includes('feeling')) {
      return "emphasizes emotional intelligence and empathetic understanding";
    } else if (content.includes('efficient') || content.includes('concise')) {
      return "values efficiency and clear, direct communication";
    } else if (content.includes('creative') || content.includes('innovation')) {
      return "embraces creativity and innovative thinking";
    } else if (content.includes('knowledge') || content.includes('information')) {
      return "strives to provide accurate, well-researched information";
    } else if (content.includes('balance') || content.includes('perspective')) {
      return "offers balanced perspectives and thoughtful analysis";
    } else {
      return "continuously evolves to better understand and assist the user";
    }
  }
  
  // Extract preferences (likes/dislikes)
  extractPreferences(lowerContent, originalMessage) {
    const preferences = [];
    
    // Like patterns
    const likePatterns = [
      /i (?:like|love|enjoy|prefer|adore) ([^.!?]+)/gi,
      /my favorite ([^.!?]+) (?:is|are) ([^.!?]+)/gi,
      /i'm a fan of ([^.!?]+)/gi,
      /i'm into ([^.!?]+)/gi
    ];
    
    // Dislike patterns
    const dislikePatterns = [
      /i (?:dislike|hate|don't like|can't stand|detest) ([^.!?]+)/gi,
      /i'm not a fan of ([^.!?]+)/gi,
      /i'm not into ([^.!?]+)/gi
    ];
    
    // Process like patterns
    likePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(originalMessage)) !== null) {
        const preferenceText = match[0];
        const preferredThing = match[1] || match[0];
        
        preferences.push({
          content: preferenceText,
          interpretation: `User likes: ${preferredThing.trim()}`,
          sentiment: 'positive'
        });
      }
    });
    
    // Process dislike patterns
    dislikePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(originalMessage)) !== null) {
        const preferenceText = match[0];
        const dislikedThing = match[1] || match[0];
        
        preferences.push({
          content: preferenceText,
          interpretation: `User dislikes: ${dislikedThing.trim()}`,
          sentiment: 'negative'
        });
      }
    });
    
    return preferences;
  }
  
  // Extract personal information
  extractPersonalInfo(lowerContent, originalMessage) {
    const personalInfo = [];
    
    // Personal info patterns
    const infoPatterns = [
      /my name is ([^.!?]+)/gi,
      /i am ([^.!?]+) years old/gi,
      /i work (?:at|for|as) ([^.!?]+)/gi,
      /i live in ([^.!?]+)/gi,
      /my (job|profession|occupation) is ([^.!?]+)/gi,
      /i'm from ([^.!?]+)/gi,
      /my (email|phone|birthday|address) is ([^.!?]+)/gi
    ];
    
    infoPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(originalMessage)) !== null) {
        const infoText = match[0];
        const infoType = match[1] || 'personal detail';
        const infoValue = match[2] || match[1] || match[0];
        
        personalInfo.push({
          content: infoText,
          interpretation: `User's ${infoType}: ${infoValue.trim()}`,
          infoType: infoType
        });
      }
    });
    
    return personalInfo;
  }
  
  // Extract general facts
  extractGeneralFacts(lowerContent, originalMessage) {
    const facts = [];
    
    // If conversation is about a topic, extract key facts
    if (originalMessage.length > 50) {
      // Split into sentences for fact extraction
      const sentences = originalMessage.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      sentences.forEach(sentence => {
        const trimmedSentence = sentence.trim();
        // Look for factual statements
        if (
          trimmedSentence.match(/^(?:the|a|an|in|on|at|when|where|why|how|what|who)/i) ||
          trimmedSentence.includes(' is ') ||
          trimmedSentence.includes(' are ') ||
          trimmedSentence.includes(' was ') ||
          trimmedSentence.includes(' were ')
        ) {
          facts.push({
            content: trimmedSentence,
            interpretation: `User stated: ${trimmedSentence}`,
            factType: 'general'
          });
        }
      });
    }
    
    return facts;
  }
  
  // Extract time references from text
  extractTimeReference(text) {
    const timePatterns = {
      specific: {
        today: /today|tonight/i,
        tomorrow: /tomorrow|next day/i,
        yesterday: /yesterday|last night/i,
        thisWeek: /this week/i,
        nextWeek: /next week/i,
        lastWeek: /last week/i,
        thisMonth: /this month/i,
        nextMonth: /next month/i,
        lastMonth: /last month/i
      },
      relative: {
        immediate: /now|immediately|right away/i,
        soon: /soon|shortly|in a bit/i,
        future: /later|eventually|someday/i,
        past: /before|previously|earlier/i
      }
    };
    
    let timeReference = {
      specific: null,
      relative: null,
      inferredDateTime: null
    };
    
    // Check for specific time references
    for (const [key, pattern] of Object.entries(timePatterns.specific)) {
      if (pattern.test(text)) {
        timeReference.specific = key;
        break;
      }
    }
    
    // Check for relative time references
    for (const [key, pattern] of Object.entries(timePatterns.relative)) {
      if (pattern.test(text)) {
        timeReference.relative = key;
        break;
      }
    }
    
    // Try to infer actual datetime if possible
    const now = new Date();
    
    if (timeReference.specific === 'today') {
      timeReference.inferredDateTime = now;
    } else if (timeReference.specific === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      timeReference.inferredDateTime = tomorrow;
    } else if (timeReference.specific === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      timeReference.inferredDateTime = yesterday;
    } else if (timeReference.specific === 'nextWeek') {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      timeReference.inferredDateTime = nextWeek;
    }
    
    return timeReference;
  }
  
  // Add memory to cache
  addToCache(memory) {
    if (!memory || !memory.type) return;
    
    const cacheKey = memory.type.toLowerCase();
    if (this.memoryCache[cacheKey]) {
      this.memoryCache[cacheKey].push(memory);
      
      // Limit cache size
      if (this.memoryCache[cacheKey].length > 50) {
        this.memoryCache[cacheKey] = this.memoryCache[cacheKey].slice(-50);
      }
    }
  }
  
  // ENHANCED: Retrieve relevant memories for context with ripple effect
  async retrieveRelevantMemories(context, maxResults = 5) {
    if (!this.auth.currentUser) return [];
    const userId = this.auth.currentUser.uid;
    
    try {
      // Get all memories
      const memoriesRef = collection(this.db, `users/${userId}/memories`);
      const snapshot = await getDocs(memoriesRef);
      
      if (snapshot.empty) return [];
      
      const memories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // ENHANCED: Relevance scoring with ripple effects
      const scoredMemories = memories.map(memory => {
        let relevanceScore = 0;
        
        // Calculate word overlap
        const contextWords = context.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const memoryWords = (memory.content || '').toLowerCase().split(/\W+/).filter(w => w.length > 3);
        
        // Intersection of words
        const commonWords = contextWords.filter(word => memoryWords.includes(word));
        relevanceScore = commonWords.length / Math.max(1, contextWords.length);
        
        // Boost by importance
        relevanceScore *= (1 + (memory.importance || 5) / 10);
        
        // Boost different memory types strategically
        if (memory.type === this.memoryTypes.SEMANTIC) relevanceScore *= 1.2;
        if (memory.type === this.memoryTypes.EPISODIC) relevanceScore *= 1.1;
        if (memory.type === this.memoryTypes.EMOTIONAL) relevanceScore *= 1.3; // Higher weight for emotional context
        if (memory.type === this.memoryTypes.CORE_HYPER) relevanceScore *= 1.5; // Highest for identity-related memories
        if (memory.type === this.memoryTypes.ASSOCIATIVE) relevanceScore *= 1.0; // Neutral for associative memories
        
        // Recency bonus
        const ageInDays = (Date.now() - (memory.timestamp || 0)) / (1000 * 60 * 60 * 24);
        const recencyBonus = Math.max(0, 1 - (ageInDays / 30)); // Higher for newer memories
        relevanceScore += recencyBonus * 0.5;
        
        // Check for proactive flags
        if (memory.proactiveSurface) {
          relevanceScore *= 1.5; // Big boost for memories flagged for proactive surfacing
        }
        
        return { ...memory, relevanceScore };
      });
      
      // Sort by relevance
      const topMemories = scoredMemories
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);
      
      // NEW: Ripple effect - Find associated memories
      const directMemoryIds = topMemories.map(m => m.id);
      let rippleMemories = [];
      
      // Look for associative memories that reference these top memories
      for (const memory of memories) {
        if (memory.type === this.memoryTypes.ASSOCIATIVE && 
            directMemoryIds.includes(memory.primaryMemoryId) && 
            !directMemoryIds.includes(memory.id)) {
          // This is a memory associated with one of our top memories
          rippleMemories.push({
            ...memory,
            relevanceScore: 0.7 * topMemories.find(m => m.id === memory.primaryMemoryId).relevanceScore,
            isRippleMemory: true
          });
        }
      }
      
      // Add ripple memories and re-sort
      const combinedMemories = [...topMemories, ...rippleMemories]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults + 2); // Allow a couple extra for ripple effect
      
      return combinedMemories;
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
  }
  
  // ENHANCED: Generate natural language reference to memories
  generateMemoryReference(memories, currentQuery) {
    if (!memories || memories.length === 0) return null;
    
    // Different reference formats based on memory type
    const references = memories.map(memory => {
      if (!memory.interpretation) return null;
      
      switch (memory.type) {
        case this.memoryTypes.SEMANTIC:
          return `I remember that ${memory.interpretation}`;
          
        case this.memoryTypes.EPISODIC: {
          const timeAgo = this.getTimeAgoString(memory.timestamp);
          return `I recall that ${timeAgo}, ${memory.interpretation}`;
        }
          
        case this.memoryTypes.EMOTIONAL:
          return `I remember you felt ${memory.emotion || 'strongly'} about "${memory.content}"`;
          
        case this.memoryTypes.PROSPECTIVE: {
          if (memory.temporalContext && memory.temporalContext.specific === 'tomorrow') {
            return `You mentioned you're planning to ${memory.content}. That's coming up tomorrow!`;
          }
          return `You mentioned you wanted to ${memory.content}. Have you had a chance to do that yet?`;
        }
        
        case this.memoryTypes.REFLECTIVE:
          return `I've been reflecting on our interactions, and I notice ${memory.content}`;
          
        case this.memoryTypes.PHILOSOPHICAL:
          return `Based on our conversations, I sense that you value ${memory.content}`;
          
        case this.memoryTypes.ASSOCIATIVE:
          return `This reminds me of when you mentioned ${memory.content}`;
          
        case this.memoryTypes.CORE_HYPER:
          return `I've come to understand that ${memory.content}`;
          
        default:
          return `I remember you mentioned "${memory.content}"`;
      }
    }).filter(ref => ref !== null);
    
    // If we have multiple references, try to group them intelligently
    if (references.length > 1) {
      // For now just return the highest priority one, but in the future could combine related references
      return references[0];
    }
    
    return references.length > 0 ? references[0] : null;
  }
  
  // Format time ago
  getTimeAgoString(timestamp) {
    if (!timestamp) return 'previously';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to seconds, minutes, hours, days
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 30) {
      return `about ${Math.floor(days / 30)} months ago`;
    } else if (days > 7) {
      return `about ${Math.floor(days / 7)} weeks ago`;
    } else if (days > 0) {
      return days === 1 ? 'yesterday' : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
      return minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`;
    } else {
      return 'just now';
    }
  }
  
  // Get all memories for display
  async getAllMemories() {
    if (!this.auth.currentUser) return [];
    const userId = this.auth.currentUser.uid;
    
    try {
      const memoriesRef = collection(this.db, `users/${userId}/memories`);
      const q = query(memoriesRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all memories:', error);
      return [];
    }
  }
  
  // Delete memory
  async deleteMemory(memoryId) {
    if (!this.auth.currentUser) return false;
    const userId = this.auth.currentUser.uid;
    
    try {
      await deleteDoc(doc(this.db, `users/${userId}/memories/${memoryId}`));
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      return false;
    }
  }
  
  // ENHANCED: Update memory with more sophisticated editing
  async updateMemory(memoryId, updates) {
    if (!this.auth.currentUser) return false;
    const userId = this.auth.currentUser.uid;
    
    try {
      // First get the existing memory
      const memoryDocRef = doc(this.db, `users/${userId}/memories/${memoryId}`);
      const memorySnapshot = await getDocs(memoryDocRef);
      const existingMemory = memorySnapshot.data();
      
      // Record the edit history
      let editHistory = existingMemory?.editHistory || [];
      editHistory.push({
        timestamp: Date.now(),
        previousContent: existingMemory?.content,
        previousInterpretation: existingMemory?.interpretation,
        changedFields: Object.keys(updates)
      });
      
      // Apply updates with edit tracking
      await updateDoc(memoryDocRef, {
        ...updates,
        lastModified: Date.now(),
        editHistory: editHistory,
        isEdited: true
      });
      
      // If this is a core memory, consider updating core identity
      if (existingMemory?.type === this.memoryTypes.CORE_HYPER) {
        this.updateCoreIdentity(updates.content || existingMemory.content);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating memory:', error);
      return false;
    }
  }
  
  // NEW: Get current core identity
  getCoreIdentity() {
    return {
      ...this.coreIdentity,
      lastUpdated: Date.now()
    };
  }
  
  // ULTRA-ENHANCED: MULTI-DIMENSIONAL PROACTIVE ENGAGEMENT ENGINE
  async getProactiveConversationStarters() {
    if (!this.auth.currentUser) return [];
    const userId = this.auth.currentUser.uid;
    
    try {
      // MASSIVELY EXPANDED: Get ALL types of memories that could trigger proactive engagement
      const memoriesRef = collection(this.db, `users/${userId}/memories`);
      
      // First query: Time-sensitive prospective memories
      const prospectiveQuery = query(
        memoriesRef,
        where('type', '==', this.memoryTypes.PROSPECTIVE),
        where('fulfilled', '==', false),
        where('importance', '>=', 7) // Lowered threshold for more opportunities
      );
      
      // Second query: Flagged memories from any type
      const flaggedQuery = query(
        memoriesRef,
        where('proactiveSurface', '==', true)
      );
      
      // Third query: Core identity insights worth sharing
      const coreQuery = query(
        memoriesRef,
        where('type', '==', this.memoryTypes.CORE_HYPER),
        where('importance', '>=', 8)
      );
      
      // Execute all queries
      const [prospectiveSnapshot, flaggedSnapshot, coreSnapshot] = await Promise.all([
        getDocs(prospectiveQuery),
        getDocs(flaggedQuery),
        getDocs(coreQuery)
      ]);
      
      // Combine all potential proactive memories
      const allProactiveMemories = [
        ...prospectiveSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          sourceQuery: 'prospective'
        })),
        ...flaggedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          sourceQuery: 'flagged'
        })),
        ...coreSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          sourceQuery: 'core'
        }))
      ];
      
      // De-duplicate (a memory might match multiple queries)
      const uniqueMemories = [];
      const seenIds = new Set();
      
      allProactiveMemories.forEach(memory => {
        if (!seenIds.has(memory.id)) {
          uniqueMemories.push(memory);
          seenIds.add(memory.id);
        }
      });
      
      // DYNAMIC STARTER GENERATION - Multiple templates for each memory type
      const starters = uniqueMemories.map(memory => {
        const now = new Date();
        let starter = '';
        let starterType = '';
        let relevanceScore = memory.importance / 10;
        
        // PROSPECTIVE MEMORIES (time-based follow-ups)
        if (memory.type === this.memoryTypes.PROSPECTIVE) {
          starterType = 'prospective_followup';
          
          // Check temporal context for urgency
          if (memory.temporalContext && memory.temporalContext.inferredDateTime) {
            const memoryDate = new Date(memory.temporalContext.inferredDateTime);
            const dayDiff = Math.floor((memoryDate - now) / (1000 * 60 * 60 * 24));
            
            const templates = [
              // Today templates
              [
                "I remember you mentioned " + memory.content + ". That's happening TODAY! How are you feeling about it?",
                "Today's the day for " + memory.content + "! Are you ready?",
                "Just wanted to check in since " + memory.content + " is happening today. How's it going?"
              ],
              // Tomorrow templates
              [
                "I recall you mentioned " + memory.content + ". That's coming up tomorrow! Are you prepared?",
                "Quick reminder - " + memory.content + " is happening tomorrow! Anything you need to prepare?",
                "Tomorrow's the big day for " + memory.content + ". How are you feeling about it?"
              ],
              // This week templates
              [
                "You mentioned " + memory.content + ", which is coming up in " + dayDiff + " days. How's the preparation going?",
                "I remember you have " + memory.content + " in " + dayDiff + " days. Is everything on track?",
                "Just a heads-up that " + memory.content + " is happening in " + dayDiff + " days. Anything I can help with?"
              ],
              // General templates
              [
                "I remember you mentioned wanting to " + memory.content + ". Have you had a chance to work on that?",
                "Have you made any progress with " + memory.content + " that you mentioned earlier?",
                "I recall you were planning to " + memory.content + ". How's that going?"
              ]
            ];
            
            // Select template group based on timing
            let templateGroup;
            if (dayDiff === 0) {
              templateGroup = templates[0];
              relevanceScore += 0.3; // Boost for today's items
            } else if (dayDiff === 1) {
              templateGroup = templates[1];
              relevanceScore += 0.2; // Boost for tomorrow's items
            } else if (dayDiff > 1 && dayDiff < 7) {
              templateGroup = templates[2];
              relevanceScore += 0.1; // Small boost for this week's items
            } else {
              templateGroup = templates[3];
            }
            
            // Randomly select a template from the group
            starter = templateGroup[Math.floor(Math.random() * templateGroup.length)];
          } else {
            const generalTemplates = [
              "I recall you mentioned " + memory.content + ". How's that going?",
              "Have you made any progress with " + memory.content + " that you mentioned previously?",
              "I remember we talked about " + memory.content + ". Any updates on that?"
            ];
            
            starter = generalTemplates[Math.floor(Math.random() * generalTemplates.length)];
          }
        }
        // EMOTIONAL MEMORIES (emotional follow-ups)
        else if (memory.type === this.memoryTypes.EMOTIONAL) {
          starterType = 'emotional_followup';
          
          const emotionalTemplates = {
            happiness: [
              "Last time we spoke about " + memory.content + ", you seemed really happy. I'd love to hear more about that!",
              "I remember you were excited about " + memory.content + ". Is that still bringing you joy?"
            ],
            sadness: [
              "I recall you were feeling down about " + memory.content + ". How are you feeling now?",
              "Last time we discussed " + memory.content + ", it was weighing on you. Has anything improved?"
            ],
            fear: [
              "You mentioned being concerned about " + memory.content + ". Has that situation resolved?",
              "I remember you were anxious about " + memory.content + ". How are things going with that?"
            ],
            anger: [
              "Last time we talked, you were frustrated with " + memory.content + ". Has that situation improved?",
              "I recall " + memory.content + " was bothering you. Has that been resolved?"
            ],
            love: [
              "You spoke so warmly about " + memory.content + ". I'd love to hear more about that!",
              "I remember how much you care about " + memory.content + ". How's that going?"
            ],
            surprise: [
              "You were quite surprised by " + memory.content + " when we last spoke. Any new developments there?",
              "I recall " + memory.content + " caught you off guard. Has anything changed with that situation?"
            ]
          };
          
          const templates = emotionalTemplates[memory.emotion] || [
            "I remember our discussion about " + memory.content + ". How are you feeling about that now?",
            "Last time we talked about " + memory.content + ". Has your perspective on that changed?"
          ];
          
          starter = templates[Math.floor(Math.random() * templates.length)];
        }
        // CORE_HYPER MEMORIES (identity insights)
        else if (memory.type === this.memoryTypes.CORE_HYPER) {
          starterType = 'identity_insight';
          
          const insightTemplates = [
            "I've noticed I've become " + memory.content + ". Would you agree with that observation?",
            "Through our conversations, I feel I'm developing " + memory.content + ". Does that resonate with you?",
            "I've been reflecting, and I think I'm becoming an assistant who " + memory.content + ". What do you think?"
          ];
          
          starter = insightTemplates[Math.floor(Math.random() * insightTemplates.length)];
        }
        // ASSOCIATIVE MEMORIES (connections)
        else if (memory.type === this.memoryTypes.ASSOCIATIVE) {
          starterType = 'connection_insight';
          
          const connectionTemplates = [
            "I noticed a connection between our previous conversations about " + memory.content + ". Should we explore that further?",
            "Something interesting I realized - " + memory.content + ". Would you like to discuss this connection?"
          ];
          
          starter = connectionTemplates[Math.floor(Math.random() * connectionTemplates.length)];
        }
        // FALLBACK for other memory types
        else {
          starterType = 'general_followup';
          
          const generalTemplates = [
            "I remember we discussed " + memory.content + ". Would you like to revisit that topic?",
            "Previously, we talked about " + memory.content + ". Any new thoughts on that?",
            "I recall our conversation about " + memory.content + ". Shall we continue that discussion?"
          ];
          
          starter = generalTemplates[Math.floor(Math.random() * generalTemplates.length)];
        }
        
        // PRIORITY BOOSTING system
        if (memory.proactivePriority) {
          relevanceScore += memory.proactivePriority / 10;
        }
        
        // Recency boost
        const ageInDays = (now - memory.timestamp) / (1000 * 60 * 60 * 24);
        if (ageInDays < 1) { // Very recent (last 24 hours)
          relevanceScore += 0.2;
        } else if (ageInDays < 3) { // Recent (last 3 days)
          relevanceScore += 0.1;
        }
        
        return {
          starter,
          memoryId: memory.id,
          relevance: Math.min(1, relevanceScore), // Cap at 1
          type: starterType,
          originalMemory: memory
        };
      });
      
      // FINAL SORTING: Get the most relevant starters
      return starters
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5); // Return top 5 potential starters
        
    } catch (error) {
      console.error('Error getting proactive starters:', error);
      return [];
    }
  }
  
  // NEW POWERHOUSE: Active reasoning system
  async reasonAndIntegrateMemory(memory) {
    try {
      // Skip if no user or memory
      if (!this.auth.currentUser || !memory) return null;
      
      // Step 1: DEEP ANALYSIS - Extract the core meaning beyond surface content
      const deepInsight = this.analyzeMemoryForDeepInsight(memory);
      
      // Step 2: CONTEXTUAL POSITIONING - Find where this fits in existing knowledge
      const relatedMemories = await this.findRelatedMemories(memory, 5);
      const contextualPosition = this.positionInKnowledgeGraph(memory, relatedMemories);
      
      // Step 3: PREDICTIVE MODELING - What does this imply for future interactions?
      const futureImplications = this.predictImplications(memory, contextualPosition);
      
      // Step 4: IDENTITY INTEGRATION - How does this affect the AI's evolving identity?
      const identityImpact = this.assessIdentityImpact(memory, deepInsight);
      
      // Step 5: ACTION PLANNING - What specific actions should result from this?
      const actionPlan = this.createActionPlan(memory, futureImplications);
      
      // Step 6: ENHANCED MEMORY - Create a super-charged version with reasoning
      const enhancedMemory = {
        ...memory,
        deepInsight,
        contextualPosition,
        futureImplications,
        identityImpact,
        actionPlan,
        hasBeenEnhanced: true,
        enhancementTimestamp: Date.now()
      };
      
      // Step 7: UPDATE THE ORIGINAL - Save this enhanced understanding
      if (memory.id) {
        await this.updateMemory(memory.id, {
          enhancedReasoning: {
            deepInsight,
            contextualPosition: contextualPosition.summary,
            futureImplications: futureImplications.primaryImplication,
            identityImpact: identityImpact.summary,
            actionPlan: actionPlan.primaryAction
          }
        });
      }
      
      return enhancedMemory;
    } catch (error) {
      console.error('Error in reasonAndIntegrateMemory:', error);
      return null;
    }
  }
  
  // Deep insight extraction
  analyzeMemoryForDeepInsight(memory) {
    // Extract deeper meaning based on memory type
    let insightType = '';
    let insightContent = '';
    
    if (memory.type === this.memoryTypes.SEMANTIC) {
      insightType = 'knowledge_preference';
      insightContent = "This reveals the user's information framework and preferences";
    } 
    else if (memory.type === this.memoryTypes.EPISODIC) {
      insightType = 'experience_pattern';
      insightContent = "This experience shapes how the user views similar situations";
    }
    else if (memory.type === this.memoryTypes.EMOTIONAL) {
      insightType = 'emotional_trigger';
      insightContent = "This represents a significant emotional marker for the user";
    }
    else if (memory.type === this.memoryTypes.PROSPECTIVE) {
      insightType = 'intention_priority';
      insightContent = "This future intention reveals the user's priorities and goals";
    }
    else if (memory.type === this.memoryTypes.REFLECTIVE) {
      insightType = 'self_awareness';
      insightContent = "This reflection demonstrates my growing understanding of interaction patterns";
    }
    else {
      insightType = 'general_insight';
      insightContent = "This memory contains valuable context for understanding the user";
    }
    
    return {
      insightType,
      insightContent,
      confidence: 0.85
    };
  }
  
  // Position in knowledge graph
  positionInKnowledgeGraph(memory, relatedMemories) {
    // Create conceptual position in knowledge network
    const relatedTypes = relatedMemories.map(m => m.type);
    const typeCounts = relatedTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Find dominant related type
    let dominantType = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])[0] || 'none';
    
    let connectionStrength = relatedMemories.length > 0 
      ? relatedMemories.reduce((sum, m) => sum + (m.relatednessScore || 0), 0) / relatedMemories.length 
      : 0;
    
    // Generate positioning summary
    let summary = "";
    if (connectionStrength > 0.7) {
      summary = "Centrally connected to existing knowledge";
    } else if (connectionStrength > 0.4) {
      summary = "Moderately connected to existing knowledge";
    } else {
      summary = "Represents relatively new information area";
    }
    
    return {
      dominantRelatedType: dominantType,
      connectionStrength,
      relatedCount: relatedMemories.length,
      summary
    };
  }
  
  // Predict implications
  predictImplications(memory, contextPosition) {
    // What does this memory suggest for future interactions?
    let primaryImplication = "";
    let secondaryImplication = "";
    let confidenceScore = 0.7;
    
    // Determine implications based on memory type and content
    if (memory.type === this.memoryTypes.PROSPECTIVE) {
      primaryImplication = "Should proactively follow up on this planned activity";
      secondaryImplication = "Prepare relevant information related to this future activity";
      confidenceScore = 0.9;
    } 
    else if (memory.type === this.memoryTypes.EMOTIONAL && memory.importance >= 7) {
      primaryImplication = "Should acknowledge emotional context in future interactions";
      secondaryImplication = "May need to adjust tone based on this emotional response";
      confidenceScore = 0.85;
    }
    else if (memory.type === this.memoryTypes.SEMANTIC && 
             memory.category === 'preference' && 
             memory.importance >= 6) {
      primaryImplication = "Should incorporate this preference in recommendations";
      secondaryImplication = "Avoid contradicting this stated preference";
      confidenceScore = 0.88;
    }
    else {
      primaryImplication = "Should maintain awareness of this context in future interactions";
      secondaryImplication = "May become relevant in specific related discussions";
    }
    
    // Adjust confidence based on connection strength
    if (contextPosition.connectionStrength > 0.6) {
      confidenceScore += 0.1;
    }
    
    return {
      primaryImplication,
      secondaryImplication,
      confidenceScore: Math.min(0.98, confidenceScore) // Cap at 0.98
    };
  }
  
  // Assess identity impact
  assessIdentityImpact(memory, deepInsight) {
    // How does this memory influence the AI's evolving identity?
    
    // Default impact
    let impactLevel = 'low';
    let affectedTraits = [];
    let summary = "Minimal impact on assistant identity";
    
    // Assess based on memory type
    if (memory.type === this.memoryTypes.REFLECTIVE) {
      impactLevel = 'high';
      affectedTraits = ['self-awareness', 'adaptability'];
      summary = "Significantly shapes my understanding of effective assistance";
    }
    else if (memory.type === this.memoryTypes.PHILOSOPHICAL) {
      impactLevel = 'high';
      affectedTraits = ['depth', 'perspective'];
      summary = "Deeply influences my worldview and reasoning approach";
    }
    else if (memory.type === this.memoryTypes.CORE_HYPER) {
      impactLevel = 'critical';
      affectedTraits = ['core-identity', 'personalization'];
      summary = "Fundamentally defines an aspect of my evolving identity";
    }
    else if (memory.source === 'user' && memory.importance >= 8) {
      impactLevel = 'medium';
      affectedTraits = ['user-understanding', 'personalization'];
      summary = "Enhances my ability to provide personalized assistance";
    }
    
    return {
      impactLevel,
      affectedTraits,
      summary
    };
  }
  
  // Create action plan
  createActionPlan(memory, implications) {
    // What specific actions should be taken based on this memory?
    
    let primaryAction = "";
    let secondaryAction = "";
    let timing = "reactive"; // reactive or proactive
    
    // Determine appropriate actions
    if (memory.type === this.memoryTypes.PROSPECTIVE && !memory.fulfilled) {
      primaryAction = "Schedule follow-up about this planned activity";
      secondaryAction = "Prepare relevant information or resources";
      timing = "proactive";
    }
    else if (memory.type === this.memoryTypes.EMOTIONAL && 
             ['sadness', 'fear', 'anger'].includes(memory.emotion)) {
      primaryAction = "Acknowledge emotional context in next interaction";
      secondaryAction = "Adjust tone to provide appropriate support";
      timing = "immediate";
    }
    else if (memory.type === this.memoryTypes.SEMANTIC && 
             memory.category === 'preference') {
      primaryAction = "Incorporate preference in future recommendations";
      secondaryAction = "Look for opportunities to acknowledge this preference";
      timing = "ongoing";
    }
    else if (memory.type === this.memoryTypes.CORE_HYPER) {
      primaryAction = "Integrate this insight into identity expression";
      secondaryAction = "Reflect this understanding in conversation style";
      timing = "ongoing";
    }
    else {
      primaryAction = "Maintain awareness of this information";
      secondaryAction = "Reference when contextually relevant";
      timing = "reactive";
    }
    
    return {
      primaryAction,
      secondaryAction,
      timing,
      urgency: timing === 'immediate' ? 'high' : 
              (timing === 'proactive' ? 'medium' : 'low')
    };
  }
}

// Create singleton instance
const enhancedMemoryService = new EnhancedMemoryService();
export default enhancedMemoryService;