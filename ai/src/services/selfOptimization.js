// services/selfOptimization.js
export const SelfOptimizationService = {
  // Learning parameters
  learningRate: 0.05,
  decayRate: 0.01,
  lastUpdate: Date.now(),
  
  // Learning database
  database: {
    interactions: [],
    performanceMetrics: {
      responseQuality: 0.7,
      adaptationRate: 0.5,
      userSatisfaction: 0.8,
      knowledgeGrowth: 0.6
    },
    optimizationWeights: {
      creativity: 0.5,
      logic: 0.5,
      empathy: 0.5,
      adaptability: 0.5,
      specificity: 0.5,
      brevity: 0.5
    }
  },
  
  // Process and learn from interaction
  async processInteraction(userMessage, aiMessage) {
    console.log("Self-optimization processing interaction");
    
    // Extract features from interaction
    const features = this.extractFeatures(userMessage, aiMessage);
    
    // Update database
    this.updateDatabase(features);
    
    // Apply temporal decay
    this.applyDecay();
    
    // Update learning parameters
    this.updateLearningParameters();
    
    return {
      optimizationStatus: "success",
      updatedMetrics: this.database.performanceMetrics,
      timestamp: Date.now()
    };
  },
  
  // Extract meaningful features from interaction
  extractFeatures(userMessage, aiMessage) {
    // Calculate basic metrics
    const userMessageLength = userMessage.length;
    const aiMessageLength = aiMessage.content.length;
    const responseTime = Date.now() - aiMessage.timestamp;
    const hasReasoning = aiMessage.hasReasoning || false;
    
    // Analyze content types
    const hasCode = aiMessage.content.includes("```");
    const hasFormatting = /\*\*|\*|__|\#/.test(aiMessage.content);
    const questionCount = (aiMessage.content.match(/\?/g) || []).length;
    
    // Semantic analysis (simplified)
    const sentimentScore = this.analyzeSentiment(aiMessage.content);
    const complexityScore = this.analyzeComplexity(aiMessage.content);
    const coherenceScore = this.analyzeCoherence(userMessage, aiMessage.content);
    
    return {
      userMessageLength,
      aiMessageLength,
      responseTime,
      hasReasoning,
      hasCode,
      hasFormatting,
      questionCount,
      sentimentScore,
      complexityScore,
      coherenceScore,
      timestamp: Date.now()
    };
  },
  
  // Update learning database
  updateDatabase(features) {
    // Limit the number of stored interactions
    if (this.database.interactions.length >= 100) {
      this.database.interactions.shift();
    }
    
    // Add new interaction
    this.database.interactions.push(features);
    
    // Update performance metrics
    this.database.performanceMetrics.responseQuality = 
      this.calculateResponseQuality(features);
      
    this.database.performanceMetrics.adaptationRate = 
      this.calculateAdaptationRate();
      
    this.database.performanceMetrics.userSatisfaction = 
      this.calculateUserSatisfaction(features);
      
    this.database.performanceMetrics.knowledgeGrowth = 
      this.calculateKnowledgeGrowth();
      
    // Update weights based on performance
    this.updateWeights(features);
    
    this.lastUpdate = Date.now();
  },
  
  // Apply temporal decay to learning
  applyDecay() {
    const daysSinceUpdate = (Date.now() - this.lastUpdate) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 1) {
      const decayFactor = Math.exp(-this.decayRate * daysSinceUpdate);
      
      // Apply decay to metrics
      Object.keys(this.database.performanceMetrics).forEach(key => {
        this.database.performanceMetrics[key] *= decayFactor;
      });
    }
  },
  
  // Update learning parameters based on performance
  updateLearningParameters() {
    // Adjust learning rate based on adaptation performance
    this.learningRate = Math.max(
      0.01,
      Math.min(0.1, this.learningRate * (1 + (this.database.performanceMetrics.adaptationRate - 0.5)))
    );
    
    // Adjust decay rate based on knowledge retention
    this.decayRate = Math.max(
      0.001,
      Math.min(0.05, this.decayRate * (1 + (0.5 - this.database.performanceMetrics.knowledgeGrowth)))
    );
  },
  
  // Update optimization weights
  updateWeights(features) {
    // Adjust creativity weight
    if (features.sentimentScore > 0.6 && features.complexityScore > 0.7) {
      this.database.optimizationWeights.creativity += this.learningRate * 0.1;
    } else {
      this.database.optimizationWeights.creativity -= this.learningRate * 0.05;
    }
    
    // Adjust logic weight
    if (features.coherenceScore > 0.7) {
      this.database.optimizationWeights.logic += this.learningRate * 0.1;
    } else {
      this.database.optimizationWeights.logic -= this.learningRate * 0.05;
    }
    
    // Adjust other weights similarly
    // Ensure weights remain in [0.1, 0.9] range
    Object.keys(this.database.optimizationWeights).forEach(key => {
      this.database.optimizationWeights[key] = Math.max(
        0.1,
        Math.min(0.9, this.database.optimizationWeights[key])
      );
    });
  },
  
  // Simple sentiment analysis
  analyzeSentiment(text) {
    const positiveWords = ['great', 'good', 'excellent', 'helpful', 'thank', 'appreciate'];
    const negativeWords = ['bad', 'issue', 'problem', 'wrong', 'error', 'fail'];
    
    let score = 0.5; // Neutral baseline
    const lowerText = text.toLowerCase();
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.05;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.05;
    });
    
    return Math.max(0, Math.min(1, score));
  },
  
  // Text complexity analysis
  analyzeComplexity(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (words.length === 0 || sentences.length === 0) return 0.5;
    
    // Average words per sentence
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Average word length
    const avgWordLength = words.join('').length / words.length;
    
    // Normalize and combine metrics
    const normalizedSentenceLength = Math.min(1, avgWordsPerSentence / 25);
    const normalizedWordLength = Math.min(1, avgWordLength / 8);
    
    return (normalizedSentenceLength * 0.7 + normalizedWordLength * 0.3);
  },
  
  // Coherence between user message and response
  analyzeCoherence(userMessage, aiResponse) {
    // Extract key terms from user message
    const userTerms = new Set(
      userMessage.toLowerCase().split(/\W+/).filter(term => 
        term.length > 3 && !['what', 'when', 'where', 'how', 'why', 'who', 'this', 'that', 'with'].includes(term)
      )
    );
    
    // Count how many user terms appear in the response
    const aiResponseLower = aiResponse.toLowerCase();
    let matchCount = 0;
    
    userTerms.forEach(term => {
      if (aiResponseLower.includes(term)) matchCount++;
    });
    
    // Calculate coherence score
    const coherenceScore = userTerms.size > 0 ? matchCount / userTerms.size : 0.5;
    
    return Math.max(0.3, Math.min(0.95, coherenceScore));
  },
  
  // Calculate response quality metric
  calculateResponseQuality(features) {
    // Weighted combination of features
    const quality = 
      (features.hasFormatting ? 0.1 : 0) +
      (features.hasReasoning ? 0.15 : 0) +
      (features.coherenceScore * 0.4) +
      (Math.min(1, features.aiMessageLength / 1000) * 0.2) +
      (features.complexityScore * 0.15);
      
    // Blend with existing metric for stability
    return this.database.performanceMetrics.responseQuality * 0.7 + quality * 0.3;
  },
  
  // Calculate adaptation rate
  calculateAdaptationRate() {
    // Not enough data
    if (this.database.interactions.length < 2) return 0.5;
    
    // Get recent interactions
    const recent = this.database.interactions.slice(-10);
    
    // Calculate variance in response styles
    const lengthVariance = this.calculateVariance(recent.map(i => i.aiMessageLength));
    const complexityVariance = this.calculateVariance(recent.map(i => i.complexityScore));
    
    // Normalize variances
    const normalizedLengthVar = Math.min(1, lengthVariance / 250000);
    const normalizedComplexityVar = Math.min(1, complexityVariance / 0.1);
    
    // Combined adaptation score
    const adaptationScore = (normalizedLengthVar * 0.4 + normalizedComplexityVar * 0.6);
    
    // Blend with existing metric
    return this.database.performanceMetrics.adaptationRate * 0.8 + adaptationScore * 0.2;
  },
  
  // Calculate user satisfaction (estimated)
  calculateUserSatisfaction(features) {
    // Estimate satisfaction from coherence and complexity
    const estimatedSatisfaction = 
      features.coherenceScore * 0.6 + 
      (1 - Math.abs(features.complexityScore - 0.6)) * 0.4;
      
    // Blend with existing metric
    return this.database.performanceMetrics.userSatisfaction * 0.9 + estimatedSatisfaction * 0.1;
  },
  
  // Calculate knowledge growth
  calculateKnowledgeGrowth() {
    // Not enough data
    if (this.database.interactions.length < 5) return 0.5;
    
    // Calculate growth in response complexity over time
    const complexityTrend = this.calculateTrend(
      this.database.interactions.slice(-10).map(i => i.complexityScore)
    );
    
    // Calculate growth in coherence over time
    const coherenceTrend = this.calculateTrend(
      this.database.interactions.slice(-10).map(i => i.coherenceScore)
    );
    
    // Combined growth score
    const growthScore = (complexityTrend + coherenceTrend) / 2 + 0.5; // Normalize to [0,1]
    
    // Blend with existing metric
    return this.database.performanceMetrics.knowledgeGrowth * 0.9 + growthScore * 0.1;
  },
  
  // Helper: Calculate variance of an array
  calculateVariance(array) {
    if (array.length < 2) return 0;
    
    const mean = array.reduce((sum, val) => sum + val, 0) / array.length;
    return array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / array.length;
  },
  
  // Helper: Calculate trend in an array (positive or negative)
  calculateTrend(array) {
    if (array.length < 2) return 0;
    
    let trend = 0;
    for (let i = 1; i < array.length; i++) {
      trend += array[i] - array[i-1];
    }
    
    return Math.max(-0.5, Math.min(0.5, trend / (array.length - 1)));
  },
  
  // Get optimization suggestions
  getOptimizationSuggestions() {
    const suggestions = [];
    
    // Analyze performance metrics
    if (this.database.performanceMetrics.responseQuality < 0.6) {
      suggestions.push({
        aspect: "Response Quality",
        suggestion: "Improve response formatting and detail level",
        priority: "high"
      });
    }
    
    if (this.database.performanceMetrics.adaptationRate < 0.5) {
      suggestions.push({
        aspect: "Adaptation",
        suggestion: "Vary response styles based on query type",
        priority: "medium"
      });
    }
    
    // Analyze weight imbalances
    const weights = this.database.optimizationWeights;
    if (weights.creativity > 0.7 && weights.logic < 0.4) {
      suggestions.push({
        aspect: "Balance",
        suggestion: "Add more logical structure to creative responses",
        priority: "medium"
      });
    }
    
    if (weights.empathy > 0.7 && weights.specificity < 0.4) {
      suggestions.push({
        aspect: "Detail",
        suggestion: "Balance empathetic tone with specific details",
        priority: "low"
      });
    }
    
    return suggestions;
  }
};