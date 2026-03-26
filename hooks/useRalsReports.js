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

export const useRalsReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getByInspectorId = async (userId, page = 1, limit = 100) => {
    try {
      setLoading(true);
      setError(null);

      if (getIsOffline()) {
        const cached = await offlineCache.getWithExpiry(`rals-reports-user-${userId}`, 60);
        const offlineItems = (await storage.loadOfflineItems()).filter((i) => i.type === 'rals');
        const merged = [...offlineItems.map((o) => ({ ...o, _offline: true })), ...(cached?.data?.reports || [])];
        setReports(merged);
        return { data: { reports: merged, pagination: { total: merged.length } } };
      }

      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/rals-reports/user/${userId}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Error al obtener reportes RALS');
      await offlineCache.set(`rals-reports-user-${userId}`, data);
      const offlineItems = (await storage.loadOfflineItems()).filter((i) => i.type === 'rals');
      const merged = [...offlineItems.map((o) => ({ ...o, _offline: true })), ...(data.data.reports || [])];
      setReports(merged);
      return { data: { ...data.data, reports: merged } };
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
      const response = await fetch(`${API_BASE_URL}/rals-reports/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al obtener reporte RALS');
      const data = await response.json();
      return data.data.report;
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
          type: 'rals_report',
          payload: { ...payload, inspector_id: inspectorId, company_id: payload.company_id || payload.companyId },
        });
        await storage.addOfflineItem({
          id: localId,
          type: 'rals',
          nombre: payload.nombre,
          fecha: payload.fecha,
          empresa: payload.empresa,
          created_at: new Date().toISOString(),
        });
        return {
          id: localId,
          ...payload,
          _offline: true,
        };
      }

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/rals-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear reporte RALS');
      }
      return data.data.report;
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
      const response = await fetch(`${API_BASE_URL}/rals-reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar reporte RALS');
      }
      return data.data.report;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id) => {
    try {
      setLoading(true);
      setError(null);
      if (id && id.startsWith('local-')) {
        await offlineQueue.remove(id);
        await storage.removeOfflineItem(id);
        return true;
      }
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/rals-reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Error al eliminar reporte RALS');
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    reports,
    loading,
    error,
    getByInspectorId,
    getById,
    create,
    update,
    deleteReport,
  };
};
