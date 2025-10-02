import { Preferences } from '@capacitor/preferences';
import type { AppData, DailyLog } from '../types';

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
 * The key used to store app data in Capacitor Preferences.
 */
const PREFERENCES_KEY = 'geminiFitData';

/**
 * Creates a new, empty daily log for a given date.
 * @param {string} date - The date for the log in 'YYYY-MM-DD' format.
 * @returns {DailyLog} A new daily log object.
 */
const createNewLog = (date: string): DailyLog => ({
    date,
    weight: null,
    meals: [],
    workouts: [],
    notes: '',
});

/**
 * Generates the initial data structure for the application.
 * This is used when no existing data is found.
 * @returns {AppData} The default application data.
 */
const getInitialData = (): AppData => ({
    targets: {
        calories: 2500,
        protein: 180,
        fat: 70,
        carbs: 250,
        fiber: 30,
        sodium: 2300,
    },
    logs: {
        [getTodayDateString()]: createNewLog(getTodayDateString()),
    },
    library: [
        { id: '1', name: 'Bench Press', muscles: 'Chest, Shoulders, Triceps', copyText: 'Log 3 sets of 5 reps of Bench Press at 135 lbs' },
        { id: '2', name: 'Squat', muscles: 'Quads, Glutes, Hamstrings', copyText: 'Log 3 sets of 5 reps of Squat at 225 lbs' },
        { id: '3', name: 'Deadlift', muscles: 'Back, Glutes, Hamstrings', copyText: 'Log 1 set of 5 reps of Deadlift at 315 lbs' },
    ],
    measurements: [],
    commonFoods: [],
    fitbitData: {}, // Initialize as empty object
});

/**
 * Loads application data from Capacitor Preferences.
 * If no data is found, it returns the initial default data.
 * It also handles data migration for backward compatibility.
 * @returns {Promise<AppData>} A promise that resolves to the loaded application data.
 */
export const loadData = async (): Promise<AppData> => {
    try {
        const { value } = await Preferences.get({ key: PREFERENCES_KEY });
        if (value) {
            const parsedData: AppData = JSON.parse(value);
            // Ensure today's log exists
            const today = getTodayDateString();
            if (!parsedData.logs[today]) {
                parsedData.logs[today] = createNewLog(today);
            }
            // Backward compatibility for new fields
            if (!parsedData.commonFoods) {
                parsedData.commonFoods = [];
            }
            if (!parsedData.fitbitData) {
                parsedData.fitbitData = {}; // Initialize as empty object
            }
            if ('apiKey' in parsedData) {
                delete (parsedData as any).apiKey;
            }
            return parsedData;
        }
    } catch (error) {
        console.error("Failed to load or parse data from Preferences", error);
    }
    return getInitialData();
};

/**
 * Saves the application data to Capacitor Preferences.
 * @param {AppData} data - The application data to save.
 * @returns {Promise<void>} A promise that resolves when the data has been saved.
 */
export const saveData = async (data: AppData): Promise<void> => {
    try {
        const dataString = JSON.stringify(data);
        await Preferences.set({ key: PREFERENCES_KEY, value: dataString });
    } catch (error) {
        console.error("Failed to save data to Preferences", error);
    }
};