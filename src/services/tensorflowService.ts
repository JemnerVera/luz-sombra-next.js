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
      // Create ultra-simple model for Vercel (maximum efficiency)
      this.model = tensorflow.sequential({
        layers: [
          // Input layer - ultra-simple
          tensorflow.layers.dense({
            inputShape: [3], // RGB values
            units: 8, // Ultra-reduced for speed
            activation: 'relu',
            name: 'input'
          }),
          
          // Output layer - direct connection
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
   * Train the model with minimal data (ultra-optimized for Vercel)
   */
  async trainModel(): Promise<void> {
    if (this.isTraining) {
      console.log('⏳ Model already training, waiting...');
      return;
    }

    try {
      this.isTraining = true;
      const tensorflow = await loadTensorFlow();

      console.log('🚀 Training ultra-optimized model for Vercel...');

      // Generate minimal training data (only 20 samples)
      const features = [];
      const labels = [];

      for (let i = 0; i < 20; i++) {
        const r = Math.random();
        const g = Math.random();
        const b = Math.random();
        
        features.push([r, g, b]);
        
        // Simple heuristic for training
        const brightness = (r + g + b) / 3;
        if (brightness > 0.5) {
          labels.push([1, 0]); // Light
        } else {
          labels.push([0, 1]); // Shadow
        }
      }

      const xs = tensorflow.tensor2d(features);
      const ys = tensorflow.tensor2d(labels);

      // Ultra-fast training: 1 epoch, no validation
      await this.model.fit(xs, ys, {
        epochs: 1, // Single epoch
        batchSize: 20, // Process all data at once
        validationSplit: 0, // No validation (saves time)
        verbose: 0 // No logging
      });

      // Clean up tensors immediately
      xs.dispose();
      ys.dispose();

      this.isModelLoaded = true;
      console.log('✅ Ultra-optimized model trained successfully');
    } catch (error) {
      console.error('❌ Error training model:', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Classify pixels using ultra-optimized TensorFlow.js (batch processing)
   */
  async classifyImagePixels(imageData: ImageData): Promise<PixelClassificationResult> {
    try {
      const tensorflow = await loadTensorFlow();
      
      if (!this.model || !this.isModelLoaded) {
        throw new Error('Model not ready. Please initialize first.');
      }

      const { data, width, height } = imageData;
      const classificationMap: number[][] = [];
      let lightPixels = 0;
      let shadowPixels = 0;

      console.log(`🔍 Processing image: ${width}x${height} pixels with TensorFlow.js`);

      // Process pixels in batches for efficiency
      const batchSize = 1000; // Process 1000 pixels at once
      const totalPixels = width * height;
      
      // Prepare all pixel data
      const allPixels: number[][] = [];
      for (let y = 0; y < height; y++) {
        classificationMap[y] = [];
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;
          const r = data[pixelIndex] / 255;
          const g = data[pixelIndex + 1] / 255;
          const b = data[pixelIndex + 2] / 255;
          allPixels.push([r, g, b]);
        }
      }

      // Process in batches
      for (let i = 0; i < allPixels.length; i += batchSize) {
        const batch = allPixels.slice(i, i + batchSize);
        const batchTensor = tensorflow.tensor2d(batch);
        
        // Predict batch
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const predictions = this.model.predict(batchTensor) as any;
        const predictionData = await predictions.data();
        
        // Process batch results
        for (let j = 0; j < batch.length; j++) {
          const pixelIndex = i + j;
          const y = Math.floor(pixelIndex / width);
          const x = pixelIndex % width;
          
          const lightProb = predictionData[j * 2];
          const shadowProb = predictionData[j * 2 + 1];
          const classification = lightProb > shadowProb ? 0 : 1;
          
          classificationMap[y][x] = classification;
          
          if (classification === 0) {
            lightPixels++;
          } else {
            shadowPixels++;
          }
        }
        
        // Clean up tensors immediately
        batchTensor.dispose();
        predictions.dispose();
      }

      const totalPixelsProcessed = lightPixels + shadowPixels;
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