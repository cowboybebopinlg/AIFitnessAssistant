import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getIntentfulResponse } from '../services/geminiService';
import type { AskGeminiResponse } from '../types';
import { SparklesIcon } from './icons';

/**
 * @file This file defines the "Ask FitAI" feature, including the main button
 * and the chat modal for interacting with the FitAI API.
 */

/**
 * Represents a single message in the chat conversation.
 */
type Message = {
  /** The sender of the message, either the user or the Gemini model. */
  sender: 'user' | 'gemini';
  /** The text content of the message. */
  text: string;
  /** An optional URL for a preview of an image sent by the user. */
  imagePreview?: string;
  /** An optional base64 encoded string of an image sent by the user. */
  base64Image?: string;
  /** The full, structured response from the Gemini API, if applicable. */
  response?: AskGeminiResponse;
};

/**
 * Defines the props for the AddWithFitAIModal component.
 */
type AddWithFitAIModalProps = {
  /** A boolean indicating whether the modal is open or closed. */
  isOpen: boolean;
  /** A function to be called when the modal is requested to be closed. */
  onClose: () => void;
};

/**
 * A modal component that provides a chat interface for users to interact with the Gemini model.
 * It handles sending user prompts, displaying the conversation, and processing actions based on the AI's response.
 * @param {AddWithFitAIModalProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered modal component or null if it's not open.
 */
const AddWithFitAIModal: React.FC<AddWithFitAIModalProps> = ({ isOpen, onClose }) => {
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
        setConversation(prev => [...prev, { sender: 'gemini', text: "Please set your FitAI API key in the settings to use this feature." }]);
        return;
    }

    setIsLoading(true);

    const history = conversation
        .filter(msg => !(msg.sender === 'gemini' && conversation.indexOf(msg) === 0)) // Filter out initial Gemini greeting
        .filter(msg => msg.text && msg.text.trim() !== '') // Filter out empty messages
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
    console.log('handleActionClick response:', response);
    onClose();
    const parsedData = response.data ? response.data : {};
    const todayDateString = new Date().toISOString().split('T')[0];

    switch (response.intent) {
        case 'LOG_FOOD':
            if (parsedData) {
                // Navigate to AddFoodPage with prefill data
                navigate(`/log/add-food?date=${todayDateString}`, { state: { prefillItems: [parsedData] } });
            }
            break;
        case 'LOG_WORKOUT':
            if (parsedData) {
                // Assuming you have a route like '/add-workout' that can handle this
                // You might need to adjust the route and how you pass data based on your router setup
                const workoutType = parsedData.type || 'generic'; // e.g., 'cardio', 'weightlifting'
                if (workoutType.toLowerCase() === 'cardio') {
                    navigate(`/log/add-workout/cardio?date=${todayDateString}`, { state: { prefillData: parsedData } });
                } else if (workoutType.toLowerCase() === 'weightlifting') {
                    navigate(`/log/add-workout/weights?date=${todayDateString}`, { state: { prefillData: parsedData } });
                } else {
                    // Fallback or generic workout page
                    addWorkout(todayDateString, { ...parsedData, date: todayDateString });
                    alert(`Logged workout: ${parsedData.name || 'Unnamed Workout'}!`);
                }
            }
            break;
    }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-dark-800 w-full max-w-lg h-[90vh] max-h-[700px] flex flex-col rounded-2xl border border-dark-700 text-light-100 shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-dark-700">
                <h2 className="text-xl font-bold text-light-50">Ask FitAI</h2>
                <button onClick={onClose} className="text-dark-300 hover:text-light-100 text-2xl">&times;</button>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {conversation.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary-500 rounded-br-none' : 'bg-dark-700 rounded-bl-none'}`}>
                        {msg.imagePreview && <img src={msg.imagePreview} alt="User upload" className="rounded-lg mb-2" />}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.sender === 'gemini' && msg.response && (msg.response.intent === 'LOG_FOOD' || msg.response.intent === 'LOG_WORKOUT') && (
                            <button onClick={() => handleActionClick(msg.response)} className="mt-2 w-full text-left bg-primary-500/50 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                                Go to Log &rarr;
                            </button>
                        )}
                    </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                    <div className="bg-dark-700 p-3 rounded-2xl rounded-bl-none">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-dark-700">
              <textarea
                className="h-24 w-full resize-none rounded-lg bg-dark-900 p-3 text-light-100 placeholder-dark-400 focus:border-primary-500 focus:ring-primary-500"
                placeholder="Log 'a salmon salad for lunch'..."
                value={textareaContent}
                onChange={(e) => setTextareaContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              />
              <button
                className="mt-2 w-full rounded-lg bg-primary-500 py-3 text-center font-bold text-white transition-colors hover:bg-primary-600 disabled:bg-primary-700/50"
                onClick={handleSend}
                disabled={isLoading || !textareaContent.trim()}
              >
                Send
              </button>
            </div>
        </div>
    </div>
  );
};


/**
 * A button that opens a modal for the "Add with FitAI" feature.
 * This component is designed to be the centerpiece of the bottom navigation bar.
 * @returns {JSX.Element} The rendered "Ask FitAI" component.
 */
const AskFitAI: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="relative z-10 flex h-16 w-16 -translate-y-4 items-center justify-center rounded-full border-4 border-dark-900 bg-primary-500 text-white shadow-lg transition-transform duration-200 hover:scale-105"
                aria-label="Ask FitAI"
            >
                <SparklesIcon className="h-8 w-8" />
            </button>
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm"
                    onClick={() => setIsModalOpen(false)}
                />
            )}
            <AddWithFitAIModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
};

export default AskFitAI;