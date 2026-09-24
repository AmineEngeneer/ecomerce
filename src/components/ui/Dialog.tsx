import React from 'react';

export interface DialogProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  open,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  const visible = open ?? isOpen ?? false;
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dim overlay with no blur/glassmorphism per Section 18 */}
      <div
        className="fixed inset-0 bg-[#17181C]/40 transition-opacity"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg bg-[#F2F1ED] border border-[rgba(139,122,114,0.3)] p-6 space-y-4"
        style={{ borderRadius: 0, boxShadow: 'none' }}
      >
        <div className="space-y-1">
          <h3 className="text-xl font-medium font-serif text-[#17181C]">{title}</h3>
          {description && <p className="text-sm text-[#8B7A72]">{description}</p>}
        </div>
        <div className="py-2 text-sm text-[#17181C]">{children}</div>
        {footer && <div className="pt-4 border-t border-[rgba(139,122,114,0.2)] flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};
