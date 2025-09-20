import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { getWorkoutInfoFromText } from '../../services/geminiService';
import { Exercise, WorkoutSession, FitbitActivity } from '../../types';

const AddCardioWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addWorkout, geminiApiKey } = useAppContext();
  const location = useLocation();
  const fitbitActivity = location.state?.fitbitActivity as FitbitActivity | undefined;

  console.log('AddCardioWorkoutPage: location.state', location.state);
  console.log('AddCardioWorkoutPage: fitbitActivity', fitbitActivity);

  const dateString = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState('');
  const [averageHeartRate, setAverageHeartRate] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [geminiText, setGeminiText] = useState('');

  useEffect(() => {
    if (fitbitActivity) {
      setActivityType(fitbitActivity.activityName || fitbitActivity.activityParentName);
      setDuration(String(fitbitActivity.duration / 60000)); // Convert ms to minutes
      setCaloriesBurned(String(fitbitActivity.calories));
      setNotes(`Synced from Fitbit. Distance: ${fitbitActivity.distance} miles, Steps: ${fitbitActivity.steps}`);
    }
  }, [fitbitActivity]);

  const handleAddWorkout = () => {
    if (!activityType || !duration) {
      alert('Please fill in all fields.');
      return;
    }

    const newExercise: Exercise = {
      id: new Date().toISOString(),
      name: activityType,
      type: 'cardio',
      duration: parseInt(duration, 10),
      averageHeartRate: averageHeartRate ? parseInt(averageHeartRate, 10) : undefined,
      caloriesBurned: caloriesBurned ? parseInt(caloriesBurned, 10) : undefined,
    };

    const newWorkout: WorkoutSession = {
      name: activityType,
      notes: notes,
      exercises: [newExercise],
    };

    addWorkout(dateString, newWorkout);
    alert('Cardio workout added!');
    navigate(-1);
  };

  const handleAnalyzeWorkoutWithGemini = async () => {
    if (!geminiApiKey) {
      alert('Please set your Gemini API key in the settings.');
      return;
    }

    try {
      const workout = await getWorkoutInfoFromText(geminiText, geminiApiKey);
      const newExercise: Exercise = {
        id: new Date().toISOString(),
        name: workout.name || 'Unknown Workout',
        type: 'cardio',
        duration: workout.duration || 0,
        averageHeartRate: workout.averageHeartRate || undefined,
        caloriesBurned: workout.caloriesBurned || undefined,
      };

      const newWorkout: WorkoutSession = {
        name: workout.name || 'Unknown Workout',
        notes: workout.notes || '',
        exercises: [newExercise],
      };

      addWorkout(dateString, newWorkout);
      alert('Workout added via Gemini!');
      navigate(-1);
    } catch (error) {
      console.error(error);
      alert('Failed to parse workout with Gemini.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark sticky top-0 z-10">
        <button className="text-white" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined"> close </span>
        </button>
        <h1 className="text-lg font-bold text-white text-center absolute left-1/2 -translate-x-1/2">Add Cardio Workout</h1>
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
          onClick={geminiText ? handleAnalyzeWorkoutWithGemini : handleAddWorkout}
          disabled={!!fitbitActivity && !!geminiText}
        >
          Save Workout
        </button>
      </footer>
    </div>
  );
};

export default AddCardioWorkoutPage;
