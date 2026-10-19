// PawSense360 — Simplified Pet Overview Page with Animal Theme

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AnimatedPetMascot } from '../components/AnimatedPetMascot';
import {
  Heart,
  MapPin,
  Activity,
  Bell,
  RefreshCw,
  Battery,
  Wifi,
  Volume2,
  ShieldCheck,
  ChevronRight,
  Zap,
} from 'lucide-react';

const Overview: React.FC = () => {
  const { telemetry, alerts, settings, isLoading, refresh } = useApp();
  const navigate = useNavigate();
  const [ringing, setRinging] = useState(false);
  const [ringToast, setRingToast] = useState<string | null>(null);

  if (isLoading && !telemetry) {
    return (
      <div className="page-content">
        <div className="skeleton" style={{ height: 180, borderRadius: 20, marginBottom: 20 }} />
        <div className="grid-4" style={{ gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: 100 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const bio = telemetry?.biometric;
  const gps = telemetry?.gps;
  const motion = telemetry?.motion;
  const unacked = alerts.filter(a => !a.acknowledged).length;

  const handleRingCollar = () => {
    setRinging(true);
    setRingToast('🔔 Ring signal sent to Buddy\'s collar! (Beeping...)');
    setTimeout(() => {
      setRinging(false);
      setTimeout(() => setRingToast(null), 3000);
    }, 2500);
  };

  const activityKey = motion?.isMoving
    ? (motion?.activityCount ?? 0) > 40 ? 'running' : 'walking'
    : 'resting';

  const heartRateVal = bio?.heartRate.valid ? Math.round(bio.heartRate.value) : 84;
  const spo2Val = bio?.spo2.valid ? bio.spo2.value.toFixed(0) : '98';
  const stepsVal = motion?.activityCount ? motion.activityCount * 42 : 4820;
  const stepsGoal = 8000;
  const stepsPercent = Math.min(100, Math.round((stepsVal / stepsGoal) * 100));

  return (
    <div className="page-content simple-theme-view">
      {/* Toast Feedback */}
      {ringToast && (
        <div className="pet-toast animate-bounce-in">
          <span>🐾</span>
          <span>{ringToast}</span>
        </div>
      )}

      {/* ─── Hero Pet Profile Card ────────────────────────────────────────── */}
      <div className="pet-hero-card">
        <div className="pet-hero-bg-paws">
          <span className="paw-decor pd-1">🐾</span>
          <span className="paw-decor pd-2">🐾</span>
          <span className="paw-decor pd-3">🐾</span>
        </div>

        <div className="pet-hero-content">
          <div className="pet-hero-left">
            <AnimatedPetMascot activityState={activityKey} size="lg" showLabel={false} />
            <div className="pet-hero-info">
              <div className="pet-title-row">
                <h1 className="pet-name">Buddy</h1>
                <span className="pet-breed-badge">Golden Retriever 🐕</span>
                <span className="pet-safe-pill">
                  <ShieldCheck size={14} /> Safe at Home
                </span>
              </div>
              <p className="pet-hero-desc">
                Collar is online & actively monitoring vitals, safe boundary, and steps.
              </p>
              <div className="pet-stats-pills">
                <div className="pill-item">
                  <Battery size={14} className="text-success" />
                  <span>88% Battery</span>
                </div>
                <div className="pill-item">
                  <Wifi size={14} className="text-accent" />
                  <span>Wi-Fi Strong</span>
                </div>
                <div className="pill-item">
                  <span style={{ fontSize: 13 }}>🦴</span>
                  <span>{stepsVal.toLocaleString()} Steps Today</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pet-hero-actions">
            <button
              className="btn btn-pet-primary"
              onClick={() => navigate('/gps')}
            >
              <MapPin size={16} /> Locate Buddy
            </button>
            <button
              className={`btn btn-pet-secondary ${ringing ? 'active-ring' : ''}`}
              onClick={handleRingCollar}
              disabled={ringing}
            >
              <Volume2 size={16} /> {ringing ? 'Beeping...' : 'Ring Collar'}
            </button>
            <button
              className="btn btn-pet-ghost"
              onClick={refresh}
              title="Refresh Collar Telemetry"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4 Simplified Glanceable Cards ─────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 24, gap: 16 }}>
        {/* Card 1: Heart & Vitals */}
        <div className="pet-card pet-card-vitals" onClick={() => navigate('/health')}>
          <div className="pet-card-header">
            <span className="pet-card-label">Heart & Vitals</span>
            <div className="pet-icon-circle icon-heart">
              <Heart size={18} />
            </div>
          </div>
          <div className="pet-card-body">
            <div className="pet-metric-row">
              <span className="pet-metric-number">{heartRateVal}</span>
              <span className="pet-metric-unit">BPM</span>
            </div>
            <div className="pet-pulse-animation">
              <span className="heart-dot" />
              <div className="pulse-wave" />
              <span className="pet-vitals-status">
                {heartRateVal > 140 ? '⚠️ High Pulse' : '💚 Normal & Calm'}
              </span>
            </div>
            <div className="pet-mini-subtext">
              <span>SpO₂: <strong>{spo2Val}%</strong></span>
              <span>• Rested</span>
            </div>
          </div>
          <div className="pet-card-footer">
            <span>View 24h Trend</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 2: Activity & Steps */}
        <div className="pet-card pet-card-activity" onClick={() => navigate('/activity')}>
          <div className="pet-card-header">
            <span className="pet-card-label">Activity & Steps</span>
            <div className="pet-icon-circle icon-activity">
              <Activity size={18} />
            </div>
          </div>
          <div className="pet-card-body">
            <div className="pet-metric-row">
              <span className="pet-metric-number">{stepsVal.toLocaleString()}</span>
              <span className="pet-metric-unit">steps</span>
            </div>
            {/* Playful bone progress bar */}
            <div className="bone-progress-track">
              <div className="bone-progress-fill" style={{ width: `${stepsPercent}%` }} />
              <span className="bone-milestone" style={{ left: `${Math.max(10, stepsPercent - 6)}%` }}>
                🦴
              </span>
            </div>
            <div className="pet-mini-subtext">
              <span>{stepsPercent}% of 8,000 goal</span>
              <span>• Active</span>
            </div>
          </div>
          <div className="pet-card-footer">
            <span>Activity Log</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 3: Safe Zone & GPS */}
        <div className="pet-card pet-card-gps" onClick={() => navigate('/gps')}>
          <div className="pet-card-header">
            <span className="pet-card-label">Safe Zone (GPS)</span>
            <div className="pet-icon-circle icon-gps">
              <MapPin size={18} />
            </div>
          </div>
          <div className="pet-card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 10px' }}>
              <span style={{ fontSize: 26 }}>🏡</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                  Backyard Yard
                </div>
                <div className="text-xs text-success" style={{ fontWeight: 600 }}>
                  ● Inside 50m Geofence
                </div>
              </div>
            </div>
            <div className="pet-mini-subtext">
              <span>GPS: {gps?.hasFix ? '3D Satellite Fix' : 'Wi-Fi Estimating'}</span>
              <span>• 0 km/h</span>
            </div>
          </div>
          <div className="pet-card-footer">
            <span>Live Interactive Map</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 4: Collar Alerts & Safety */}
        <div className="pet-card pet-card-alerts" onClick={() => navigate('/alerts')}>
          <div className="pet-card-header">
            <span className="pet-card-label">Safety Alerts</span>
            <div className="pet-icon-circle icon-alerts">
              <Bell size={18} />
            </div>
          </div>
          <div className="pet-card-body">
            {unacked === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 12px' }}>
                <span style={{ fontSize: 28 }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#059669' }}>
                    All Clear!
                  </div>
                  <div className="text-xs text-muted">No safety warnings active</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 12px' }}>
                <span style={{ fontSize: 28 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#DC2626' }}>
                    {unacked} Alert{unacked > 1 ? 's' : ''} Pending
                  </div>
                  <div className="text-xs text-danger">Requires owner attention</div>
                </div>
              </div>
            )}
            <div className="pet-mini-subtext">
              <span>Telegram SOS: <strong>Armed</strong></span>
              <span>• Auto-Sync</span>
            </div>
          </div>
          <div className="pet-card-footer">
            <span>View Alerts Feed</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* ─── Secondary Friendly Highlights ─────────────────────────────────── */}
      <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
        {/* Quick GPS Map Snippet */}
        <div className="pet-card-container">
          <div className="card-header-simple">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <h3 className="section-title-sm">Current Pet Location</h3>
            </div>
            <Link to="/gps" className="btn-link-simple">Full Map & Trails →</Link>
          </div>
          <div className="mini-map-preview" onClick={() => navigate('/gps')}>
            <div className="mini-map-overlay">
              <div className="mini-map-pulse-marker">
                <span className="marker-paw">🐾</span>
              </div>
              <div className="mini-map-badge">
                Buddy is safely resting inside the Backyard Home Circle
              </div>
            </div>
          </div>
        </div>

        {/* Daily Routine & Pet Highlights */}
        <div className="pet-card-container">
          <div className="card-header-simple">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🐾</span>
              <h3 className="section-title-sm">Today's Paws Timeline</h3>
            </div>
            <Link to="/activity" className="btn-link-simple">Activity Details →</Link>
          </div>
          <div className="pet-timeline-list">
            <div className="timeline-item">
              <span className="timeline-paw tp-gold">🐾</span>
              <div className="timeline-content">
                <div className="timeline-title">Morning Walk Completed</div>
                <div className="timeline-time">2,400 steps • 35 mins stroll around the neighborhood</div>
              </div>
              <span className="timeline-badge-pill">8:30 AM</span>
            </div>
            <div className="timeline-item">
              <span className="timeline-paw tp-green">🐾</span>
              <div className="timeline-content">
                <div className="timeline-title">Zoomies in Backyard</div>
                <div className="timeline-time">High acceleration detected • 14 mins play session</div>
              </div>
              <span className="timeline-badge-pill">11:15 AM</span>
            </div>
            <div className="timeline-item">
              <span className="timeline-paw tp-purple">🐾</span>
              <div className="timeline-content">
                <div className="timeline-title">Afternoon Nap</div>
                <div className="timeline-time">Low heart rate (76 BPM) • Resting comfortably indoors</div>
              </div>
              <span className="timeline-badge-pill">Just Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Emergency Telegram SOS Card ───────────────────────────────────── */}
      <div className="pet-sos-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="sos-icon-box">
            <Zap size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, color: '#991B1B', margin: 0, fontSize: '0.95rem' }}>
              Instant Pet SOS Dispatch
            </h4>
            <p style={{ margin: '2px 0 0', color: '#B91C1C', fontSize: '0.8125rem' }}>
              Broadcasts immediate Telegram alerts with live GPS coordinate pins to the owner's phone.
            </p>
          </div>
        </div>
        <button
          className="btn btn-sos-simple"
          disabled={settings.demoMode}
          title={settings.demoMode ? 'Disabled in Demo Mode' : 'Dispatch Emergency Alert'}
          onClick={() => alert('SOS Signal Triggered! Sending coordinates to Telegram.')}
        >
          🚨 {settings.demoMode ? 'Demo Protected' : 'Trigger SOS'}
        </button>
      </div>

      {/* Simple Footer Note */}
      <div className="pet-footer-note">
        <span style={{ fontSize: 14 }}>🐾</span>
        <span>
          PawSense360 • Smart Dog Collar IoT Ecosystem • Designed & Developed by <strong>Tarun P Gowda</strong>
        </span>
      </div>
    </div>
  );
};

export default Overview;
