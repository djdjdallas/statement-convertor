import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file'
];

export function getAuthUrl(state) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: state,
    prompt: 'consent'
  });
}

export async function getTokensFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export async function getUserInfo(accessToken) {
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: 'v2'
  });
  
  const { data } = await oauth2.userinfo.get();
  return data;
}

export function getDriveClient(accessToken) {
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  
  return google.drive({
    version: 'v3',
    auth: oauth2Client
  });
}

export async function uploadToDrive(accessToken, fileName, fileBuffer, mimeType) {
  const drive = getDriveClient(accessToken);
  
  const fileMetadata = {
    name: fileName,
    mimeType: mimeType
  };
  
  const media = {
    mimeType: mimeType,
    body: fileBuffer
  };
  
  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink'
  });
  
  return response.data;
}

export async function createDriveFolder(accessToken, folderName) {
  const drive = getDriveClient(accessToken);
  
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  const response = await drive.files.create({
    resource: fileMetadata,
    fields: 'id, name'
  });
  
  return response.data;
}

export async function listDriveFiles(accessToken, query = {}) {
  const drive = getDriveClient(accessToken);
  
  const params = {
    pageSize: 20,
    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)',
    ...query
  };
  
  const response = await drive.files.list(params);
  return response.data;
}