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