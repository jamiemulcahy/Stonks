import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import WatchlistPage from './pages/WatchlistPage';
import PortfolioPage from './pages/PortfolioPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const navigate = useNavigate();

  // Handle GitHub Pages SPA redirect
  useEffect(() => {
    const redirect = sessionStorage.getItem('gh-pages-redirect');
    if (redirect) {
      sessionStorage.removeItem('gh-pages-redirect');
      // Remove the base path prefix if present
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
      const path = redirect.startsWith(basePath)
        ? redirect.slice(basePath.length) || '/'
        : redirect;
      navigate(path, { replace: true });
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
