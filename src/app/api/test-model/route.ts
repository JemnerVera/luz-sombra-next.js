import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const empresa = formData.get('empresa') as string;
    const fundo = formData.get('fundo') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Mock test result
    const mockResult = {
      success: true,
      fileName: file.name,
      image_name: file.name,
      porcentaje_luz: Math.random() * 100,
      porcentaje_sombra: Math.random() * 100,
      processed_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };

    console.log('✅ Mock model test completed:', mockResult.fileName);

    return NextResponse.json(mockResult);
  } catch (error) {
    console.error('❌ Error testing model:', error);
    return NextResponse.json(
      { error: 'Error testing model' },
      { status: 500 }
    );
  }
}
