import { useState } from 'react';
import { validateColumns } from './utils/tableColumns';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para manejar respuestas de inspecciones abiertas
export const useOpenInspectionResponses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todas las respuestas abiertas
  const getAllResponses = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-responses?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener respuestas abiertas');
      }

      const data = await response.json();
      setResponses(data.data.responses);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener respuesta por ID
  const getResponseById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-responses/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener respuesta abierta');
      }

      const data = await response.json();
      return data.data.response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Crear respuesta abierta
  const createResponse = async (responseData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate and clean data using tableColumns
      const validatedData = validateColumns('open_inspection_responses', responseData);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(validatedData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Parse error messages from validation
        let errorMessage = 'Error al crear respuesta abierta';
        
        if (data.errors) {
          // Handle express-validator errors format
          const errorArray = Object.values(data.errors).flat();
          errorMessage = errorArray.map(err => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            return JSON.stringify(err);
          }).join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        throw new Error(errorMessage);
      }

      return data.data.response;
    } catch (err) {
      // Ensure we always have a string error message
      const errorMessage = typeof err.message === 'string' 
        ? err.message 
        : (typeof err === 'string' ? err : 'Error al crear respuesta abierta');
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar respuesta abierta
  const updateResponse = async (id, responseData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate and clean data using tableColumns
      const validatedData = validateColumns('open_inspection_responses', responseData);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-responses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(validatedData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar respuesta abierta');
      }

      const data = await response.json();
      return data.data.response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar respuesta abierta
  const deleteResponse = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-responses/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar respuesta abierta');
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener respuestas por inspector_id
  const getResponsesByInspectorId = async (userId, page = 1, limit = 100) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-responses/user/${userId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener respuestas del inspector');
      }

      const data = await response.json();
      setResponses(data.data.responses);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const countResponsesByInspectorId = async (userId) => {
    try {
      const data = await getResponsesByInspectorId(userId, 1, 100);
      return data?.data?.responses?.length || 0;
    } catch {
      return 0;
    }
  };

  return {
    responses,
    loading,
    error,
    getAllResponses,
    getResponseById,
    createResponse,
    updateResponse,
    deleteResponse,
    getResponsesByInspectorId,
    countResponsesByInspectorId
  };
};

// Función auxiliar para obtener el token de autenticación
const getAuthToken = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const token = await AsyncStorage.getItem('authToken');
  return token || '';
};
