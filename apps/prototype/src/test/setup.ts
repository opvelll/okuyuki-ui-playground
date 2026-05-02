import "@testing-library/jest-dom/vitest";

const createMemoryStorage = () => {
  const storage = new Map<string, string>();

  return {
    clear: () => {
      storage.clear();
    },
    getItem: (key: string) => storage.get(key) ?? null,
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    removeItem: (key: string) => {
      storage.delete(key);
    },
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
  };
};

const localStorageMock = createMemoryStorage();

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: localStorageMock,
});
