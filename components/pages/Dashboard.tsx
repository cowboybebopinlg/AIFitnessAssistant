import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SettingsIcon, ClipboardIcon, DumbbellIcon, RunningIcon, RefreshCwIcon } from '../icons';
import { getSmartSuggestion } from '../../services/geminiService';
import { getDailyActivity, getDailyHRV } from '../../services/fitbitService';

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

const MorningMetricsCard = ({ data, fitbitData }) => {
    const fitbitSummary = fitbitData?.summary;
    // Readiness Score is not available via Fitbit API, using a placeholder.
    const readiness = 'N/A';
    const rhr = fitbitSummary?.restingHeartRate || 'N/A';
    const hrv = fitbitData?.hrv?.[0]?.value?.dailyRmssd || 'N/A';
    const steps = fitbitSummary?.steps?.toLocaleString() || 'N/A';
    const calories = fitbitSummary?.caloriesOut?.toLocaleString() || 'N/A';

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
                    <p className="text-gray-400 text-sm">Steps</p>
                    <p className="text-white text-2xl font-bold">{steps}</p>
                </div>
                <div className="text-center self-center">
                    <p className="text-gray-400 text-sm">Calories</p>
                    <p className="text-white text-2xl font-bold">{calories}</p>
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

const WorkoutsCard = ({ workouts, fitbitActivities }) => {
    const combinedWorkouts = useMemo(() => {
        const existingWorkouts = workouts || [];
        const newFitbitWorkouts = (fitbitActivities || []).filter(
            (activity) => !existingWorkouts.some((w) => w.fitbitLogId === activity.logId)
        ).map((activity) => ({
            // Convert FitbitActivity to a WorkoutSession-like object for consistent rendering
            fitbitLogId: activity.logId,
            name: activity.activityName || activity.activityParentName,
            duration: Math.floor(activity.duration / 60000), // Convert to int minutes
            caloriesBurned: Math.floor(activity.calories), // Convert to int calories
            type: activity.activityParentName === 'Weight Training' ? 'weightlifting' : 'cardio',
            exercises: [], // Placeholder, as full exercise details aren't available here
        }));

        return [...existingWorkouts, ...newFitbitWorkouts];
    }, [workouts, fitbitActivities]);

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-start">
                <h3 className="text-white text-lg font-bold">Today's Workouts</h3>
                <button className="text-gray-400 hover:text-white">
                    <ClipboardIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="space-y-4 mt-2">
                {combinedWorkouts.length > 0 ? (
                    combinedWorkouts.map((workout, index) => (
                        <div key={workout.fitbitLogId || index} className="flex items-center gap-4">
                            <div className={`text-white flex items-center justify-center rounded-lg shrink-0 w-12 h-12 ${workout.fitbitLogId ? 'bg-blue-700' : 'bg-gray-700'}`}>
                                {workout.type === 'weightlifting' ? <DumbbellIcon className="w-6 h-6" /> : <RunningIcon className="w-6 h-6" />}
                            </div>
                            <div className="flex flex-col justify-center flex-grow">
                                <p className="text-white text-base font-medium">{workout.name} {workout.fitbitLogId ? '(Fitbit)' : ''}</p>
                                <p className="text-gray-400 text-sm">
                                    {workout.type === 'weightlifting' ? 'Weightlifting' : 'Cardio'}
                                    {workout.duration ? `, ${Math.round(workout.duration)} mins` : ''}
                                    {workout.caloriesBurned ? `, ${Math.round(workout.caloriesBurned)} kcal` : ''}
                                </p>
                            </div>
                            <div className={`${workout.fitbitLogId ? 'text-blue-300' : 'text-primary-500'} text-sm font-bold`}>
                                {workout.fitbitLogId ? 'Synced' : 'Completed'}
                            </div>
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
    const parseSuggestion = (text) => {
        try {
            // Clean the response to get only the JSON part
            const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(jsonText);
            const sections = [];
            if (parsed.food && parsed.food.length > 0) {
                sections.push({ title: "Food", content: parsed.food.map(item => `• ${item}`).join('\n') });
            }
            if (parsed.activity && parsed.activity.length > 0) {
                sections.push({ title: "Activity", content: parsed.activity.map(item => `• ${item}`).join('\n') });
            }
            if (parsed.other && parsed.other.length > 0) {
                sections.push({ title: "Other Suggestions", content: parsed.other.map(item => `• ${item}`).join('\n') });
            }
            return sections;
        } catch (error) {
            console.error("Failed to parse smart suggestion JSON:", error);
            return [{ title: "Suggestion", content: text }];
        }
    };

    const suggestionSections = parseSuggestion(suggestion);

    return (
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-start">
                <h3 className="text-white text-lg font-bold">Smart Suggestions</h3>
                <button className="text-blue-500 hover:text-blue-400" onClick={onRefresh}>
                    <RefreshCwIcon className="w-6 h-6" />
                </button>
            </div>
            {suggestionSections.length > 0 ? (
                suggestionSections.map((section, index) => (
                    <div key={index} className="mt-4">
                        <h4 className="text-primary-500 font-bold">{section.title}</h4>
                        <p className="text-gray-300 text-sm font-normal leading-relaxed whitespace-pre-line">
                            {section.content}
                        </p>
                    </div>
                ))
            ) : (
                <p className="text-gray-300 text-sm font-normal leading-relaxed mt-2">
                    {suggestion}
                </p>
            )}
        </div>
    );
};



export const Dashboard: React.FC = () => {
    const { appData, isLoading, getTodaysLog, getLogForDate, geminiApiKey } = useAppContext();
    const [suggestion, setSuggestion] = useState('Loading...');
    const [hasFetchedInitialSuggestion, setHasFetchedInitialSuggestion] = useState(false);

    const todaysLog = getTodaysLog();

    const todayDateString = new Date().toISOString().slice(0, 10);

    const todaysFitbitData = appData?.fitbitData?.[todayDateString];

    const fitbitSummary = todaysFitbitData?.summary;
    const fitbitActivities = todaysFitbitData?.activities || [];

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
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDateString = yesterday.toISOString().slice(0, 10);
            const yesterdaysLog = getLogForDate(yesterdayDateString);

            const newSuggestion = await getSmartSuggestion(
                yesterdaysLog,
                todaysLog,
                appData?.userProfile,
                geminiApiKey || ''
            );
            setSuggestion(newSuggestion);
        } catch (error: any) {
            console.error("Error fetching smart suggestion:", error);
            setSuggestion("Failed to get smart suggestion. Please try again later.");
        }
    }, [appData, getLogForDate, todaysLog, geminiApiKey]);

    useEffect(() => {
        if (appData && !hasFetchedInitialSuggestion) {
            fetchSuggestion();
            setHasFetchedInitialSuggestion(true);
        }
    }, [fetchSuggestion, appData, hasFetchedInitialSuggestion]);

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
                    <MorningMetricsCard data={todaysLog} fitbitData={todaysFitbitData} />
                    
                    <NutritionCard data={nutritionTotals} targets={targets} />
                    <WorkoutsCard workouts={todaysLog?.workouts} fitbitActivities={fitbitActivities} />
                    <SmartSuggestionsCard suggestion={suggestion} onRefresh={fetchSuggestion} />
                </main>
            </div>
        </div>
    );
};
