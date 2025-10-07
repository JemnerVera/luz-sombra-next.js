import { useState, useEffect, useCallback } from 'react';
import { FieldData } from '../types';
import { apiService } from '../services/api';

// Global cache for field data
let globalFieldDataCache: { data: FieldData | null; timestamp: number; loading: boolean } = {
  data: null,
  timestamp: 0,
  loading: false
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useFieldData = () => {
  const [fieldData, setFieldData] = useState<FieldData | null>(globalFieldDataCache.data);
  const [loading, setLoading] = useState(globalFieldDataCache.loading);
  const [error, setError] = useState<string | null>(null);

  const loadFieldData = useCallback(async () => {
    // Check if we already have valid cached data
    if (globalFieldDataCache.data && (Date.now() - globalFieldDataCache.timestamp) < CACHE_DURATION) {
      console.log('📊 Using cached field data from global cache');
      setFieldData(globalFieldDataCache.data);
      setLoading(false);
      return;
    }

    // Check if another component is already loading
    if (globalFieldDataCache.loading) {
      console.log('📊 Field data already loading, waiting...');
      setLoading(true);
      return;
    }

    try {
      globalFieldDataCache.loading = true;
      setLoading(true);
      setError(null);
      console.log('📊 Loading field data...');
      
      const data = await apiService.getFieldData();
      
      console.log('📊 Field data loaded:', {
        empresas: data.empresa?.length || 0,
        fundos: data.fundo?.length || 0,
        sectores: data.sector?.length || 0,
        lotes: data.lote?.length || 0,
        hierarchical: data.hierarchical ? Object.keys(data.hierarchical) : 'No hierarchical data'
      });
      
      // Update global cache
      globalFieldDataCache = {
        data,
        timestamp: Date.now(),
        loading: false
      };
      
      setFieldData(data);
    } catch (err) {
      console.error('❌ Error loading field data:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos de campo');
      globalFieldDataCache.loading = false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFieldData();
  }, [loadFieldData]);

  // Sync with global cache when it changes
  useEffect(() => {
    const checkCache = () => {
      if (globalFieldDataCache.data && globalFieldDataCache.data !== fieldData) {
        setFieldData(globalFieldDataCache.data);
        setLoading(false);
      }
      if (globalFieldDataCache.loading !== loading) {
        setLoading(globalFieldDataCache.loading);
      }
    };

    // Check immediately
    checkCache();

    // Set up interval to check for cache updates
    const interval = setInterval(checkCache, 100);

    return () => clearInterval(interval);
  }, [fieldData, loading]);

  const getFundosByEmpresa = (empresa: string): string[] => {
    if (!fieldData?.hierarchical || !fieldData.hierarchical[empresa]) {
      return [];
    }
    
    return Object.keys(fieldData.hierarchical[empresa]);
  };

  const getSectoresByEmpresaAndFundo = (empresa: string, fundo: string): string[] => {
    if (!fieldData?.hierarchical || 
        !fieldData.hierarchical[empresa] || 
        !fieldData.hierarchical[empresa][fundo]) {
      return [];
    }
    
    const sectores = Object.keys(fieldData.hierarchical[empresa][fundo]);
    return sectores;
  };

  const getLotesByEmpresaFundoAndSector = (empresa: string, fundo: string, sector: string): string[] => {
    if (!fieldData?.hierarchical || 
        !fieldData.hierarchical[empresa] || 
        !fieldData.hierarchical[empresa][fundo] || 
        !fieldData.hierarchical[empresa][fundo][sector]) {
      return [];
    }
    
    const lotes = fieldData.hierarchical[empresa][fundo][sector];
    return lotes;
  };

  return {
    fieldData,
    loading,
    error,
    refetch: loadFieldData,
    getFundosByEmpresa,
    getSectoresByEmpresaAndFundo,
    getLotesByEmpresaFundoAndSector,
  };
};
