'use client';

import React, { useState } from 'react';
import { useTensorFlow } from '../hooks/useTensorFlow';
import { ProcessingResult } from '../types';
import { formatFileSize } from '../utils/helpers';
import { Upload, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface ModelTestFormProps {
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const ModelTestForm: React.FC<ModelTestFormProps> = ({ onNotification }) => {
  const { isModelReady, isProcessing: tfProcessing, processImage } = useTensorFlow();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      // Create URL for original image
      const url = URL.createObjectURL(file);
      setOriginalImageUrl(url);
    }
  };

  const handleTestModel = async () => {
    if (!selectedFile) {
      onNotification('Por favor selecciona una imagen', 'warning');
      return;
    }

    if (!isModelReady) {
      onNotification('El modelo de TensorFlow no está listo. Por favor espera...', 'warning');
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      // Use TensorFlow.js for local processing
      const tfResult = await processImage(selectedFile);
      
      // Create a ProcessingResult compatible with the UI
      const result: ProcessingResult = {
        success: true,
        fileName: selectedFile.name,
        empresa: 'Prueba del Modelo',
        fundo: 'TensorFlow.js',
        porcentaje_luz: tfResult.lightPercentage,
        porcentaje_sombra: tfResult.shadowPercentage,
        processed_image: tfResult.processedImageData,
        hilera: '',
        numero_planta: '',
        latitud: undefined,
        longitud: undefined,
        error: undefined
      };
      
      setResult(result);
      onNotification('Prueba del modelo completada exitosamente con TensorFlow.js', 'success');
    } catch (error) {
      console.error('Error testing model:', error);
      onNotification('Error al probar el modelo con TensorFlow.js', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setResult(null);
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
      setOriginalImageUrl(null);
    }
    onNotification('Formulario limpiado', 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Form Fields */}
      <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-700 animate-slide-up">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-display">
          🧪 Probar Modelo TensorFlow.js
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-dark-400 mb-6">
          Selecciona una imagen agrícola para probar el modelo de clasificación de píxeles (luz/sombra).
        </p>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="test-image-upload"
          />
          <label
            htmlFor="test-image-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-dark-400">
              Haz clic para seleccionar una imagen de prueba
            </span>
            <span className="text-xs text-gray-500 dark:text-dark-500">
              JPG, PNG, WebP (máx. 10MB)
            </span>
          </label>
        </div>

        {/* Selected File */}
        {selectedFile && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Eye className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleTestModel}
          disabled={processing || tfProcessing || !selectedFile || !isModelReady}
          className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {processing || tfProcessing ? 'Probando Modelo...' : 
           !isModelReady ? 'Inicializando TensorFlow...' : 'Probar Modelo con TensorFlow.js'}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-3 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-dark-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-dark-800 transition-all duration-200"
        >
          Limpiar
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-700 animate-slide-up">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-display">
            📊 Resultado de la Prueba
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Información de la Imagen
              </h3>
              <p className="text-sm text-gray-600 dark:text-dark-400">
                <strong>Archivo:</strong> {result.fileName}
              </p>
              <p className="text-sm text-gray-600 dark:text-dark-400">
                <strong>Tipo:</strong> {result.empresa || 'Prueba del Modelo'}
              </p>
              <p className="text-sm text-gray-600 dark:text-dark-400">
                <strong>Modelo:</strong> {result.fundo}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Resultados del Análisis
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-dark-400">Luz:</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {result.porcentaje_luz?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-dark-400">Sombra:</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {result.porcentaje_sombra?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          {result.processed_image && originalImageUrl && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                Comparación: Original vs Procesada
              </h3>
              
              {/* Image Comparison Slider */}
              <div className="relative mb-6">
                <ImageComparisonSlider
                  originalImage={originalImageUrl}
                  processedImage={result.processed_image}
                />
              </div>

              {/* Color Legend */}
              <div className="bg-gray-50 dark:bg-dark-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  🎨 Leyenda de Colores
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-500 rounded border"></div>
                    <span className="text-sm text-gray-700 dark:text-dark-300">Suelo Sombra</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded border"></div>
                    <span className="text-sm text-gray-700 dark:text-dark-300">Suelo Luz</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-600 rounded border"></div>
                    <span className="text-sm text-gray-700 dark:text-dark-300">Malla Sombra</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-400 rounded border"></div>
                    <span className="text-sm text-gray-700 dark:text-dark-300">Malla Luz</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Image Comparison Slider Component
interface ImageComparisonSliderProps {
  originalImage: string;
  processedImage: string;
}

const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ 
  originalImage, 
  processedImage 
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto cursor-col-resize select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {/* Container for both images */}
      <div className="relative rounded-lg border border-gray-200 dark:border-dark-600 overflow-hidden">
        {/* Original Image (Background) - Full size */}
        <img
          src={originalImage}
          alt="Original"
          className="w-full h-auto block"
          draggable={false}
        />
        
        {/* Processed Image (Overlay) - Full size with clip */}
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{ 
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
          }}
        >
          <img
            src={processedImage}
            alt="Processed"
            className="w-full h-auto block"
            draggable={false}
          />
        </div>
        
        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Slider Handle */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center cursor-col-resize"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <ChevronLeft className="w-3 h-3 text-gray-600" />
            <ChevronRight className="w-3 h-3 text-gray-600 -ml-1" />
          </div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-dark-400">
        <span>Original</span>
        <span>Procesada</span>
      </div>
    </div>
  );
};

export default ModelTestForm;
