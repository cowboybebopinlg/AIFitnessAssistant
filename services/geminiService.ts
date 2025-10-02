import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { Meal, WorkoutSession, AppData, AskGeminiResponse } from '../types';
import { generateMCP } from './mcpService';

const MODEL_NAME = "gemini-2.5-flash";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * Gets a structured suggestion for the dashboard.
 */
export const getDashboardSuggestion = async (appData: AppData, apiKey: string): Promise<string> => {
    if (!apiKey) {
        return "Gemini API key is not set. Please set it in the settings.";
    }

    const mcp = generateMCP(appData);
    const prompt = `
        Based on the user data in the Model Context Protocol (MCP), provide a smart suggestion for today's activities and food to help them meet their goals.

        **Important Notes:**
        - The user's metrics like energy level, sleep quality, etc., are rated on a scale of 1 to 5.
        - Keep the suggestions brief and to the point.
        - If the user has a training schedule in their profile, compare it for the current day to what they have completed in today's log.
        - Return the response as a JSON object that adheres to the following TypeScript interface. The suggestions in each array should be plain strings, without any markdown or bullet points.
        \
        {
            "food": "string[]",
            "activity": "string[]",
            "other": "string[]"
        }
        \

        ${mcp}

        **Recommendation:**
    `;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return await response.text();
    } catch (error) {
        console.error("Error generating dashboard suggestion:", error);
        return "Failed to generate smart suggestion. Please try again later.";
    }
};


/**
 * Gets a structured response with intent from the Gemini model.
 * This is the primary function for the "Ask Gemini" feature.
 */
export const getIntentfulResponse = async (
    apiKey: string, 
    userPrompt: string, 
    appData: AppData, 
    conversationHistory: any[]
): Promise<AskGeminiResponse> => {
    if (!apiKey) {
        return {
            intent: 'UNKNOWN',
            summary: "Gemini API key is not set. Please set it in the settings.",
            data: {},
        };
    }
    const mcp = generateMCP(appData);
    const systemInstruction = `
        You are an intelligent assistant for the GeminiFit app. Your job is to analyze the user's input, determine their intent, and provide a helpful response in a structured JSON format.
        If you are unable to determine the answer from the context, you can use Google Search to find the information.
        Always return your response as a JSON object with the following schema:
        {
            "intent": "LOG_FOOD" | "LOG_WORKOUT" | "ASK_QUESTION" | "ANALYZE_MEAL_IMAGE" | "GENERATE_WORKOUT" | "SUMMARIZE_WEEK" | "UNKNOWN",
            "data": "A JSON string containing extracted entities or generated content.",
            "summary": "A user-facing summary or the full text response for questions/summaries."
        }
        ${mcp}
    `;

    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: MODEL_NAME,
        safetySettings,
        systemInstruction,
        tools: [{googleSearch: {}}],
    });

    try {
        const chat = model.startChat({ history: conversationHistory });
        const result = await chat.sendMessage(userPrompt);
        const response = await result.response;
        const responseText = await response.text();
        console.log("Gemini API Response for intent:", responseText);

        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');

        if (jsonStart === -1 || jsonEnd === -1) {
            return {
                intent: 'UNKNOWN',
                summary: responseText, // Return the raw text if no JSON is found
                data: {},
            };
        }

        const jsonText = responseText.substring(jsonStart, jsonEnd + 1);
        const parsedResponse = JSON.parse(jsonText.replace(/undefined/g, 'null')) as AskGeminiResponse;

        if (typeof parsedResponse.data === 'string') {
            try {
                parsedResponse.data = JSON.parse(parsedResponse.data);
            } catch (e) {
                console.error("Failed to parse data string in response:", e);
                // Keep data as a string if it's not valid JSON
            }
        }

        if (!parsedResponse.data) {
            parsedResponse.data = {};
        }
        
        return parsedResponse;
    } catch (error) {
        console.error("Error in getIntentfulResponse:", error);
        return {
            intent: 'UNKNOWN',
            summary: "Sorry, I encountered an error. Please try again.",
            data: "{}",
        };
    }
};


/**
 * A generic function to get a conversational response from the Gemini model.
 */
export const getConversationalResponse = async (
    apiKey: string,
    userPrompt: string,
    appData: AppData,
    customInstructions: string = ""
): Promise<string> => {
    if (!apiKey) {
        return "Gemini API key is not set. Please set it in the settings.";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings });
    
    const mcp = generateMCP(appData);
    const systemInstruction = `${customInstructions}\n\n${mcp}`;

    try {
        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemInstruction }] },
                { role: "model", parts: [{ text: "Acknowledged. I have received the Model Context Protocol. I am ready to assist you." }] },
            ]
        });

        const result = await chat.sendMessage(userPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error in getConversationalResponse:", error);
        return "Error communicating with the AI. Please check your API key and try again.";
    }
};

/**
 * Parses natural language text to extract structured nutrition information.
 */
export const getNutritionInfoFromText = async (text: string, appData: AppData, apiKey: string): Promise<Partial<Meal>> => {
    const mcp = generateMCP(appData);
    const instruction = `
        You are an expert nutrition data parser. Your task is to extract nutritional information from the user\'s text input and return it as a clean JSON object.
        Use the context provided in the Model Context Protocol (MCP) to understand user-specific terms (e.g., "my usual shake").

        Return the data as a JSON object with the following keys: "name", "calories", "protein", "fat", "carbs", "fiber", "sodium".
        If a value is not present, set it to 0.

        ${mcp}

        Input text: "${text}"

        JSON output:
    `;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(instruction);
        const response = await result.response;
        const responseText = await response.text();
        console.log("Gemini API Response for nutrition:", responseText);
        
        // Find the start and end of the JSON block
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error("No JSON object found in the response.");
        }
        
        const jsonText = responseText.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonText.replace(/undefined/g, 'null'));
    } catch (error) {
        console.error("Error parsing nutrition info:", error);
        throw new Error("Failed to parse nutrition info from text.");
    }
};

/**
 * Parses natural language text to extract structured workout information.
 */
export const getWorkoutInfoFromText = async (text: string, appData: AppData, apiKey: string): Promise<Partial<WorkoutSession>> => {
    const mcp = generateMCP(appData);
    const instruction = `
        You are an expert workout data parser. Your task is to extract workout information from the user's text input and return it as a clean JSON object.
        Use the context provided in the Model Context Protocol (MCP) to understand user-specific terms and history.
        Return the data as a JSON object that strictly adheres to the following TypeScript interface structure.
        If a field is not explicitly mentioned, provide a reasonable default.

        interface WorkoutSession { ... } // (Interface definition as before)

        ${mcp}

        Input text: "${text}"

        JSON output:
    `;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(instruction);
        const response = await result.response;
        const responseText = await response.text();
        console.log("Gemini API Response for workout:", responseText);
        
        // Find the start and end of the JSON block
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error("No JSON object found in the response.");
        }
        
        const jsonText = responseText.substring(jsonStart, jsonEnd + 1);
        const workout = JSON.parse(jsonText.replace(/undefined/g, 'null'));

        if (workout.exercises) {
            workout.exercises.forEach(ex => { if (ex.id === "generate-id") ex.id = new Date().toISOString(); });
        }

        return workout;
    } catch (error) {
        console.error("Error parsing workout info:", error);
        throw new Error("Failed to parse workout info from text.");
    }
};
