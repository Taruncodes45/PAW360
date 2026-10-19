// PawSense360 — Alerts & History Page

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SectionHeader } from '../components/MetricCard';
import type { Alert, AlertSeverity } from '../types';
import { Bell, Filter, MapPin, ExternalLink, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bg: string; icon: string }> = {
  info:     { label: 'Info',     color: '#1D4ED8', bg: '#DBEAFE', icon: 'ℹ️' },
  warning:  { label: 'Warning',  color: '#B45309', bg: '#FEF3C7', icon: '⚠️' },
  critical: { label: 'Critical', color: '#B91C1C', bg: '#FEE2E2', icon: '🚨' },
  sos:      { label: 'SOS',      color: '#FFFFFF', bg: '#DC2626', icon: '🆘' },
};

const AlertCard: React.FC<{ alert: Alert }> = ({ alert }) => {
  const sev = SEVERITY_CONFIG[alert.severity];

  return (
    <div className={`alert-item severity-${alert.severity}`} style={{
      opacity: alert.acknowledged ? 0.75 : 1,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: sev.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 16, flexShrink: 0,
      }}>
        {sev.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{alert.title}</span>
          {alert.isDemo && (
            <span className="badge badge-demo" style={{ fontSize: '0.6rem' }}>DEMO</span>
          )}
          {alert.acknowledged && (
            <span style={{ color: 'var(--color-text-muted)' }}>
              <CheckCircle size={12} />
            </span>
          )}
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: 4 }}>{alert.message}</p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="text-xs text-muted">
            🕐 {format(new Date(alert.timestampMs), 'dd MMM yyyy HH:mm:ss')}
            {' · '}{formatDistanceToNow(new Date(alert.timestampMs), { addSuffix: true })}
          </span>

          {alert.deliveryStatus && (
            <span className={`badge ${
              alert.deliveryStatus === 'sent'      ? 'badge-success'
              : alert.deliveryStatus === 'demo'   ? 'badge-demo'
              : alert.deliveryStatus === 'failed' ? 'badge-danger'
              : 'badge-muted'
            }`} style={{ fontSize: '0.65rem' }}>
              Telegram: {alert.deliveryStatus}
            </span>
          )}
        </div>

        {(alert.latitude || alert.mapUrl) && (
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={12} color="var(--color-text-muted)" />
            <code className="font-mono text-xs">
              {alert.latitude?.toFixed(5)}, {alert.longitude?.toFixed(5)}
            </code>
            {alert.mapUrl && (
              <a href={alert.mapUrl} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                <ExternalLink size={11} /> Map
              </a>
            )}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0 }}>
        <span className="badge" style={{
          background: sev.bg, color: sev.color, fontSize: '0.65rem',
        }}>
          {sev.label}
        </span>
      </div>
    </div>
  );
};

const AlertsHistory: React.FC = () => {
  const { alerts, settings } = useApp();
  const [filterType, setFilterType] = useState<AlertSeverity | 'all'>('all');
  const [filterDemo, setFilterDemo] = useState<boolean | 'all'>('all');

  const filtered = alerts.filter(a => {
    const severityOk = filterType === 'all' || a.severity === filterType;
    const demoOk = filterDemo === 'all' || a.isDemo === filterDemo;
    return severityOk && demoOk;
  });

  const counts = {
    total: alerts.length,
    unacked: alerts.filter(a => !a.acknowledged).length,
    critical: alerts.filter(a => a.severity === 'critical' || a.severity === 'sos').length,
  };

  return (
    <div className="page-content">
      <SectionHeader
        title="Alerts & History"
        subtitle="Event log with severity, delivery status, and location data"
        actions={
          <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem' }}>
            <span className="badge badge-danger">{counts.unacked} unread</span>
            <span className="badge badge-muted">{counts.total} total</span>
          </div>
        }
      />

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={16} color="var(--color-text-muted)" />
          <span className="text-sm text-muted">Severity:</span>
          {(['all', 'info', 'warning', 'critical', 'sos'] as const).map(s => (
            <button
              key={s}
              className={`btn btn-sm ${filterType === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 12px', textTransform: 'capitalize' }}
              onClick={() => setFilterType(s as AlertSeverity | 'all')}
            >
              {s}
            </button>
          ))}
          <span className="text-sm text-muted" style={{ marginLeft: 8 }}>Source:</span>
          {([['all', 'All'], [false, 'Live'], [true, 'Demo']] as const).map(([v, label]) => (
            <button
              key={String(v)}
              className={`btn btn-sm ${filterDemo === v ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 12px' }}
              onClick={() => setFilterDemo(v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Demo notice */}
      {settings.demoMode && (
        <div style={{
          background: '#F3E8FF', border: '1px solid #E9D5FF',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontSize: '0.8125rem', color: '#5B21B6',
        }}>
          🟣 All alerts below are <strong>simulated demo events</strong>. Real Telegram notifications will
          not be sent in Demo Mode.
        </div>
      )}

      {/* Alert List */}
      {filtered.length === 0 ? (
        <div className="card no-data">
          <Bell size={36} style={{ opacity: 0.3 }} />
          <p className="text-sm text-muted">No alerts match the current filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(a => <AlertCard key={a.id} alert={a} />)}
        </div>
      )}

      {/* Legend */}
      <div className="card" style={{ marginTop: 20, background: 'var(--color-bg-secondary)' }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Alert Delivery Notes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['sent',      'badge-success', 'Telegram message confirmed received.'],
            ['failed',    'badge-danger',  'Telegram delivery failed. Check bot token and internet.'],
            ['suppressed','badge-muted',   'Alert generated but suppressed by cooldown.'],
            ['demo',      'badge-demo',    'Simulated alert — no real message sent.'],
            ['pending',   'badge-warning', 'Message queued but delivery not yet confirmed.'],
          ].map(([status, cls, desc]) => (
            <div key={status} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className={`badge ${cls}`} style={{ fontSize: '0.65rem', width: 80, justifyContent: 'center' }}>
                {status}
              </span>
              <span className="text-xs text-muted">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertsHistory;
