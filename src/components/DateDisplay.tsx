import React from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { formatDate, formatTime, formatDateTime } from '../lib/dateUtils';

interface DateDisplayProps {
  date: string | Date | number;
  format?: 'date' | 'time' | 'datetime';
  className?: string;
}

/**
 * Composant qui affiche une date formatée selon les préférences utilisateur
 */
const DateDisplay: React.FC<DateDisplayProps> = ({ 
  date, 
  format = 'date', 
  className = ''
}) => {
  const { preferences } = usePreferences();
  
  if (!date) {
    return <span className={className}>-</span>;
  }
  
  try {
    switch (format) {
      case 'date':
        return (
          <span className={className}>
            {formatDate(date, preferences.dateFormat)}
          </span>
        );
      
      case 'time':
        // Pour le format 'time', on attend une chaîne au format HH:MM ou HH:MM:SS
        return (
          <span className={className}>
            {typeof date === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(date)
              ? formatTime(date, preferences.timeFormat)
              : ''}
          </span>
        );
      
      case 'datetime':
        return (
          <span className={className}>
            {formatDateTime(date, preferences.dateFormat, preferences.timeFormat)}
          </span>
        );
      
      default:
        return <span className={className}>{formatDate(date, preferences.dateFormat)}</span>;
    }
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return <span className={className}>Format invalide</span>;
  }
};

export default DateDisplay;