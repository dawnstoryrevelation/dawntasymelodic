// src/services/EnhancedMemoryService.js

import { getFirestore, collection, addDoc, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

class EnhancedMemoryService {
  constructor() {
    this.db = getFirestore();
    this.auth = getAuth();
    
    // Memory architecture inspired by human brain
    this.memoryTypes = {
      SEMANTIC: 'semantic',     // Factual knowledge (neocortex)
      EPISODIC: 'episodic',     // Events with context (hippocampus)
      PROCEDURAL: 'procedural', // Skills and habits
      WORKING: 'working',       // Currently active thoughts (prefrontal cortex)
      EMOTIONAL: 'emotional',   // Emotional associations
      PROSPECTIVE: 'prospective' // Future intentions
    };
    
    // In-memory cache
    this.memoryCache = {
      semantic: [],
      episodic: [],
      procedural: [],
      working: [],
      emotional: [],
      prospective: []
    };
    
    // Cognitive processing system
    this.cognitiveSystem = {
      interpretationThreshold: 0.7,
      meaningExtractionEnabled: true,
      contextRetentionFactor: 0.9,
      emotionalProcessingEnabled: true
    };
  }
  
  // Process and extract meaningful information from message
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
      
      // Store all extracted memories
      const allMemories = [
        ...semanticMemories, 
        ...episodicMemories,
        ...emotionalMemories,
        ...prospectiveMemories
      ];
      
      // Store memories in Firebase
      for (const memory of allMemories) {
        const memoryRef = collection(this.db, `users/${userId}/memories`);
        await addDoc(memoryRef, {
          ...memory,
          timestamp: Date.now(),
          createdAt: new Date().toISOString()
        });
        
        // Add to cache
        this.addToCache(memory);
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
          const interpretation = `User experienced: ${eventDetails.trim()}`;
          
          memories.push({
            type: this.memoryTypes.EPISODIC,
            content: eventText,
            interpretation: interpretation,
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
          const interpretation = `User plans to: ${planDetails.trim()}`;
          
          memories.push({
            type: this.memoryTypes.PROSPECTIVE,
            content: planText,
            interpretation: interpretation,
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
          const interpretation = `User wants to be reminded to: ${reminderDetails.trim()}`;
          
          memories.push({
            type: this.memoryTypes.PROSPECTIVE,
            content: reminderText,
            interpretation: interpretation,
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
  
  // Retrieve relevant memories for context
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
      
      // Simple relevance scoring for now
      // In a real implementation, you would use embeddings and semantic similarity
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
        
        // Boost semantic and episodic memories
        if (memory.type === this.memoryTypes.SEMANTIC) relevanceScore *= 1.2;
        if (memory.type === this.memoryTypes.EPISODIC) relevanceScore *= 1.1;
        
        // Recency bonus
        const ageInDays = (Date.now() - (memory.timestamp || 0)) / (1000 * 60 * 60 * 24);
        const recencyBonus = Math.max(0, 1 - (ageInDays / 30)); // Higher for newer memories
        relevanceScore += recencyBonus * 0.5;
        
        return { ...memory, relevanceScore };
      });
      
      // Sort by relevance and limit results
      return scoredMemories
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);
      
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
  }
  
  // Generate natural language reference to memories
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
          
        default:
          return `I remember you mentioned "${memory.content}"`;
      }
    }).filter(ref => ref !== null);
    
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
  
  // Update memory
  async updateMemory(memoryId, updates) {
    if (!this.auth.currentUser) return false;
    const userId = this.auth.currentUser.uid;
    
    try {
      await updateDoc(doc(this.db, `users/${userId}/memories/${memoryId}`), {
        ...updates,
        lastModified: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error updating memory:', error);
      return false;
    }
  }
}

// Create singleton instance
const enhancedMemoryService = new EnhancedMemoryService();
export default enhancedMemoryService;