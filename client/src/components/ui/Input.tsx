import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  
  const baseStyles = 'w-full px-4 py-2.5 bg-neutral-900 border rounded-lg text-neutral-100 placeholder-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed';
  const normalStyles = 'border-neutral-700 focus:border-blue-500 focus:ring-blue-500';
  const errorStyles = 'border-red-600 focus:border-red-500 focus:ring-red-500';
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-200"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseStyles} ${hasError ? errorStyles : normalStyles} ${className}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-error-500">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

export default Input;

