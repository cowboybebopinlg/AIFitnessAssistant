import { Preferences } from '@capacitor/preferences';
import type { AppData, DailyLog } from '../types';

import type { AppData, DailyLog, DailyFitbitData } from '../types';

const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const PREFERENCES_KEY = 'geminiFitData';

const createNewLog = (date: string): DailyLog => ({
    date,
    weight: null,
    energy: null,
    soreness: null,
    sleepQuality: null,
    yesterdayStress: null,
    meals: [],
    workouts: [],
    notes: '',
});


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
            Object.values(parsedData.logs).forEach(log => {
                if (log.sleepQuality === undefined) log.sleepQuality = null;
                if (log.yesterdayStress === undefined) log.yesterdayStress = null;
            });
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

export const saveData = async (data: AppData) => {
    try {
        const dataString = JSON.stringify(data);
        await Preferences.set({ key: PREFERENCES_KEY, value: dataString });
    } catch (error) {
        console.error("Failed to save data to Preferences", error);
    }
};