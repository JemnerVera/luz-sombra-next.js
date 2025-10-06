import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API Agrícola Luz-Sombra funcionando correctamente',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
