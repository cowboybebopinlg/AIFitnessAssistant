import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { WorkoutSession, Exercise, FitbitActivity } from '../../types';
import { getWorkoutInfoFromText } from '../../services/geminiService';
import AddWithGeminiModal from '../AddWithGeminiModal';
import FormInput from '../FormInput';
import LoadingIndicator from '../LoadingIndicator';

/**
 * A page component for adding or editing a weightlifting workout session.
 * It allows users to build a workout by adding multiple exercises, each with multiple sets of reps and weight.
 * The form supports both manual entry and natural language parsing via Gemini.
 * It can be pre-filled with data from a Fitbit activity or an existing workout for editing.
 * @returns {JSX.Element} The rendered page component.
 */
const AddWeightliftingWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addWorkout, geminiApiKey, updateWorkout, getLogForDate, appData } = useAppContext();
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

  const canSave = exercises.length > 0 && exercises.every(ex => ex.name.trim() !== '');

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
  }, [isEditMode, workoutIndex, dateString, prefillData]);

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
    <div className="flex h-screen flex-col bg-background-dark text-white">
      {isLoadingGemini && <LoadingIndicator text="Analyzing your workout..." />}
      <header className="sticky top-0 z-10 flex items-center border-b border-neutral-700 bg-background-dark/80 p-4 backdrop-blur-sm">
        <button className="text-neutral-200" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold pr-6">{isEditMode ? 'Edit Workout' : 'Add Workout'}</h1>
      </header>
      <main className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Avg. Heart Rate (bpm)"
            type="number"
            value={averageHeartRate}
            onChange={(e) => setAverageHeartRate(e.target.value)}
            placeholder="e.g., 120"
          />
          <FormInput
            label="Calories Burned"
            type="number"
            value={caloriesBurned}
            onChange={(e) => setCaloriesBurned(e.target.value)}
            placeholder="e.g., 250"
          />
        </div>
        <div className="space-y-6">
          {exercises.map((exercise, exerciseIndex) => (
            <div key={exercise.id} className="rounded-xl bg-neutral-800/50 p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Exercise {exerciseIndex + 1}</h2>
                <button
                  className="text-neutral-400 transition-colors hover:text-red-500"
                  onClick={() => handleDeleteExercise(exerciseIndex)}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
              <div className="space-y-4">
                <FormInput
                  label="Exercise Name"
                  value={exercise.name}
                  onChange={(e) => handleExerciseChange(exerciseIndex, 'name', e.target.value)}
                  placeholder="e.g., Barbell Bench Press"
                />
                <div>
                  <label className="text-sm font-bold text-neutral-400">Body Part Targeted</label>
                  <select
                    className="h-14 w-full rounded-xl border-none bg-neutral-800/50 px-4 placeholder-neutral-400 focus:ring-2 focus:ring-primary"
                    value={exercise.bodyPart}
                    onChange={(e) => handleExerciseChange(exerciseIndex, 'bodyPart', e.target.value)}
                  >
                    <option>Select Body Part</option>
                    <option>Chest</option>
                    <option>Back</option>
                    <option>Legs</option>
                    <option>Shoulders</option>
                    <option>Arms</option>
                  </select>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-x-4 px-2 pb-2 text-center text-sm font-semibold text-neutral-400">
                    <span className="w-8">Set</span>
                    <span>Reps</span>
                    <span>Weight (lbs)</span>
                    <span className="w-8"></span>
                  </div>
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-x-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-700 text-sm font-bold">{setIndex + 1}</span>
                      <input
                        className="h-14 w-full rounded-xl border-none bg-neutral-800/50 text-center placeholder-neutral-400 focus:ring-2 focus:ring-primary"
                        type="number"
                        value={set.reps}
                        onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                      />
                      <input
                        className="h-14 w-full rounded-xl border-none bg-neutral-800/50 text-center placeholder-neutral-400 focus:ring-2 focus:ring-primary"
                        type="number"
                        value={set.weight}
                        onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                      />
                      <button
                        className="text-neutral-500 transition-colors hover:text-red-500"
                        onClick={() => handleDeleteSet(exerciseIndex, setIndex)}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))}
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/20 py-3 font-bold text-primary transition-colors hover:bg-primary/30"
                    onClick={() => handleAddSet(exerciseIndex)}
                  >
                    <span className="material-symbols-outlined">add</span> Add Set
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4 pt-4">
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-700 py-4 font-bold text-neutral-400 transition-colors hover:border-primary hover:text-primary"
            onClick={handleAddExercise}
          >
            <span className="material-symbols-outlined">add</span>
            <span>Add Exercise</span>
          </button>
          {geminiApiKey && (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/20 py-4 font-bold text-primary transition-colors hover:bg-primary/30"
              onClick={() => setIsGeminiModalOpen(true)}
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              <span>Add with Gemini</span>
            </button>
          )}
        </div>
      </main>
      <footer className="sticky bottom-0 z-10 border-t border-neutral-700 bg-background-dark/80 p-4 backdrop-blur-sm">
        <button
          className="h-12 w-full rounded-xl bg-primary px-6 font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-50"
          onClick={handleSaveWorkout}
          disabled={!canSave || isLoadingGemini}
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