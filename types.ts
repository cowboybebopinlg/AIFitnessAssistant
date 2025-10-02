/**
 * @file This file contains all the core TypeScript type definitions and interfaces used throughout the application.
 * It serves as a single source of truth for the data structures.
 */

/**
 * Represents a single meal entry with its nutritional information.
 */
export interface Meal {
  /** The name of the meal or food item. */
  name: string;
  /** The total calories in the meal. */
  calories: number;
  /** The total protein in grams. */
  protein: number;
  /** The total fat in grams. */
  fat: number;
  /** The total carbohydrates in grams. */
  carbs: number;
  /** The total fiber in grams (optional). */
  fiber?: number;
  /** The total sodium in milligrams (optional). */
  sodium?: number;
}

/**
 * Represents a commonly eaten food item, saved by the user for quick logging.
 * It shares the same structure as a Meal.
 */
export type CommonFood = Meal;

/**
 * Represents a single set within a weightlifting exercise.
 */
export interface ExerciseSet {
  /** The number of repetitions performed. */
  reps: number;
  /** The weight used for the set, in pounds (lbs). */
  weight: number;
  /** A boolean indicating if this set was a personal record (optional). */
  isPr?: boolean;
  /** Any notes specific to this set (optional). */
  notes?: string;
}

/**
 * Represents a single exercise, which can be either weightlifting or cardio.
 */
export type Exercise = {
  /** A unique identifier for the exercise, typically used for React keys. */
  id: string;
  /** The name of the exercise. */
  name: string;
} & ({
  /** The type of exercise, specifically 'weightlifting'. */
  type: 'weightlifting';
  /** The primary body part targeted by the exercise. */
  bodyPart: string;
  /** An array of sets performed for the exercise. */
  sets: ExerciseSet[];
  /** The estimated calories burned during the exercise (optional). */
  caloriesBurned?: number;
} | {
  /** The type of exercise, specifically 'cardio'. */
  type: 'cardio';
  /** The duration of the exercise in minutes (optional). */
  duration?: number;
  /** The distance covered in miles or kilometers (optional). */
  distance?: number;
  /** The average heart rate during the exercise (optional). */
  averageHeartRate?: number;
  /** The estimated calories burned during the exercise (optional). */
  caloriesBurned?: number;
});

/**
 * Represents a complete workout session, which can be either cardio or weightlifting.
 */
export type WorkoutSession = {
  /** The unique log ID from Fitbit, if the workout was synced (optional). */
  fitbitLogId?: number;
  /** The name of the workout session. */
  name: string;
  /** General notes for the entire workout session (optional). */
  notes?: string;
  /** The date of the workout in 'YYYY-MM-DD' format. */
  date: string;
  /** The total duration of the workout in minutes. */
  duration: number;
  /** The total calories burned during the workout. */
  caloriesBurned: number;
  /** The average heart rate during the workout (optional). */
  averageHeartRate?: number;
} & (
  | { /** The type of workout, specifically 'cardio'. */ type: 'cardio'; /** The distance covered (optional). */ distance?: number; /** The pace of the workout (optional). */ pace?: number; /** An array of exercises performed. */ exercises: Exercise[]; }
  | { /** The type of workout, specifically 'weightlifting'. */ type: 'weightlifting'; /** An array of exercises performed. */ exercises: Exercise[]; }
);

/**
 * Represents all the data logged for a single day.
 */
export interface DailyLog {
    /** An index signature to allow for dynamic property access. */
    [key: string]: any;
    /** The date of the log in 'YYYY-MM-DD' format. */
    date: string;
    /** The user's weight for the day (optional). */
    weight: number | null;
    /** Waist measurement for the day (optional). */
    waist?: number;
    /** Chest measurement for the day (optional). */
    chest?: number;
    /** Arms measurement for the day (optional). */
    arms?: number;
    /** An array of all meals logged for the day. */
    meals: Meal[];
    /** An array of all workout sessions logged for the day. */
    workouts: WorkoutSession[];
    /** General notes for the day. */
    notes: string;
    /** A readiness score for the day, often from a wearable device (optional). */
    readiness?: number;
    /** Heart Rate Variability for the day (optional). */
    hrv?: number;
    /** Resting Heart Rate for the day (optional). */
    rhr?: number;
    /** Total calories burned for the day (optional). */
    calories?: number;
}

/**
 * Represents the user's daily nutrition targets.
 */
export interface NutritionTargets {
  /** Target daily calorie intake. */
  calories: number;
  /** Target daily protein intake in grams. */
  protein: number;
  /** Target daily fat intake in grams. */
  fat: number;
  /** Target daily carbohydrate intake in grams. */
  carbs: number;
  /** Target daily fiber intake in grams. */
  fiber: number;
  /** Target daily sodium intake in milligrams (optional). */
  sodium?: number;
}

/**
 * Represents an item in the user's library, such as a saved workout.
 */
export interface LibraryItem {
  /** A unique identifier for the library item. */
  id: string;
  /** The name of the library item. */
  name: string;
  /** A description of the muscles targeted by the item. */
  muscles: string;
  /** Text that can be copied to quickly log this item. */
  copyText: string;
}

/**
 * Represents a single body measurement taken on a specific date.
 */
export interface BodyMeasurement {
    /** The date the measurement was taken in 'YYYY-MM-DD' format. */
    date: string;
    /** The body part that was measured (e.g., 'Waist', 'Chest'). */
    part: string;
    /** The value of the measurement in inches. */
    value: number;
}

/**
 * Represents a single activity synced from Fitbit.
 */
export interface FitbitActivity {
  /** The unique log ID for the activity from Fitbit. */
  logId: number;
  /** The specific ID of the activity type. */
  activityId: number;
  /** The ID of the parent activity type (e.g., the ID for 'Run'). */
  activityParentId: number;
  /** The name of the parent activity type (e.g., 'Run', 'Walk'). */
  activityParentName: string;
  /** The specific name of the activity. */
  name: string;
  /** A description of the activity. */
  description: string;
  /** The number of calories burned. */
  calories: number;
  /** The distance covered during the activity. */
  distance: number;
  /** The number of steps taken. */
  steps: number;
  /** The duration of the activity in milliseconds. */
  duration: number;
  /** The timestamp of when the activity was last modified. */
  lastModified: string;
  /** The start time of the activity. */
  startTime: string;
  /** A boolean indicating if the activity is marked as a favorite in Fitbit. */
  isFavorite: boolean;
  /** A boolean indicating if the activity has active zone minutes. */
  hasActiveZoneMinutes: boolean;
  /** The start date of the activity in 'YYYY-MM-DD' format. */
  startDate: string;
  /** A boolean indicating if the activity has a specific start time. */
  hasStartTime: boolean;
  /** The average heart rate during the activity (optional). */
  averageHeartRate?: number;
}

/**
 * Represents the summary of a user's daily activity from Fitbit.
 */
export interface FitbitSummary {
  /** Total calories burned throughout the day. */
  caloriesOut: number;
  /** Calories burned from activities. */
  activityCalories: number;
  /** Basal Metabolic Rate (BMR) calories. */
  caloriesBMR: number;
  /** An overall activity score from Fitbit. */
  activeScore: number;
  /** Total steps taken. */
  steps: number;
  /** Total floors climbed. */
  floors: number;
  /** Total elevation gained. */
  elevation: number;
  /** Total minutes spent sedentary. */
  sedentaryMinutes: number;
  /** Total minutes spent lightly active. */
  lightlyActiveMinutes: number;
  /** Total minutes spent fairly active. */
  fairlyActiveMinutes: number;
  /** Total minutes spent very active. */
  veryActiveMinutes: number;
  /** Calories burned above BMR from non-activity sources. */
  marginalCalories: number;
  /** Resting heart rate for the day. */
  restingHeartRate: number;
  /** An array of heart rate zones for the day. */
  heartRateZones: any[];
  /** Heart Rate Variability for the day (optional). */
  hrv?: number;
}

/**
 * Represents all Fitbit data synced for a single day.
 */
export interface DailyFitbitData {
  /** The summary of daily activity. */
  summary: FitbitSummary | null;
  /** An array of all activities for the day. */
  activities: FitbitActivity[];
  /** Heart Rate Variability data (optional). */
  hrv?: any;
  /** Resting Heart Rate data (optional). */
  rhr?: any;
  /** Calorie data (optional). */
  calories?: any;
}

/**
 * The root interface for all application data, representing the entire state.
 */
export interface AppData {
  /** The user's nutrition targets. */
  targets: NutritionTargets;
  /** An object containing all daily logs, keyed by date string. */
  logs: { [date: string]: DailyLog };
  /** The user's library of saved items. */
  library: LibraryItem[];
  /** An array of all body measurements taken by the user. */
  measurements: BodyMeasurement[];
  /** A list of the user's saved common foods. */
  commonFoods: CommonFood[];
  /** The user's profile information (optional). */
  userProfile?: UserProfile;
  /** Application settings, such as API keys (optional). */
  settings?: {
    geminiApiKey?: string;
  };
  /** An object containing all synced Fitbit data, keyed by date string (optional). */
  fitbitData?: { [date: string]: DailyFitbitData };
}

/**
 * Represents a single body measurement in the user's profile.
 */
export interface Measurement {
  /** The name of the measurement (e.g., 'Waist'). */
  name: string;
  /** The value of the measurement. */
  value: string | number;
  /** The unit of the measurement. */
  unit: 'in' | 'cm';
}

/**
 * Represents the user's profile, containing their goals, biometrics, and protocols.
 */
export interface UserProfile {
  /** The user's primary fitness goal. */
  primaryGoal: string;
  /** The target date for achieving the primary goal. */
  targetDate: string;
  /** A personal mission statement or mantra. */
  missionStatement: string;
  /** The user's height. */
  height: string;
  /** The user's starting weight. */
  startingWeight: number;
  /** The user's current weight (optional). */
  currentWeight?: number;
  /** An array of the user's body measurements. */
  measurements: Measurement[];
  /** A description of any relevant health factors. */
  healthFactors: string;
  /** The model used for calculating readiness (e.g., 'Objective Priority'). */
  readinessModel: string;
  /** The user's weekly training split. */
  trainingSplit: string;
  /** The user's cardio targets. */
  cardioTargets: string;
  /** Nutrition targets for training days. */
  trainingDayTargets: {
    calories: number;
    protein: number;
    fat: number;
    fiber: number;
  };
  /** Nutrition targets for recovery days. */
  recoveryDayTargets: {
    calories: number;
    protein: number;
    fat: number;
    fiber: number;
  };
}

/**
 * Represents a single data point for a trend chart.
 */
export interface TrendDataPoint {
  /** The date of the data point in 'YYYY-MM-DD' format. */
  date: string;
  /** The numerical value of the data point. */
  value: number;
}

/**
 * Represents the structured response from the Gemini API for the "Ask Gemini" feature.
 */
export type AskGeminiResponse = {
  /** The determined intent of the user's request. */
  intent: 'LOG_FOOD' | 'LOG_WORKOUT' | 'ASK_QUESTION' | 'ANALYZE_MEAL_IMAGE' | 'GENERATE_WORKOUT' | 'SUMMARIZE_WEEK' | 'UNKNOWN';
  /** The structured data extracted from the user's request. */
  data: { [key: string]: any; };
  /** A user-facing summary of the response or action taken. */
  summary: string;
};