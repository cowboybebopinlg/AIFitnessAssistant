import React, { useState, useEffect } from 'react';
import { Meal } from '../../types';

interface EditFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: Meal | null;
  updateMeal: (meal: Meal) => void;
}

const EditFoodModal: React.FC<EditFoodModalProps> = ({ isOpen, onClose, meal, updateMeal }) => {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fiber, setFiber] = useState<number | ''>('');

  useEffect(() => {
    if (meal) {
      setFoodName(meal.name);
      setCalories(meal.calories);
      setProtein(meal.protein);
      setFat(meal.fat);
      setCarbs(meal.carbs);
      setFiber(meal.fiber || '');
    }
  }, [meal]);

  const handleSave = () => {
    if (meal) {
      const updatedMeal: Meal = {
        ...meal,
        name: foodName,
        calories: Number(calories),
        protein: Number(protein),
        fat: Number(fat),
        carbs: Number(carbs),
        fiber: Number(fiber),
      };
      updateMeal(updatedMeal);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-end transition-all duration-300 ease-in-out ${
        isOpen ? 'visible bg-black/50' : 'invisible bg-black/0'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col rounded-t-xl bg-white dark:bg-gray-800">
          <div className="flex w-full items-center justify-center p-4">
            <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          </div>
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Food</h1>
              <p className="text-base text-gray-600 dark:text-gray-400">Edit the details of your food entry.</p>
            </div>
            <div className="space-y-4">
            <input
                className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
                placeholder="Food Name"
                type="text"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
                  placeholder="Calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <input
                  className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
                  placeholder="Protein (g)"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <input
                  className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
                  placeholder="Fat (g)"
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <input
                  className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
                  placeholder="Carbs (g)"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <input
                className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
                placeholder="Fiber (g)"
                type="number"
                value={fiber}
                onChange={(e) => setFiber(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <button
              className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
};

export default EditFoodModal;
