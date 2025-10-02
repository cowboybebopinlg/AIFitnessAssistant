import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { WorkoutSession, Exercise, FitbitActivity } from '../../types';
import { getWorkoutInfoFromText } from '../../services/geminiService';
import AddWithGeminiModal from '../AddWithGeminiModal';

const AddWeightliftingWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addWorkout, geminiApiKey, updateWorkout, getLogForDate } = useAppContext();
  const location = useLocation();
  const fitbitActivity = location.state?.fitbitActivity as FitbitActivity | undefined;
  const prefillData = location.state?.prefillData as WorkoutSession | undefined;

  const dateString = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const workoutIndex = searchParams.get('workoutIndex');
  const isEditMode = workoutIndex !== null;

  const [exercises, setExercises] = useState<Exercise[]>([
    { id: new Date().toISOString(), name: '', type: 'weights', bodyPart: '', sets: [{ reps: 0, weight: 0 }] },
  ]);
  const [averageHeartRate, setAverageHeartRate] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (isEditMode) {
      const log = getLogForDate(dateString);
      const workout = log?.workouts[parseInt(workoutIndex!, 10)];
      if (workout && workout.type === 'weightlifting') {
        setExercises(workout.exercises);
        setAverageHeartRate(String(workout.averageHeartRate || ''));
        setCaloriesBurned(String(workout.caloriesBurned || ''));
      }
    } else if (prefillData) {
        setExercises(prefillData.exercises || []);
        setAverageHeartRate(String(prefillData.averageHeartRate || ''));
        setCaloriesBurned(String(prefillData.caloriesBurned || ''));
    }
  }, [isEditMode, workoutIndex, dateString, getLogForDate, prefillData]);

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

  const handleDeleteExercise = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    newExercises.splice(exerciseIndex, 1);
    setExercises(newExercises);
  };

  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.splice(setIndex, 1);
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

  const handleSaveWorkout = () => {
    const workoutData: Omit<WorkoutSession, 'date'> = {
      type: 'weightlifting',
      name: fitbitActivity?.name || 'Weightlifting',
      exercises: exercises,
      duration: fitbitActivity ? fitbitActivity.duration / 60000 : 0,
      caloriesBurned: caloriesBurned ? parseInt(caloriesBurned, 10) : (fitbitActivity?.calories || 0),
      fitbitLogId: fitbitActivity?.logId,
      averageHeartRate: averageHeartRate ? parseInt(averageHeartRate, 10) : fitbitActivity?.averageHeartRate,
    };

    if (isEditMode) {
      updateWorkout(dateString, parseInt(workoutIndex!), workoutData);
    } else {
      addWorkout(dateString, { ...workoutData, date: dateString });
    }
    navigate(-1);
  };

  const handleAnalyzeWorkoutWithGemini = async (text: string) => {
    if (!geminiApiKey) {
      // Consider a more user-friendly notification
      return;
    }
    setIsLoadingGemini(true);
    try {
      const geminiWorkout = await getWorkoutInfoFromText(text, appData, geminiApiKey);
      
      if (isEditMode) {
        const log = getLogForDate(dateString);
        const existingWorkout = log?.workouts[parseInt(workoutIndex!, 10)] as WorkoutSession;
        if (existingWorkout) {
          const updatedWorkout = {
            ...existingWorkout,
            name: geminiWorkout.name || existingWorkout.name,
            exercises: [...existingWorkout.exercises, ...(geminiWorkout.exercises || [])],
            duration: geminiWorkout.duration || existingWorkout.duration,
            caloriesBurned: geminiWorkout.caloriesBurned || existingWorkout.caloriesBurned,
          };
          updateWorkout(dateString, parseInt(workoutIndex!), updatedWorkout);
        }
      } else {
        const newWorkout: WorkoutSession = {
          type: 'weightlifting',
          name: geminiWorkout.name || 'Weightlifting',
          exercises: geminiWorkout.exercises || [],
          date: dateString,
          duration: geminiWorkout.duration || 0,
          caloriesBurned: geminiWorkout.caloriesBurned || 0,
        };
        addWorkout(dateString, newWorkout);
      }
      navigate(-1);
    } catch (error) {
      console.error(error);
      // Consider a more user-friendly error message
    } finally {
      setIsLoadingGemini(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {isLoadingGemini && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
          <p className="text-white text-lg mt-4">Gemini is analyzing your workout...</p>
        </div>
      )}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/10 bg-background-light/80 px-4 py-3 backdrop-blur-sm dark:bg-background-dark/80">
        <button className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 dark:text-gray-300" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined"> close </span>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{isEditMode ? 'Edit Workout' : 'Add Workout'}</h1>
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
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={() => handleDeleteExercise(exerciseIndex)}>
                  <span className="material-symbols-outlined">delete</span>
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
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-x-4 px-2 pb-2 text-center text-sm font-semibold text-gray-400">
                    <span className="w-8">Set</span>
                    <span>Reps</span>
                    <span>Weight (lbs)</span>
                    <span></span>
                  </div>
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-x-4">
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
                      <button className="text-gray-400 hover:text-white" onClick={() => handleDeleteSet(exerciseIndex, setIndex)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
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
                <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/20 py-3 font-bold text-primary hover:bg-primary/30 dark:bg-primary/30 dark:hover:bg-primary/40"
                onClick={() => setIsGeminiModalOpen(true)}
                >
                <span className="material-symbols-outlined"> auto_awesome </span>
                <span>Add with Gemini</span>
                </button>
            </div>
        )}
      </main>
      <footer className="sticky bottom-0 border-t border-gray-200/10 bg-background-light/80 py-2 backdrop-blur-sm dark:bg-background-dark/80">
        <button 
          className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white"
          onClick={handleSaveWorkout}
        >
          {isEditMode ? 'Save Changes' : 'Save Workout'}
        </button>
      </footer>
      <AddWithGeminiModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        title="Add Weightlifting Workout with Gemini"
        description="Describe your workout in plain text. e.g., '3 sets of 10 reps of bench press at 135lbs, and 3 sets of 12 reps of squats at 225lbs.'"
        placeholder="e.g., 3 sets of 10 reps of bench press at 135lbs..."
        onAnalyze={handleAnalyzeWorkoutWithGemini}
      />
    </div>
  );
};

export default AddWeightliftingWorkoutPage;
