import React from 'react';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'ink' | 'forest' | 'brass';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  title,
  description,
  variant = 'ink',
  onClose,
}) => {
  const styles = {
    ink: 'bg-[#17181C] text-[#F2F1ED] border-[#17181C]',
    forest: 'bg-[#2F4739] text-[#F2F1ED] border-[#2F4739]',
    brass: 'bg-[#A6824C] text-[#17181C] border-[#A6824C]',
  };

  return (
    <div
      className={`border px-4 py-3 flex items-start justify-between gap-4 max-w-sm ${styles[variant]}`}
      style={{ borderRadius: 0, boxShadow: 'none' }}
      role="alert"
    >
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs opacity-90">{description}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-xs opacity-70 hover:opacity-100 transition-opacity cursor-pointer underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};
