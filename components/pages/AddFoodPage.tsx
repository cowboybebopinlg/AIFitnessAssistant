import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AddWithGeminiModal from '../AddWithGeminiModal';
import { useAppContext } from '../../context/AppContext';
import { Meal } from '../../types';
import { getNutritionInfoFromText } from '../../services/geminiService';

const AddFoodPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { appData, addMeal, getTodaysLog, geminiApiKey, addCommonFood } = useAppContext();
  const todayLog = getTodaysLog();

  const dateString = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState('saved'); // 'saved' or 'recent'
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fiber, setFiber] = useState<number | ''>('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  const handleClose = () => {
    navigate(-1); // Go back to the previous page (Daily Log)
  };

  const handleAddFoodManually = () => {
    if (!foodName || !calories || !protein || !fat || !carbs) {
      alert("Please fill in all manual entry fields.");
      return;
    }

    const newMeal: Meal = {
      name: foodName,
      calories: Number(calories),
      protein: Number(protein),
      fat: Number(fat),
      carbs: Number(carbs),
      fiber: Number(fiber),
    };

    addMeal(dateString, newMeal);

    if (saveAsFavorite) {
      addCommonFood(newMeal);
    }

    alert(`Manually added: ${foodName}`);
    // Clear form
    setFoodName('');
    setCalories('');
    setProtein('');
    setFat('');
    setCarbs('');
    setFiber('');
    setSaveAsFavorite(false);
  };

  const handleAnalyzeFoodWithGemini = async (text: string) => {
    if (!geminiApiKey) {
      alert("Please set your Gemini API key in the settings.");
      return;
    }

    try {
      const meal = await getNutritionInfoFromText(text, geminiApiKey);
      const newMeal: Meal = {
        name: meal.name || 'Unknown Food',
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        fat: meal.fat || 0,
        carbs: meal.carbs || 0,
        fiber: meal.fiber || 0,
      };
      addMeal(dateString, newMeal);
      alert(`Added via Gemini: ${newMeal.name}`);
    } catch (error) {
      console.error(error);
      alert("Failed to parse food entry with Gemini.");
    }
  };

  const savedFoods = appData?.commonFoods || [];
  const recentFoods = todayLog?.meals || []; // Use actual meals from today's log as recent

  const foodsToDisplay = activeTab === 'saved' ? savedFoods : recentFoods;

  const handleAddFoodFromList = (food: Meal) => {
    addMeal(dateString, food);
    alert(`Added ${food.name} from list!`);
  };

  return (
    <div className="flex flex-col h-screen justify-between">
      <div className="flex-grow overflow-y-auto">
        <header className="sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm z-10">
          <div className="flex items-center p-4">
            <button className="text-neutral-800 dark:text-neutral-200" onClick={handleClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h1 className="text-lg font-bold text-center flex-1 pr-6">Add Food</h1>
          </div>
          <div className="border-b border-neutral-200 dark:border-neutral-700 px-4">
            <div className="flex">
              <a
                className={`flex-1 text-center py-3 text-sm font-bold border-b-2 ${activeTab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 dark:text-neutral-400'}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('saved'); }}
              >
                Saved
              </a>
              <a
                className={`flex-1 text-center py-3 text-sm font-bold border-b-2 ${activeTab === 'recent' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 dark:text-neutral-400'}`}
                href="#"
                onClick={(e) => { e.preventDefault(); setActiveTab('recent'); }}
              >
                Recent
              </a>
            </div>
          </div>
        </header>
        <main className="p-4 space-y-4">
          <section>
            <div className="space-y-2">
              {foodsToDisplay.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-center">No {activeTab} foods found.</p>
              ) : (
                foodsToDisplay.map((food, index) => (
                  <div key={index} className="flex items-center gap-4 p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer">
                    <div
                      className="w-14 h-14 rounded-lg bg-cover bg-center"
                      style={{ backgroundImage: `url('${(food as any).imageUrl || 'https://via.placeholder.com/150?text=Food'}')` }}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium">{food.name}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{food.calories} kcal</p>
                    </div>
                    <button onClick={() => handleAddFoodFromList(food)}>
                      <span className="material-symbols-outlined text-neutral-400 dark:text-neutral-500">add_circle_outline</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
          {geminiApiKey && (
            <section className="py-4">
              <button
                className="w-full flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-white font-bold text-base"
                onClick={() => setIsGeminiModalOpen(true)}
              >
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
                <span>Add with Gemini</span>
              </button>
            </section>
          )}
          <section>
            <h2 className="text-xl font-bold mb-4">Manual Entry</h2>
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
              <label className="flex items-center justify-between p-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50">
                <span className="font-medium">Save as Favorite</span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    className="sr-only peer"
                    type="checkbox"
                    checked={saveAsFavorite}
                    onChange={(e) => setSaveAsFavorite(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-neutral-300 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary"></div>
                </div>
              </label>
            </div>
          </section>
          <div className="pt-4">
            <button
              className="w-full h-12 px-6 rounded-lg bg-primary/90 hover:bg-primary text-white font-bold text-base"
              onClick={handleAddFoodManually}
            >
              Add Food
            </button>
          </div>
        </main>
      </div>
      <footer className="sticky bottom-0 bg-background-light dark:bg-background-dark border-t border-neutral-200 dark:border-neutral-700">
        <nav className="flex justify-around items-center h-16">
          <a className="flex flex-col items-center gap-1 text-neutral-500 dark:text-neutral-400" href="#">
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">Dashboard</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-primary" href="#">
            <span className="material-symbols-outlined">description</span>
            <span className="text-xs font-medium">Daily Log</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-neutral-500 dark:text-neutral-400" href="#">
            <span className="material-symbols-outlined">trending_up</span>
            <span className="text-xs font-medium">Trends</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-neutral-500 dark:text-neutral-400" href="#">
            <span className="material-symbols-outlined">bookmark</span>
            <span className="text-xs font-medium">Library</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-neutral-500 dark:text-neutral-400" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-medium">Settings</span>
          </a>
        </nav>
      </footer>

      <AddWithGeminiModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        title="Add Food with Gemini"
        description="Let Gemini analyze your food input and add it to your log."
        placeholder="e.g., 1 scoop protein, 1 banana, 300ml milk"
        onAnalyze={handleAnalyzeFoodWithGemini}
      />
    </div>
  );
};

export default AddFoodPage;
