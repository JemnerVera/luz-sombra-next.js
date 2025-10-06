// Environment configuration for Next.js
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
  googleSheetsConfig: process.env.GOOGLE_SHEETS_CREDENTIALS_BASE64 || '',
  googleSheetsToken: process.env.GOOGLE_SHEETS_TOKEN_BASE64 || '',
  googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  googleSheetsSheetName: process.env.GOOGLE_SHEETS_SHEET_NAME || '',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
