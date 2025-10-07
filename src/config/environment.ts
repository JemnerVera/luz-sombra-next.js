// Environment configuration for Next.js
export const config = {
  // Use relative URLs in production (works with any Vercel domain)
  // Use absolute URL only in development
  apiUrl: process.env.NODE_ENV === 'production' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
  googleSheetsConfig: process.env.GOOGLE_SHEETS_CREDENTIALS_BASE64 || '',
  googleSheetsToken: process.env.GOOGLE_SHEETS_TOKEN_BASE64 || '',
  googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  googleSheetsSheetName: process.env.GOOGLE_SHEETS_SHEET_NAME || '',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
