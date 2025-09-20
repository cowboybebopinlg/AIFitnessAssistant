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
  type: 'weights';
  bodyPart: string;
  sets: ExerciseSet[];
} | {
  type: 'cardio';
  duration?: number; // in minutes
  distance?: number; // in miles/km
});

export interface WorkoutSession {
  name: string;
  notes?: string;
  exercises: Exercise[];
}

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

export interface AppData {
  targets: NutritionTargets;
  logs: { [date: string]: DailyLog };
  library: LibraryItem[];
  measurements: BodyMeasurement[];
  commonFoods: CommonFood[];
  settings?: {
    geminiApiKey?: string;
  };
}

export interface TrendDataPoint {
  date: string;
  value: number;
}