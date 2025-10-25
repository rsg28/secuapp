import { useState } from 'react';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para manejar items de templates abiertos
export const useOpenTemplateItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todos los items de templates abiertos
  const getAllItems = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-template-items?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener items de templates abiertos');
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
      const response = await fetch(`${API_BASE_URL}/open-template-items/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener item de template abierto');
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

  // Crear item de template abierto
  const createItem = async (itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-template-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        throw new Error('Error al crear item de template abierto');
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

  // Actualizar item de template abierto
  const updateItem = async (id, itemData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-template-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar item de template abierto');
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

  // Eliminar item de template abierto
  const deleteItem = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-template-items/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar item de template abierto');
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
      const response = await fetch(`${API_BASE_URL}/open-template-items/template/${templateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener items del template');
      }

      const data = await response.json();
      setItems(data.data.items || data.data);
      return data.data.items || data.data;
    } catch (err) {
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
  return 'your-jwt-token-here';
};
