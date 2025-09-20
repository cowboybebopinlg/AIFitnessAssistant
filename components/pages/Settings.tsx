import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getAuthorizationUrl } from '../../services/fitbitService';
import { Browser } from '@capacitor/browser';

const Settings: React.FC = () => {
    const { geminiApiKey, setGeminiApiKey, injectDummyFitbitData, deleteFitbitData } = useAppContext();
    const [apiKey, setApiKey] = useState(geminiApiKey || '');

    const handleSave = () => {
        setGeminiApiKey(apiKey);
        alert('API Key saved!');
    };

    const handleConnectFitbit = async () => {
        const scopes = ['activity', 'heartrate', 'sleep', 'profile', 'weight', 'oxygen_saturation', 'temperature'];
        const authUrl = getAuthorizationUrl(scopes);

        // Add listeners to handle the redirect and browser closing
        const handleRedirect = (event: { url: string }) => {
            if (event.url.startsWith('geminifit://auth')) {
                // Stop listening and close the browser when the redirect is detected
                Browser.removeAllListeners();
                Browser.close();
            }
        };

        Browser.addListener('browserPageLoaded', handleRedirect);
        Browser.addListener('browserFinished', () => {
            // Also remove listeners if the user manually closes the browser
            Browser.removeAllListeners();
        });

        // Open the in-app browser
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
                    onClick={handleInjectDummyData}
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
            </div>
        </div>
    );
};

export default Settings;
