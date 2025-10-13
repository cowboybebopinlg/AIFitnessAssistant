import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getWorkoutInfoFromText } from '../../services/geminiService';
import { WorkoutSession, FitbitActivity } from '../../types';
import AddWithFitAIModal from '../AddWithFitAIModal';
import FormInput from '../FormInput';
import LoadingIndicator from '../LoadingIndicator';

/**
 * A page component for adding or editing a cardio workout session.
 * It provides a form for manual input and an option to use FitAI for natural language parsing.
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
  const [isFitAIModalOpen, setIsFitAIModalOpen] = useState(false);
  const [isLoadingFitAI, setIsLoadingFitAI] = useState(false); // New state for FitAI loading

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
  }, [fitbitActivity, isEditMode, workoutIndex, dateString, prefillData]);

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

  const handleAnalyzeWorkoutWithFitAI = async (text: string) => {
    if (!geminiApiKey) {
      alert('Please set your FitAI API key in the settings.');
      return;
    }

    setIsLoadingFitAI(true); // Set loading state
    try {
      console.log('Sending to FitAI:', text); // Log input
      const workout = await getWorkoutInfoFromText(text, appData, geminiApiKey);
      console.log('Received from FitAI:', workout); // Log output

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
      alert('Failed to parse workout with FitAI.');
    } finally {
      setIsLoadingFitAI(false); // Reset loading state
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background-dark text-white">
      <header className="sticky top-0 z-10 flex items-center border-b border-neutral-700 bg-background-dark/80 p-4 backdrop-blur-sm">
        <button className="text-neutral-200" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold pr-6">{isEditMode ? 'Edit Cardio Workout' : 'Add Cardio Workout'}</h1>
      </header>
      <main className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-4">
          <FormInput
            label="Activity Type"
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            placeholder="e.g., Running"
            disabled={!!fitbitActivity}
          />
          <FormInput
            label="Duration (minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g., 30"
            disabled={!!fitbitActivity}
          />
          <FormInput
            label="Average Heart Rate (bpm)"
            type="number"
            value={averageHeartRate}
            onChange={(e) => setAverageHeartRate(e.target.value)}
            placeholder="e.g., 140"
            disabled={!!fitbitActivity}
          />
          <FormInput
            label="Calories Burned"
            type="number"
            value={caloriesBurned}
            onChange={(e) => setCaloriesBurned(e.target.value)}
            placeholder="e.g., 300"
            disabled={!!fitbitActivity}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-400">Notes</label>
            <textarea
              className="h-24 w-full resize-none rounded-xl border-none bg-neutral-800/50 p-4 placeholder-neutral-400 focus:ring-2 focus:ring-primary"
              placeholder="e.g., felt strong, new PR"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>
        {geminiApiKey && (
          <section>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary-500/50 py-3 font-bold text-primary-500 transition-colors hover:bg-primary-500/10"
              onClick={() => setIsFitAIModalOpen(true)}
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              <span>Add with FitAI</span>
            </button>
          </section>
        )}
      </main>
      <footer className="sticky bottom-0 z-10 border-t border-dark-700 bg-dark-900/80 p-4 backdrop-blur-sm">
        <button
          className="h-14 w-full rounded-xl bg-primary-500 px-6 font-bold text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveWorkout}
          disabled={!activityType || !duration || !!fitbitActivity || isLoadingFitAI}
        >
          {isEditMode ? 'Save Changes' : 'Save Workout'}
        </button>
      </footer>
      {isLoadingFitAI && <LoadingIndicator text="Analyzing with FitAI..." />}
      <AddWithFitAIModal
        isOpen={isFitAIModalOpen}
        onClose={() => setIsFitAIModalOpen(false)}
        title="Add Cardio Workout with FitAI"
        description="Describe your cardio workout in plain text. e.g., 'Ran 5k in 25 minutes and then walked for 10 minutes.'"
        placeholder="e.g., Ran 5k in 25 minutes..."
        onAnalyze={handleAnalyzeWorkoutWithFitAI}
      />
    </div>
  );
};

export default AddCardioWorkoutPage;