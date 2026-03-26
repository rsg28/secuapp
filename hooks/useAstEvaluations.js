import { useState } from 'react';
import { offlineQueue } from '../utils/offlineQueue';
import { offlineCache } from '../utils/offlineCache';
import { getIsOffline } from '../utils/networkStore';
import { storage } from '../utils/storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getAuthToken = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const token = await AsyncStorage.getItem('authToken');
  return token || '';
};

export const useAstEvaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getByInspectorId = async (userId, page = 1, limit = 100) => {
    try {
      setLoading(true);
      setError(null);

      if (getIsOffline()) {
        const cached = await offlineCache.getWithExpiry(`ast-evaluations-user-${userId}`, 60);
        const offlineItems = (await storage.loadOfflineItems()).filter((i) => i.type === 'ast');
        const merged = [...offlineItems.map((o) => ({ ...o, _offline: true })), ...(cached?.data?.evaluations || [])];
        setEvaluations(merged);
        return { data: { evaluations: merged, pagination: { total: merged.length } } };
      }

      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/ast-evaluations/user/${userId}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Error al obtener evaluaciones AST');
      await offlineCache.set(`ast-evaluations-user-${userId}`, data);
      const offlineItems = (await storage.loadOfflineItems()).filter((i) => i.type === 'ast');
      const merged = [...offlineItems.map((o) => ({ ...o, _offline: true })), ...(data.data.evaluations || [])];
      setEvaluations(merged);
      return { data: { ...data.data, evaluations: merged } };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/ast-evaluations/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al obtener evaluación AST');
      const data = await response.json();
      return data.data.evaluation;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const create = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      if (getIsOffline()) {
        const localId = generateLocalId();
        const session = await storage.getUserSession();
        const inspectorId = session?.id || payload.inspector_id || payload.inspectorId;
        await offlineQueue.add({
          id: localId,
          type: 'ast_evaluation',
          payload: { ...payload, inspector_id: inspectorId, company_id: payload.company_id || payload.companyId },
        });
        await storage.addOfflineItem({
          id: localId,
          type: 'ast',
          razon_social: payload.razon_social || payload.razonSocial,
          area: payload.area,
          fecha: payload.fecha,
          created_at: new Date().toISOString(),
        });
        return {
          id: localId,
          ...payload,
          _offline: true,
        };
      }

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/ast-evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear evaluación AST');
      }
      return data.data.evaluation;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id, payload) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/ast-evaluations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar evaluación AST');
      }
      return data.data.evaluation;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvaluation = async (id) => {
    try {
      setLoading(true);
      setError(null);
      if (id && id.startsWith('local-')) {
        await offlineQueue.remove(id);
        await storage.removeOfflineItem(id);
        return true;
      }
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/ast-evaluations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al eliminar evaluación AST');
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    evaluations,
    loading,
    error,
    getByInspectorId,
    getById,
    create,
    update,
    deleteEvaluation,
  };
};
