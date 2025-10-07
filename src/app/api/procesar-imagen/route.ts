import { NextRequest, NextResponse } from 'next/server';
import { googleSheetsService } from '../../../services/googleSheetsService';
import { TensorFlowService } from '../../../services/tensorflowService';
import { createCanvas, loadImage } from 'canvas';
import { parseFilename } from '../../../utils/filenameParser';
import { extractDateTimeFromImageServer } from '../../../utils/exif-server';

// Singleton instance for server-side TensorFlow
let serverTensorFlowService: TensorFlowService | null = null;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const empresa = formData.get('empresa') as string;
    const fundo = formData.get('fundo') as string;
    const sector = formData.get('sector') as string;
    const lote = formData.get('lote') as string;
    const hilera = formData.get('hilera') as string;
    const numero_planta = formData.get('numero_planta') as string;
    const latitud = formData.get('latitud') ? parseFloat(formData.get('latitud') as string) : null;
    const longitud = formData.get('longitud') ? parseFloat(formData.get('longitud') as string) : null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('🚀 Processing image:', file.name);

    // Initialize TensorFlow.js singleton if not already done
    if (!serverTensorFlowService) {
      console.log('🧠 Initializing server-side TensorFlow.js...');
      serverTensorFlowService = new TensorFlowService();
      await serverTensorFlowService.initialize();
      await serverTensorFlowService.createModel();
      await serverTensorFlowService.trainModel();
    }

    // Process image with TensorFlow.js using Node.js canvas
    const imageBuffer = await file.arrayBuffer();
    
    // Load image using canvas (Node.js compatible)
    const img = await loadImage(Buffer.from(imageBuffer));
    
    // Create canvas and get ImageData
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(img, 0, 0);
    const imageDataResult = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Process with TensorFlow.js
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tfResult = await serverTensorFlowService.classifyImagePixels(imageDataResult as any);

    // Extract data from filename (if available)
    const filenameData = parseFilename(file.name);
    const finalHilera = hilera || filenameData.hilera || '';
    const finalNumeroPlanta = numero_planta || filenameData.planta || '';

    // Extract date/time from EXIF (if available)
    let exifDateTime = null;
    try {
      exifDateTime = await extractDateTimeFromImageServer(file);
      if (exifDateTime) {
        console.log(`📅 EXIF date extracted: ${exifDateTime.date} ${exifDateTime.time}`);
      } else {
        console.log(`⚠️ No EXIF date found for ${file.name}`);
      }
    } catch (error) {
      console.log('⚠️ Could not extract EXIF date/time:', error);
    }

    // Create processing result
    const processingResult = {
      success: true,
      fileName: file.name,
      image_name: file.name,
      hilera: finalHilera,
      numero_planta: finalNumeroPlanta,
      porcentaje_luz: tfResult.lightPercentage,
      porcentaje_sombra: tfResult.shadowPercentage,
      fundo: fundo || 'Unknown',
      sector: sector || 'Unknown',
      lote: lote || 'Unknown',
      empresa: empresa || 'Unknown',
      latitud: latitud || null,
      longitud: longitud || null,
      processed_image: tfResult.processedImageData,
      timestamp: new Date().toISOString(),
      exifDateTime: exifDateTime
    };

    // Save to Google Sheets
    try {
      await googleSheetsService.saveProcessingResult(processingResult);
      console.log('✅ Processing result saved to Google Sheets');
    } catch (sheetsError) {
      console.error('⚠️ Error saving to Google Sheets:', sheetsError);
      // Continue even if Google Sheets fails
    }

    console.log('✅ Image processing completed:', processingResult.fileName);

    return NextResponse.json(processingResult);
  } catch (error) {
    console.error('❌ Error processing image:', error);
    return NextResponse.json(
      { error: 'Error processing image' },
      { status: 500 }
    );
  }
}

// Helper function to extract data from filename
function extractDataFromFilename(filename: string) {
  // Example: E07_92_H119_P10.jpg
  const match = filename.match(/(\w+)_(\d+)_H(\d+)_P(\d+)\./);
  
  if (match) {
    return {
      hilera: `H${match[3]}`,
      numero_planta: `P${match[4]}`,
      latitud: null,
      longitud: null
    };
  }
  
  return {
    hilera: '',
    numero_planta: '',
    latitud: null,
    longitud: null
  };
}
