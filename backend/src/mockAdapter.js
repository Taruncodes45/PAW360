/**
 * PawSense360 — Mock Data Adapter
 * Returns simulated but realistic telemetry when Blynk is not configured.
 * Clearly labeled as mock data — never presented as real hardware data.
 */

let _tick = 0;

export class MockAdapter {
  getTelemetry() {
    _tick++;
    const now = Date.now();
    const hr  = Math.round(88 + 22 * Math.sin((_tick / 60) * Math.PI * 2));
    const spo2 = parseFloat((97.5 + 1.2 * Math.sin((_tick / 90) * Math.PI * 2)).toFixed(1));
    const isMoving = (_tick % 30) < 12;
    const lat = 12.9716 + Math.sin(_tick * 0.02) * 0.002;
    const lon = 77.5946 + Math.cos(_tick * 0.02) * 0.002;

    return {
      biometric: {
        heartRate: { value: hr, valid: true, source: 'demo', timestampMs: now, ageMs: 0 },
        spo2: { value: spo2, valid: true, source: 'demo', timestampMs: now, ageMs: 0 },
        signalQuality: 72,
      },
      gps: {
        hasFix: true, isStale: false,
        latitude:  { value: lat, valid: true, source: 'demo', timestampMs: now, ageMs: 0 },
        longitude: { value: lon, valid: true, source: 'demo', timestampMs: now, ageMs: 0 },
        speedKmh: isMoving ? 3.2 : 0, altitudeM: 900,
        satellites: 8, hdop: 1.2,
        lastFixTime: new Date(now).toISOString(),
        mapUrl: `https://maps.google.com/?q=${lat.toFixed(6)},${lon.toFixed(6)}`,
        statusMessage: 'Mock location — not real hardware data',
      },
      motion: {
        isMoving, accelMagnitude: isMoving ? 1.4 : 1.01,
        accelX: 0.05, accelY: 0.02, accelZ: 0.98,
        activityCount: _tick, suddenMovement: false, activePercent: 40,
      },
      device: {
        online: true, wifiConnected: true, blynkConnected: false,
        gpsConnected: true, max30100Connected: true, mpu6050Connected: true,
        lastTelemetryMs: now, firmwareVersion: '1.0.0',
        deviceName: 'PawSense360-001 [MOCK]', uptime: _tick * 2,
      },
      fetchedAt: now,
      dataSource: 'demo',
    };
  }
}
