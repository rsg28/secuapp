import { useState } from 'react';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para manejar items de respuestas cerradas
export const useClosedInspectionResponseItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todos los items de respuestas cerradas
  const getAllItems = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-response-items?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener items de respuestas cerradas');
      }

      const data = await response.json();
      setItems(data.data.items);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener item por ID
  const getItemById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-response-items/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener item de respuesta cerrada');
      }

      const data = await response.json();
      return data.data.item;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Crear item de respuesta cerrada
  const createItem = async (itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean undefined values before stringify
      const cleanData = Object.keys(itemData).reduce((acc, key) => {
        acc[key] = itemData[key] === undefined ? null : itemData[key];
        return acc;
      }, {});
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-response-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        throw new Error('Error al crear item de respuesta cerrada');
      }

      const data = await response.json();
      return data.data.item;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar item de respuesta cerrada
  const updateItem = async (id, itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean undefined values before stringify
      const cleanData = Object.keys(itemData).reduce((acc, key) => {
        acc[key] = itemData[key] === undefined ? null : itemData[key];
        return acc;
      }, {});
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-response-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = 'Error al actualizar item de respuesta cerrada';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, use default message
          if (response.status === 404) {
            errorMessage = 'Item no encontrado';
          } else if (response.status === 400) {
            errorMessage = 'Datos inválidos';
          } else if (response.status === 401 || response.status === 403) {
            errorMessage = 'Error de autenticación';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.data.item;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar item de respuesta cerrada
  const deleteItem = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-response-items/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar item de respuesta cerrada');
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener items por response_id
  const getItemsByResponseId = async (responseId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-response-items/response/${responseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMessage = 'Error al obtener items de respuesta';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Si no se puede parsear el error, usar el mensaje por defecto
        }
        
        // Si es 404 o 400, retornar array vacío en lugar de lanzar error
        if (response.status === 404 || response.status === 400) {
          console.warn(`No se encontraron items para responseId: ${responseId}`);
          return [];
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const items = data.data?.items || [];
      setItems(items);
      return items;
    } catch (err) {
      console.error('Error en getItemsByResponseId:', err);
      setError(err.message);
      // Si es un error de red o similar, retornar array vacío para evitar bloquear la UI
      if (err.message.includes('Network') || err.message.includes('Failed to fetch')) {
        return [];
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const countItemsByResponseId = async (responseId) => {
    const responseItems = await getItemsByResponseId(responseId);
    return responseItems.length;
  };

  return {
    items,
    loading,
    error,
    getAllItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
    getItemsByResponseId,
    countItemsByResponseId
  };
};

// Función auxiliar para obtener el token de autenticación
const getAuthToken = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const token = await AsyncStorage.getItem('authToken');
  return token || '';
};
