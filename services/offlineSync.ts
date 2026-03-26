import { offlineQueue, PendingOperation } from '../utils/offlineQueue';
import { storage } from '../utils/storage';
import { getAuthToken } from '../utils/offlineFetch';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

type SyncCallback = (result: { success: boolean; count: number; errors: string[] }) => void;

/** Only one processOfflineQueue run at a time; other callers wait for it. */
let syncInProgress: Promise<void> | null = null;

async function uploadImage(uri: string, folder: string, identifier: string, subfolder?: string, itemId?: string): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const getMimeType = (u: string): string => {
    const ext = u.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'gif') return 'image/gif';
    return 'image/jpeg';
  };

  const mimeType = getMimeType(uri);
  const fileName = `photo.${mimeType.split('/')[1]}`;

  const formData = new FormData();
  formData.append('image', { uri, type: mimeType, name: fileName } as any);
  formData.append('folder', folder);
  if (subfolder) formData.append('subfolder', subfolder);
  formData.append('identifier', identifier);
  if (itemId) formData.append('itemId', itemId);

  const response = await fetch(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) return null;
  const json = await response.json();
  return json.imageUrl ?? null;
}

const CAMEL_TO_SNAKE: Record<string, string> = {
  razonSocial: 'razon_social',
  descripcionTrabajo: 'descripcion_trabajo',
  answers01: 'answers_01',
  answers012: 'answers_012',
  puntajeObtenido: 'puntaje_obtenido',
  jefeGrupo: 'jefe_grupo',
  supervisorIngeniero: 'supervisor_ingeniero',
  vbSst: 'vb_sst',
  supervisorNombre: 'supervisor_nombre',
  supervisorFirma: 'supervisor_firma',
  evaluadorNombre: 'evaluador_nombre',
  evaluadorFirma: 'evaluador_firma',
  companyId: 'company_id',
  tipoObservacion: 'tipo_observacion',
  areaSeccion: 'area_seccion',
  descripcionObservado: 'descripcion_observado',
  accionesCorrectivas: 'acciones_correctivas',
  compromisoObservado: 'compromiso_observado',
  trabajadorObservadoNombre: 'trabajador_observado_nombre',
  trabajadorObservadoFirma: 'trabajador_observado_firma',
  fechaLevantamiento: 'fecha_levantamiento',
};

function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const snake = CAMEL_TO_SNAKE[k] ?? k.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
      result[snake] = camelToSnake(v);
    }
    return result;
  }
  return obj;
}

function replaceLocalUrisWithRemote(payload: any, remoteUrls: Record<string, string>): any {
  if (!payload) return payload;
  const str = JSON.stringify(payload);
  let result = str;
  for (const [local, remote] of Object.entries(remoteUrls)) {
    result = result.split(local).join(remote);
  }
  return JSON.parse(result);
}

async function syncOperation(op: PendingOperation, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Operaciones de eliminación pendientes (se ejecutaron offline)
    const deleteTypes = ['delete_closed_inspection', 'delete_open_inspection', 'delete_ast_evaluation', 'delete_rals_report'];
    if (deleteTypes.includes(op.type)) {
      const itemId = op.payload?.id ?? op.id;
      const headers = { Authorization: `Bearer ${token}` };
      let url = '';
      switch (op.type) {
        case 'delete_closed_inspection':
          url = `${API_BASE_URL}/closed-inspection-responses/${itemId}`;
          break;
        case 'delete_open_inspection':
          url = `${API_BASE_URL}/open-inspection-responses/${itemId}`;
          break;
        case 'delete_ast_evaluation':
          url = `${API_BASE_URL}/ast-evaluations/${itemId}`;
          break;
        case 'delete_rals_report':
          url = `${API_BASE_URL}/rals-reports/${itemId}`;
          break;
        default:
          return { success: false, error: `Tipo delete desconocido: ${op.type}` };
      }
      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data?.message || data?.error || `HTTP ${res.status}` };
      }
      await storage.removePendingDelete(itemId);
      return { success: true };
    }

    let payload = { ...op.payload };

    // Inspecciones cerradas/abiertas: payload = { response, items }
    if (op.type === 'closed_inspection' || op.type === 'open_inspection') {
      const { response: responseData, items: itemsList } = payload as { response: any; items: any[] };
      if (!responseData || !Array.isArray(itemsList)) {
        return { success: false, error: 'Payload inválido (response/items)' };
      }

      // Asegurar template_id en inspección cerrada (backend lo exige en POST)
      if (op.type === 'closed_inspection' && (responseData.template_id == null || responseData.template_id === '')) {
        const offlineItems = await storage.loadOfflineItems();
        const item = offlineItems.find((i: any) => i.id === op.id && i.type === 'closed_inspection');
        if (item?.template_id) {
          responseData.template_id = item.template_id;
        }
      }

      const basePath = op.type === 'closed_inspection' ? 'closed-inspection' : 'open-inspection';
      const resUrl = `${API_BASE_URL}/${basePath}-responses`;
      const itemUrl = `${API_BASE_URL}/${basePath}-response-items`;

      const res = await fetch(resUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(responseData),
      });
      const resJson = await res.json();
      if (!res.ok) {
        return { success: false, error: resJson?.message || resJson?.error || `HTTP ${res.status}` };
      }
      const serverResponseId = resJson?.data?.response?.id;
      if (!serverResponseId) {
        return { success: false, error: 'No se recibió id de respuesta' };
      }

      const subfolder = op.type === 'closed_inspection' ? 'closed' : 'open';
      for (const item of itemsList) {
        let imageUrl = item.image_url;
        // Subir a S3 cualquier imagen guardada como URI local (offline); así el backend recibe URL de S3
        const isLocalUri = imageUrl && typeof imageUrl === 'string' && (imageUrl.startsWith('file://') || imageUrl.startsWith('content://') || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')));
        if (isLocalUri && imageUrl) {
          const uploaded = await uploadImage(imageUrl, 'inspection-images', serverResponseId, subfolder, item.item_id || item.question_index);
          if (uploaded) imageUrl = uploaded;
        }
        const itemPayload = camelToSnake({ ...item, response_id: serverResponseId, image_url: imageUrl });

        const itemRes = await fetch(itemUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(itemPayload),
        });
        if (!itemRes.ok) {
          const errData = await itemRes.json().catch(() => ({}));
          return { success: false, error: `Item: ${errData?.message || itemRes.status}` };
        }
      }

      await storage.removeOfflineInspectionPayload(op.id);
      return { success: true };
    }

    // AST/RALS: handle images in payload
    const imageFields = ['supervisor_firma', 'evaluador_firma', 'trabajador_observado_firma'];
    const remoteUrls: Record<string, string> = {};

    for (const field of imageFields) {
      const uri = payload[field];
      if (uri && typeof uri === 'string' && (uri.startsWith('file://') || uri.startsWith('content://'))) {
        const remoteUrl = await uploadImage(uri, 'inspection-images', (payload as any).inspector_id || (payload as any).inspectorId || 'temp');
        if (remoteUrl) remoteUrls[uri] = remoteUrl;
      }
    }

    if (Object.keys(remoteUrls).length > 0) {
      payload = replaceLocalUrisWithRemote(payload, remoteUrls);
    }

    let response: Response;
    let url: string;

    switch (op.type) {
      case 'ast_evaluation':
        url = `${API_BASE_URL}/ast-evaluations`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(camelToSnake(payload)),
        });
        break;
      case 'rals_report':
        url = `${API_BASE_URL}/rals-reports`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(camelToSnake(payload)),
        });
        break;
      default:
        return { success: false, error: `Tipo desconocido: ${op.type}` };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || data?.error || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Error de red' };
  }
}

export async function processOfflineQueue(callback?: SyncCallback): Promise<void> {
  if (syncInProgress) {
    await syncInProgress;
    return;
  }

  const run = async () => {
    const token = await getAuthToken();
    if (!token) {
      callback?.({ success: false, count: 0, errors: ['No hay token de autenticación'] });
      return;
    }

    const queue = await offlineQueue.getQueue();
    const errors: string[] = [];
    let successCount = 0;

    for (const op of queue) {
      const result = await syncOperation(op, token);
      if (result.success) {
        await offlineQueue.remove(op.id);
        const isDelete = op.type.startsWith('delete_');
        if (!isDelete) {
          await storage.removeOfflineItem(op.id);
        }
        successCount++;
      } else {
        await offlineQueue.incrementRetry(op.id);
        errors.push(`${op.type} (${op.id}): ${result.error}`);
      }
    }

    callback?.({
      success: errors.length === 0,
      count: successCount,
      errors,
    });
  };

  const promise = run().finally(() => {
    syncInProgress = null;
  });
  syncInProgress = promise;
  await promise;
}

/**
 * Sincroniza un solo ítem local (por id). Al terminar bien, lo quita de la cola y de offline items.
 */
export async function syncSingleOfflineItem(localId: string): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();
  if (!token) {
    return { success: false, error: 'No hay token de autenticación' };
  }
  const queue = await offlineQueue.getQueue();
  const op = queue.find((o) => o.id === localId);
  if (!op) {
    return { success: false, error: 'No se encontró el registro pendiente' };
  }
  const result = await syncOperation(op, token);
  if (result.success) {
    await offlineQueue.remove(op.id);
    const isDelete = op.type.startsWith('delete_');
    if (!isDelete) {
      await storage.removeOfflineItem(op.id);
    }
  } else {
    await offlineQueue.incrementRetry(op.id);
  }
  return result;
}
