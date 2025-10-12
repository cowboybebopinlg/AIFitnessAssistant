import React, { useState } from 'react';

/**
 * Defines the props for the AddWithFitAIModal component.
 */
interface AddWithFitAIModalProps {
  /** A boolean indicating whether the modal is open or closed. */
  isOpen: boolean;
  /** A function to be called when the modal is requested to be closed. */
  onClose: () => void;
  /** The title to be displayed in the modal header. */
  title: string;
  /** A descriptive text to guide the user. */
  description: string;
  /** A placeholder text for the textarea input. */
  placeholder: string;
  /** A function to be called when the user submits their input for analysis. */
  onAnalyze: (text: string) => void;
}

/**
 * A modal component that provides a simple textarea for users to input natural language
 * descriptions of their food or workout for AI-powered analysis.
 * @param {AddWithFitAIModalProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered modal component or null if it's not open.
 */
const AddWithFitAIModal: React.FC<AddWithFitAIModalProps> = ({ isOpen, onClose, title, description, placeholder, onAnalyze }) => {
  const [text, setText] = useState('');

  const handleAnalyze = () => {
    if (text.trim()) {
      onAnalyze(text);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <p className="text-gray-400 mb-4">{description}</p>
        <textarea
          className="w-full h-32 bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">
            Cancel
          </button>
          <button onClick={handleAnalyze} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition">
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWithFitAIModal;