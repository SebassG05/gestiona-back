import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  EXCEL_TOKEN_SECRET,
  FRONTEND_URL,
  JWT_SECRET,
  MICROSOFT_CLIENT_ID,
  MICROSOFT_CLIENT_SECRET,
  MICROSOFT_REDIRECT_URI,
  MICROSOFT_TENANT_ID,
} from '../config/env.js';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const AUTH_BASE_URL = `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0`;
const SCOPES = 'openid profile email offline_access User.Read Files.ReadWrite';

const encryptionKey = crypto.createHash('sha256').update(String(EXCEL_TOKEN_SECRET)).digest();

const encrypt = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((part) => part.toString('base64url')).join('.');
};

const decrypt = (value) => {
  const [ivValue, authTagValue, encryptedValue] = value.split('.');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey,
    Buffer.from(ivValue, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
};

const ensureConfigured = () => {
  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
    const error = new Error(
      'La integración Microsoft no está configurada. Añade MICROSOFT_CLIENT_ID y MICROSOFT_CLIENT_SECRET.'
    );
    error.statusCode = 503;
    throw error;
  }
};

const tokenRequest = async (params) => {
  ensureConfigured();
  const response = await fetch(`${AUTH_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error_description || 'Microsoft no pudo completar la autorización');
    error.statusCode = 502;
    throw error;
  }

  return data;
};

const graphRequest = async (accessToken, path) => {
  const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || 'Microsoft Graph no pudo completar la solicitud');
    error.statusCode = response.status === 401 ? 401 : 502;
    throw error;
  }

  return data;
};

const microsoftGraphService = {
  isConfigured: () => Boolean(MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET),

  getAuthorizationUrl: ({ portalId, userId }) => {
    ensureConfigured();
    const state = jwt.sign({ portalId, userId, purpose: 'excel-link' }, JWT_SECRET, {
      expiresIn: '10m',
    });
    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      response_type: 'code',
      redirect_uri: MICROSOFT_REDIRECT_URI,
      response_mode: 'query',
      scope: SCOPES,
      state,
      prompt: 'select_account',
    });
    return `${AUTH_BASE_URL}/authorize?${params.toString()}`;
  },

  verifyState: (state) => {
    const payload = jwt.verify(state, JWT_SECRET);
    if (payload.purpose !== 'excel-link') throw new Error('Estado OAuth no válido');
    return payload;
  },

  exchangeCode: async (code) => {
    const data = await tokenRequest({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: MICROSOFT_REDIRECT_URI,
      scope: SCOPES,
    });
    const profile = await graphRequest(data.access_token, '/me?$select=displayName,mail,userPrincipalName');

    return {
      encryptedAccessToken: encrypt(data.access_token),
      encryptedRefreshToken: encrypt(data.refresh_token),
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      microsoftAccount: profile.mail || profile.userPrincipalName || profile.displayName || '',
    };
  },

  getAccessToken: async (link, updateTokens) => {
    if (link.tokenExpiresAt.getTime() > Date.now() + 60_000) {
      return decrypt(link.encryptedAccessToken);
    }

    const data = await tokenRequest({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: decrypt(link.encryptedRefreshToken),
      redirect_uri: MICROSOFT_REDIRECT_URI,
      scope: SCOPES,
    });
    const tokenData = {
      encryptedAccessToken: encrypt(data.access_token),
      encryptedRefreshToken: encrypt(data.refresh_token || decrypt(link.encryptedRefreshToken)),
      tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
    await updateTokens(tokenData);
    return data.access_token;
  },

  listExcelFiles: async (accessToken) => {
    const data = await graphRequest(
      accessToken,
      "/me/drive/root/search(q='.xlsx')?$select=id,name,webUrl,parentReference,lastModifiedDateTime,file&$top=200"
    );
    return (data.value || [])
      .filter((item) => item.file && item.name?.toLowerCase().endsWith('.xlsx'))
      .map((item) => ({
        itemId: item.id,
        driveId: item.parentReference?.driveId,
        name: item.name,
        webUrl: item.webUrl,
        lastModifiedDateTime: item.lastModifiedDateTime,
      }));
  },

  listWorksheets: async (accessToken, { driveId, itemId }) => {
    const data = await graphRequest(
      accessToken,
      `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/workbook/worksheets?$select=id,name,visibility`
    );
    return (data.value || []).map((sheet) => ({
      id: sheet.id,
      name: sheet.name,
      visibility: sheet.visibility,
    }));
  },

  readUsedRange: async (accessToken, { driveId, itemId, worksheetId }) => {
    const data = await graphRequest(
      accessToken,
      `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/workbook/worksheets/${encodeURIComponent(worksheetId)}/usedRange(valuesOnly=true)?$select=values`
    );
    return data.values || [];
  },

  frontendRedirect: ({ portalId, status, message = '' }) => {
    const params = new URLSearchParams({ excel: status });
    if (message) params.set('message', message);
    return `${FRONTEND_URL}/dashboard/portal/${portalId}/proposals?${params.toString()}`;
  },
};

export default microsoftGraphService;
