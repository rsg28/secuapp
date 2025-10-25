/**
 * Hook para manejar servicios (services)
 * 
 * Este hook proporciona funcionalidades específicas para la gestión de servicios
 * disponibles en la aplicación, como "Inspecciones Cerradas" e "Inspecciones Abiertas".
 * 
 * Funciones incluidas:
 * - getAllServices: Obtener todos los servicios con paginación
 * - getServiceById: Obtener servicio específico por ID
 * - createService: Crear nuevo servicio (requiere name, description)
 * - updateService: Actualizar servicio existente
 * - deleteService: Eliminar servicio
 * 
 * Columnas válidas: id, name, description, icon, color, is_active, created_at
 * 
 * @returns {object} Objeto con funciones y estados para gestión de servicios
 */
import { useState } from 'react';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

// Hook para manejar servicios
export const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todos los servicios
  const getAllServices = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/services?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener servicios');
      }

      const data = await response.json();
      setServices(data.data.services);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obtener servicio por ID
  const getServiceById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener servicio');
      }

      const data = await response.json();
      return data.data.service;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Crear servicio
  const createService = async (serviceData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(serviceData)
      });

      if (!response.ok) {
        throw new Error('Error al crear servicio');
      }

      const data = await response.json();
      return data.data.service;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar servicio
  const updateService = async (id, serviceData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(serviceData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar servicio');
      }

      const data = await response.json();
      return data.data.service;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar servicio
  const deleteService = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar servicio');
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
    services,
    loading,
    error,
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
  };
};

// Función auxiliar para obtener el token de autenticación
const getAuthToken = async () => {
  return 'your-jwt-token-here';
};
