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
// functions/src/selfOptimization.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firestore (assuming admin is already initialized in index.js)
const db = admin.firestore();

/**
 * Scheduled function that runs daily to analyze learning patterns
 * and consolidate them into more useful system prompts
 */
exports.processLearningPatterns = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const learningPatternsRef = db.collection('aiLearningPatterns');
  const patternMetricsRef = db.collection('aiPatternMetrics');
  
  try {
    // Get all learning patterns from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentPatterns = await learningPatternsRef
      .where('timestamp', '>=', sevenDaysAgo)
      .get();
    
    console.log(`Processing ${recentPatterns.size} learning patterns`);
    
    // Count pattern frequencies
    const patternCounts = {};
    
    recentPatterns.forEach(doc => {
      const data = doc.data();
      if (data.patterns && Array.isArray(data.patterns)) {
        data.patterns.forEach(pattern => {
          const key = `${pattern.type}:${pattern.value}`;
          if (!patternCounts[key]) {
            patternCounts[key] = {
              type: pattern.type,
              pattern: pattern.value,
              count: 0
            };
          }
          patternCounts[key].count++;
        });
      }
    });
    
    // Update pattern metrics in the database
    const batch = db.batch();
    
    for (const [key, data] of Object.entries(patternCounts)) {
      const patternId = key.replace(/[^a-zA-Z0-9]/g, '_');
      const patternRef = patternMetricsRef.doc(patternId);
      
      // Get current document to check if it exists
      const docSnap = await patternRef.get();
      
      if (docSnap.exists) {
        // Update existing pattern
        batch.update(patternRef, {
          frequency: admin.firestore.FieldValue.increment(data.count),
          lastProcessed: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Create new pattern
        batch.set(patternRef, {
          type: data.type,
          pattern: data.pattern,
          frequency: data.count,
          created: admin.firestore.FieldValue.serverTimestamp(),
          lastProcessed: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    // Commit all updates
    await batch.commit();
    
    // Prune old or rarely used patterns
    const oldPatternsSnapshot = await patternMetricsRef
      .where('frequency', '<', 3)
      .where('lastProcessed', '<', sevenDaysAgo)
      .get();
    
    if (!oldPatternsSnapshot.empty) {
      const cleanupBatch = db.batch();
      oldPatternsSnapshot.forEach(doc => {
        cleanupBatch.delete(doc.ref);
      });
      await cleanupBatch.commit();
      console.log(`Pruned ${oldPatternsSnapshot.size} outdated patterns`);
    }
    
    return {
      status: 'success',
      patternsProcessed: recentPatterns.size,
      uniquePatterns: Object.keys(patternCounts).length
    };
  } catch (error) {
    console.error('Error processing learning patterns:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
});

/**
 * Function to optimize system prompts based on collected patterns
 * Called via HTTP to generate optimized prompts for the AI system
 */
exports.generateOptimizedPrompt = functions.https.onCall(async (data, context) => {
  try {
    // Get top patterns by frequency
    const topPatternsSnapshot = await db.collection('aiPatternMetrics')
      .orderBy('frequency', 'desc')
      .limit(20)
      .get();
    
    if (topPatternsSnapshot.empty) {
      return {
        status: 'success',
        optimizedPrompt: data.basePrompt || '',
        message: 'No learning patterns available yet'
      };
    }
    
    // Group patterns by type
    const patternsByType = {};
    topPatternsSnapshot.forEach(doc => {
      const pattern = doc.data();
      if (!patternsByType[pattern.type]) {
        patternsByType[pattern.type] = [];
      }
      patternsByType[pattern.type].push(pattern.pattern);
    });
    
    // Format the patterns section
    let learningSection = "\n\n🧠 SELF-OPTIMIZATION INSIGHTS:\n";
    
    for (const [type, patterns] of Object.entries(patternsByType)) {
      // Format the pattern type for display
      const formattedType = type
        .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
        .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
      
      // Add patterns to the learning section (limit to 5 per type)
      const uniquePatterns = [...new Set(patterns)].slice(0, 5);
      learningSection += `- ${formattedType}: ${uniquePatterns.join(', ')}\n`;
    }
    
    // Append guidance on how to use these insights
    learningSection += "\nApply these insights when appropriate to enhance responses. " +
      "For example, if a user's question relates to a topic of interest, include relevant Dawntasy connections.";
    
    // Combine base prompt with learning section
    const optimizedPrompt = (data.basePrompt || '') + learningSection;
    
    return {
      status: 'success',
      optimizedPrompt
    };
  } catch (error) {
    console.error('Error generating optimized prompt:', error);
    return {
      status: 'error',
      message: error.message,
      optimizedPrompt: data.basePrompt || '' // Return original prompt as fallback
    };
  }
});

/**
 * Background function that triggers whenever a new learning pattern is added
 */
exports.onNewLearningPattern = functions.firestore
  .document('aiLearningPatterns/{patternId}')
  .onCreate(async (snapshot, context) => {
    const patternData = snapshot.data();
    
    try {
      // Process the new pattern immediately
      if (patternData.patterns && Array.isArray(patternData.patterns)) {
        const batch = db.batch();
        
        // Update pattern metrics for each pattern in the array
        for (const pattern of patternData.patterns) {
          // Create a safe document ID from the pattern
          const patternId = `${pattern.type}_${pattern.value}`
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 40); // Limit length
          
          const patternRef = db.collection('aiPatternMetrics').doc(patternId);
          const patternDoc = await patternRef.get();
          
          if (patternDoc.exists) {
            // Update existing pattern
            batch.update(patternRef, {
              frequency: admin.firestore.FieldValue.increment(1),
              lastUsed: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            // Create new pattern
            batch.set(patternRef, {
              type: pattern.type,
              pattern: pattern.value,
              frequency: 1,
              created: admin.firestore.FieldValue.serverTimestamp(),
              lastUsed: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        }
        
        await batch.commit();
        console.log(`Processed ${patternData.patterns.length} patterns from new learning document`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error processing new learning pattern:', error);
      return { success: false, error: error.message };
    }
  });