import { NextResponse } from 'next/server';
import { googleSheetsService } from '../../../services/googleSheetsService';

export async function GET() {
  try {
    console.log('📊 Fetching history from Google Sheets...');
    
    const historial = await googleSheetsService.getHistorial();
    
    console.log('📊 History loaded:', {
      success: historial.success,
      count: historial.procesamientos?.length || 0
    });
    
    return NextResponse.json(historial);
  } catch (error) {
    console.error('❌ Error fetching history:', error);
    return NextResponse.json(
      { error: 'Error fetching history' },
      { status: 500 }
    );
  }
}
