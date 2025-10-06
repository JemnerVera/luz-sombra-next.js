import { useState, useEffect, useCallback } from 'react';
import { FieldData } from '../types';
import { apiService } from '../services/api';

export const useFieldData = () => {
  const [fieldData, setFieldData] = useState<FieldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFieldData = useCallback(async () => {
    try {
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
      
      setFieldData(data);
    } catch (err) {
      console.error('❌ Error loading field data:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos de campo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFieldData();
  }, [loadFieldData]);

  const getFundosByEmpresa = (empresa: string): string[] => {
    if (!fieldData?.hierarchical || !fieldData.hierarchical[empresa]) {
      console.log('🔍 No hierarchical data for empresa:', empresa);
      return [];
    }
    
    const fundos = Object.keys(fieldData.hierarchical[empresa]);
    console.log('🔍 Fundos for empresa', empresa, ':', fundos);
    return fundos;
  };

  const getSectoresByEmpresaAndFundo = (empresa: string, fundo: string): string[] => {
    if (!fieldData?.hierarchical || 
        !fieldData.hierarchical[empresa] || 
        !fieldData.hierarchical[empresa][fundo]) {
      console.log('🔍 No hierarchical data for empresa/fundo:', empresa, fundo);
      return [];
    }
    
    const sectores = Object.keys(fieldData.hierarchical[empresa][fundo]);
    console.log('🔍 Sectores for empresa/fundo', empresa, fundo, ':', sectores);
    return sectores;
  };

  const getLotesByEmpresaFundoAndSector = (empresa: string, fundo: string, sector: string): string[] => {
    if (!fieldData?.hierarchical || 
        !fieldData.hierarchical[empresa] || 
        !fieldData.hierarchical[empresa][fundo] || 
        !fieldData.hierarchical[empresa][fundo][sector]) {
      console.log('🔍 No hierarchical data for empresa/fundo/sector:', empresa, fundo, sector);
      return [];
    }
    
    const lotes = fieldData.hierarchical[empresa][fundo][sector];
    console.log('🔍 Lotes for empresa/fundo/sector', empresa, fundo, sector, ':', lotes);
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
