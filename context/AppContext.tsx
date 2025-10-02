import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';
import type { AppData, DailyLog, Meal, WorkoutSession, CommonFood, DailyFitbitData, FitbitActivity, UserProfile } from '../types';
import { loadData, saveData } from '../services/dataService';
import { refreshAccessToken, getDailyActivity, getDailyHRV, getDailyHeartRate, getCalories } from '../services/fitbitService';

/**
 * Defines the shape of the application's context, including state and action dispatchers.
 */
interface AppContextType {
    /** The main data object for the application. */
    appData: AppData | null;
    /** A boolean indicating if the initial data is being loaded. */
    isLoading: boolean;
    /** A function to retrieve the log for the current day. */
    getTodaysLog: () => DailyLog | undefined;
    /** A function to save daily measurements like HRV, RHR, etc. */
    saveTodaysMeasurements: (date: string, measurements: Partial<DailyLog>) => void;
    /** A function to update the user's weight for a specific day. */
    updateWeight: (date: string, weight: number) => void;
    /** A function to add a new meal to a specific day's log. */
    addMeal: (date: string, meal: Meal) => void;
    /** A function to update an existing meal in a specific day's log. */
    updateMeal: (date: string, mealIndex: number, meal: Meal) => void;
    /** A function to delete a meal from a specific day's log. */
    deleteMeal: (date: string, mealIndex: number) => void;
    /** A function to add a new workout to a specific day's log. */
    addWorkout: (date: string, workout: WorkoutSession) => void;
    /** A function to update an existing workout in a specific day's log. */
    updateWorkout: (date: string, workoutIndex: number, workout: WorkoutSession) => void;
    /** A function to delete a workout from a specific day's log. */
    deleteWorkout: (date: string, workoutIndex: number) => void;
    /** A function to import application data from a JSON string. */
    importData: (jsonString: string) => Promise<void>;
    /** A function to export application data to a JSON string. */
    exportData: () => Promise<string>;
    /** A function to retrieve the log for a specific date. */
    getLogForDate: (date: string) => DailyLog | undefined;
    /** The user's Gemini API key. */
    geminiApiKey: string | null;
    /** A function to set the Gemini API key. */
    setGeminiApiKey: (key: string | null) => void;
    /** A function to add a food item to the common foods list. */
    addCommonFood: (food: CommonFood) => void;
    /** The user's profile data. */
    userProfile: UserProfile | undefined;
    /** A function to update the user's profile. */
    updateUserProfile: (profile: UserProfile) => void;
    /** A boolean indicating if the user is authenticated with Fitbit. */
    isFitbitAuthenticated: boolean;
    /** The user's Fitbit access token. */
    fitbitAccessToken: string | null;
    /** A function to handle Fitbit authentication and store tokens. */
    authenticateFitbit: (tokens: { access_token: string; refresh_token: string; expires_in: number }) => Promise<void>;
    /** A function to log the user out from Fitbit. */
    logoutFitbit: () => Promise<void>;
    /** A function to set Fitbit data for a specific date. */
    setFitbitData: (date: string, data: Partial<DailyFitbitData>) => void;
    /** A function for injecting dummy Fitbit data for testing purposes. */
    injectDummyFitbitData: () => void;
    /** A function to delete all Fitbit data. */
    deleteFitbitData: () => void;
    /** A function to sync data from the Fitbit API for a specific date. */
    syncFitbitData: (date: string) => Promise<void>;
}

/**
 * The React context for providing application state throughout the component tree.
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * The provider component that encapsulates the state logic and provides the AppContext to its children.
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The AppProvider component.
 */
const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appData, setAppData] = useState<AppData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [geminiApiKey, setGeminiApiKeyState] = useState<string | null>(null);
    const [fitbitAccessToken, setFitbitAccessToken] = useState<string | null>(null);

    const isFitbitAuthenticated = !!fitbitAccessToken;

    /**
     * Handles Fitbit authentication by storing access and refresh tokens in preferences.
     * @param {object} tokens - The token object received from Fitbit.
     * @param {string} tokens.access_token - The access token.
     * @param {string} tokens.refresh_token - The refresh token.
     * @param {number} tokens.expires_in - The token's time to expiration in seconds.
     */
    const authenticateFitbit = async (tokens: { access_token: string; refresh_token: string; expires_in: number }) => {
        const expirationTime = Date.now() + tokens.expires_in * 1000;
        await Preferences.set({ key: 'fitbit_access_token', value: tokens.access_token });
        await Preferences.set({ key: 'fitbit_refresh_token', value: tokens.refresh_token });
        await Preferences.set({ key: 'fitbit_token_expires_at', value: String(expirationTime) });
        setFitbitAccessToken(tokens.access_token);
        console.log('Fitbit authenticated and tokens stored.');
    };

    /**
     * Logs the user out from Fitbit by removing tokens from preferences.
     */
    const logoutFitbit = async () => {
        await Preferences.remove({ key: 'fitbit_access_token' });
        await Preferences.remove({ key: 'fitbit_refresh_token' });
        await Preferences.remove({ key: 'fitbit_token_expires_at' });
        setFitbitAccessToken(null);
        console.log('Fitbit logged out.');
    };

    // Effect to load initial data and check for existing Fitbit tokens on app start.
    useEffect(() => {
        const initLoad = async () => {
            setIsLoading(true);
            const data = await loadData();
            setAppData(data);
            if (data?.settings?.geminiApiKey) {
                setGeminiApiKeyState(data.settings.geminiApiKey);
            }

            const { value: accessToken } = await Preferences.get({ key: 'fitbit_access_token' });
            const { value: refreshToken } = await Preferences.get({ key: 'fitbit_refresh_token' });
            const { value: expiresAtStr } = await Preferences.get({ key: 'fitbit_token_expires_at' });

            if (accessToken && refreshToken && expiresAtStr) {
                const expiresAt = parseInt(expiresAtStr, 10);
                if (Date.now() < expiresAt) {
                    setFitbitAccessToken(accessToken);
                } else {
                    try {
                        const newTokens = await refreshAccessToken(refreshToken);
                        await authenticateFitbit(newTokens);
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

    // Effect to save app data to preferences whenever it changes.
    useEffect(() => {
        if (appData && !isLoading) {
            saveData(appData);
        }
    }, [appData, isLoading]);

    /**
     * Sets the Gemini API key in the application state and persists it.
     * @param {string | null} key - The Gemini API key.
     */
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
    
    /**
     * Gets the current date as a string in 'YYYY-MM-DD' format.
     * @returns {string} The formatted date string.
     */
    const getTodayDateString = (): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    /**
     * Retrieves the daily log for the current day.
     * @returns {DailyLog | undefined} The log for today, or undefined if not available.
     */
    const getTodaysLog = useCallback((): DailyLog | undefined => {
        if (!appData) return undefined;
        const today = getTodayDateString();
        return appData.logs[today];
    }, [appData]);

    /**
     * Retrieves the daily log for a specific date.
     * @param {string} date - The date of the log to retrieve.
     * @returns {DailyLog | undefined} The log for the specified date, or undefined if not available.
     */
    const getLogForDate = useCallback((date: string): DailyLog | undefined => {
        if (!appData) return undefined;
        return appData.logs[date];
    }, [appData]);

    /**
     * Adds a new meal to the log for a specific date.
     * @param {string} date - The date to add the meal to.
     * @param {Meal} meal - The meal object to add.
     */
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

    /**
     * Updates an existing meal in the log for a specific date.
     * @param {string} date - The date of the meal to update.
     * @param {number} mealIndex - The index of the meal to update.
     * @param {Meal} meal - The updated meal object.
     */
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

    /**
     * Deletes a meal from the log for a specific date.
     * @param {string} date - The date of the meal to delete.
     * @param {number} mealIndex - The index of the meal to delete.
     */
    const deleteMeal = (date: string, mealIndex: number) => {
        setAppData(prevData => {
            if (!prevData || !prevData.logs[date]) return prevData;
            const newLogs = { ...prevData.logs };
            const newMeals = newLogs[date].meals.filter((_, index) => index !== mealIndex);
            newLogs[date] = { ...newLogs[date], meals: newMeals };
            return { ...prevData, logs: newLogs };
        });
    };

    /**
     * Adds a new workout session to the log for a specific date.
     * @param {string} date - The date to add the workout to.
     * @param {WorkoutSession} workout - The workout session object to add.
     */
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

    /**
     * Updates an existing workout session in the log for a specific date.
     * @param {string} date - The date of the workout to update.
     * @param {number} workoutIndex - The index of the workout to update.
     * @param {WorkoutSession} workout - The updated workout session object.
     */
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

    /**
     * Deletes a workout session from the log for a specific date.
     * @param {string} date - The date of the workout to delete.
     * @param {number} workoutIndex - The index of the workout to delete.
     */
    const deleteWorkout = (date: string, workoutIndex: number) => {
        setAppData(prevData => {
            if (!prevData || !prevData.logs[date]) return prevData;
            const newLogs = { ...prevData.logs };
            const newWorkouts = newLogs[date].workouts.filter((_, index) => index !== workoutIndex);
            newLogs[date] = { ...newLogs[date], workouts: newWorkouts };
            return { ...prevData, logs: newLogs };
        });
    };

    /**
     * Adds a food item to the list of common foods.
     * @param {CommonFood} food - The common food item to add.
     */
    const addCommonFood = (food: CommonFood) => {
        setAppData(prevData => {
            if (!prevData) return null;
            const newCommonFoods = [...(prevData.commonFoods || []), food];
            return { ...prevData, commonFoods: newCommonFoods };
        });
    };

    /**
     * Imports application data from a JSON string, replacing existing data.
     * @param {string} jsonString - The JSON string representing the application data.
     * @throws {Error} Throws an error if the import fails or the data format is invalid.
     */
    const importData = async (jsonString: string): Promise<void> => {
        try {
            const data = JSON.parse(jsonString);
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

    /**
     * Exports the current application data as a JSON file.
     * @returns {Promise<string>} A promise that resolves with a success or failure message.
     */
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
    
    /**
     * Sets or updates Fitbit data for a specific date.
     * @param {string} date - The date for the Fitbit data.
     * @param {Partial<DailyFitbitData>} data - The Fitbit data to set.
     */
    const setFitbitData = useCallback((date: string, data: Partial<DailyFitbitData>) => {
        setAppData(prevData => {
            if (!prevData) return null;
            const newFitbitData = { ...prevData.fitbitData };
            newFitbitData[date] = { ...newFitbitData[date], ...data };
            return {
                ...prevData,
                fitbitData: newFitbitData,
            };
        });
    }, []);

    /**
     * Injects dummy Fitbit data for the current day, for testing purposes.
     */
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
                            caloriesOut: 2500, activityCalories: 1000, caloriesBMR: 1500, activeScore: 100,
                            steps: 10000, floors: 10, elevation: 30, sedentaryMinutes: 300,
                            lightlyActiveMinutes: 120, fairlyActiveMinutes: 60, veryActiveMinutes: 30,
                            marginalCalories: 500, restingHeartRate: 55, heartRateZones: [], hrv: 65,
                        },
                        activities: [
                            { logId: 1, activityId: 20001, activityParentId: 20001, activityParentName: 'Run', name: 'Morning Jog', description: '', calories: 350, distance: 3.5, steps: 4500, duration: 1800000, lastModified: new Date().toISOString(), startTime: '07:00', isFavorite: false, hasActiveZoneMinutes: true, startDate: today, hasStartTime: true, averageHeartRate: 130 },
                            { logId: 2, activityId: 20002, activityParentId: 20002, activityParentName: 'Walk', name: 'Evening Stroll', description: '', calories: 150, distance: 2.0, steps: 3000, duration: 1200000, lastModified: new Date().toISOString(), startTime: '19:00', isFavorite: false, hasActiveZoneMinutes: false, startDate: today, hasStartTime: true, averageHeartRate: 90 },
                        ],
                    },
                },
            };
        });
    }, []);

    /**
     * Deletes all Fitbit data from the application state.
     */
    const deleteFitbitData = useCallback(() => {
        setAppData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                fitbitData: {},
            };
        });
    }, []);

    /**
     * Syncs data from the Fitbit API for a given date, updating the application state.
     * @param {string} date - The date to sync data for.
     */
    const syncFitbitData = async (date: string) => {
        if (!fitbitAccessToken) return;

        try {
            const activityData = await getDailyActivity(fitbitAccessToken, date);
            const hrvData = await getDailyHRV(fitbitAccessToken, date);
            const heartRateData = await getDailyHeartRate(fitbitAccessToken, date);
            const caloriesData = await getCalories(fitbitAccessToken, date);

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
            saveTodaysMeasurements(date, {
                hrv: hrvValue, rhr: rhrValue,
                calories: caloriesValue ? parseInt(caloriesValue) : undefined
            });

            const existingWorkouts = getLogForDate(date)?.workouts || [];
            const fitbitActivities = activityData.activities || [];
            fitbitActivities.forEach((activity: FitbitActivity) => {
                if (!existingWorkouts.find(w => w.fitbitLogId === activity.logId)) {
                    const newWorkout: WorkoutSession = activity.activityParentName === 'Weight Training'
                        ? { type: 'weightlifting', fitbitLogId: activity.logId, name: activity.name, date: activity.startDate, duration: activity.duration / 60000, caloriesBurned: activity.calories, notes: activity.description, exercises: [] }
                        : { type: 'cardio', fitbitLogId: activity.logId, name: activity.name, date: activity.startDate, duration: activity.duration / 60000, caloriesBurned: activity.calories, notes: activity.description, distance: activity.distance, pace: 0, exercises: [] };
                    addWorkout(date, newWorkout);
                }
            });
        } catch (error) {
            console.error('Failed to sync Fitbit data', error);
        }
    };

    /**
     * Updates the user's profile information.
     * @param {UserProfile} profile - The new profile data.
     */
    const updateUserProfile = (profile: UserProfile) => {
        setAppData(prevData => {
            if (!prevData) return null;
            return { ...prevData, userProfile: profile };
        });
    };

    /**
     * Saves daily measurements to the log for a specific date.
     * @param {string} date - The date to save measurements for.
     * @param {Partial<DailyLog>} measurements - The measurements to save.
     */
    const saveTodaysMeasurements = (date: string, measurements: Partial<DailyLog>) => {
        setAppData(prevData => {
            if (!prevData) return null;
            const newLogs = { ...prevData.logs };
            if (newLogs[date]) {
                newLogs[date] = { ...newLogs[date], ...measurements };
            } else {
                newLogs[date] = {
                    date, weight: null, meals: [], workouts: [], notes: '', ...measurements,
                }
            }
            return { ...prevData, logs: newLogs };
        });
    };

    /**
     * Updates the user's weight for a specific date and in their profile.
     * @param {string} date - The date of the weight measurement.
     * @param {number} weight - The new weight value.
     */
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
        appData, isLoading, getTodaysLog, saveTodaysMeasurements, updateWeight, addMeal,
        updateMeal, deleteMeal, addWorkout, updateWorkout, deleteWorkout, importData,
        exportData, getLogForDate, geminiApiKey, setGeminiApiKey, addCommonFood,
        userProfile: appData?.userProfile, updateUserProfile, isFitbitAuthenticated,
        fitbitAccessToken, authenticateFitbit, logoutFitbit, setFitbitData,
        injectDummyFitbitData, deleteFitbitData, syncFitbitData,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppProvider;

/**
 * A custom hook to consume the AppContext.
 * Provides easy access to the application's state and actions.
 * @returns {AppContextType} The application context value.
 * @throws {Error} Throws an error if used outside of an AppProvider.
 */
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};