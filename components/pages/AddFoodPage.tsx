import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import AddWithGeminiModal from '../AddWithGeminiModal';
import { useAppContext } from '../../context/AppContext';
import { Meal } from '../../types';
import { getNutritionInfoFromText } from '../../services/geminiService';
import LoadingIndicator from '../LoadingIndicator';
import { getLocalDateString } from '../../services/utils';
import FormInput from '../FormInput';

/**
 * A page component for adding food to the daily log.
 * It provides multiple ways to add a food item:
 * 1. From a list of saved (common) foods.
 * 2. From a list of recent foods from the current day.
 * 3. By parsing a natural language description using Gemini.
 * 4. By entering the nutritional information manually.
 * The manual entry form can be pre-filled with data passed via navigation state.
 * @returns {JSX.Element} The rendered Add Food page component.
 */
const AddFoodPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { appData, addMeal, getTodaysLog, geminiApiKey, addCommonFood } = useAppContext();
  const todayLog = getTodaysLog();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const prefillItems = location.state?.prefillItems; // Get prefill items from navigation state

  useEffect(() => {
    window.scrollTo(0, 0);
    if (prefillItems && prefillItems.length > 0) {
      const combinedName = prefillItems.map(item => item.name).join(', ');
      const totalCalories = prefillItems.reduce((sum, item) => sum + (item.calories || 0), 0);
      const totalProtein = prefillItems.reduce((sum, item) => sum + (item.protein || 0), 0);
      const totalFat = prefillItems.reduce((sum, item) => sum + (item.fat || 0), 0);
      const totalCarbs = prefillItems.reduce((sum, item) => sum + (item.carbs || 0), 0);
      const totalFiber = prefillItems.reduce((sum, item) => sum + (item.fiber || 0), 0);
      const totalSodium = prefillItems.reduce((sum, item) => sum + (item.sodium || 0), 0);

      setFoodName(combinedName);
      setCalories(totalCalories > 0 ? totalCalories : '');
      setProtein(totalProtein > 0 ? totalProtein : '');
      setFat(totalFat > 0 ? totalFat : '');
      setCarbs(totalCarbs > 0 ? totalCarbs : '');
      setFiber(totalFiber > 0 ? totalFiber : '');
      setSodium(totalSodium > 0 ? totalSodium : '');
    }
  }, [prefillItems]);

  const dateString = searchParams.get('date') || getLocalDateString(new Date());

  const [activeTab, setActiveTab] = useState('saved'); // 'saved' or 'recent'
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fiber, setFiber] = useState<number | ''>('');
  const [sodium, setSodium] = useState<number | ''>('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  const handleClose = () => {
    navigate(-1); // Go back to the previous page (Daily Log)
  };

  const handleAddFoodManually = async () => {
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
      sodium: Number(sodium),
    };

    console.log('Adding meal:', newMeal, 'on date:', dateString);
    await addMeal(dateString, newMeal);

    if (saveAsFavorite) {
        addCommonFood(newMeal);
    }

    navigate('/log');
  };

  const handleAnalyzeFoodWithGemini = async (text: string) => {
    if (!geminiApiKey) {
      alert("Please set your Gemini API key in the settings.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const meal = await getNutritionInfoFromText(text, appData, geminiApiKey);
      const newMeal: Meal = {
        name: meal.name || 'Unknown Food',
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        fat: meal.fat || 0,
        carbs: meal.carbs || 0,
        fiber: meal.fiber || 0,
      };
      addMeal(dateString, newMeal);
      navigate('/log');
    } catch (error) {
      console.error(error);
      alert("Failed to parse food entry with Gemini.");
    } finally {
      setIsAnalyzing(false);
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
                className="w-full flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-primary text-white font-bold text-base hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
              <FormInput
                label="Food Name"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="e.g., Chicken Breast"
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g., 165"
                />
                <FormInput
                  label="Protein (g)"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g., 31"
                />
                <FormInput
                  label="Fat (g)"
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g., 3.6"
                />
                <FormInput
                  label="Carbs (g)"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g., 0"
                />
                <FormInput
                  label="Sodium (mg)"
                  type="number"
                  value={sodium}
                  onChange={(e) => setSodium(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g., 74"
                />
                <FormInput
                  label="Fiber (g)"
                  type="number"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g., 0"
                />
              </div>
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
              className="w-full flex items-center justify-center h-12 px-6 rounded-lg bg-primary text-white font-bold text-base hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleAddFoodManually}
            >
              Add Food
            </button>
          </div>
        </main>
      </div>


      <AddWithGeminiModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        title="Add Food with Gemini"
        description="Let Gemini analyze your food input and add it to your log."
        placeholder="e.g., 1 scoop protein, 1 banana, 300ml milk"
        onAnalyze={handleAnalyzeFoodWithGemini}
      />
      {isAnalyzing && <LoadingIndicator />}
    </div>
  );
};

export default AddFoodPage;