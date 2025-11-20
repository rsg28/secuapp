import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

/**
 * Hook para manejar el equipo de inspección
 * 
 * Válidas columnas para teamData:
 * - response_id (requerido para crear)
 * - cargo
 * - empresa
 * - nombre
 * - firma_url
 * - sort_order
 */
export const useInspectionTeam = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función auxiliar para obtener el token
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token || '';
    } catch (error) {
      return '';
    }
  };

  // GET - Obtener todos los miembros del equipo
  const getAllTeamMembers = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/inspection-team?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener miembros del equipo');
      }

      const data = await response.json();
      setTeamMembers(data.data.members);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // GET - Obtener miembro por ID
  const getTeamMemberById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/inspection-team/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener miembro del equipo');
      }

      const data = await response.json();
      return data.data.member;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // GET - Obtener miembros por response ID
  const getTeamMembersByResponseId = async (responseId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/inspection-team/response/${responseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener miembros del equipo');
      }

      const data = await response.json();
      setTeamMembers(data.data.members);
      return data.data.members;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // POST - Crear miembro del equipo
  const createTeamMember = async (teamData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/inspection-team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teamData)
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseErr) {
        throw new Error(`Error del servidor (HTTP ${response.status})`);
      }
      
      if (!response.ok) {
        if (data && data.errors && Array.isArray(data.errors)) {
          const validationMessages = data.errors.map((err) => err.msg || err.message).join(', ');
          throw new Error(validationMessages || data.message || 'Error de validación');
        }
        throw new Error(data.message || data.error || `Error al crear miembro (HTTP ${response.status})`);
      }

      return data.data.member;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // PUT - Actualizar miembro del equipo
  const updateTeamMember = async (id, teamData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/inspection-team/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teamData)
      });

      if (!response.ok) {
        throw new Error('Error al actualizar miembro del equipo');
      }

      const data = await response.json();
      return data.data.member;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // DELETE - Eliminar miembro del equipo
  const deleteTeamMember = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/inspection-team/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar miembro del equipo');
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
    teamMembers,
    loading,
    error,
    getAllTeamMembers,
    getTeamMemberById,
    getTeamMembersByResponseId,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember
  };
};

