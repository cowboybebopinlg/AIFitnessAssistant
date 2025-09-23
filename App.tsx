import React, { useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

import BottomNav from './components/BottomNav';
import AskGeminiFeature from './components/AskGemini';
import AppProvider from './context/AppContext';

const Dashboard = lazy(() => import('./components/pages/Dashboard').then(module => ({ default: module.Dashboard })));
const DailyLog = lazy(() => import('./components/pages/DailyLog'));
const AddFoodPage = lazy(() => import('./components/pages/AddFoodPage'));
const ChooseWorkoutType = lazy(() => import('./components/pages/ChooseWorkoutType'));
const AddCardioWorkoutPage = lazy(() => import('./components/pages/AddCardioWorkoutPage'));
const AddWeightliftingWorkoutPage = lazy(() => import('./components/pages/AddWeightliftingWorkoutPage'));
const Trends = lazy(() => import('./components/pages/Trends'));
const Library = lazy(() => import('./components/pages/Library'));
const Settings = lazy(() => import('./components/pages/Settings'));
const ProfilePage = lazy(() => import('./components/pages/ProfilePage'));

import { SafeArea } from '@capacitor-community/safe-area';

const AppContent: React.FC = () => {
  useEffect(() => {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapacitorApp.exitApp();
      }
    });

    const setSafeArea = () => {
      SafeArea.getSafeAreaInsets().then(({ insets }) => {
        for (const [key, value] of Object.entries(insets)) {
          document.documentElement.style.setProperty(
            `--safe-area-inset-${key}`,
            `${value}px`
          );
        }
      });
    };

    SafeArea.addListener('safeAreaChanged', setSafeArea);
    setSafeArea();

    return () => {
      SafeArea.removeAllListeners();
    };
  }, []);

  return (
    <Router>
      <div className="bg-[#121212] min-h-screen flex justify-center font-grotesk">
        <div className="w-full max-w-md bg-dark-900 text-white flex flex-col shadow-2xl shadow-black safe-area">
          <main className="flex-grow overflow-y-auto pb-20">
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/log" element={<DailyLog />} />
                  <Route path="/log/add-food" element={<AddFoodPage />} />
                  <Route path="/log/add-workout" element={<ChooseWorkoutType />} />
                  <Route path="/log/add-workout/cardio" element={<AddCardioWorkoutPage />} />
                  <Route path="/log/add-workout/weights" element={<AddWeightliftingWorkoutPage />} />
                  <Route path="/trends" element={<Trends />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </Suspense>
          </main>
          <BottomNav />
          <AskGeminiFeature />
        </div>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
