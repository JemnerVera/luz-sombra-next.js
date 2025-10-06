// Types for the Agricola Luz-Sombra application

export interface FieldData {
  empresa: string[];
  fundo: string[];
  sector: string[];
  lote: string[];
  hierarchical: HierarchicalData;
}

export interface HierarchicalData {
  [empresa: string]: {
    [fundo: string]: {
      [sector: string]: string[];
    };
  };
}

export interface ImageFile {
  file: File;
  preview: string;
  gpsStatus: 'extracting' | 'found' | 'not-found';
  coordinates?: {
    lat: number;
    lng: number;
  };
  hilera?: string;
  numero_planta?: string;
}

export interface ProcessingResult {
  success: boolean;
  fileName?: string;
  image_name?: string;
  hilera?: string;
  numero_planta?: string;
  porcentaje_luz?: number;
  porcentaje_sombra?: number;
  fundo?: string;
  sector?: string;
  latitud?: number;
  longitud?: number;
  error?: string;
  message?: string;
  processed_image?: string;
}

export interface HistoryRecord {
  id: string;
  empresa: string;
  fundo: string;
  sector: string;
  lote: string;
  hilera: string;
  numero_planta: string;
  porcentaje_luz: number;
  porcentaje_sombra: number;
  fecha_tomada: string;
  latitud?: number;
  longitud?: number;
  timestamp: string;
  imagen: string;
  dispositivo: string;
  direccion: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  detail?: string;
}

export interface ProcessingFormData {
  empresa: string;
  fundo: string;
  sector: string;
  lote: string;
  images: ImageFile[];
}

export interface TestFormData {
  empresa: string;
  fundo: string;
  imagen: File;
}

export type TabType = 'analizar' | 'probar' | 'historial';

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}
