import React from 'react';
import { DailyLog } from '../../types';

interface FoodEntriesSectionProps {
  log: DailyLog | undefined;
  onAddFoodClick: () => void;
}

const FoodEntriesSection: React.FC<FoodEntriesSectionProps> = ({ log, onAddFoodClick }) => {
  const meals = log?.meals || [];

  const handleCopyFoodEntries = async () => {
    if (meals.length === 0) {
      alert("No food entries to copy.");
      return;
    }
    const foodText = meals.map(meal => `${meal.name}: ${meal.calories} kcal, ${meal.protein}g Protein`).join('\n');
    try {
      await navigator.clipboard.writeText(foodText);
      alert('Food entries copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy food entries: ', err);
      alert('Failed to copy food entries.');
    }
  };

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Food Entries</h2>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 rounded-full bg-gray-800 px-3 py-1.5 text-xs font-medium text-white"
            onClick={handleCopyFoodEntries}
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Copy
          </button>
          <button
            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-bold text-white"
            onClick={onAddFoodClick} // Call the prop function here
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {meals.length === 0 ? (
          <p className="text-gray-400 text-center">No food entries for this day. Click 'Add' to add one!</p>
        ) : (
          meals.map((meal, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg bg-gray-900 p-3">
              {/* Placeholder for image - in a real app, this would be dynamic */}
              <div
                className="h-12 w-12 flex-shrink-0 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url('https://via.placeholder.com/150?text=${meal.name.charAt(0)}')` }}
              ></div>
              <div className="flex-grow">
                <h3 className="font-bold text-white">{meal.name}</h3>
                <p className="text-sm text-gray-400">{meal.calories} kcal, {meal.protein}g Protein</p>
              </div>
              <button className="text-gray-400 hover:text-white">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default FoodEntriesSection;