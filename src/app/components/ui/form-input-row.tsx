'use client';
import { Input } from '@/app/components/ui/input';
import React from 'react';

interface FormInputRowProps {
  icon?: React.ReactNode;
  id: string;
  name: string;
  type: string;
  placeholder: string;
  handleValidate: (value: unknown) => boolean;
  errorMessage: string;
  required?: boolean;
  label?: string;
  marker?: string;
  containerClassName?: string;
  fieldClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
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
  label,
  marker,
  containerClassName,
  fieldClassName,
  inputClassName,
  errorClassName,
}: FormInputRowProps) => {
  const [error, setError] = React.useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (handleValidate(value)) setError(null);
    else setError(errorMessage);
  };

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500"
        >
          {label}
        </label>
      )}
      <div
        className={
          fieldClassName ??
          'border border-gray-300 rounded-sm h-10 flex items-center px-3'
        }
      >
        {marker && (
          <span className="mr-4 shrink-0 font-mono text-sm text-pink-500">
            {marker}
          </span>
        )}
        {icon}
        <Input
          id={id}
          type={type}
          name={name}
          placeholder={placeholder}
          className={
            inputClassName ??
            'text-gray-700 placeholder:text-gray-400 md:text-lg text-sm'
          }
          required={required}
          onBlur={handleInputChange}
        />
      </div>
      <div className="h-4 mt-0.5">
        {error && (
          <p
            className={
              errorClassName ??
              'text-red-500 text-xs ml-2 animate-in fade-in slide-in-from-top-1 duration-150'
            }
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormInputRow;
