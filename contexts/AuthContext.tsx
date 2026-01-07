import React, { createContext, ReactNode, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User } from '../types/auth';
import { initializeCompanies } from '../utils/initialData';
import { storage } from '../utils/storage';
import { useAuth as useAuthHook } from '../hooks/useAuth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userCompanies, setUserCompanies] = useState<any[]>([]);
  const [currentCompany, setCurrentCompany] = useState<any | null>(null);
  
  const authHook = useAuthHook();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Al iniciar la app, primero verificar si fue cerrada completamente
    // (esto debe ejecutarse antes de cargar la sesión)
    const initialize = async () => {
      await checkIfAppWasClosed();
      await loadUserSession();
      await loadUserCompanies();
    };
    initialize();
  }, []);

  const checkIfAppWasClosed = async () => {
    try {
      const backgroundFlag = await AsyncStorage.getItem('appInBackground');
      const session = await storage.getUserSession();
      
      // Si hay un flag de background al iniciar, significa que la app fue cerrada completamente
      // (si solo hubiera sido minimizada, el flag se habría eliminado cuando volvió a active)
      if (session && backgroundFlag) {
        // Cerrar sesión
        await authHook.logout();
        await storage.clearUserSession();
        setUser(null);
        setUserCompanies([]);
        setCurrentCompany(null);
        // Eliminar el flag después de cerrar sesión
        await AsyncStorage.removeItem('appInBackground');
      }
    } catch (error) {
      // Silenciar errores
    }
  };

  const loadUserSession = async () => {
    try {
      const session = await storage.getUserSession();
      if (session) {
        setUser(session);
      }
    } catch (error) {
      console.error('Error loading user session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buildBackendUser = (profile: any): User => ({
    id: profile.id,
    email: profile.email,
    fullName: `${profile.first_name} ${profile.last_name}`.trim(),
    role: profile.role,
    company: 'SecuApp',
    phone: profile.phone || undefined,
    profile_image_url: profile.profile_image_url || undefined
  });

  const register = async ({ firstName, lastName, email, password, phone }: { firstName: string; lastName: string; email: string; password: string; phone: string; }): Promise<boolean> => {
    try {
      setIsLoading(true);

      const registeredUser = await authHook.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: 'employee',
        phone
      });

      if (registeredUser) {
        const profile = await authHook.getProfile();
        if (profile) {
          const backendUser = buildBackendUser(profile);
          await storage.saveUserSession(backendUser);
          setUser(backendUser);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error during register:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authHook.login(email, password);
      if (result) {
        const userProfile = await authHook.getProfile();
        if (userProfile) {
          const backendUser = buildBackendUser(userProfile);
          await storage.saveUserSession(backendUser);
          setUser(backendUser);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authHook.logout();
      await storage.clearUserSession();
      setUser(null);
      setUserCompanies([]);
      setCurrentCompany(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    // Cuando la app pasa a background, guardamos un flag en AsyncStorage
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      try {
        await AsyncStorage.setItem('appInBackground', 'true');
      } catch (error) {
        // Silenciar errores
      }
    }
    
    // Cuando la app vuelve a active, eliminamos el flag (solo fue minimizada)
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      try {
        await AsyncStorage.removeItem('appInBackground');
      } catch (error) {
        // Silenciar errores
      }
    }
    
    appState.current = nextAppState;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  const loadUserCompanies = async () => {
    try {
      await initializeCompanies(storage);
      const companies = await storage.loadCompanies();
      setUserCompanies(companies);
      if (companies.length === 1) {
        setCurrentCompany(companies[0]);
      }
    } catch (error) {
      console.error('Error loading user companies:', error);
    }
  };

  const changeCurrentCompany = (company: any) => {
    setCurrentCompany(company);
  };

  const hasMultipleCompanies = userCompanies.length > 1;

  const getCurrentCompany = () => {
    return currentCompany || userCompanies[0];
  };

  const refreshProfile = async () => {
    try {
      const userProfile = await authHook.getProfile();
      if (userProfile) {
        const backendUser = buildBackendUser(userProfile);
        await storage.saveUserSession(backendUser);
        setUser(backendUser);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const updateProfile = async (profileData: { first_name?: string; last_name?: string; phone?: string; profile_image_url?: string }) => {
    try {
      const updatedProfile = await authHook.updateProfile(profileData);
      if (updatedProfile) {
        const backendUser = buildBackendUser(updatedProfile);
        await storage.saveUserSession(backendUser);
        setUser(backendUser);
        return updatedProfile;
      }
      return null;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isManager: user?.role === 'manager',
    userCompanies,
    currentCompany,
    hasMultipleCompanies,
    getCurrentCompany,
    changeCurrentCompany,
    loadUserCompanies,
    refreshProfile,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
