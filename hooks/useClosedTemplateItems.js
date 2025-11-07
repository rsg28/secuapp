import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para manejar items de templates cerrados
export const useClosedTemplateItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todos los items de templates cerrados
  const getAllItems = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-template-items?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener items de templates cerrados');
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
      const response = await fetch(`${API_BASE_URL}/closed-template-items/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener item de template cerrado');
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

  // Crear item de template cerrado
  const createItem = async (itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-template-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('[createItem] Error parseando respuesta JSON:', parseErr);
        throw new Error(`Error del servidor (HTTP ${response.status})`);
      }
      
      if (!response.ok) {
        // Check for validation errors
        if (data && data.errors && Array.isArray(data.errors)) {
          const validationMessages = data.errors.map((err) => err.msg || err.message).join(', ');
          throw new Error(validationMessages || data.message || 'Error de validación');
        }
        throw new Error(data.message || data.error || `Error al crear item (HTTP ${response.status})`);
      }

      return data.data.item;
    } catch (err) {
      console.error('[createItem] Error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar item de template cerrado
  const updateItem = async (id, itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-template-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar item de template cerrado');
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

  // Eliminar item de template cerrado
  const deleteItem = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-template-items/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar item de template cerrado');
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener todos los items de un template específico por template_id
  const getItemsByTemplateId = async (templateId) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!templateId) {
        throw new Error('El ID del template es requerido');
      }
      
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      const url = `${API_BASE_URL}/closed-template-items/template/${templateId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('[getItemsByTemplateId] JSON parse error:', parseErr?.message);
        throw new Error(`Error al parsear respuesta del servidor (HTTP ${response.status})`);
      }
      
      // Check for authentication errors first
      if (response.status === 401 || response.status === 403) {
        throw new Error('Error de autenticación. Por favor inicia sesión nuevamente.');
      }
      
      if (!response.ok) {
        // Parse error message properly
        let errorMessage = 'Error al obtener items del template';
        
        if (data) {
          if (data.errors) {
            // Handle express-validator errors format - can be array or object
            if (Array.isArray(data.errors)) {
              // Format: [{ field: 'templateId', message: 'ID inválido', value: '...' }]
              errorMessage = data.errors.map(err => err.message || err.msg || String(err)).join(', ');
            } else {
              // Format: { field: ['error1', 'error2'] }
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
        
        throw new Error(errorMessage);
      }

      const items = data?.data?.items || data?.data || [];
      setItems(items);
      return items;
    } catch (err) {
      console.error('[getItemsByTemplateId] ERROR:', err?.message);
      const errorMessage = typeof err.message === 'string' 
        ? err.message 
        : (typeof err === 'string' ? err : 'Error al obtener items del template');
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
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
    getItemsByTemplateId,
    countItemsByTemplateId: async (templateId) => {
      const templateItems = await getItemsByTemplateId(templateId);
      return templateItems.length;
    }
  };
};

// Función auxiliar para obtener el token de autenticación
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token || '';
  } catch (error) {
    return '';
  }
};


