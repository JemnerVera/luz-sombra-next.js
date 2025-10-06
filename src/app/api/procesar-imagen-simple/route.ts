import { NextRequest, NextResponse } from 'next/server';

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

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Mock processing result - in a real implementation, this would use TensorFlow.js
    const mockResult = {
      success: true,
      fileName: file.name,
      image_name: file.name,
      hilera: hilera || 'H184',
      numero_planta: numero_planta || 'P25',
      porcentaje_luz: Math.random() * 100,
      porcentaje_sombra: Math.random() * 100,
      fundo: fundo || 'Fundo Demo',
      sector: sector || 'Sector Demo',
      latitud: -12.0464 + (Math.random() - 0.5) * 0.01,
      longitud: -77.0428 + (Math.random() - 0.5) * 0.01,
      processed_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };

    console.log('✅ Mock image processing completed:', mockResult.fileName);

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('❌ Error processing image:', error);
    return NextResponse.json(
      { error: 'Error processing image' },
      { status: 500 }
    );
  }
}
