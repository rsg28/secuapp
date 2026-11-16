import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
  accuracy: number | null;
}

export class LocationPermissionError extends Error {}

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

/**
 * Ubicación actual por GPS (no requiere internet).
 * Si el GPS tarda, usa la última posición conocida si es reciente.
 */
export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new LocationPermissionError(
      'Se necesita permiso de ubicación para registrar la llegada y salida de la visita.'
    );
  }

  try {
    const pos = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      20000
    );
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null };
  } catch {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
    if (last) {
      return { lat: last.coords.latitude, lng: last.coords.longitude, accuracy: last.coords.accuracy ?? null };
    }
    throw new Error('No se pudo obtener la ubicación. Verifica que el GPS esté activado.');
  }
}
