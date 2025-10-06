// EXIF utilities for GPS extraction

declare global {
  interface Window {
    EXIF: {
      getData: (file: File, callback: (this: File) => void) => void;
      getTag: (file: File, tag: string) => number[] | string | undefined;
    };
  }
}

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

// Cache para evitar extracciones duplicadas
const gpsCache = new Map<string, GpsCoordinates | null>();

export const extractGpsFromImage = (file: File): Promise<GpsCoordinates | null> => {
  return new Promise((resolve) => {
    // Check cache first
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    if (gpsCache.has(cacheKey)) {
      const cached = gpsCache.get(cacheKey);
      console.log(`📋 Using cached GPS data for ${file.name}:`, cached ? 'Found' : 'Not found');
      resolve(cached || null);
      return;
    }

    // Check if EXIF.js is available
    if (typeof window.EXIF === 'undefined') {
      console.warn('EXIF.js not loaded for file:', file.name);
      gpsCache.set(cacheKey, null);
      resolve(null);
      return;
    }

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('GPS extraction timeout for file:', file.name);
      gpsCache.set(cacheKey, null);
      resolve(null);
    }, 5000); // 5 second timeout

    window.EXIF.getData(file, function(this: File) {
      clearTimeout(timeout);
      
      try {
        const lat = window.EXIF.getTag(this, "GPSLatitude");
        const latRef = window.EXIF.getTag(this, "GPSLatitudeRef");
        const lon = window.EXIF.getTag(this, "GPSLongitude");
        const lonRef = window.EXIF.getTag(this, "GPSLongitudeRef");
        
        console.log(`🔍 EXIF data for ${file.name}:`, { lat, latRef, lon, lonRef });
        
        if (lat && lon && latRef && lonRef && Array.isArray(lat) && Array.isArray(lon)) {
          // Convert GPS coordinates to decimal degrees
          const latDecimal = convertDMSToDD(lat, latRef as string);
          const lonDecimal = convertDMSToDD(lon, lonRef as string);
          
          const coordinates = {
            lat: latDecimal,
            lng: lonDecimal
          };
          
          console.log(`✅ GPS coordinates for ${file.name}:`, coordinates);
          gpsCache.set(cacheKey, coordinates);
          resolve(coordinates);
        } else {
          console.log(`❌ No GPS data found for ${file.name}`);
          gpsCache.set(cacheKey, null);
          resolve(null);
        }
      } catch (error) {
        console.error(`❌ Error processing EXIF for ${file.name}:`, error);
        gpsCache.set(cacheKey, null);
        resolve(null);
      }
    });
  });
};

// Convert DMS (Degrees, Minutes, Seconds) to DD (Decimal Degrees)
const convertDMSToDD = (dms: number[], ref: string): number => {
  let dd = dms[0] + dms[1]/60 + dms[2]/(60*60);
  if (ref === "S" || ref === "W") {
    dd = dd * -1;
  }
  return dd;
};

export const formatCoordinates = (coordinates: GpsCoordinates): string => {
  return `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
};

// EXIF library is loaded dynamically in App.tsx
