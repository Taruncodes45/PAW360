/*
 * PawSense360 — Blynk Cloud Client Module
 * ============================================================
 * Publishes telemetry to Blynk IoT cloud via virtual pins.
 *
 * Virtual Pin Mapping:
 *   V0  — Heart rate (BPM, float)
 *   V1  — SpO2 estimate (%, float)
 *   V2  — RESERVED for temperature sensor (not implemented)
 *   V3  — GPS latitude (double)
 *   V4  — GPS longitude (double)
 *   V5  — Activity count / movement metric (integer)
 *   V6  — Device connection status (0=offline, 1=online)
 *   V7  — GPS fix status (0=no fix, 1=fix)
 *   V8  — RESERVED for battery voltage (not implemented)
 *   V9  — Last sensor update age in seconds (integer)
 *
 * Setup: See docs/blynk-setup.md for template and datastream creation.
 */

#ifndef BLYNK_CLIENT_H
#define BLYNK_CLIENT_H

#include <Arduino.h>

// Include Blynk library for ESP32 with Wi-Fi
// Install: Arduino IDE → Library Manager → "Blynk" by Volodymyr Shymanskyy
#define BLYNK_PRINT Serial
#include <BlynkSimpleEsp32.h>

struct TelemetryPayload {
  // Biometric — only publish when valid flag is true
  bool  heartRateValid;
  float heartRateBPM;
  bool  spo2Valid;
  float spo2Percent;

  // GPS — only publish when gpsHasFix is true
  bool   gpsHasFix;
  double gpsLat;
  double gpsLon;

  // Motion
  uint32_t activityCount;
  bool     isMoving;

  // System
  bool     deviceOnline;
  uint32_t lastSensorUpdateMs;  // millis() of most recent valid sensor read
};

class BlynkClient {
public:
  BlynkClient();

  // Initialize — call before Blynk.begin()
  void begin(const char* authToken,
             const char* ssid,
             const char* password);

  // Call in main loop — keeps Blynk connection alive
  void run();

  // Publish full telemetry payload
  void publishTelemetry(const TelemetryPayload& payload);

  // Individual publish methods
  void publishHeartRate(float bpm, bool valid);
  void publishSpO2(float percent, bool valid);
  void publishGPS(double lat, double lon, bool hasFix);
  void publishActivity(uint32_t count, bool moving);
  void publishDeviceStatus(bool online);
  void publishLastUpdateAge(uint32_t sensorTimestampMs);

  bool isConnected() const;

private:
  bool     _initialized;
  uint32_t _lastPublishMs;
};

#endif // BLYNK_CLIENT_H
