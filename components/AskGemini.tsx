import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getIntentfulResponse } from '../services/geminiService';
import type { AskGeminiResponse } from '../types';

// --- TYPE DEFINITIONS ---
type Message = {
  sender: 'user' | 'gemini';
  text: string;
  imagePreview?: string;
  base64Image?: string;
  response?: AskGeminiResponse; // Store the full response for actions
};

type AskGeminiModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// --- THE MODAL COMPONENT ---
const AskGeminiModal: React.FC<AskGeminiModalProps> = ({ isOpen, onClose }) => {
  const { geminiApiKey, appData, addMeal, addWorkout } = useAppContext();
  const navigate = useNavigate();

  const [textareaContent, setTextareaContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && conversation.length === 0) {
        setConversation([{ sender: 'gemini', text: "Hello! How can I help you today? Log a meal, start a workout, or ask me anything." }]);
    } else if (!isOpen) {
        setConversation([]);
        setTextareaContent('');
        setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSend = () => {
      if (!textareaContent.trim()) return;
      const userMessage: Message = { sender: 'user', text: textareaContent };
      setConversation(prev => [...prev, userMessage]);
      callGeminiAPI(userMessage);
      setTextareaContent('');
  };

  const callGeminiAPI = async (userMessage: Message) => {
    if (!geminiApiKey || !appData) {
        setConversation(prev => [...prev, { sender: 'gemini', text: "Please set your Gemini API key in the settings to use this feature." }]);
        return;
    }

    setIsLoading(true);

    const history = conversation
        .filter(msg => !(msg.sender === 'gemini' && conversation.indexOf(msg) === 0)) // Filter out initial Gemini greeting
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

    try {
        const parsedResponse = await getIntentfulResponse(geminiApiKey, userMessage.text, appData, history);
        setConversation(prev => [...prev, { sender: 'gemini', text: parsedResponse.summary, response: parsedResponse }]);
    } catch (err) {
        console.error("Gemini API call failed:", err);
        setConversation(prev => [...prev, { sender: 'gemini', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleActionClick = (response?: AskGeminiResponse) => {
      if (!response || !appData) return;
      onClose(); 
      const parsedData = response.data ? JSON.parse(response.data as string) : {};
      const todayDateString = new Date().toISOString().split('T')[0]; // Get today's date

      switch (response.intent) {
          case 'LOG_FOOD':
              if (parsedData.items && Array.isArray(parsedData.items)) {
                  parsedData.items.forEach(item => {
                      addMeal(todayDateString, item);
                  });
                  alert(`Logged ${parsedData.items.length} food item(s)!`);
              }
              break;
          case 'LOG_WORKOUT':
              if (parsedData) {
                  addWorkout(todayDateString, { ...parsedData, date: todayDateString });
                  alert(`Logged workout: ${parsedData.name || 'Unnamed Workout'}!`);
              }
              break;
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-40 flex items-center justify-center p-4" onClick={onClose}>
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
            <div className="flex flex-col gap-4 p-4 pt-0">
              <textarea
                className="h-40 w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:ring-primary"
                placeholder="Ask Gemini"
                value={textareaContent}
                onChange={(e) => setTextareaContent(e.target.value)}
              ></textarea>
              <div className="relative flex items-center justify-center">
                <span className="absolute w-full border-t border-gray-300 dark:border-gray-600"></span>
                <span className="relative bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">OR</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <span className="material-symbols-outlined">image</span>
                  <span>Upload</span>
                </button>
                <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <span className="material-symbols-outlined">photo_camera</span>
                  <span>Take Photo</span>
                </button>
              </div>
              <button
                className="w-full rounded-lg bg-blue-600 py-4 text-center font-bold text-white"
                onClick={handleSend}
              >
                Send
              </button>
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
                    className="fixed bottom-24 right-6 bg-blue-600 hover:bg-blue-700 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center z-30"
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