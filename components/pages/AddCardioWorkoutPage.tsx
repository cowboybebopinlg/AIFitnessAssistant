import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getWorkoutInfoFromText } from '../../services/geminiService';
import { WorkoutSession, FitbitActivity } from '../../types';
import AddWithGeminiModal from '../AddWithGeminiModal';

/**
 * A page component for adding or editing a cardio workout session.
 * It provides a form for manual input and an option to use Gemini for natural language parsing.
 * The form can be pre-filled with data from a Fitbit activity or an existing workout for editing.
 * @returns {JSX.Element} The rendered page component.
 */
const AddCardioWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addWorkout, updateWorkout, getLogForDate, geminiApiKey, appData } = useAppContext();
  const location = useLocation();
  const fitbitActivity = location.state?.fitbitActivity as FitbitActivity | undefined;
  const prefillData = location.state?.prefillData as WorkoutSession | undefined;

  const dateString = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const workoutIndex = searchParams.get('workoutIndex');

  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState('');
  const [averageHeartRate, setAverageHeartRate] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false); // New state for Gemini loading

  const isEditMode = workoutIndex !== null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const log = getLogForDate(dateString);
      const workout = log?.workouts[parseInt(workoutIndex!)];
      if (workout && workout.type === 'cardio') {
        setActivityType(workout.name);
        setDuration(String(workout.duration));
        setCaloriesBurned(String(workout.caloriesBurned));
        setAverageHeartRate(String(workout.averageHeartRate || ''));
        setNotes(workout.notes || '');
      }
    } else if (prefillData) {
        setActivityType(prefillData.name || '');
        setDuration(String(prefillData.duration || ''));
        setCaloriesBurned(String(prefillData.caloriesBurned || ''));
        setAverageHeartRate(String(prefillData.averageHeartRate || ''));
        setNotes(prefillData.notes || '');
    } else if (fitbitActivity) {
      setActivityType(fitbitActivity.activityName || fitbitActivity.activityParentName || 'Cardio Workout'); // Added 'Cardio Workout' fallback
      setDuration(String(Math.floor(fitbitActivity.duration / 60000))); // Convert ms to minutes
      setCaloriesBurned(String(Math.floor(fitbitActivity.calories)));
      setAverageHeartRate(String(fitbitActivity.averageHeartRate || ''));
      setNotes(`Synced from Fitbit. Distance: ${fitbitActivity.distance} miles, Steps: ${fitbitActivity.steps}`);
    }
  }, [fitbitActivity, isEditMode, workoutIndex, dateString, getLogForDate, prefillData]);

  const handleSaveWorkout = () => {
    if (!activityType || !duration) {
      alert('Please fill in all fields.');
      return;
    }

    const existingWorkout = isEditMode ? getLogForDate(dateString)?.workouts[parseInt(workoutIndex!)] : undefined;

    const workoutData: WorkoutSession = {
      type: 'cardio',
      name: activityType,
      notes: notes,
      date: dateString,
      duration: Math.floor(parseInt(duration, 10)),
      caloriesBurned: caloriesBurned ? Math.floor(parseInt(caloriesBurned, 10)) : 0,
      distance: existingWorkout?.distance || fitbitActivity?.distance,
      fitbitLogId: existingWorkout?.fitbitLogId || fitbitActivity?.logId,
      averageHeartRate: averageHeartRate ? parseInt(averageHeartRate, 10) : undefined,
      exercises: existingWorkout?.exercises || [],
      pace: (existingWorkout && 'pace' in existingWorkout) ? existingWorkout.pace : 0,
    };

    if (isEditMode) {
      updateWorkout(dateString, parseInt(workoutIndex!), workoutData);
    } else {
      addWorkout(dateString, workoutData);
    }
    navigate('/log'); // Navigate directly to daily log
  };

  const handleAnalyzeWorkoutWithGemini = async (text: string) => {
    if (!geminiApiKey) {
      alert('Please set your Gemini API key in the settings.');
      return;
    }

    setIsLoadingGemini(true); // Set loading state
    try {
      console.log('Sending to Gemini:', text); // Log input
      const workout = await getWorkoutInfoFromText(text, appData, geminiApiKey);
      console.log('Received from Gemini:', workout); // Log output

      const newWorkout: WorkoutSession = {
        type: 'cardio',
        name: workout.name || 'Unknown Workout',
        notes: workout.notes || '',
        date: dateString,
        duration: workout.duration || 0,
        caloriesBurned: workout.caloriesBurned || 0,
        exercises: [],
        pace: 0,
      };

      addWorkout(dateString, newWorkout);
      navigate('/log');
    } catch (error) {
      console.error(error);
      alert('Failed to parse workout with Gemini.');
    } finally {
      setIsLoadingGemini(false); // Reset loading state
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark sticky top-0 z-10">
        <button className="text-neutral-800 dark:text-neutral-200" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined"> close </span>
        </button>
        <h1 className="text-lg font-bold text-center flex-1 pr-6">{isEditMode ? 'Edit Cardio Workout' : 'Add Cardio Workout'}</h1>
      </header>
      <main className="p-4 space-y-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Activity Type</label>
            <input
              className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
              placeholder="e.g., Running"
              type="text"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              disabled={!!fitbitActivity}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Duration (minutes)</label>
            <input
              className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
              placeholder="e.g., 30"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={!!fitbitActivity}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Average Heart Rate (bpm)</label>
            <input
              className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
              placeholder="e.g., 140"
              type="number"
              value={averageHeartRate}
              onChange={(e) => setAverageHeartRate(e.target.value)}
              disabled={!!fitbitActivity}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Calories Burned</label>
            <input
              className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
              placeholder="e.g., 300"
              type="number"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
              disabled={!!fitbitActivity}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Notes</label>
            <textarea
              className="w-full h-20 p-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400 resize-none"
              placeholder="e.g., felt strong, new PR)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>
        {geminiApiKey && (
          <section className="py-4">
            <button
              className="w-full flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-white font-bold text-base hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => setIsGeminiModalOpen(true)}
            >
              <span className="material-symbols-outlined"> auto_awesome </span>
              <span>Add with Gemini</span>
            </button>
          </section>
        )}
      </main>
      <footer className="p-4 bg-background-light dark:bg-background-dark sticky bottom-0">
        <button
          className="w-full flex items-center justify-center h-12 px-6 rounded-lg bg-primary text-white font-bold text-base hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={handleSaveWorkout}
          disabled={!!fitbitActivity || isLoadingGemini}
        >
          {isEditMode ? 'Save Changes' : 'Save Workout'}
        </button>
      </footer>
      {isLoadingGemini && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col rounded-xl bg-background-light dark:bg-background-dark p-8 items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Analyzing with Gemini...</p>
          </div>
        </div>
      )}
      <AddWithGeminiModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        title="Add Cardio Workout with Gemini"
        description="Describe your cardio workout in plain text. e.g., 'Ran 5k in 25 minutes and then walked for 10 minutes.'"
        placeholder="e.g., Ran 5k in 25 minutes..."
        onAnalyze={handleAnalyzeWorkoutWithGemini}
      />
    </div>
  );
};

export default AddCardioWorkoutPage;