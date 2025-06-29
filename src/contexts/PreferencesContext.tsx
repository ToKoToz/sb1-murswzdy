import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Types pour les préférences utilisateur
export interface UserPreferences {
  // Apparence
  theme: 'light' | 'dark' | 'auto';
  language: 'fr' | 'en';
  
  // Format
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '24h' | '12h';
  
  // Accessibilité
  largerText: boolean;
  highContrast: boolean;
  reduceAnimations: boolean;
}

// Valeurs par défaut
const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'fr',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  largerText: false,
  highContrast: false,
  reduceAnimations: false,
};

// Interface du contexte
interface PreferencesContextType {
  preferences: UserPreferences;
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
  loading: boolean;
  error: string | null;
}

// Création du contexte
const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

// Hook pour utiliser le contexte des préférences
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

// Provider component
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  // Charger les préférences de l'utilisateur depuis le stockage local (pour commencer)
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // D'abord, on essaie de charger depuis le stockage local
        const localPrefs = localStorage.getItem('userPreferences');
        if (localPrefs) {
          setPreferences(JSON.parse(localPrefs));
          setLoading(false);
          return;
        }
        
        // Si l'utilisateur est authentifié, essayer de charger depuis Supabase
        if (isAuthenticated && user) {
          // Vérifie si une table de préférences existe
          try {
            const { data, error } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', user.id)
              .single();
              
            if (error && error.code !== 'PGRST116') { // PGRST116 = Not found
              throw error;
            }
            
            if (data) {
              // Convertir les données de la base en format attendu
              const dbPrefs: UserPreferences = {
                theme: data.theme || defaultPreferences.theme,
                language: data.language || defaultPreferences.language,
                dateFormat: data.date_format || defaultPreferences.dateFormat,
                timeFormat: data.time_format || defaultPreferences.timeFormat,
                largerText: data.larger_text || defaultPreferences.largerText,
                highContrast: data.high_contrast || defaultPreferences.highContrast,
                reduceAnimations: data.reduce_animations || defaultPreferences.reduceAnimations,
              };
              
              setPreferences(dbPrefs);
              
              // Sauvegarder aussi dans localStorage pour accès rapide
              localStorage.setItem('userPreferences', JSON.stringify(dbPrefs));
            }
          } catch (dbError) {
            console.warn('Error loading preferences from DB, falling back to defaults:', dbError);
            // Si la table n'existe pas ou une autre erreur, on utilise les préférences par défaut
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError('Erreur lors du chargement des préférences');
        setLoading(false);
      }
    };
    
    loadPreferences();
  }, [isAuthenticated, user]);
  
  // Appliquer les préférences globalement
  useEffect(() => {
    const applyPreferences = () => {
      // Appliquer les classes globales au document HTML
      const htmlElement = document.documentElement;
      
      // Appliquer le thème
      if (preferences.theme === 'dark') {
        htmlElement.classList.add('dark');
      } else if (preferences.theme === 'light') {
        htmlElement.classList.remove('dark');
      } else {
        // En mode auto, suivre les préférences du système
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          htmlElement.classList.add('dark');
        } else {
          htmlElement.classList.remove('dark');
        }
      }
      
      // Appliquer le texte plus grand
      if (preferences.largerText) {
        htmlElement.classList.add('text-lg');
      } else {
        htmlElement.classList.remove('text-lg');
      }
      
      // Appliquer le contraste élevé
      if (preferences.highContrast) {
        htmlElement.classList.add('high-contrast');
      } else {
        htmlElement.classList.remove('high-contrast');
      }
      
      // Appliquer la réduction des animations
      if (preferences.reduceAnimations) {
        htmlElement.classList.add('reduce-motion');
      } else {
        htmlElement.classList.remove('reduce-motion');
      }
    };
    
    applyPreferences();
    
    // Sauvegarder les préférences dans localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    // Si l'utilisateur est connecté, essayer de sauvegarder aussi dans la base
    if (isAuthenticated && user) {
      const savePreferencesToDB = async () => {
        try {
          // Vérifier si une table de préférences existe
          try {
            // Convertir au format de la base de données (si utilisé)
            const dbPrefs = {
              user_id: user.id,
              theme: preferences.theme,
              language: preferences.language,
              date_format: preferences.dateFormat,
              time_format: preferences.timeFormat,
              larger_text: preferences.largerText,
              high_contrast: preferences.highContrast,
              reduce_animations: preferences.reduceAnimations,
            };
            
            // Upsert des préférences (insert or update)
            await supabase
              .from('user_preferences')
              .upsert(dbPrefs, { onConflict: 'user_id' });
              
          } catch (dbError) {
            console.warn('Error saving preferences to DB, storing in localStorage only:', dbError);
            // Si la table n'existe pas, on se contente du stockage local
          }
        } catch (err) {
          console.error('Error saving preferences:', err);
        }
      };
      
      savePreferencesToDB();
    }
  }, [preferences, isAuthenticated, user]);
  
  // Fonction pour mettre à jour une préférence spécifique
  const setPreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };
  
  // Fonction pour réinitialiser toutes les préférences
  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };
  
  // Valeur du contexte
  const value = {
    preferences,
    setPreference,
    resetPreferences,
    loading,
    error,
  };
  
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}