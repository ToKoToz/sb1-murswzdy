import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'warning'
}: ConfirmDialogProps) {
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-error" />,
          confirmButton: 'bg-error hover:bg-error-dark',
          iconBg: 'bg-error-light bg-opacity-20'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-warning" />,
          confirmButton: 'bg-warning hover:bg-warning-dark',
          iconBg: 'bg-warning-light bg-opacity-20'
        };
      case 'info':
        return {
          icon: <Check className="w-12 h-12 text-accent" />,
          confirmButton: 'bg-accent hover:bg-accent-dark',
          iconBg: 'bg-accent bg-opacity-10'
        };
      default:
        return {
          icon: <AlertTriangle className="w-12 h-12 text-warning" />,
          confirmButton: 'bg-warning hover:bg-warning-dark',
          iconBg: 'bg-warning-light bg-opacity-20'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {styles.icon}
        </div>
        
        <p className="text-primary-700 mb-6 leading-relaxed">
          {message}
        </p>
        
        <div className="flex space-x-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-3 ${styles.confirmButton} text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;