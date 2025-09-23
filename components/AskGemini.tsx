import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import type { UserProfile, CommonFood, Exercise } from '../types';

// --- TYPE DEFINITIONS ---
type Message = {
  sender: 'user' | 'gemini';
  text: string;
  imagePreview?: string;
  base64Image?: string;
  response?: AskGeminiResponse; // Store the full response for actions
};

type AskGeminiResponse = {
  intent: 'LOG_FOOD' | 'LOG_WORKOUT' | 'ASK_QUESTION' | 'ANALYZE_MEAL_IMAGE' | 'GENERATE_WORKOUT' | 'SUMMARIZE_WEEK' | 'UNKNOWN';
  data: { [key: string]: any; };
  summary: string;
};

type AskGeminiModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// --- THE MODAL COMPONENT ---
const AskGeminiModal: React.FC<AskGeminiModalProps> = ({ isOpen, onClose }) => {
  const { geminiApiKey, appData } = useAppContext();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mocked user profile data for system instruction
  const userProfile: UserProfile | undefined = appData?.userProfile;
  const commonFoods: CommonFood[] = appData?.commonFoods || [];
  const libraryExercises: Exercise[] = appData?.library.map(item => ({ id: item.id, name: item.name, type: 'weightlifting', bodyPart: item.muscles, sets: [] })) || [];

  const MOCKED_USER_PROFILE_SUMMARY = userProfile ? `
- Primary Goal: ${userProfile.primaryGoal}
- Height: ${userProfile.height}
- Starting Weight: ${userProfile.startingWeight} lbs
- Mission Statement: ${userProfile.missionStatement}
- Training Split: ${userProfile.trainingSplit}
- Nutrition Targets (Training): Calories: ${userProfile.trainingDayTargets.calories}, Protein: ${userProfile.trainingDayTargets.protein}g, Fat: ${userProfile.trainingDayTargets.fat}g, Fiber: ${userProfile.trainingDayTargets.fiber}g
- Nutrition Targets (Recovery): Calories: ${userProfile.recoveryDayTargets.calories}, Protein: ${userProfile.recoveryDayTargets.protein}g, Fat: ${userProfile.recoveryDayTargets.fat}g, Fiber: ${userProfile.recoveryDayTargets.fiber}g
- Health Factors: ${userProfile.healthFactors}
- Readiness Model: ${userProfile.readinessModel}
- Cardio Targets: ${userProfile.cardioTargets}
` : 'No user profile data available.';

  const MOCKED_COMMON_FOODS_SUMMARY = commonFoods.length > 0 ? commonFoods.map(food => `- ${food.name} (${food.calories} kcal, ${food.protein}g protein)`).join('\n') : 'No common foods saved.';
  const MOCKED_EXERCISE_LIST = libraryExercises.length > 0 ? libraryExercises.map(ex => ex.name).join(', ') : 'No exercises in library.';


  useEffect(() => {
    if (isOpen && conversation.length === 0) {
        // Start with a greeting
        setConversation([{ sender: 'gemini', text: "Hello! How can I help you today? Log a meal, start a workout, or ask me anything." }]);
    } else if (!isOpen) {
        // Reset on close
        setConversation([]);
        setPrompt('');
        setIsLoading(false);
        setError(null);
        setImagePreview(null);
        setBase64Image(null);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        const userMessage: Message = {
            sender: 'user',
            text: "Analyze this meal for me. What is it and roughly how many calories?",
            imagePreview: previewUrl,
            base64Image: base64String
        };
        setConversation(prev => [...prev, userMessage]);
        callGeminiAPI(userMessage);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecordAudio = () => {
    setIsRecording(true);
    setPrompt("Listening...");
    setTimeout(() => {
        setPrompt("Generate a 3-day workout split focusing on chest, back, and legs.");
        setIsRecording(false);
    }, 2000);
  };
  
  const handleSend = () => {
      if (!prompt.trim()) return;
      const userMessage: Message = { sender: 'user', text: prompt };
      setConversation(prev => [...prev, userMessage]);
      callGeminiAPI(userMessage);
      setPrompt('');
  };

  const callGeminiAPI = async (userMessage: Message) => {
    if (!geminiApiKey) {
        setConversation(prev => [...prev, { sender: 'gemini', text: "Please set your Gemini API key in the settings to use this feature." }]);
        return;
    }

    setIsLoading(true);
    setError(null);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    let systemInstruction = `You are an intelligent assistant for the GeminiFit app. Your job is to analyze the user's input, determine their intent, and provide a helpful response in a structured JSON format.`;

    // Add user profile context for the first user message of a session
    if (conversation.filter(m => m.sender === 'user').length <= 1) {
        systemInstruction += `

        HERE IS THE USER'S PROFILE FOR CONTEXT:
        ${MOCKED_USER_PROFILE_SUMMARY}
        - Common Foods: ${MOCKED_COMMON_FOODS_SUMMARY}
        - Known Exercises: ${MOCKED_EXERCISE_LIST}`;
    }
    
    let parts: any[] = [{ text: userMessage.text }];
    if (userMessage.base64Image) {
      parts.push({
        inlineData: { mimeType: "image/png", data: userMessage.base64Image }
      });
    }

    // A simple way to add conversation history - more advanced methods exist
    const conversationHistory = conversation.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));


    const payload = {
      contents: [...conversationHistory, { role: 'user', parts }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            intent: { type: "STRING", enum: ["LOG_FOOD", "LOG_WORKOUT", "ASK_QUESTION", "ANALYZE_MEAL_IMAGE", "GENERATE_WORKOUT", "SUMMARIZE_WEEK", "UNKNOWN"] },
            data: { type: "OBJECT", description: "Contains extracted entities or generated content." },
            summary: { type: "STRING", description: "A user-facing summary or the full text response for questions/summaries." }
          }
        }
      }
    };
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const result = await response.json();
        const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
            const parsedResponse: AskGeminiResponse = JSON.parse(jsonText);
            setConversation(prev => [...prev, { sender: 'gemini', text: parsedResponse.summary, response: parsedResponse }]);
        } else {
            throw new Error("No valid content received from API.");
        }
    } catch (err) {
        console.error("Gemini API call failed:", err);
        setConversation(prev => [...prev, { sender: 'gemini', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleActionClick = (response?: AskGeminiResponse) => {
      if (!response) return;
      onClose(); 
      switch (response.intent) {
          case 'LOG_FOOD':
              navigate('/log/add-food', { state: { prefillItems: response.data.items, summary: response.summary } });
              break;
          case 'LOG_WORKOUT':
              navigate('/log/add-workout', { state: { prefillWorkout: response.data, summary: response.summary } });
              break;
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background-dark/80 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background-dark w-full max-w-lg h-[80vh] flex flex-col rounded-xl border border-slate-700 font-['Space_Grotesk'] text-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold">Ask Gemini</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {conversation.map((msg, index) => (
            <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}>
                {msg.imagePreview && <img src={msg.imagePreview} alt="User upload" className="rounded-lg mb-2" />}
                <p className="text-white whitespace-pre-wrap">{msg.text}</p>
                {msg.sender === 'gemini' && msg.response && (msg.response.intent === 'LOG_FOOD' || msg.response.intent === 'LOG_WORKOUT') && (
                    <button onClick={() => handleActionClick(msg.response)} className="mt-2 w-full text-left bg-blue-500/50 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg text-sm">
                        Go to Log &rarr;
                    </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 p-3 rounded-2xl rounded-bl-none">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-4 border-t border-slate-700">
          {conversation.filter(m => m.sender === 'user').length === 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700">
                    <span className="material-symbols-outlined">image</span><span>Upload Image</span>
                </button>
                 <button onClick={handleRecordAudio} disabled={isRecording} className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 p-4 hover:bg-slate-700 disabled:opacity-50">
                    <span className="material-symbols-outlined">{isRecording ? 'settings_voice' : 'mic'}</span><span>{isRecording ? 'Listening...' : 'Record'}</span>
                </button>
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              className="w-full rounded-full border border-slate-700 bg-slate-800 p-4 pr-12 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !prompt.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 p-3 text-white disabled:bg-slate-600 hover:bg-blue-700">
                <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- THE MAIN COMPONENT EXPORT (FAB + MODAL LOGIC) ---
const AskGeminiFeature = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const location = useLocation();

    // Hide FAB on specific pages
    const hiddenPaths = ['/settings', '/profile'];
    const isHidden = hiddenPaths.includes(location.pathname);

    return (
        <>
            {!isHidden && (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="fixed bottom-20 right-6 bg-blue-600 hover:bg-blue-700 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-30"
                    aria-label="Ask Gemini"
                >
                    <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                </button>
            )}
            
            <AskGeminiModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default AskGeminiFeature;
