import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_queue';

export type PendingOperationType =
  | 'closed_inspection'
  | 'open_inspection'
  | 'ast_evaluation'
  | 'rals_report'
  | 'delete_closed_inspection'
  | 'delete_open_inspection'
  | 'delete_ast_evaluation'
  | 'delete_rals_report';

export interface PendingOperation {
  id: string;
  type: PendingOperationType;
  payload: any;
  createdAt: number;
  retryCount: number;
}

export const offlineQueue = {
  async add(operation: Omit<PendingOperation, 'createdAt' | 'retryCount'>): Promise<void> {
    const queue = await this.getQueue();
    queue.push({
      ...operation,
      createdAt: Date.now(),
      retryCount: 0,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  async getQueue(): Promise<PendingOperation[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((op) => op.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  async incrementRetry(id: string): Promise<void> {
    const queue = await this.getQueue();
    const op = queue.find((o) => o.id === id);
    if (op) {
      op.retryCount += 1;
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  },

  async updatePayload(id: string, payload: any): Promise<void> {
    const queue = await this.getQueue();
    const op = queue.find((o) => o.id === id);
    if (op) {
      op.payload = payload;
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },
};
