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
   * Train the model with better data (hybrid approach for Vercel)
   */
  async trainModel(): Promise<void> {
    if (this.isTraining) {
      console.log('⏳ Model already training, waiting...');
      return;
    }

    try {
      this.isTraining = true;
      const tensorflow = await loadTensorFlow();

      console.log('🚀 Training hybrid model for Vercel...');

      // Generate rich training data with multiple features
      const features = [];
      const labels = [];

      // Generate 200 samples with realistic light/shadow patterns
      for (let i = 0; i < 200; i++) {
        let r, g, b, brightness, contrast, edgeStrength;
        
        if (i < 100) {
          // Light samples (bright, high contrast, low edge strength)
          r = 0.5 + Math.random() * 0.5; // 0.5-1.0
          g = 0.5 + Math.random() * 0.5;
          b = 0.5 + Math.random() * 0.5;
          brightness = 0.6 + Math.random() * 0.4; // 0.6-1.0
          contrast = 0.3 + Math.random() * 0.4; // 0.3-0.7
          edgeStrength = Math.random() * 0.3; // 0.0-0.3 (smooth areas)
          labels.push([1, 0]); // Light
        } else {
          // Shadow samples (dark, low contrast, high edge strength)
          r = Math.random() * 0.4; // 0.0-0.4
          g = Math.random() * 0.4;
          b = Math.random() * 0.4;
          brightness = Math.random() * 0.4; // 0.0-0.4
          contrast = Math.random() * 0.3; // 0.0-0.3
          edgeStrength = 0.4 + Math.random() * 0.6; // 0.4-1.0 (edge areas)
          labels.push([0, 1]); // Shadow
        }
        
        features.push([r, g, b, brightness, contrast, edgeStrength]);
      }

      const xs = tensorflow.tensor2d(features);
      const ys = tensorflow.tensor2d(labels);

      // Enhanced training: 8 epochs with validation
      await this.model.fit(xs, ys, {
        epochs: 8, // More epochs for better learning
        batchSize: 32, // Optimal batch size
        validationSplit: 0.2, // Validation for better generalization
        verbose: 0 // No logging
      });

      // Clean up tensors immediately
      xs.dispose();
      ys.dispose();

      this.isModelLoaded = true;
      console.log('✅ Hybrid model trained successfully');
    } catch (error) {
      console.error('❌ Error training model:', error);
      throw error;
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Classify image using region-based analysis (hybrid approach)
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

      console.log(`🔍 Processing image: ${width}x${height} pixels with region-based analysis`);

      // Initialize classification map
      for (let y = 0; y < height; y++) {
        classificationMap[y] = [];
      }

      // Process image in regions (10x10 pixel blocks) for efficiency
      const regionSize = 10;
      const regions: number[][] = [];
      const regionPositions: { x: number; y: number; width: number; height: number }[] = [];

      // Sample regions from the image with multi-feature analysis
      for (let y = 0; y < height - regionSize; y += regionSize) {
        for (let x = 0; x < width - regionSize; x += regionSize) {
          // Calculate multiple features for this region
          let totalR = 0, totalG = 0, totalB = 0;
          let pixelCount = 0;
          const pixelValues: number[] = [];

          // Collect pixel data
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
              
              // Store brightness for contrast calculation
              const brightness = (r + g + b) / 3;
              pixelValues.push(brightness);
            }
          }

          // Calculate features
          const avgR = (totalR / pixelCount) / 255;
          const avgG = (totalG / pixelCount) / 255;
          const avgB = (totalB / pixelCount) / 255;
          const brightness = (avgR + avgG + avgB) / 3;
          
          // Calculate contrast (standard deviation of brightness)
          const meanBrightness = pixelValues.reduce((sum, val) => sum + val, 0) / pixelValues.length;
          const variance = pixelValues.reduce((sum, val) => sum + Math.pow(val - meanBrightness, 2), 0) / pixelValues.length;
          const contrast = Math.sqrt(variance) / 255; // Normalize
          
          // Calculate edge strength (simplified gradient)
          let edgeStrength = 0;
          for (let dy = 0; dy < regionSize - 1; dy++) {
            for (let dx = 0; dx < regionSize - 1; dx++) {
              const pixelIndex1 = ((y + dy) * width + (x + dx)) * 4;
              const pixelIndex2 = ((y + dy) * width + (x + dx + 1)) * 4;
              const pixelIndex3 = ((y + dy + 1) * width + (x + dx)) * 4;
              
              const brightness1 = (data[pixelIndex1] + data[pixelIndex1 + 1] + data[pixelIndex1 + 2]) / 3;
              const brightness2 = (data[pixelIndex2] + data[pixelIndex2 + 1] + data[pixelIndex2 + 2]) / 3;
              const brightness3 = (data[pixelIndex3] + data[pixelIndex3 + 1] + data[pixelIndex3 + 2]) / 3;
              
              const gradientX = Math.abs(brightness2 - brightness1);
              const gradientY = Math.abs(brightness3 - brightness1);
              edgeStrength += Math.sqrt(gradientX * gradientX + gradientY * gradientY);
            }
          }
          edgeStrength = (edgeStrength / ((regionSize - 1) * (regionSize - 1))) / 255; // Normalize

          regions.push([avgR, avgG, avgB, brightness, contrast, edgeStrength]);
          regionPositions.push({ x, y, width: regionSize, height: regionSize });
        }
      }

      // Process all regions at once
      if (regions.length > 0) {
        const regionsTensor = tensorflow.tensor2d(regions);
        
        // Predict all regions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const predictions = this.model.predict(regionsTensor) as any;
        const predictionData = await predictions.data();
        
        // Apply results to classification map
        for (let i = 0; i < regions.length; i++) {
          const lightProb = predictionData[i * 2];
          const shadowProb = predictionData[i * 2 + 1];
          const classification = lightProb > shadowProb ? 0 : 1;
          
          const pos = regionPositions[i];
          
          // Apply classification to entire region
          for (let dy = 0; dy < pos.height; dy++) {
            for (let dx = 0; dx < pos.width; dx++) {
              const y = pos.y + dy;
              const x = pos.x + dx;
              if (y < height && x < width) {
                classificationMap[y][x] = classification;
                if (classification === 0) {
                  lightPixels++;
                } else {
                  shadowPixels++;
                }
              }
            }
          }
        }
        
        // Clean up tensors
        regionsTensor.dispose();
        predictions.dispose();
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