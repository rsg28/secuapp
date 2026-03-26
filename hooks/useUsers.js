import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Usuarios sin rol manager.
   * Sin opciones: todos (comportamiento anterior).
   * Con { page, limit, search }: paginación y/o búsqueda (search solo cuando envías el término).
   */
  const getNonManagerUsers = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      const params = new URLSearchParams();
      if (options.page != null) params.set('page', String(options.page));
      if (options.limit != null) params.set('limit', String(options.limit));
      if (options.search && String(options.search).trim()) {
        params.set('search', String(options.search).trim());
      }
      const qs = params.toString();
      const response = await fetch(`${API_BASE_URL}/users/non-managers${qs ? `?${qs}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }

      const data = await response.json();
      setUsers(data.data.users || []);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener todas las inspecciones de un inspector
  const getInspectorInspections = async (inspectorId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/${inspectorId}/inspections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener inspecciones del inspector');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    getNonManagerUsers,
    getInspectorInspections
  };
};
