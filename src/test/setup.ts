import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(String(key));
    },
    setItem(key: string, value: string) {
      store.set(String(key), String(value));
    },
  };
}

function ensureUsableLocalStorage() {
  const candidate = (globalThis as { localStorage?: unknown }).localStorage as
    | Partial<Storage>
    | undefined;

  const isUsable =
    candidate != null &&
    typeof candidate.clear === "function" &&
    typeof candidate.getItem === "function" &&
    typeof candidate.setItem === "function" &&
    typeof candidate.removeItem === "function";

  if (isUsable) {
    return candidate as Storage;
  }

  const fallback = createMemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    value: fallback,
    configurable: true,
    writable: true,
  });

  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      value: fallback,
      configurable: true,
      writable: true,
    });
  }

  return fallback;
}

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  ensureUsableLocalStorage().clear();
});
