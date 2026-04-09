'use client';
import { Input } from '@/app/components/ui/input';
import React from 'react';

interface FormInputRowProps {
  icon: React.ReactNode;
  id: string;
  name: string;
  type: string;
  placeholder: string;
  handleValidate: (value: unknown) => boolean;
  errorMessage: string;
  required?: boolean;
}

const FormInputRow = ({
  icon,
  id,
  name,
  type,
  placeholder,
  handleValidate,
  errorMessage,
  required = false,
}: FormInputRowProps) => {
  const [error, setError] = React.useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (handleValidate(value)) setError(null);
    else setError(errorMessage);
  };

  return (
    <div>
      <div className="border border-gray-300 rounded-sm h-10 flex items-center px-3">
        {icon}
        <Input
          id={id}
          type={type}
          name={name}
          placeholder={placeholder}
          className="text-gray-700 placeholder:text-gray-400 md:text-lg text-sm"
          required={required}
          onBlur={handleInputChange}
        />
      </div>
      <div className="h-4 mt-0.5">
        {error && (
          <p className="text-red-500 text-xs ml-2 animate-in fade-in slide-in-from-top-1 duration-150">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormInputRow;
