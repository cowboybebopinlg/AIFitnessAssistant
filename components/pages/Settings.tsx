import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getAuthorizationUrl, exchangeCodeForTokens, revokeToken } from '../../services/fitbitService';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { WebViewCache } from 'capacitor-plugin-webview-cache';
import { Preferences } from '@capacitor/preferences';

/**
 * The settings page component for the application.
 * It allows users to manage their Gemini API key, connect or disconnect from Fitbit,
 * and perform data management actions like injecting dummy data or clearing saved data.
 * @returns {JSX.Element} The rendered settings page component.
 */
const Settings: React.FC = () => {
    const { geminiApiKey, setGeminiApiKey, injectDummyFitbitData, deleteFitbitData, authenticateFitbit } = useAppContext();
    const [apiKey, setApiKey] = useState(geminiApiKey || '');
    const navigate = useNavigate();

    const handleSave = () => {
        setGeminiApiKey(apiKey);
        alert('API Key saved!');
    };

    const handleConnectFitbit = async () => {
        const scopes = ['activity', 'heartrate', 'sleep', 'profile', 'weight', 'oxygen_saturation', 'temperature'];
        const authUrl = getAuthorizationUrl(scopes);

        // Add listeners to handle the redirect and browser closing
        const handleRedirect = async (event: { url: string }) => {
            console.log('handleRedirect called with URL:', event.url);
            if (event.url.startsWith('geminifit://auth')) {
                console.log('Redirect URL matches geminifit://auth');
                Browser.removeAllListeners();
                Browser.close();

                const url = new URL(event.url);
                const code = url.searchParams.get('code');
                console.log('Extracted code:', code);

                if (code) {
                    try {
                        const tokenData = await exchangeCodeForTokens(code);
                        console.log('Fitbit Token Data:', tokenData);
                        await authenticateFitbit(tokenData);
                        alert('Fitbit connected successfully!');
                    } catch (error) {
                        console.error('Error exchanging code for tokens:', error);
                        alert('Failed to connect Fitbit.');
                    }
                } else {
                    alert('Fitbit authorization failed: No code received.');
                }
            }
        };

        App.addListener('appUrlOpen', handleRedirect);
        Browser.addListener('browserFinished', () => {
            // Also remove listeners if the user manually closes the browser
            Browser.removeAllListeners();
            App.removeAllListeners(); // Also remove appUrlOpen listener
        });

        // Clear cookies/cache before opening the in-app browser to ensure a fresh authorization flow
        if (Capacitor.getPlatform() === 'android') {
            await WebViewCache.clearCache();
        } else {
            await Browser.clearCookies();
        }
        await Browser.open({ url: authUrl });
    };

    const handleInjectDummyData = () => {
        injectDummyFitbitData();
        alert('Dummy Fitbit data injected!');
    };

    const handleDeleteSavedData = () => {
        deleteFitbitData();
        alert('Saved Fitbit data deleted!');
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <div className="space-y-4">
                <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
                >
                    Edit User Profile
                </button>
                <div>
                    <label htmlFor="gemini-api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gemini API Key</label>
                    <input
                        type="password"
                        id="gemini-api-key"
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleSave}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary mb-4"
                >
                    Save
                </button>
                <button
                    onClick={handleConnectFitbit}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Connect Fitbit
                </button>
                <button
                    // onClick={handleInjectDummyData} // Temporarily disabled for debugging
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    Inject Dummy Data
                </button>
                <button
                    onClick={handleDeleteSavedData}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Delete Saved Data
                </button>
                <button
                    onClick={async () => {
                        // Attempt to revoke the refresh token with Fitbit
                        const { value: refreshToken } = await Preferences.get({ key: 'fitbit_refresh_token' });
                        if (refreshToken) {
                            try {
                                await revokeToken(refreshToken);
                                console.log('Fitbit refresh token revoked successfully.');
                            } catch (error) {
                                console.error('Error revoking Fitbit refresh token:', error);
                            }
                        }

                        deleteFitbitData();
                        if (Capacitor.getPlatform() === 'android') {
                            await WebViewCache.clearCache();
                        } else {
                            await Browser.clearCookies();
                        }
                        localStorage.clear();
                        sessionStorage.clear();
                        alert('Fitbit cookies, cache, and all local/session storage data cleared!');
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 mt-2"
                >
                    Clear Fitbit Cookies & Data
                </button>
            </div>
        </div>
    );
};

export default Settings;
