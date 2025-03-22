<template>
    <div>
      <!-- Mind Map Button in Top Bar -->
      <button class="mind-map-button" @click="showMindMapModal = true" title="Create Mind Map">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <path d="M17 4.5a2.5 2.5 0 0 1 0 5" />
          <path d="M4.5 17a2.5 2.5 0 0 0 5 0" />
          <path d="M19.5 7a2.5 2.5 0 0 0 0-5" />
          <path d="M7 19.5a2.5 2.5 0 0 1-5 0" />
        </svg>
        <span class="button-text">Mind Map</span>
      </button>
  
      <!-- Create Mind Map Modal -->
      <div v-if="showMindMapModal" class="modal-overlay">
        <div class="mind-map-modal">
          <div class="modal-header">
            <h3>Create New Mind Map</h3>
            <button class="modal-close-btn" @click="showMindMapModal = false">&times;</button>
          </div>
          <div class="modal-content">
            <div class="typewriter-text">What do you want this mind map to be about?</div>
            <input 
              v-model="mindMapTopic" 
              placeholder="Enter a topic (e.g., Artificial Intelligence)" 
              class="mind-map-input"
              @keydown.enter="createMindMap"
              ref="mindMapInput"
            />
          </div>
          <div class="modal-footer">
            <button class="btn-primary" @click="createMindMap" :disabled="!mindMapTopic.trim()">Create</button>
            <button class="btn-secondary" @click="showMindMapModal = false">Cancel</button>
          </div>
        </div>
      </div>
  
      <!-- Mind Map Visualization Modal -->
      <div v-if="showMindMapVisualization" class="modal-overlay">
        <div class="mind-map-visualization-modal">
          <div class="modal-header">
            <h3>Mind Map: {{ currentMindMap.topic }}</h3>
            <div class="modal-actions">
              <button class="save-map-btn" @click="saveMindMap" v-if="!currentMindMap.id" title="Save Mind Map">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </button>
              <button class="modal-close-btn" @click="showMindMapVisualization = false">&times;</button>
            </div>
          </div>
          <div class="mind-map-container" ref="mindMapContainer">
            <div v-if="isLoadingMap" class="mind-map-loading">
              <div class="spinner">
                <svg class="spinner-svg" viewBox="0 0 50 50">
                  <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
                </svg>
              </div>
              <div class="loading-text">Generating mind map...</div>
            </div>
            <div v-else class="mind-map-visualization">
              <div class="mind-map-core">
                <div class="core-topic">{{ currentMindMap.topic }}</div>
                <div class="mind-map-branches">
                  <div 
                    v-for="(node, index) in currentMindMap.nodes" 
                    :key="index" 
                    class="mind-map-node"
                    :class="`node-level-${node.level} node-position-${index % 4}`"
                    @click="exploreSubtopic(node)"
                  >
                    {{ node.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Subtopic Exploration Modal -->
      <div v-if="showSubtopicModal" class="modal-overlay">
        <div class="subtopic-modal">
          <div class="modal-header">
            <h3>Explore "{{ selectedSubtopic.title }}"</h3>
            <button class="modal-close-btn" @click="showSubtopicModal = false">&times;</button>
          </div>
          <div class="modal-content">
            <p>Which chat do you want to explore this subtopic in?</p>
            <div class="chat-list">
              <div 
                v-for="chat in savedChats" 
                :key="chat.id" 
                class="chat-option"
                @click="exploreInChat(chat.id)"
              >
                {{ chat.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Saved Mind Maps Sidebar Item -->
      <div class="saved-mind-maps" @click="showSavedMindMaps">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
        <span>Saved Mind Maps</span>
      </div>
  
      <!-- Saved Mind Maps Modal -->
      <div v-if="showSavedMindMapsModal" class="modal-overlay">
        <div class="saved-mind-maps-modal">
          <div class="modal-header">
            <h3>Saved Mind Maps</h3>
            <button class="modal-close-btn" @click="showSavedMindMapsModal = false">&times;</button>
          </div>
          <div class="modal-content">
            <div v-if="savedMindMaps.length === 0" class="no-mind-maps">
              No saved mind maps yet. Create one to get started!
            </div>
            <div v-else class="mind-maps-grid">
              <div 
                v-for="map in savedMindMaps" 
                :key="map.id" 
                class="mind-map-card"
                @click="loadMindMap(map)"
              >
                <div class="mind-map-card-title">{{ map.topic }}</div>
                <div class="mind-map-card-date">{{ formatTime(map.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, nextTick, computed, watch } from 'vue';
  import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { format } from 'date-fns';
  
  export default {
    name: 'MindMap',
    props: {
      savedChats: {
        type: Array,
        required: true
      },
      currentChatId: {
        type: String,
        default: null
      },
      apiKey: {
        type: String,
        required: true
      },
      userId: {
        type: String,
        required: true
      },
      showToastNotification: {
        type: Function,
        required: true
      },
      sendMessage: {
        type: Function,
        required: true
      },
      loadChat: {
        type: Function,
        required: true
      }
    },
    setup(props) {
      // Firebase
      const db = getFirestore();
      const auth = getAuth();
  
      // UI State
      const showMindMapModal = ref(false);
      const showMindMapVisualization = ref(false);
      const showSubtopicModal = ref(false);
      const showSavedMindMapsModal = ref(false);
      const mindMapTopic = ref('');
      const isLoadingMap = ref(false);
      const mindMapInput = ref(null);
      const mindMapContainer = ref(null);
      
      // Data
      const currentMindMap = ref({
        topic: '',
        nodes: [],
        id: null,
        timestamp: null
      });
      const selectedSubtopic = ref(null);
      const savedMindMaps = ref([]);
      
      // Focus input when modal opens
      watch(showMindMapModal, (newVal) => {
        if (newVal) {
          nextTick(() => {
            if (mindMapInput.value) {
              mindMapInput.value.focus();
            }
          });
        }
      });
      
      // Load saved mind maps
      const loadSavedMindMaps = async () => {
        if (!props.userId) return;
        
        try {
          const mindMapsRef = collection(db, `users/${props.userId}/mindmaps`);
          const q = query(mindMapsRef, orderBy("timestamp", "desc"));
          const snapshot = await getDocs(q);
          
          savedMindMaps.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          console.error("Error loading saved mind maps:", error);
          props.showToastNotification("Failed to load saved mind maps", "error");
        }
      };
      
      // Show saved mind maps
      const showSavedMindMaps = () => {
        loadSavedMindMaps();
        showSavedMindMapsModal.value = true;
      };
      
      // Load a specific mind map
      const loadMindMap = (map) => {
        currentMindMap.value = { ...map };
        showSavedMindMapsModal.value = false;
        showMindMapVisualization.value = true;
      };
      
      // Create a new mind map
      const createMindMap = async () => {
        if (!mindMapTopic.value.trim()) return;
        
        showMindMapModal.value = false;
        showMindMapVisualization.value = true;
        isLoadingMap.value = true;
        
        try {
          // Generate mind map via API
          const result = await generateMindMap(mindMapTopic.value);
          
          if (result) {
            currentMindMap.value = {
              topic: mindMapTopic.value,
              nodes: result.nodes || [],
              timestamp: Date.now(),
              id: null
            };
          }
        } catch (error) {
          console.error("Error creating mind map:", error);
          props.showToastNotification("Failed to create mind map", "error");
        } finally {
          isLoadingMap.value = false;
          mindMapTopic.value = '';
        }
      };
      
      // Generate mind map via OpenAI API
      const generateMindMap = async (topic) => {
        try {
          // Simplified schema for a mind map
          const systemMessage = `You are a mind map generator. Create a comprehensive mind map on the topic provided. 
          Return a JSON structure with a nodes array containing objects with 'title' and 'level' properties. 
          Level 1 nodes are main categories, level 2 are subcategories. Include 6-10 main nodes (level 1) and 2-4 subnodes (level 2) for each.`;
          
          const userMessage = `Create a detailed mind map about "${topic}". Include main concepts and related subtopics.`;
          
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${props.apiKey}`
            },
            body: JSON.stringify({
              model: "o3-mini",
              messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage }
              ],
              response_format: { type: "json_object" }
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
          }
          
          const data = await response.json();
          const content = data.choices[0].message.content;
          
          // Parse the JSON response
          const mindMapData = JSON.parse(content);
          
          // If API doesn't return the expected format, create a fallback
          if (!mindMapData.nodes || !Array.isArray(mindMapData.nodes)) {
            return {
              nodes: [
                { title: "Overview", level: 1 },
                { title: "Key Concepts", level: 1 },
                { title: "Applications", level: 1 },
                { title: "History", level: 1 },
                { title: "Future Trends", level: 1 }
              ]
            };
          }
          
          return mindMapData;
        } catch (error) {
          console.error("Error generating mind map:", error);
          props.showToastNotification("Error generating mind map", "error");
          
          // Return a fallback mind map structure
          return {
            nodes: [
              { title: "Overview", level: 1 },
              { title: "Key Concepts", level: 1 },
              { title: "Applications", level: 1 },
              { title: "History", level: 1 },
              { title: "Future Trends", level: 1 }
            ]
          };
        }
      };
      
      // Save the current mind map
      const saveMindMap = async () => {
        if (!props.userId || !currentMindMap.value.topic) return;
        
        try {
          const mindMapData = {
            ...currentMindMap.value,
            timestamp: Date.now(),
            createdBy: props.userId
          };
          
          const mindMapsRef = collection(db, `users/${props.userId}/mindmaps`);
          const docRef = await addDoc(mindMapsRef, mindMapData);
          
          currentMindMap.value.id = docRef.id;
          props.showToastNotification("Mind map saved successfully", "success");
          
          // Update list of saved mind maps
          loadSavedMindMaps();
        } catch (error) {
          console.error("Error saving mind map:", error);
          props.showToastNotification("Failed to save mind map", "error");
        }
      };
      
      // Explore a subtopic from the mind map
      const exploreSubtopic = (node) => {
        selectedSubtopic.value = node;
        showSubtopicModal.value = true;
      };
      
      // Explore a subtopic in a specific chat
      const exploreInChat = (chatId) => {
        showSubtopicModal.value = false;
        showMindMapVisualization.value = false;
        
        props.loadChat(chatId);
        
        // Send a message to explore the subtopic
        const explorationPrompt = `Please create a detailed exploration of "${selectedSubtopic.value.title}" as part of the "${currentMindMap.value.topic}" mind map. Include key concepts, applications, and insights.`;
        
        nextTick(() => {
          props.sendMessage(explorationPrompt);
        });
      };
      
      // Format timestamp for display
      const formatTime = (timestamp) => {
        if (!timestamp) return "";
        return format(new Date(timestamp), "MMM d, yyyy");
      };
      
      // Load saved mind maps on mount
      onMounted(() => {
        if (props.userId) {
          loadSavedMindMaps();
        }
      });
      
      return {
        showMindMapModal,
        showMindMapVisualization,
        showSubtopicModal,
        showSavedMindMapsModal,
        mindMapTopic,
        isLoadingMap,
        currentMindMap,
        selectedSubtopic,
        savedMindMaps,
        mindMapInput,
        mindMapContainer,
        createMindMap,
        saveMindMap,
        showSavedMindMaps,
        loadMindMap,
        exploreSubtopic,
        exploreInChat,
        formatTime
      };
    }
  };
  </script>
  
  <style scoped>
  /* Mind Map Button */
  .mind-map-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    color: white;
    height: 32px;
    padding: 0 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 8px;
  }
  .mind-map-button:hover {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(255, 255, 255, 0.25);
  }
  .mind-map-button svg {
    stroke: var(--primary);
  }
  .button-text {
    font-size: 13px;
    font-weight: 500;
  }
  
  /* Mind Map Modal */
  .mind-map-modal {
    width: 400px;
    max-width: 90vw;
    background: #1a1f35;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: slideIn 0.3s ease;
  }
  .modal-content {
    padding: 20px;
  }
  .typewriter-text {
    overflow: hidden;
    white-space: nowrap;
    margin-bottom: 15px;
    font-size: 15px;
    color: var(--text-secondary);
    animation: typing 3s steps(40, end) 1;
  }
  @keyframes typing {
    from { width: 0 }
    to { width: 100% }
  }
  .mind-map-input {
    width: 100%;
    padding: 10px 12px;
    margin-top: 10px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(15, 23, 42, 0.7);
    color: white;
    font-size: 14px;
  }
  .mind-map-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.2);
  }
  
  /* Mind Map Visualization Modal */
  .mind-map-visualization-modal {
    width: 800px;
    height: 600px;
    max-width: 90vw;
    max-height: 80vh;
    background: #1a1f35;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: slideIn 0.3s ease;
    display: flex;
    flex-direction: column;
  }
  .mind-map-container {
    flex: 1;
    overflow: auto;
    position: relative;
    background: rgba(15, 23, 42, 0.5);
  }
  .mind-map-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .loading-text {
    margin-top: 15px;
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  /* Mind Map Visualization */
  .mind-map-visualization {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 20px;
    min-height: 100%;
  }
  .mind-map-core {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .core-topic {
    background: var(--primary);
    color: white;
    padding: 15px 25px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 18px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    margin-bottom: 40px;
    z-index: 10;
    position: relative;
  }
  .mind-map-branches {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 700px;
    margin-top: -20px;
    position: relative;
    z-index: 5;
  }
  .mind-map-branches::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    bottom: 0;
    width: 3px;
    background: rgba(79, 70, 229, 0.3);
    transform: translateX(-50%);
    z-index: -1;
  }
  .mind-map-node {
    background: rgba(15, 23, 42, 0.8);
    border: 2px solid var(--primary);
    color: white;
    padding: 10px 15px;
    border-radius: 6px;
    margin: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    max-width: 180px;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  .mind-map-node:hover {
    transform: scale(1.05);
    background: rgba(79, 70, 229, 0.15);
  }
  .mind-map-node::before {
    content: '';
    position: absolute;
    width: 30px;
    height: 2px;
    background: rgba(79, 70, 229, 0.3);
    top: 50%;
    transform: translateY(-50%);
  }
  .node-position-0 {
    transform: translateX(-120px);
  }
  .node-position-0::before {
    right: -30px;
  }
  .node-position-1 {
    transform: translateX(120px);
  }
  .node-position-1::before {
    left: -30px;
  }
  .node-position-2 {
    transform: translateY(60px);
  }
  .node-position-2::before {
    top: -20px;
    left: 50%;
    width: 2px;
    height: 20px;
    transform: translateX(-50%);
  }
  .node-position-3 {
    transform: translateY(-60px);
  }
  .node-position-3::before {
    bottom: -20px;
    top: auto;
    left: 50%;
    width: 2px;
    height: 20px;
    transform: translateX(-50%);
  }
  .node-level-2 {
    font-size: 12px;
    padding: 6px 10px;
    border-width: 1px;
    background: rgba(15, 23, 42, 0.6);
  }
  
  /* Modal Headers with Actions */
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-light);
  }
  .modal-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .save-map-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  .save-map-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #10b981;
  }
  
  /* Subtopic Modal */
  .subtopic-modal {
    width: 400px;
    max-width: 90vw;
    background: #1a1f35;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: slideIn 0.3s ease;
  }
  .subtopic-modal .modal-content {
    padding: 20px;
  }
  .subtopic-modal p {
    margin-top: 0;
    margin-bottom: 15px;
    color: var(--text-secondary);
  }
  .chat-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
  }
  .chat-option {
    padding: 10px 15px;
    background: rgba(15, 23, 42, 0.7);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .chat-option:hover {
    background: rgba(79, 70, 229, 0.15);
  }
  
  /* Saved Mind Maps Sidebar Item */
  .saved-mind-maps {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    margin: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    color: var(--text-secondary);
  }
  .saved-mind-maps:hover {
    background: rgba(79, 70, 229, 0.08);
    color: white;
  }
  .saved-mind-maps svg {
    color: var(--primary);
  }
  
  /* Saved Mind Maps Modal */
  .saved-mind-maps-modal {
    width: 600px;
    max-width: 90vw;
    background: #1a1f35;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: slideIn 0.3s ease;
  }
  .saved-mind-maps-modal .modal-content {
    padding: 20px;
    max-height: 400px;
    overflow-y: auto;
  }
  .no-mind-maps {
    color: var(--text-secondary);
    text-align: center;
    padding: 30px 0;
  }
  .mind-maps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
  }
  .mind-map-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .mind-map-card:hover {
    background: rgba(79, 70, 229, 0.15);
    border-color: rgba(79, 70, 229, 0.3);
    transform: translateY(-2px);
  }
  .mind-map-card-title {
    font-weight: 500;
    font-size: 15px;
    margin-bottom: 6px;
  }
  .mind-map-card-date {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  /* Responsive Styles */
  @media (max-width: 768px) {
    .button-text {
      display: none;
    }
    .mind-map-button {
      width: 32px;
      padding: 0;
      justify-content: center;
    }
    .mind-map-visualization-modal {
      height: calc(var(--vh, 1vh) * 80);
    }
    .mind-map-branches {
      max-width: 90vw;
    }
    .mind-map-node {
      max-width: 150px;
      font-size: 12px;
      padding: 8px 12px;
    }
    .node-position-0, .node-position-1, .node-position-2, .node-position-3 {
      transform: none;
    }
    .mind-map-node::before {
      display: none;
    }
    .mind-maps-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
  }
  </style>