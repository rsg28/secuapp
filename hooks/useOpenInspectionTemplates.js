/**
 * Hook para manejar templates de inspecciones abiertas
 * 
 * Este hook proporciona funcionalidades específicas para la gestión de templates
 * de inspecciones abiertas, que son formularios más flexibles donde los usuarios
 * pueden agregar preguntas personalizadas durante la inspección.
 * 
 * Funciones incluidas:
 * - getAllTemplates: Obtener todos los templates con paginación
 * - getTemplateById: Obtener template específico por ID
 * - createTemplate: Crear nuevo template (requiere title, description, created_by)
 * - updateTemplate: Actualizar template existente
 * - deleteTemplate: Eliminar template
 * 
 * Columnas válidas: id, title, description, created_by, created_at, updated_at
 * 
 * @returns {object} Objeto con funciones y estados para gestión de templates abiertos
 */
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para manejar templates de inspecciones abiertas
export const useOpenInspectionTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAllTemplates = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-templates?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener templates abiertos');
      }

      const data = await response.json();
      setTemplates(data.data.templates);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemplateById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-templates/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener template abierto');
      }

      const data = await response.json();
      return data.data.template;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (templateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('[createTemplate] Error parseando respuesta JSON:', parseErr);
        throw new Error(`Error del servidor (HTTP ${response.status})`);
      }
      
      if (!response.ok) {
        if (data && data.errors && Array.isArray(data.errors)) {
          const validationMessages = data.errors.map((err) => err.msg || err.message).join(', ');
          throw new Error(validationMessages || data.message || 'Error de validación');
        }
        throw new Error(data.message || data.error || `Error al crear template (HTTP ${response.status})`);
      }

      return data.data.template;
    } catch (err) {
      console.error('[createTemplate] Error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (id, templateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar template abierto');
      }

      const data = await response.json();
      return data.data.template;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar template abierto');
      }

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTemplatesByUserId = useCallback(async (userId, page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-templates/user/${userId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[getTemplatesByUserId] JSON parse error:', parseError?.message);
      }

      if (!response.ok) {
        const serverMessage = data?.message || data?.error || data?.errors?.[0]?.msg;
        const message = serverMessage
          ? `${serverMessage} (HTTP ${response.status})`
          : `Error al obtener templates abiertos por usuario (HTTP ${response.status})`;
        console.error('[getTemplatesByUserId] Server response:', data);
        throw new Error(message);
      }

      if (data && Array.isArray(data?.data?.templates)) {
        setTemplates(data.data.templates);
      } else {
        setTemplates([]);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    templates,
    loading,
    error,
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByUserId
  };
};

// Función auxiliar para obtener el token de autenticación
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return token;
};
