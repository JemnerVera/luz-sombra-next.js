'use client';

import React, { useState } from 'react';
import { useFieldData } from '../hooks/useFieldData';
import { apiService } from '../services/api';
import { ProcessingResult } from '../types';
import { formatFileSize } from '../utils/helpers';
import { Upload, Eye } from 'lucide-react';

interface ModelTestFormProps {
  onNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const ModelTestForm: React.FC<ModelTestFormProps> = ({ onNotification }) => {
  const { fieldData, loading: fieldLoading } = useFieldData();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    empresa: '',
    fundo: '',
  });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleTestModel = async () => {
    if (!selectedFile) {
      onNotification('Por favor selecciona una imagen', 'warning');
      return;
    }

    if (!formData.empresa || !formData.fundo) {
      onNotification('Por favor completa todos los campos', 'warning');
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('empresa', formData.empresa);
      formDataToSend.append('fundo', formData.fundo);

      const result = await apiService.testModel(formDataToSend);
      setResult(result);
      onNotification('Prueba del modelo completada exitosamente', 'success');
    } catch (error) {
      console.error('Error testing model:', error);
      onNotification('Error al probar el modelo', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFormData({ empresa: '', fundo: '' });
    setResult(null);
    onNotification('Formulario limpiado', 'info');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Form Fields */}
      <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-700 animate-slide-up">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 font-display">
          🧪 Probar Modelo
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
              Empresa
            </label>
            <select
              value={formData.empresa}
              onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:text-white"
              disabled={fieldLoading}
            >
              <option value="">Seleccionar empresa</option>
              {fieldData?.empresa?.map((empresa) => (
                <option key={empresa} value={empresa}>
                  {empresa}
                </option>
              ))}
            </select>
          </div>

          {/* Fundo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
              Fundo
            </label>
            <select
              value={formData.fundo}
              onChange={(e) => setFormData(prev => ({ ...prev, fundo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-800 dark:text-white"
              disabled={fieldLoading}
            >
              <option value="">Seleccionar fundo</option>
              {fieldData?.fundo?.map((fundo) => (
                <option key={fundo} value={fundo}>
                  {fundo}
                </option>
              ))}
            </select>
          </div>
        </div>

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
          disabled={processing || !selectedFile || !formData.empresa || !formData.fundo}
          className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {processing ? 'Probando Modelo...' : 'Probar Modelo'}
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
                <strong>Empresa:</strong> {formData.empresa}
              </p>
              <p className="text-sm text-gray-600 dark:text-dark-400">
                <strong>Fundo:</strong> {formData.fundo}
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
          {result.processed_image && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Imagen Procesada
              </h3>
              <img
                src={result.processed_image}
                alt="Processed result"
                className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-dark-600"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModelTestForm;
