
import React, { useState } from 'react';

interface AddWithGeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  placeholder: string;
  onAnalyze: (text: string) => void;
}

const AddWithGeminiModal: React.FC<AddWithGeminiModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  placeholder,
  onAnalyze,
}) => {
  const [textareaContent, setTextareaContent] = useState('');

  const handleAnalyzeClick = () => {
    onAnalyze(textareaContent);
    setTextareaContent(''); // Clear textarea after analyzing
    onClose();
  };

  // Render nothing if not open to prevent it from taking up space
  if (!isOpen) return null;

  return (
    // This is the full-screen overlay container
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-end transition-all duration-300 ease-in-out ${
        isOpen ? 'visible bg-black/50' : 'invisible bg-black/0'
      }`}
      onClick={onClose} // Close modal when clicking on the overlay
    >
      {/* This div acts as the container for the drawer content, applying max-w-md and centering */}
      <div
        className={`w-full max-w-md transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        {/* This is the actual drawer content with its background and rounded corners */}
        <div className="flex flex-col rounded-t-xl bg-white dark:bg-gray-800">
          <div className="flex w-full items-center justify-center p-4">
            <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          </div>
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
              <p className="text-base text-gray-600 dark:text-gray-400">{description}</p>
            </div>
            <textarea
              className="h-40 w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary focus:ring-primary"
              placeholder={placeholder}
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
              className="w-full rounded-lg bg-primary py-4 text-center font-bold text-white"
              onClick={handleAnalyzeClick}
            >
              Analyze
            </button>
          </div>
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
};

export default AddWithGeminiModal;
