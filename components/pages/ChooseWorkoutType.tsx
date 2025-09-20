import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ChooseWorkoutType: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateString = searchParams.get('date');

  return (
    <div className="relative flex h-screen w-full flex-col">
      <header className="flex items-center justify-between p-4">
        <button className="text-gray-600 dark:text-gray-400" onClick={() => navigate(-1)}>
          <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
          </svg>
        </button>
        <h1 className="text-lg font-bold">Add Workout</h1>
        <div className="w-6"></div>
      </header>
      <main className="flex-1 px-4 py-8">
        <h2 className="text-2xl font-bold mb-8">What type of workout?</h2>
        <div className="space-y-4">
          <a className="flex items-center justify-between rounded-lg bg-white/5 dark:bg-black/10 p-4 transition-all duration-200 hover:bg-primary/20 dark:hover:bg-primary/30" href="#" onClick={(e) => { e.preventDefault(); navigate(`/log/add-workout/cardio?date=${dateString}`); }}>
            <span className="text-lg font-medium">Cardio</span>
            <svg className="text-gray-500 dark:text-gray-400" fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
            </svg>
          </a>
          <a className="flex items-center justify-between rounded-lg bg-white/5 dark:bg-black/10 p-4 transition-all duration-200 hover:bg-primary/20 dark:hover:bg-primary/30" href="#" onClick={(e) => { e.preventDefault(); navigate(`/log/add-workout/weights?date=${dateString}`); }}>
            <span className="text-lg font-medium">Weights</span>
            <svg className="text-gray-500 dark:text-gray-400" fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg">
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
            </svg>
          </a>
        </div>
      </main>
    </div>
  );
};

export default ChooseWorkoutType;