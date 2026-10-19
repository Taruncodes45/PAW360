// PawSense360 — Sidebar Navigation

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Heart, MapPin, Activity, Bell,
  Cpu, Settings, X, Wifi, WifiOff,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Overview' },
  { to: '/health',     icon: Heart,           label: 'Live Health' },
  { to: '/gps',        icon: MapPin,          label: 'GPS Tracking' },
  { to: '/activity',   icon: Activity,        label: 'Activity' },
  { to: '/alerts',     icon: Bell,            label: 'Alerts & History' },
  { to: '/device',     icon: Cpu,             label: 'Device Status' },
  { to: '/settings',   icon: Settings,        label: 'Settings' },
];

const Sidebar: React.FC = () => {
  const { telemetry, settings, sidebarOpen, setSidebarOpen } = useApp();
  const isOnline = telemetry?.device.online ?? false;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none',
          }}
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
              }}>
                <span style={{ fontSize: 20 }}>🐾</span>
                <span style={{
                  fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em',
                }}>PawSense<span style={{ color: '#0BB5D4' }}>360</span></span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
                SMART DOG COLLAR
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', padding: 4, display: 'none',
              }}
              className="sidebar-close-btn"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Device & Pet Card */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div className="sidebar-pet-card">
            <div className="sidebar-pet-avatar">
              <span>🐕</span>
              <span className="sidebar-status-beacon" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                Buddy <span style={{ fontSize: '0.7rem' }}>🐾</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: isOnline ? '#34D399' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                {isOnline ? 'Active & Safe' : 'Collar Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Badge */}
        {settings.demoMode && (
          <div className="sidebar-demo-pill">
            <span>✨</span> DEMO PET MODE
          </div>
        )}

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{label}</span>
              <span className="sidebar-link-paw">🐾</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0,0,0,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>🦴</span>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>PawSense360</div>
              <div>Smart Pet Ecosystem • Tarun P Gowda</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
