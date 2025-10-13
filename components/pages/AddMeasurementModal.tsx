import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { UserProfile } from '../../types';

/**
 * Defines the props for the AddMeasurementModal component.
 */
interface AddMeasurementModalProps {
  /** A boolean indicating whether the modal is open or closed. */
  isOpen: boolean;
  /** A function to be called when the modal is requested to be closed. */
  onClose: () => void;
  /** The date for which the measurement is being added or edited. */
  date: string;
  /** The name of the measurement to be edited. If null, the modal is in "add" mode. */
  measurementName: string | null;
  /** The user's profile data, used to get the list of available measurement types. */
  userProfile: UserProfile | undefined;
}

/**
 * A modal component for adding or editing a user's body measurements for a specific day.
 * It allows selecting a measurement type and entering a value.
 * @param {AddMeasurementModalProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered modal component or null if it's not open.
 */
const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({ isOpen, onClose, date, measurementName, userProfile }) => {
  const { saveTodaysMeasurements, updateUserProfile, getLogForDate, updateWeight } = useAppContext();
  const [measurementType, setMeasurementType] = useState('');
  const [value, setValue] = useState<number | ''>('');
  const [measurements, setMeasurements] = useState<{name: string, value: string}[]>([]);

  useEffect(() => {
    if (measurementName) {
      setMeasurementType(measurementName.toLowerCase());
      const log = getLogForDate(date);
      setValue(log?.[measurementName.toLowerCase()] || '');
    } else {
        // Default to 'weight' if available, otherwise the first in the list
        const weightMeasurement = userProfile?.measurements?.find(m => m.name.toLowerCase() === 'weight');
        if (weightMeasurement) {
            setMeasurementType('weight');
        } else if (userProfile?.measurements && userProfile.measurements.length > 0) {
            setMeasurementType(userProfile.measurements[0].name.toLowerCase());
        }
    }
  }, [measurementName, userProfile, date, getLogForDate]);

  const handleSave = () => {
    if (value !== '' && measurementType !== '') {
      if (measurementType === 'weight') {
        updateWeight(date, Number(value));
      } else {
        saveTodaysMeasurements(date, { [measurementType]: Number(value) });

        if (userProfile) {
          const newMeasurements = userProfile.measurements.map(m => 
            m.name.toLowerCase() === measurementType.toLowerCase() ? { ...m, value: Number(value) } : m
          );
          updateUserProfile({ ...userProfile, measurements: newMeasurements });
        }
      }

      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-white mb-4">{measurementName ? 'Edit' : 'Add'} Measurement</h2>
        <select
          value={measurementType}
          onChange={(e) => setMeasurementType(e.target.value)}
          className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500 mb-4"
          disabled={!!measurementName}
        >
          <option value="weight">Weight</option>
          {userProfile?.measurements?.filter(m => m.name.toLowerCase() !== 'weight').map(m => (
            <option key={m.name} value={m.name.toLowerCase()}>{m.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full bg-gray-700 border-none rounded-md p-2 focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMeasurementModal;
