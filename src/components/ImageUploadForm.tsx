'use client';

import React, { useState, useCallback } from 'react';
import { useFieldData } from '../hooks/useFieldData';
import { useImageUpload } from '../hooks/useImageUpload';
import { apiService } from '../services/api';
import { ProcessingResult } from '../types';
import { formatFileSize, formatCoordinates } from '../utils/helpers';
import { Upload, X, Eye, Crop, MapPin, AlertCircle, Calendar } from 'lucide-react';
import ImageViewModal from './ImageViewModal';
import ImageCropModal from './ImageCropModal';

interface ImageUploadFormProps {
  onUnsavedDataChange: (hasData: boolean) => void;
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const ImageUploadForm: React.FC<ImageUploadFormProps> = ({ onUnsavedDataChange, onNotification }) => {
  const { fieldData, loading: fieldLoading, getFundosByEmpresa, getSectoresByEmpresaAndFundo, getLotesByEmpresaFundoAndSector } = useFieldData();
  const { images, addImages, removeImage, updateImageField, clearImages, replaceImage, hasImages } = useImageUpload();
  
  const [formData, setFormData] = useState({
    empresa: '',
    fundo: '',
    sector: '',
    lote: '',
  });
  
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [hasProcessed, setHasProcessed] = useState(false);
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; imageSrc: string; imageName: string }>({
    isOpen: false,
    imageSrc: '',
    imageName: ''
  });
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageSrc: string; imageName: string; originalFile: File }>({
    isOpen: false,
    imageSrc: '',
    imageName: '',
    originalFile: new File([], '')
  });

  // Track unsaved data
  React.useEffect(() => {
    const hasData = hasImages() || Object.values(formData).some(value => value !== '');
    onUnsavedDataChange(hasData);
  }, [images, formData, hasImages, onUnsavedDataChange]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      addImages(files);
    }
    // Clear the input value to allow re-selection of the same files
    event.target.value = '';
  }, [addImages]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      addImages(files);
    }
  }, [addImages]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset dependent fields when parent changes
      if (field === 'empresa') {
        newData.fundo = '';
        newData.sector = '';
        newData.lote = '';
      } else if (field === 'fundo') {
        newData.sector = '';
        newData.lote = '';
      } else if (field === 'sector') {
        newData.lote = '';
      }
      
      return newData;
    });
  };

  const handleProcessImages = async () => {
    if (!hasImages()) {
      onNotification('Por favor selecciona al menos una imagen', 'warning');
      return;
    }

    if (!formData.empresa || !formData.fundo || !formData.sector || !formData.lote) {
      onNotification('Por favor completa todos los campos del formulario', 'warning');
      return;
    }

    setProcessing(true);
    setResults([]);

    try {
      const processingPromises = images.map(async (imageFile) => {
        const formDataToSend = new FormData();
        formDataToSend.append('file', imageFile.file);
        formDataToSend.append('empresa', formData.empresa);
        formDataToSend.append('fundo', formData.fundo);
        formDataToSend.append('sector', formData.sector);
        formDataToSend.append('lote', formData.lote);
        formDataToSend.append('hilera', imageFile.hilera || '');
        formDataToSend.append('numero_planta', imageFile.numero_planta || '');

        return apiService.processImage(formDataToSend);
      });

      const results = await Promise.all(processingPromises);
      setResults(results);
      setHasProcessed(true);
      
      const successCount = results.filter(r => r.success).length;
      onNotification(`Procesamiento completado: ${successCount}/${results.length} imágenes procesadas exitosamente`, 'success');
      
    } catch (error) {
      console.error('Error processing images:', error);
      onNotification('Error al procesar las imágenes', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleClearAll = () => {
    clearImages();
    setFormData({ empresa: '', fundo: '', sector: '', lote: '' });
    setResults([]);
    setHasProcessed(false);
    
    // Clear the file input to allow re-selection
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      // Trigger a change event to ensure the input is properly reset
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    onNotification('Formulario limpiado', 'info');
  };

  const handleViewImage = (imageFile: { preview: string; file: File }) => {
    setViewModal({
      isOpen: true,
      imageSrc: imageFile.preview,
      imageName: imageFile.file.name
    });
  };

  const handleCropImage = (imageFile: { preview: string; file: File }) => {
    setCropModal({
      isOpen: true,
      imageSrc: imageFile.preview,
      imageName: imageFile.file.name,
      originalFile: imageFile.file
    });
  };

  const handleCropComplete = (croppedFile: File) => {
    // Find the original image and replace it with the cropped version
    const originalImage = images.find(img => img.file.name === cropModal.originalFile.name);
    if (originalImage) {
      replaceImage(originalImage.file, croppedFile);
      onNotification('Imagen recortada exitosamente', 'success');
    }
  };

  const handleUpdateImageField = (file: File, field: 'hilera' | 'numero_planta', value: string) => {
    updateImageField(file, field, value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Form Fields */}
      <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-700 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-display">
              📋 Información del Campo
            </h2>
            {fieldLoading && (
              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Cargando datos...</span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-dark-400">
            (*) Campos obligatorios
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
              Empresa*
              {fieldLoading && (
                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                  <span className="inline-flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400 mr-1"></div>
                    Cargando...
                  </span>
                </span>
              )}
            </label>
            <select
              value={formData.empresa}
              onChange={(e) => handleFormChange('empresa', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:text-white ${
                fieldLoading 
                  ? 'border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 cursor-wait' 
                  : 'border-gray-300 dark:border-dark-600'
              }`}
              disabled={fieldLoading}
            >
              <option value="" disabled hidden>
                {fieldLoading ? 'Cargando empresas...' : 'Seleccionar empresa'}
              </option>
              {fieldData?.empresa?.map((empresa) => (
                <option key={empresa} value={empresa}>
                  {empresa}
                </option>
              ))}
            </select>
          </div>

          {/* Fundo */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              !formData.empresa 
                ? 'text-gray-400 dark:text-dark-500' 
                : 'text-gray-700 dark:text-dark-300'
            }`}>
              Fundo*
            </label>
            <select
              value={formData.fundo}
              onChange={(e) => handleFormChange('fundo', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:text-white ${
                !formData.empresa 
                  ? 'border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 opacity-50 cursor-not-allowed' 
                  : 'border-gray-300 dark:border-dark-600'
              }`}
              disabled={!formData.empresa || fieldLoading}
            >
              <option value="" disabled hidden>Seleccionar fundo</option>
              {getFundosByEmpresa(formData.empresa).map((fundo) => (
                <option key={fundo} value={fundo}>
                  {fundo}
                </option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              !formData.fundo 
                ? 'text-gray-400 dark:text-dark-500' 
                : 'text-gray-700 dark:text-dark-300'
            }`}>
              Sector*
            </label>
            <select
              value={formData.sector}
              onChange={(e) => handleFormChange('sector', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:text-white ${
                !formData.fundo 
                  ? 'border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 opacity-50 cursor-not-allowed' 
                  : 'border-gray-300 dark:border-dark-600'
              }`}
              disabled={!formData.fundo || fieldLoading}
            >
              <option value="" disabled hidden>Seleccionar sector</option>
              {getSectoresByEmpresaAndFundo(formData.empresa, formData.fundo).map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </div>

          {/* Lote */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              !formData.sector 
                ? 'text-gray-400 dark:text-dark-500' 
                : 'text-gray-700 dark:text-dark-300'
            }`}>
              Lote*
            </label>
            <select
              value={formData.lote}
              onChange={(e) => handleFormChange('lote', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:text-white ${
                !formData.sector 
                  ? 'border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 opacity-50 cursor-not-allowed' 
                  : 'border-gray-300 dark:border-dark-600'
              }`}
              disabled={!formData.sector || fieldLoading}
            >
              <option value="" disabled hidden>Seleccionar lote</option>
              {getLotesByEmpresaFundoAndSector(formData.empresa, formData.fundo, formData.sector).map((lote) => (
                <option key={lote} value={lote}>
                  {lote}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-700 animate-slide-up">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-display">
          📸 Subir Imágenes
        </h2>
        
        <div
          className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl p-8 text-center hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200 cursor-pointer group"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className="h-12 w-12 text-gray-400 dark:text-dark-400 mx-auto mb-4 group-hover:text-primary-500 transition-colors" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
            Arrastra imágenes aquí o haz clic para seleccionar
          </p>
          <p className="text-sm text-gray-500 dark:text-dark-400 mb-4">
            JPG, PNG, WebP hasta 10MB cada una
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            {hasImages() ? 'Adicionar Archivos' : 'Seleccionar Archivos'}
          </button>
        </div>

        {/* Images List */}
        {images.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium text-gray-800 dark:text-dark-200">
                Imágenes seleccionadas ({images.length})
              </h3>
              <button
                onClick={clearImages}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Limpiar todas
              </button>
            </div>
            
            {images.map((imageFile, index) => (
              <div key={index} className="border border-gray-200 dark:border-dark-700 rounded-lg p-4">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center">
                  {/* Image Preview */}
                  <div className="xl:col-span-2">
                    <img
                      src={imageFile.preview}
                      alt={imageFile.file.name}
                      className="w-full h-20 object-cover rounded"
                    />
                  </div>
                  
                  {/* File Info */}
                  <div className="xl:col-span-3">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {imageFile.file.name}
                      </p>
                      {imageFile.file.name.includes('_cropped') && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                          Recortada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-dark-400">
                      {formatFileSize(imageFile.file.size)}
                    </p>
                    {/* GPS and Date Status */}
                    <div className="flex flex-wrap gap-1">
                      {/* GPS Status */}
                      {imageFile.gpsStatus === 'extracting' && (
                        <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-400 mr-1"></div>
                          GPS...
                        </div>
                      )}
                      {imageFile.gpsStatus === 'found' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <MapPin className="h-3 w-3 mr-1" />
                          Con GPS
                        </span>
                      )}
                      {imageFile.gpsStatus === 'not-found' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Sin GPS
                        </span>
                      )}

                      {/* Date Status */}
                      {imageFile.dateStatus === 'extracting' && (
                        <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-400 mr-1"></div>
                          Fecha...
                        </div>
                      )}
                      {imageFile.dateStatus === 'found' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Calendar className="h-3 w-3 mr-1" />
                          Con Fecha
                        </span>
                      )}
                      {imageFile.dateStatus === 'not-found' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Sin Fecha
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Hilera */}
                  <div className="xl:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-dark-300 mb-1">
                      Hilera
                    </label>
                    <input
                      type="text"
                      value={imageFile.hilera || ''}
                      onChange={(e) => handleUpdateImageField(imageFile.file, 'hilera', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-dark-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-dark-800 dark:text-white"
                      placeholder="Ej: H1"
                    />
                  </div>
                  
                  {/* N° Planta */}
                  <div className="xl:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-dark-300 mb-1">
                      N° Planta
                    </label>
                    <input
                      type="text"
                      value={imageFile.numero_planta || ''}
                      onChange={(e) => handleUpdateImageField(imageFile.file, 'numero_planta', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-dark-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-dark-800 dark:text-white"
                      placeholder="Ej: P10"
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="xl:col-span-3 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleViewImage(imageFile)}
                      className="flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCropImage(imageFile)}
                      className="flex items-center px-2 py-1 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                      <Crop className="h-3 w-3 mr-1" />
                      Recortar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(imageFile.file)}
                      className="flex items-center px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
        <button
          onClick={handleProcessImages}
          disabled={processing || !hasImages() || !formData.empresa || !formData.fundo || !formData.sector || !formData.lote || (hasProcessed && results.length > 0)}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {processing ? 'Procesando...' : hasProcessed && results.length > 0 ? 'Ya Procesado' : 'Procesar Imágenes'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-700 animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-display">
              📊 Resultados del Procesamiento
            </h2>
            <button
              onClick={() => {
                setResults([]);
                setHasProcessed(false);
                onNotification('Resultados limpiados', 'info');
              }}
              className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </button>
          </div>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {result.fileName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-dark-400">
                          Hilera: {result.hilera} | Planta: {result.numero_planta}
                        </p>
                      </div>
                      <div className="flex space-x-4">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Luz: {result.porcentaje_luz?.toFixed(1)}%
                        </span>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Sombra: {result.porcentaje_sombra?.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {/* Original Image Preview */}
                    {images.find(img => img.file.name === result.fileName) && (
                      <img
                        src={images.find(img => img.file.name === result.fileName)?.preview}
                        alt="Original"
                        className="w-12 h-12 object-cover rounded border border-gray-300 dark:border-dark-600"
                      />
                    )}
                    {/* Processed Image Preview */}
                    {result.processed_image && (
                      <img
                        src={result.processed_image}
                        alt="Processed"
                        className="w-12 h-12 object-cover rounded border border-gray-300 dark:border-dark-600"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ImageViewModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, imageSrc: '', imageName: '' })}
        imageSrc={viewModal.imageSrc}
        imageName={viewModal.imageName}
      />

      <ImageCropModal
        isOpen={cropModal.isOpen}
        onClose={() => setCropModal({ isOpen: false, imageSrc: '', imageName: '', originalFile: new File([], '') })}
        onCrop={handleCropComplete}
        imageSrc={cropModal.imageSrc}
        imageName={cropModal.imageName}
      />
    </div>
  );
};

export default ImageUploadForm;
