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

  const [activeTab, setActiveTab] = useState('manual'); // 'saved', 'recent', or 'manual'
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);

  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fiber, setFiber] = useState<number | ''>('');
  const [sodium, setSodium] = useState<number | ''>('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  const canSave = foodName.trim() !== '' && calories !== '' && protein !== '' && fat !== '' && carbs !== '';

  const handleClose = () => {
    navigate(-1); // Go back to the previous page (Daily Log)
  };

  const handleAddFoodManually = async () => {
    if (!canSave) {
      alert("Please fill in all required manual entry fields.");
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

  const renderContent = () => {
    if (activeTab === 'manual') {
      return (
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
          <label className="flex items-center justify-between rounded-xl bg-neutral-800/50 p-4">
            <span className="font-medium">Save as Favorite</span>
            <div className="relative inline-flex cursor-pointer items-center">
              <input
                className="peer sr-only"
                type="checkbox"
                checked={saveAsFavorite}
                onChange={(e) => setSaveAsFavorite(e.target.checked)}
              />
              <div className="peer h-6 w-11 rounded-full bg-neutral-700 after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-600 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-neutral-600"></div>
            </div>
          </label>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {foodsToDisplay.length === 0 ? (
          <p className="text-center text-neutral-400">No {activeTab} foods found.</p>
        ) : (
          foodsToDisplay.map((food, index) => (
            <div key={index} className="flex cursor-pointer items-center gap-4 rounded-xl bg-neutral-800/50 p-3 transition-colors hover:bg-primary/20">
              <div
                className="h-14 w-14 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url('${(food as any).imageUrl || 'https://via.placeholder.com/150?text=Food'}')` }}
              ></div>
              <div className="flex-1">
                <p className="font-medium">{food.name}</p>
                <p className="text-sm text-neutral-400">{food.calories} kcal</p>
              </div>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary transition-colors hover:bg-primary/30"
                onClick={() => handleAddFoodFromList(food)}
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-background-dark text-white">
      <header className="sticky top-0 z-10 border-b border-neutral-700 bg-background-dark/80 backdrop-blur-sm">
        <div className="flex items-center p-4">
          <button className="text-neutral-200" onClick={handleClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="flex-1 text-center text-lg font-bold pr-6">Add Food</h1>
        </div>
        <div className="px-4">
          <div className="flex">
            <button
              className={`flex-1 border-b-2 py-3 text-center text-sm font-bold ${activeTab === 'manual' ? 'border-primary text-primary' : 'border-transparent text-neutral-400'}`}
              onClick={() => setActiveTab('manual')}
            >
              Manual
            </button>
            <button
              className={`flex-1 border-b-2 py-3 text-center text-sm font-bold ${activeTab === 'saved' ? 'border-primary text-primary' : 'border-transparent text-neutral-400'}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved
            </button>
            <button
              className={`flex-1 border-b-2 py-3 text-center text-sm font-bold ${activeTab === 'recent' ? 'border-primary text-primary' : 'border-transparent text-neutral-400'}`}
              onClick={() => setActiveTab('recent')}
            >
              Recent
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        {renderContent()}
      </main>
      <footer className="sticky bottom-0 z-10 space-y-4 border-t border-neutral-700 bg-background-dark/80 p-4 backdrop-blur-sm">
        {geminiApiKey && (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/20 py-4 font-bold text-primary transition-colors hover:bg-primary/30"
            onClick={() => setIsGeminiModalOpen(true)}
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>Add with Gemini</span>
          </button>
        )}
        {activeTab === 'manual' && (
          <button
            className="h-12 w-full rounded-xl bg-primary px-6 font-bold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark disabled:opacity-50"
            onClick={handleAddFoodManually}
            disabled={!canSave || isAnalyzing}
          >
            Add Food
          </button>
        )}
      </footer>

      <AddWithGeminiModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        title="Add Food with Gemini"
        description="Let Gemini analyze your food input and add it to your log."
        placeholder="e.g., 1 scoop protein, 1 banana, 300ml milk"
        onAnalyze={handleAnalyzeFoodWithGemini}
      />
      {isAnalyzing && <LoadingIndicator text="Analyzing with Gemini..." />}
    </div>
  );
};

export default AddFoodPage;