// PawSense360 — Settings & Integrations Page

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SectionHeader } from '../components/MetricCard';
import { AlertTriangle } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useApp();
  const [localThresholds, setLocalThresholds] = useState(settings.alertThresholds);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({ alertThresholds: localThresholds });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-content">
      <SectionHeader
        title="Settings & Integrations"
        subtitle="Dashboard preferences, alert thresholds, and integration setup"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            {settings.demoMode && (
              <span className="badge badge-demo">DEMO MODE</span>
            )}
          </div>
        }
      />

      {/* Demo Mode Toggle */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <span className="card-title">Demo Mode</span>
            <div className="text-sm text-muted" style={{ marginTop: 4 }}>
              Use simulated data when physical hardware is unavailable.
              Always clearly labeled — never silently replaces live data.
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.demoMode}
              onChange={e => updateSettings({ demoMode: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        {settings.demoMode && (
          <div style={{
            marginTop: 8, padding: '8px 12px', background: '#F3E8FF',
            borderRadius: 6, fontSize: '0.8125rem', color: '#5B21B6',
          }}>
            🟣 DEMO MODE ACTIVE — All displayed values are simulated. Telegram alerts are disabled.
          </div>
        )}
        {!settings.demoMode && (
          <div style={{
            marginTop: 8, padding: '8px 12px', background: '#F0FFF4',
            borderRadius: 6, fontSize: '0.8125rem', color: '#14532D',
          }}>
            ✅ LIVE MODE — Dashboard will attempt to fetch data from the backend proxy.
            Ensure the backend is running and the ESP32 is connected.
          </div>
        )}
      </div>

      {/* Device Settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Device Settings</h3>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Device Name</label>
            <input
              className="form-input"
              value={settings.deviceName}
              onChange={e => updateSettings({ deviceName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Refresh Interval</label>
            <select
              className="form-input form-select"
              value={settings.refreshIntervalMs}
              onChange={e => updateSettings({ refreshIntervalMs: Number(e.target.value) })}
            >
              <option value={1000}>1 second</option>
              <option value={2000}>2 seconds</option>
              <option value={3000}>3 seconds (default)</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3>Alert Thresholds</h3>
            <p className="text-sm text-muted">
              These thresholds must be calibrated for your specific dog's breed, size, and fitness level.
              Consult a veterinarian before treating any alert as a medical concern.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save Thresholds'}
          </button>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Heart Rate Low (BPM)</label>
            <input
              type="number" className="form-input"
              value={localThresholds.hrLow}
              min={20} max={100}
              onChange={e => setLocalThresholds(t => ({ ...t, hrLow: Number(e.target.value) }))}
            />
            <span className="text-xs text-muted">Alert if HR drops below this value. Dog normal: 60–80 at rest.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Heart Rate High (BPM)</label>
            <input
              type="number" className="form-input"
              value={localThresholds.hrHigh}
              min={100} max={300}
              onChange={e => setLocalThresholds(t => ({ ...t, hrHigh: Number(e.target.value) }))}
            />
            <span className="text-xs text-muted">Alert if HR exceeds this. Exercise can reach 150–200+ BPM.</span>
          </div>
          <div className="form-group">
            <label className="form-label">SpO₂ Low Threshold (%)</label>
            <input
              type="number" className="form-input"
              value={localThresholds.spo2Low}
              min={70} max={98}
              onChange={e => setLocalThresholds(t => ({ ...t, spo2Low: Number(e.target.value) }))}
            />
            <span className="text-xs text-muted">Normal dog SpO₂: 95–100%. Below 90% is concerning.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Sudden Motion Threshold (g)</label>
            <input
              type="number" step="0.1" className="form-input"
              value={localThresholds.suddenMotionG}
              min={1} max={8}
              onChange={e => setLocalThresholds(t => ({ ...t, suddenMotionG: Number(e.target.value) }))}
            />
            <span className="text-xs text-muted">Acceleration magnitude above this triggers a motion alert. Calibrate per dog.</span>
          </div>
        </div>

        <div style={{
          padding: '10px 14px', background: '#FEF3C7', borderRadius: 8,
          fontSize: '0.8125rem', color: '#78350F', marginTop: 8,
        }}>
          <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          MAX30100 readings are experimental estimates. Do not use alert thresholds for veterinary decisions.
        </div>
      </div>

      {/* Blynk Setup */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>☁️ Blynk IoT Integration</h3>
        <p className="text-sm text-muted" style={{ marginBottom: 14 }}>
          Blynk integration is configured in the ESP32 firmware (<code className="font-mono">config.h</code>).
          The dashboard backend proxies Blynk API calls to keep your auth token server-side.
          Never enter your Blynk token in this browser form.
        </p>

        <div className="card" style={{ background: 'var(--color-bg-secondary)', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Virtual Pin Mapping</div>
          <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--color-text-muted)' }}>Pin</th>
                <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--color-text-muted)' }}>Datastream</th>
                <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--color-text-muted)' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '4px 0', color: 'var(--color-text-muted)' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['V0', 'Heart Rate', 'Float', 'BPM; -1 when invalid'],
                ['V1', 'SpO₂', 'Float', '%; -1 when invalid'],
                ['V2', 'Temperature', 'Float', 'RESERVED — not yet implemented'],
                ['V3', 'GPS Latitude', 'Double', '0.0 when no fix'],
                ['V4', 'GPS Longitude', 'Double', '0.0 when no fix'],
                ['V5', 'Activity Count', 'Int', 'Cumulative movement events'],
                ['V6', 'Device Status', 'Int', '1=online, 0=offline'],
                ['V7', 'GPS Fix', 'Int', '1=fix, 0=no fix'],
                ['V8', 'Battery Voltage', 'Float', 'RESERVED — needs measurement circuit'],
                ['V9', 'Data Age', 'Int', 'Seconds since last sensor read'],
              ].map(([pin, stream, type, notes]) => (
                <tr key={pin} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '6px 0', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-accent)' }}>{pin}</td>
                  <td style={{ padding: '6px 0' }}>{stream}</td>
                  <td style={{ padding: '6px 0', color: 'var(--color-text-muted)' }}>{type}</td>
                  <td style={{ padding: '6px 0', color: 'var(--color-text-muted)' }}>{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted">
          See <code className="font-mono">docs/blynk-setup.md</code> for complete Blynk template and datastream creation instructions.
        </p>
      </div>

      {/* Telegram Setup */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>✈️ Telegram Bot Integration</h3>
        <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
          Telegram alerts are sent directly from the ESP32 firmware.
          Credentials are stored in <code className="font-mono">config.h</code> (gitignored).
          The dashboard does not send Telegram messages.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span className={`badge ${settings.telegramConfigured ? 'badge-success' : 'badge-muted'}`}>
            {settings.telegramConfigured ? '✓ Configured' : '✗ Not configured'}
          </span>
          <span className="text-xs text-muted">
            (This reflects firmware configuration status only)
          </span>
        </div>
        <ol style={{ paddingLeft: 18, fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Message <strong>@BotFather</strong> on Telegram and create a new bot with <code>/newbot</code>.</li>
          <li>Copy the bot token to <code className="font-mono">config.h → TELEGRAM_BOT_TOKEN</code>.</li>
          <li>Start a conversation with your bot and send <code>/start</code>.</li>
          <li>Get your chat ID from <code>@userinfobot</code> and paste into <code className="font-mono">TELEGRAM_CHAT_ID</code>.</li>
          <li>Upload the firmware. The startup alert confirms the connection.</li>
        </ol>
      </div>

      {/* Security Note */}
      <div className="card" style={{ background: '#FFF5F5', border: '1px solid #FECACA' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 24 }}>🔐</div>
          <div>
            <div style={{ fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>Security Reminder</div>
            <ul style={{ paddingLeft: 18, fontSize: '0.875rem', color: '#B91C1C', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong>Never</strong> commit <code>config.h</code> — it is listed in <code>.gitignore</code>.</li>
              <li>The Blynk auth token is a private credential — keep it server-side only.</li>
              <li>The Telegram bot token allows sending messages — protect it.</li>
              <li>Wi-Fi credentials in firmware memory — use a dedicated IoT network where possible.</li>
              <li>This dashboard does not store, transmit, or log any credentials.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
