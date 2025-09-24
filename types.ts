export interface Meal {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
}

export type CommonFood = Meal;

export interface ExerciseSet {
  reps: number;
  weight: number;
  isPr?: boolean;
  notes?: string;
}

export type Exercise = {
  id: string; // For React key prop
  name: string;
} & ({
  type: 'weightlifting';
  bodyPart: string;
  sets: ExerciseSet[];
  caloriesBurned?: number;
} | {
  type: 'cardio';
  duration?: number; // in minutes
  distance?: number; // in miles/km
  averageHeartRate?: number;
  caloriesBurned?: number;
});

export type WorkoutSession = {
  fitbitLogId?: number;
  name: string;
  notes?: string;
  date: string;
  duration: number; // in minutes
  caloriesBurned: number;
  averageHeartRate?: number;
} & (
  | { type: 'cardio'; distance?: number; pace?: number; exercises: Exercise[]; }
  | { type: 'weightlifting'; exercises: Exercise[]; }
);

export interface DailyLog {
  date: string;
  weight: number | null;
  energy: number | null; // scale 1-5
  soreness: number | null; // scale 1-5
  sleepQuality: number | null; // scale 1-5
  yesterdayStress: number | null; // scale 1-5
  meals: Meal[];
  workouts: WorkoutSession[];
  notes: string;
  hrv?: number;
  rhr?: number;
  calories?: number;
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

export interface LibraryItem {
  id: string;
  name: string;
  muscles: string;
  copyText: string;
}

export interface BodyMeasurement {
    date: string;
    part: string; // e.g., 'Waist', 'Chest'
    value: number; // in inches
}

export interface FitbitActivity {
  logId: number;
  activityId: number;
  activityParentId: number;
  activityParentName: string;
  name: string;
  description: string;
  calories: number;
  distance: number;
  steps: number;
  duration: number; // in milliseconds
  lastModified: string;
  startTime: string;
  isFavorite: boolean;
  hasActiveZoneMinutes: boolean;
  startDate: string;
  hasStartTime: boolean;
  averageHeartRate?: number;
}

export interface FitbitSummary {
  caloriesOut: number;
  activityCalories: number;
  caloriesBMR: number;
  activeScore: number;
  steps: number;
  floors: number;
  elevation: number;
  sedentaryMinutes: number;
  lightlyActiveMinutes: number;
  fairlyActiveMinutes: number;
  veryActiveMinutes: number;
  marginalCalories: number;
  restingHeartRate: number;
  heartRateZones: any[]; // Define more specifically if needed
  hrv?: number; // Added HRV
}

export interface DailyFitbitData {
  summary: FitbitSummary | null;
  activities: FitbitActivity[];
  hrv?: any;
  rhr?: any;
  calories?: any;
}

export interface AppData {
  targets: NutritionTargets;
  logs: { [date: string]: DailyLog };
  library: LibraryItem[];
  measurements: BodyMeasurement[];
  commonFoods: CommonFood[];
  userProfile?: UserProfile; // Added UserProfile
  settings?: {
    geminiApiKey?: string;
  };
  fitbitData?: { [date: string]: DailyFitbitData }; // Now date-keyed
}

export interface Measurement {
  name: string;
  value: string | number;
  unit: 'in' | 'cm';
}

export interface UserProfile {
  primaryGoal: string;
  targetDate: string;
  missionStatement: string;
  height: string;
  startingWeight: number;
  measurements: Measurement[];
  healthFactors: string;
  readinessModel: string;
  trainingSplit: string;
  cardioTargets: string;
  trainingDayTargets: {
    calories: number;
    protein: number;
    fat: number;
    fiber: number;
  };
  recoveryDayTargets: {
    calories: number;
    protein: number;
    fat: number;
    fiber: number;
  };
}

export interface TrendDataPoint {
  date: string;
  value: number;
}