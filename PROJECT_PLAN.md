# Stonks - Project Plan

## Overview
Client-side SPA for stock ticker data visualization and portfolio tracking.

- **Repo**: https://github.com/jamiemulcahy/Stonks
- **Hosting**: GitHub Pages + Cloudflare
- **Stack**: React, TypeScript, Vite, Tailwind, TradingView Lightweight Charts, Dexie

---

## Phase 1: Foundation ✅
- [x] Project setup (Vite, React, TypeScript, Tailwind)
- [x] PWA setup (manifest, service worker)
- [x] App shell with routing and navigation
- [x] Settings page with API key management
- [x] Provider abstraction layer
- [x] Finnhub provider implementation

## Phase 2: Data Layer ✅ (Basic) / 🔄 (Enhancement)
- [x] IndexedDB setup with Dexie
- [x] Basic caching structure
- [ ] Use cached quotes before fetching fresh
- [ ] Staleness indicators in UI (show "updated X mins ago")
- [ ] Request persistent storage on app init
- [ ] Background refresh for watchlist quotes
- [ ] Cache integrity verification on startup

## Phase 3: Core Features ✅ (Basic) / 🔄 (Enhancement)
- [x] Symbol search
- [x] Watchlist management
- [x] Price chart (candlestick) with Lightweight Charts
- [x] Basic quote display
- [x] Stock detail modal
- [ ] Refresh button for quotes
- [ ] Sort watchlist (by name, price, change %)
- [ ] Multiple watchlists support

## Phase 4: Portfolio Tracking 📋
- [ ] Portfolio data model (portfolios, holdings)
- [ ] Create/edit/delete portfolios
- [ ] Add holdings (symbol, shares, avg cost, date)
- [ ] Edit/remove holdings
- [ ] Calculate current value per holding
- [ ] Calculate P&L (unrealized gains/losses)
- [ ] Portfolio summary stats (total value, total gain/loss, day change)
- [ ] Portfolio allocation pie chart
- [ ] Portfolio value over time line chart
- [ ] Import holdings from CSV (optional)

## Phase 5: Additional Providers 📋
- [ ] Alpha Vantage provider implementation
- [ ] Twelve Data provider implementation
- [ ] Provider comparison/selection UI
- [ ] Handle provider-specific rate limits
- [ ] Fallback to secondary provider on rate limit

## Phase 6: Polish & UX 📋
- [ ] Loading skeletons for all data states
- [ ] Error boundaries with friendly messages
- [ ] Offline mode indicator
- [ ] "Last updated" timestamps
- [ ] Keyboard shortcuts documentation
- [ ] Empty states with helpful CTAs
- [ ] Toast notifications for actions
- [ ] Responsive design for mobile

## Phase 7: Deployment & CI/CD 📋
- [ ] GitHub Actions workflow for build
- [ ] Auto-deploy to gh-pages on merge to main
- [ ] Cloudflare setup documentation
- [ ] CSP headers configuration guide

---

## Legend
- ✅ Complete
- 🔄 In Progress / Partial
- 📋 Planned

---

## Priority Order (Recommended)
1. **Phase 4: Portfolio Tracking** - Core user value
2. **Phase 2: Data Layer Enhancement** - Better UX with caching
3. **Phase 7: Deployment** - Get it live
4. **Phase 5: Additional Providers** - More data sources
5. **Phase 6: Polish** - Refinements
