import { CapacitorHttp } from '@capacitor/core';

// Use Vite's import.meta.env to access environment variables
const CLIENT_ID = import.meta.env.VITE_FITBIT_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_FITBIT_CLIENT_SECRET;
const REDIRECT_URI = 'geminifit://auth'; // Our custom deep link

const FITBIT_AUTH_BASE_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';
const FITBIT_REVOKE_URL = 'https://api.fitbit.com/oauth2/revoke';

/**
 * Formats a Date object into a 'YYYY-MM-DD' string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Revokes a Fitbit access or refresh token.
 * This invalidates the token, requiring the user to re-authenticate.
 * @param {string} token - The access token or refresh token to be revoked.
 * @returns {Promise<any>} A promise that resolves with the response from the Fitbit API.
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
 * Generates the Fitbit authorization URL to initiate the OAuth 2.0 flow.
 * @param {string[]} scope - An array of scopes for which to request permission.
 * @returns {string} The complete URL for the Fitbit authorization endpoint.
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
 * Exchanges an authorization code for an access token and a refresh token.
 * @param {string} code - The authorization code received from the Fitbit redirect.
 * @returns {Promise<any>} A promise that resolves with the token data from the Fitbit API, including access_token and refresh_token.
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
 * @param {string} refreshToken - The refresh token used to obtain a new access token.
 * @returns {Promise<any>} A promise that resolves with the new token data from the Fitbit API.
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
 * Fetches a user's daily activity summary from the Fitbit API.
 * @param {string} accessToken - The user's Fitbit access token.
 * @param {string} [date=getLocalDateString(new Date())] - The date for which to fetch data in 'YYYY-MM-DD' format. Defaults to the current day.
 * @returns {Promise<any>} A promise that resolves with the daily activity data.
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
 * Fetches a user's daily Heart Rate Variability (HRV) data from the Fitbit API.
 * @param {string} accessToken - The user's Fitbit access token.
 * @param {string} [date=getLocalDateString(new Date())] - The date for which to fetch data in 'YYYY-MM-DD' format. Defaults to the current day.
 * @returns {Promise<any>} A promise that resolves with the daily HRV data.
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

/**
 * Fetches a user's daily heart rate data, including resting heart rate, from the Fitbit API.
 * @param {string} accessToken - The user's Fitbit access token.
 * @param {string} [date=getLocalDateString(new Date())] - The date for which to fetch data in 'YYYY-MM-DD' format. Defaults to the current day.
 * @returns {Promise<any>} A promise that resolves with the heart rate data.
 */
export const getDailyHeartRate = async (accessToken: string, date: string = getLocalDateString(new Date())): Promise<any> => {
  const options = {
    url: `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d.json`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  };
  console.log(`FitbitService: Requesting daily heart rate from: ${options.url}`);
  const response = await CapacitorHttp.request({ ...options, method: 'GET' });
  console.log(`FitbitService: Raw daily heart rate response:`, JSON.stringify(response.data, null, 2));
  return response.data;
}

/**
 * Fetches a user's daily calorie expenditure from the Fitbit API.
 * @param {string} accessToken - The user's Fitbit access token.
 * @param {string} [date=getLocalDateString(new Date())] - The date for which to fetch data in 'YYYY-MM-DD' format. Defaults to the current day.
 * @returns {Promise<any>} A promise that resolves with the calorie data.
 */
export const getCalories = async (accessToken: string, date: string = getLocalDateString(new Date())): Promise<any> => {
  const options = {
    url: `https://api.fitbit.com/1/user/-/activities/calories/date/${date}/1d.json`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  };
  console.log(`FitbitService: Requesting daily calories from: ${options.url}`);
  const response = await CapacitorHttp.request({ ...options, method: 'GET' });
  console.log(`FitbitService: Raw daily calories response:`, JSON.stringify(response.data, null, 2));
  return response.data;
}


