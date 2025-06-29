import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';
import Alert from '../components/ui/Alert';
import {
  Settings,
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Lock,
  Save,
  Monitor,
  Moon,
  Sun,
  Globe,
  Calendar,
  Clock,
  Type,
  Contrast,
  Pause,
  Languages,
  CheckCircle
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { preferences, setPreference, resetPreferences } = usePreferences();
  const { refreshTrainings } = useData();
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>({ show: false, type: 'info', message: '' });
  
  // Formulaire de profil
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone_number: '',
    function_title: '',
    profile_picture_url: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialiser le formulaire avec les données utilisateur
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        function_title: user.function_title || '',
        profile_picture_url: user.profile_picture_url || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  }, [user]);
  
  // Afficher une alerte
  const showAlertMessage = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 5000);
  };
  
  // Mettre à jour le profil utilisateur
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Si mot de passe fourni, le mettre à jour
      if (profileForm.current_password && profileForm.new_password) {
        if (profileForm.new_password !== profileForm.confirm_password) {
          showAlertMessage('error', 'Les nouveaux mots de passe ne correspondent pas');
          setIsSubmitting(false);
          return;
        }
        
        // Vérifier que le mot de passe actuel est correct
        const { error: pwError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: profileForm.current_password
        });
        
        if (pwError) {
          showAlertMessage('error', 'Mot de passe actuel incorrect');
          setIsSubmitting(false);
          return;
        }
        
        // Mettre à jour le mot de passe
        const { error: updatePwError } = await supabase.auth.updateUser({
          password: profileForm.new_password
        });
        
        if (updatePwError) {
          throw updatePwError;
        }
        
        showAlertMessage('success', 'Mot de passe mis à jour avec succès');
      }
      
      // Mettre à jour le profil
      const profileData = {
        name: profileForm.name,
        phone_number: profileForm.phone_number || null,
        function_title: profileForm.function_title || null,
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
      
      if (profileError) {
        throw profileError;
      }
      
      showAlertMessage('success', 'Profil mis à jour avec succès');
      
      // Rafraîchir les données utilisateur
      await refreshTrainings();
      
      // Réinitialiser les champs de mot de passe
      setProfileForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlertMessage('error', 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Mettre à jour une préférence et sauvegarder
  const handlePreferenceChange = <K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    setPreference(key, value);
    showAlertMessage('success', 'Préférence mise à jour');
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alert */}
      {alert.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(prev => ({ ...prev, show: false }))}
        />
      )}
      
      <div className="flex items-center mb-6">
        <Settings className="w-8 h-8 text-accent mr-3" />
        <div>
          <h1 className="text-3xl font-bold text-primary-800">
            Paramètres
          </h1>
          <p className="text-primary-600">
            Personnalisez votre expérience et gérez votre profil
          </p>
        </div>
      </div>
      
      {/* Sections principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne 1: Profil utilisateur */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-md border border-primary-200">
            <h2 className="text-xl font-bold text-primary-800 mb-6 flex items-center">
              <User className="w-6 h-6 mr-2 text-accent" />
              Profil
            </h2>
            
            <div className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5" />
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-primary-300 rounded-md focus:ring-accent focus:border-accent bg-white text-primary-800"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5" />
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full pl-10 pr-3 py-2 border border-primary-300 rounded-md bg-primary-50 text-primary-800 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-primary-500 mt-1">L'email ne peut pas être modifié.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Numéro de téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5" />
                    <input
                      type="tel"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-primary-300 rounded-md focus:ring-accent focus:border-accent bg-white text-primary-800"
                      placeholder="Votre téléphone"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Fonction</label>
                  <select
                    value={profileForm.function_title}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, function_title: e.target.value }))}
                    className="w-full pl-3 pr-10 py-2 border border-primary-300 rounded-md focus:ring-accent focus:border-accent bg-white text-primary-800"
                  >
                    <option value="">Sélectionner une fonction</option>
                    <option value="Formateur">Formateur</option>
                    <option value="Formateur Senior">Formateur Senior</option>
                    <option value="Formateur Expert">Formateur Expert</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Expert Métier">Expert Métier</option>
                    <option value="Responsable Formation">Responsable Formation</option>
                    <option value="Coordinateur Pédagogique">Coordinateur Pédagogique</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
              
              {/* Changement de mot de passe */}
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-4">Changer de mot de passe</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">Mot de passe actuel</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5" />
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={profileForm.current_password}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, current_password: e.target.value }))}
                        className="w-full pl-10 pr-10 py-2 border border-primary-300 rounded-md focus:ring-accent focus:border-accent bg-white text-primary-800"
                        placeholder="Votre mot de passe actuel"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">Nouveau mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5" />
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={profileForm.new_password}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, new_password: e.target.value }))}
                        className="w-full pl-10 pr-10 py-2 border border-primary-300 rounded-md focus:ring-accent focus:border-accent bg-white text-primary-800"
                        placeholder="Nouveau mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-1">Confirmer le nouveau mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5" />
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={profileForm.confirm_password}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                        className="w-full pl-10 pr-10 py-2 border border-primary-300 rounded-md focus:ring-accent focus:border-accent bg-white text-primary-800"
                        placeholder="Confirmez le mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-primary-600 mt-2 space-y-1">
                  <p>Le mot de passe doit contenir :</p>
                  <ul className="list-disc pl-5">
                    <li>Au moins 8 caractères</li>
                    <li>Au moins une lettre majuscule et une minuscule</li>
                    <li>Au moins un chiffre</li>
                    <li>Au moins un caractère spécial</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-primary-200">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-accent hover:bg-accent-dark text-white px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Préférences d'interface */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-primary-200">
            <h2 className="text-xl font-bold text-primary-800 mb-6 flex items-center">
              <Monitor className="w-6 h-6 mr-2 text-accent" />
              Apparence
            </h2>
            
            <div className="space-y-6">
              {/* Thème */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-3">Thème</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handlePreferenceChange('theme', 'light')}
                    className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                      preferences.theme === 'light' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <Sun className="w-6 h-6 text-primary-800" />
                    <span className="text-sm font-medium">Clair</span>
                    {preferences.theme === 'light' && (
                      <CheckCircle className="w-4 h-4 text-accent absolute top-2 right-2" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handlePreferenceChange('theme', 'dark')}
                    className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                      preferences.theme === 'dark' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <Moon className="w-6 h-6 text-primary-800" />
                    <span className="text-sm font-medium">Sombre</span>
                    {preferences.theme === 'dark' && (
                      <CheckCircle className="w-4 h-4 text-accent absolute top-2 right-2" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handlePreferenceChange('theme', 'auto')}
                    className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                      preferences.theme === 'auto' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <div className="flex">
                      <Sun className="w-6 h-6 text-primary-800" />
                      <Moon className="w-6 h-6 text-primary-800" />
                    </div>
                    <span className="text-sm font-medium">Automatique</span>
                    {preferences.theme === 'auto' && (
                      <CheckCircle className="w-4 h-4 text-accent absolute top-2 right-2" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Langue */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-3">Langue</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePreferenceChange('language', 'fr')}
                    className={`p-4 border rounded-lg flex items-center space-x-3 transition-all ${
                      preferences.language === 'fr' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">🇫🇷</div>
                    <span className="text-sm font-medium">Français</span>
                    {preferences.language === 'fr' && (
                      <CheckCircle className="w-4 h-4 text-accent ml-auto" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handlePreferenceChange('language', 'en')}
                    className={`p-4 border rounded-lg flex items-center space-x-3 transition-all ${
                      preferences.language === 'en' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">🇬🇧</div>
                    <span className="text-sm font-medium">English</span>
                    {preferences.language === 'en' && (
                      <CheckCircle className="w-4 h-4 text-accent ml-auto" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Préférences de format */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-primary-200">
            <h2 className="text-xl font-bold text-primary-800 mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-accent" />
              Format
            </h2>
            
            <div className="space-y-6">
              {/* Format de date */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-3">Format de date</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handlePreferenceChange('dateFormat', 'DD/MM/YYYY')}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-all ${
                      preferences.dateFormat === 'DD/MM/YYYY' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <span className="text-sm font-medium">31/12/2025</span>
                    {preferences.dateFormat === 'DD/MM/YYYY' && (
                      <CheckCircle className="w-4 h-4 text-accent ml-1" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handlePreferenceChange('dateFormat', 'MM/DD/YYYY')}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-all ${
                      preferences.dateFormat === 'MM/DD/YYYY' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <span className="text-sm font-medium">12/31/2025</span>
                    {preferences.dateFormat === 'MM/DD/YYYY' && (
                      <CheckCircle className="w-4 h-4 text-accent ml-1" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handlePreferenceChange('dateFormat', 'YYYY-MM-DD')}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-all ${
                      preferences.dateFormat === 'YYYY-MM-DD' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <span className="text-sm font-medium">2025-12-31</span>
                    {preferences.dateFormat === 'YYYY-MM-DD' && (
                      <CheckCircle className="w-4 h-4 text-accent ml-1" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Format d'heure */}
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-3">Format d'heure</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePreferenceChange('timeFormat', '24h')}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-all ${
                      preferences.timeFormat === '24h' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-primary-700" />
                    <span className="text-sm font-medium">14:30</span>
                    {preferences.timeFormat === '24h' && (
                      <CheckCircle className="w-4 h-4 text-accent ml-1" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handlePreferenceChange('timeFormat', '12h')}
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-all ${
                      preferences.timeFormat === '12h' 
                        ? 'border-accent bg-accent bg-opacity-10' 
                        : 'border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-primary-700" />
                    <span className="text-sm font-medium">2:30 PM</span>
                    {preferences.timeFormat === '12h' && (
                      <CheckCircle className="w-4 h-4 text-accent ml-1" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Colonne 2: Accessibilité */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-md border border-primary-200">
            <h2 className="text-xl font-bold text-primary-800 mb-6 flex items-center">
              <Type className="w-6 h-6 mr-2 text-accent" />
              Accessibilité
            </h2>
            
            <div className="space-y-6">
              {/* Texte plus grand */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Type className="w-5 h-5 text-primary-700" />
                  <div>
                    <h3 className="text-primary-800 font-medium">Texte plus grand</h3>
                    <p className="text-primary-600 text-sm">Augmente la taille du texte pour une meilleure lisibilité</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePreferenceChange('largerText', !preferences.largerText)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    preferences.largerText ? 'bg-accent' : 'bg-primary-300'
                  }`}
                  aria-pressed={preferences.largerText}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      preferences.largerText ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Contraste élevé */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Contrast className="w-5 h-5 text-primary-700" />
                  <div>
                    <h3 className="text-primary-800 font-medium">Contraste élevé</h3>
                    <p className="text-primary-600 text-sm">Améliore le contraste des couleurs</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePreferenceChange('highContrast', !preferences.highContrast)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    preferences.highContrast ? 'bg-accent' : 'bg-primary-300'
                  }`}
                  aria-pressed={preferences.highContrast}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Réduire les animations */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Pause className="w-5 h-5 text-primary-700" />
                  <div>
                    <h3 className="text-primary-800 font-medium">Réduire les animations</h3>
                    <p className="text-primary-600 text-sm">Diminue ou désactive les animations de l'interface</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePreferenceChange('reduceAnimations', !preferences.reduceAnimations)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    preferences.reduceAnimations ? 'bg-accent' : 'bg-primary-300'
                  }`}
                  aria-pressed={preferences.reduceAnimations}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      preferences.reduceAnimations ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-primary-200">
              <button
                onClick={resetPreferences}
                className="w-full bg-primary-100 hover:bg-primary-200 text-primary-800 py-2 rounded-lg transition-colors"
              >
                Réinitialiser tous les paramètres
              </button>
            </div>
          </div>
          
          {/* Informations utilisateur */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-primary-200">
            <h2 className="text-xl font-bold text-primary-800 mb-6 flex items-center">
              <User className="w-6 h-6 mr-2 text-accent" />
              Informations
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-primary-700">Rôle</div>
                <div className="text-primary-900 font-medium capitalize">
                  {user.role === 'admin' ? 'Administrateur' : 'Formateur'}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-primary-700">Compte créé le</div>
                <div className="text-primary-900 font-medium">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-primary-700">Dernière mise à jour</div>
                <div className="text-primary-900 font-medium">
                  {new Date(user.updated_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-md border border-primary-200">
            <h2 className="text-xl font-bold text-primary-800 mb-4">Assistance</h2>
            <p className="text-primary-700 text-sm mb-4">
              Si vous avez besoin d'aide ou si vous souhaitez signaler un problème, contactez-nous à :
            </p>
            <a 
              href="mailto:support@formation-pro.com" 
              className="text-accent hover:text-accent-dark font-medium transition-colors"
            >
              support@formation-pro.com
            </a>
            
            <div className="mt-4 pt-4 border-t border-primary-200 text-center">
              <p className="text-xs text-primary-500">
                Version de l'application : 1.0.0
              </p>
              <p className="text-xs text-primary-500">
                © 2024 Formation Pro
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;