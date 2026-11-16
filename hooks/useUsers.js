import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
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
   * Todos los usuarios (managers + employees). Solo managers.
   * { page, limit, search }
   */
  const getAllUsers = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      const params = new URLSearchParams();
      params.set('page', String(options.page != null ? options.page : 1));
      params.set('limit', String(options.limit != null ? options.limit : 100));
      if (options.search && String(options.search).trim()) {
        params.set('search', String(options.search).trim());
      }

      const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al obtener usuarios');
      }

      setUsers(data.data.users || []);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Usuarios sin rol manager.
   * Sin opciones: todos (comportamiento anterior).
   * Con { page, limit, search }: paginación y/o búsqueda.
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
      const response = await fetch(
        `${API_BASE_URL}/users/non-managers${qs ? `?${qs}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  const updateUser = useCallback(async (userId, updates) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al actualizar usuario');
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getInspectorInspections = async (inspectorId) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/${inspectorId}/inspections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
    getAllUsers,
    getNonManagerUsers,
    updateUser,
    getInspectorInspections,
  };
};
