import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-colors cursor-pointer border select-none whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Exact specs from Section 18:
    // primary = ink background / paper text, hover → brass background
    // secondary = outline in ink, transparent background
    // No icons appended to button text, sentence case only, 0px radius, no shadow
    const variants = {
      primary: 'bg-[#17181C] text-[#F2F1ED] border-[#17181C] hover:bg-[#A6824C] hover:border-[#A6824C]',
      secondary: 'bg-transparent text-[#17181C] border-[#17181C] hover:border-[#A6824C] hover:text-[#A6824C]',
      ghost: 'bg-transparent text-[#17181C] border-transparent hover:bg-[rgba(139,122,114,0.1)]',
      danger: 'bg-transparent text-[#8B261D] border-[#8B261D] hover:bg-[#8B261D] hover:text-[#F2F1ED]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[32px]',
      md: 'text-sm px-4 py-2 min-h-[40px]',
      lg: 'text-base px-6 py-3 min-h-[48px]',
    };

    const width = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
        style={{ borderRadius: 0, boxShadow: 'none' }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
