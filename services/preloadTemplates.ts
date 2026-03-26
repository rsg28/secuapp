import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../utils/storage';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

async function getAuthToken(): Promise<string> {
  const token = await AsyncStorage.getItem('authToken');
  return token || '';
}

/**
 * Pre-carga templates de inspecciones cerradas y abiertas del usuario,
 * y los ítems de cada template, guardándolos en local storage para uso offline.
 * Llamar tras login o al iniciar la app si hay sesión (con red).
 */
export async function preloadInspectionTemplates(userId: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) return;

  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 1) Templates cerrados del usuario
    const closedRes = await fetch(
      `${API_BASE_URL}/closed-inspection-templates/user/${userId}?page=1&limit=100`,
      { method: 'GET', headers }
    );
    if (!closedRes.ok) throw new Error(`Closed templates: ${closedRes.status}`);
    const closedData = await closedRes.json();
    const closedTemplates = closedData?.data?.templates ?? [];
    await storage.saveClosedTemplatesForUser(userId, closedTemplates);

    // 2) Ítems de cada template cerrado
    for (const t of closedTemplates) {
      const tid = t.id;
      if (!tid) continue;
      try {
        const itemsRes = await fetch(
          `${API_BASE_URL}/closed-template-items/template/${tid}`,
          { method: 'GET', headers }
        );
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          const items = itemsData?.data?.items ?? itemsData?.data ?? [];
          await storage.saveClosedTemplateItems(tid, Array.isArray(items) ? items : []);
        }
      } catch (e) {
        console.warn('[preloadTemplates] Closed template items for', tid, e);
      }
    }

    // 3) Templates abiertos del usuario
    const openRes = await fetch(
      `${API_BASE_URL}/open-inspection-templates/user/${userId}?page=1&limit=100`,
      { method: 'GET', headers }
    );
    if (!openRes.ok) throw new Error(`Open templates: ${openRes.status}`);
    const openData = await openRes.json();
    const openTemplates = openData?.data?.templates ?? [];
    await storage.saveOpenTemplatesForUser(userId, openTemplates);

    // 4) Ítems de cada template abierto
    for (const t of openTemplates) {
      const tid = t.id;
      if (!tid) continue;
      try {
        const itemsRes = await fetch(
          `${API_BASE_URL}/open-template-items/template/${tid}`,
          { method: 'GET', headers }
        );
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          const items = itemsData?.data?.items ?? itemsData?.data ?? [];
          await storage.saveOpenTemplateItems(tid, Array.isArray(items) ? items : []);
        }
      } catch (e) {
        console.warn('[preloadTemplates] Open template items for', tid, e);
      }
    }
  } catch (error) {
    console.error('[preloadTemplates] Error:', error);
  }
}
