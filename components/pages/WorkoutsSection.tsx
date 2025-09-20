import React from 'react';
import { DailyLog, WorkoutSession, Exercise } from '../../types';

interface WorkoutsSectionProps {
  log: DailyLog | undefined;
  onAddWorkoutClick: () => void;
}

const WorkoutsSection: React.FC<WorkoutsSectionProps> = ({ log, onAddWorkoutClick }) => {
  const workouts = log?.workouts || [];

  const renderExerciseDetails = (exercise: Exercise) => {
    if (exercise.type === 'cardio') {
      return (
        <div className="mt-2 space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-400">Duration:</span>
            <span>{exercise.duration} mins</span>
          </div>
          {exercise.distance && (
            <div className="flex justify-between">
              <span className="text-gray-400">Distance:</span>
              <span>{exercise.distance} miles</span>
            </div>
          )}
        </div>
      );
    } else if (exercise.type === 'weights') {
      return (
        <div className="mt-2 space-y-2 text-sm text-gray-300">
          <div className="grid grid-cols-4 gap-2 text-center">
            <span className="text-left text-gray-500">SET</span>
            <span className="text-gray-500">REPS</span>
            <span className="text-gray-500">WEIGHT</span>
            <span></span>
          </div>
          {exercise.sets.map((set, index) => (
            <div key={index} className="grid grid-cols-4 items-center gap-2 rounded-md bg-gray-800/50 p-2 text-center">
              <span className="font-bold text-white">{index + 1}</span>
              <span>{set.reps}</span>
              <span>{set.weight} lbs</span>
              <button className="text-gray-400 hover:text-white justify-self-end"><span className="material-symbols-outlined text-base"> notes </span></button>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Workouts</h2>
        <button
          className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-bold text-white"
          onClick={onAddWorkoutClick}
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Workout
        </button>
      </div>
      <div className="space-y-3">
        {workouts.length === 0 ? (
          <p className="text-gray-400 text-center">No workouts for this day. Click 'Add Workout' to add one!</p>
        ) : (
          workouts.map((workout, index) => (
            <div key={index} className="rounded-lg bg-gray-900 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-400">{workout.exercises[0]?.type}</p>
                  <h3 className="text-lg font-bold text-white">{workout.name}</h3>
                </div>
                <button className="text-gray-400 hover:text-white">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{exercise.name}</h4>
                      {exercise.bodyPart && <p className="text-sm text-gray-400">{exercise.bodyPart}</p>}
                    </div>
                    {renderExerciseDetails(exercise)}
                    {exercise.notes && (
                      <div className="mt-2 text-xs text-gray-400">
                        <p className="font-semibold">Notes:</p>
                        <p>{exercise.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {workout.notes && (
                <div className="mt-4 text-xs text-gray-400">
                  <p className="font-semibold">Workout Notes:</p>
                  <p>{workout.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default WorkoutsSection;
