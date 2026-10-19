// PawSense360 — Demo Mode Data Generator
// Produces realistic, clearly-labeled simulated telemetry data.
// NEVER silently replaces live data — always tagged as 'demo' source.

import type { TelemetrySnapshot, Alert, HealthHistory, ActivityHistory, AlertType, AlertSeverity } from '../types';

let _tick = 0;
let _activityCount = 0;

// Deterministic sine-wave based simulation with realistic dog values
function sinWave(base: number, amplitude: number, period: number, phase = 0): number {
  return base + amplitude * Math.sin(((_tick / period) * Math.PI * 2) + phase);
}

function jitter(value: number, range: number): number {
  return value + (Math.random() - 0.5) * range;
}

export function generateDemoTelemetry(): TelemetrySnapshot {
  _tick++;
  const now = Date.now();

  // Simulated heart rate: dog normal 60–140 BPM, slowly oscillates
  const hr = Math.round(jitter(sinWave(90, 25, 120), 3));
  // Simulated SpO2: dog normal 95–99%
  const spo2 = parseFloat(jitter(sinWave(97.5, 1.5, 180, 0.5), 0.3).toFixed(1));
  // Motion: periodically active
  const isMoving = (_tick % 30) < 12;
  const magnitude = isMoving ? jitter(1.4, 0.4) : jitter(1.01, 0.05);
  if (isMoving) _activityCount++;

  // GPS: demo coordinates near Bengaluru, India (Tarun's city)
  const baseLat = 12.9716;
  const baseLon = 77.5946;
  const gpsLat = baseLat + Math.sin(_tick * 0.02) * 0.002;
  const gpsLon = baseLon + Math.cos(_tick * 0.02) * 0.002;

  return {
    biometric: {
      heartRate: {
        value: hr,
        valid: true,
        source: 'demo',
        timestampMs: now,
        ageMs: 0,
      },
      spo2: {
        value: spo2,
        valid: true,
        source: 'demo',
        timestampMs: now,
        ageMs: 0,
      },
      signalQuality: 72,
    },
    gps: {
      hasFix: true,
      isStale: false,
      latitude: { value: gpsLat, valid: true, source: 'demo', timestampMs: now, ageMs: 0 },
      longitude: { value: gpsLon, valid: true, source: 'demo', timestampMs: now, ageMs: 0 },
      speedKmh: isMoving ? jitter(3.5, 1) : 0,
      altitudeM: 900,
      satellites: 8,
      hdop: 1.2,
      lastFixTime: new Date(now).toISOString(),
      mapUrl: `https://maps.google.com/?q=${gpsLat.toFixed(6)},${gpsLon.toFixed(6)}`,
      statusMessage: 'Fix acquired (DEMO)',
    },
    motion: {
      isMoving,
      accelMagnitude: magnitude,
      accelX: jitter(0.05, 0.1),
      accelY: jitter(0.02, 0.1),
      accelZ: jitter(0.98, 0.05),
      activityCount: _activityCount,
      suddenMovement: (_tick % 200 === 0),  // Rare sudden event
      activePercent: 40,
    },
    device: {
      online: true,
      wifiConnected: true,
      blynkConnected: false,
      gpsConnected: true,
      max30100Connected: true,
      mpu6050Connected: true,
      lastTelemetryMs: now,
      firmwareVersion: '1.0.0',
      deviceName: 'PawSense360-001 [DEMO]',
      uptime: _tick * 2,
    },
    fetchedAt: now,
    dataSource: 'demo',
  };
}

// Generate a realistic history for charts
export function generateDemoHealthHistory(): HealthHistory {
  const now = Date.now();
  const hrHistory = Array.from({ length: 60 }, (_, i) => ({
    timestampMs: now - (60 - i) * 30000,
    value: Math.round(sinWave(88, 22, 40) + jitter(0, 5)),
  }));
  const spo2History = Array.from({ length: 60 }, (_, i) => ({
    timestampMs: now - (60 - i) * 30000,
    value: parseFloat((sinWave(97.5, 1.2, 60) + jitter(0, 0.3)).toFixed(1)),
  }));
  return { heartRate: hrHistory, spo2: spo2History };
}

export function generateDemoActivityHistory(): ActivityHistory {
  const now = Date.now();
  const events = Array.from({ length: 20 }, (_, i) => ({
    timestampMs: now - (20 - i) * 180000,
    type: i % 7 === 0 ? 'sudden' : i % 3 === 0 ? 'inactive' : 'moving',
    durationMs: Math.random() * 60000 + 5000,
    magnitude: 0.8 + Math.random() * 1.5,
  })) as ActivityHistory['events'];
  return { events };
}

const DEMO_ALERT_TEMPLATES: Array<{
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
}> = [
  {
    type: 'device_online',
    severity: 'info',
    title: 'Device Online',
    message: 'PawSense360 connected successfully. All sensors initializing.',
  },
  {
    type: 'sudden_motion',
    severity: 'warning',
    title: 'Sudden Movement Detected',
    message: 'Acceleration spike of 3.2g detected. This is a heuristic indicator only — not a medical diagnosis.',
  },
  {
    type: 'gps_location',
    severity: 'info',
    title: 'GPS Location Update',
    message: 'Valid GPS fix obtained. 8 satellites visible.',
  },
  {
    type: 'hr_abnormal',
    severity: 'warning',
    title: 'Heart Rate Outside Range',
    message: 'Estimated HR 165 BPM — above configured threshold of 140 BPM. Readings are experimental.',
  },
  {
    type: 'gps_fix_lost',
    severity: 'warning',
    title: 'GPS Fix Lost',
    message: 'GPS satellite fix lost. Displaying last known location.',
  },
];

export function generateDemoAlerts(): Alert[] {
  const now = Date.now();
  return DEMO_ALERT_TEMPLATES.map((t, i) => ({
    id: `demo-alert-${i}`,
    type: t.type,
    severity: t.severity,
    title: t.title,
    message: t.message,
    timestampMs: now - i * 600000,
    acknowledged: i > 2,
    isDemo: true,
    heartRate: t.type === 'hr_abnormal' ? 165 : undefined,
    spo2: undefined,
    latitude: 12.9716,
    longitude: 77.5946,
    mapUrl: 'https://maps.google.com/?q=12.9716,77.5946',
    deliveryStatus: 'demo',
  }));
}
