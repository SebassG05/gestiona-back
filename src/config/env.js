import 'dotenv/config';

export const PORT = process.env.PORT || 3016;
export const MONGO_URI = process.env.MONGO_URI;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER;
export const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:4016';
export const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
export const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
export const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
export const MICROSOFT_REDIRECT_URI =
  process.env.MICROSOFT_REDIRECT_URI ||
  `http://localhost:${PORT}/api/portals/microsoft/callback`;
export const EXCEL_TOKEN_SECRET = process.env.EXCEL_TOKEN_SECRET || JWT_SECRET;
