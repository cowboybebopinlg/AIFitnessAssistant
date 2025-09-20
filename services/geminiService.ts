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
            Return the data as a JSON object. The top-level object should be a WorkoutSession.
            The WorkoutSession can have a name and a list of exercises.
            Each exercise can have a name, type (weights or cardio), bodyPart, and a list of sets.
            Each set has reps and weight.

            Input text: "${text}"

            JSON output:
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = await response.text();
        
        // Clean the response to get only the JSON part
        const jsonText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const workout = JSON.parse(jsonText);

        return workout;
    } catch (error) {
        console.error("Error parsing workout info from text:", error);
        throw new Error("Failed to parse workout info from text.");
    }
};