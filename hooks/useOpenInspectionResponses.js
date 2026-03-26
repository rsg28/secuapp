import { useState } from 'react';
import { validateColumns } from './utils/tableColumns';
import { offlineCache } from '../utils/offlineCache';
import { getIsOffline } from '../utils/networkStore';
import { offlineQueue } from '../utils/offlineQueue';
import { storage } from '../utils/storage';
import { isNetworkFailure } from '../utils/networkErrors';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';
const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

      if (id && id.startsWith('local-')) {
        const payload = await storage.getOfflineInspectionPayload(id);
        if (payload && payload.response) {
          return { ...payload.response, id, _offline: true };
        }
        throw new Error('Inspección local no encontrada');
      }

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

  // Crear respuesta abierta (options.items = ítems para guardado local si falla la red)
  const createResponse = async (responseData, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const validatedData = validateColumns('open_inspection_responses', responseData);
      const items = options.items || [];

      const persistOffline = async () => {
        const localId = generateLocalId();
        const session = await storage.getUserSession();
        const inspectorId = session?.id;
        const payload = {
          response: { ...validatedData, inspector_id: inspectorId },
          items: items.map((it) => ({ ...it, response_id: localId }))
        };
        await offlineQueue.add({
          id: localId,
          type: 'open_inspection',
          payload
        });
        const now = new Date().toISOString();
        await storage.addOfflineItem({
          id: localId,
          type: 'open_inspection',
          category: 'abierto',
          title: validatedData.title || 'Sin título',
          template_id: validatedData.template_id,
          created_at: now,
          totalQuestions: items.length,
          answeredQuestions: items.length,
          _offline: true
        });
        await storage.saveOfflineInspectionPayload(localId, payload);
        return {
          id: localId,
          ...validatedData,
          created_at: now,
          _offline: true
        };
      };

      if (getIsOffline()) {
        return await persistOffline();
      }

      try {
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
          let errorMessage = 'Error al crear respuesta abierta';
          if (data.errors) {
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
      } catch (fetchErr) {
        if (isNetworkFailure(fetchErr)) {
          return await persistOffline();
        }
        throw fetchErr;
      }
    } catch (err) {
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
  const updateResponse = async (id, responseData, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      if (id && id.startsWith('local-')) {
        const validatedData = validateColumns('open_inspection_responses', responseData);
        const items = options.items || [];
        const payload = {
          response: validatedData,
          items: items.map((it) => ({ ...it, response_id: id }))
        };
        await storage.saveOfflineInspectionPayload(id, payload);
        await offlineQueue.updatePayload(id, payload);
        const existing = await storage.loadOfflineItems();
        const item = existing.find((i) => i.id === id);
        if (item) {
          item.title = validatedData.title || item.title;
          item.totalQuestions = items.length;
          item.answeredQuestions = items.length;
          await storage.saveOfflineItems(existing);
        }
        return { id, ...validatedData, _offline: true };
      }

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

      if (id && id.startsWith('local-')) {
        await offlineQueue.remove(id);
        await storage.removeOfflineItem(id);
        await storage.removeOfflineInspectionPayload(id);
        return true;
      }

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

      const offlineItems = (await storage.loadOfflineItems()).filter((i) => i.type === 'open_inspection');

      if (getIsOffline()) {
        const cached = await offlineCache.getWithExpiry(`open-responses-user-${userId}`, 60);
        const serverResponses = cached?.data?.responses || [];
        const merged = [...offlineItems.map((o) => ({ ...o, _offline: true })), ...serverResponses];
        setResponses(merged);
        return { data: { responses: merged } };
      }

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/open-inspection-responses/user/${userId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener respuestas del inspector');
      }
      await offlineCache.set(`open-responses-user-${userId}`, data);
      const serverResponses = data.data.responses || [];
      const merged = [...offlineItems.map((o) => ({ ...o, _offline: true })), ...serverResponses];
      setResponses(merged);
      return { data: { ...data.data, responses: merged } };
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
