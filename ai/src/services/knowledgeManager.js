// knowledgeManager.js - Universal Knowledge Learning & Optimization System

import { db } from '@/firebase/init'; // Your existing Firebase config
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

/**
 * Learn new knowledge from a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {string} userQuery - Original user question
 * @param {string} aiResponse - AI's response
 * @param {number} feedbackRating - User's satisfaction (1-5)
 * @param {string} userId - User identifier
 */
export async function learnFromConversation(conversationId, userQuery, aiResponse, feedbackRating, userId) {
  console.log('🧠 Learning from conversation:', conversationId);
  
  try {
    // STEP 1: Extract potential knowledge from the conversation
    const potentialKnowledge = await extractKnowledge(userQuery, aiResponse);
    
    // Skip if no valuable knowledge was extracted
    if (potentialKnowledge.length === 0) {
      console.log('No new knowledge extracted from conversation');
      return;
    }
    
    // STEP 2: For each piece of knowledge, store or update in global repository
    const knowledgePromises = potentialKnowledge.map(async (knowledge) => {
      // Check if similar knowledge already exists
      const existingKnowledge = await findSimilarKnowledge(knowledge.concept);
      
      if (existingKnowledge) {
        // Update existing knowledge
        return updateExistingKnowledge(existingKnowledge.id, knowledge, feedbackRating, conversationId);
      } else {
        // Store new knowledge
        return storeNewKnowledge(knowledge, feedbackRating, conversationId, userId);
      }
    });
    
    await Promise.all(knowledgePromises);
    
    // STEP 3: Log the learning process as an optimization if it meets threshold
    if (feedbackRating >= 4) {
      await logLearningAsOptimization(conversationId, userQuery, aiResponse, userId);
    }
    
    console.log(`Successfully processed ${potentialKnowledge.length} knowledge items`);
  } catch (error) {
    console.error('Error in learning from conversation:', error);
  }
}

/**
 * Extract knowledge concepts from a conversation
 * @param {string} query - User's question
 * @param {string} response - AI's response
 * @returns {Array} Array of knowledge objects
 */
async function extractKnowledge(query, response) {
  // In a real implementation, this would use NLP to extract concepts
  // For this demo, we'll use a simple approach
  
  // Extract potential concepts (simplified)
  const combinedText = `${query} ${response}`;
  
  // Remove common words and punctuation (simplified)
  const cleanedText = combinedText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3)
    .join(' ');
  
  // Extract potential concepts (very simplified)
  // In reality, you would use Named Entity Recognition, keyword extraction,
  // and other NLP techniques
  const concepts = [];
  
  // Simple pattern matching for phrases like "X is Y" or "X means Y"
  const isPatterns = response.match(/([a-zA-Z\s]+) is ([a-zA-Z\s,]+)/g) || [];
  const meansPatterns = response.match(/([a-zA-Z\s]+) means ([a-zA-Z\s,]+)/g) || [];
  
  // Process "X is Y" patterns
  isPatterns.forEach(pattern => {
    const parts = pattern.split(' is ');
    if (parts.length === 2 && parts[0].length > 3 && parts[1].length > 3) {
      concepts.push({
        concept: pattern,
        confidence: 0.7, // Initial confidence
        category: detectCategory(pattern),
      });
    }
  });
  
  // Process "X means Y" patterns
  meansPatterns.forEach(pattern => {
    const parts = pattern.split(' means ');
    if (parts.length === 2 && parts[0].length > 3 && parts[1].length > 3) {
      concepts.push({
        concept: pattern,
        confidence: 0.7, // Initial confidence
        category: detectCategory(pattern),
      });
    }
  });
  
  // Return unique concepts
  return concepts.filter((concept, index, self) => 
    index === self.findIndex(c => c.concept === concept.concept)
  );
}

/**
 * Detect category of a knowledge concept
 * @param {string} text - The concept text
 * @returns {string} Category name
 */
function detectCategory(text) {
  // Simplified category detection
  const lowerText = text.toLowerCase();
  
  // Tech categories
  if (lowerText.includes('code') || lowerText.includes('programming') || 
      lowerText.includes('software') || lowerText.includes('development')) {
    return 'technology';
  }
  
  // Science categories
  if (lowerText.includes('science') || lowerText.includes('biology') || 
      lowerText.includes('physics') || lowerText.includes('chemistry')) {
    return 'science';
  }
  
  // Business categories
  if (lowerText.includes('business') || lowerText.includes('marketing') || 
      lowerText.includes('finance') || lowerText.includes('management')) {
    return 'business';
  }
  
  // Health categories
  if (lowerText.includes('health') || lowerText.includes('medical') || 
      lowerText.includes('fitness') || lowerText.includes('wellness')) {
    return 'health';
  }
  
  // Default category
  return 'general';
}

/**
 * Find similar knowledge in global repository
 * @param {string} concept - The concept to find
 * @returns {Object|null} Existing knowledge or null
 */
async function findSimilarKnowledge(concept) {
  try {
    // This is a simplified search - in reality, you would use
    // vector embeddings or other semantic search techniques
    
    const knowledgeRef = db.collection('globalKnowledge');
    const snapshot = await knowledgeRef
      .where('concept', '==', concept)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    let existingKnowledge = null;
    snapshot.forEach(doc => {
      existingKnowledge = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    return existingKnowledge;
  } catch (error) {
    console.error('Error finding similar knowledge:', error);
    return null;
  }
}

/**
 * Update existing knowledge with new information
 * @param {string} knowledgeId - ID of knowledge to update
 * @param {Object} newKnowledge - New knowledge to merge
 * @param {number} feedbackRating - User satisfaction rating
 * @param {string} conversationId - Current conversation ID
 * @returns {Promise} Update promise
 */
async function updateExistingKnowledge(knowledgeId, newKnowledge, feedbackRating, conversationId) {
  try {
    const knowledgeRef = db.collection('globalKnowledge').doc(knowledgeId);
    const doc = await knowledgeRef.get();
    
    if (!doc.exists) {
      throw new Error(`Knowledge document ${knowledgeId} does not exist`);
    }
    
    const existingData = doc.data();
    
    // Calculate new confidence based on weighted average
    const oldConfidence = existingData.confidence;
    const usageCount = existingData.usageCount || 1;
    const successRate = existingData.successRate || 0.5;
    
    // Adjust confidence based on feedback and usage
    const feedbackFactor = feedbackRating / 5; // Normalize to 0-1
    const newConfidence = (oldConfidence * usageCount + newKnowledge.confidence * feedbackFactor) / (usageCount + 1);
    
    // Update success rate based on feedback
    const isSuccessful = feedbackRating >= 4;
    const newSuccessRate = (successRate * usageCount + (isSuccessful ? 1 : 0)) / (usageCount + 1);
    
    // Update sources if not already included
    let sources = existingData.sources || [];
    if (!sources.includes(conversationId)) {
      sources.push(conversationId);
    }
    
    // Update the document
    return knowledgeRef.update({
      confidence: newConfidence,
      usageCount: usageCount + 1,
      successRate: newSuccessRate,
      sources: sources,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error updating existing knowledge:', error);
    throw error;
  }
}

/**
 * Store new knowledge in the global repository
 * @param {Object} knowledge - Knowledge to store
 * @param {number} feedbackRating - User satisfaction rating
 * @param {string} conversationId - Current conversation ID
 * @param {string} userId - User ID
 * @returns {Promise} Store promise
 */
async function storeNewKnowledge(knowledge, feedbackRating, conversationId, userId) {
  try {
    const knowledgeId = uuidv4();
    
    // Adjust confidence based on feedback
    const feedbackFactor = feedbackRating / 5; // Normalize to 0-1
    const adjustedConfidence = knowledge.confidence * feedbackFactor;
    
    // Determine if knowledge was successful based on feedback
    const isSuccessful = feedbackRating >= 4;
    
    return db.collection('globalKnowledge').doc(knowledgeId).set({
      knowledgeId,
      concept: knowledge.concept,
      confidence: adjustedConfidence,
      sources: [conversationId],
      category: knowledge.category,
      lastUpdated: new Date(),
      usageCount: 1,
      successRate: isSuccessful ? 1 : 0,
      createdBy: userId
    });
  } catch (error) {
    console.error('Error storing new knowledge:', error);
    throw error;
  }
}

/**
 * Log the learning process as a system optimization
 * @param {string} conversationId - Conversation ID
 * @param {string} query - User question
 * @param {string} response - AI response
 * @param {string} userId - User ID
 */
async function logLearningAsOptimization(conversationId, query, response, userId) {
  try {
    const optimizationId = uuidv4();
    
    await db.collection('optimizationLog').doc(optimizationId).set({
      optimizationId,
      type: 'knowledge',
      description: `Learned new knowledge from conversation ${conversationId}`,
      before: 'System had limited knowledge in this area',
      after: 'System has expanded knowledge base',
      impactMetric: 1, // Baseline impact
      timestamp: new Date(),
      appliedGlobally: true,
      sourceConversation: conversationId,
      sourceUser: userId
    });
    
    console.log('Logged learning as optimization:', optimizationId);
  } catch (error) {
    console.error('Error logging learning as optimization:', error);
  }
}

/**
 * Get knowledge usage report
 * @returns {Promise<Object>} Knowledge usage statistics
 */
export async function getKnowledgeUsageReport() {
  try {
    const snapshot = await db.collection('globalKnowledge').get();
    
    let totalKnowledge = 0;
    let totalConfidence = 0;
    let totalUsage = 0;
    let categoryBreakdown = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalKnowledge++;
      totalConfidence += data.confidence || 0;
      totalUsage += data.usageCount || 0;
      
      // Update category breakdown
      const category = data.category || 'general';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = 0;
      }
      categoryBreakdown[category]++;
    });
    
    return {
      totalKnowledge,
      averageConfidence: totalKnowledge > 0 ? totalConfidence / totalKnowledge : 0,
      totalUsage,
      categoryBreakdown
    };
  } catch (error) {
    console.error('Error getting knowledge usage report:', error);
    return {
      totalKnowledge: 0,
      averageConfidence: 0,
      totalUsage: 0,
      categoryBreakdown: {}
    };
  }
}