import { NextResponse } from 'next/server';
import { googleSheetsService } from '../../../../services/googleSheetsService';

export async function GET() {
  try {
    console.log('📊 Fetching field data from Google Sheets...');
    
    const fieldData = await googleSheetsService.getFieldData();
    
    console.log('📊 Field data loaded:', {
      empresas: fieldData.empresa?.length || 0,
      fundos: fieldData.fundo?.length || 0,
      sectores: fieldData.sector?.length || 0,
      lotes: fieldData.lote?.length || 0,
      hierarchical: fieldData.hierarchical ? Object.keys(fieldData.hierarchical) : 'No hierarchical data'
    });
    
    return NextResponse.json(fieldData);
  } catch (error) {
    console.error('❌ Error fetching field data:', error);
    return NextResponse.json(
      { error: 'Error fetching field data' },
      { status: 500 }
    );
  }
}
