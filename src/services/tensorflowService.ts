// Dynamic import to avoid server-side loading issues
let tf: typeof import('@tensorflow/tfjs') | null = null;

const loadTensorFlow = async () => {
  if (!tf) {
    // Only load TensorFlow.js when actually needed
    if (typeof window !== 'undefined') {
      // Client-side
      tf = await import('@tensorflow/tfjs');
    } else {
      // Server-side
      tf = await import('@tensorflow/tfjs');
    }
  }
  return tf;
};

export interface PixelClassificationResult {
  lightPercentage: number;
  shadowPercentage: number;
  processedImageData: string; // Base64 encoded image
  classificationMap: number[][];
}

export class TensorFlowService {
  private model: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private isModelLoaded = false;
  private isInitializing = false;
  private isTraining = false;

  /**
   * Initialize TensorFlow.js
   */
  async initialize(): Promise<void> {
    if (this.isInitializing) {
      console.log('⏳ TensorFlow.js already initializing, waiting...');
      return;
    }

    try {
      this.isInitializing = true;
      
      // Load TensorFlow.js dynamically
      const tensorflow = await loadTensorFlow();
      
      // Set backend to CPU for Vercel compatibility and speed
      await tensorflow.setBackend('cpu');
      await tensorflow.ready();
      
      // Optimize for Vercel: disable memory growth
      tensorflow.env().set('WEBGL_PACK', false);
      tensorflow.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
      
      console.log('✅ TensorFlow.js initialized (Vercel optimized)');
    } catch (error) {
      console.error('❌ Error initializing TensorFlow.js:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Create and train a simple model for pixel classification
   */
  async createModel(): Promise<void> {
    if (this.model && this.isModelLoaded) {
      return;
    }

    try {
      const tensorflow = await loadTensorFlow();
      
      // Clear any existing variables
      tensorflow.disposeVariables();

      // Create a simple sequential model
      // Create multi-feature model for better precision (efficient for Vercel)
      this.model = tensorflow.sequential({
        layers: [
          // Input layer - multiple features
          tensorflow.layers.dense({
            inputShape: [6], // RGB + brightness + contrast + edge_strength
            units: 16, // Increased for better learning
            activation: 'relu',
            name: 'input'
          }),
          
          // Hidden layer for better precision
          tensorflow.layers.dropout({ rate: 0.1 }), // Light dropout
          tensorflow.layers.dense({
            units: 8,
            activation: 'relu',
            name: 'hidden'
          }),
          
          // Output layer
          tensorflow.layers.dense({
            units: 2, // 2 classes: light (0) and shadow (1)
            activation: 'softmax',
            name: 'output'
          })
        ]
      });

      // Compile the model
      this.model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      this.isModelLoaded = true;
      console.log('✅ Model created successfully');
    } catch (error) {
      console.error('❌ Error creating model:', error);
      throw error;
    }
  }

  /**
   * Initialize super-efficient heuristic model (no training needed)
   */
  async trainModel(): Promise<void> {
    if (this.isTraining) {
      console.log('⏳ Model already initializing, waiting...');
      return;
    }

    try {
      this.isTraining = true;
      console.log('🚀 Initializing super-efficient heuristic model...');

      // No training needed for heuristic model
      // Just mark as ready
      this.isModelLoaded = true;
      console.log('✅ Super-efficient heuristic model ready (no training needed)');
    } catch (error) {
      console.error('❌ Error initializing heuristic model:', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Classify image using super-efficient heuristic analysis
   */
  async classifyImagePixels(imageData: ImageData): Promise<PixelClassificationResult> {
    try {
      if (!this.isModelLoaded) {
        throw new Error('Model not ready. Please initialize first.');
      }

      const { data, width, height } = imageData;
      const classificationMap: number[][] = [];
      let lightPixels = 0;
      let shadowPixels = 0;

      console.log(`🔍 Processing image: ${width}x${height} pixels with super-efficient heuristic`);

      // Initialize classification map
      for (let y = 0; y < height; y++) {
        classificationMap[y] = [];
      }

      // Process image in regions (20x20 pixel blocks) for maximum efficiency
      const regionSize = 20; // Larger regions for speed
      
      for (let y = 0; y < height - regionSize; y += regionSize) {
        for (let x = 0; x < width - regionSize; x += regionSize) {
          // Calculate multiple criteria for this region
          let totalR = 0, totalG = 0, totalB = 0;
          let pixelCount = 0;
          let minBrightness = 255;
          let maxBrightness = 0;

          // Collect pixel data efficiently
          for (let dy = 0; dy < regionSize; dy++) {
            for (let dx = 0; dx < regionSize; dx++) {
              const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
              const r = data[pixelIndex];
              const g = data[pixelIndex + 1];
              const b = data[pixelIndex + 2];
              
              totalR += r;
              totalG += g;
              totalB += b;
              pixelCount++;
              
              // Track brightness range for contrast
              const brightness = (r + g + b) / 3;
              minBrightness = Math.min(minBrightness, brightness);
              maxBrightness = Math.max(maxBrightness, brightness);
            }
          }

          // Calculate features
          const avgR = totalR / pixelCount;
          const avgG = totalG / pixelCount;
          const avgB = totalB / pixelCount;
          const avgBrightness = (avgR + avgG + avgB) / 3;
          const contrast = (maxBrightness - minBrightness) / 255;
          
          // Advanced heuristic classification with multiple criteria
          let lightScore = 0;
          
          // Criterion 1: Brightness (40% weight)
          if (avgBrightness > 180) lightScore += 40;
          else if (avgBrightness > 120) lightScore += 20;
          else if (avgBrightness > 80) lightScore += 10;
          
          // Criterion 2: Color balance (30% weight)
          const colorBalance = Math.min(avgR, avgG, avgB) / Math.max(avgR, avgG, avgB);
          if (colorBalance > 0.8) lightScore += 30; // Balanced colors (light)
          else if (colorBalance > 0.6) lightScore += 15;
          
          // Criterion 3: Contrast (20% weight)
          if (contrast > 0.3) lightScore += 20; // High contrast (light areas)
          else if (contrast > 0.15) lightScore += 10;
          
          // Criterion 4: Color intensity (10% weight)
          const maxColor = Math.max(avgR, avgG, avgB);
          if (maxColor > 200) lightScore += 10; // High color intensity
          else if (maxColor > 150) lightScore += 5;
          
          // Determine classification (threshold: 50 points)
          const classification = lightScore >= 50 ? 0 : 1; // 0 = light, 1 = shadow
          
          // Apply classification to entire region
          for (let dy = 0; dy < regionSize; dy++) {
            for (let dx = 0; dx < regionSize; dx++) {
              const pixelY = y + dy;
              const pixelX = x + dx;
              if (pixelY < height && pixelX < width) {
                classificationMap[pixelY][pixelX] = classification;
                if (classification === 0) {
                  lightPixels++;
                } else {
                  shadowPixels++;
                }
              }
            }
          }
        }
      }

      const totalPixels = lightPixels + shadowPixels;
      const lightPercentage = (lightPixels / totalPixels) * 100;
      const shadowPercentage = (shadowPixels / totalPixels) * 100;

      // Create processed image
      const processedImageData = this.createProcessedImage(imageData, classificationMap);

      return {
        lightPercentage,
        shadowPercentage,
        processedImageData,
        classificationMap
      };
    } catch (error) {
      console.error('❌ Error classifying pixels:', error);
      throw error;
    }
  }

  /**
   * Create processed image with classification colors
   */
  private createProcessedImage(imageData: ImageData, classificationMap: number[][]): string {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return this.createProcessedImageBrowser(imageData, classificationMap);
    } else {
      return this.createProcessedImageNode(imageData, classificationMap);
    }
  }

  /**
   * Create processed image in browser environment
   */
  private createProcessedImageBrowser(imageData: ImageData, classificationMap: number[][]): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = imageData.width;
      canvas.height = imageData.height;

      const processedImageData = ctx.createImageData(imageData.width, imageData.height);

      // Apply classification colors
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const pixelIndex = (y * imageData.width + x) * 4;
          const classification = classificationMap[y]?.[x] || 0;
          
          if (classification === 1) {
            // Light area - green
            processedImageData.data[pixelIndex] = 0;     // R
            processedImageData.data[pixelIndex + 1] = 255; // G
            processedImageData.data[pixelIndex + 2] = 0;   // B
            processedImageData.data[pixelIndex + 3] = 255; // A
          } else {
            // Shadow area - blue
            processedImageData.data[pixelIndex] = 0;     // R
            processedImageData.data[pixelIndex + 1] = 0;   // G
            processedImageData.data[pixelIndex + 2] = 255; // B
            processedImageData.data[pixelIndex + 3] = 255; // A
          }
        }
      }

      ctx.putImageData(processedImageData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('❌ Error creating processed image in browser:', error);
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Create processed image in Node.js environment
   */
  private createProcessedImageNode(imageData: ImageData, classificationMap: number[][]): string {
    try {
      // Import canvas dynamically for Node.js
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createCanvas } = require('canvas');
      
      const canvas = createCanvas(imageData.width, imageData.height);
      const ctx = canvas.getContext('2d');
      
      // Create image data for the processed image
      const processedImageData = ctx.createImageData(imageData.width, imageData.height);
      
      // Apply classification colors
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const pixelIndex = (y * imageData.width + x) * 4;
          const classification = classificationMap[y]?.[x] || 0;
          
          if (classification === 1) {
            // Light area - green
            processedImageData.data[pixelIndex] = 0;     // R
            processedImageData.data[pixelIndex + 1] = 255; // G
            processedImageData.data[pixelIndex + 2] = 0;   // B
            processedImageData.data[pixelIndex + 3] = 255; // A
          } else {
            // Shadow area - blue
            processedImageData.data[pixelIndex] = 0;     // R
            processedImageData.data[pixelIndex + 1] = 0;   // G
            processedImageData.data[pixelIndex + 2] = 255; // B
            processedImageData.data[pixelIndex + 3] = 255; // A
          }
        }
      }
      
      // Put the processed image data on canvas
      ctx.putImageData(processedImageData, 0, 0);
      
      // Convert to base64
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('❌ Error creating processed image in Node.js:', error);
      // Return a simple placeholder if canvas fails
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return this.isModelLoaded && !this.isInitializing && !this.isTraining;
  }

  /**
   * Get model status
   */
  getStatus(): { initialized: boolean; modelLoaded: boolean; training: boolean } {
    return {
      initialized: !this.isInitializing,
      modelLoaded: this.isModelLoaded,
      training: this.isTraining
    };
  }
}

// Export a singleton instance
export const tensorFlowService = new TensorFlowService();