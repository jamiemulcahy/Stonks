# Stonks - Claude Code Context

## Project Overview
Stonks is a client-side SPA for stock ticker data visualization and portfolio tracking. It runs entirely in the browser with no backend - users provide their own API keys for stock data providers.

## Tech Stack
- **Framework**: React 18 + TypeScript
- **Build**: Vite 6
- **Styling**: Tailwind CSS 3 (build-time, dark theme)
- **Charts**: TradingView Lightweight Charts
- **State**: Zustand + TanStack Query
- **Storage**: Dexie.js (IndexedDB wrapper)
- **Routing**: React Router v6
- **PWA**: vite-plugin-pwa

## Key Commands
```bash
npm run dev       # Start dev server
npm run build     # TypeScript check + production build
npm run preview   # Preview production build
npm run lint      # ESLint check
npm run test      # Run Vitest
```

## Project Structure
```
src/
├── components/
│   ├── charts/       # TradingView chart components
│   ├── common/       # Shared UI (modals, buttons)
│   └── layout/       # App shell, sidebar, header
├── hooks/            # Custom React hooks
├── lib/
│   ├── db/           # Dexie database setup
│   └── providers/    # Stock API provider implementations
├── pages/            # Route-level page components
├── stores/           # Zustand state stores
├── types/            # Shared TypeScript types
└── utils/            # Helper functions
```

## Architecture Decisions

### Provider Abstraction
All stock data providers implement `StockProvider` interface in `src/lib/providers/types.ts`. To add a new provider:
1. Create `src/lib/providers/{name}.ts`
2. Implement the `StockProvider` interface
3. Add to factory in `src/lib/providers/index.ts`
4. Add provider config to `src/stores/settings.ts` PROVIDERS array

### API Key Storage
- Default: `sessionStorage` (cleared on tab close)
- Optional: `localStorage` with user consent
- Keys managed via `useSettingsStore` in `src/stores/settings.ts`

### Data Caching
- IndexedDB via Dexie for persistent cache
- Quote cache TTL: 5 minutes
- Candle cache TTL: 24 hours
- Always fetch fresh if cache miss
- See `src/lib/db/index.ts` for schema and helpers

### Security (CSP)
This app is designed for strict CSP. Do NOT:
- Use inline scripts or `eval()`
- Add external script CDNs
- Use Tailwind Play CDN (must be build-time)

## Styling Conventions
- Dark theme by default (see `tailwind.config.js`)
- Use semantic color classes: `text-gain`, `text-loss`, `bg-surface`, `bg-background`
- Component classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.input`, `.card`

## Testing
- Vitest for unit tests
- React Testing Library for component tests
- Test files: `*.test.ts` or `*.test.tsx`

## Current Status
See `PROJECT_PLAN.md` for detailed roadmap and progress tracking.
