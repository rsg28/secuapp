/**
 * Copia una imagen a almacenamiento persistente (documentDirectory).
 * Necesario cuando está offline: las URIs de ImagePicker pueden estar en cache
 * y ser eliminadas por el sistema. Esta copia persiste hasta la sincronización.
 */
import * as FileSystem from 'expo-file-system/legacy';

const OFFLINE_IMAGES_DIR = 'inspection-images-offline';

export async function copyImageToPersistentStorage(uri: string): Promise<string> {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
  const fileName = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${safeExt}`;
  const dir = `${FileSystem.documentDirectory}${OFFLINE_IMAGES_DIR}`;
  const destUri = `${dir}/${fileName}`;

  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  await FileSystem.copyAsync({ from: uri, to: destUri });
  return destUri;
}
