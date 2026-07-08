import '@testing-library/jest-dom/vitest'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

Object.defineProperty(window, 'localStorage', {
  value: {
    store: new Map<string, string>(),
    getItem(key: string) { return this.store.get(key) ?? null },
    setItem(key: string, value: string) { this.store.set(key, value) },
    removeItem(key: string) { this.store.delete(key) },
    clear() { this.store.clear() },
  },
})
