// PawSense360 — Telemetry Service
// Routes data fetching to either live backend or demo generator.
// The DataSource determines what the UI displays — never silently falls back.

import type { TelemetrySnapshot, HealthHistory, ActivityHistory, Alert, AppSettings } from '../types';
import {
  generateDemoTelemetry,
  generateDemoHealthHistory,
  generateDemoActivityHistory,
  generateDemoAlerts,
} from './demoData';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Telemetry ──────────────────────────────────────────────────────────────

export async function fetchTelemetry(settings: AppSettings): Promise<TelemetrySnapshot> {
  if (settings.demoMode) {
    // Simulate network delay in demo mode
    await new Promise(r => setTimeout(r, 150 + Math.random() * 100));
    return generateDemoTelemetry();
  }

  try {
    const data = await fetchJson<TelemetrySnapshot>('/api/telemetry');
    return data;
  } catch (err) {
    console.warn('[TelemetryService] Live fetch failed:', err);
    // Return unavailable state — do NOT silently return demo data
    return buildUnavailableSnapshot();
  }
}

// ─── Health History ─────────────────────────────────────────────────────────

export async function fetchHealthHistory(settings: AppSettings): Promise<HealthHistory> {
  if (settings.demoMode) {
    await new Promise(r => setTimeout(r, 100));
    return generateDemoHealthHistory();
  }
  try {
    return await fetchJson<HealthHistory>('/api/history/health');
  } catch {
    return { heartRate: [], spo2: [] };
  }
}

// ─── Activity History ───────────────────────────────────────────────────────

export async function fetchActivityHistory(settings: AppSettings): Promise<ActivityHistory> {
  if (settings.demoMode) {
    await new Promise(r => setTimeout(r, 100));
    return generateDemoActivityHistory();
  }
  try {
    return await fetchJson<ActivityHistory>('/api/history/activity');
  } catch {
    return { events: [] };
  }
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export async function fetchAlerts(settings: AppSettings): Promise<Alert[]> {
  if (settings.demoMode) {
    await new Promise(r => setTimeout(r, 100));
    return generateDemoAlerts();
  }
  try {
    return await fetchJson<Alert[]>('/api/alerts');
  } catch {
    return [];
  }
}

// ─── Settings ───────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'pawsense360_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true' || true,
  deviceName: 'PawSense360-001',
  refreshIntervalMs: 3000,
  blynkAuthToken: '',
  telegramConfigured: false,
  alertThresholds: {
    hrLow: 40,
    hrHigh: 180,
    spo2Low: 90,
    suddenMotionG: 2.5,
  },
  showTemperature: false,  // Disabled until real temperature sensor is wired
};

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    // Ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  // Strip auth token before saving to localStorage (never persist secrets in browser storage)
  const safe = { ...settings, blynkAuthToken: '' };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUnavailableSnapshot(): TelemetrySnapshot {
  const now = Date.now();
  const makeUnavailable = (v: number) => ({
    value: v,
    valid: false,
    source: 'unavailable' as const,
    timestampMs: now,
    ageMs: 0,
  });

  return {
    biometric: {
      heartRate: makeUnavailable(0),
      spo2: makeUnavailable(0),
      signalQuality: 0,
    },
    gps: {
      hasFix: false,
      isStale: true,
      latitude: makeUnavailable(0),
      longitude: makeUnavailable(0),
      speedKmh: 0,
      altitudeM: 0,
      satellites: 0,
      hdop: 99,
      lastFixTime: '',
      mapUrl: '',
      statusMessage: 'Backend unavailable',
    },
    motion: {
      isMoving: false,
      accelMagnitude: 0,
      accelX: 0, accelY: 0, accelZ: 0,
      activityCount: 0,
      suddenMovement: false,
      activePercent: 0,
    },
    device: {
      online: false,
      wifiConnected: false,
      blynkConnected: false,
      gpsConnected: false,
      max30100Connected: false,
      mpu6050Connected: false,
      lastTelemetryMs: 0,
      firmwareVersion: 'Unknown',
      deviceName: 'PawSense360',
      uptime: 0,
    },
    fetchedAt: now,
    dataSource: 'unavailable',
  };
}
