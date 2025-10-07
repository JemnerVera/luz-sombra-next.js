import { useState, useCallback } from 'react';
import { ImageFile } from '../types';
import { extractGpsFromImage, GpsCoordinates, extractDateTimeFromImage, DateTimeInfo } from '../utils/exif';
import { createImagePreview, validateImageFile } from '../utils/helpers';
import { parseFilename } from '../utils/filenameParser';

export const useImageUpload = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);

  const addImages = useCallback(async (files: FileList | File[]) => {
    setLoading(true);
    
    try {
      const fileArray = Array.from(files);
      const newImages: ImageFile[] = [];
      
      for (const file of fileArray) {
        // Validate file
        const validation = validateImageFile(file);
        if (!validation.valid) {
          console.warn(`❌ Invalid file ${file.name}: ${validation.error}`);
          continue;
        }
        
        // Create preview
        const preview = await createImagePreview(file);
        
        // Parse filename to extract hilera and planta
        const parsedFilename = parseFilename(file.name);
        
        // Create image object
        const imageFile: ImageFile = {
          file,
          preview,
          gpsStatus: 'extracting',
          dateStatus: 'extracting',
          hilera: parsedFilename.hilera || '',
          numero_planta: parsedFilename.planta || '',
        };
        
        newImages.push(imageFile);
      }
      
      // Add all images first
      setImages(prev => [...prev, ...newImages]);
      
      // Then extract GPS and date for each image
      for (const imageFile of newImages) {
        // Extract GPS
        extractGpsFromImage(imageFile.file)
          .then((coordinates: GpsCoordinates | null) => {
            console.log(`🔍 GPS extraction for ${imageFile.file.name}:`, coordinates ? 'Found' : 'Not found');
            setImages(prev => prev.map(img => 
              img.file === imageFile.file 
                ? {
                    ...img,
                    gpsStatus: coordinates ? 'found' : 'not-found',
                    coordinates: coordinates || undefined
                  }
                : img
            ));
          })
          .catch((error) => {
            console.error(`❌ Error extracting GPS for ${imageFile.file.name}:`, error);
            setImages(prev => prev.map(img => 
              img.file === imageFile.file 
                ? { ...img, gpsStatus: 'not-found', coordinates: undefined }
                : img
            ));
          });

        // Extract date/time
        extractDateTimeFromImage(imageFile.file)
          .then((dateTime: DateTimeInfo | null) => {
            console.log(`📅 Date extraction for ${imageFile.file.name}:`, dateTime ? 'Found' : 'Not found');
            setImages(prev => prev.map(img => 
              img.file === imageFile.file 
                ? {
                    ...img,
                    dateStatus: dateTime ? 'found' : 'not-found',
                    dateTime: dateTime || undefined
                  }
                : img
            ));
          })
          .catch((error) => {
            console.error(`❌ Error extracting date for ${imageFile.file.name}:`, error);
            setImages(prev => prev.map(img => 
              img.file === imageFile.file 
                ? { ...img, dateStatus: 'not-found', dateTime: undefined }
                : img
            ));
          });
      }
    } catch (error) {
      console.error('Error adding images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeImage = useCallback((file: File) => {
    setImages(prev => prev.filter(img => img.file !== file));
    
    // Clear GPS cache for removed image
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    if (typeof window !== 'undefined' && (window as unknown as { gpsCache?: Map<string, unknown> }).gpsCache) {
      (window as unknown as { gpsCache: Map<string, unknown> }).gpsCache.delete(cacheKey);
    }
  }, []);

  const updateImageField = useCallback((file: File, field: 'hilera' | 'numero_planta', value: string) => {
    setImages(prev => prev.map(img => 
      img.file === file 
        ? { ...img, [field]: value }
        : img
    ));
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  const replaceImage = useCallback((originalFile: File, newFile: File) => {
    setImages(prev => prev.map(img => {
      if (img.file === originalFile) {
        return {
          ...img,
          file: newFile,
          preview: URL.createObjectURL(newFile)
        };
      }
      return img;
    }));
  }, []);

  const getImageCount = useCallback(() => {
    return images.length;
  }, [images]);

  const hasImages = useCallback(() => {
    return images.length > 0;
  }, [images]);

  const getValidImages = useCallback(() => {
    return images.filter(img => img.file);
  }, [images]);

  return {
    images,
    loading,
    addImages,
    removeImage,
    updateImageField,
    clearImages,
    replaceImage,
    getImageCount,
    hasImages,
    getValidImages,
  };
};
