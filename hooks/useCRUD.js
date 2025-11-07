/**
 * Hook base reutilizable para operaciones CRUD
 * 
 * Este hook proporciona funcionalidades básicas de Create, Read, Update, Delete
 * para cualquier endpoint de la API. Incluye manejo de estados (loading, error, data),
 * autenticación automática con tokens JWT, y funciones helper para hacer requests HTTP.
 * 
 * Funciones incluidas:
 * - getAll: Obtener todos los elementos con paginación
 * - getById: Obtener elemento por ID
 * - create: Crear nuevo elemento
 * - update: Actualizar elemento existente
 * - remove: Eliminar elemento
 * 
 * @param {string} endpoint - Nombre del endpoint de la API (ej: 'companies', 'users')
 * @returns {object} Objeto con funciones CRUD y estados
 */
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook base reutilizable para operaciones CRUD
export const useCRUD = (endpoint) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función auxiliar para obtener el token de autenticación
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  };

  // Función auxiliar para hacer requests
  const makeRequest = async (url, options = {}) => {
    const token = await getAuthToken();
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log(`[makeRequest] ${endpoint} - URL:`, url);
    console.log(`[makeRequest] ${endpoint} - Token exists:`, !!token);
    console.log(`[makeRequest] ${endpoint} - Token length:`, token?.length || 0);
    
    return fetch(url, { ...defaultOptions, ...options });
  };

  // Obtener todos los elementos
  const getAll = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      const response = await makeRequest(`${API_BASE_URL}/${endpoint}?page=${page}&limit=${limit}`);
      
      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error(`[getAll] Error parseando respuesta JSON:`, parseErr);
        throw new Error(`Error del servidor (HTTP ${response.status})`);
      }
      
      if (!response.ok) {
        // Parse error messages properly
        let errorMessage = `Error al obtener ${endpoint}`;
        
        if (data) {
          if (data.errors) {
            // Handle express-validator errors format
            if (Array.isArray(data.errors)) {
              errorMessage = data.errors.map(err => err.message || err.msg || String(err)).join(', ');
            } else {
              const errorArray = Object.values(data.errors).flat();
              errorMessage = errorArray.map(err => {
                if (typeof err === 'string') return err;
                if (err.msg) return err.msg;
                if (err.message) return err.message;
                return String(err);
              }).join(', ');
            }
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.error) {
            errorMessage = data.error;
          }
        }
        
        // Check for authentication errors
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Error de autenticación. Por favor inicia sesión nuevamente.';
        }
        
        throw new Error(errorMessage);
      }

      setData(data.data[endpoint] || data.data.items || data.data);
      return data;
    } catch (err) {
      const errorMessage = typeof err.message === 'string' 
        ? err.message 
        : (typeof err === 'string' ? err : `Error al obtener ${endpoint}`);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Obtener elemento por ID
  const getById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeRequest(`${API_BASE_URL}/${endpoint}/${id}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener ${endpoint}`);
      }

      const result = await response.json();
      return result.data[endpoint.slice(0, -1)] || result.data.item || result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Crear elemento
  const create = async (itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean undefined values before stringify
      const cleanData = Object.keys(itemData).reduce((acc, key) => {
        acc[key] = itemData[key] === undefined ? null : itemData[key];
        return acc;
      }, {});
      
      console.log(`[useCRUD.create] ${endpoint} - Original:`, itemData);
      console.log(`[useCRUD.create] ${endpoint} - Cleaned:`, cleanData);
      console.log(`[useCRUD.create] ${endpoint} - JSON string:`, JSON.stringify(cleanData));
      
      const response = await makeRequest(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        throw new Error(`Error al crear ${endpoint}`);
      }

      const result = await response.json();
      return result.data[endpoint.slice(0, -1)] || result.data.item || result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar elemento
  const update = async (id, itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeRequest(`${API_BASE_URL}/${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar ${endpoint}`);
      }

      const result = await response.json();
      return result.data[endpoint.slice(0, -1)] || result.data.item || result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar elemento
  const remove = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeRequest(`${API_BASE_URL}/${endpoint}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar ${endpoint}`);
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    remove
  };
};
