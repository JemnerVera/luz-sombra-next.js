import { useState, useEffect, useCallback, useRef } from 'react';
import { tensorFlowService, PixelClassificationResult } from '../services/tensorflowService';

// Global state to prevent multiple initializations
let globalInitializationPromise: Promise<void> | null = null;
let globalIsInitialized = false;

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
  const [isInitialized, setIsInitialized] = useState(globalIsInitialized);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializationRef = useRef<boolean>(false);

  const initialize = useCallback(async () => {
    // If already initialized globally, just update local state
    if (globalIsInitialized) {
      setIsInitialized(true);
      setIsModelReady(true);
      return;
    }

    // If already initializing, wait for the existing promise
    if (globalInitializationPromise) {
      try {
        await globalInitializationPromise;
        setIsInitialized(true);
        setIsModelReady(true);
        return;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return;
      }
    }

    // Start new initialization
    try {
      setError(null);
      console.log('🚀 Initializing TensorFlow.js...');
      
      // Create global initialization promise
      globalInitializationPromise = (async () => {
        // Initialize TensorFlow.js
        await tensorFlowService.initialize();
        
        // Create and train model
        console.log('🧠 Creating model...');
        await tensorFlowService.createModel();
        
        console.log('🎓 Training model...');
        await tensorFlowService.trainModel();
        
        globalIsInitialized = true;
        console.log('✅ TensorFlow.js ready!');
      })();

      await globalInitializationPromise;
      
      setIsInitialized(true);
      setIsModelReady(true);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ TensorFlow initialization failed:', errorMessage);
      globalInitializationPromise = null; // Reset on error
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
    // TensorFlow.js cleanup is handled automatically
    setIsModelReady(false);
    setIsInitialized(false);
  }, []);

  // Auto-initialize on mount (only once)
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (!initializationRef.current && mounted) {
        initializationRef.current = true;
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
      // Don't dispose globally, just reset local ref
      initializationRef.current = false;
    };
  }, [initialize]); // Include initialize in dependencies

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
