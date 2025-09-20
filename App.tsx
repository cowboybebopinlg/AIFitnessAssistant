import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Dashboard from './components/pages/Dashboard';
import DailyLog from './components/pages/DailyLog';
import Trends from './components/pages/Trends';
import Library from './components/pages/Library';
import Settings from './components/pages/Settings';
import AddFoodPage from './components/pages/AddFoodPage'; // Import AddFoodPage
import ChooseWorkoutType from './components/pages/ChooseWorkoutType';
import AddCardioWorkoutPage from './components/pages/AddCardioWorkoutPage';
import AddWeightliftingWorkoutPage from './components/pages/AddWeightliftingWorkoutPage';
import { AppProvider } from './context/AppContext';
import { exchangeCodeForTokens } from './services/fitbitService';
import { Preferences } from '@capacitor/preferences';

const App: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const handleFitbitRedirect = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');

      if (code) {
        try {
          const tokens = await exchangeCodeForTokens(code);
          await Preferences.set({ key: 'fitbit_access_token', value: tokens.access_token });
          await Preferences.set({ key: 'fitbit_refresh_token', value: tokens.refresh_token });
          await Preferences.set({ key: 'fitbit_expires_in', value: String(Date.now() + tokens.expires_in * 1000) });
          console.log('Fitbit tokens stored successfully!');
          // Clear the code from the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error exchanging Fitbit code for tokens:', error);
        }
      }
    };

    handleFitbitRedirect();
  }, [location]);

  return (
    <AppProvider>
      <Router>
        <div className="bg-[#121212] min-h-screen flex justify-center font-grotesk"> {/* Changed bg-red-500 to bg-[#121212] */}
          <div className="w-full max-w-md bg-dark-900 text-white flex flex-col shadow-2xl shadow-black">
            <main className="flex-grow overflow-y-auto pb-20">
              <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/log" element={<DailyLog />} />
                  <Route path="/log/add-food" element={<AddFoodPage />} /> {/* New route for AddFoodPage */}
                  <Route path="/log/add-workout" element={<ChooseWorkoutType />} />
                  <Route path="/log/add-workout/cardio" element={<AddCardioWorkoutPage />} />
                  <Route path="/log/add-workout/weights" element={<AddWeightliftingWorkoutPage />} />
                  <Route path="/trends" element={<Trends />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;