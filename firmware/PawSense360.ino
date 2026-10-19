/*
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           PawSense360 — Smart Dog Collar Firmware            ║
 * ║                  Version: 1.0.0                              ║
 * ║              Developer: TARUN P GOWDA                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Hardware: ESP32-WROOM-32
 * Sensors : MAX30100 (HR/SpO2), MPU6050 (Motion), Neo-6M (GPS)
 * Cloud   : Blynk IoT, Telegram Bot API
 *
 * ⚠️  BEFORE UPLOADING:
 * 1. Copy config.example.h → config.h
 * 2. Fill in your Wi-Fi, Blynk, and Telegram credentials in config.h
 * 3. config.h is gitignored — never commit it
 *
 * Library dependencies (install via Arduino Library Manager):
 *   - Blynk (by Volodymyr Shymanskyy) v1.3.2+
 *   - SparkFun MAX3010x Pulse and Proximity Sensor Library
 *   - Adafruit MPU6050 v2.2+
 *   - Adafruit Unified Sensor v1.1.9+
 *   - TinyGPS++ v1.0.3+
 *   - WiFiClientSecure (bundled with ESP32 Arduino core)
 *   - HTTPClient (bundled with ESP32 Arduino core)
 *
 * Board: ESP32 Dev Module
 * Board Manager URL: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 */

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <time.h>

// PawSense360 modules
#include "config.h"
#include "sensors/MAX30100Sensor.h"
#include "sensors/MPU6050Sensor.h"
#include "gps/GPSParser.h"
#include "cloud/BlynkClient.h"
#include "alerts/TelegramAlert.h"

// ============================================================
// GLOBAL OBJECTS
// ============================================================
MAX30100Sensor biometric;
MPU6050Sensor  motion;
GPSParser      gps;
BlynkClient    blynk;
TelegramAlert  telegram(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID);

// ============================================================
// TIMING VARIABLES (non-blocking)
// ============================================================
uint32_t lastBiometricMs   = 0;
uint32_t lastMotionMs      = 0;
uint32_t lastTelemetryMs   = 0;
uint32_t lastGPSPublishMs  = 0;
uint32_t lastWifiCheckMs   = 0;

// ============================================================
// STATE TRACKING
// ============================================================
bool previousGPSFix       = false;
bool previousWifiState    = false;
bool deviceStartupSent    = false;
bool sensorInitFailed     = false;

// ============================================================
// FORWARD DECLARATIONS
// ============================================================
void connectWiFi();
bool checkWiFi();
void printSensorDiagnostics();
void handleAlerts(const BiometricReading& bio, const MotionReading& mot);
String getTimestampUtc();
AlertPayload buildPayload(AlertType type, const BiometricReading& bio,
                          const GPSData& gpsData, const String& extra);

// ============================================================
// SETUP
// ============================================================
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(500);

  Serial.println(F("\n╔══════════════════════════════════════╗"));
  Serial.println(F("║        PawSense360 v1.0.0           ║"));
  Serial.println(F("║    Developer: TARUN P GOWDA         ║"));
  Serial.println(F("╚══════════════════════════════════════╝\n"));

  // ── I2C Setup (GPIO21=SDA, GPIO22=SCL) ──────────────────
  Wire.begin(21, 22);
  Serial.println(F("[I2C] Bus initialized on SDA=GPIO21, SCL=GPIO22"));

  // ── Sensor Initialization ────────────────────────────────
  if (DEMO_MODE) {
    Serial.println(F("[DEMO MODE] Skipping real sensor initialization."));
    Serial.println(F("[DEMO MODE] Simulated data will be used."));
  } else {
    bool max30100Ok = biometric.begin();
    bool mpu6050Ok  = motion.begin();

    if (!max30100Ok) {
      Serial.println(F("[WARN] MAX30100 not found. HR/SpO2 unavailable."));
    }
    if (!mpu6050Ok) {
      Serial.println(F("[WARN] MPU6050 not found. Motion data unavailable."));
    }

    sensorInitFailed = (!max30100Ok && !mpu6050Ok);
    if (sensorInitFailed) {
      Serial.println(F("[ERROR] No sensors initialized. Check I2C wiring."));
    }
  }

  // ── GPS Initialization ───────────────────────────────────
  if (!DEMO_MODE) {
    gps.begin(GPS_BAUD);
  }

  // ── Wi-Fi Connection ─────────────────────────────────────
  connectWiFi();

  // ── Blynk Connection ─────────────────────────────────────
  if (ENABLE_BLYNK) {
    blynk.begin(BLYNK_AUTH_TOKEN, WIFI_SSID, WIFI_PASSWORD);
  }

  // ── NTP Time Sync ────────────────────────────────────────
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  Serial.println(F("[NTP] Synchronizing time..."));

  // ── Startup Alert ────────────────────────────────────────
  if (ENABLE_TELEGRAM && !DEMO_MODE) {
    BiometricReading emptyBio = {false, 0, 0, 0, 0, "Startup"};
    GPSData emptyGPS = {};
    AlertPayload startup = buildPayload(ALERT_STARTUP, emptyBio, emptyGPS,
                                        "PawSense360 is online and monitoring.");
    telegram.sendAlertForced(startup);
    deviceStartupSent = true;
  }

  printSensorDiagnostics();
  Serial.println(F("[SYSTEM] Setup complete. Entering main loop."));
}

// ============================================================
// MAIN LOOP — Non-blocking state machine
// ============================================================
void loop() {
  uint32_t now = millis();

  // ── GPS Update (always running) ──────────────────────────
  if (!DEMO_MODE) {
    gps.update();
  }

  // ── Blynk Run ────────────────────────────────────────────
  if (ENABLE_BLYNK) {
    blynk.run();
  }

  // ── Wi-Fi Health Check ───────────────────────────────────
  if (now - lastWifiCheckMs > 10000) {
    lastWifiCheckMs = now;
    bool wifiNow = checkWiFi();

    if (!wifiNow && previousWifiState) {
      Serial.println(F("[WiFi] Connection lost. Attempting reconnect..."));
      if (ENABLE_TELEGRAM) {
        BiometricReading bio = biometric.getReading();
        GPSData gpsData = gps.getData();
        AlertPayload p = buildPayload(ALERT_WIFI_LOST, bio, gpsData, "Wi-Fi connection lost.");
        telegram.sendAlertForced(p);
      }
    } else if (wifiNow && !previousWifiState) {
      Serial.println(F("[WiFi] Connection restored."));
      if (ENABLE_TELEGRAM) {
        BiometricReading bio = biometric.getReading();
        GPSData gpsData = gps.getData();
        AlertPayload p = buildPayload(ALERT_WIFI_RESTORED, bio, gpsData, "Wi-Fi reconnected.");
        telegram.sendAlert(p);
      }
    }
    previousWifiState = wifiNow;
  }

  // ── Biometric Sensor Read ────────────────────────────────
  if (now - lastBiometricMs > BIOMETRIC_INTERVAL_MS) {
    lastBiometricMs = now;
    if (!DEMO_MODE && biometric.isConnected()) {
      biometric.update();
    }
  }

  // ── Motion Sensor Read ───────────────────────────────────
  if (now - lastMotionMs > MOTION_INTERVAL_MS) {
    lastMotionMs = now;
    if (!DEMO_MODE && motion.isConnected()) {
      motion.update();
    }
  }

  // ── Alert Logic ──────────────────────────────────────────
  if (now - lastTelemetryMs > TELEMETRY_INTERVAL_MS) {
    BiometricReading bio = biometric.getReading();
    MotionReading    mot = motion.getReading();
    handleAlerts(bio, mot);
  }

  // ── Telemetry Publish (Blynk) ────────────────────────────
  if (now - lastTelemetryMs > TELEMETRY_INTERVAL_MS) {
    lastTelemetryMs = now;

    BiometricReading bio     = biometric.getReading();
    MotionReading    mot     = motion.getReading();
    GPSData          gpsData = gps.getData();

    TelemetryPayload telem = {
      .heartRateValid    = bio.valid,
      .heartRateBPM      = bio.heartRateBPM,
      .spo2Valid         = bio.valid,
      .spo2Percent       = bio.spo2Percent,
      .gpsHasFix         = gpsData.hasFix,
      .gpsLat            = gpsData.latitude,
      .gpsLon            = gpsData.longitude,
      .activityCount     = mot.activityCount,
      .isMoving          = mot.isMoving,
      .deviceOnline      = true,
      .lastSensorUpdateMs = bio.timestampMs
    };

    if (ENABLE_BLYNK) {
      blynk.publishTelemetry(telem);
    }

    // GPS fix state change detection
    if (gpsData.hasFix && !previousGPSFix) {
      Serial.printf("[GPS] Fix acquired! Lat=%.6f Lon=%.6f Sats=%d\n",
                    gpsData.latitude, gpsData.longitude, gpsData.satellites);
      if (ENABLE_TELEGRAM) {
        AlertPayload p = buildPayload(ALERT_GPS_FIX_RESTORED, bio, gpsData, "");
        telegram.sendAlert(p);
      }
    } else if (!gpsData.hasFix && previousGPSFix && gpsData.isStale) {
      Serial.println(F("[GPS] Fix lost."));
      if (ENABLE_TELEGRAM) {
        AlertPayload p = buildPayload(ALERT_GPS_FIX_LOST, bio, gpsData, "");
        telegram.sendAlert(p);
      }
    }
    previousGPSFix = gpsData.hasFix;
  }

  // ── GPS Periodic Location Alert ──────────────────────────
  if (now - lastGPSPublishMs > GPS_PUBLISH_INTERVAL_MS) {
    lastGPSPublishMs = now;
    GPSData gpsData = gps.getData();
    if (gpsData.hasFix) {
      Serial.printf("[GPS] Lat=%.6f Lon=%.6f Speed=%.1f km/h Sats=%d\n",
                    gpsData.latitude, gpsData.longitude,
                    gpsData.speedKmh, gpsData.satellites);
    }
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

void connectWiFi() {
  if (String(WIFI_SSID).startsWith("YOUR_")) {
    Serial.println(F("[WiFi] WARNING: SSID not configured in config.h"));
    return;
  }

  Serial.printf("[WiFi] Connecting to '%s'...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_CONNECT_TIMEOUT_MS) {
      Serial.println(F("[WiFi] Connection timeout. Continuing without Wi-Fi."));
      return;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  previousWifiState = true;
}

bool checkWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    return false;
  }
  return true;
}

void handleAlerts(const BiometricReading& bio, const MotionReading& mot) {
  if (!ENABLE_TELEGRAM || DEMO_MODE) return;

  GPSData gpsData = gps.getData();

  // Heart-rate threshold alerts
  if (bio.valid) {
    if (bio.heartRateBPM < HR_LOW_THRESHOLD || bio.heartRateBPM > HR_HIGH_THRESHOLD) {
      String extra = "HR=" + String(bio.heartRateBPM, 0) + " BPM is outside configured range ["
                     + String(HR_LOW_THRESHOLD) + "–" + String(HR_HIGH_THRESHOLD) + "].";
      AlertPayload p = buildPayload(ALERT_HR_ABNORMAL, bio, gpsData, extra);
      telegram.sendAlert(p);
    }
  }

  // SpO2 threshold alerts
  if (bio.valid && bio.spo2Percent > 0 && bio.spo2Percent < SPO2_LOW_THRESHOLD) {
    String extra = "SpO2=" + String(bio.spo2Percent, 0) + "% is below threshold "
                   + String(SPO2_LOW_THRESHOLD) + "%.";
    AlertPayload p = buildPayload(ALERT_SPO2_ABNORMAL, bio, gpsData, extra);
    telegram.sendAlert(p);
  }

  // Sudden motion alert
  if (mot.valid && mot.suddenMovement) {
    String extra = "Acceleration magnitude: " + String(mot.accelMagnitude, 2) + "g";
    AlertPayload p = buildPayload(ALERT_SUDDEN_MOTION, bio, gpsData, extra);
    telegram.sendAlert(p);
  }
}

AlertPayload buildPayload(AlertType type, const BiometricReading& bio,
                           const GPSData& gpsData, const String& extra) {
  AlertPayload p;
  p.type        = type;
  p.deviceName  = DEVICE_NAME;
  p.timestampUtc = getTimestampUtc();
  p.heartRate   = bio.valid ? bio.heartRateBPM : 0.0f;
  p.spo2        = bio.valid ? bio.spo2Percent  : 0.0f;
  p.hasGPS      = gpsData.hasFix;
  p.latitude    = gpsData.latitude;
  p.longitude   = gpsData.longitude;
  p.mapUrl      = gpsData.mapUrl;
  p.extraInfo   = extra;
  return p;
}

String getTimestampUtc() {
  struct tm timeInfo;
  if (!getLocalTime(&timeInfo)) return "Time unavailable";
  char buf[32];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
  return String(buf);
}

void printSensorDiagnostics() {
  Serial.println(F("\n[DIAGNOSTICS] Sensor Status:"));
  Serial.printf("  MAX30100 (HR/SpO2): %s\n",
                DEMO_MODE ? "DEMO MODE" : (biometric.isConnected() ? "Connected" : "NOT FOUND"));
  Serial.printf("  MPU6050  (Motion) : %s\n",
                DEMO_MODE ? "DEMO MODE" : (motion.isConnected()    ? "Connected" : "NOT FOUND"));
  Serial.printf("  Neo-6M   (GPS)    : %s\n",
                DEMO_MODE ? "DEMO MODE" : "Waiting for NMEA data...");
  Serial.printf("  Blynk             : %s\n",
                ENABLE_BLYNK ? "Enabled" : "Disabled");
  Serial.printf("  Telegram          : %s\n",
                ENABLE_TELEGRAM ? "Enabled" : "Disabled");
  Serial.printf("  Demo Mode         : %s\n",
                DEMO_MODE ? "ACTIVE" : "Off");
  Serial.println();
}
