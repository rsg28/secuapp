/**
 * Hook para manejar autenticación de usuarios
 * 
 * Este hook proporciona todas las funcionalidades relacionadas con la autenticación
 * de usuarios, incluyendo registro, login, gestión de perfil y manejo de tokens JWT.
 * 
 * Funciones incluidas:
 * - register: Registrar nuevo usuario
 * - login: Iniciar sesión con email y password
 * - getProfile: Obtener perfil del usuario autenticado
 * - updateProfile: Actualizar información del perfil
 * - changePassword: Cambiar contraseña del usuario
 * - logout: Cerrar sesión y limpiar tokens
 * - isAuthenticated: Verificar si el usuario está autenticado
 * 
 * Estados: user, loading, error
 * 
 * @returns {object} Objeto con funciones de autenticación y estados del usuario
 */
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para manejar autenticación
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Registrar usuario
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar usuario');
      }

      const data = await response.json();
      
      setUser(data.data.user);
      
      // Guardar token en AsyncStorage
      await saveToken(data.data.token);
      
      return data.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciales inválidas');
      }

      const data = await response.json();
      
      setUser(data.data.user);
      
      // Guardar token en AsyncStorage
      await saveToken(data.data.token);
      
      return data.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener perfil del usuario
  const getProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener perfil');
      }

      const data = await response.json();
      
      setUser(data.data.user);
      return data.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar perfil');
      }

      const data = await response.json();
      setUser(data.data.user);
      return data.data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Error al cambiar contraseña');
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      await removeToken();
      setUser(null);
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = async () => {
    try {
      const token = await getToken();
      if (!token) return false;
      
      // Verificar si el token es válido haciendo una llamada al perfil
      await getProfile();
      return true;
    } catch (err) {
      return false;
    }
  };

  return {
    user,
    loading,
    error,
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    logout,
    isAuthenticated
  };
};

// Funciones auxiliares para manejar el token con AsyncStorage
const saveToken = async (token) => {
  await AsyncStorage.setItem('authToken', token);
};

const getToken = async () => {
  return await AsyncStorage.getItem('authToken');
};

const removeToken = async () => {
  await AsyncStorage.removeItem('authToken');
};
