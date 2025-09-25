import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';
import type { AppData, DailyLog, Meal, WorkoutSession, CommonFood, DailyFitbitData, FitbitActivity, UserProfile } from '../types';
import { loadData, saveData } from '../services/dataService';
import { refreshAccessToken, getDailyActivity, getDailyHRV, getDailyHeartRate, getCalories } from '../services/fitbitService';

interface AppContextType {
    appData: AppData | null;
    isLoading: boolean;
    getTodaysLog: () => DailyLog | undefined;
    saveTodaysMeasurements: (date: string, measurements: Partial<DailyLog>) => void;
    updateWeight: (date: string, weight: number) => void;
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
    userProfile: UserProfile | undefined;
    updateUserProfile: (profile: UserProfile) => void;
    // Fitbit specific state and functions
    isFitbitAuthenticated: boolean;
    fitbitAccessToken: string | null;
    authenticateFitbit: (tokens: { access_token: string; refresh_token: string; expires_in: number }) => Promise<void>;
    logoutFitbit: () => Promise<void>;
    setFitbitData: (date: string, data: Partial<DailyFitbitData>) => void;
    injectDummyFitbitData: () => void;
    deleteFitbitData: () => void;
    syncFitbitData: (date: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appData, setAppData] = useState<AppData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(null);
    const [fitbitAccessToken, setFitbitAccessToken] = useState<string | null>(null);

    const isFitbitAuthenticated = !!fitbitAccessToken;

    // Function to handle Fitbit authentication
    const authenticateFitbit = async (tokens: { access_token: string; refresh_token: string; expires_in: number }) => {
        const expirationTime = Date.now() + tokens.expires_in * 1000;
        await Preferences.set({ key: 'fitbit_access_token', value: tokens.access_token });
        await Preferences.set({ key: 'fitbit_refresh_token', value: tokens.refresh_token });
        await Preferences.set({ key: 'fitbit_token_expires_at', value: String(expirationTime) });
        setFitbitAccessToken(tokens.access_token);
        console.log('Fitbit authenticated and tokens stored.');
    };

    // Function to log out from Fitbit
    const logoutFitbit = async () => {
        await Preferences.remove({ key: 'fitbit_access_token' });
        await Preferences.remove({ key: 'fitbit_refresh_token' });
        await Preferences.remove({ key: 'fitbit_token_expires_at' });
        setFitbitAccessToken(null);
        console.log('Fitbit logged out.');
    };

    useEffect(() => {
        const initLoad = async () => {
            setIsLoading(true);
            // Load app data
            const data = await loadData();
            setAppData(data);
            if (data?.settings?.geminiApiKey) {
                setGeminiApiKeyState(data.settings.geminiApiKey);
            }

            // Check for Fitbit tokens
            const { value: accessToken } = await Preferences.get({ key: 'fitbit_access_token' });
            const { value: refreshToken } = await Preferences.get({ key: 'fitbit_refresh_token' });
            const { value: expiresAtStr } = await Preferences.get({ key: 'fitbit_token_expires_at' });

            if (accessToken && refreshToken && expiresAtStr) {
                const expiresAt = parseInt(expiresAtStr, 10);
                if (Date.now() < expiresAt) {
                    // Token is still valid
                    setFitbitAccessToken(accessToken);
                    console.log('Fitbit token loaded from storage.');
                } else {
                    // Token is expired, try to refresh it
                    console.log('Fitbit token expired, attempting to refresh...');
                    try {
                        const newTokens = await refreshAccessToken(refreshToken);
                        await authenticateFitbit(newTokens);
                        console.log('Fitbit token refreshed successfully.');
                    } catch (error) {
                        console.error('Failed to refresh Fitbit token, logging out.', error);
                        await logoutFitbit();
                    }
                }
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
    
    const setFitbitData = useCallback((date: string, data: Partial<DailyFitbitData>) => {
        setAppData(prevData => {
            if (!prevData) return null;
            const newFitbitData = { ...prevData.fitbitData };
            newFitbitData[date] = { ...newFitbitData[date], ...data };
            console.log('setFitbitData: newFitbitData[date].summary', newFitbitData[date].summary);
            return {
                ...prevData,
                fitbitData: newFitbitData,
            };
        });
    }, []);

    const injectDummyFitbitData = useCallback(() => {
        const today = new Date().toISOString().slice(0, 10);
        setAppData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                fitbitData: {
                    ...prevData.fitbitData,
                    [today]: {
                        summary: {
                            caloriesOut: 2500,
                            activityCalories: 1000,
                            caloriesBMR: 1500,
                            activeScore: 100,
                            steps: 10000,
                            floors: 10,
                            elevation: 30,
                            sedentaryMinutes: 300,
                            lightlyActiveMinutes: 120,
                            fairlyActiveMinutes: 60,
                            veryActiveMinutes: 30,
                            marginalCalories: 500,
                            restingHeartRate: 55,
                            heartRateZones: [],
                            hrv: 65,
                        },
                        activities: [
                            {
                                logId: 1,
                                activityId: 20001,
                                activityParentId: 20001,
                                activityParentName: 'Run',
                                name: 'Morning Jog',
                                description: '',
                                calories: 350,
                                distance: 3.5,
                                steps: 4500,
                                duration: 1800000, // 30 mins
                                lastModified: new Date().toISOString(),
                                startTime: '07:00',
                                isFavorite: false,
                                hasActiveZoneMinutes: true,
                                startDate: today,
                                hasStartTime: true,
                                averageHeartRate: 130,
                            },
                            {
                                logId: 2,
                                activityId: 20002,
                                activityParentId: 20002,
                                activityParentName: 'Walk',
                                name: 'Evening Stroll',
                                description: '',
                                calories: 150,
                                distance: 2.0,
                                steps: 3000,
                                duration: 1200000, // 20 mins
                                lastModified: new Date().toISOString(),
                                startTime: '19:00',
                                isFavorite: false,
                                hasActiveZoneMinutes: false,
                                startDate: today,
                                hasStartTime: true,
                                averageHeartRate: 90,
                            },
                            {
                                logId: 3,
                                activityId: 20003,
                                activityParentId: 20003,
                                activityParentName: 'Weight Training',
                                name: 'Upper Body Workout',
                                description: '',
                                calories: 400,
                                distance: 0,
                                steps: 0,
                                duration: 3600000, // 60 mins
                                lastModified: new Date().toISOString(),
                                startTime: '10:00',
                                isFavorite: false,
                                hasActiveZoneMinutes: false,
                                startDate: today,
                                hasStartTime: true,
                                averageHeartRate: 110,
                            },
                            {
                                logId: 4,
                                activityId: 20004,
                                activityParentId: 20004,
                                activityParentName: 'Elliptical',
                                name: 'Gym Cardio',
                                description: '',
                                calories: 450,
                                distance: 4.0,
                                steps: 5000,
                                duration: 2400000, // 40 mins
                                lastModified: new Date().toISOString(),
                                startTime: '16:00',
                                isFavorite: false,
                                hasActiveZoneMinutes: true,
                                startDate: today,
                                hasStartTime: true,
                                averageHeartRate: 145,
                            },
                        ],
                    },
                },
            };
        });
    }, []);

    const deleteFitbitData = useCallback(() => {
        setAppData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                fitbitData: {},
            };
        });
    }, []);

    const syncFitbitData = async (date: string) => {
        alert(`Syncing for date: ${date}`);
        if (!fitbitAccessToken) return;

        try {
            const activityData = await getDailyActivity(fitbitAccessToken, date);
            const hrvData = await getDailyHRV(fitbitAccessToken, date);
            const heartRateData = await getDailyHeartRate(fitbitAccessToken, date);
            const caloriesData = await getCalories(fitbitAccessToken, date);

            console.log('Fitbit API Data:', {
                activityData,
                hrvData,
                heartRateData,
                caloriesData
            });

            const fitbitData: DailyFitbitData = {
                summary: activityData?.summary,
                activities: activityData?.activities,
                hrv: hrvData?.hrv,
                rhr: heartRateData?.["activities-heart"]?.[0]?.value?.restingHeartRate,
                calories: caloriesData?.['activities-calories']?.[0]?.value
            };

            setFitbitData(date, fitbitData);

            const hrvValue = hrvData?.hrv?.[0]?.value?.dailyRmssd;
            const rhrValue = heartRateData?.["activities-heart"]?.[0]?.value?.restingHeartRate;
            const caloriesValue = caloriesData?.['activities-calories']?.[0]?.value;

            updateLog(date, {
                hrv: hrvValue,
                rhr: rhrValue,
                calories: caloriesValue ? parseInt(caloriesValue) : undefined
            });

            const existingWorkouts = getLogForDate(date)?.workouts || [];
            const fitbitActivities = activityData.activities || [];
            console.log('syncFitbitData: fitbitActivities', fitbitActivities);

            fitbitActivities.forEach((activity: FitbitActivity) => {
                const existingWorkout = existingWorkouts.find(w => w.fitbitLogId === activity.logId);

                if (!existingWorkout) {
                    let newWorkout: WorkoutSession;
                    if (activity.activityParentName === 'Weight Training') {
                        newWorkout = {
                            type: 'weightlifting',
                            fitbitLogId: activity.logId,
                            name: activity.name,
                            date: activity.startDate,
                            duration: activity.duration / 60000, // convert ms to minutes
                            caloriesBurned: activity.calories,
                            notes: activity.description,
                            exercises: [],
                        };
                    } else {
                        newWorkout = {
                            type: 'cardio',
                            fitbitLogId: activity.logId,
                            name: activity.name,
                            date: activity.startDate,
                            duration: activity.duration / 60000, // convert ms to minutes
                            caloriesBurned: activity.calories,
                            notes: activity.description,
                            distance: activity.distance,
                            pace: 0,
                            exercises: [],
                        };
                    }
                    addWorkout(date, newWorkout);
                }
            });
        } catch (error) {
            console.error('Failed to sync Fitbit data', error);
        }
    };

    const updateUserProfile = (profile: UserProfile) => {
        setAppData(prevData => {
            if (!prevData) return null;
            return { ...prevData, userProfile: profile };
        });
    };

    const saveTodaysMeasurements = (date: string, measurements: Partial<DailyLog>) => {
        setAppData(prevData => {
            if (!prevData) return null;
            const newLogs = { ...prevData.logs };
            if (newLogs[date]) {
                newLogs[date] = { ...newLogs[date], ...measurements };
            } else {
                newLogs[date] = {
                    date,
                    weight: null,
                    meals: [],
                    workouts: [],
                    notes: '',
                    ...measurements,
                }
            }
            return { ...prevData, logs: newLogs };
        });
    };

    const updateWeight = (date: string, weight: number) => {
        saveTodaysMeasurements(date, { weight });
        setAppData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                userProfile: {
                    ...prevData.userProfile,
                    currentWeight: weight,
                },
            };
        });
    };

    const value = {
        appData,
        isLoading,
        getTodaysLog,
        saveTodaysMeasurements,
        updateWeight,
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
        userProfile: appData?.userProfile,
        updateUserProfile,
        // Fitbit
        isFitbitAuthenticated,
        fitbitAccessToken,
        authenticateFitbit,
        logoutFitbit,
        setFitbitData,
        injectDummyFitbitData,
        deleteFitbitData,
        syncFitbitData,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};