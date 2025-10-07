import axios from 'axios';
import { FieldData, HistoryRecord, ApiResponse, ProcessingResult } from '../types';
import { config } from '../config/environment';

const API_BASE_URL = config.apiUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 1 minute timeout for image processing (reduced for Vercel)
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Health check
  health: async (): Promise<ApiResponse<{ status: string }>> => {
    const response = await api.get('/api/health');
    return response.data;
  },

  // Get field data for dropdowns
  getFieldData: async (): Promise<FieldData> => {
    const response = await api.get('/api/google-sheets/field-data');
    return response.data;
  },

  // Process single image
  processImage: async (formData: FormData): Promise<ProcessingResult> => {
    const response = await api.post('/api/procesar-imagen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Test model (for testing tab)
  testModel: async (formData: FormData): Promise<ProcessingResult> => {
    const response = await api.post('/api/test-model', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Process multiple images
  processMultipleImages: async (images: FormData[]): Promise<ProcessingResult[]> => {
    const promises = images.map(formData => apiService.processImage(formData));
    return Promise.all(promises);
  },

  // Get processing history
  getHistory: async (): Promise<ApiResponse<HistoryRecord[]>> => {
    const response = await api.get('/api/historial');
    // El backend devuelve { success: true, procesamientos: [...] }
    // pero el frontend espera { success: true, data: [...] }
    if (response.data.success && response.data.procesamientos) {
      return {
        success: true,
        data: response.data.procesamientos
      };
    }
    return response.data;
  },

  // Get statistics
  getStatistics: async (): Promise<ApiResponse<unknown>> => {
    const response = await api.get('/api/estadisticas');
    return response.data;
  },

  // Check GPS info from image
  checkGpsInfo: async (file: File): Promise<ApiResponse<{ hasGps: boolean; coordinates?: { lat: number; lng: number } }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/check-gps-info', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default apiService;
