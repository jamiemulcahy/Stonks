import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProviderId = 'finnhub' | 'alphavantage' | 'twelvedata';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  baseUrl: string;
  docsUrl: string;
  rateLimit: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'finnhub',
    name: 'Finnhub',
    description: 'Real-time stock data with WebSocket support',
    baseUrl: 'https://finnhub.io/api/v1',
    docsUrl: 'https://finnhub.io/register',
    rateLimit: '60 calls/min',
  },
  {
    id: 'alphavantage',
    name: 'Alpha Vantage',
    description: 'Popular API with comprehensive historical data',
    baseUrl: 'https://www.alphavantage.co/query',
    docsUrl: 'https://www.alphavantage.co/support/#api-key',
    rateLimit: '25 calls/day',
  },
  {
    id: 'twelvedata',
    name: 'Twelve Data',
    description: 'Stocks, ETFs, forex, and crypto data',
    baseUrl: 'https://api.twelvedata.com',
    docsUrl: 'https://twelvedata.com/account/api-keys',
    rateLimit: '800 calls/day',
  },
];

export type StorageMode = 'session' | 'local';

interface SettingsState {
  apiKeys: Partial<Record<ProviderId, string>>;
  activeProvider: ProviderId | null;
  storageMode: StorageMode;

  // Actions
  setApiKey: (provider: ProviderId, key: string) => void;
  removeApiKey: (provider: ProviderId) => void;
  setActiveProvider: (provider: ProviderId) => void;
  setStorageMode: (mode: StorageMode) => void;
  hasApiKey: () => boolean;
  getActiveApiKey: () => string | null;
}

// For sessionStorage, we need a custom storage
const sessionStorageAdapter = {
  getItem: (name: string) => {
    const value = sessionStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) => {
    sessionStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    sessionStorage.removeItem(name);
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKeys: {},
      activeProvider: null,
      storageMode: 'session',

      setApiKey: (provider, key) => {
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
          activeProvider: state.activeProvider ?? provider,
        }));
      },

      removeApiKey: (provider) => {
        set((state) => {
          const newKeys = { ...state.apiKeys };
          delete newKeys[provider];

          // If removing the active provider, switch to another or null
          let newActive = state.activeProvider;
          if (state.activeProvider === provider) {
            const remaining = Object.keys(newKeys) as ProviderId[];
            newActive = remaining[0] ?? null;
          }

          return { apiKeys: newKeys, activeProvider: newActive };
        });
      },

      setActiveProvider: (provider) => {
        const state = get();
        if (state.apiKeys[provider]) {
          set({ activeProvider: provider });
        }
      },

      setStorageMode: (mode) => {
        set({ storageMode: mode });
      },

      hasApiKey: () => {
        const state = get();
        return state.activeProvider !== null && Boolean(state.apiKeys[state.activeProvider]);
      },

      getActiveApiKey: () => {
        const state = get();
        if (!state.activeProvider) return null;
        return state.apiKeys[state.activeProvider] ?? null;
      },
    }),
    {
      name: 'stonks-settings',
      storage: sessionStorageAdapter,
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        activeProvider: state.activeProvider,
        storageMode: state.storageMode,
      }),
    }
  )
);
