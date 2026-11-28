import '@testing-library/jest-dom/vitest'

// Polyfill for <dialog> in jsdom
if (typeof HTMLDialogElement !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proto = HTMLDialogElement.prototype as any
  if (!proto.showModal) {
    proto.showModal = function () { this.open = true }
  }
  if (!proto.close) {
    proto.close = function () { this.open = false }
  }
}

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
