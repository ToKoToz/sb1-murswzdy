import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { name: string; displayName: string } | null;
  status: string;
  permissions: string[];
  profilePicture?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  permissions: string[];
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
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
    case 'LOGOUT':
      return {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        permissions: [],
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
  permissions: [],
  error: null
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    initializeAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Erreur de session' });
        return;
      }
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur d\'initialisation' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadUserProfile = async (authUser: any) => {
    try {
      // Try to get user profile from user_profiles table
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          role:user_roles(name, display_name)
        `)
        .eq('id', authUser.id)
        .maybeSingle();

      // If no profile exists, try to create one
      if (!profile && !profileError) {
        // First check if we have the necessary tables
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('id, name')
          .eq('name', 'trainer')
          .maybeSingle();

        if (rolesData) {
          // Create profile for existing auth user
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              first_name: authUser.user_metadata?.first_name || authUser.email.split('@')[0],
              last_name: authUser.user_metadata?.last_name || 'User',
              role_id: rolesData.id,
              status: 'active',
              email_verified_at: authUser.email_confirmed_at
            })
            .select(`
              *,
              role:user_roles(name, display_name)
            `)
            .single();

          if (!createError) {
            profile = newProfile;
          }
        }
      }

      // If we still don't have a profile, create a basic user object
      if (!profile) {
        const basicUser: User = {
          id: authUser.id,
          email: authUser.email,
          firstName: authUser.user_metadata?.first_name || authUser.email.split('@')[0],
          lastName: authUser.user_metadata?.last_name || 'User',
          role: { name: 'trainer', displayName: 'Formateur' },
          status: 'active',
          permissions: [],
          createdAt: authUser.created_at,
          updatedAt: authUser.updated_at || authUser.created_at
        };

        dispatch({ type: 'SET_USER', payload: basicUser });
        return;
      }

      // Build user object from profile
      const user: User = {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role ? {
          name: profile.role.name,
          displayName: profile.role.display_name
        } : { name: 'trainer', displayName: 'Formateur' },
        status: profile.status,
        permissions: [],
        profilePicture: profile.profile_picture,
        phone: profile.phone,
        department: profile.department,
        jobTitle: profile.job_title,
        bio: profile.bio,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };

      dispatch({ type: 'SET_USER', payload: user });

    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Create a fallback user if there's an error
      const fallbackUser: User = {
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.user_metadata?.first_name || authUser.email.split('@')[0],
        lastName: authUser.user_metadata?.last_name || 'User',
        role: { name: 'trainer', displayName: 'Formateur' },
        status: 'active',
        permissions: [],
        createdAt: authUser.created_at,
        updatedAt: authUser.updated_at || authUser.created_at
      };

      dispatch({ type: 'SET_USER', payload: fallbackUser });
    }
  };

  const login = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error.message);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        await loadUserProfile(data.user);
        return { success: true };
      }

      return { success: false, error: 'Erreur de connexion' };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Erreur de connexion';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const hasPermission = (permission: string): boolean => {
    return state.permissions.includes(permission) || state.user?.role?.name === 'admin';
  };

  const hasRole = (role: string): boolean => {
    return state.user?.role?.name === role;
  };

  const getAuthErrorMessage = (error: string): string => {
    const errorMap: { [key: string]: string } = {
      'Invalid login credentials': 'Email ou mot de passe incorrect',
      'Email not confirmed': 'Veuillez vérifier votre email',
      'User already registered': 'Un compte existe déjà avec cet email',
      'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
      'Invalid email': 'Format d\'email invalide',
      'User not found': 'Utilisateur non trouvé',
      'Email rate limit exceeded': 'Trop de tentatives, veuillez réessayer plus tard'
    };

    return errorMap[error] || 'Une erreur est survenue';
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      hasPermission,
      hasRole
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