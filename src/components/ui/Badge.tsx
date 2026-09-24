import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'forest' | 'stone' | 'ink' | 'brass' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'forest',
  className = '',
}) => {
  const variants = {
    forest: 'text-[#2F4739] bg-[rgba(47,71,57,0.08)] border border-[rgba(47,71,57,0.2)]',
    stone: 'text-[#8B7A72] bg-[rgba(139,122,114,0.08)] border border-[rgba(139,122,114,0.2)]',
    ink: 'text-[#17181C] bg-[rgba(23,24,28,0.08)] border border-[rgba(23,24,28,0.2)]',
    brass: 'text-[#A6824C] bg-[rgba(166,130,76,0.1)] border border-[rgba(166,130,76,0.25)]',
    outline: 'text-[#17181C] bg-transparent border border-[rgba(139,122,114,0.3)]',
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium tracking-tight ${variants[variant]} ${className}`}
      style={{ borderRadius: 0 }}
    >
      {children}
    </span>
  );
};
