import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-[#17181C] mb-1.5">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full bg-[#F2F1ED] text-[#17181C] placeholder-[#8B7A72] px-3 py-2 text-sm border border-[rgba(139,122,114,0.3)] focus:border-[#A6824C] focus:outline-none transition-colors ${
            error ? 'border-[#8B261D]' : ''
          } ${className}`}
          style={{ borderRadius: '2px', boxShadow: 'none' }}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#8B261D]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
