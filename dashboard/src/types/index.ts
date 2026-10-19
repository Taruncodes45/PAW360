// PawSense360 — Shared TypeScript types for the entire dashboard

// ─── Telemetry Data Types ─────────────────────────────────────────────────────

export type DataSourceTag = 'live' | 'cloud' | 'cached' | 'demo' | 'unavailable';

export interface DataPoint<T> {
  value: T;
  valid: boolean;
  source: DataSourceTag;
  timestampMs: number;   // Unix timestamp in ms
  ageMs: number;         // How old the reading is
}

export interface BiometricData {
  heartRate: DataPoint<number>;   // BPM
  spo2: DataPoint<number>;        // %
  signalQuality: number;          // 0–100 heuristic
}

export interface GPSData {
  hasFix: boolean;
  isStale: boolean;
  latitude: DataPoint<number>;
  longitude: DataPoint<number>;
  speedKmh: number;
  altitudeM: number;
  satellites: number;
  hdop: number;
  lastFixTime: string;            // ISO string
  mapUrl: string;
  statusMessage: string;
  lastKnown?: {
    latitude: number;
    longitude: number;
    timestampMs: number;
  };
}

export interface MotionData {
  isMoving: boolean;
  accelMagnitude: number;         // g
  accelX: number;
  accelY: number;
  accelZ: number;
  activityCount: number;
  suddenMovement: boolean;
  activePercent: number;          // % of last window in active state
}

export interface DeviceStatus {
  online: boolean;
  wifiConnected: boolean;
  blynkConnected: boolean;
  gpsConnected: boolean;
  max30100Connected: boolean;
  mpu6050Connected: boolean;
  lastTelemetryMs: number;
  firmwareVersion: string;
  deviceName: string;
  uptime: number;                 // seconds
}

export interface TelemetrySnapshot {
  biometric: BiometricData;
  gps: GPSData;
  motion: MotionData;
  device: DeviceStatus;
  fetchedAt: number;              // Unix ms when dashboard fetched this
  dataSource: DataSourceTag;
}

// ─── Alert Types ──────────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'sos';
export type AlertType =
  | 'device_online'
  | 'gps_location'
  | 'hr_abnormal'
  | 'spo2_abnormal'
  | 'sudden_motion'
  | 'gps_fix_lost'
  | 'gps_fix_restored'
  | 'sensor_failure'
  | 'sos'
  | 'wifi_lost'
  | 'wifi_restored'
  | 'demo_event';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestampMs: number;
  acknowledged: boolean;
  isDemo: boolean;
  heartRate?: number;
  spo2?: number;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  deliveryStatus?: 'sent' | 'failed' | 'pending' | 'suppressed' | 'demo';
}

// ─── Settings Types ───────────────────────────────────────────────────────────

export interface AlertThresholds {
  hrLow: number;
  hrHigh: number;
  spo2Low: number;
  suddenMotionG: number;
}

export interface AppSettings {
  demoMode: boolean;
  deviceName: string;
  refreshIntervalMs: number;
  blynkAuthToken: string;         // Never displayed in full — masked
  telegramConfigured: boolean;
  alertThresholds: AlertThresholds;
  showTemperature: boolean;       // Only when real sensor is wired
}

// ─── Historical Data ──────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  timestampMs: number;
  value: number | null;
}

export interface HealthHistory {
  heartRate: TimeSeriesPoint[];
  spo2: TimeSeriesPoint[];
}

export interface ActivityHistory {
  events: Array<{
    timestampMs: number;
    type: 'moving' | 'sudden' | 'inactive';
    durationMs: number;
    magnitude: number;
  }>;
}
