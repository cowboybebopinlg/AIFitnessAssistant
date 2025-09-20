import React from 'react';

interface MetricInputProps {
  label: string;
  color: string;
  value: number;
  onChange: (value: number) => void;
}

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
