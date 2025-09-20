import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { WorkoutSession, Exercise, ExerciseSet, FitbitActivity } from '../../types';

const AddWeightliftingWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addWorkout, geminiApiKey } = useAppContext();
  const location = useLocation();
  const fitbitActivity = location.state?.fitbitActivity as FitbitActivity | undefined;

  console.log('AddWeightliftingWorkoutPage: location.state', location.state);
  console.log('AddWeightliftingWorkoutPage: fitbitActivity', fitbitActivity);

  const dateString = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [exercises, setExercises] = useState<Exercise[]>([
    { id: new Date().toISOString(), name: '', type: 'weights', bodyPart: '', sets: [{ reps: 0, weight: 0 }] },
  ]);
  const [averageHeartRate, setAverageHeartRate] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [geminiText, setGeminiText] = useState('');

  useEffect(() => {
    if (fitbitActivity) {
      const newExercise: Exercise = {
        id: new Date().toISOString(),
        name: fitbitActivity.activityName || fitbitActivity.activityParentName,
        type: 'weights',
        bodyPart: '', // Fitbit doesn't provide body part
        sets: [{ reps: 0, weight: 0 }], // Default sets, user can edit
      };
      setExercises([newExercise]);
      setAverageHeartRate(String(fitbitActivity.averageHeartRate || ''));
      setCaloriesBurned(String(fitbitActivity.calories || ''));
      setGeminiText(`Synced from Fitbit. Duration: ${fitbitActivity.duration / 60000} mins, Distance: ${fitbitActivity.distance || 0} miles, Steps: ${fitbitActivity.steps || 0}`);
    }
  }, [fitbitActivity]);

  const handleAddExercise = () => {
    setExercises([
      ...exercises,
      { id: new Date().toISOString(), name: '', type: 'weights', bodyPart: '', sets: [{ reps: 0, weight: 0 }] },
    ]);
  };

  const handleAddSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.push({ reps: 0, weight: 0 });
    setExercises(newExercises);
  };

  const handleExerciseChange = (exerciseIndex: number, field: string, value: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex][field] = value;
    setExercises(newExercises);
  };

  const handleSetChange = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex][field] = Number(value);
    setExercises(newExercises);
  };

  const handleAddWorkout = () => {
    const newWorkout: WorkoutSession = {
      name: 'Weightlifting',
      exercises: exercises,
      averageHeartRate: averageHeartRate ? parseInt(averageHeartRate, 10) : undefined,
      caloriesBurned: caloriesBurned ? parseInt(caloriesBurned, 10) : undefined,
    };

    addWorkout(dateString, newWorkout);
    alert('Weightlifting workout added!');
    navigate(-1);
  };

  const handleAnalyzeWorkoutWithGemini = async () => {
    if (!geminiApiKey) {
      alert('Please set your Gemini API key in the settings.');
      return;
    }

    try {
      const workout = await getWorkoutInfoFromText(geminiText, geminiApiKey);
      const newWorkout: WorkoutSession = {
        name: workout.name || 'Weightlifting',
        exercises: workout.exercises || [],
        averageHeartRate: workout.averageHeartRate || undefined,
        caloriesBurned: workout.caloriesBurned || undefined,
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
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/10 bg-background-light/80 px-4 py-3 backdrop-blur-sm dark:bg-background-dark/80">
        <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 dark:text-gray-300" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined"> close </span>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Add Workout</h1>
        <div className="w-10"></div>
      </header>
      <main className="p-2 space-y-4">
        <div>
            <label htmlFor="average-heart-rate" className="block text-sm font-medium text-gray-400 mb-1">Average Heart Rate (bpm)</label>
            <input 
              id="average-heart-rate"
              className="w-full bg-gray-800/50 text-white placeholder-gray-400/50 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary" 
              placeholder="e.g., 120"
              type="number"
              value={averageHeartRate}
              onChange={(e) => setAverageHeartRate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="calories-burned" className="block text-sm font-medium text-gray-400 mb-1">Calories Burned</label>
            <input 
              id="calories-burned"
              className="w-full bg-gray-800/50 text-white placeholder-gray-400/50 border-none rounded-lg p-3 focus:ring-2 focus:ring-primary" 
              placeholder="e.g., 250"
              type="number"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
            />
          </div>
        <div className="space-y-6">
          {exercises.map((exercise, exerciseIndex) => (
            <div key={exercise.id} className="rounded-xl bg-background-light p-4 shadow-sm dark:bg-gray-800/20">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Exercise {exerciseIndex + 1}</h2>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <span className="material-symbols-outlined"> more_vert </span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor={`exercise-name-${exerciseIndex}`} className="block text-sm font-medium text-gray-400 mb-1">Exercise Name</label>
                  <input 
                    id={`exercise-name-${exerciseIndex}`}
                    className="w-full bg-gray-800/50 text-white placeholder-gray-400/50 border-none rounded-lg p-4 focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Barbell Bench Press" 
                    type="text"
                    value={exercise.name}
                    onChange={(e) => handleExerciseChange(exerciseIndex, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor={`body-part-${exerciseIndex}`} className="block text-sm font-medium text-gray-400 mb-1">Body Part Targeted</label>
                  <select 
                    id={`body-part-${exerciseIndex}`}
                    className="w-full appearance-none rounded-lg p-4 bg-gray-800/50 text-white placeholder-gray-400/50 border-none focus:ring-2 focus:ring-primary"
                    value={exercise.bodyPart}
                    onChange={(e) => handleExerciseChange(exerciseIndex, 'bodyPart', e.target.value)}
                  >
                    <option>Body Part Targeted</option>
                    <option>Chest</option>
                    <option>Back</option>
                    <option>Legs</option>
                    <option>Shoulders</option>
                    <option>Arms</option>
                  </select>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-4 px-2 pb-2 text-center text-sm font-semibold text-gray-400">
                    <span className="w-8">Set</span>
                    <span>Reps</span>
                    <span>Weight (lbs)</span>
                  </div>
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-700 text-sm font-bold text-gray-200">{setIndex + 1}</span>
                      <div className="relative flex items-center">
                        <input 
                          className="w-full rounded-lg p-4 bg-gray-800/50 text-white placeholder-gray-400/50 border-none text-center focus:ring-2 focus:ring-primary"
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                        />
                      </div>
                      <div className="relative flex items-center">
                        <input 
                          className="w-full rounded-lg p-4 bg-gray-800/50 text-white placeholder-gray-400/50 border-none text-center focus:ring-2 focus:ring-primary"
                          type="number"
                          value={set.weight}
                          onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-700 py-3 text-sm font-semibold text-gray-400 hover:border-primary hover:text-primary"
                    onClick={() => handleAddSet(exerciseIndex)}
                  >
                    <span className="material-symbols-outlined"> add </span> Add Set
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div>
          <button 
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/20 py-3 font-bold text-primary hover:bg-primary/30 dark:bg-primary/30 dark:hover:bg-primary/40"
            onClick={handleAddExercise}
          >
            <span className="material-symbols-outlined"> add_circle </span>
            <span>Add Exercise</span>
          </button>
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
                placeholder="e.g., Bench press 3 sets of 10 reps at 60kg"
                value={geminiText}
                onChange={(e) => setGeminiText(e.target.value)}
              ></textarea>
            </div>
          </div>
        )}
      </main>
      <footer className="sticky bottom-0 border-t border-gray-200/10 bg-background-light/80 py-2 backdrop-blur-sm dark:bg-background-dark/80">
        <button 
          className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white"
          onClick={geminiText ? handleAnalyzeWorkoutWithGemini : handleAddWorkout}
        >
          Save Workout
        </button>
      </footer>
    </div>
  );
};

export default AddWeightliftingWorkoutPage;
