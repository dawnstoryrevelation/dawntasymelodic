/**
 * Simple sentiment analyzer for Senticon mood detection
 */

// Mood mapping keywords
const moodKeywords = {
    excited: [
      'amazing', 'awesome', 'fantastic', 'incredible', 'brilliant',
      'exciting', 'wow', 'omg', 'fire', 'stunning', 'mind-blowing',
      'spectacular', 'insane', 'extraordinary', 'phenomenal', '!!!'
    ],
    happy: [
      'good', 'great', 'nice', 'happy', 'glad', 'pleased', 'joy',
      'wonderful', 'positive', 'success', 'achieved', 'solved', 'perfect'
    ],
    surprised: [
      'what?', 'wow', 'really?', 'unexpected', 'surprising', 'shock',
      'no way', 'cannot believe', 'astonishing', 'boo', 'whoa', 'oh!'
    ],
    empathetic: [
      'sorry', 'understand', 'feel', 'difficult', 'challenging', 
      'hard time', 'struggle', 'support', 'here for you', 'help you',
      'care', 'listen', 'appreciate'
    ],
    sad: [
      'sad', 'disappointed', 'unfortunate', 'regret', 'apologies',
      'unable', 'failed', 'sorry', 'cannot', 'issue', 'problem'
    ],
    confused: [
      'confused', 'unclear', 'maybe', 'possibly', 'perhaps', 'might',
      'not sure', 'could you clarify', 'hmm', 'let me think', 'complex'
    ],
    laughing: [
      'haha', 'lol', 'funny', 'joke', 'amusing', 'humorous', 'lmao',
      'rofl', 'hilarious', 'laughing', '😂', '🤣'
    ]
  };
  
  /**
   * Analyzes message content to determine appropriate mood
   * @param {string} message - The message content to analyze
   * @param {boolean} isUserMessage - Whether this is a user message
   * @returns {string} The detected mood
   */
  export function analyzeSentiment(message, isUserMessage = false) {
    if (!message) return 'neutral';
    
    const lowercaseMessage = message.toLowerCase();
    
    // If message is empty or very short, return neutral
    if (!lowercaseMessage || lowercaseMessage.length < 2) {
      return 'neutral';
    }
    
    // Check for user-directed mood signals first (if it's AI responding)
    if (!isUserMessage) {
      // Detect thinking state - only for AI messages
      if (lowercaseMessage.includes('thinking...') || 
          lowercaseMessage.includes('analyzing') || 
          lowercaseMessage.includes('processing')) {
        return 'thinking';
      }
      
      // Are we responding to a user's question?
      if (lowercaseMessage.includes('?') && 
         (lowercaseMessage.startsWith('the answer') ||
          lowercaseMessage.startsWith('to answer') ||
          lowercaseMessage.startsWith('in response'))) {
        return 'thinking';
      }
    }
    
    // For user messages containing "boo" or similar surprise triggers
    if (isUserMessage && 
       (lowercaseMessage.includes('boo!') || 
        lowercaseMessage.includes('surprise!'))) {
      return 'surprised';
    }
    
    // Score each mood based on keyword matches
    const moodScores = {};
    
    Object.keys(moodKeywords).forEach(mood => {
      moodScores[mood] = 0;
      moodKeywords[mood].forEach(keyword => {
        // Count occurrences of each keyword
        const regex = new RegExp(`\\b${keyword}\\b|${keyword}`, 'gi');
        const matches = lowercaseMessage.match(regex);
        if (matches) {
          moodScores[mood] += matches.length;
        }
      });
    });
    
    // Additional contextual signals
    
    // Question detection (confusion for user, thinking for AI)
    const questionCount = (lowercaseMessage.match(/\?/g) || []).length;
    if (questionCount > 0) {
      if (isUserMessage) {
        moodScores.confused += questionCount;
      } else {
        // AI answering questions shows thoughtfulness
        moodScores.thinking = (moodScores.thinking || 0) + questionCount;
      }
    }
    
    // Exclamation detection (excitement)
    const exclamationCount = (lowercaseMessage.match(/!/g) || []).length;
    if (exclamationCount > 1) {
      moodScores.excited += exclamationCount;
    }
    
    // Check for longer, detailed explanations
    if (!isUserMessage && lowercaseMessage.length > 500) {
      moodScores.thinking = (moodScores.thinking || 0) + 2;
    }
    
    // Find the mood with the highest score
    let topMood = 'neutral';
    let topScore = 0;
    
    Object.keys(moodScores).forEach(mood => {
      if (moodScores[mood] > topScore) {
        topMood = mood;
        topScore = moodScores[mood];
      }
    });
    
    // If the top score is still 0, default to neutral (or thinking for AI)
    if (topScore === 0) {
      return isUserMessage ? 'neutral' : 'neutral';
    }
    
    return topMood;
  }
  
  /**
   * Gets appropriate mood for AI based on current streaming state and message context
   * @param {Object} message - The message object
   * @returns {string} The appropriate mood
   */
  export function getSenticonMood(message) {
    // For streaming messages, always show thinking
    if (message.isStreaming) {
      return 'thinking';
    }
    
    // For non-streaming, analyze the content
    return analyzeSentiment(message.content);
  }
  
  export default {
    analyzeSentiment,
    getSenticonMood
  };