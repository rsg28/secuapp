import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIsOffline } from './networkStore';
import { offlineCache } from './offlineCache';

const API_BASE_URL = 'https://www.securg.xyz/api/v1';

export interface FetchWithCacheOptions {
  cacheKey: string;
  ttlMinutes?: number;
  method?: string;
  body?: any;
}

export async function getAuthToken(): Promise<string> {
  const token = await AsyncStorage.getItem('authToken');
  return token || '';
}

/**
 * Fetch with offline support: uses cache when offline, fetches and caches when online.
 */
export async function fetchWithCache(
  url: string,
  options: RequestInit & { cacheKey?: string; ttlMinutes?: number }
): Promise<{ data: any; fromCache: boolean }> {
  const isOffline = getIsOffline();
  const cacheKey = options.cacheKey || url;
  const ttlMinutes = options.ttlMinutes ?? 60;

  if (isOffline) {
    const cached = await offlineCache.getWithExpiry(cacheKey, ttlMinutes);
    if (cached) {
      return { data: cached, fromCache: true };
    }
    throw new Error('Sin conexión y sin datos en caché');
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (response.ok && options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE') {
    await offlineCache.set(cacheKey, data);
  }

  return { data, fromCache: false };
}
