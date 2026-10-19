// PawSense360 — Root Application

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import LiveHealth from './pages/LiveHealth';
import GPSTracking from './pages/GPSTracking';
import ActivityMonitoring from './pages/ActivityMonitoring';
import AlertsHistory from './pages/AlertsHistory';
import DeviceStatus from './pages/DeviceStatus';
import SettingsPage from './pages/SettingsPage';
import PawBackground from './components/PawBackground';
import { Menu, Sparkles } from 'lucide-react';

// ─── Page Header ─────────────────────────────────────────────────────────────
const PageHeader: React.FC = () => {
  const { settings, setSidebarOpen, telemetry } = useApp();
  const isOnline = telemetry?.device.online ?? false;

  return (
    <header className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 6, borderRadius: 6, color: 'var(--color-text-secondary)',
            display: 'none',
          }}
          className="mobile-menu-btn"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="header-paw-badge">
            <span className="bouncing-paw">🐾</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
                PawSense<span style={{ color: 'var(--color-accent)' }}>360</span>
              </span>
              <span className="header-pet-tag">🐶 Buddy's Collar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Walking paw step animation in header */}
      <div className="header-paw-walk" title="Collar active & tracking">
        <span className="step-paw step-1">🐾</span>
        <span className="step-paw step-2">🐾</span>
        <span className="step-paw step-3">🐾</span>
        <span className="step-paw step-4">🐾</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {settings.demoMode && (
          <span className="badge badge-demo">
            <Sparkles size={11} style={{ marginRight: 4 }} /> DEMO MODE
          </span>
        )}
        <div className="header-status-pill">
          <div className={`status-dot ${isOnline ? 'pulsing' : 'offline'}`} />
          <span className="text-sm font-semibold">
            {isOnline ? 'Collar Online' : 'Collar Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};

// ─── App Shell ────────────────────────────────────────────────────────────────
const AppShell: React.FC = () => {
  const { settings } = useApp();

  return (
    <div className="app-layout">
      {/* Ambient animated paw footprints across entire dashboard */}
      <PawBackground />
      <Sidebar />
      <div className="main-content">
        {settings.demoMode && (
          <div className="demo-banner">
            🐾 <strong>Pet Demo Mode Active</strong> — Showing simulated collar signals for Buddy! Everything is interactive.
          </div>
        )}
        <PageHeader />
        <Routes>
          <Route path="/"          element={<Overview />} />
          <Route path="/health"    element={<LiveHealth />} />
          <Route path="/gps"       element={<GPSTracking />} />
          <Route path="/activity"  element={<ActivityMonitoring />} />
          <Route path="/alerts"    element={<AlertsHistory />} />
          <Route path="/device"    element={<DeviceStatus />} />
          <Route path="/settings"  element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <BrowserRouter>
    <AppProvider>
      <AppShell />
    </AppProvider>
  </BrowserRouter>
);

export default App;
