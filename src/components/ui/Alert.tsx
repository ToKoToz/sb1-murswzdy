import React, { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  children?: ReactNode;
}

function Alert({ type, title, message, onClose, children }: AlertProps) {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-success-light bg-opacity-10 border-success text-success-dark',
          icon: <CheckCircle className="w-5 h-5" />,
          iconColor: 'text-success'
        };
      case 'error':
        return {
          container: 'bg-error-light bg-opacity-10 border-error text-error-dark',
          icon: <XCircle className="w-5 h-5" />,
          iconColor: 'text-error'
        };
      case 'warning':
        return {
          container: 'bg-warning-light bg-opacity-10 border-warning text-warning-dark',
          icon: <AlertTriangle className="w-5 h-5" />,
          iconColor: 'text-warning'
        };
      case 'info':
        return {
          container: 'bg-accent bg-opacity-10 border-accent text-accent-dark',
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-accent'
        };
      default:
        return {
          container: 'bg-primary-100 border-primary-300 text-primary-800',
          icon: <Info className="w-5 h-5" />,
          iconColor: 'text-primary-600'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`border rounded-lg p-4 ${styles.container} animate-fade-in`}>
      <div className="flex items-start space-x-3">
        <div className={styles.iconColor}>
          {styles.icon}
        </div>
        
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <p className="text-sm leading-relaxed">{message}</p>
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-current opacity-70 hover:opacity-100 transition-opacity duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;