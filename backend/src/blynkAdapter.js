/**
 * PawSense360 — Blynk API Adapter
 * Reads virtual pins from Blynk and maps them to TelemetrySnapshot format.
 * Auth token stays server-side — never exposed to browser.
 */

const BLYNK_API = 'https://blynk.cloud/external/api';

/**
 * Read multiple Blynk virtual pins in one call.
 * @param {string} token - Blynk auth token (from server env, never from browser)
 */
export async function readBlynkPins(token) {
  const pins = [0, 1, 3, 4, 5, 6, 7, 9];  // V0–V9 (excluding reserved V2, V8)

  const results = await Promise.allSettled(
    pins.map(async pin => {
      const url = `${BLYNK_API}/get?token=${token}&pin=V${pin}`;
      const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`Blynk V${pin}: HTTP ${res.status}`);
      const data = await res.json();
      return { pin: `V${pin}`, value: data[0] };
    })
  );

  const pinValues = {};
  for (const result of results) {
    if (result.status === 'fulfilled') {
      pinValues[result.value.pin] = result.value.value;
    }
  }
  return pinValues;
}

/**
 * Map Blynk pin values to TelemetrySnapshot.
 * Validates each field — returns null/invalid states for missing/bad data.
 */
export function buildTelemetrySnapshot(pins) {
  const now = Date.now();

  const hrRaw   = parseFloat(pins['V0']);
  const spo2Raw = parseFloat(pins['V1']);
  const latRaw  = parseFloat(pins['V3']);
  const lonRaw  = parseFloat(pins['V4']);
  const actRaw  = parseInt(pins['V5']) || 0;
  const online  = parseInt(pins['V6']) === 1;
  const gpsFix  = parseInt(pins['V7']) === 1;
  const ageRaw  = parseInt(pins['V9']) || 0;

  // Validate HR (plausible dog range 40–250 BPM)
  const hrValid = !isNaN(hrRaw) && hrRaw > 0 && hrRaw >= 40 && hrRaw <= 250;
  // Validate SpO2 (plausible 70–100%)
  const spo2Valid = !isNaN(spo2Raw) && spo2Raw > 0 && spo2Raw >= 70 && spo2Raw <= 100;
  // Validate GPS coords (non-zero, plausible range)
  const gpsValid = gpsFix &&
    !isNaN(latRaw) && Math.abs(latRaw) > 0.001 && Math.abs(latRaw) <= 90 &&
    !isNaN(lonRaw) && Math.abs(lonRaw) > 0.001 && Math.abs(lonRaw) <= 180;

  const lastSensorMs = now - (ageRaw * 1000);
  const isStale = ageRaw > 30;

  return {
    biometric: {
      heartRate: {
        value: hrValid ? hrRaw : 0,
        valid: hrValid,
        source: online ? 'live' : 'cloud',
        timestampMs: lastSensorMs,
        ageMs: ageRaw * 1000,
      },
      spo2: {
        value: spo2Valid ? spo2Raw : 0,
        valid: spo2Valid,
        source: online ? 'live' : 'cloud',
        timestampMs: lastSensorMs,
        ageMs: ageRaw * 1000,
      },
      signalQuality: hrValid ? 70 : 0,
    },
    gps: {
      hasFix: gpsValid,
      isStale,
      latitude:  { value: gpsValid ? latRaw : 0, valid: gpsValid, source: 'cloud', timestampMs: now, ageMs: 0 },
      longitude: { value: gpsValid ? lonRaw : 0, valid: gpsValid, source: 'cloud', timestampMs: now, ageMs: 0 },
      speedKmh: 0,
      altitudeM: 0,
      satellites: 0,
      hdop: 99,
      lastFixTime: gpsValid ? new Date(now).toISOString() : '',
      mapUrl: gpsValid
        ? `https://maps.google.com/?q=${latRaw.toFixed(6)},${lonRaw.toFixed(6)}`
        : '',
      statusMessage: gpsValid ? 'Fix via Blynk' : 'No valid GPS data from Blynk',
    },
    motion: {
      isMoving: actRaw > 0,
      accelMagnitude: 0,
      accelX: 0, accelY: 0, accelZ: 0,
      activityCount: actRaw,
      suddenMovement: false,
      activePercent: 0,
    },
    device: {
      online,
      wifiConnected: online,
      blynkConnected: online,
      gpsConnected: gpsValid,
      max30100Connected: hrValid,
      mpu6050Connected: true,
      lastTelemetryMs: lastSensorMs,
      firmwareVersion: '1.0.0',
      deviceName: 'PawSense360-001',
      uptime: 0,
    },
    fetchedAt: now,
    dataSource: online ? 'live' : 'cloud',
  };
}
