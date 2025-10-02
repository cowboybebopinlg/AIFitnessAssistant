
import React, { useState, useEffect } from 'react';
import { DailyLog } from '../../types';
import { useAppContext } from '../../context/AppContext';

/**
 * Defines the props for the EditMetricsModal component.
 */
interface EditMetricsModalProps {
  /** A boolean indicating whether the modal is open or closed. */
  isOpen: boolean;
  /** A function to be called when the modal is requested to be closed. */
  onClose: () => void;
  /** The daily log data for the day being edited. */
  log: DailyLog | undefined;
}

/**
 * A modal component for editing the user's daily metrics.
 * It provides a form to manually input or update values for HRV, RHR, calories, and readiness score.
 * @param {EditMetricsModalProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered modal component or null if it's not open.
 */
const EditMetricsModal: React.FC<EditMetricsModalProps> = ({ isOpen, onClose, log }) => {
  const { saveTodaysMeasurements } = useAppContext();
  const [hrv, setHrv] = useState(log?.hrv || '');
  const [rhr, setRhr] = useState(log?.rhr || '');
  const [calories, setCalories] = useState(log?.calories || '');
  const [readiness, setReadiness] = useState(log?.readiness || '');

  useEffect(() => {
    setHrv(log?.hrv || '');
    setRhr(log?.rhr || '');
    setCalories(log?.calories || '');
    setReadiness(log?.readiness || '');
  }, [log]);

  const handleSave = () => {
    if (log) {
      saveTodaysMeasurements(log.date, {
        hrv: hrv ? parseInt(hrv.toString(), 10) : undefined,
        rhr: rhr ? parseInt(rhr.toString(), 10) : undefined,
        calories: calories ? parseInt(calories.toString(), 10) : undefined,
        readiness: readiness ? parseInt(readiness.toString(), 10) : -1,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-end transition-all duration-300 ease-in-out ${
        isOpen ? 'visible bg-black/50' : 'invisible bg-black/0'
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col rounded-t-xl bg-white dark:bg-gray-800">
          <div className="flex w-full items-center justify-center p-4">
            <div className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          </div>
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Metrics</h1>
              <p className="text-base text-gray-600 dark:text-gray-400">Manually enter your metrics.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="readiness" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Readiness Score
                </label>
                <input
                  type="number"
                  name="readiness"
                  id="readiness"
                  value={readiness}
                  onChange={(e) => setReadiness(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="hrv" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  HRV (Heart Rate Variability)
                </label>
                <input
                  type="number"
                  name="hrv"
                  id="hrv"
                  value={hrv}
                  onChange={(e) => setHrv(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="rhr" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  RHR (Resting Heart Rate)
                </label>
                <input
                  type="number"
                  name="rhr"
                  id="rhr"
                  value={rhr}
                  onChange={(e) => setRhr(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="calories" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Calories Burned
                </label>
                <input
                  type="number"
                  name="calories"
                  id="calories"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
            <button
              className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
};

export default EditMetricsModal;
