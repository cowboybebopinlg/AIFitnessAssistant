import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Meal, WorkoutSession } from '../types';

// Gemini integration is temporarily disabled to focus on UI and local data tracking.
// All functions will return mock data.

export const getSmartSuggestion = async (): Promise<string> => {
    return "Focus on recovery today. Consider a light activity like yoga or a short walk to maintain mobility without overexerting yourself. Your body is primed for growth, so prioritize nutrient-rich meals and adequate sleep to maximize your gains.";
};

export const getNutritionInfoFromText = async (text: string, apiKey: string): Promise<Partial<Meal>> => {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Return the data as a JSON object with the following keys: "name", "calories", "protein", "fat", "carbs", "fiber".
            If a value is not present, set it to 0.

            Input text: "${text}"

            JSON output:
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = await response.text();
        
        // Clean the response to get only the JSON part
        const jsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const meal = JSON.parse(jsonText);

        return meal;
    } catch (error) {
        console.error("Error parsing nutrition info from text:", error);
        throw new Error("Failed to parse nutrition info from text.");
    }
};

export const getWorkoutInfoFromText = async (text: string, apiKey: string): Promise<Partial<WorkoutSession>> => {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Analyze the following text and extract the workout information.
            Return the data as a JSON object that strictly adheres to the following TypeScript interface structure.
            If a field is not explicitly mentioned in the input text, provide a reasonable default value (e.g., 0 for numbers, empty string for strings, empty array for exercises/sets).

            interface WorkoutSession {
              name: string;
              notes?: string;
              duration: number; // in minutes
              caloriesBurned: number;
              averageHeartRate?: number;
              type: 'cardio' | 'weightlifting';
              exercises: Exercise[];
              distance?: number; // in miles/km, only for cardio
              pace?: number; // only for cardio
            }

            interface Exercise {
              id: string; // Use "generate-id" as a placeholder; client will generate actual ID
              name: string;
              type: 'weightlifting' | 'cardio';
              bodyPart?: string; // only for weightlifting
              sets?: ExerciseSet[]; // only for weightlifting
              duration?: number; // in minutes, only for cardio
              distance?: number; // in miles/km, only for cardio
              averageHeartRate?: number; // only for cardio
              caloriesBurned?: number; // only for cardio
            }

            interface ExerciseSet {
              reps: number;
              weight: number;
              isPr?: boolean;
              notes?: string;
            }

            Input text: "${text}"

            JSON output:
        `;

        console.log('Gemini Prompt:', prompt); // Log the prompt

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = await response.text();
        
        console.log('Gemini Raw Response:', responseText); // Log the raw response

        // Clean the response to get only the JSON part
        const jsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const workout: Partial<WorkoutSession> = JSON.parse(jsonText);

        // Generate unique IDs for exercises if "generate-id" is present
        if (workout.exercises) {
            workout.exercises.forEach(exercise => {
                if (exercise.id === "generate-id") {
                    exercise.id = new Date().toISOString(); // Generate a unique ID
                }
            });
        }

        return workout;
    } catch (error) {
        console.error("Error parsing workout info from text:", error);
        throw new Error("Failed to parse workout info from text.");
    }
};