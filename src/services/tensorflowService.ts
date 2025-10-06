import * as tf from '@tensorflow/tfjs';

export interface PixelClassificationResult {
  lightPercentage: number;
  shadowPercentage: number;
  processedImageData: string; // Base64 encoded image
  classificationMap: number[][];
}

export class TensorFlowService {
  private model: tf.LayersModel | null = null;
  private isModelLoaded = false;

  /**
   * Initialize TensorFlow.js
   */
  async initialize(): Promise<void> {
    try {
      // Set backend to CPU for better compatibility
      await tf.setBackend('cpu');
      await tf.ready();
      console.log('✅ TensorFlow.js initialized');
    } catch (error) {
      console.error('❌ Error initializing TensorFlow.js:', error);
      throw error;
    }
  }

  /**
   * Create and train a simple model for pixel classification
   */
  async createModel(): Promise<void> {
    try {
      // Dispose existing model if it exists
      if (this.model) {
        this.model.dispose();
        this.model = null;
      }

    // Create a model that matches the Python model structure
    this.model = tf.sequential({
      layers: [
        // Input layer - 10 features (RGB, HSV, luminance, saturation, NDVI, texture)
        tf.layers.dense({
          inputShape: [10],
          units: 128,
          activation: 'relu',
          name: 'dense1'
        }),
        tf.layers.dropout({ rate: 0.3 }),
        
        // Hidden layer 1
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          name: 'dense2'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        
        // Hidden layer 2
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          name: 'dense3'
        }),
        tf.layers.dropout({ rate: 0.1 }),
        
        // Output layer - 4 classes (SUELO_SOMBRA, SUELO_LUZ, MALLA_SOMBRA, MALLA_LUZ)
        tf.layers.dense({
          units: 4,
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

      console.log('✅ TensorFlow model created');
      this.isModelLoaded = true;
    } catch (error) {
      console.error('❌ Error creating model:', error);
      throw error;
    }
  }

  /**
   * Train the model with synthetic data based on real dataset analysis
   */
  async trainModel(): Promise<void> {
    if (!this.model) {
      throw new Error('Model not created');
    }

    try {
      // Generate training data based on real dataset analysis
      const { features, labels } = this.generateTrainingData();
      
      // Convert to tensors
      const xs = tf.tensor2d(features);
      const ys = tf.tensor2d(labels);

    // Train the model
    const history = await this.model.fit(xs, ys, {
      epochs: 5, // Further reduced epochs for faster training
      batchSize: 64, // Larger batch size for faster training
      validationSplit: 0.1, // Reduced validation split
      verbose: 0 // No verbose output
    });

      console.log('✅ Model trained successfully');
      
      // Clean up tensors
      xs.dispose();
      ys.dispose();
    } catch (error) {
      console.error('❌ Error training model:', error);
      // Don't throw error, just log it and continue
      console.log('⚠️ Continuing without trained model...');
    }
  }

  /**
   * Generate training data based on the actual Python model logic
   */
  private generateTrainingData(): { features: number[][], labels: number[][] } {
    const features: number[][] = [];
    const labels: number[][] = [];
    
    // Generate 5000 samples (reduced for faster training)
    for (let i = 0; i < 5000; i++) {
      const r = Math.random() * 255;
      const g = Math.random() * 255;
      const b = Math.random() * 255;
      
      // Calculate features exactly like the Python model
      const intensity = (r + g + b) / 3.0;
      const greenRatio = g / (r + b + 1);
      
      // Convert to HSV (simplified approximation)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let h = 0;
      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
      }
      h = (h * 60 + 360) % 360;
      
      const s = max === 0 ? 0 : delta / max;
      const v = max / 255;
      
      // Luminance (same as Python)
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // NDVI approximation
      const ndvi = (g - r) / (g + r + 1e-8);
      
      // Texture (variance approximation)
      const texture = Math.pow((r - intensity), 2) + Math.pow((g - intensity), 2) + Math.pow((b - intensity), 2);
      
      // Classify using the exact same logic as Python model
      let classIndex: number;
      
      // SUELO_INTENSITY_THRESHOLD = 120.0, SUELO_GREEN_THRESHOLD = 0.52
      if (intensity < 120.0 && greenRatio <= 0.52) {
        classIndex = 0; // SUELO_SOMBRA
      } else if (intensity >= 120.0 && greenRatio <= 0.52) {
        classIndex = 1; // SUELO_LUZ
      } else if (intensity < 120.0 && greenRatio > 0.52) {
        classIndex = 2; // MALLA_SOMBRA
      } else {
        classIndex = 3; // MALLA_LUZ
      }
      
      // Use all features like the Python model: [r, g, b, h, s, v, luminance, saturation, ndvi, texture]
      features.push([r, g, b, h, s, v, luminance, s, ndvi, texture]);
      
      // One-hot encoding
      const label = [0, 0, 0, 0];
      label[classIndex] = 1;
      labels.push(label);
    }
    
    return { features, labels };
  }

  /**
   * Extract features exactly like the Python model
   */
  private extractFeatures(r: number, g: number, b: number): number[] {
    // Calculate intensity and green ratio
    const intensity = (r + g + b) / 3.0;
    const greenRatio = g / (r + b + 1);
    
    // Convert to HSV (simplified approximation)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    if (delta !== 0) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
    }
    h = (h * 60 + 360) % 360;
    
    const s = max === 0 ? 0 : delta / max;
    const v = max / 255;
    
    // Luminance (same as Python)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // NDVI approximation
    const ndvi = (g - r) / (g + r + 1e-8);
    
    // Texture (variance approximation)
    const texture = Math.pow((r - intensity), 2) + Math.pow((g - intensity), 2) + Math.pow((b - intensity), 2);
    
    // Return features in the same order as Python model
    return [r, g, b, h, s, v, luminance, s, ndvi, texture];
  }

  /**
   * Classify pixels in an image using rule-based approach (faster than ML)
   */
  async classifyImagePixels(imageData: ImageData): Promise<PixelClassificationResult> {
    try {
      const { data, width, height } = imageData;
      
      // Use rule-based classification (same logic as Python model) for better performance
      const classificationMap: number[][] = [];
      let lightPixels = 0;
      let shadowPixels = 0;
      
      console.log('🧠 Classifying pixels with rule-based approach...');
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate features
        const intensity = (r + g + b) / 3.0;
        const denominator = r + b;
        const greenRatio = denominator === 0 ? 0 : g / denominator;
        
        // Classify using the same logic as Python model
        let classIndex: number;
        const SUELO_INTENSITY_THRESHOLD = 120.0;
        const SUELO_GREEN_THRESHOLD = 0.52;
        
        if (intensity < SUELO_INTENSITY_THRESHOLD && greenRatio <= SUELO_GREEN_THRESHOLD) {
          classIndex = 0; // SUELO_SOMBRA
        } else if (intensity >= SUELO_INTENSITY_THRESHOLD && greenRatio <= SUELO_GREEN_THRESHOLD) {
          classIndex = 1; // SUELO_LUZ
        } else if (intensity < SUELO_INTENSITY_THRESHOLD && greenRatio > SUELO_GREEN_THRESHOLD) {
          classIndex = 2; // MALLA_SOMBRA
        } else {
          classIndex = 3; // MALLA_LUZ
        }
        
        // Map to 2D array
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);
        if (!classificationMap[y]) classificationMap[y] = [];
        classificationMap[y][x] = classIndex;
        
        // Count light and shadow pixels
        if (classIndex === 1 || classIndex === 3) { // SUELO_LUZ or MALLA_LUZ
          lightPixels++;
        } else if (classIndex === 0 || classIndex === 2) { // SUELO_SOMBRA or MALLA_SOMBRA
          shadowPixels++;
        }
      }
      
      // Calculate percentages
      const totalPixels = (data.length / 4);
      const lightPercentage = (lightPixels / totalPixels) * 100;
      const shadowPercentage = (shadowPixels / totalPixels) * 100;
      
      // Create processed image
      const processedImageData = this.createProcessedImage(imageData, classificationMap);
      
      console.log(`✅ Classification complete: ${lightPercentage.toFixed(2)}% luz, ${shadowPercentage.toFixed(2)}% sombra`);
      
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
   * Get the index of the maximum value in an array
   */
  private getMaxIndex(arr: Float32Array | number[]): number {
    let maxIndex = 0;
    let maxValue = arr[0];
    
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] > maxValue) {
        maxValue = arr[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }

  /**
   * Create a processed image with color-coded classifications
   */
  private createProcessedImage(imageData: ImageData, classificationMap: number[][]): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    const processedData = ctx.createImageData(imageData.width, imageData.height);
    
    // Color mapping (same as Python model)
    const colors = [
      [128, 128, 128, 255], // SUELO_SOMBRA - Gray
      [255, 255, 0, 255],   // SUELO_LUZ - Yellow
      [0, 128, 0, 255],     // MALLA_SOMBRA - Dark Green
      [0, 255, 0, 255]      // MALLA_LUZ - Green
    ];
    
    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const classIndex = classificationMap[y][x];
        const color = colors[classIndex];
        
        const pixelIndex = (y * imageData.width + x) * 4;
        processedData.data[pixelIndex] = color[0];     // R
        processedData.data[pixelIndex + 1] = color[1]; // G
        processedData.data[pixelIndex + 2] = color[2]; // B
        processedData.data[pixelIndex + 3] = color[3]; // A
      }
    }
    
    ctx.putImageData(processedData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  /**
   * Check if model is loaded and ready
   */
  isReady(): boolean {
    return this.isModelLoaded && this.model !== null;
  }

  /**
   * Dispose of the model to free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isModelLoaded = false;
    }
  }
}

// Export singleton instance
export const tensorFlowService = new TensorFlowService();
