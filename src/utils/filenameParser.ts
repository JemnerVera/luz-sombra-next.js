// Parser para extraer información de nombres de archivo

export interface ParsedFilename {
  hilera?: string;
  planta?: string;
  isValid: boolean;
}

/**
 * Parsea el nombre del archivo para extraer hilera y planta
 * Formato esperado: E07_92_H184_P25.jpg
 * - H184 -> hilera = 184
 * - P25 -> planta = 25
 */
export const parseFilename = (filename: string): ParsedFilename => {
  try {
    // Remover extensión del archivo
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Patrón para detectar formato: E07_92_H184_P25
    // Busca H seguido de números y P seguido de números
    const hileraMatch = nameWithoutExt.match(/H(\d+)/);
    const plantaMatch = nameWithoutExt.match(/P(\d+)/);
    
    if (hileraMatch && plantaMatch) {
      return {
        hilera: hileraMatch[1],
        planta: plantaMatch[1],
        isValid: true
      };
    }
    
    // Si no encuentra el patrón completo, intentar otros formatos
    // Formato alternativo: H184_P25
    const altHileraMatch = nameWithoutExt.match(/H(\d+)/);
    const altPlantaMatch = nameWithoutExt.match(/P(\d+)/);
    
    if (altHileraMatch && altPlantaMatch) {
      return {
        hilera: altHileraMatch[1],
        planta: altPlantaMatch[1],
        isValid: true
      };
    }
    
    return {
      isValid: false
    };
  } catch (error) {
    console.error('Error parsing filename:', error);
    return {
      isValid: false
    };
  }
};

/**
 * Valida si un nombre de archivo tiene el formato esperado
 */
export const isValidFilenameFormat = (filename: string): boolean => {
  const parsed = parseFilename(filename);
  return parsed.isValid;
};

/**
 * Ejemplos de nombres de archivo válidos:
 * - E07_92_H184_P25.jpg
 * - E07_92_H114_P22.jpg
 * - E07_92_H119_P10.jpg
 * - H184_P25.jpg
 * - IMG_H123_P45.png
 */
