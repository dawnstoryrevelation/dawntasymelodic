// src/components/MindMap.vue
<template>
  <div>
    <!-- Mind Map Button -->
    <button 
      class="mind-map-button" 
      @click="showCreateMindMapModal = true"
      title="Create Mind Map"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <span>Create Mind Map</span>
    </button>

    <!-- Create Mind Map Modal -->
    <div v-if="showCreateMindMapModal" class="modal-overlay">
      <div class="mind-map-modal">
        <div class="modal-header">
          <h3>Create Mind Map</h3>
          <button class="modal-close-btn" @click="showCreateMindMapModal = false">&times;</button>
        </div>
        <div class="modal-content">
          <div class="typing-text">{{ displayedPrompt }}</div>
          <input 
            v-model="mindMapTopic" 
            placeholder="Enter mind map topic..." 
            @keydown.enter="createMindMap"
            ref="mindMapInput"
            :disabled="isCreating"
          />
        </div>
        <div class="popup-buttons">
          <button 
            class="btn-primary" 
            @click="createMindMap" 
            :disabled="!mindMapTopic.trim() || isCreating"
          >
            {{ isCreating ? 'Creating...' : 'Create' }}
          </button>
          <button class="btn-secondary" @click="showCreateMindMapModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Deploy Mind Map Modal -->
    <div v-if="showDeployMindMapModal" class="modal-overlay">
      <div class="mind-map-modal large-modal">
        <div class="modal-header">
          <h3>Mind Map: {{ currentMindMap.name }}</h3>
          <button class="modal-close-btn" @click="showDeployMindMapModal = false">&times;</button>
        </div>
        <div class="modal-content">
          <div v-if="isDeploying" class="deploying-indicator">
            <div class="deploying-animation">
              <div class="orbit">
                <div class="planet"></div>
              </div>
            </div>
            <div class="deploying-text">Deploying Mind Map...</div>
          </div>
          <div v-else class="mind-map-visualization" ref="mindMapContainer"></div>
        </div>
      </div>
    </div>

    <!-- Select Chat Modal -->
    <div v-if="showSelectChatModal" class="modal-overlay">
      <div class="mind-map-modal">
        <div class="modal-header">
          <h3>Select Chat to Explore</h3>
          <button class="modal-close-btn" @click="showSelectChatModal = false">&times;</button>
        </div>
        <div class="modal-content">
          <p>What chat do you want to deploy this exploration in?</p>
          <div class="chat-selection-list">
            <div 
              v-for="chat in savedChats" 
              :key="chat.id" 
              class="chat-selection-item" 
              @click="exploreBranchInChat(chat.id)"
            >
              {{ chat.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, getDocs, query, orderBy } from 'firebase/firestore';
import * as d3 from 'd3';

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
    const db = getFirestore();
    const mindMapTopic = ref('');
    const showCreateMindMapModal = ref(false);
    const showDeployMindMapModal = ref(false);
    const showSelectChatModal = ref(false);
    const savedMindMaps = ref([]);
    const currentMindMap = ref(null);
    const selectedBranch = ref('');
    const mindMapInput = ref(null);
    const isCreating = ref(false);
    const isDeploying = ref(false);
    const mindMapContainer = ref(null);
    const fullPrompt = "DawntasyAI says: What is the topic of your Mind Map?";
    const displayedPrompt = ref('');
    
    // For typing animation of prompt
    let charIndex = 0;
    const typePrompt = () => {
      if (charIndex < fullPrompt.length) {
        displayedPrompt.value = fullPrompt.substring(0, charIndex + 1);
        charIndex++;
        setTimeout(typePrompt, 50);
      }
    };
    
    watch(showCreateMindMapModal, (newVal) => {
      if (newVal) {
        mindMapTopic.value = '';
        displayedPrompt.value = '';
        charIndex = 0;
        nextTick(() => {
          if (mindMapInput.value) {
            mindMapInput.value.focus();
          }
          typePrompt();
        });
      }
    });

    // Load saved mind maps from Firebase
    const loadSavedMindMaps = async () => {
      if (!props.userId) return;

      try {
        const mindMapsRef = collection(db, `users/${props.userId}/mindmaps`);
        const q = query(mindMapsRef, orderBy("timestamp", "desc"));
        
        onSnapshot(q, (snapshot) => {
          savedMindMaps.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }, (error) => {
          console.error("Error loading mind maps:", error);
        });
      } catch (error) {
        console.error("Error setting up mind maps listener:", error);
      }
    };

    // Create a new mind map
    const createMindMap = async () => {
      if (!mindMapTopic.value.trim() || !props.userId || isCreating.value) return;
      
      try {
        isCreating.value = true;
        
        const newMindMap = {
          name: mindMapTopic.value.trim(),
          timestamp: Date.now(),
          createdBy: props.userId,
          nodes: [] // Will be populated when deployed
        };
        
        const mindMapsRef = collection(db, `users/${props.userId}/mindmaps`);
        await addDoc(mindMapsRef, newMindMap);
        
        props.showToastNotification("Mind map created successfully", "success");
        showCreateMindMapModal.value = false;
      } catch (error) {
        console.error("Error creating mind map:", error);
        props.showToastNotification("Failed to create mind map", "error");
      } finally {
        isCreating.value = false;
      }
    };

    // Delete a mind map
    const deleteMindMap = async (mindMapId) => {
      if (!props.userId || !mindMapId) return;
      
      try {
        await deleteDoc(doc(db, `users/${props.userId}/mindmaps/${mindMapId}`));
        props.showToastNotification("Mind map deleted", "success");
      } catch (error) {
        console.error("Error deleting mind map:", error);
        props.showToastNotification("Failed to delete mind map", "error");
      }
    };

    // Deploy mind map visualization
    const deployMindMap = async (mindMap) => {
      if (!mindMap) return;
      
      currentMindMap.value = mindMap;
      showDeployMindMapModal.value = true;
      isDeploying.value = true;
      
      try {
        // Generate mind map nodes based on topic using OpenAI API
        const generatedNodes = await generateMindMapNodes(mindMap.name);
        
        // Update mind map nodes in Firebase
        const mindMapRef = doc(db, `users/${props.userId}/mindmaps/${mindMap.id}`);
        await updateDoc(mindMapRef, { nodes: generatedNodes });
        
        // Update current mind map with generated nodes
        currentMindMap.value = {
          ...mindMap,
          nodes: generatedNodes
        };
        
        // Render the mind map visualization
        nextTick(() => {
          renderMindMap(generatedNodes);
          isDeploying.value = false;
        });
      } catch (error) {
        console.error("Error deploying mind map:", error);
        
        // Fallback to static nodes if API fails
        const staticNodes = generateStaticNodes(mindMap.name);
        renderMindMap(staticNodes);
        isDeploying.value = false;
        
        props.showToastNotification("Using static mind map due to API error", "info");
      }
    };

    // Generate mind map nodes dynamically using OpenAI API
    const generateMindMapNodes = async (topic) => {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${props.apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a mind mapping expert. Generate a mind map structure for the given topic. Return JSON only without any explanation."
              },
              {
                role: "user",
                content: `Create a mind map for the topic "${topic}". Generate 5-7 main branches/subtopics. Return a JSON array of nodes, where each node has id, name, and parentId (null for the center node). The center node should have id "center" and name equal to the topic.`
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Extract JSON array from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // Fallback: try to parse the whole content as JSON
        return JSON.parse(content);
      } catch (error) {
        console.error("Error generating mind map nodes:", error);
        throw error;
      }
    };

    // Generate static mind map nodes as fallback
    const generateStaticNodes = (topic) => {
      return [
        { id: "center", name: topic, parentId: null },
        { id: "1", name: "Overview", parentId: "center" },
        { id: "2", name: "Extension", parentId: "center" },
        { id: "3", name: "Application", parentId: "center" },
        { id: "4", name: "More About", parentId: "center" },
        { id: "5", name: "History", parentId: "center" }
      ];
    };

    // Render the mind map visualization using D3.js
    const renderMindMap = (nodes) => {
      if (!mindMapContainer.value) return;
      
      const container = d3.select(mindMapContainer.value);
      container.selectAll("*").remove();
      
      const width = mindMapContainer.value.clientWidth;
      const height = mindMapContainer.value.clientHeight || 400;
      
      const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
        
      const g = svg.append("g")
        .attr("transform", `translate(${width/2},${height/2})`);
      
      // Create a hierarchical data structure
      const stratify = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.parentId);
      
      const root = stratify(nodes);
      
      // Create a radial layout
      const radius = Math.min(width, height) / 2 - 80;
      
      const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
      
      tree(root);
      
      // Add links
      const link = g.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkRadial()
          .angle(d => d.x)
          .radius(d => d.y))
        .style("fill", "none")
        .style("stroke", "#60a5fa")
        .style("stroke-width", 1.5)
        .style("opacity", 0.7);
      
      // Add nodes
      const node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `
          translate(${d.y * Math.sin(d.x)},${-d.y * Math.cos(d.x)})
        `)
        .on("click", (event, d) => {
          if (d.id !== "center") {
            selectedBranch.value = d.data.name;
            showSelectChatModal.value = true;
          }
        });
      
      // Add circles to nodes
      node.append("circle")
        .attr("r", d => d.id === "center" ? 40 : 25)
        .style("fill", d => d.id === "center" ? "#4f46e5" : "#60a5fa")
        .style("cursor", "pointer")
        .style("filter", "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.2))");
      
      // Add labels to nodes
      node.append("text")
        .attr("dy", "0.31em")
        .attr("text-anchor", "middle")
        .text(d => d.data.name)
        .style("font-size", d => d.id === "center" ? "14px" : "12px")
        .style("fill", "white")
        .style("pointer-events", "none")
        .style("font-weight", d => d.id === "center" ? "bold" : "normal")
        .each(function(d) {
          const text = d3.select(this);
          const words = d.data.name.split(/\s+/);
          
          if (words.length > 2) {
            text.text("");
            
            // First line
            text.append("tspan")
              .attr("x", 0)
              .attr("dy", "-0.2em")
              .text(words.slice(0, Math.ceil(words.length/2)).join(" "));
            
            // Second line
            text.append("tspan")
              .attr("x", 0)
              .attr("dy", "1.2em")
              .text(words.slice(Math.ceil(words.length/2)).join(" "));
          }
        });
      
      // Add tooltip hover effect
      node.append("title")
        .text(d => d.id === "center" ? d.data.name : `Click to explore: ${d.data.name}`);
    };

    // Explore a branch in a specific chat
    const exploreBranchInChat = (chatId) => {
      if (!currentMindMap.value || !selectedBranch.value || !chatId) return;
      
      props.loadChat(chatId);
      
      const message = `Mind Map - ${currentMindMap.value.name}, Branch - ${selectedBranch.value}`;
      props.sendMessage(message);
      
      showSelectChatModal.value = false;
      showDeployMindMapModal.value = false;
    };

    onMounted(() => {
      loadSavedMindMaps();
    });

    return {
      mindMapTopic,
      showCreateMindMapModal,
      showDeployMindMapModal,
      showSelectChatModal,
      savedMindMaps,
      currentMindMap,
      selectedBranch,
      mindMapInput,
      isCreating,
      isDeploying,
      mindMapContainer,
      displayedPrompt,
      createMindMap,
      deleteMindMap,
      deployMindMap,
      exploreBranchInChat
    };
  }
};
</script>

<style scoped>
.mind-map-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s ease;
  margin-left: 10px;
}

.mind-map-button:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.mind-map-modal {
  background: #1a1f35;
  border-radius: 8px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  color: white;
  animation: slideIn 0.3s ease;
  overflow: hidden;
}

.mind-map-modal.large-modal {
  width: 800px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
  overflow-y: auto;
}

.typing-text {
  color: var(--text-secondary);
  min-height: 24px;
}

.mind-map-modal input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(15, 23, 42, 0.7);
  color: white;
  font-size: 14px;
}

.mind-map-modal input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.2);
}

.chat-selection-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 10px;
}

.chat-selection-item {
  padding: 10px 12px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-selection-item:hover {
  background: rgba(79, 70, 229, 0.15);
  border-color: rgba(79, 70, 229, 0.3);
}

.mind-map-visualization {
  height: 500px;
  max-height: 60vh;
  width: 100%;
  background-color: rgba(15, 23, 42, 0.3);
  border-radius: 6px;
  overflow: hidden;
}

.deploying-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  height: 300px;
}

.deploying-animation {
  width: 80px;
  height: 80px;
  position: relative;
}

.orbit {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(79, 70, 229, 0.3);
  border-radius: 50%;
  animation: rotate 2s linear infinite;
}

.planet {
  width: 20px;
  height: 20px;
  background-color: var(--primary);
  border-radius: 50%;
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
}

.deploying-text {
  font-size: 16px;
  color: var(--text-secondary);
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.saved-mind-maps {
  margin-bottom: 10px;
}

.mind-maps-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 14px;
}

.mind-maps-list {
  padding: 0 10px;
}

.mind-map-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 5px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 2px solid transparent;
}

.mind-map-entry:hover {
  background: rgba(79, 70, 229, 0.08);
  border-left-color: rgba(79, 70, 229, 0.5);
}

.mind-map-name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mind-map-actions {
  display: flex;
  gap: 5px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.mind-map-entry:hover .mind-map-actions {
  opacity: 1;
}

.deploy-button,
.delete-mind-map-button {
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

.deploy-button:hover {
  background: rgba(79, 70, 229, 0.2);
  color: var(--primary);
}

.delete-mind-map-button:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

@media (max-width: 768px) {
  .mind-map-button span {
    display: none;
  }
  
  .mind-map-modal {
    width: 95vw;
  }
  
  .mind-map-visualization {
    height: 400px;
  }
}
</style>