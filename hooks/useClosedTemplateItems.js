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
      
      const token = await getAuthToken();
      const url = `${API_BASE_URL}/closed-template-items/template/${templateId}`;
      console.log('[getItemsByTemplateId] URL:', url);
      console.log('[getItemsByTemplateId] templateId:', templateId);
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
        console.log('[getItemsByTemplateId] JSON parse error:', parseErr?.message);
      }
      console.log('[getItemsByTemplateId] status:', response.status, response.statusText);
      console.log('[getItemsByTemplateId] response body:', data);
      
      if (!response.ok) {
        const serverMessage = (data && (data.message || data.error)) ? (data.message || data.error) : 'Error al obtener items del template';
        throw new Error(`${serverMessage} (HTTP ${response.status})`);
      }

      const items = data?.data?.items || data?.data || [];
      setItems(items);
      return items;
    } catch (err) {
      console.log('[getItemsByTemplateId] ERROR:', err?.message);
      setError(err.message);
      throw err;
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
    getItemsByTemplateId
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


