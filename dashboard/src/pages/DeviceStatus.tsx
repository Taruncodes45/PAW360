// PawSense360 — Device Status Page

import React from 'react';
import { useApp } from '../context/AppContext';
import { SectionHeader, SensorRow } from '../components/MetricCard';
import { Cpu, Wifi, Cloud, MapPin, Clock, Server } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DeviceStatus: React.FC = () => {
  const { telemetry, settings } = useApp();
  const device = telemetry?.device;

  const uptime = device?.uptime
    ? (() => {
        const s = device.uptime;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return `${h}h ${m}m`;
      })()
    : '—';

  return (
    <div className="page-content">
      <SectionHeader
        title="Device Status"
        subtitle="ESP32-WROOM-32 firmware and connectivity diagnostics"
      />

      {/* Connection Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          {
            label: 'Collar',
            icon: <Cpu size={18} />,
            ok: device?.online,
            note: device?.firmwareVersion ? `FW v${device.firmwareVersion}` : 'N/A',
          },
          {
            label: 'Wi-Fi',
            icon: <Wifi size={18} />,
            ok: device?.wifiConnected,
            note: settings.demoMode ? 'Demo mode' : 'Check router if offline',
          },
          {
            label: 'Blynk Cloud',
            icon: <Cloud size={18} />,
            ok: device?.blynkConnected,
            note: 'Configure auth token in config.h',
          },
          {
            label: 'GPS Fix',
            icon: <MapPin size={18} />,
            ok: device?.gpsConnected,
            note: 'Requires outdoor satellite view',
          },
        ].map(({ label, icon, ok, note }) => (
          <div key={label} className="card">
            <div className="card-header">
              <span className="card-title">{label}</span>
              <div style={{ color: 'var(--color-text-muted)' }}>{icon}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div className={`status-dot ${ok ? 'online' : 'offline'}`} />
              <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                {ok ? 'Connected' : 'Unavailable'}
              </span>
            </div>
            <p className="text-xs text-muted">{note}</p>
          </div>
        ))}
      </div>

      {/* Device Info */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Device Information</span>
            <Server size={16} color="var(--color-text-muted)" />
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <tbody>
              {[
                ['Device Name', device?.deviceName ?? '—'],
                ['Firmware', device?.firmwareVersion ? `v${device.firmwareVersion}` : '—'],
                ['Uptime', uptime],
                ['Data Source', settings.demoMode ? 'DEMO MODE' : (telemetry?.dataSource ?? '—')],
              ].map(([key, val]) => (
                <tr key={key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 0', color: 'var(--color-text-muted)', width: '45%' }}>{key}</td>
                  <td style={{ padding: '8px 0', fontWeight: 500 }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Last Telemetry</span>
            <Clock size={16} color="var(--color-text-muted)" />
          </div>
          {device?.lastTelemetryMs ? (
            <>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {formatDistanceToNow(new Date(device.lastTelemetryMs), { addSuffix: true })}
              </div>
              <p className="text-sm text-muted" style={{ marginTop: 6 }}>
                Data older than 30 seconds is considered stale.
              </p>
              {Date.now() - device.lastTelemetryMs > 30000 && (
                <span className="badge badge-warning" style={{ marginTop: 8 }}>⚠ Stale data</span>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">No telemetry received yet.</p>
          )}
        </div>
      </div>

      {/* Sensor Availability */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Sensor Availability</span>
        </div>
        <SensorRow
          label="MAX30100 Heart-Rate / SpO₂"
          connected={device?.max30100Connected ?? false}
          note="I2C addr 0x57 · SDA=GPIO21, SCL=GPIO22 · VCC=3.3V"
        />
        <SensorRow
          label="MPU6050 Accelerometer / Gyroscope"
          connected={device?.mpu6050Connected ?? false}
          note="I2C addr 0x68 (AD0=GND) · Shared I2C bus"
        />
        <SensorRow
          label="Neo-6M GPS Module"
          connected={device?.gpsConnected ?? false}
          note="UART2 · RX=GPIO16, TX=GPIO17 · 9600 baud"
        />
        <div style={{ marginTop: 8, padding: '8px 0' }}>
          <SensorRow
            label="Temperature Sensor"
            connected={false}
            note="Not installed — MAX30100 does NOT measure dog body temperature"
          />
        </div>
        {settings.demoMode && (
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: '#F3E8FF', borderRadius: 6,
            fontSize: '0.8rem', color: '#5B21B6',
          }}>
            🟣 Sensor statuses shown are SIMULATED in Demo Mode.
          </div>
        )}
      </div>

      {/* Troubleshooting Guide */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Troubleshooting Guide</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              title: 'Collar offline',
              steps: [
                'Check USB / battery connection to ESP32.',
                'Open Arduino Serial Monitor at 115200 baud.',
                'Verify Wi-Fi SSID and password in config.h.',
                'Ensure router is reachable and 2.4 GHz band is used.',
              ],
            },
            {
              title: 'MAX30100 not found',
              steps: [
                'Check SDA (GPIO21) and SCL (GPIO22) wiring.',
                'Verify MAX30100 VCC is connected to 3.3V — NOT 5V.',
                'Run I2C scanner sketch to confirm address 0x57 is visible.',
                'Some boards need 4.7kΩ pull-up resistors on SDA/SCL.',
              ],
            },
            {
              title: 'GPS no fix',
              steps: [
                'Move device outdoors with unobstructed sky view.',
                'Cold-start fix can take 30–120 seconds.',
                'Check Neo-6M TX → ESP32 GPIO16 connection.',
                'Avoid metallic enclosures that block satellite signals.',
                'Check antenna is properly connected to Neo-6M module.',
              ],
            },
            {
              title: 'Blynk not connecting',
              steps: [
                'Verify BLYNK_AUTH_TOKEN in config.h matches your device token.',
                'Check that BLYNK_TEMPLATE_ID matches your Blynk template.',
                'Ensure the device has internet access (Wi-Fi connected).',
                'Confirm the Blynk app/dashboard is configured with correct virtual pins.',
              ],
            },
            {
              title: 'No Telegram alerts',
              steps: [
                'Verify TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in config.h.',
                'Send /start to your bot first to authorize the chat.',
                'Check ESP32 has internet access.',
                'Alert cooldowns (60s default) prevent repeated alerts.',
                'In Demo Mode, Telegram alerts are always suppressed.',
              ],
            },
          ].map(({ title, steps }) => (
            <details key={title} style={{ cursor: 'pointer' }}>
              <summary style={{ fontWeight: 600, fontSize: '0.875rem', padding: '6px 0' }}>
                🔧 {title}
              </summary>
              <ul style={{ marginTop: 8, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {steps.map((s, i) => (
                  <li key={i} className="text-sm text-muted">{s}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceStatus;
