import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { getAuthToken } from '../utils/offlineFetch';
import { getIsOffline } from '../utils/networkStore';
import { offlineQueue, PendingOperation } from '../utils/offlineQueue';
import { processOfflineQueue } from './offlineSync';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

export type VisitStatus = 'programada' | 'en_curso' | 'completada' | 'cancelada';

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  programada: 'Programada',
  en_curso: 'En curso',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

export const VISIT_STATUS_COLORS: Record<VisitStatus, { bg: string; fg: string }> = {
  programada: { bg: '#dbeafe', fg: '#1e40af' },
  en_curso: { bg: '#fef3c7', fg: '#92400e' },
  completada: { bg: '#dcfce7', fg: '#166534' },
  cancelada: { bg: '#f3f4f6', fg: '#6b7280' },
};

export interface Visit {
  id: string;
  company_id: string;
  company_name?: string | null;
  company_address?: string | null;
  inspector_id: string;
  inspector_name?: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  purpose: string;
  notes: string | null;
  status: VisitStatus;
  check_in_at: string | null;
  check_in_lat: number | string | null;
  check_in_lng: number | string | null;
  check_in_accuracy: number | string | null;
  check_out_at: string | null;
  check_out_lat: number | string | null;
  check_out_lng: number | string | null;
  check_out_accuracy: number | string | null;
  findings: string | null;
  recommendations: string | null;
  responsible_name: string | null;
  responsible_position: string | null;
  responsible_signature?: string | null;
  cancel_reason: string | null;
  created_at?: string;
  updated_at?: string;
  /** Hay cambios guardados en el teléfono que todavía no llegan al servidor. */
  _pending?: boolean;
}

/** Campos que acepta el backend en PUT /visits/:id. */
export type VisitPatch = Partial<
  Pick<
    Visit,
    | 'company_id'
    | 'inspector_id'
    | 'scheduled_date'
    | 'scheduled_time'
    | 'purpose'
    | 'notes'
    | 'status'
    | 'check_in_at'
    | 'check_in_lat'
    | 'check_in_lng'
    | 'check_in_accuracy'
    | 'check_out_at'
    | 'check_out_lat'
    | 'check_out_lng'
    | 'check_out_accuracy'
    | 'findings'
    | 'recommendations'
    | 'responsible_name'
    | 'responsible_position'
    | 'responsible_signature'
    | 'cancel_reason'
  >
>;

/** Datos solo para mostrar (nombre de empresa/inspector) que no se envían al servidor. */
export type VisitDisplayFields = Partial<
  Pick<Visit, 'company_name' | 'company_address' | 'inspector_name'>
>;

const cacheKey = (userId: string) => `visits_cache_${userId}`;

const isVisitOp = (op: PendingOperation) => op.type === 'visit_upsert' || op.type === 'delete_visit';

export const newVisitId = () => Crypto.randomUUID();

async function loadCache(userId: string): Promise<Visit[]> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveCache(userId: string, visits: Visit[]): Promise<void> {
  await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(visits));
}

async function getPendingVisitOps(): Promise<PendingOperation[]> {
  return (await offlineQueue.getQueue()).filter(isVisitOp);
}

/** Reaplica sobre los datos del servidor los cambios locales que aún no se sincronizan. */
function applyPending(base: Visit[], ops: PendingOperation[], localCache: Visit[]): Visit[] {
  const byId = new Map(base.map((v) => [v.id, { ...v, _pending: false }]));
  for (const op of ops) {
    const id = op.payload.visit_id as string;
    if (op.type === 'delete_visit') {
      byId.delete(id);
      continue;
    }
    const current = byId.get(id) ?? localCache.find((v) => v.id === id);
    if (!current) continue;
    byId.set(id, { ...current, ...op.payload.patch, _pending: true });
  }
  return Array.from(byId.values());
}

export function sortVisits(visits: Visit[]): Visit[] {
  return [...visits].sort((a, b) => {
    const ka = `${a.scheduled_date} ${a.scheduled_time ?? '99:99'}`;
    const kb = `${b.scheduled_date} ${b.scheduled_time ?? '99:99'}`;
    return ka.localeCompare(kb);
  });
}

async function authHeaders() {
  const token = await getAuthToken();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

/** Copia guardada en el teléfono, para mostrar la agenda al instante mientras se consulta el servidor. */
export async function getCachedVisits(userId: string): Promise<Visit[]> {
  return sortVisits(await loadCache(userId));
}

/**
 * Lista las visitas visibles para el usuario (las propias, o todas si es manager).
 * Sin conexión devuelve la copia guardada en el teléfono.
 */
export async function listVisits(userId: string): Promise<{ visits: Visit[]; fromCache: boolean }> {
  const cached = await loadCache(userId);

  if (getIsOffline()) {
    return { visits: sortVisits(cached), fromCache: true };
  }

  try {
    await processOfflineQueue();
    const response = await fetch(`${API_BASE_URL}/visits`, { headers: await authHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);

    const serverVisits: Visit[] = (data?.data?.visits ?? []).map((v: Visit) => {
      const local = cached.find((c) => c.id === v.id);
      // La lista del servidor no trae la firma; se conserva la que ya estaba guardada.
      return local ? { ...local, ...v } : v;
    });
    const merged = applyPending(serverVisits, await getPendingVisitOps(), cached);
    await saveCache(userId, merged);
    return { visits: sortVisits(merged), fromCache: false };
  } catch (error) {
    console.warn('[visits] No se pudo actualizar desde el servidor:', error);
    return { visits: sortVisits(cached), fromCache: true };
  }
}

export async function getVisit(userId: string, id: string): Promise<Visit | null> {
  const cached = await loadCache(userId);
  const local = cached.find((v) => v.id === id) ?? null;

  if (getIsOffline()) return local;

  try {
    const response = await fetch(`${API_BASE_URL}/visits/${id}`, { headers: await authHeaders() });
    if (response.status === 404) return local;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.message || `HTTP ${response.status}`);

    const server: Visit = data.data.visit;
    const ops = (await getPendingVisitOps()).filter((op) => op.payload.visit_id === id);
    const [visit] = applyPending([local ? { ...local, ...server } : server], ops, cached);
    if (!visit) return null;
    await saveCache(userId, [...cached.filter((v) => v.id !== id), visit]);
    return visit;
  } catch (error) {
    console.warn('[visits] No se pudo leer la visita del servidor:', error);
    return local;
  }
}

async function hasPendingOps(visitId: string): Promise<boolean> {
  return (await getPendingVisitOps()).some((op) => op.payload.visit_id === visitId);
}

async function syncNow(visitId: string): Promise<void> {
  if (getIsOffline()) return;
  await processOfflineQueue();
  // Si ya había una sincronización en curso, nuestro cambio pudo quedar fuera de esa pasada.
  if (await hasPendingOps(visitId)) await processOfflineQueue();
}

/**
 * Guarda un cambio en el teléfono primero y luego intenta subirlo.
 * Funciona igual con o sin internet; `_pending` indica si quedó por sincronizar.
 */
export async function saveVisit(
  userId: string,
  visitId: string,
  patch: VisitPatch,
  display: VisitDisplayFields = {}
): Promise<Visit> {
  const cached = await loadCache(userId);
  const existing = cached.find((v) => v.id === visitId);
  const updated = { ...(existing ?? { id: visitId }), ...display, ...patch, _pending: true } as Visit;
  await saveCache(userId, [...cached.filter((v) => v.id !== visitId), updated]);

  await offlineQueue.add({
    id: `visit-${visitId}-${Date.now()}`,
    type: 'visit_upsert',
    payload: { visit_id: visitId, patch },
  });

  await syncNow(visitId);
  const pending = await hasPendingOps(visitId);
  const final = { ...updated, _pending: pending };
  const latest = await loadCache(userId);
  await saveCache(userId, [...latest.filter((v) => v.id !== visitId), final]);
  return final;
}

export async function deleteVisit(userId: string, visitId: string): Promise<void> {
  const cached = await loadCache(userId);
  await saveCache(userId, cached.filter((v) => v.id !== visitId));

  for (const op of await getPendingVisitOps()) {
    if (op.payload.visit_id === visitId) await offlineQueue.remove(op.id);
  }
  await offlineQueue.add({
    id: `visit-delete-${visitId}-${Date.now()}`,
    type: 'delete_visit',
    payload: { visit_id: visitId },
  });
  await syncNow(visitId);
}

export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function mapsUrl(lat: number | string | null, lng: number | string | null): string | null {
  const la = toNumber(lat);
  const ln = toNumber(lng);
  if (la === null || ln === null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${la},${ln}`;
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatVisitDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
