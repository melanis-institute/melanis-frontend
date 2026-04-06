export function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStorageValue(key: string): string | null {
  if (!hasStorage()) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageValue(key: string, value: string) {
  if (!hasStorage()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is best-effort in this app.
  }
}

export function removeStorageValue(key: string) {
  if (!hasStorage()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage is best-effort in this app.
  }
}

export function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function readStorageJson<T>(key: string, fallback: T): T {
  const parsed = safeParseJson<T>(readStorageValue(key));
  return parsed ?? fallback;
}

export function writeStorageJson<T>(key: string, value: T) {
  writeStorageValue(key, JSON.stringify(value));
}
