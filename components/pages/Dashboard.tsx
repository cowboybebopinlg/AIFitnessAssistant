import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SettingsIcon, ClipboardIcon, DumbbellIcon, RunningIcon } from '../icons';
import { getSmartSuggestion } from '../../services/geminiService';
import { Preferences } from '@capacitor/preferences';
import { getDailyActivity } from '../../services/fitbitService';

// --- Re-created components based on Stitch design ---

const CircularProgress: React.FC<{ value: number }> = ({ value }) => {
    const percentage = value || 0;
    const circumference = 2 * Math.PI * 15.9155;
    const strokeDasharray = `${(percentage / 100) * circumference}, ${circumference}`;

    return (
        <div className="relative w-20 h-20 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                    className="text-gray-700"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                ></path>
                <path
                    className="text-primary-500"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                    strokeWidth="3"
                    transform="rotate(-90 18 18)"
                ></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-500 glow">{value}</span>
            </div>
        </div>
    );
};

const MorningMetricsCard = ({ data }) => {
    const readiness = 85;
    const rhr = 60;
    const hrv = 75;
    const energy = '90%';
    const soreness = 'Low';

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-start">
                <h3 className="text-white text-lg font-bold">Morning Metrics</h3>
                <button className="text-gray-400 hover:text-white">
                    <ClipboardIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="text-center">
                    <CircularProgress value={readiness} />
                    <p className="text-white text-sm mt-2">Readiness</p>
                </div>
                <div className="text-center self-center">
                    <p className="text-gray-400 text-sm">RHR</p>
                    <p className="text-white text-2xl font-bold">{rhr} bpm</p>
                </div>
                <div className="text-center self-center">
                    <p className="text-gray-400 text-sm">HRV</p>
                    <p className="text-white text-2xl font-bold">{hrv} ms</p>
                </div>
                <div className="text-center self-center">
                    <p className="text-gray-400 text-sm">Energy</p>
                    <p className="text-white text-2xl font-bold">{energy}</p>
                </div>
                <div className="text-center self-center">
                    <p className="text-gray-400 text-sm">Soreness</p>
                    <p className="text-white text-2xl font-bold">{soreness}</p>
                </div>
            </div>
        </div>
    );
};

const GlowingProgressBar: React.FC<{ value: number; max: number; label: string }> = ({ value, max, label }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center text-white text-sm mb-1">
                <p>{label}</p>
                <p>{value} / {max}</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full glow" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const NutritionCard = ({ data, targets }) => {
    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-start">
                <h3 className="text-white text-lg font-bold">Nutrition</h3>
                <button className="text-gray-400 hover:text-white">
                    <ClipboardIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="space-y-4 mt-2">
                <GlowingProgressBar value={data.calories} max={targets.calories} label="Calories" />
                <GlowingProgressBar value={data.protein} max={targets.protein} label="Protein" />
                <GlowingProgressBar value={data.fat} max={targets.fat} label="Fat" />
                <GlowingProgressBar value={data.carbs} max={targets.carbs} label="Carbs" />
                <GlowingProgressBar value={data.fiber} max={targets.fiber} label="Fiber" />
            </div>
        </div>
    );
};

const WorkoutsCard = ({ workouts }) => {
    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-start">
                <h3 className="text-white text-lg font-bold">Today's Workouts</h3>
                <button className="text-gray-400 hover:text-white">
                    <ClipboardIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="space-y-4 mt-2">
                {workouts && workouts.length > 0 ? (
                    workouts.map((workout, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className="text-white flex items-center justify-center rounded-lg bg-gray-700 shrink-0 w-12 h-12">
                                {workout.exercises[0]?.type === 'weights' ? <DumbbellIcon className="w-6 h-6" /> : <RunningIcon className="w-6 h-6" />}
                            </div>
                            <div className="flex flex-col justify-center flex-grow">
                                <p className="text-white text-base font-medium">{workout.name}</p>
                                <p className="text-gray-400 text-sm">{workout.exercises[0]?.type === 'weights' ? 'Weightlifting' : 'Cardio'}</p>
                            </div>
                            <div className="text-primary-500 text-sm font-bold">Completed</div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-center">No workouts logged for today.</p>
                )}
            </div>
        </div>
    );
};

const SmartSuggestionsCard = ({ suggestion, onRefresh }) => {
    const mockSuggestion = "Focus on recovery today. Consider a light activity like yoga or a short walk to maintain mobility without overexerting yourself. Your body is primed for growth, so prioritize nutrient-rich meals and adequate sleep to maximize your gains.";

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-start">
                <h3 className="text-white text-lg font-bold">Smart Suggestions</h3>
                <button className="text-gray-400 hover:text-white">
                    <ClipboardIcon className="w-6 h-6" />
                </button>
            </div>
            <p className="text-gray-300 text-sm font-normal leading-relaxed mt-2">
                {suggestion}
            </p>
        </div>
    );
};

const FitbitActivityCard: React.FC = () => {
    const [steps, setSteps] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFitbitSteps = async () => {
            setLoading(true);
            setError(null);
            try {
                const { value: accessToken } = await Preferences.get({ key: 'fitbit_access_token' });
                if (accessToken) {
                    const activityData = await getDailyActivity(accessToken);
                    if (activityData && activityData.summary && activityData.summary.steps !== undefined) {
                        setSteps(activityData.summary.steps);
                    } else {
                        setSteps(0); // No steps data found
                    }
                } else {
                    setError('Fitbit not connected.');
                }
            } catch (err) {
                console.error('Error fetching Fitbit activity:', err);
                setError('Failed to fetch Fitbit data.');
            } finally {
                setLoading(false);
            }
        };

        fetchFitbitSteps();
    }, []);

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-start">
                <h3 className="text-white text-lg font-bold">Fitbit Activity</h3>
                <button className="text-gray-400 hover:text-white">
                    <ClipboardIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="mt-2 text-center">
                {loading && <p className="text-gray-400">Loading steps...</p>}
                {error && <p className="text-red-400">{error}</p>}
                {steps !== null && !loading && !error && (
                    <p className="text-white text-2xl font-bold">Steps: {steps}</p>
                )}
                {steps === null && !loading && !error && <p className="text-gray-400">No steps data available.</p>}
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { appData, isLoading, getTodaysLog } = useAppContext();
    const [suggestion, setSuggestion] = useState('Loading...');

    const todaysLog = getTodaysLog();

    const nutritionTotals = useMemo(() => {
        const totals = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
        todaysLog?.meals.forEach(meal => {
            totals.calories += meal.calories;
            totals.protein += meal.protein;
            totals.fat += meal.fat;
            totals.carbs += meal.carbs;
            totals.fiber += meal.fiber || 0;
        });
        return totals;
    }, [todaysLog]);

    const fetchSuggestion = useCallback(async () => {
        setSuggestion('Generating new suggestion...');
        try {
            const newSuggestion = await getSmartSuggestion();
            setSuggestion(newSuggestion);
        } catch (error: any) {
            // Since Gemini integration is disabled, we'll just log the error and display a generic message.
            console.error("Error fetching smart suggestion:", error);
            setSuggestion("Failed to get smart suggestion (Gemini disabled).");
        }
    }, []);

    useEffect(() => {
        if (appData) {
            fetchSuggestion();
        }
    }, [fetchSuggestion, appData]);

    if (isLoading || !appData) {
        return (
            <div className="flex justify-center items-center h-screen bg-dark-900 text-white">
                <div className="text-center font-grotesk">
                    <h1 className="text-2xl font-semibold">Loading your data...</h1>
                    <p className="text-gray-400">Please wait a moment.</p>
                </div>
            </div>
        );
    }

    const { targets } = appData;

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-gray-900 justify-between font-grotesk text-white">
            <div className="flex-grow">
                <header className="flex items-center p-4 pb-2 justify-between sticky top-0 bg-gray-900 z-10">
                    <div className="w-12"></div>
                    <h1 className="text-white text-2xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">GeminiFit</h1>
                    <div className="flex w-12 items-center justify-end">
                        <button className="flex items-center justify-center h-12 w-12 bg-transparent text-white">
                            <SettingsIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>
                <main className="p-4 space-y-6">
                    <MorningMetricsCard data={todaysLog} />
                    <FitbitActivityCard />
                    <NutritionCard data={nutritionTotals} targets={targets} />
                    <WorkoutsCard workouts={todaysLog?.workouts} />
                    <SmartSuggestionsCard suggestion={suggestion} onRefresh={fetchSuggestion} />
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
