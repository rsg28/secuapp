import { useState } from 'react';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para manejar respuestas de inspecciones cerradas
export const useClosedInspectionResponses = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todas las respuestas cerradas
  const getAllResponses = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-responses?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener respuestas cerradas');
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
      const response = await fetch(`${API_BASE_URL}/closed-inspection-responses/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener respuesta cerrada');
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

  // Crear respuesta cerrada
  const createResponse = async (responseData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean undefined values before stringify
      const cleanData = Object.keys(responseData).reduce((acc, key) => {
        acc[key] = responseData[key] === undefined ? null : responseData[key];
        return acc;
      }, {});
      
      console.log('[useClosedInspectionResponses.createResponse] Original:', responseData);
      console.log('[useClosedInspectionResponses.createResponse] Cleaned:', cleanData);
      console.log('[useClosedInspectionResponses.createResponse] JSON string:', JSON.stringify(cleanData));
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });

      const data = await response.json();

      if (!response.ok) {
        // Parse error messages from validation
        let errorMessage = 'Error al crear respuesta cerrada';
        
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
        : (typeof err === 'string' ? err : 'Error al crear respuesta cerrada');
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar respuesta cerrada
  const updateResponse = async (id, responseData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean undefined values before stringify
      const cleanData = Object.keys(responseData).reduce((acc, key) => {
        acc[key] = responseData[key] === undefined ? null : responseData[key];
        return acc;
      }, {});
      
      console.log('[useClosedInspectionResponses.updateResponse] Original:', responseData);
      console.log('[useClosedInspectionResponses.updateResponse] Cleaned:', cleanData);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-responses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = 'Error al actualizar respuesta cerrada';
        try {
          const errorData = await response.json();
          console.log('[useClosedInspectionResponses.updateResponse] Error response:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          
          if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
            // Format validation errors
            const errorMessages = errorData.errors.map(err => `${err.field}: ${err.message}`).join(', ');
            errorMessage = `Errores de validación: ${errorMessages}`;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.error('[useClosedInspectionResponses.updateResponse] Error parsing error response:', e);
          // If response is not JSON, use default message
          if (response.status === 404) {
            errorMessage = 'Respuesta no encontrada';
          } else if (response.status === 400) {
            errorMessage = 'Datos inválidos';
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = 'Error de autenticación';
          }
        }
        throw new Error(errorMessage);
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

  // Eliminar respuesta cerrada
  const deleteResponse = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-responses/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar respuesta cerrada');
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
      const response = await fetch(`${API_BASE_URL}/closed-inspection-responses/user/${userId}?page=${page}&limit=${limit}`, {
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

  return {
    responses,
    loading,
    error,
    getAllResponses,
    getResponseById,
    createResponse,
    updateResponse,
    deleteResponse,
    getResponsesByInspectorId
  };
};

// Función auxiliar para obtener el token de autenticación
const getAuthToken = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const token = await AsyncStorage.getItem('authToken');
  return token || '';
};
