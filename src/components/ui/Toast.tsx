import React, { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, duration, onClose]);

  if (!toast) return null;

  return (
    <div className={`fixed top-8 right-8 z-[200] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 border backdrop-blur-md ${
      toast.type === 'success' 
        ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200' 
        : toast.type === 'error'
          ? 'bg-red-900/90 border-red-500/50 text-red-200'
          : 'bg-indigo-900/90 border-indigo-500/50 text-indigo-200'
    }`}>
      {toast.type === 'success' && <CheckCircle2 size={18} />}
      {toast.type === 'error' && <XCircle size={18} />}
      {toast.type === 'info' && <CheckCircle2 size={18} />}
      <span className="text-sm font-semibold">{toast.message}</span>
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = React.useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  return { toast, showToast, hideToast };
};
