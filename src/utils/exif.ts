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

export interface DateTimeInfo {
  date: string;
  time: string;
}

// Extract date and time from EXIF data
export const extractDateTimeFromImage = (file: File): Promise<DateTimeInfo | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.EXIF) {
      resolve(null);
      return;
    }

    const cacheKey = `${file.name}_${file.size}_${file.lastModified}_datetime`;
    if (typeof window !== 'undefined' && (window as unknown as { dateTimeCache?: Map<string, unknown> }).dateTimeCache) {
      const cached = (window as unknown as { dateTimeCache: Map<string, unknown> }).dateTimeCache.get(cacheKey);
      if (cached !== undefined) {
        resolve(cached as DateTimeInfo | null);
        return;
      }
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.EXIF.getData as any)(img, () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dateTime = (window.EXIF.getTag as any)(img, 'DateTime') as string | undefined;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dateTimeOriginal = (window.EXIF.getTag as any)(img, 'DateTimeOriginal') as string | undefined;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dateTimeDigitized = (window.EXIF.getTag as any)(img, 'DateTimeDigitized') as string | undefined;
          
          // Try different EXIF date fields
          const dateTimeValue = dateTimeOriginal || dateTimeDigitized || dateTime;
          
          if (dateTimeValue && typeof dateTimeValue === 'string') {
            // EXIF date format: "YYYY:MM:DD HH:MM:SS"
            const [datePart, timePart] = dateTimeValue.split(' ');
            if (datePart && timePart) {
              // Convert to more readable format
              const [year, month, day] = datePart.split(':');
              const [hour, minute, second] = timePart.split(':');
              
              const date = `${day}/${month}/${year}`;
              const time = `${hour}:${minute}:${second}`;
              
              const result: DateTimeInfo = { date, time };
              
              // Cache the result
              if (typeof window !== 'undefined' && (window as unknown as { dateTimeCache?: Map<string, unknown> }).dateTimeCache) {
                (window as unknown as { dateTimeCache: Map<string, unknown> }).dateTimeCache.set(cacheKey, result);
              }
              
              console.log(`📅 Date/Time found for ${file.name}: ${date} ${time}`);
              resolve(result);
            } else {
              console.log(`❌ Invalid date format for ${file.name}: ${dateTimeValue}`);
              resolve(null);
            }
          } else {
            console.log(`❌ No date/time data found for ${file.name}`);
            resolve(null);
          }
        });
      } catch (error) {
        console.error(`❌ Error processing EXIF date for ${file.name}:`, error);
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    
    img.onerror = () => {
      console.error(`❌ Error loading image for date extraction: ${file.name}`);
      URL.revokeObjectURL(url);
      resolve(null);
    };
    
    img.src = url;
  });
};

// EXIF library is loaded dynamically in App.tsx
