import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getWorkoutInfoFromText } from '../../services/geminiService';
import { Exercise, WorkoutSession, FitbitActivity } from '../../types';

const AddCardioWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addWorkout, updateWorkout, getLogForDate, geminiApiKey } = useAppContext();
  const location = useLocation();
  const fitbitActivity = location.state?.fitbitActivity as FitbitActivity | undefined;

  const dateString = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const workoutIndex = searchParams.get('workoutIndex');

  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState('');
  const [averageHeartRate, setAverageHeartRate] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [geminiText, setGeminiText] = useState('');
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
    } else if (fitbitActivity) {
      setActivityType(fitbitActivity.activityName || fitbitActivity.activityParentName || 'Cardio Workout'); // Added 'Cardio Workout' fallback
      setDuration(String(Math.floor(fitbitActivity.duration / 60000))); // Convert ms to minutes
      setCaloriesBurned(String(Math.floor(fitbitActivity.calories)));
      setAverageHeartRate(String(fitbitActivity.averageHeartRate || ''));
      setNotes(`Synced from Fitbit. Distance: ${fitbitActivity.distance} miles, Steps: ${fitbitActivity.steps}`);
    }
  }, [fitbitActivity, isEditMode, workoutIndex, dateString, getLogForDate]);

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

  const handleAnalyzeWorkoutWithGemini = async () => {
    if (!geminiApiKey) {
      alert('Please set your Gemini API key in the settings.');
      return;
    }

    setIsLoadingGemini(true); // Set loading state
    try {
      console.log('Sending to Gemini:', geminiText); // Log input
      const workout = await getWorkoutInfoFromText(geminiText, geminiApiKey);
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
        <button className="text-white" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined"> close </span>
        </button>
        <h1 className="text-lg font-bold text-white text-center absolute left-1/2 -translate-x-1/2">{isEditMode ? 'Edit Cardio Workout' : 'Add Cardio Workout'}</h1>
        <div className="w-8"></div>
      </header>
      <main className="p-2 space-y-4">
        <div className="space-y-2">
          <div>
            <label htmlFor="activity-type" className="block text-sm font-medium text-gray-400 mb-1">Activity Type</label>
            <input
              id="activity-type"
              className="w-full bg-gray-800/50 text-white placeholder-gray-400/50 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary"
              placeholder="e.g., Running"
              type="text"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              disabled={!!fitbitActivity}
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-400 mb-1">Duration</label>
            <input
              id="duration"
              className="w-full bg-gray-800/50 text-white placeholder-gray-400/50 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary"
              placeholder="e.g., 30 mins"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={!!fitbitActivity}
            />
          </div>
          <div>
            <label htmlFor="average-heart-rate" className="block text-sm font-medium text-gray-400 mb-1">Average Heart Rate (bpm)</label>
            <input
              id="average-heart-rate"
              className="w-full bg-gray-800/50 text-white placeholder-gray-400/50 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary"
              placeholder="e.g., 140"
              type="number"
              value={averageHeartRate}
              onChange={(e) => setAverageHeartRate(e.target.value)}
              disabled={!!fitbitActivity}
            />
          </div>
          <div>
            <label htmlFor="calories-burned" className="block text-sm font-medium text-gray-400 mb-1">Calories Burned</label>
            <input
              id="calories-burned"
              className="w-full bg-gray-800/50 text-white placeholder-gray-400/50 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary"
              placeholder="e.g., 300"
              type="number"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
              disabled={!!fitbitActivity}
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
            <textarea
              id="notes"
              className="w-full bg-gray-800/50 text-white placeholder-gray-400/50 border-none rounded-lg p-3 h-20 resize-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., felt strong, new PR)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-px bg-white/10 flex-grow"></div>
          <span className="text-sm font-bold text-white">OR</span>
          <div className="h-px bg-white/10 flex-grow"></div>
        </div>
        {geminiApiKey && (
          <div className="space-y-2 p-3 rounded-xl bg-primary/10">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-primary text-2xl"> auto_awesome </span>
              <h2 className="text-lg font-bold text-white">Add with Gemini</h2>
            </div>
            <p className="text-sm text-white/70">Describe your workout in plain text. Gemini will handle the rest.</p>
            <div className="relative">
              <textarea
                className="w-full bg-gray-800/50 text-white placeholder-gray-400/50 border-none rounded-lg p-3 h-24 resize-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Ran 5k in 25 minutes, then did 3 sets of 10 pushups."
                value={geminiText}
                onChange={(e) => setGeminiText(e.target.value)}
                disabled={!!fitbitActivity}
              ></textarea>
            </div>
          </div>
        )}
      </main>
      <footer className="p-4 bg-background-light dark:bg-background-dark sticky bottom-0">
        <button
          className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white"
          onClick={geminiText ? handleAnalyzeWorkoutWithGemini : handleSaveWorkout}
          disabled={!!fitbitActivity && !!geminiText || isLoadingGemini}
        >
          {geminiText ? 'Analyze Workout' : (isEditMode ? 'Save Changes' : 'Save Workout')}
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
    </div>
  );
};

export default AddCardioWorkoutPage;
