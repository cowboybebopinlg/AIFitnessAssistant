import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DumbbellIcon, RunningIcon } from '../icons';

/**
 * A page component that prompts the user to choose between a "Cardio" or "Weights" workout.
 * Based on the selection, it navigates to the appropriate workout logging page.
 * @returns {JSX.Element} The rendered page component.
 */
const ChooseWorkoutType: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateString = searchParams.get('date');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-background-dark text-white">
      <header className="sticky top-0 z-10 flex items-center border-b border-neutral-700 bg-background-dark/80 p-4 backdrop-blur-sm">
        <button className="text-neutral-200" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold pr-6">Add Workout</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4">
        <h2 className="mb-8 text-2xl font-bold">What type of workout?</h2>
        <div className="space-y-4">
          <button
            className="flex w-full items-center gap-4 rounded-xl bg-neutral-800/50 p-6 text-left transition-all duration-200 hover:bg-primary/20"
            onClick={() => navigate(`/log/add-workout/cardio?date=${dateString}`)}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/30 text-primary">
              <RunningIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold">Cardio</p>
              <p className="text-sm text-neutral-400">Running, cycling, swimming, etc.</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-neutral-500">chevron_right</span>
          </button>
          <button
            className="flex w-full items-center gap-4 rounded-xl bg-neutral-800/50 p-6 text-left transition-all duration-200 hover:bg-primary/20"
            onClick={() => navigate(`/log/add-workout/weights?date=${dateString}`)}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/30 text-primary">
              <DumbbellIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold">Weightlifting</p>
              <p className="text-sm text-neutral-400">Strength training, bodybuilding, etc.</p>
            </div>
            <span className="material-symbols-outlined ml-auto text-neutral-500">chevron_right</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default ChooseWorkoutType;