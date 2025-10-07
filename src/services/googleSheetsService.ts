import { google } from 'googleapis';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  credentials?: Record<string, unknown>;
  token?: Record<string, unknown>;
}

export interface FieldData {
  empresa: string[];
  fundo: string[];
  sector: string[];
  lote: string[];
  hierarchical: Record<string, Record<string, Record<string, string[]>>>;
}

export interface ProcessingRecord {
  id: string;
  fecha: string;
  hora: string;
  imagen: string;
  nombre_archivo: string;
  empresa: string;
  fundo: string;
  sector: string;
  lote: string;
  hilera: string;
  numero_planta: string;
  latitud: number | null;
  longitud: number | null;
  porcentaje_luz: number;
  porcentaje_sombra: number;
  dispositivo: string;
  software: string;
  direccion: string;
  timestamp: string;
}

class GoogleSheetsService {
  private auth: unknown = null;
  private sheets: ReturnType<typeof google.sheets> | null = null;
  private config: GoogleSheetsConfig | null = null;
  private historialCache: { data: ProcessingRecord[]; timestamp: number } | null = null;
  private fieldDataCache: { data: FieldData; timestamp: number } | null = null;
  private cacheTimeout = 300000; // 5 minutes cache (increased from 60 seconds)

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      // Cargar configuración desde variables de entorno
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
      const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Data-app';
      
      if (!spreadsheetId || spreadsheetId === 'demo') {
        console.log('⚠️ Usando modo demo - no hay configuración de Google Sheets');
        return;
      }

      let credentials = null;
      let token = null;

      // Cargar credenciales desde Base64
      if (process.env.GOOGLE_SHEETS_CREDENTIALS_BASE64) {
        const credentialsB64 = process.env.GOOGLE_SHEETS_CREDENTIALS_BASE64;
        const credentialsJson = Buffer.from(credentialsB64, 'base64').toString('utf-8');
        credentials = JSON.parse(credentialsJson);
      }

      // Cargar token desde Base64
      if (process.env.GOOGLE_SHEETS_TOKEN_BASE64) {
        const tokenB64 = process.env.GOOGLE_SHEETS_TOKEN_BASE64;
        const tokenJson = Buffer.from(tokenB64, 'base64').toString('utf-8');
        token = JSON.parse(tokenJson);
      }

      this.config = {
        spreadsheetId,
        sheetName,
        credentials,
        token
      };

      console.log('✅ Configuración de Google Sheets cargada');
    } catch (error) {
      console.error('❌ Error cargando configuración de Google Sheets:', error);
      this.config = null;
    }
  }

  private async authenticate(): Promise<boolean> {
    try {
      if (!this.config?.credentials || !this.config?.token) {
        console.log('⚠️ No hay credenciales o token disponibles');
        return false;
      }

      // Crear cliente OAuth2
      const credentials = this.config.credentials as {
        installed?: {
          client_id: string;
          client_secret: string;
          redirect_uris: string[];
        };
        client_id?: string;
        client_secret?: string;
        redirect_uris?: string[];
      };
      
      // Manejar tanto formato 'installed' como directo
      const clientId = credentials.installed?.client_id || credentials.client_id;
      const clientSecret = credentials.installed?.client_secret || credentials.client_secret;
      const redirectUris = credentials.installed?.redirect_uris || credentials.redirect_uris;
      
      console.log('🔍 Credenciales detectadas:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUris: !!redirectUris,
        redirectUrisLength: redirectUris?.length || 0,
        firstRedirectUri: redirectUris?.[0] || 'none'
      });
      
      if (!clientId || !clientSecret || !redirectUris || !redirectUris[0]) {
        console.error('❌ Credenciales incompletas:', {
          clientId: clientId ? 'presente' : 'ausente',
          clientSecret: clientSecret ? 'presente' : 'ausente',
          redirectUris: redirectUris ? `array con ${redirectUris.length} elementos` : 'ausente'
        });
        throw new Error('Credenciales incompletas - verificar configuración de Google OAuth');
      }
      
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUris[0]
      );

      // Establecer credenciales
      oauth2Client.setCredentials(this.config.token);

      // Crear cliente de Sheets
      this.sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      this.auth = oauth2Client;

      console.log('✅ Autenticación con Google Sheets exitosa');
      return true;
    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      return false;
    }
  }

  async getFieldData(): Promise<FieldData> {
    try {
      // Check cache first
      if (this.fieldDataCache && (Date.now() - this.fieldDataCache.timestamp) < this.cacheTimeout) {
        console.log('📊 Using cached field data');
        return this.fieldDataCache.data;
      }

      if (!this.config || this.config.spreadsheetId === 'demo') {
        return this.getDemoFieldData();
      }

      if (!this.sheets) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          return this.getDemoFieldData();
        }
      }

      // Obtener datos de la hoja 'Data-campo'
      const range = 'Data-campo!B:I';
      if (!this.sheets) {
        throw new Error('Sheets service not initialized');
      }
      
      console.log('📊 Fetching field data from Google Sheets...');
      const startTime = Date.now();
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
      });
      
      const fetchTime = Date.now() - startTime;
      console.log(`📊 Field data fetch completed in ${fetchTime}ms`);

      const values = response.data.values || [];
      if (values.length <= 1) {
        return {
          empresa: [],
          fundo: [],
          sector: [],
          lote: [],
          hierarchical: {}
        };
      }

      // Procesar datos (saltar encabezados)
      const rows = values.slice(1);
      const rawData: Array<{
        empresa: string;
        fundo: string;
        sector: string;
        lote: string;
      }> = [];

      for (const row of rows) {
        if (row.length >= 4) {
          const empresa = row[0]?.trim() || '';
          const fundo = row[2]?.trim() || '';  // Columna D (índice 2)
          const sector = row[5]?.trim() || ''; // Columna G (índice 5)
          const lote = row[7]?.trim() || '';   // Columna I (índice 7)

          if (empresa) {
            rawData.push({ empresa, fundo, sector, lote });
          }
        }
      }

      const processedData = this.processFieldData(rawData);
      
      // Cache the result
      this.fieldDataCache = {
        data: processedData,
        timestamp: Date.now()
      };
      
      return processedData;
    } catch (error) {
      console.error('❌ Error obteniendo datos de campo:', error);
      return this.getDemoFieldData();
    }
  }

  async getHistorial(): Promise<{ success: boolean; procesamientos: ProcessingRecord[] }> {
    try {
      // Check cache first
      if (this.historialCache && (Date.now() - this.historialCache.timestamp) < this.cacheTimeout) {
        console.log('📊 Using cached history data');
        return { success: true, procesamientos: this.historialCache.data };
      }

      if (!this.config || this.config.spreadsheetId === 'demo') {
        return this.getDemoHistorial();
      }

      if (!this.sheets) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          return this.getDemoHistorial();
        }
      }

      // Obtener historial de la hoja principal (últimas 500 filas, solo columnas necesarias)
      // Columnas: A=ID, B=Fecha, C=Hora, D=Imagen, E=Nombre Archivo, F=Empresa, G=Fundo, H=Sector, I=Lote, J=Hilera, K=Planta, L=Lat, M=Lng, N=Luz%, O=Sombra%, P=Dispositivo, Q=Software, R=Dirección, S=Timestamp, T=ArchivoID
      const range = `${this.config.sheetName}!A2:T500`;
      if (!this.sheets) {
        throw new Error('Sheets service not initialized');
      }
      
      console.log('📊 Fetching history data from Google Sheets...');
      const startTime = Date.now();
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
      });
      
      const fetchTime = Date.now() - startTime;
      console.log(`📊 Google Sheets fetch completed in ${fetchTime}ms`);

      const values = response.data.values || [];
      const historial: ProcessingRecord[] = [];

      for (const row of values) {
        if (row.length >= 15) {
          const record: ProcessingRecord = {
            id: row[0] || '',
            fecha: row[1] || '',
            hora: row[2] || '',
            imagen: row[3] || '',
            nombre_archivo: row[4] || '',
            empresa: row[5] || '',
            fundo: row[6] || '',
            sector: row[7] || '',
            lote: row[8] || '',
            hilera: row[9] || '',
            numero_planta: row[10] || '',
            latitud: row[11] ? parseFloat(row[11]) : null,
            longitud: row[12] ? parseFloat(row[12]) : null,
            porcentaje_luz: row[13] ? parseFloat(row[13]) : 0,
            porcentaje_sombra: row[14] ? parseFloat(row[14]) : 0,
            dispositivo: row[15] || '',
            software: row[16] || '',
            direccion: row[17] || '',
            timestamp: row[18] || ''
          };
          historial.push(record);
        }
      }

      // Cache the result
      this.historialCache = {
        data: historial,
        timestamp: Date.now()
      };

      return {
        success: true,
        procesamientos: historial
      };
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      return this.getDemoHistorial();
    }
  }

  async saveProcessingResult(result: {
    fileName: string;
    image_name: string;
    hilera: string;
    numero_planta: string;
    porcentaje_luz: number;
    porcentaje_sombra: number;
    fundo: string;
    sector: string;
    lote: string;
    empresa: string;
    latitud: number | null;
    longitud: number | null;
    processed_image: string;
    timestamp: string;
    exifDateTime?: { date: string; time: string } | null;
  }): Promise<void> {
    try {
      if (!this.config || this.config.spreadsheetId === 'demo') {
        console.log('📝 Demo mode: Would save processing result to Google Sheets');
        return;
      }

      if (!this.sheets) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          throw new Error('Could not authenticate with Google Sheets');
        }
      }

      if (!this.sheets) {
        throw new Error('Sheets service not initialized');
      }

      // Generate unique ID
      const id = `IMG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get next sequential ID
      const nextId = await this.getNextSequentialId();
      
      // Use EXIF date/time if available, otherwise use current timestamp
      const now = new Date();
      const fecha = result.exifDateTime?.date || now.toLocaleDateString('es-ES');
      const hora = result.exifDateTime?.time || now.toLocaleTimeString('es-ES');
      const timestamp = now.toISOString();

           // Prepare row data
           const rowData = [
             nextId, // ID - sequential number
             fecha,
             hora,
             result.image_name,
             result.fileName,
             result.empresa,
             result.fundo,
             result.sector,
             result.lote,
             result.hilera,
             result.numero_planta,
             result.latitud?.toString() || '',
             result.longitud?.toString() || '',
             parseFloat(result.porcentaje_luz.toFixed(2)), // Convert to number
             parseFloat(result.porcentaje_sombra.toFixed(2)), // Convert to number
             'Web App',
             'Next.js + TensorFlow.js',
             '', // direccion
             timestamp,
             id // ArchivoID - our unique identifier
           ];

      // Append to Google Sheets
      const range = `${this.config.sheetName}!A:T`;
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData]
        }
      });

           console.log('✅ Processing result saved to Google Sheets:', id);
           
           // Clear cache to force refresh on next load
           this.historialCache = null;
         } catch (error) {
           console.error('❌ Error saving processing result to Google Sheets:', error);
           throw error;
         }
  }

  private processFieldData(rawData: Array<{
    empresa: string;
    fundo: string;
    sector: string;
    lote: string;
  }>): FieldData {
    // Extraer listas únicas
    const empresas = [...new Set(rawData.map(item => item.empresa).filter(Boolean))].sort();
    const fundos = [...new Set(rawData.map(item => item.fundo).filter(Boolean))].sort();
    const sectores = [...new Set(rawData.map(item => item.sector).filter(Boolean))].sort();
    const lotes = [...new Set(rawData.map(item => item.lote).filter(Boolean))].sort();

    // Crear estructura jerárquica
    const hierarchical: Record<string, Record<string, Record<string, string[]>>> = {};

    for (const item of rawData) {
      const { empresa, fundo, sector, lote } = item;
      
      if (!empresa || !fundo || !sector || !lote) continue;

      if (!hierarchical[empresa]) {
        hierarchical[empresa] = {};
      }
      if (!hierarchical[empresa][fundo]) {
        hierarchical[empresa][fundo] = {};
      }
      if (!hierarchical[empresa][fundo][sector]) {
        hierarchical[empresa][fundo][sector] = [];
      }
      if (!hierarchical[empresa][fundo][sector].includes(lote)) {
        hierarchical[empresa][fundo][sector].push(lote);
      }
    }

    return {
      empresa: empresas,
      fundo: fundos,
      sector: sectores,
      lote: lotes,
      hierarchical
    };
  }

  private getDemoFieldData(): FieldData {
    return {
      empresa: ['Agrícola San José', 'Fundo El Paraíso', 'Cooperativa Verde'],
      fundo: ['Fundo Norte', 'Fundo Sur', 'Fundo Este', 'Fundo Oeste'],
      sector: ['Sector A', 'Sector B', 'Sector C', 'Sector D'],
      lote: ['Lote 1', 'Lote 2', 'Lote 3', 'Lote 4', 'Lote 5'],
      hierarchical: {
        'Agrícola San José': {
          'Fundo Norte': {
            'Sector A': ['Lote 1', 'Lote 2'],
            'Sector B': ['Lote 3', 'Lote 4']
          },
          'Fundo Sur': {
            'Sector C': ['Lote 5', 'Lote 6'],
            'Sector D': ['Lote 7', 'Lote 8']
          }
        },
        'Fundo El Paraíso': {
          'Fundo Este': {
            'Sector A': ['Lote 9', 'Lote 10'],
            'Sector B': ['Lote 11', 'Lote 12']
          },
          'Fundo Oeste': {
            'Sector C': ['Lote 13', 'Lote 14'],
            'Sector D': ['Lote 15', 'Lote 16']
          }
        },
        'Cooperativa Verde': {
          'Fundo Norte': {
            'Sector A': ['Lote 17', 'Lote 18'],
            'Sector B': ['Lote 19', 'Lote 20']
          },
          'Fundo Sur': {
            'Sector C': ['Lote 21', 'Lote 22'],
            'Sector D': ['Lote 23', 'Lote 24']
          }
        }
      }
    };
  }

  private getDemoHistorial(): { success: boolean; procesamientos: ProcessingRecord[] } {
    return {
      success: true,
      procesamientos: [
        {
          id: '1',
          fecha: '2024-01-15',
          hora: '10:30:00',
          imagen: 'demo1.jpg',
          nombre_archivo: 'demo1.jpg',
          empresa: 'Agrícola San José',
          fundo: 'Fundo Norte',
          sector: 'Sector A',
          lote: 'Lote 1',
          hilera: 'H184',
          numero_planta: 'P25',
          latitud: -12.0464,
          longitud: -77.0428,
          porcentaje_luz: 65.5,
          porcentaje_sombra: 34.5,
          dispositivo: 'iPhone 12',
          software: 'Camera',
          direccion: 'Lima, Perú',
          timestamp: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          fecha: '2024-01-15',
          hora: '11:45:00',
          imagen: 'demo2.jpg',
          nombre_archivo: 'demo2.jpg',
          empresa: 'Fundo El Paraíso',
          fundo: 'Fundo Este',
          sector: 'Sector B',
          lote: 'Lote 2',
          hilera: 'H185',
          numero_planta: 'P26',
          latitud: -12.0470,
          longitud: -77.0430,
          porcentaje_luz: 72.3,
          porcentaje_sombra: 27.7,
          dispositivo: 'Samsung Galaxy',
          software: 'Open Camera',
          direccion: 'Lima, Perú',
          timestamp: '2024-01-15T11:45:00Z'
        }
      ]
    };
  }

  // Get next sequential ID by reading the last row
  private async getNextSequentialId(): Promise<number> {
    try {
      if (!this.config || this.config.spreadsheetId === 'demo') {
        return 999; // Demo ID
      }

      if (!this.sheets) {
        const authenticated = await this.authenticate();
        if (!authenticated) {
          return 999; // Fallback ID
        }
      }

      if (!this.sheets) {
        return 999; // Fallback ID
      }

      // Get the last few rows to find the highest ID
      const range = `${this.config.sheetName}!A:A`; // Get all IDs in column A
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
      });

      const values = response.data.values || [];
      let maxId = 0;

      console.log(`🔍 Found ${values.length} rows in Google Sheets`);

      // Find the highest ID in all rows (skip header row)
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (row && row[0]) {
          // Remove any quotes or extra characters
          const idStr = row[0].toString().replace(/['"]/g, '').trim();
          console.log(`🔍 Row ${i}: ID = "${idStr}"`);
          if (!isNaN(Number(idStr)) && idStr !== '') {
            const id = Number(idStr);
            if (id > maxId) {
              maxId = id;
              console.log(`🔍 New max ID found: ${maxId}`);
            }
          }
        }
      }

      // If no valid ID found, start from 100
      if (maxId === 0) {
        maxId = 100;
      }

      const nextId = maxId + 1;
      console.log(`🔢 Next sequential ID: ${nextId}`);
      return nextId;
    } catch (error) {
      console.error('❌ Error getting next sequential ID:', error);
      return 999; // Fallback ID
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
