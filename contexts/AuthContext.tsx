import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
  
  // Usar el hook de autenticación que conecta con el backend
  const authHook = useAuthHook();

  useEffect(() => {
    loadUserSession();
    loadUserCompanies();
  }, []);

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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Usar el hook de autenticación que conecta con el backend
      const result = await authHook.login(email, password);
      
      if (result) {
        // Obtener el perfil del usuario desde el backend
        const userProfile = await authHook.getProfile();
        
        if (userProfile) {
          const backendUser: User = {
            id: userProfile.id,
            email: userProfile.email,
            fullName: `${userProfile.first_name} ${userProfile.last_name}`,
            role: userProfile.role,
            company: 'SecuApp' // Por ahora fijo, después se puede obtener de la empresa
          };
          
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
      // Usar el hook de autenticación para cerrar sesión en el backend
      await authHook.logout();
      
      await storage.clearUserSession();
      setUser(null);
      setUserCompanies([]);
      setCurrentCompany(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Cargar empresas del usuario
  const loadUserCompanies = async () => {
    try {
      // Inicializar empresas si no existen
      await initializeCompanies(storage);
      
      const companies = await storage.loadCompanies();
      setUserCompanies(companies);
      
      // Si solo hay una empresa, establecerla como actual
      if (companies.length === 1) {
        setCurrentCompany(companies[0]);
      }
    } catch (error) {
      console.error('Error loading user companies:', error);
    }
  };

  // Cambiar empresa actual
  const changeCurrentCompany = (company: any) => {
    setCurrentCompany(company);
  };

  // Verificar si el usuario trabaja para múltiples empresas
  const hasMultipleCompanies = userCompanies.length > 1;
  
  // Obtener empresa actual o primera empresa
  const getCurrentCompany = () => {
    return currentCompany || userCompanies[0];
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isManager: user?.role === 'manager',
    userCompanies,
    currentCompany,
    hasMultipleCompanies,
    getCurrentCompany,
    changeCurrentCompany,
    loadUserCompanies
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
