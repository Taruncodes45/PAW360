// PawSense360 — Reusable metric card components

import React from 'react';
import type { DataPoint } from '../types';
import { formatDistanceToNow } from 'date-fns';

// ─── Freshness Bar ────────────────────────────────────────────────────────────
interface FreshnessBarProps { ageMs: number; maxAgeMs?: number; }
export const FreshnessBar: React.FC<FreshnessBarProps> = ({ ageMs, maxAgeMs = 30000 }) => {
  const pct = Math.max(0, 100 - (ageMs / maxAgeMs) * 100);
  const cls = pct > 60 ? 'fresh' : pct > 25 ? 'aging' : 'stale';
  return (
    <div className="freshness-bar">
      <div className={`freshness-fill ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

// ─── Data Age Label ───────────────────────────────────────────────────────────
interface DataAgeLabelProps { timestampMs: number; }
export const DataAgeLabel: React.FC<DataAgeLabelProps> = ({ timestampMs }) => {
  if (!timestampMs) return <span className="text-xs text-muted">No data</span>;
  const label = timestampMs > 0
    ? formatDistanceToNow(new Date(timestampMs), { addSuffix: true })
    : 'Never';
  return <span className="text-xs text-muted">{label}</span>;
};

// ─── Source Badge ─────────────────────────────────────────────────────────────
interface SourceBadgeProps { source: DataPoint<unknown>['source']; }
export const SourceBadge: React.FC<SourceBadgeProps> = ({ source }) => {
  const config = {
    live:        { cls: 'badge-success', label: '● LIVE' },
    cloud:       { cls: 'badge-info',    label: '☁ CLOUD' },
    cached:      { cls: 'badge-warning', label: '⏸ CACHED' },
    demo:        { cls: 'badge-demo',    label: '🟣 DEMO' },
    unavailable: { cls: 'badge-muted',   label: '— N/A' },
  }[source] ?? { cls: 'badge-muted', label: source };

  return <span className={`badge ${config.cls}`} style={{ fontSize: '0.65rem' }}>{config.label}</span>;
};

// ─── Metric Card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value?: number | string;
  unit?: string;
  icon: React.ReactNode;
  iconClass?: string;
  dataPoint?: DataPoint<number>;
  subtitle?: string;
  valid?: boolean;
  disclaimer?: string;
  children?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title, value, unit, icon, iconClass = '',
  dataPoint, subtitle, valid = true, disclaimer, children,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
        <div className={`metric-icon ${iconClass}`}>{icon}</div>
      </div>

      {children ?? (
        <div>
          {valid && value !== undefined ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="card-value">{value}</span>
              {unit && <span className="card-unit">{unit}</span>}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
              <div className="skeleton" style={{ height: 40, width: 80, borderRadius: 6 }} />
              <span className="text-muted text-sm">
                {dataPoint?.source === 'unavailable' ? 'No data' : 'Acquiring...'}
              </span>
            </div>
          )}

          {subtitle && <p className="card-subtitle">{subtitle}</p>}

          {dataPoint && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <DataAgeLabel timestampMs={dataPoint.timestampMs} />
                <SourceBadge source={dataPoint.source} />
              </div>
              <FreshnessBar ageMs={dataPoint.ageMs} />
            </div>
          )}

          {disclaimer && (
            <div style={{
              marginTop: 8, padding: '6px 10px',
              background: '#FEF3C7', borderRadius: 6,
              fontSize: '0.6875rem', color: '#92400E',
            }}>
              ⚠️ {disclaimer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Alert Count Badge ────────────────────────────────────────────────────────
export const AlertCountBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  return (
    <span style={{
      background: '#EF4444', color: 'white',
      borderRadius: '50%', width: 18, height: 18,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
    }}>
      {count > 9 ? '9+' : count}
    </span>
  );
};

// ─── No Data Card ─────────────────────────────────────────────────────────────
export const NoDataCard: React.FC<{ message?: string }> = ({
  message = 'No data available. Connect the device or enable Demo Mode.',
}) => (
  <div className="card no-data">
    <span style={{ fontSize: 32 }}>📡</span>
    <p className="text-sm text-muted">{message}</p>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, actions }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
    <div>
      <h2 style={{ marginBottom: 2 }}>{title}</h2>
      {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
  </div>
);

// ─── Sensor Row ───────────────────────────────────────────────────────────────
interface SensorRowProps { label: string; connected: boolean; note?: string; }
export const SensorRow: React.FC<SensorRowProps> = ({ label, connected, note }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 0', borderBottom: '1px solid var(--color-border)',
  }}>
    <div>
      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{label}</div>
      {note && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{note}</div>}
    </div>
    <span className={`badge ${connected ? 'badge-success' : 'badge-danger'}`}>
      {connected ? '✓ Connected' : '✗ Not Found'}
    </span>
  </div>
);
