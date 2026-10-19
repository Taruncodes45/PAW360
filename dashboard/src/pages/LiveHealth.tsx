// PawSense360 — Live Health Page

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { MetricCard, SectionHeader, SourceBadge, FreshnessBar } from '../components/MetricCard';
import { Heart, Droplets, AlertTriangle, Activity } from 'lucide-react';
import { format } from 'date-fns';

const CustomTooltip: React.FC<{ active?: boolean; payload?: unknown[]; label?: number; unit?: string }> =
  ({ active, payload, label, unit }) => {
    if (!active || !Array.isArray(payload) || !payload.length) return null;
    return (
      <div style={{
        background: 'white', border: '1px solid var(--color-border)',
        borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow-md)',
      }}>
        <div className="text-xs text-muted">{label ? format(new Date(label as number), 'HH:mm:ss') : ''}</div>
        <div style={{ fontWeight: 600 }}>{(payload[0] as { value: number }).value} {unit}</div>
      </div>
    );
  };

const LiveHealth: React.FC = () => {
  const { telemetry, healthHistory, settings } = useApp();
  const bio = telemetry?.biometric;
  const thresholds = settings.alertThresholds;

  const hrData = healthHistory.heartRate.slice(-60).map(p => ({
    time: p.timestampMs,
    value: p.value,
  }));

  const spo2Data = healthHistory.spo2.slice(-60).map(p => ({
    time: p.timestampMs,
    value: p.value,
  }));

  return (
    <div className="page-content">
      <SectionHeader
        title="Live Health"
        subtitle="Biometric sensor readings from MAX30100"
        actions={bio && <SourceBadge source={bio.heartRate.source} />}
      />

      {/* Medical disclaimer */}
      <div style={{
        background: '#FEF3C7', border: '1px solid #FDE68A',
        borderRadius: 10, padding: '12px 16px', marginBottom: 20,
        fontSize: '0.8125rem', color: '#78350F',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Experimental readings:</strong> The MAX30100 optical sensor provides{' '}
          <em>estimates only</em>. Readings may be unreliable due to fur, movement,
          poor contact, and collar placement. SpO₂ requires stable, stationary measurement.
          Do not use these values for veterinary diagnosis.
          {settings.demoMode && ' Currently showing SIMULATED demo data.'}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <MetricCard
          title="Heart Rate Estimate"
          value={bio?.heartRate.valid ? Math.round(bio.heartRate.value) : undefined}
          unit="BPM"
          icon={<Heart size={22} />}
          iconClass="heart"
          dataPoint={bio?.heartRate}
          valid={bio?.heartRate.valid}
          subtitle={`Normal dog range: 60–140 BPM · Alert range: ${thresholds.hrLow}–${thresholds.hrHigh} BPM`}
          disclaimer="Experimental estimate — not veterinary-grade"
        />

        <MetricCard
          title="SpO₂ Estimate"
          value={bio?.spo2.valid ? bio.spo2.value.toFixed(1) : undefined}
          unit="%"
          icon={<Droplets size={22} />}
          iconClass="spo2"
          dataPoint={bio?.spo2}
          valid={bio?.spo2.valid}
          subtitle={`Normal dog SpO₂: 95–100% · Alert threshold: ${thresholds.spo2Low}%`}
          disclaimer="Requires stable, stationary placement"
        />
      </div>

      {/* Signal Quality */}
      {bio && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">Signal Quality</span>
            <Activity size={16} color="var(--color-text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: bio.signalQuality > 60
                ? 'var(--color-success)'
                : bio.signalQuality > 30
                  ? 'var(--color-warning)'
                  : 'var(--color-danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.875rem',
              flexShrink: 0,
            }}>
              {bio.signalQuality}%
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {bio.signalQuality > 60 ? 'Good contact' : bio.signalQuality > 30 ? 'Fair contact' : 'Poor contact'}
              </div>
              <p className="text-xs text-muted">
                Ensure collar is snug and sensor is pressed against skin under fur.
              </p>
            </div>
          </div>
          <FreshnessBar ageMs={bio.heartRate.ageMs} />
        </div>
      )}

      {/* Temperature Notice */}
      {!settings.showTemperature && (
        <div className="card" style={{
          marginBottom: 24,
          background: 'var(--color-bg-secondary)',
          border: '1px dashed var(--color-border-strong)',
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>🌡️</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Body Temperature</div>
              <p className="text-sm text-muted">
                A dedicated contact-temperature sensor (e.g., DS18B20 or LM35) is required
                for dog body temperature monitoring. The MAX30100 is <em>not</em> a thermometer,
                and the MPU6050 die temperature is the chip's own temperature — not the dog's.
                This card will appear when a real temperature sensor is configured.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Heart Rate Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Heart Rate History (last 30 min)</span>
          <span className="badge badge-demo">{settings.demoMode ? 'DEMO DATA' : 'LIVE'}</span>
        </div>
        {hrData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hrData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="time"
                tickFormatter={v => format(new Date(v), 'HH:mm')}
                tick={{ fontSize: 11 }}
                stroke="var(--color-border)"
              />
              <YAxis domain={[40, 200]} tick={{ fontSize: 11 }} stroke="var(--color-border)" />
              <Tooltip content={<CustomTooltip unit="BPM" />} />
              <ReferenceLine y={thresholds.hrLow} stroke="#EF4444" strokeDasharray="4 4" />
              <ReferenceLine y={thresholds.hrHigh} stroke="#EF4444" strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="value"
                stroke="#DC2626" strokeWidth={2}
                dot={false} activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data"><p className="text-sm text-muted">No historical data available.</p></div>
        )}
      </div>

      {/* SpO2 Chart */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">SpO₂ History (last 30 min)</span>
          <span className="badge badge-demo">{settings.demoMode ? 'DEMO DATA' : 'LIVE'}</span>
        </div>
        {spo2Data.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={spo2Data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="time"
                tickFormatter={v => format(new Date(v), 'HH:mm')}
                tick={{ fontSize: 11 }}
                stroke="var(--color-border)"
              />
              <YAxis domain={[88, 100]} tick={{ fontSize: 11 }} stroke="var(--color-border)" />
              <Tooltip content={<CustomTooltip unit="%" />} />
              <ReferenceLine y={thresholds.spo2Low} stroke="#F59E0B" strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="value"
                stroke="#1D4ED8" strokeWidth={2}
                dot={false} activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data"><p className="text-sm text-muted">No historical data available.</p></div>
        )}
      </div>
    </div>
  );
};

export default LiveHealth;
