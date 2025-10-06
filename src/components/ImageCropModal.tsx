'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { X, Check, RotateCw } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (croppedFile: File) => void;
  imageSrc: string;
  imageName: string;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ 
  isOpen, 
  onClose, 
  onCrop, 
  imageSrc, 
  imageName 
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect || 1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, [aspect]);

  const onDownloadCropClick = useCallback(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    canvas.toBlob((blob) => {
      if (blob) {
        // Generate a new filename that indicates it's cropped
        const originalName = imageName.replace(/\.[^/.]+$/, ''); // Remove extension
        const extension = imageName.split('.').pop() || 'jpg';
        const croppedFileName = `${originalName}_cropped.${extension}`;
        
        const croppedFile = new File([blob], croppedFileName, {
          type: blob.type,
        });
        onCrop(croppedFile);
        onClose();
      }
    }, 'image/jpeg', 0.95);
  }, [completedCrop, imageName, onCrop, onClose]);

  const handleRotate = () => {
    setRotate(prev => (prev + 90) % 360);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-10">
        <h3 className="text-lg font-semibold">
          Recortar: {imageName}
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-20 flex space-x-2 z-10">
        <button
          onClick={handleRotate}
          className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors"
          title="Rotar"
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <button
          onClick={onDownloadCropClick}
          className="p-2 bg-green-600 hover:bg-green-700 rounded-full text-white transition-colors"
          title="Aplicar recorte"
        >
          <Check className="h-5 w-5" />
        </button>
      </div>

      {/* Crop Area */}
      <div className="flex items-center justify-center w-full h-full p-8">
        <div className="max-w-4xl max-h-4xl">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              style={{
                transform: `scale(${scale}) rotate(${rotate}deg)`,
                maxHeight: '70vh',
                maxWidth: '70vw',
              }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>
      </div>

      {/* Aspect Ratio Controls */}
      <div className="absolute bottom-4 left-4 flex space-x-2 z-10">
        <button
          onClick={() => setAspect(undefined)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            aspect === undefined 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-600 text-white hover:bg-gray-500'
          }`}
        >
          Libre
        </button>
        <button
          onClick={() => setAspect(1)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            aspect === 1 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-600 text-white hover:bg-gray-500'
          }`}
        >
          1:1
        </button>
        <button
          onClick={() => setAspect(16 / 9)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            aspect === 16 / 9 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-600 text-white hover:bg-gray-500'
          }`}
        >
          16:9
        </button>
        <button
          onClick={() => setAspect(4 / 3)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            aspect === 4 / 3 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-600 text-white hover:bg-gray-500'
          }`}
        >
          4:3
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        Arrastra para seleccionar área • ESC para cerrar
      </div>

      {/* Hidden canvas for crop preview */}
      <canvas
        ref={previewCanvasRef}
        style={{
          display: 'none',
        }}
      />
    </div>
  );
};

export default ImageCropModal;
