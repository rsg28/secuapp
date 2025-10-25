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

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook base reutilizable para operaciones CRUD
export const useCRUD = (endpoint) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función auxiliar para obtener el token de autenticación
  const getAuthToken = async () => {
    // Aquí deberías obtener el token desde AsyncStorage o tu sistema de autenticación
    return 'your-jwt-token-here';
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
    
    return fetch(url, { ...defaultOptions, ...options });
  };

  // Obtener todos los elementos
  const getAll = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await makeRequest(`${API_BASE_URL}/${endpoint}?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener ${endpoint}`);
      }

      const result = await response.json();
      setData(result.data[endpoint] || result.data.items || result.data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
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
      
      const response = await makeRequest(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(itemData)
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
