<!-- src/components/MemoryBank.vue -->
<template>
  <div class="memory-bank-container">
    <!-- Memory Bank Button in Sidebar -->
    <button @click="toggleMemoryBank" class="memory-bank-btn">
      <div class="memory-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </div>
      <span>Memory Bank</span>
    </button>
    
    <!-- Memory Bank Modal -->
    <div v-if="showMemoryBank" class="modal-overlay">
      <div class="memory-bank-modal">
        <div class="modal-header">
          <h3>🧠 Dawntasy Neural Memory System</h3>
          <button class="modal-close-btn" @click="showMemoryBank = false">&times;</button>
        </div>
        
        <div class="memory-bank-content">
          <!-- Memory Type Tabs -->
          <div class="memory-tabs">
            <button 
              v-for="(label, type) in tabLabels" 
              :key="type"
              @click="activeTab = type"
              :class="{ active: activeTab === type }"
              class="memory-tab-btn"
            >
              {{ label }}
            </button>
          </div>
          
          <!-- Search Box -->
          <div class="memory-search">
            <input 
              v-model="searchTerm" 
              placeholder="Search memories..." 
              @input="filterMemories"
            />
          </div>
          
          <!-- Memories List -->
          <div class="memories-list">
            <div v-if="loading" class="loading-indicator">
              <div class="spinner"></div>
              <span>Loading neural memories...</span>
            </div>
            
            <div v-else-if="filteredMemories.length === 0" class="no-memories">
              <p v-if="searchTerm">No memories match your search</p>
              <p v-else>No {{ tabLabels[activeTab].toLowerCase() }} memories formed yet.</p>
              <p class="no-memories-tip">Memories form naturally as you interact with the AI.</p>
            </div>
            
            <div v-else>
              <div 
                v-for="memory in filteredMemories" 
                :key="memory.id"
                class="memory-item"
                :class="`memory-${memory.type}`"
              >
                <div class="memory-header">
                  <span class="memory-type-badge" :class="`badge-${memory.type}`">
                    {{ getMemoryTypeLabel(memory.type) }}
                  </span>
                  <span v-if="memory.category" class="memory-category">
                    {{ formatCategory(memory.category) }}
                  </span>
                </div>
                
                <div class="memory-content">
                  <!-- Original Content -->
                  <div class="memory-original">
                    <div class="memory-label">Original Statement:</div>
                    <div class="memory-text">{{ memory.content }}</div>
                  </div>
                  
                  <!-- AI Interpretation -->
                  <div class="memory-interpretation" v-if="memory.interpretation">
                    <div class="memory-label">AI Understanding:</div>
                    <div class="memory-interpreted-text">{{ memory.interpretation }}</div>
                  </div>
                  
                  <div class="memory-meta">
                    <span class="memory-time">{{ formatTime(memory.timestamp) }}</span>
                    <span class="memory-source">{{ memory.source === 'user' ? 'From User' : 'From AI' }}</span>
                    <span class="memory-importance" :style="`--importance: ${memory.importance || 5}`">
                      Priority: {{ memory.importance || 5 }}/10
                    </span>
                    <span v-if="memory.confidence" class="memory-confidence">
                      Confidence: {{ Math.round(memory.confidence * 100) }}%
                    </span>
                  </div>
                </div>
                
                <div class="memory-actions">
                  <button @click="deleteMemory(memory.id)" class="memory-delete-btn" title="Delete Memory">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"></path>
                    </svg>
                  </button>
                  <button @click="editMemory(memory)" class="memory-edit-btn" title="Edit Memory">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button @click="boostMemory(memory)" class="memory-boost-btn" title="Boost Importance">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M5 15l7-7 7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Memory Edit Dialog -->
        <div v-if="editingMemory" class="memory-edit-dialog">
          <div class="edit-dialog-content">
            <h4>Edit Neural Memory</h4>
            
            <div class="edit-field">
              <label>Original Content:</label>
              <textarea v-model="editingMemory.content"></textarea>
            </div>
            
            <div class="edit-field">
              <label>AI Interpretation:</label>
              <textarea v-model="editingMemory.interpretation"></textarea>
            </div>
            
            <div class="edit-memory-type">
              <label>Memory Type:</label>
              <select v-model="editingMemory.type">
                <option v-for="(label, type) in memoryTypes" :key="type" :value="type">
                  {{ label }}
                </option>
              </select>
            </div>
            
            <div class="edit-memory-importance">
              <label>Importance (1-10):</label>
              <input type="range" min="1" max="10" v-model.number="editingMemory.importance">
              <span>{{ editingMemory.importance }}</span>
            </div>
            
            <div class="edit-dialog-actions">
              <button @click="saveEditedMemory" class="save-btn">Save Changes</button>
              <button @click="cancelEdit" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import enhancedMemoryService from '../services/enhancedMemoryService';
import { format } from 'date-fns';

export default {
  name: 'MemoryBank',
  
  setup() {
    const showMemoryBank = ref(false);
    const memories = ref([]);
    const filteredMemories = ref([]);
    const loading = ref(false);
    const searchTerm = ref('');
    const activeTab = ref('all');
    const editingMemory = ref(null);
    
    const memoryTypes = {
      'semantic': 'Semantic Memory',
      'episodic': 'Episodic Memory',
      'procedural': 'Procedural Memory',
      'working': 'Working Memory',
      'emotional': 'Emotional Memory',
      'prospective': 'Prospective Memory'
    };
    
    const tabLabels = {
      'all': '🧠 All Memories',
      'semantic': '📚 Semantic',
      'episodic': '📅 Episodic',
      'emotional': '❤️ Emotional',
      'prospective': '⏰ Prospective',
      'working': '💭 Working'
    };
    
    // Load memories
    const loadMemories = async () => {
      loading.value = true;
      try {
        memories.value = await enhancedMemoryService.getAllMemories();
        filterMemories();
      } catch (error) {
        console.error('Error loading memories:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Filter memories based on search term and active tab
    const filterMemories = () => {
      filteredMemories.value = memories.value.filter(memory => {
        // Match search term
        const searchContent = [
          memory.content,
          memory.interpretation,
          memory.category,
          memory.emotion
        ].filter(Boolean).join(' ').toLowerCase();
        
        const matchesSearch = searchTerm.value === '' || 
          searchContent.includes(searchTerm.value.toLowerCase());
        
        // Match active tab
        const matchesTab = activeTab.value === 'all' || memory.type === activeTab.value;
        
        return matchesSearch && matchesTab;
      });
      
      // Sort by timestamp (newest first) and then by importance
      filteredMemories.value.sort((a, b) => {
        if (b.importance !== a.importance) {
          return b.importance - a.importance;
        }
        return b.timestamp - a.timestamp;
      });
    };
    
    // Format timestamp
    const formatTime = (timestamp) => {
      if (!timestamp) return 'Unknown time';
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a');
    };
    
    // Get memory type label
    const getMemoryTypeLabel = (type) => {
      return memoryTypes[type] || 'Unknown Type';
    };
    
    // Format category with nice capitalization
    const formatCategory = (category) => {
      if (!category) return '';
      return category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    // Toggle memory bank visibility
    const toggleMemoryBank = () => {
      showMemoryBank.value = !showMemoryBank.value;
      if (showMemoryBank.value) {
        loadMemories();
      }
    };
    
    // Delete a memory
    const deleteMemory = async (memoryId) => {
      if (confirm('Are you sure you want to delete this memory?')) {
        try {
          await enhancedMemoryService.deleteMemory(memoryId);
          memories.value = memories.value.filter(m => m.id !== memoryId);
          filterMemories();
        } catch (error) {
          console.error('Error deleting memory:', error);
        }
      }
    };
    
    // Edit a memory
    const editMemory = (memory) => {
      editingMemory.value = { ...memory };
    };
    
    // Save edited memory
    const saveEditedMemory = async () => {
      try {
        // Update memory in Firebase
        await enhancedMemoryService.updateMemory(editingMemory.value.id, {
          content: editingMemory.value.content,
          interpretation: editingMemory.value.interpretation,
          type: editingMemory.value.type,
          importance: editingMemory.value.importance,
          lastModified: Date.now()
        });
        
        // Update local memory array
        const index = memories.value.findIndex(m => m.id === editingMemory.value.id);
        if (index !== -1) {
          memories.value[index] = { ...memories.value[index], ...editingMemory.value };
        }
        
        filterMemories();
        cancelEdit();
      } catch (error) {
        console.error('Error saving edited memory:', error);
      }
    };
    
    // Boost memory importance
    const boostMemory = async (memory) => {
      if (memory.importance >= 10) return;
      
      try {
        const newImportance = Math.min(10, (memory.importance || 5) + 1);
        
        // Update in Firebase
        await enhancedMemoryService.updateMemory(memory.id, {
          importance: newImportance
        });
        
        // Update local memory
        memory.importance = newImportance;
        
        // Re-sort the list
        filterMemories();
      } catch (error) {
        console.error('Error boosting memory:', error);
      }
    };
    
    // Cancel edit
    const cancelEdit = () => {
      editingMemory.value = null;
    };
    
    // Watch for tab changes
    watch(activeTab, () => {
      filterMemories();
    });
    
    return {
      showMemoryBank,
      memories,
      filteredMemories,
      loading,
      searchTerm,
      activeTab,
      tabLabels,
      memoryTypes,
      editingMemory,
      toggleMemoryBank,
      loadMemories,
      filterMemories,
      formatTime,
      getMemoryTypeLabel,
      formatCategory,
      deleteMemory,
      editMemory,
      saveEditedMemory,
      cancelEdit,
      boostMemory
    };
  }
}
</script>

<style scoped>
/* Keeping the main styles from before but enhancing for the new UI */
.memory-bank-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(to right, rgba(79, 70, 229, 0.1), rgba(79, 70, 229, 0.2));
  color: white;
  border: 1px solid rgba(79, 70, 229, 0.4);
  padding: 10px 16px;
  border-radius: 6px;
  width: calc(100% - 24px);
  margin: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.memory-bank-btn:hover {
  background: linear-gradient(to right, rgba(79, 70, 229, 0.15), rgba(79, 70, 229, 0.25));
  border-color: rgba(79, 70, 229, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.memory-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(79, 70, 229, 1);
}

.memory-bank-modal {
  background: #1a1f35;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  color: white;
  width: 800px;
  max-width: 90%;
  max-height: 90vh;
  animation: slideIn 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(79, 70, 229, 0.3);
}

.memory-bank-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memory-tabs {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}

.memory-tab-btn {
  padding: 8px 16px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-weight: 500;
}

.memory-tab-btn.active {
  background: rgba(79, 70, 229, 0.15);
  color: white;
  border-color: rgba(79, 70, 229, 0.5);
  box-shadow: 0 0 10px rgba(79, 70, 229, 0.2);
}

.memory-tab-btn:hover:not(.active) {
  background: rgba(15, 23, 42, 0.7);
}

.memory-search {
  width: 100%;
}

.memory-search input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  font-size: 14px;
}

.memory-search input:focus {
  outline: none;
  border-color: rgba(79, 70, 229, 0.5);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.memories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.memory-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 8px;
  border-left: 6px solid transparent;
  background: rgba(15, 23, 42, 0.5);
  transition: all 0.2s ease;
  position: relative;
}

.memory-item:hover {
  background: rgba(15, 23, 42, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.memory-semantic {
  border-left-color: #3b82f6; /* Blue */
}

.memory-episodic {
  border-left-color: #8b5cf6; /* Purple */
}

.memory-procedural {
  border-left-color: #f59e0b; /* Amber */
}

.memory-working {
  border-left-color: #10b981; /* Green */
}

.memory-emotional {
  border-left-color: #ec4899; /* Pink */
}

.memory-prospective {
  border-left-color: #6366f1; /* Indigo */
}

.memory-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.memory-type-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-semantic {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.badge-episodic {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
}

.badge-procedural {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.badge-working {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.badge-emotional {
  background: rgba(236, 72, 153, 0.2);
  color: #ec4899;
}

.badge-prospective {
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
}

.memory-category {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.memory-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memory-original, .memory-interpretation {
  background: rgba(15, 23, 42, 0.3);
  border-radius: 6px;
  padding: 10px;
}

.memory-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
}

.memory-text {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.memory-interpreted-text {
  font-size: 14px;
  line-height: 1.5;
  color: #a5b4fc;
  font-weight: 500;
  word-break: break-word;
}

.memory-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.memory-time, .memory-source {
  color: var(--text-secondary);
}

.memory-importance {
  --color: hsl(calc(120 * var(--importance) / 10), 70%, 65%);
  color: var(--color);
  font-weight: 500;
}

.memory-confidence {
  color: #a5b4fc;
}

.memory-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
}

.memory-delete-btn, .memory-edit-btn, .memory-boost-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.memory-delete-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.memory-edit-btn:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.memory-boost-btn:hover {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
  background: rgba(15, 23, 42, 0.3);
  border-radius: 8px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(79, 70, 229, 0.3);
  border-radius: 50%;
  border-top-color: var(--primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-memories {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
  background: rgba(15, 23, 42, 0.3);
  border-radius: 8px;
}

.no-memories-tip {
  font-size: 13px;
  opacity: 0.7;
  font-style: italic;
  margin-top: 10px;
}

.memory-edit-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.edit-dialog-content {
  background: #1a1f35;
  border-radius: 12px;
  padding: 24px;
  width: 600px;
  max-width: 95%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(79, 70, 229, 0.3);
}

.edit-dialog-content h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #a5b4fc;
}

.edit-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-field label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.edit-dialog-content textarea {
  width: 100%;
  height: 80px;
  padding: 10px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  resize: vertical;
  font-size: 14px;
}

.edit-dialog-content textarea:focus {
  outline: none;
  border-color: rgba(79, 70, 229, 0.5);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.edit-memory-type, .edit-memory-importance {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-memory-type select {
  flex: 1;
  padding: 8px 12px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  font-size: 14px;
}

.edit-memory-importance input {
  flex: 1;
}

.edit-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}

.save-btn, .cancel-btn {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-btn {
  background: var(--primary);
  color: white;
  border: none;
}

.save-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.cancel-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

@media (max-width: 768px) {
  .memory-bank-modal {
    width: 95%;
    height: 80vh;
  }
  
  .memory-tabs {
    padding-bottom: 10px;
  }
  
  .memory-tab-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .memory-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>