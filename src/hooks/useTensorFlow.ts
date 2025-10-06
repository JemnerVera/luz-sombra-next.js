import { useState, useEffect, useCallback } from 'react';
import { tensorFlowService, PixelClassificationResult } from '../services/tensorflowService';

export interface UseTensorFlowReturn {
  isInitialized: boolean;
  isModelReady: boolean;
  isProcessing: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  processImage: (imageFile: File) => Promise<PixelClassificationResult>;
  dispose: () => void;
}

const useTensorFlowHook = (): UseTensorFlowReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    try {
      setError(null);
      console.log('🚀 Initializing TensorFlow.js...');
      
      // Initialize TensorFlow.js
      await tensorFlowService.initialize();
      setIsInitialized(true);
      
      // Create and train model
      console.log('🧠 Creating model...');
      await tensorFlowService.createModel();
      
      console.log('🎓 Training model...');
      await tensorFlowService.trainModel();
      
      setIsModelReady(true);
      console.log('✅ TensorFlow.js ready!');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ TensorFlow initialization failed:', errorMessage);
    }
  }, []);

  const processImage = useCallback(async (imageFile: File): Promise<PixelClassificationResult> => {
    if (!isModelReady) {
      throw new Error('Model not ready');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create image element
      const img = new Image();
      const imageUrl = URL.createObjectURL(imageFile);
      
      return new Promise((resolve, reject) => {
        img.onload = async () => {
          try {
            // Create canvas to get ImageData
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Could not get canvas context');
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image to canvas
            ctx.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Process with TensorFlow
            const result = await tensorFlowService.classifyImagePixels(imageData);
            
            // Clean up
            URL.revokeObjectURL(imageUrl);
            
            resolve(result);
          } catch (err) {
            URL.revokeObjectURL(imageUrl);
            reject(err);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageUrl;
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [isModelReady]);

  const dispose = useCallback(() => {
    tensorFlowService.dispose();
    setIsModelReady(false);
    setIsInitialized(false);
  }, []);

  // Auto-initialize on mount (only once)
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (!isInitialized && mounted) {
        try {
          await initialize();
        } catch (error) {
          console.error('Failed to initialize TensorFlow:', error);
        }
      }
    };
    
    init();
    
    // Cleanup on unmount
    return () => {
      mounted = false;
      dispose();
    };
  }, []); // Empty dependency array to run only once

  return {
    isInitialized,
    isModelReady,
    isProcessing,
    error,
    initialize,
    processImage,
    dispose
  };
};

export { useTensorFlowHook as useTensorFlow };
