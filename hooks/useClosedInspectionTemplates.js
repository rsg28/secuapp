/**
 * Hook para manejar templates de inspecciones cerradas
 * 
 * Este hook proporciona funcionalidades específicas para la gestión de templates
 * de inspecciones cerradas, que son formularios predefinidos con preguntas
 * específicas que los usuarios pueden completar.
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
 * @returns {object} Objeto con funciones y estados para gestión de templates cerrados
 */
import { useState } from 'react';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para manejar templates de inspecciones cerradas
export const useClosedInspectionTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todos los templates cerrados
  const getAllTemplates = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-templates?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener templates cerrados');
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
  };

  // Obtener template por ID
  const getTemplateById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-templates/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener template cerrado');
      }

      const data = await response.json();
      return data.data.template;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Crear template cerrado
  const createTemplate = async (templateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      if (!response.ok) {
        throw new Error('Error al crear template cerrado');
      }

      const data = await response.json();
      return data.data.template;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar template cerrado
  const updateTemplate = async (id, templateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar template cerrado');
      }

      const data = await response.json();
      return data.data.template;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar template cerrado
  const deleteTemplate = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/closed-inspection-templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar template cerrado');
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
    templates,
    loading,
    error,
    getAllTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate
  };
};

// Función auxiliar para obtener el token de autenticación
const getAuthToken = async () => {
  return 'your-jwt-token-here';
};
