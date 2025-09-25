import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Meal, WorkoutSession, DailyLog, UserProfile } from '../types';

// Gemini integration is temporarily disabled to focus on UI and local data tracking.
// All functions will return mock data.

export const getSmartSuggestion = async (
    yesterdaysLog: DailyLog | undefined,
    todaysLog: DailyLog | undefined,
    userProfile: UserProfile | undefined,
    apiKey: string
): Promise<string> => {
    if (!apiKey) {
        return "Gemini API key is not set. Please set it in the settings.";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let todaysLogPrompt = "Not available";
    if (todaysLog) {
        const logToSend = { ...todaysLog };
        if (logToSend.readiness === -1) {
            delete logToSend.readiness;
        }
        todaysLogPrompt = JSON.stringify(logToSend, null, 2);
    }

    const prompt = `
        Based on the following user data, provide a smart suggestion for today's activities and food to help them meet their goals.

        **User Profile and Goals:**
        ${userProfile ? JSON.stringify(userProfile, null, 2) : "Not available"}

        **Yesterday's Log:**
        ${yesterdaysLog ? JSON.stringify(yesterdaysLog, null, 2) : "Not available"}

        **Today's Date:** ${new Date().toDateString()}
        **Today's Log:**
        ${todaysLogPrompt}

        **Important Notes:**
        - The user's metrics like energy level, sleep quality, etc., are rated on a scale of 1 to 5.
        - Keep the suggestions brief and to the point.
        - If the user has a training schedule in their profile, compare it for the current day to what they have completed in today's log.
        - Return the response as a JSON object that adheres to the following TypeScript interface. The suggestions in each array should be plain strings, without any markdown or bullet points.
        \`\`\`json
        {
            "food": "string[]",
            "activity": "string[]",
            "other": "string[]"
        }
        \`\`\`

        **Recommendation:**
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return await response.text();
    } catch (error) {
        console.error("Error generating smart suggestion:", error);
        return "Failed to generate smart suggestion. Please try again later.";
    }
};

export const getNutritionInfoFromText = async (text: string, apiKey: string): Promise<Partial<Meal>> => {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Return the data as a JSON object with the following keys: "name", "calories", "protein", "fat", "carbs", "fiber", "sodium".
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
        
        // Sanitize the JSON string by replacing undefined with null
        const sanitizedJsonText = jsonText.replace(/undefined/g, 'null');

        const workout: Partial<WorkoutSession> = JSON.parse(sanitizedJsonText);

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