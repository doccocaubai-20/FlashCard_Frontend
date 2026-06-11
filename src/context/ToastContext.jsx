import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300';
      case 'error':
        return 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300';
      case 'warning':
        return 'bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'info':
      default:
        return 'bg-blue-50/95 dark:bg-blue-950/90 border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-300';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      {/* Toast container overlay */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-in ${getTypeStyles(
              toast.type
            )}`}
          >
            {getIcon(toast.type)}
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-mute hover:text-ink dark:hover:text-on-dark transition-colors cursor-pointer shrink-0 mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
