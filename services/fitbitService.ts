import { CapacitorHttp } from '@capacitor/core';

// IMPORTANT: Replace these with your actual Fitbit API credentials
// For production, these should be stored securely (e.g., environment variables, backend)
const CLIENT_ID = 'YOUR_FITBIT_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_FITBIT_CLIENT_SECRET'; // Keep this secure, ideally on a backend
const REDIRECT_URI = 'http://localhost:3000/fitbit-callback'; // Or your app's deep link/web URL

const FITBIT_AUTH_BASE_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_API_BASE_URL = 'https://api.fitbit.com/1/user/-';

export const getAuthorizationUrl = (scope: string[]): string => {
  const scopes = scope.join('%20');
  return `${FITBIT_AUTH_BASE_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}`;
};

export const exchangeCodeForTokens = async (code: string): Promise<any> => {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
  };
  const data = `grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`;

  const response = await CapacitorHttp.post({
    url: FITBIT_TOKEN_URL,
    headers: headers,
    data: data,
  });
  return response.data; // Contains access_token, refresh_token, expires_in
};

export const refreshAccessToken = async (refreshToken: string): Promise<any> => {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
  };
  const data = `grant_type=refresh_token&refresh_token=${refreshToken}`;

  const response = await CapacitorHttp.post({
    url: FITBIT_TOKEN_URL,
    headers: headers,
    data: data,
  });
  return response.data;
};

export const getDailyActivity = async (accessToken: string, date: string = 'today'): Promise<any> => {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
  };

  const response = await CapacitorHttp.get({
    url: `${FITBIT_API_BASE_URL}/activities/date/${date}.json`,
    headers: headers,
  });
  return response.data;
};

// You can add more Fitbit API calls here (e.g., sleep, heart rate, etc.)
