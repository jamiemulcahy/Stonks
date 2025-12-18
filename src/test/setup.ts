import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
