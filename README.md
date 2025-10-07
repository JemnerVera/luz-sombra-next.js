# 🌱 Agricola Luz-Sombra - Next.js

Aplicación web para análisis de imágenes agrícolas que clasifica píxeles en suelo/malla y luz/sombra usando Machine Learning con TensorFlow.js.

## 🚀 Características

- **Machine Learning**: Clasificación de píxeles con TensorFlow.js
- **Integración Google Sheets**: Almacenamiento automático de resultados
- **Procesamiento de Imágenes**: Extracción de GPS y metadatos EXIF
- **Interfaz Moderna**: Dark mode, responsive design con Tailwind CSS
- **Deploy Ready**: Optimizado para Vercel

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **ML**: TensorFlow.js
- **APIs**: Google Sheets API
- **Deploy**: Vercel

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/JemnerVera/luz-sombra-next.js.git
cd luz-sombra-next.js

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Google Sheets

# Ejecutar en desarrollo
npm run dev
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción
npm run lint         # Verificar código
npm run lint:fix     # Corregir errores de linting
npm run type-check   # Verificar tipos TypeScript
npm run clean        # Limpiar archivos de build
```

## 🌐 Variables de Entorno

Crea un archivo `.env.local` con:

```bash
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SHEETS_SHEET_NAME=Data-app
GOOGLE_SHEETS_CREDENTIALS_BASE64=your_credentials_base64
GOOGLE_SHEETS_TOKEN_BASE64=your_token_base64

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📱 Funcionalidades

### 🔍 Analizar Imágenes
- Subida de imágenes con drag & drop
- Extracción automática de GPS y fecha EXIF
- Clasificación de píxeles en luz/sombra
- Integración con datos de campo (empresa, fundo, sector, lote)

### 🧪 Probar Modelo
- Prueba local del modelo de ML
- Comparación de imágenes original vs procesada
- Slider de comparación con overlay

### 📊 Historial
- Visualización de todos los procesamientos
- Filtros por empresa, fundo, fecha
- Exportación a CSV
- Paginación y búsqueda

## 🏗️ Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── google-sheets/ # Google Sheets integration
│   │   ├── historial/     # History API
│   │   └── procesar-imagen/ # Image processing
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ImageUploadForm.tsx
│   ├── HistoryTable.tsx
│   ├── ModelTestForm.tsx
│   └── ...
├── hooks/                 # Custom hooks
│   ├── useFieldData.ts
│   ├── useImageUpload.ts
│   └── useTensorFlow.ts
├── services/              # Business logic
│   ├── tensorflowService.ts
│   ├── googleSheetsService.ts
│   └── api.ts
├── types/                 # TypeScript types
├── utils/                 # Utilities
└── config/                # Configuration
```

## 🚀 Deploy en Vercel

1. **Conectar repositorio** a Vercel
2. **Configurar variables de entorno** en Vercel dashboard
3. **Deploy automático** en cada push

```bash
# Build local para verificar
npm run build

# Deploy (automático con Vercel)
git push origin main
```

## 📈 Rendimiento

- **Cache**: 5 minutos para datos de Google Sheets
- **Optimización**: Imágenes optimizadas automáticamente
- **Bundle**: Tree-shaking y code splitting
- **SEO**: Meta tags y Open Graph

## 🔒 Seguridad

- Variables de entorno para credenciales sensibles
- Validación de archivos de imagen
- Sanitización de inputs
- HTTPS en producción

## 📝 Licencia

Este proyecto es privado y confidencial.

## 🤝 Contribución

Para contribuir al proyecto, contacta al equipo de desarrollo.

---

**Desarrollado con ❤️ para análisis agrícola**