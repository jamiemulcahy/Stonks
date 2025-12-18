import type { StockProvider } from './types';
import { createFinnhubProvider } from './finnhub';
import type { ProviderId } from '../../stores/settings';

export * from './types';
export { createFinnhubProvider };

export function createProvider(providerId: ProviderId, apiKey: string): StockProvider {
  switch (providerId) {
    case 'finnhub':
      return createFinnhubProvider(apiKey);
    case 'alphavantage':
      throw new Error('Alpha Vantage provider not yet implemented');
    case 'twelvedata':
      throw new Error('Twelve Data provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}
