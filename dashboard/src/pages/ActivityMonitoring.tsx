// PawSense360 — Activity Monitoring Page

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { SectionHeader } from '../components/MetricCard';
import { Activity, AlertTriangle, Zap, Moon, Move } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const ActivityMonitoring: React.FC = () => {
  const { telemetry, activityHistory, settings } = useApp();
  const motion = telemetry?.motion;

  // Build chart data from event history
  const eventChartData = activityHistory.events.slice(-20).map(e => ({
    time: format(new Date(e.timestampMs), 'HH:mm'),
    magnitude: parseFloat(e.magnitude.toFixed(2)),
    type: e.type,
  }));

  const barColor = (entry: { type: string }) =>
    entry.type === 'sudden' ? '#EF4444'
    : entry.type === 'inactive' ? '#94A3B8'
    : '#1A7A52';

  return (
    <div className="page-content">
      <SectionHeader
        title="Activity Monitoring"
        subtitle="MPU6050 accelerometer and gyroscope — heuristic motion analysis"
      />

      {/* Disclaimer */}
      <div style={{
        background: '#FEF3C7', border: '1px solid #FDE68A',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
        fontSize: '0.8125rem', color: '#78350F',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Heuristic indicators only:</strong> Movement events are detected using
          configurable acceleration thresholds. Sudden motion is flagged as a{' '}
          <em>possible event</em>, not a confirmed medical episode.
          Thresholds should be calibrated for each dog's size, breed, and collar placement.
          Do not diagnose distress, seizures, or medical conditions from motion data alone.
        </div>
      </div>

      {/* Live State Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Current State</span>
            <div className="metric-icon motion"><Move size={18} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`status-dot ${motion?.isMoving ? 'pulsing' : 'offline'}`} style={{ width: 12, height: 12 }} />
            <span className="card-value" style={{ fontSize: '1.5rem' }}>
              {motion?.isMoving ? 'Active' : 'Resting'}
            </span>
          </div>
          {motion?.isMoving && (
            <p className="card-subtitle">
              Accel magnitude: {motion.accelMagnitude.toFixed(2)}g
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Activity Events</span>
            <div className="metric-icon motion"><Activity size={18} /></div>
          </div>
          <span className="card-value">{motion?.activityCount ?? 0}</span>
          <p className="card-subtitle">Cumulative movement events</p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Active Time</span>
            <div className="metric-icon motion"><Moon size={18} /></div>
          </div>
          <span className="card-value">{motion?.activePercent ?? 0}%</span>
          <p className="card-subtitle">Of last monitoring window</p>
        </div>
      </div>

      {/* Sudden Motion Alert */}
      {motion?.suddenMovement && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 10, padding: '14px 18px', marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <Zap size={20} color="#DC2626" />
          <div>
            <div style={{ fontWeight: 700, color: '#991B1B' }}>Sudden Movement Detected</div>
            <p className="text-sm" style={{ color: '#B91C1C' }}>
              Acceleration magnitude: {motion.accelMagnitude.toFixed(2)}g ·
              This is a heuristic indicator only — not a medical diagnosis.
            </p>
          </div>
        </div>
      )}

      {/* Accelerometer Axes */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Accelerometer Axes (live)</span>
          <span className="text-xs text-muted">in units of g (9.81 m/s²)</span>
        </div>
        {motion ? (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'X', value: motion.accelX, color: '#EF4444' },
              { label: 'Y', value: motion.accelY, color: '#22C55E' },
              { label: 'Z', value: motion.accelZ, color: '#3B82F6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, minWidth: 80 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color, marginBottom: 4 }}>
                  Axis {label}
                </div>
                <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2, marginBottom: 4 }}>
                  <div style={{
                    height: '100%', borderRadius: 2, background: color,
                    width: `${Math.min(100, Math.abs(value) / 2 * 100)}%`,
                    transition: 'width 300ms ease',
                  }} />
                </div>
                <code className="font-mono text-sm">{value.toFixed(3)}g</code>
              </div>
            ))}
            <div style={{ flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7C3AED', marginBottom: 4 }}>
                Magnitude
              </div>
              <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2, marginBottom: 4 }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: '#7C3AED',
                  width: `${Math.min(100, motion.accelMagnitude / 4 * 100)}%`,
                  transition: 'width 300ms ease',
                }} />
              </div>
              <code className="font-mono text-sm">{motion.accelMagnitude.toFixed(3)}g</code>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Sensor data unavailable.</p>
        )}
      </div>

      {/* Activity Timeline Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Motion Event Timeline</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}>
              <span style={{ width: 10, height: 10, background: '#1A7A52', borderRadius: 2, display: 'inline-block' }} /> Active
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}>
              <span style={{ width: 10, height: 10, background: '#EF4444', borderRadius: 2, display: 'inline-block' }} /> Sudden
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}>
              <span style={{ width: 10, height: 10, background: '#94A3B8', borderRadius: 2, display: 'inline-block' }} /> Resting
            </span>
          </div>
        </div>
        {eventChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={eventChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="var(--color-border)" />
              <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} label={{ value: 'Magnitude (g)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any) => [`${Number(v).toFixed(2)}g`, 'Magnitude']} />
              <Bar dataKey="magnitude" radius={[4, 4, 0, 0]}>
                {eventChartData.map((entry, i) => (
                  <Cell key={i} fill={barColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data"><p className="text-sm text-muted">No movement events recorded yet.</p></div>
        )}
      </div>

      {/* Calibration Note */}
      <div className="card" style={{ background: 'var(--color-bg-secondary)' }}>
        <h3 style={{ marginBottom: 10 }}>⚙️ Threshold Calibration</h3>
        <p className="text-sm text-muted" style={{ marginBottom: 10 }}>
          Thresholds should be adjusted in <strong>Settings</strong> and in{' '}
          <code className="font-mono">config.h</code> on the firmware to match
          your specific dog's size, breed, and collar placement.
        </p>
        <div className="grid-2">
          <div style={{ padding: '10px 14px', background: 'white', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div className="text-xs text-muted">Movement Threshold</div>
            <div style={{ fontWeight: 600 }}>{settings.alertThresholds.suddenMotionG}g (sudden)</div>
            <div className="text-xs text-muted">0.15g (activity detection)</div>
          </div>
          <div style={{ padding: '10px 14px', background: 'white', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div className="text-xs text-muted">Alert Cooldown</div>
            <div style={{ fontWeight: 600 }}>60 seconds</div>
            <div className="text-xs text-muted">Between same-type alerts</div>
          </div>
        </div>
      </div>

      {/* Event List */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Recent Events</span>
        </div>
        {activityHistory.events.length === 0 ? (
          <p className="text-sm text-muted">No events recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activityHistory.events.slice(-10).reverse().map((e, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid var(--color-border)',
              }}>
                <span style={{
                  fontSize: 16,
                  color: e.type === 'sudden' ? '#DC2626' : e.type === 'inactive' ? '#94A3B8' : '#1A7A52',
                }}>
                  {e.type === 'sudden' ? '⚡' : e.type === 'inactive' ? '😴' : '🏃'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {e.type === 'sudden' ? 'Sudden movement (heuristic)' : e.type}
                  </div>
                  <div className="text-xs text-muted">
                    {formatDistanceToNow(new Date(e.timestampMs), { addSuffix: true })} ·
                    {e.magnitude.toFixed(2)}g · {(e.durationMs / 1000).toFixed(0)}s duration
                  </div>
                </div>
                {settings.demoMode && (
                  <span className="badge badge-demo" style={{ fontSize: '0.65rem' }}>DEMO</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityMonitoring;
