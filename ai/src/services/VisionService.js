// src/services/VisionService.js

import OpenAIService from './OpenAIService';

/**
 * Service to handle OCR and image analysis using GPT-4o Vision
 */
class VisionService {
  constructor() {
    this.openAIService = OpenAIService;
  }

  /**
   * Process an image using GPT-4o Vision capabilities
   * @param {File|Blob} imageFile - The image file to analyze
   * @param {string} prompt - Optional specific instruction for the analysis
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeImage(imageFile, prompt = "Analyze this image in detail. If there's text, extract it using OCR.") {
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Remove the data URL prefix if present
      const base64Content = base64Image.includes('base64,') 
        ? base64Image.split('base64,')[1] 
        : base64Image;
      
      // Process the image with GPT-4o vision
      const response = await this.openAIService.processImageWithVision(
        base64Content,
        prompt
      );
      
      return {
        success: true,
        analysis: response.choices[0].message.content,
        fullResponse: response
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      return {
        success: false,
        error: error.message || 'Failed to analyze image'
      };
    }
  }

  /**
   * Process multiple images in a batch
   * @param {Array<File|Blob>} imageFiles - Array of image files
   * @param {string} prompt - Optional prompt for analysis
   * @returns {Promise<Array>} Array of analysis results
   */
  async batchAnalyzeImages(imageFiles, prompt) {
    const results = [];
    
    for (const imageFile of imageFiles) {
      const result = await this.analyzeImage(imageFile, prompt);
      results.push({
        fileName: imageFile.name,
        ...result
      });
    }
    
    return results;
  }

  /**
   * Extract text from an image using OCR capabilities
   * @param {File|Blob} imageFile - The image file to extract text from
   * @returns {Promise<Object>} Extracted text
   */
  async extractTextFromImage(imageFile) {
    return this.analyzeImage(
      imageFile, 
      "Extract all text from this image using OCR. Return only the extracted text, formatted exactly as it appears."
    );
  }

  /**
   * Convert a file to base64 encoding
   * @param {File|Blob} file - The file to convert
   * @returns {Promise<string>} Base64 encoded file
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
  
  /**
   * Determine if a file is an image
   * @param {File|Blob} file - The file to check
   * @returns {boolean} Whether the file is an image
   */
  isImageFile(file) {
    return file.type.startsWith('image/');
  }
}

export default new VisionService();