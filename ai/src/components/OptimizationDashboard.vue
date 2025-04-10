<template>
    <div class="optimization-dashboard">
      <div class="dashboard-header">
        <h2>AI Self-Optimization Dashboard</h2>
        <div class="header-actions">
          <span v-if="isLoading" class="loading-indicator">
            <svg class="loading-spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="4" />
            </svg>
            Refreshing...
          </span>
          <button @click="refreshDashboard" class="refresh-btn" :disabled="isLoading">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>
      
      <div class="stats-summary">
        <div class="stat-card knowledge-card">
          <div class="stat-icon">🧠</div>
          <div class="stat-info">
            <div class="stat-title">Global Knowledge</div>
            <div class="stat-value">{{ stats.knowledgeCount }}</div>
            <div class="stat-description">Unique concepts</div>
          </div>
        </div>
        
        <div class="stat-card optimizations-card">
          <div class="stat-icon">🚀</div>
          <div class="stat-info">
            <div class="stat-title">Optimizations</div>
            <div class="stat-value">{{ stats.optimizationCount }}</div>
            <div class="stat-description">System improvements</div>
          </div>
        </div>
        
        <div class="stat-card feedback-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <div class="stat-title">Feedback Score</div>
            <div class="stat-value">{{ stats.averageFeedback.toFixed(1) }}</div>
            <div class="stat-description">Average (out of 5)</div>
          </div>
        </div>
        
        <div class="stat-card thinking-card">
          <div class="stat-icon">💭</div>
          <div class="stat-info">
            <div class="stat-title">Thinking Processes</div>
            <div class="stat-value">{{ stats.thinkingCount }}</div>
            <div class="stat-description">Recursive analyses</div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-sections">
        <div class="dashboard-section">
          <h3 class="section-title">Knowledge Growth</h3>
          <div class="knowledge-visualization">
            <div class="knowledge-categories">
              <div v-for="(count, category) in stats.categoryBreakdown" :key="category" class="category-item">
                <div class="category-label">{{ formatCategoryName(category) }}</div>
                <div class="category-bar-container">
                  <div class="category-bar" :style="{ width: calculateCategoryPercentage(count) + '%' }"></div>
                  <span class="category-count">{{ count }}</span>
                </div>
              </div>
            </div>
            
            <div class="knowledge-metrics">
              <div class="metric-item">
                <div class="metric-value accent-1">{{ (stats.averageConfidence * 100).toFixed(0) }}%</div>
                <div class="metric-label">Avg. Confidence</div>
              </div>
              <div class="metric-item">
                <div class="metric-value accent-2">{{ stats.totalUsageCount }}</div>
                <div class="metric-label">Knowledge Uses</div>
              </div>
              <div class="metric-item">
                <div class="metric-value accent-3">{{ stats.knowledgeGrowthRate }}%</div>
                <div class="metric-label">Growth Rate</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-section">
          <h3 class="section-title">Recent Optimizations</h3>
          <div v-if="recentOptimizations.length === 0" class="empty-state">
            <div class="empty-icon">📈</div>
            <div class="empty-message">No optimizations recorded yet. The AI will learn as users interact with it!</div>
          </div>
          <div v-else class="optimizations-list">
            <div v-for="opt in recentOptimizations" :key="opt.optimizationId" class="optimization-item">
              <div class="optimization-type" :class="opt.type">{{ formatOptimizationType(opt.type) }}</div>
              <div class="optimization-details">
                <div class="optimization-description">{{ opt.description }}</div>
                <div class="optimization-meta">
                  <span class="optimization-time">{{ formatTime(opt.timestamp) }}</span>
                  <span v-if="opt.appliedGlobally" class="global-badge">Global</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-section">
          <h3 class="section-title">User Feedback Analysis</h3>
          <div class="feedback-analysis">
            <div class="feedback-chart">
              <div v-for="(count, rating) in stats.feedbackDistribution" :key="rating" class="rating-bar-container">
                <div class="rating-label">{{ rating }} ★</div>
                <div class="rating-bar-wrapper">
                  <div class="rating-bar" :style="{ width: calculateFeedbackPercentage(count) + '%', backgroundColor: getFeedbackColor(parseInt(rating)) }"></div>
                </div>
                <div class="rating-count">{{ count }}</div>
              </div>
            </div>
            
            <div class="feedback-metrics">
              <div class="metric-item">
                <div class="metric-value accent-2">{{ stats.totalFeedbackCount }}</div>
                <div class="metric-label">Total Ratings</div>
              </div>
              <div class="metric-item">
                <div class="metric-value accent-1">{{ stats.explicitFeedbackCount }}</div>
                <div class="metric-label">Explicit</div>
              </div>
              <div class="metric-item">
                <div class="metric-value accent-3">{{ stats.implicitFeedbackCount }}</div>
                <div class="metric-label">Implicit</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { db } from '@/firebase/init'; // Your existing Firebase config
  import { getKnowledgeUsageReport } from '@/services/knowledgeManager';
  import { getFeedbackReport } from '@/services/feedbackSystem';
  
  const isLoading = ref(false);
  const stats = ref({
    knowledgeCount: 0,
    optimizationCount: 0,
    thinkingCount: 0,
    averageFeedback: 0,
    categoryBreakdown: {},
    averageConfidence: 0,
    totalUsageCount: 0,
    knowledgeGrowthRate: 0,
    feedbackDistribution: {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    },
    totalFeedbackCount: 0,
    explicitFeedbackCount: 0,
    implicitFeedbackCount: 0
  });
  
  const recentOptimizations = ref([]);
  
  onMounted(async () => {
    await refreshDashboard();
  });
  
  const refreshDashboard = async () => {
    isLoading.value = true;
    
    try {
      // Fetch knowledge stats
      const knowledgeReport = await getKnowledgeUsageReport();
      
      // Fetch feedback stats
      const feedbackReport = await getFeedbackReport();
      
      // Fetch optimization stats
      const optimizationStats = await fetchOptimizationStats();
      
      // Fetch thinking process stats
      const thinkingStats = await fetchThinkingStats();
      
      // Update stats
      stats.value = {
        knowledgeCount: knowledgeReport.totalKnowledge || 0,
        optimizationCount: optimizationStats.totalOptimizations || 0,
        thinkingCount: thinkingStats.totalThinkingProcesses || 0,
        averageFeedback: feedbackReport.averageRating || 0,
        categoryBreakdown: knowledgeReport.categoryBreakdown || {},
        averageConfidence: knowledgeReport.averageConfidence || 0,
        totalUsageCount: knowledgeReport.totalUsage || 0,
        knowledgeGrowthRate: calculateGrowthRate(knowledgeReport.totalKnowledge, optimizationStats.recentGrowth),
        feedbackDistribution: feedbackReport.ratingDistribution || {
          '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
        },
        totalFeedbackCount: feedbackReport.totalFeedback || 0,
        explicitFeedbackCount: feedbackReport.explicitCount || 0,
        implicitFeedbackCount: feedbackReport.implicitCount || 0
      };
      
      // Fetch recent optimizations
      recentOptimizations.value = await fetchRecentOptimizations();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  const fetchOptimizationStats = async () => {
    try {
      // Get total optimizations
      const optimizationSnapshot = await db.collection('optimizationLog').get();
      
      // Get recent growth (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentSnapshot = await db.collection('optimizationLog')
        .where('timestamp', '>=', oneWeekAgo)
        .get();
      
      return {
        totalOptimizations: optimizationSnapshot.size,
        recentGrowth: recentSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching optimization stats:', error);
      return { totalOptimizations: 0, recentGrowth: 0 };
    }
  };
  
  const fetchThinkingStats = async () => {
    try {
      const thinkingSnapshot = await db.collection('recursiveThinking').get();
      
      return {
        totalThinkingProcesses: thinkingSnapshot.size
      };
    } catch (error) {
      console.error('Error fetching thinking stats:', error);
      return { totalThinkingProcesses: 0 };
    }
  };
  
  const fetchRecentOptimizations = async () => {
    try {
      const snapshot = await db.collection('optimizationLog')
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();
      
      const optimizations = [];
      snapshot.forEach(doc => {
        optimizations.push({
          optimizationId: doc.id,
          ...doc.data()
        });
      });
      
      return optimizations;
    } catch (error) {
      console.error('Error fetching recent optimizations:', error);
      return [];
    }
  };
  
  const calculateGrowthRate = (total, recent) => {
    if (total === 0) return 0;
    return Math.min(Math.round((recent / total) * 100), 100);
  };
  
  const calculateCategoryPercentage = (count) => {
    const total = Object.values(stats.value.categoryBreakdown).reduce((sum, val) => sum + val, 0);
    if (total === 0) return 0;
    return (count / total) * 100;
  };
  
  const calculateFeedbackPercentage = (count) => {
    if (stats.value.totalFeedbackCount === 0) return 0;
    return (count / stats.value.totalFeedbackCount) * 100;
  };
  
  const formatCategoryName = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  const formatOptimizationType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getFeedbackColor = (rating) => {
    const colors = {
      1: '#ef4444', // Red
      2: '#f97316', // Orange
      3: '#facc15', // Yellow
      4: '#84cc16', // Light green
      5: '#22c55e'  // Green
    };
    
    return colors[rating] || '#94a3b8'; // Default gray
  };
  </script>
  
  <style scoped>
  .optimization-dashboard {
    background-color: var(--dashboard-bg, #f8fafc);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-light, #e2e8f0);
    padding-bottom: 16px;
  }
  
  .dashboard-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary, #1e293b);
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--text-secondary, #64748b);
  }
  
  .loading-spinner {
    width: 16px;
    height: 16px;
    animation: spin 1.5s linear infinite;
    stroke-dasharray: 60;
    stroke-dashoffset: 50;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: var(--button-bg, #f1f5f9);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary, #1e293b);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .refresh-btn:hover {
    background-color: var(--button-hover, #e2e8f0);
  }
  
  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .stats-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .stat-card {
    background-color: var(--card-bg, white);
    border-radius: 10px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .knowledge-card {
    border-top: 3px solid var(--knowledge-color, #3b82f6);
  }
  
  .optimizations-card {
    border-top: 3px solid var(--optimization-color, #8b5cf6);
  }
  
  .feedback-card {
    border-top: 3px solid var(--feedback-color, #f59e0b);
  }
  
  .thinking-card {
    border-top: 3px solid var(--thinking-color, #10b981);
  }
  
  .stat-icon {
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background-color: var(--icon-bg, #f1f5f9);
  }
  
  .stat-info {
    display: flex;
    flex-direction: column;
  }
  
  .stat-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary, #64748b);
    margin-bottom: 4px;
  }
  
  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary, #1e293b);
    line-height: 1;
    margin-bottom: 4px;
  }
  
  .stat-description {
    font-size: 12px;
    color: var(--text-tertiary, #94a3b8);
  }
  
  .dashboard-sections {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .dashboard-section {
    background-color: var(--card-bg, white);
    border-radius: 10px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .section-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #1e293b);
  }
  
  .knowledge-visualization {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .knowledge-categories {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .category-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .category-label {
    min-width: 100px;
    font-size: 14px;
    color: var(--text-primary, #1e293b);
  }
  
  .category-bar-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .category-bar {
    height: 8px;
    background-color: var(--knowledge-color, #3b82f6);
    border-radius: 4px;
  }
  
  .category-count {
    font-size: 14px;
    color: var(--text-secondary, #64748b);
    min-width: 24px;
    text-align: right;
  }
  
  .knowledge-metrics {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border-light, #e2e8f0);
  }
  
  .metric-item {
    text-align: center;
    flex: 1;
  }
  
  .metric-value {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  .metric-label {
    font-size: 12px;
    color: var(--text-secondary, #64748b);
  }
  
  .accent-1 {
    color: var(--accent-1, #3b82f6);
  }
  
  .accent-2 {
    color: var(--accent-2, #8b5cf6);
  }
  
  .accent-3 {
    color: var(--accent-3, #f59e0b);
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
  }
  
  .empty-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }
  
  .empty-message {
    font-size: 14px;
    color: var(--text-secondary, #64748b);
    max-width: 300px;
  }
  
  .optimizations-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 240px;
    overflow-y: auto;
  }
  
  .optimization-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background-color: var(--item-bg, #f8fafc);
    border-radius: 8px;
    transition: background-color 0.2s;
  }
  
  .optimization-item:hover {
    background-color: var(--item-hover, #f1f5f9);
  }
  
  .optimization-type {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    font-weight: 700;
    font-size: 12px;
    flex-shrink: 0;
  }
  
  .optimization-type.knowledge {
    background-color: var(--knowledge-light, #dbeafe);
    color: var(--knowledge-dark, #2563eb);
  }
  
  .optimization-type.performance {
    background-color: var(--performance-light, #dcfce7);
    color: var(--performance-dark, #16a34a);
  }
  
  .optimization-type.empathy {
    background-color: var(--empathy-light, #fef3c7);
    color: var(--empathy-dark, #d97706);
  }
  
  .optimization-details {
    flex: 1;
  }
  
  .optimization-description {
    font-size: 14px;
    margin-bottom: 4px;
    color: var(--text-primary, #1e293b);
  }
  
  .optimization-meta {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    color: var(--text-tertiary, #94a3b8);
  }
  
  .global-badge {
    background-color: var(--badge-bg, #e2e8f0);
    color: var(--badge-text, #64748b);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 500;
  }
  
  .feedback-analysis {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .feedback-chart {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .rating-bar-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .rating-label {
    min-width: 40px;
    font-size: 14px;
    color: var(--text-primary, #1e293b);
  }
  
  .rating-bar-wrapper {
    flex: 1;
    height: 8px;
    background-color: var(--bar-bg, #e2e8f0);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .rating-bar {
    height: 100%;
    border-radius: 4px;
  }
  
  .rating-count {
    min-width: 30px;
    text-align: right;
    font-size: 14px;
    color: var(--text-secondary, #64748b);
  }
  
  .feedback-metrics {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid var(--border-light, #e2e8f0);
  }
  
  @media (max-width: 768px) {
    .stats-summary {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .knowledge-metrics, 
    .feedback-metrics {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;
    }
    
    .metric-item {
      display: flex;
      align-items: center;
      gap: 8px;
      text-align: left;
    }
    
    .metric-value {
      margin-bottom: 0;
    }
  }
  </style>