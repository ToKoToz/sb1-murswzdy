import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: () => void;
}

function Toast({ type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-success text-white',
          icon: <CheckCircle className="w-5 h-5" />
        };
      case 'error':
        return {
          container: 'bg-error text-white',
          icon: <XCircle className="w-5 h-5" />
        };
      case 'warning':
        return {
          container: 'bg-warning text-white',
          icon: <AlertTriangle className="w-5 h-5" />
        };
      case 'info':
        return {
          container: 'bg-accent text-white',
          icon: <Info className="w-5 h-5" />
        };
      default:
        return {
          container: 'bg-primary-600 text-white',
          icon: <Info className="w-5 h-5" />
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`${styles.container} rounded-lg shadow-2xl p-4 border border-opacity-20 border-white`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {styles.icon}
          </div>
          
          <div className="flex-1">
            {title && (
              <h4 className="font-semibold mb-1">{title}</h4>
            )}
            <p className="text-sm leading-relaxed opacity-90">{message}</p>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Toast;