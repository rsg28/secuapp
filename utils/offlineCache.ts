import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'offline_cache:';
const DEFAULT_TTL_MINUTES = 60;

interface CachedData<T = any> {
  data: T;
  timestamp: number;
}

export const offlineCache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const parsed: CachedData<T> = JSON.parse(raw);
      return parsed.data;
    } catch {
      return null;
    }
  },

  async getWithExpiry<T>(key: string, ttlMinutes: number = DEFAULT_TTL_MINUTES): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const parsed: CachedData<T> = JSON.parse(raw);
      const isExpired = Date.now() - parsed.timestamp > ttlMinutes * 60 * 1000;
      if (isExpired) return null;
      return parsed.data;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, data: T): Promise<void> {
    try {
      const cached: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cached));
    } catch (e) {
      console.error('[offlineCache.set]', e);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch {}
  },
};
