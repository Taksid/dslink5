export const redis = {
  get: async <T = unknown>(key: string): Promise<T | null> => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set: async (key: string, value: unknown): Promise<string> => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return 'OK';
    } catch {
      return 'ERR';
    }
  },
};

