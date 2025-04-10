// feedbackSystem.js - Capturing and Processing User Feedback

import { db } from '@/firebase/init'; // Your existing Firebase config
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { learnFromConversation } from './knowledgeManager';

/**
 * Collect explicit feedback from user
 * @param {string} conversationId - ID of the conversation
 * @param {number} rating - User satisfaction (1-5)
 * @param {string} feedbackText - Optional text feedback
 * @param {string} userId - User identifier
 * @param {Array} knowledgeUsed - Knowledge IDs used in response
 * @param {number} responseTime - Response generation time
 * @returns {Promise} - Promise for feedback processing
 */
export async function collectExplicitFeedback(
  conversationId, 
  rating, 
  feedbackText, 
  userId, 
  knowledgeUsed, 
  responseTime
) {
  console.log(`📝 Collecting explicit feedback for conversation: ${conversationId}`);
  
  try {
    const feedbackId = uuidv4();
    
    // Store feedback in database
    await db.collection('feedbackData').doc(feedbackId).set({
      feedbackId,
      conversationId,
      userId,
      rating,
      specificFeedback: feedbackText || '',
      knowledgeUsed: knowledgeUsed || [],
      timestamp: new Date(),
      responseLatency: responseTime || 0,
      type: 'explicit'
    });
    
    // Retrieve the conversation data to learn from
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();
    
    if (!conversationDoc.exists) {
      console.error('Conversation not found:', conversationId);
      return;
    }
    
    const conversationData = conversationDoc.data();
    const lastUserQuery = conversationData.messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';
    
    const lastAiResponse = conversationData.messages
      .filter(msg => msg.role === 'assistant')
      .pop()?.content || '';
    
    // Learn from this conversation with feedback
    await learnFromConversation(
      conversationId,
      lastUserQuery,
      lastAiResponse,
      rating,
      userId
    );
    
    // Update user preferences based on feedback
    await updateUserPreferences(userId, rating, lastUserQuery, lastAiResponse);
    
    // If low rating, log potential issue for system analysis
    if (rating <= 2) {
      await logPotentialIssue(conversationId, userId, rating, feedbackText, lastUserQuery, lastAiResponse);
    }
    
    return { success: true, feedbackId };
  } catch (error) {
    console.error('Error collecting explicit feedback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Collect implicit feedback based on user behavior
 * @param {string} conversationId - ID of the conversation
 * @param {string} userId - User identifier
 * @param {Object} metrics - Behavioral metrics object
 * @returns {Promise} - Promise for feedback processing
 */
export async function collectImplicitFeedback(conversationId, userId, metrics) {
  console.log(`📊 Collecting implicit feedback for conversation: ${conversationId}`);
  
  try {
    const feedbackId = uuidv4();
    
    // Calculate an implicit rating based on user behavior
    const implicitRating = calculateImplicitRating(metrics);
    
    // Store implicit feedback
    await db.collection('feedbackData').doc(feedbackId).set({
      feedbackId,
      conversationId,
      userId,
      rating: implicitRating,
      specificFeedback: '',
      knowledgeUsed: metrics.knowledgeUsed || [],
      timestamp: new Date(),
      responseLatency: metrics.responseTime || 0,
      type: 'implicit',
      metrics: {
        readTime: metrics.readTime || 0,
        followupQuestions: metrics.followupQuestions || 0,
        conversationContinued: metrics.conversationContinued || false,
        responseSelectedForSaving: metrics.responseSelectedForSaving || false
      }
    });
    
    return { success: true, feedbackId, implicitRating };
  } catch (error) {
    console.error('Error collecting implicit feedback:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate implicit rating based on user behavior
 * @param {Object} metrics - Behavioral metrics
 * @returns {number} - Calculated rating (1-5)
 */
function calculateImplicitRating(metrics) {
  let rating = 3; // Default neutral rating
  
  // Factor 1: Read time relative to content length
  if (metrics.readTime && metrics.contentLength) {
    const readTimePerChar = metrics.readTime / metrics.contentLength;
    if (readTimePerChar > 0.05) rating += 0.5; // User spent time reading
    if (readTimePerChar < 0.01) rating -= 0.5; // User barely read response
  }
  
  // Factor 2: Followup questions (engagement)
  if (metrics.followupQuestions > 0) rating += 0.5;
  if (metrics.followupQuestions > 2) rating += 0.5;
  
  // Factor 3: Conversation continuation
  if (metrics.conversationContinued) rating += 0.5;
  
  // Factor 4: User saved or shared the response
  if (metrics.responseSelectedForSaving) rating += 1;
  
  // Ensure rating stays within 1-5 range
  return Math.max(1, Math.min(5, rating));
}

/**
 * Update user preferences based on feedback
 * @param {string} userId - User identifier
 * @param {number} rating - Feedback rating
 * @param {string} query - User query
 * @param {string} response - AI response
 */
async function updateUserPreferences(userId, rating, query, response) {
  try {
    const userOptRef = db.collection('userOptimizations').doc(userId);
    const doc = await userOptRef.get();
    
    // Detect response characteristics
    const responseCharacteristics = analyzeResponseCharacteristics(response);
    
    if (doc.exists) {
      const userData = doc.data();
      
      // Only adjust preferences on strong feedback (positive or negative)
      if (rating >= 4 || rating <= 2) {
        let updatedPreferences = { ...userData.preferences };
        
        // If highly rated, move preferences toward this response style
        if (rating >= 4) {
          updatedPreferences.responseStyle = responseCharacteristics.style;
          updatedPreferences.detailLevel = responseCharacteristics.detailLevel;
        }
        
        // Extract topics from query to update interests
        const topics = extractTopics(query);
        if (topics.length > 0) {
          // Add new topics to interests if highly rated
          if (rating >= 4) {
            const currentInterests = updatedPreferences.topicInterests || [];
            topics.forEach(topic => {
              if (!currentInterests.includes(topic)) {
                currentInterests.push(topic);
              }
            });
            updatedPreferences.topicInterests = currentInterests;
          }
        }
        
        // Update user preferences
        await userOptRef.update({
          preferences: updatedPreferences,
          lastUpdated: new Date()
        });
      }
      
      // Always update interaction patterns
      const interactionPatterns = userData.interactionPatterns || {};
      const commonQueries = interactionPatterns.commonQueries || [];
      
      // Add query if not already in common queries
      const queryType = classifyQueryType(query);
      if (!commonQueries.includes(queryType) && queryType !== 'unknown') {
        commonQueries.push(queryType);
        
        await userOptRef.update({
          'interactionPatterns.commonQueries': commonQueries
        });
      }
    } else {
      // Create new user profile if doesn't exist
      await userOptRef.set({
        userId,
        preferences: {
          responseStyle: responseCharacteristics.style,
          detailLevel: responseCharacteristics.detailLevel,
          topicInterests: extractTopics(query)
        },
        interactionPatterns: {
          averageSessionLength: 1,
          preferredTimeOfDay: getCurrentTimeOfDay(),
          commonQueries: [classifyQueryType(query)]
        },
        lastUpdated: new Date()
      });
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
  }
}

/**
 * Log potential issue for system improvement
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @param {number} rating - Feedback rating
 * @param {string} feedbackText - User feedback text
 * @param {string} query - User query
 * @param {string} response - AI response
 */
async function logPotentialIssue(conversationId, userId, rating, feedbackText, query, response) {
  try {
    const issueId = uuidv4();
    
    await db.collection('systemIssues').doc(issueId).set({
      issueId,
      conversationId,
      userId,
      rating,
      feedbackText,
      query,
      response: response.substring(0, 500) + (response.length > 500 ? '...' : ''),
      timestamp: new Date(),
      status: 'identified',
      systemAnalysis: '',
      resolutionApplied: false
    });
    
    console.log('Logged potential system issue:', issueId);
  } catch (error) {
    console.error('Error logging potential issue:', error);
  }
}

/**
 * Analyze response characteristics
 * @param {string} response - AI response
 * @returns {Object} - Detected characteristics
 */
function analyzeResponseCharacteristics(response) {
  // This would use NLP techniques in a real implementation
  // Here's a simplified version
  
  // Detect style based on language patterns
  let style = 'balanced';
  
  if (response.includes('!') && (response.includes('AMAZING') || response.includes('AWESOME'))) {
    style = 'enthusiastic';
  } else if (response.match(/\d+%|\d+\.\d+|analysis shows|research indicates/gi)) {
    style = 'analytical';
  } else if (response.match(/I understand|you might feel|I appreciate/gi)) {
    style = 'empathetic';
  }
  
  // Detect detail level based on response length and structure
  let detailLevel = 'moderate';
  
  if (response.length > 1000 || response.split('\n').length > 10) {
    detailLevel = 'detailed';
  } else if (response.length < 300 && response.split('\n').length < 5) {
    detailLevel = 'concise';
  }
  
  return { style, detailLevel };
}

/**
 * Extract topics from user query
 * @param {string} query - User query
 * @returns {Array} - Extracted topics
 */
function extractTopics(query) {
  // Simplified topic extraction
  // Would use NLP techniques in a real implementation
  
  const topics = [];
  const lowerQuery = query.toLowerCase();
  
  // Tech topics
  if (lowerQuery.includes('code') || lowerQuery.includes('programming') || 
      lowerQuery.includes('software') || lowerQuery.includes('development')) {
    topics.push('technology');
  }
  
  // Science topics
  if (lowerQuery.includes('science') || lowerQuery.includes('biology') || 
      lowerQuery.includes('physics') || lowerQuery.includes('chemistry')) {
    topics.push('science');
  }
  
  // Business topics
  if (lowerQuery.includes('business') || lowerQuery.includes('marketing') || 
      lowerQuery.includes('finance') || lowerQuery.includes('management')) {
    topics.push('business');
  }
  
  // Health topics
  if (lowerQuery.includes('health') || lowerQuery.includes('medical') || 
      lowerQuery.includes('fitness') || lowerQuery.includes('wellness')) {
    topics.push('health');
  }
  
  return topics;
}

/**
 * Classify query type
 * @param {string} query - User query
 * @returns {string} - Query type
 */
function classifyQueryType(query) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('how to') || lowerQuery.includes('how do')) {
    return 'instructional';
  } else if (lowerQuery.includes('what is') || lowerQuery.includes('who is') || lowerQuery.includes('where is')) {
    return 'informational';
  } else if (lowerQuery.includes('why') || lowerQuery.includes('explain')) {
    return 'explanatory';
  } else if (lowerQuery.endsWith('?')) {
    return 'question';
  } else if (lowerQuery.includes('help') || lowerQuery.includes('assist')) {
    return 'assistance';
  }
  
  return 'unknown';
}

/**
 * Get current time of day
 * @returns {string} - Time of day
 */
function getCurrentTimeOfDay() {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'evening';
  } else {
    return 'night';
  }
}

/**
 * Get feedback performance report
 * @returns {Promise<Object>} - Feedback statistics
 */
export async function getFeedbackReport() {
  try {
    const snapshot = await db.collection('feedbackData').get();
    
    let totalFeedback = 0;
    let totalRating = 0;
    let ratingDistribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
    let explicitCount = 0;
    let implicitCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalFeedback++;
      totalRating += data.rating;
      
      // Update rating distribution
      const roundedRating = Math.round(data.rating);
      if (ratingDistribution[roundedRating] !== undefined) {
        ratingDistribution[roundedRating]++;
      }
      
      // Count by type
      if (data.type === 'explicit') explicitCount++;
      else implicitCount++;
    });
    
    return {
      totalFeedback,
      averageRating: totalFeedback > 0 ? totalRating / totalFeedback : 0,
      ratingDistribution,
      explicitCount,
      implicitCount
    };
  } catch (error) {
    console.error('Error getting feedback report:', error);
    return {
      totalFeedback: 0,
      averageRating: 0,
      ratingDistribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
      explicitCount: 0,
      implicitCount: 0
    };
  }
}