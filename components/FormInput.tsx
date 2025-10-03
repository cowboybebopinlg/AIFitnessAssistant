import React from 'react';

interface FormInputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ label, value, onChange, type = 'text', placeholder, disabled }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">{label}</label>
      <input
        className="w-full h-14 px-4 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 border-none focus:ring-2 focus:ring-primary placeholder-neutral-500 dark:placeholder-neutral-400"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};

export default FormInput;