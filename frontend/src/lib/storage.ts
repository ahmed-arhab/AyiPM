const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage = {
  readRaw(key: string): string | null {
    if (!isBrowser()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  writeRaw(key: string, value: string): boolean {
    if (!isBrowser()) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // storage unavailable
    }
  },

  keys(): string[] {
    if (!isBrowser()) return [];
    try {
      return Object.keys(window.localStorage);
    } catch {
      return [];
    }
  },
};
