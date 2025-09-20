import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getAuthorizationUrl } from '../../services/fitbitService';

const Settings: React.FC = () => {
    const { geminiApiKey, setGeminiApiKey } = useAppContext();
    const [apiKey, setApiKey] = useState(geminiApiKey || '');

    const handleSave = () => {
        setGeminiApiKey(apiKey);
        alert('API Key saved!');
    };

    const handleConnectFitbit = () => {
        const authUrl = getAuthorizationUrl(['activity', 'heartrate', 'sleep', 'weight']);
        window.location.href = authUrl;
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
            </div>
        </div>
    );
};

export default Settings;
