
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppData, DailyLog, Meal, WorkoutSession, CommonFood } from '../types';
import { loadData, saveData } from '../services/dataService';

interface AppContextType {
    appData: AppData | null;
    isLoading: boolean;
    getTodaysLog: () => DailyLog | undefined;
    updateLog: (date: string, updatedLog: Partial<DailyLog>) => void;
    addMeal: (date: string, meal: Meal) => void;
    updateMeal: (date: string, mealIndex: number, meal: Meal) => void;
    deleteMeal: (date: string, mealIndex: number) => void;
    addWorkout: (date: string, workout: WorkoutSession) => void;
    updateWorkout: (date: string, workoutIndex: number, workout: WorkoutSession) => void;
    deleteWorkout: (date: string, workoutIndex: number) => void;
    importData: (jsonString: string) => Promise<void>;
    exportData: () => Promise<string>;
    getLogForDate: (date: string) => DailyLog | undefined;
    geminiApiKey: string | null;
    setGeminiApiKey: (key: string | null) => void;
    addCommonFood: (food: CommonFood) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appData, setAppData] = useState<AppData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(null);

    useEffect(() => {
        const initLoad = async () => {
            setIsLoading(true);
            const data = await loadData();
            setAppData(data);
            if (data?.settings?.geminiApiKey) {
                setGeminiApiKeyState(data.settings.geminiApiKey);
            }
            setIsLoading(false);
        };
        initLoad();
    }, []);

    useEffect(() => {
        if (appData && !isLoading) {
            saveData(appData);
        }
    }, [appData, isLoading]);

    const setGeminiApiKey = (key: string | null) => {
        setGeminiApiKeyState(key);
        setAppData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                settings: {
                    ...prevData.settings,
                    geminiApiKey: key || undefined,
                },
            };
        });
    };
    
    const getTodayDateString = (): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTodaysLog = useCallback((): DailyLog | undefined => {
        if (!appData) return undefined;
        const today = getTodayDateString();
        return appData.logs[today];
    }, [appData]);

    const getLogForDate = useCallback((date: string): DailyLog | undefined => {
        if (!appData) return undefined;
        return appData.logs[date];
    }, [appData]);
    
    const updateLog = (date: string, updatedLog: Partial<DailyLog>) => {
        setAppData(prevData => {
            if (!prevData) return null;
            const newLogs = { ...prevData.logs };
            if (newLogs[date]) {
                newLogs[date] = { ...newLogs[date], ...updatedLog };
            } else {
                // If log for date doesn't exist, create it.
                newLogs[date] = {
                    date,
                    weight: null,
                    energy: null,
                    soreness: null,
                    sleepQuality: null,
                    yesterdayStress: null,
                    meals: [],
                    workouts: [],
                    notes: '',
                    ...updatedLog,
                }
            }
            return { ...prevData, logs: newLogs };
        });
    };

    const addMeal = (date: string, meal: Meal) => {
        setAppData(prevData => {
            if (!prevData || !prevData.logs[date]) {
                const newLogs = { ...(prevData?.logs || {}) };
                newLogs[date] = {
                    date,
                    weight: null,
                    energy: null,
                    soreness: null,
                    sleepQuality: null,
                    yesterdayStress: null,
                    meals: [meal],
                    workouts: [],
                    notes: '',
                };
                return { ...prevData, logs: newLogs } as AppData;
            }
            const newLogs = { ...prevData.logs };
            newLogs[date] = { ...newLogs[date], meals: [...newLogs[date].meals, meal] };
            return { ...prevData, logs: newLogs };
        });
    };

    const updateMeal = (date: string, mealIndex: number, meal: Meal) => {
        setAppData(prevData => {
            if (!prevData || !prevData.logs[date]) return prevData;
            const newLogs = { ...prevData.logs };
            const newMeals = [...newLogs[date].meals];
            newMeals[mealIndex] = meal;
            newLogs[date] = { ...newLogs[date], meals: newMeals };
            return { ...prevData, logs: newLogs };
        });
    };

    const deleteMeal = (date: string, mealIndex: number) => {
        setAppData(prevData => {
            if (!prevData || !prevData.logs[date]) return prevData;
            const newLogs = { ...prevData.logs };
            const newMeals = newLogs[date].meals.filter((_, index) => index !== mealIndex);
            newLogs[date] = { ...newLogs[date], meals: newMeals };
            return { ...prevData, logs: newLogs };
        });
    };

    const addWorkout = (date: string, workout: WorkoutSession) => {
        setAppData(prevData => {
            if (!prevData) return null;
            const newLogs = { ...prevData.logs };
            if (newLogs[date]) {
                newLogs[date] = { ...newLogs[date], workouts: [...newLogs[date].workouts, workout] };
            } else {
                newLogs[date] = {
                    date,
                    weight: null,
                    energy: null,
                    soreness: null,
                    sleepQuality: null,
                    yesterdayStress: null,
                    meals: [],
                    workouts: [workout],
                    notes: '',
                }
            }
            return { ...prevData, logs: newLogs };
        });
    };

    const updateWorkout = (date: string, workoutIndex: number, workout: WorkoutSession) => {
        setAppData(prevData => {
            if (!prevData || !prevData.logs[date]) return prevData;
            const newLogs = { ...prevData.logs };
            const newWorkouts = [...newLogs[date].workouts];
            newWorkouts[workoutIndex] = workout;
            newLogs[date] = { ...newLogs[date], workouts: newWorkouts };
            return { ...prevData, logs: newLogs };
        });
    };

    const deleteWorkout = (date: string, workoutIndex: number) => {
        setAppData(prevData => {
            if (!prevData || !prevData.logs[date]) return prevData;
            const newLogs = { ...prevData.logs };
            const newWorkouts = newLogs[date].workouts.filter((_, index) => index !== workoutIndex);
            newLogs[date] = { ...newLogs[date], workouts: newWorkouts };
            return { ...prevData, logs: newLogs };
        });
    };

    const addCommonFood = (food: CommonFood) => {
        setAppData(prevData => {
            if (!prevData) return null;
            const newCommonFoods = [...(prevData.commonFoods || []), food];
            return { ...prevData, commonFoods: newCommonFoods };
        });
    };

    const importData = async (jsonString: string): Promise<void> => {
        try {
            const data = JSON.parse(jsonString);
            // Basic validation
            if (data.targets && data.logs) {
                setAppData(data);
                await saveData(data);
            } else {
                throw new Error("Invalid data format.");
            }
        } catch (e) {
            console.error("Import failed:", e);
            throw new Error("Failed to import data. Please check the format.");
        }
    };

    const exportData = async (): Promise<string> => {
        if (!appData) {
            return "No data to export.";
        }
        try {
            const jsonString = JSON.stringify(appData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `geminifit_data_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return "Data exported successfully!";
        } catch (e) {
            console.error("Export failed:", e);
            return "Failed to export data.";
        }
    };
    
    const value = {
        appData,
        isLoading,
        getTodaysLog,
        updateLog,
        addMeal,
        updateMeal,
        deleteMeal,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        importData,
        exportData,
        getLogForDate,
        geminiApiKey,
        setGeminiApiKey,
        addCommonFood,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
