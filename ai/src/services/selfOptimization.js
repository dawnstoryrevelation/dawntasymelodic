// src/services/selfOptimization.js
import { db } from '@/firebase/init';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';

/**
 * Self-Optimization Service for DawntasyAI
 * This service handles storing learning patterns, extracting insights,
 * and applying them to future responses
 */
export const SelfOptimizationService = {
  /**
   * Process a user message and extract learning patterns
   * @param {string} userMessage - The message from the user
   * @param {string} aiResponse - The AI's response to the message
   * @param {string} sessionId - Unique identifier for the current session (optional)
   */
  async processInteraction(userMessage, aiResponse, sessionId = null) {
    try {
      // Extract learning patterns from the user message
      const learningPatterns = extractLearningPatterns(userMessage);
      
      if (learningPatterns.length === 0) {
        // No learning patterns found
        return;
      }
      
      // Store learning patterns in the database
      const learningData = {
        timestamp: serverTimestamp(),
        userMessage,
        aiResponse: aiResponse ? aiResponse.substring(0, 500) : null, // Store a portion of the response for context
        patterns: learningPatterns,
        sessionId
      };
      
      // Add to the learning database
      await addDoc(collection(db, 'aiLearningPatterns'), learningData);
      
      // Update pattern frequency counters for faster retrieval
      for (const pattern of learningPatterns) {
        const patternRef = doc(db, 'aiPatternMetrics', pattern.type);
        try {
          await updateDoc(patternRef, {
            frequency: increment(1),
            lastUsed: serverTimestamp()
          });
        } catch (err) {
          // Document might not exist yet, create it
          await addDoc(collection(db, 'aiPatternMetrics'), {
            type: pattern.type,
            pattern: pattern.value,
            frequency: 1,
            lastUsed: serverTimestamp()
          });
        }
      }
      
      console.log(`DawntasyAI learned ${learningPatterns.length} patterns from this interaction`);
      
    } catch (error) {
      console.error('Self-optimization error:', error);
    }
  },
  
  /**
   * Retrieve learning patterns to apply to AI responses
   * @param {number} limit - Maximum number of patterns to retrieve
   * @returns {Array} Array of learning patterns
   */
  async getLearningPatterns(maxPatterns = 5) {
    try {
      // Query the most frequent and recent patterns
      const patternsQuery = query(
        collection(db, 'aiPatternMetrics'),
        orderBy('frequency', 'desc'),
        limit(maxPatterns)
      );
      
      const querySnapshot = await getDocs(patternsQuery);
      const patterns = [];
      
      querySnapshot.forEach((doc) => {
        patterns.push(doc.data());
      });
      
      return patterns;
    } catch (error) {
      console.error('Error getting learning patterns:', error);
      return [];
    }
  },
  
  /**
   * Apply learning patterns to enhance the system prompt
   * @param {string} systemPrompt - The base system prompt
   * @returns {string} Enhanced system prompt with learning patterns
   */
  async enhanceSystemPrompt(systemPrompt) {
    try {
      // Get top learning patterns
      const patterns = await this.getLearningPatterns(10);
      
      if (patterns.length === 0) {
        return systemPrompt; // No patterns to apply
      }
      
      // Create a section for learned patterns
      let learningSection = "\n\n🧠 LEARNED PATTERNS FROM USER INTERACTIONS:\n";
      
      // Group patterns by type
      const groupedPatterns = {};
      patterns.forEach(pattern => {
        if (!groupedPatterns[pattern.type]) {
          groupedPatterns[pattern.type] = [];
        }
        groupedPatterns[pattern.type].push(pattern.pattern);
      });
      
      // Add each type of pattern to the learning section
      for (const [type, patternList] of Object.entries(groupedPatterns)) {
        learningSection += `- ${formatPatternType(type)}: ${patternList.join(', ')}\n`;
      }
      
      // Return enhanced prompt
      return systemPrompt + learningSection;
      
    } catch (error) {
      console.error('Error enhancing system prompt:', error);
      return systemPrompt; // Return original if error
    }
  }
};

/**
 * Extract learning patterns from user messages
 * @param {string} message - The user message
 * @returns {Array} Array of detected learning patterns
 */
function extractLearningPatterns(message) {
  const patterns = [];
  
  // Skip if message is too short
  if (!message || message.length < 5) {
    return patterns;
  }
  
  // Convert to lowercase for pattern matching
  const lowerMessage = message.toLowerCase();
  
  // Pattern 1: Communication style directives
  const stylePatterns = [
    { regex: /be (clear|specific|concise|detailed|precise)/i, type: 'communicationStyle' },
    { regex: /write (clearly|concisely|briefly|in detail)/i, type: 'communicationStyle' },
    { regex: /(explain|elaborate|summarize|simplify)/i, type: 'communicationStyle' },
    { regex: /(step by step|bullet points|numbered list)/i, type: 'formatPreference' }
  ];
  
  for (const pattern of stylePatterns) {
    const match = lowerMessage.match(pattern.regex);
    if (match) {
      patterns.push({
        type: pattern.type,
        value: match[0].trim()
      });
    }
  }
  
  // Pattern 2: Topic preferences
  const topicMatches = lowerMessage.match(/(?:about|on|regarding) ([a-z\s]+)/i);
  if (topicMatches && topicMatches[1] && topicMatches[1].length > 3) {
    patterns.push({
      type: 'topicInterest',
      value: topicMatches[1].trim()
    });
  }
  
  // Pattern 3: Length preferences
  const lengthPatterns = [
    { regex: /(short|brief|quick) (answer|response|reply)/i, type: 'lengthPreference', value: 'short' },
    { regex: /(detailed|comprehensive|in-depth|thorough)/i, type: 'lengthPreference', value: 'detailed' },
    { regex: /(concise|to the point)/i, type: 'lengthPreference', value: 'concise' }
  ];
  
  for (const pattern of lengthPatterns) {
    if (lowerMessage.match(pattern.regex)) {
      patterns.push({
        type: 'lengthPreference',
        value: pattern.value
      });
      break; // Only one length preference at a time
    }
  }
  
  // Pattern 4: Tone preferences
  const tonePatterns = [
    { regex: /(formal|professional|academic)/i, type: 'tonePreference', value: 'formal' },
    { regex: /(casual|conversational|friendly)/i, type: 'tonePreference', value: 'casual' },
    { regex: /(technical|scientific|academic)/i, type: 'tonePreference', value: 'technical' },
    { regex: /(simple|easy to understand|beginner)/i, type: 'tonePreference', value: 'simple' },
    { regex: /(creative|imaginative|poetic)/i, type: 'tonePreference', value: 'creative' }
  ];
  
  for (const pattern of tonePatterns) {
    if (lowerMessage.match(pattern.regex)) {
      patterns.push({
        type: 'tonePreference',
        value: pattern.value
      });
      break; // Only one tone preference at a time
    }
  }
  
  return patterns;
}

/**
 * Format pattern type for display in the system prompt
 */
function formatPatternType(type) {
  switch (type) {
    case 'communicationStyle':
      return 'Communication Style';
    case 'formatPreference':
      return 'Format Preference';
    case 'topicInterest':
      return 'Topic Interest';
    case 'lengthPreference':
      return 'Length Preference';
    case 'tonePreference':
      return 'Tone Preference';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
