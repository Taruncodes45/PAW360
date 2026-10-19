/*
 * PawSense360 — Blynk Cloud Client Implementation
 */

#include "BlynkClient.h"
#include "../config.h"

BlynkClient::BlynkClient()
  : _initialized(false), _lastPublishMs(0) {}

void BlynkClient::begin(const char* authToken,
                         const char* ssid,
                         const char* password) {
  if (!ENABLE_BLYNK) {
    Serial.println(F("[Blynk] Blynk integration disabled in config.h"));
    return;
  }

  if (String(authToken).startsWith("YOUR_")) {
    Serial.println(F("[Blynk] WARNING: Auth token not configured. "
                     "Update config.h with your Blynk auth token."));
    return;
  }

  Serial.println(F("[Blynk] Connecting to Blynk cloud..."));
  Blynk.begin(authToken, ssid, password);
  _initialized = true;
}

void BlynkClient::run() {
  if (!_initialized) return;
  Blynk.run();
}

bool BlynkClient::isConnected() const {
  return _initialized && Blynk.connected();
}

void BlynkClient::publishTelemetry(const TelemetryPayload& payload) {
  if (!isConnected()) {
    Serial.println(F("[Blynk] Not connected — skipping telemetry publish."));
    return;
  }

  publishHeartRate(payload.heartRateBPM, payload.heartRateValid);
  publishSpO2(payload.spo2Percent, payload.spo2Valid);
  publishGPS(payload.gpsLat, payload.gpsLon, payload.gpsHasFix);
  publishActivity(payload.activityCount, payload.isMoving);
  publishDeviceStatus(payload.deviceOnline);
  publishLastUpdateAge(payload.lastSensorUpdateMs);
}

void BlynkClient::publishHeartRate(float bpm, bool valid) {
  // V0: Heart rate — send -1 when invalid to indicate no valid reading
  Blynk.virtualWrite(VPIN_HEART_RATE, valid ? bpm : -1.0f);
}

void BlynkClient::publishSpO2(float percent, bool valid) {
  // V1: SpO2 — send -1 when invalid
  Blynk.virtualWrite(VPIN_SPO2, valid ? percent : -1.0f);
}

void BlynkClient::publishGPS(double lat, double lon, bool hasFix) {
  // V3, V4: Only publish real coordinates when fix is valid
  // Send 0.0 when no fix (display layer must handle this)
  Blynk.virtualWrite(VPIN_GPS_LAT, hasFix ? lat : 0.0);
  Blynk.virtualWrite(VPIN_GPS_LON, hasFix ? lon : 0.0);
  Blynk.virtualWrite(VPIN_GPS_FIX, hasFix ? 1 : 0);
}

void BlynkClient::publishActivity(uint32_t count, bool moving) {
  Blynk.virtualWrite(VPIN_ACTIVITY, count);
}

void BlynkClient::publishDeviceStatus(bool online) {
  Blynk.virtualWrite(VPIN_DEVICE_STATUS, online ? 1 : 0);
}

void BlynkClient::publishLastUpdateAge(uint32_t sensorTimestampMs) {
  uint32_t ageSeconds = (millis() - sensorTimestampMs) / 1000;
  Blynk.virtualWrite(VPIN_LAST_UPDATE, ageSeconds);
}
