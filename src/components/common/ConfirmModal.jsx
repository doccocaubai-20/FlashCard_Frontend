import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title = 'Xác nhận', 
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?', 
  confirmText = 'Xác nhận', 
  cancelText = 'Hủy', 
  onConfirm, 
  onClose,
  isDanger = true
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content Box */}
      <div className="relative bg-surface-card dark:bg-surface-dark border border-hairline dark:border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl transition-all duration-300 transform scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-surface-bone dark:hover:bg-white/5 text-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          {/* Header Warning Icon */}
          <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-4 ${
            isDanger 
              ? 'bg-red-50 dark:bg-red-950/20 text-red-500' 
              : 'bg-primary-light text-primary'
          }`}>
            <AlertTriangle size={28} />
          </div>

          {/* Title */}
          <h3 className="text-base font-display font-extrabold text-ink dark:text-on-dark tracking-tight mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-xs text-mute dark:text-on-dark-mute leading-relaxed mb-6 font-medium">
            {message}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-bold rounded-full bg-surface-bone dark:bg-white/5 text-mute dark:text-on-dark-mute hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                if (onConfirm) onConfirm();
              }}
              className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-full text-white transition-all transform active:scale-98 cursor-pointer shadow-sm ${
                isDanger 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/10' 
                  : 'bg-primary hover:bg-primary-deep shadow-primary/10'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
