<template>
    <div class="file-upload-component">
      <!-- File Upload Button -->
      <button class="upload-button" @click="triggerFileInput" :disabled="disabled">
        <i class="fas fa-plus"></i>
      </button>
      
      <!-- Hidden File Input -->
      <input 
        type="file"
        ref="fileInput"
        @change="handleFileChange"
        multiple
        class="hidden-input"
      />
      
      <!-- File Preview Area (visible when files are selected) -->
      <div v-if="files.length > 0" class="files-preview">
        <div v-for="(file, index) in files" :key="index" class="file-item">
          <div class="file-info">
            <!-- File Icon based on type -->
            <div class="file-icon">
              <i v-if="isImageFile(file.name)" class="fas fa-image"></i>
              <i v-else-if="isPdfFile(file.name)" class="fas fa-file-pdf"></i>
              <i v-else-if="isTextFile(file.name)" class="fas fa-file-alt"></i>
              <i v-else-if="isExcelFile(file.name)" class="fas fa-file-excel"></i>
              <i v-else class="fas fa-file"></i>
            </div>
            
            <!-- File Name -->
            <div class="file-name" :title="file.name">
              {{ truncateFileName(file.name) }}
            </div>
            
            <!-- File Size -->
            <div class="file-size">
              {{ formatFileSize(file.size) }}
            </div>
          </div>
          
          <!-- Remove Button -->
          <button @click="removeFile(index)" class="remove-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'FileUploadComponent',
    
    props: {
      disabled: {
        type: Boolean,
        default: false
      },
      maxFiles: {
        type: Number,
        default: 5
      },
      maxFileSize: {
        type: Number,
        default: 10 * 1024 * 1024 // 10MB
      },
      allowedFileTypes: {
        type: Array,
        default: () => ['image/*', 'application/pdf', 'text/*', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
      }
    },
    
    data() {
      return {
        files: []
      };
    },
    
    methods: {
      triggerFileInput() {
        this.$refs.fileInput.click();
      },
      
      handleFileChange(event) {
        const selectedFiles = Array.from(event.target.files);
        
        if (selectedFiles.length === 0) return;
        
        // Check if adding these files would exceed the max files limit
        if (this.files.length + selectedFiles.length > this.maxFiles) {
          this.$emit('error', `You can only upload a maximum of ${this.maxFiles} files.`);
          event.target.value = '';
          return;
        }
        
        // Process each file
        const validFiles = [];
        const invalidFiles = [];
        
        selectedFiles.forEach(file => {
          // Check file size
          if (file.size > this.maxFileSize) {
            invalidFiles.push({
              name: file.name,
              reason: `File size exceeds the maximum limit of ${this.formatFileSize(this.maxFileSize)}.`
            });
            return;
          }
          
          // Check file type
          const fileType = file.type;
          let isValidType = false;
          
          for (const allowedType of this.allowedFileTypes) {
            if (allowedType.endsWith('/*')) {
              // Handle wildcard types (e.g., 'image/*')
              const generalType = allowedType.split('/')[0];
              if (fileType.startsWith(`${generalType}/`)) {
                isValidType = true;
                break;
              }
            } else if (allowedType === fileType) {
              // Exact match
              isValidType = true;
              break;
            }
          }
          
          if (!isValidType) {
            invalidFiles.push({
              name: file.name,
              reason: 'File type not allowed.'
            });
            return;
          }
          
          // Process valid file
          validFiles.push({
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
        });
        
        // Report errors for invalid files
        if (invalidFiles.length > 0) {
          this.$emit('error', 'Some files could not be uploaded:', invalidFiles);
        }
        
        // Add valid files to the list
        if (validFiles.length > 0) {
          validFiles.forEach(fileData => {
            // Read file as data URL for preview
            const reader = new FileReader();
            reader.onload = (e) => {
              this.files.push({
                ...fileData,
                dataUrl: e.target.result
              });
              
              // Emit update event after all files are processed
              this.$emit('update:files', this.files);
            };
            reader.readAsDataURL(fileData.file);
          });
          
          this.$emit('file-selected', validFiles);
        }
        
        // Reset the input field
        event.target.value = '';
      },
      
      removeFile(index) {
        this.files.splice(index, 1);
        this.$emit('update:files', this.files);
        this.$emit('file-removed', index);
      },
      
      isImageFile(fileName) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
      },
      
      isPdfFile(fileName) {
        return fileName.toLowerCase().endsWith('.pdf');
      },
      
      isTextFile(fileName) {
        const textExtensions = ['.txt', '.md', '.rtf', '.csv', '.json', '.xml', '.html', '.css', '.js'];
        return textExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
      },
      
      isExcelFile(fileName) {
        const excelExtensions = ['.xls', '.xlsx', '.csv'];
        return excelExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
      },
      
      formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      },
      
      truncateFileName(fileName, maxLength = 20) {
        if (fileName.length <= maxLength) return fileName;
        
        const extension = fileName.slice(fileName.lastIndexOf('.'));
        const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
        
        const truncatedName = nameWithoutExt.slice(0, maxLength - 3 - extension.length) + '...';
        return truncatedName + extension;
      },
      
      clearFiles() {
        this.files = [];
        this.$emit('update:files', this.files);
      }
    }
  };
  </script>
  
  <style scoped>
  .file-upload-component {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .upload-button {
    background-color: transparent;
    color: #4682b4; /* Cerulean */
    border: none;
    border-radius: 4px;
    width: 36px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .upload-button:hover {
    background-color: rgba(70, 130, 180, 0.1);
  }
  
  .upload-button:disabled {
    color: #666;
    cursor: not-allowed;
  }
  
  .hidden-input {
    display: none;
  }
  
  .files-preview {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: 10px;
    gap: 8px;
  }
  
  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(70, 130, 180, 0.1);
    border-radius: 4px;
    padding: 8px 12px;
    transition: all 0.2s ease;
  }
  
  .file-item:hover {
    background-color: rgba(70, 130, 180, 0.2);
  }
  
  .file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
  }
  
  .file-icon {
    color: #4682b4; /* Cerulean */
    font-size: 1rem;
    width: 20px;
    text-align: center;
  }
  
  .file-name {
    flex: 1;
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .file-size {
    font-size: 0.8rem;
    color: #666;
    white-space: nowrap;
  }
  
  .remove-button {
    background: none;
    border: none;
    color: #999;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .remove-button:hover {
    color: #ff5252;
    background-color: rgba(255, 82, 82, 0.1);
  }
  </style>