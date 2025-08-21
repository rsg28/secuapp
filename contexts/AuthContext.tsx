import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AuthContextType, User } from '../types/auth';
import { initializeCompanies } from '../utils/initialData';
import { storage } from '../utils/storage';

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
      // Verificar credenciales del manager
      if (email === 'raul.gomero.c@gmail.com' && password === 'StrongPassword123') {
        const managerUser: User = {
          id: 'manager-001',
          email: email,
          fullName: 'Raul Gomero',
          role: 'manager',
          company: 'SecuApp'
        };
        
        await storage.saveUserSession(managerUser);
        setUser(managerUser);
        return true;
      }
      
      // Para otros usuarios, crear cuenta de empleado
      const employeeUser: User = {
        id: `emp-${Date.now()}`,
        email: email,
        fullName: email.split('@')[0], // Usar parte del email como nombre
        role: 'employee'
      };
      
      await storage.saveUserSession(employeeUser);
      setUser(employeeUser);
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
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
