import { CapacitorHttp } from '@capacitor/core';

// Use Vite's import.meta.env to access environment variables
const CLIENT_ID = import.meta.env.VITE_FITBIT_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_FITBIT_CLIENT_SECRET;
const REDIRECT_URI = 'geminifit://auth'; // Our custom deep link

const FITBIT_AUTH_BASE_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_REVOKE_URL = 'https://api.fitbit.com/oauth2/revoke';

// Helper function to get local date in YYYY-MM-DD format
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Revokes a Fitbit token (access token or refresh token).
 * @param token - The token to revoke.
 * @returns A promise that resolves when the token is revoked.
 */
export const revokeToken = async (token: string): Promise<any> => {
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const options = {
    url: FITBIT_REVOKE_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    data: new URLSearchParams({
      token: token,
    }).toString(),
  };

  const response = await CapacitorHttp.request({ ...options, method: 'POST' });
  return response.data;
};

/**
 * Generates the Fitbit authorization URL.
 * @param scope - An array of scopes you are requesting access to.
 * @returns The full URL for the authorization endpoint.
 */
export const getAuthorizationUrl = (scope: string[]): string => {
  // Add default scopes if not already present
  const defaultScopes = ['activity', 'heartrate', 'location', 'nutrition', 'profile', 'settings', 'sleep', 'social', 'weight', 'oxygen_saturation', 'temperature'];
  const mergedScopes = Array.from(new Set([...defaultScopes, ...scope]));
  const scopes = mergedScopes.join(' ');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: scopes,
    expires_in: '604800', // 1 week
  });
  return `${FITBIT_AUTH_BASE_URL}?${params.toString()}`;
};

/**
 * Exchanges the authorization code for an access token and refresh token.
 * @param code - The authorization code received from the Fitbit redirect.
 * @returns A promise that resolves with the token data.
 */
export const exchangeCodeForTokens = async (code: string): Promise<any> => {
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const options = {
    url: FITBIT_TOKEN_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    data: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  };

  const response = await CapacitorHttp.request({ ...options, method: 'POST' });
  return response.data;
};

/**
 * Refreshes an expired access token using a refresh token.
 * @param refreshToken - The refresh token.
 * @returns A promise that resolves with the new token data.
 */
export const refreshAccessToken = async (refreshToken: string): Promise<any> => {
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const options = {
    url: FITBIT_TOKEN_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    data: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  };

  const response = await CapacitorHttp.request({ ...options, method: 'POST' });
  return response.data;
};

/**
 * Fetches daily activity data using the native Capacitor HTTP plugin to avoid CORS.
 * @param accessToken - The user's access token.
 * @param date - The date for which to fetch data (e.g., '2025-09-21' or 'today').
 * @returns A promise that resolves with the activity data.
 */
export const getDailyActivity = async (accessToken: string, date: string = getLocalDateString(new Date())): Promise<any> => {
  const options = {
    url: `https://api.fitbit.com/1/user/-/activities/date/${date}.json`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  };
  console.log(`FitbitService: Requesting daily activity from: ${options.url}`);
  const response = await CapacitorHttp.request({ ...options, method: 'GET' });
  console.log(`FitbitService: Raw daily activity response:`, JSON.stringify(response.data, null, 2));
  return response.data;
};

/**
 * Fetches daily Heart Rate Variability (HRV) data using the native Capacitor HTTP plugin.
 * @param accessToken - The user's access token.
 * @param date - The date for which to fetch data (e.g., '2025-09-21').
 * @returns A promise that resolves with the HRV data.
 */
export const getDailyHRV = async (accessToken: string, date: string = getLocalDateString(new Date())): Promise<any> => {
  const options = {
    url: `https://api.fitbit.com/1/user/-/hrv/date/${date}.json`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  };
  console.log(`FitbitService: Requesting daily HRV from: ${options.url}`);
  const response = await CapacitorHttp.request({ ...options, method: 'GET' });
  console.log(`FitbitService: Raw daily HRV response:`, JSON.stringify(response.data, null, 2));
  return response.data;
};


