import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  function_title?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  clearAuthError: () => void;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null
};

let authInitialized = false;
let authTimeout: NodeJS.Timeout | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Éviter les initialisations multiples
    if (authInitialized) {
      return;
    }
    
    authInitialized = true;
    
    // Timeout de sécurité pour éviter le chargement infini
    authTimeout = setTimeout(() => {
      console.warn('⚠️ Auth timeout - forcing no user state');
      dispatch({ type: 'SET_USER', payload: null });
    }, 10000); // 10 secondes max

    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔥 Auth state change:', event, session?.user?.email);
      
      if (authTimeout) {
        clearTimeout(authTimeout);
        authTimeout = null;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, loading profile...');
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out');
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      subscription.unsubscribe();
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
    };
  }, []); // Dépendances vides pour éviter les re-runs

  const initializeAuth = async () => {
    try {
      console.log('🚀 Initializing auth...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('📋 Session check:', session?.user?.email, error);
      
      if (error) {
        console.error('❌ Session error:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Erreur de session' });
        return;
      }
      
      if (session?.user) {
        console.log('👤 Session found, loading user profile...');
        await loadUserProfile(session.user);
      } else {
        console.log('🚫 No session found');
        dispatch({ type: 'SET_USER', payload: null });
      }
    } catch (error) {
      console.error('💥 Auth initialization error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur d\'initialisation' });
    }
  };

  const loadUserProfile = async (authUser: any) => {
    try {
      console.log('📊 Loading user profile for:', authUser.id, authUser.email);
      
      // Requête simple sans joins complexes
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      console.log('👤 Profile query result:', profile, profileError);

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        // Ne pas throw, créer un fallback user
      }

      let user: User;

      if (profile) {
        // Profil existant trouvé
        user = {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          phone: profile.phone_number,
          function_title: profile.function_title,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
      } else {
        // Profil manquant - créer un utilisateur basique
        console.log('🆕 No profile found, creating fallback user...');
        
        user = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          role: authUser.user_metadata?.role || 'trainer',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || authUser.created_at
        };

        // Essayer de créer le profil en arrière-plan (sans bloquer)
        setTimeout(async () => {
          try {
            await supabase
              .from('profiles')
              .upsert({
                id: authUser.id,
                name: user.name,
                email: user.email,
                role: user.role,
              });
            console.log('✅ Profile created in background');
          } catch (error) {
            console.log('⚠️ Could not create profile:', error);
          }
        }, 1000);
      }

      console.log('✅ User profile loaded successfully:', user);
      dispatch({ type: 'SET_USER', payload: user });

    } catch (error) {
      console.error('💥 Error loading user profile:', error);
      
      // Créer un utilisateur de fallback pour éviter les boucles
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
        role: authUser.user_metadata?.role || 'trainer',
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at
      };

      console.log('🔄 Using fallback user:', fallbackUser);
      dispatch({ type: 'SET_USER', payload: fallbackUser });
    }
  };

  const login = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      console.log('🔐 Attempting login for:', credentials.email);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('❌ Login error:', error);
        const errorMessage = getAuthErrorMessage(error.message);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        console.log('✅ Login successful for:', data.user.email);
        await loadUserProfile(data.user);
        return { success: true };
      }

      return { success: false, error: 'Erreur de connexion' };
    } catch (error) {
      console.error('💥 Login error:', error);
      const errorMessage = 'Erreur de connexion';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await supabase.auth.signOut();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('❌ Logout error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const hasRole = (role: string): boolean => {
    return state.user?.role === role;
  };

  const clearAuthError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const getAuthErrorMessage = (error: string): string => {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'Adresse mail ou mot de passe incorrect',
      'Email not confirmed': 'Veuillez vérifier votre email',
      'User already registered': 'Un compte existe déjà avec cet email',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
      'Invalid email': 'Format d\'email invalide',
      'User not found': 'Utilisateur non trouvé',
      'Email rate limit exceeded': 'Trop de tentatives, veuillez réessayer plus tard',
      'Database error querying schema': 'Erreur de base de données - Veuillez réessayer'
    };

    return errorMap[error] || 'Adresse mail ou mot de passe incorrect';
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      hasRole,
      clearAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}