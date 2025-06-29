import { UserPreferences } from '../contexts/PreferencesContext';

/**
 * Formate une date selon le format choisi par l'utilisateur
 * 
 * @param date La date à formater (string, Date ou timestamp)
 * @param format Le format de date choisi
 * @returns La date formatée selon les préférences utilisateur
 */
export const formatDate = (
  date: string | Date | number, 
  format: UserPreferences['dateFormat'] = 'DD/MM/YYYY'
): string => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    console.error('Date invalide:', date);
    return '';
  }
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

/**
 * Formate une heure selon le format choisi par l'utilisateur
 * 
 * @param time L'heure à formater (string au format HH:MM ou HH:MM:SS)
 * @param format Le format d'heure choisi (12h ou 24h)
 * @returns L'heure formatée selon les préférences utilisateur
 */
export const formatTime = (
  time: string, 
  format: UserPreferences['timeFormat'] = '24h'
): string => {
  if (!time) return '';
  
  // Convertir en objet Date pour manipuler facilement
  let hours = 0;
  let minutes = 0;
  
  // Accepter les formats HH:MM et HH:MM:SS
  const timeComponents = time.split(':');
  if (timeComponents.length >= 2) {
    hours = parseInt(timeComponents[0], 10);
    minutes = parseInt(timeComponents[1], 10);
  }
  
  if (isNaN(hours) || isNaN(minutes)) {
    console.error('Format d\'heure invalide:', time);
    return time;
  }
  
  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convertir en format 12h
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
};

/**
 * Formate une date et heure complète
 * 
 * @param date La date à formater
 * @param dateFormat Le format de date
 * @param timeFormat Le format d'heure
 * @returns La date et l'heure formatées
 */
export const formatDateTime = (
  date: string | Date | number,
  dateFormat: UserPreferences['dateFormat'] = 'DD/MM/YYYY',
  timeFormat: UserPreferences['timeFormat'] = '24h'
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    console.error('Date invalide:', date);
    return '';
  }
  
  const formattedDate = formatDate(dateObj, dateFormat);
  
  // Extraire l'heure et les minutes
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;
  
  const formattedTime = formatTime(timeString, timeFormat);
  
  return `${formattedDate} ${formattedTime}`;
};