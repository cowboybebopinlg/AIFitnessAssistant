import React from 'react';

/**
 * Defines the props for the MetricInput component.
 */
interface MetricInputProps {
  /** The label to display for the metric input. */
  label: string;
  /** The CSS color class to use for the selected dots (e.g., 'bg-blue-500'). */
  color: string;
  /** The current value of the metric, from 1 to 5. */
  value: number;
  /** A callback function that is called when the value changes. */
  onChange: (value: number) => void;
}

/**
 * A component for inputting a metric on a 1-to-5 scale using colored dots.
 * It is used for subjective measurements like energy level, soreness, and sleep quality.
 * @param {MetricInputProps} props - The props for the component.
 * @returns {JSX.Element} The rendered metric input component.
 */
const MetricInput: React.FC<MetricInputProps> = ({ label, color, value, onChange }) => {
  const dots = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-[1fr,auto] items-center gap-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {dots.map((dotValue) => (
            <button
              key={dotValue}
              className={`h-6 w-6 rounded-full ${
                dotValue <= value ? color : 'bg-gray-700'
              }`}
              onClick={() => onChange(dotValue)}
            ></button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetricInput;
