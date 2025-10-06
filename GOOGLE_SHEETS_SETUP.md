# Configuración de Google Sheets

Para conectar la aplicación con Google Sheets real (en lugar de usar datos mock), necesitas configurar las siguientes variables de entorno:

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# ID de la hoja de cálculo de Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# Nombre de la hoja (por defecto: Data-app)
GOOGLE_SHEETS_SHEET_NAME=Data-app

# Credenciales de Google Cloud Console (en Base64)
GOOGLE_SHEETS_CREDENTIALS_BASE64=your_credentials_base64_here

# Token de acceso (en Base64)
GOOGLE_SHEETS_TOKEN_BASE64=your_token_base64_here

# API URL (para desarrollo local)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Pasos para Configurar Google Sheets

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Sheets API**

### 2. Crear Credenciales OAuth 2.0

1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth 2.0 Client IDs**
3. Selecciona **Web application**
4. Agrega `http://localhost:3000` en **Authorized redirect URIs**
5. Descarga el archivo JSON de credenciales

### 3. Convertir Credenciales a Base64

```bash
# En Windows (PowerShell)
$credentials = Get-Content -Path "credentials.json" -Raw
$credentialsB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($credentials))
Write-Output $credentialsB64

# En Linux/Mac
cat credentials.json | base64
```

### 4. Obtener Token de Acceso

1. Ejecuta el script de autenticación (ver sección siguiente)
2. Autoriza la aplicación en el navegador
3. Se generará un archivo `token.json`
4. Convierte el token a Base64:

```bash
# En Windows (PowerShell)
$token = Get-Content -Path "token.json" -Raw
$tokenB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($token))
Write-Output $tokenB64

# En Linux/Mac
cat token.json | base64
```

### 5. Configurar la Hoja de Cálculo

Tu hoja de Google Sheets debe tener:

1. **Hoja "Data-campo"** con las columnas:
   - B: Empresa
   - D: Fundo  
   - G: Sector
   - I: Lote

2. **Hoja "Data-app"** (o el nombre que especifiques) con los encabezados:
   - ID, Fecha, Hora, Imagen, Nombre Archivo, Empresa, Fundo, Sector, Lote, Hilera, N° Planta, Latitud, Longitud, Porcentaje Luz, Porcentaje Sombra, Dispositivo, Software, Dirección, Timestamp

## Script de Autenticación

Para generar el token inicial, puedes usar este script de Node.js:

```javascript
const { google } = require('googleapis');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function authenticate() {
  const auth = new google.auth.OAuth2(
    'YOUR_CLIENT_ID',
    'YOUR_CLIENT_SECRET',
    'http://localhost:3000'
  );

  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Autoriza esta aplicación visitando esta URL:', authUrl);
  
  // Después de autorizar, obtén el código y úsalo aquí
  const { tokens } = await auth.getToken('AUTHORIZATION_CODE');
  auth.setCredentials(tokens);
  
  fs.writeFileSync('token.json', JSON.stringify(tokens));
  console.log('Token guardado en token.json');
}

authenticate().catch(console.error);
```

## Modo Demo

Si no configuras las variables de entorno, la aplicación funcionará en **modo demo** con datos de ejemplo. Esto es útil para desarrollo y pruebas.

## Verificación

Para verificar que la configuración funciona:

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Ve a `http://localhost:3000`
3. Los comboboxes deberían mostrar datos reales de Google Sheets
4. La pestaña "Historial" debería mostrar registros reales

## Solución de Problemas

### Error: "Google Sheets no configurado"
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto

### Error: "Token expirado"
- Regenera el token siguiendo los pasos 4 y 5
- Los tokens OAuth 2.0 pueden expirar y necesitar renovación

### Error: "No se encontró la hoja"
- Verifica que el `GOOGLE_SHEETS_SPREADSHEET_ID` sea correcto
- Asegúrate de que la hoja "Data-campo" exista en tu Google Sheets
- Verifica que tengas permisos de lectura en la hoja de cálculo
