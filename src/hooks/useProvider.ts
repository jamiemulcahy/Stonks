import { useMemo } from 'react';
import { useSettingsStore } from '../stores/settings';
import { createProvider, type StockProvider } from '../lib/providers';

export function useProvider(): StockProvider | null {
  const { activeProvider, apiKeys } = useSettingsStore();

  return useMemo(() => {
    if (!activeProvider) return null;
    const apiKey = apiKeys[activeProvider];
    if (!apiKey) return null;

    try {
      return createProvider(activeProvider, apiKey);
    } catch {
      return null;
    }
  }, [activeProvider, apiKeys]);
}

export function useHasProvider(): boolean {
  const provider = useProvider();
  return provider !== null;
}
