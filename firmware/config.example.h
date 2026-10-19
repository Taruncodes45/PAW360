/*
 * PawSense360 — Firmware Configuration Template
 * ============================================================
 * INSTRUCTIONS:
 * 1. Copy this file to "config.h" in the same firmware directory.
 * 2. Fill in your real credentials in config.h.
 * 3. config.h is listed in .gitignore — NEVER commit it.
 * 4. This template (config.example.h) is safe to commit.
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================
// DEVICE IDENTITY
// ============================================================
#define DEVICE_NAME       "PawSense360-001"
#define FIRMWARE_VERSION  "1.0.0"

// ============================================================
// WI-FI CREDENTIALS  —  REPLACE WITH YOUR VALUES IN config.h
// ============================================================
#define WIFI_SSID         "YOUR_WIFI_SSID"
#define WIFI_PASSWORD     "YOUR_WIFI_PASSWORD"

// Maximum time to wait for a Wi-Fi connection (milliseconds)
#define WIFI_CONNECT_TIMEOUT_MS  15000

// ============================================================
// BLYNK IOT CONFIGURATION
// ============================================================
#define BLYNK_TEMPLATE_ID   "YOUR_BLYNK_TEMPLATE_ID"
#define BLYNK_TEMPLATE_NAME "PawSense360"
#define BLYNK_AUTH_TOKEN    "YOUR_BLYNK_AUTH_TOKEN"

// ============================================================
// TELEGRAM BOT CONFIGURATION
// ============================================================
#define TELEGRAM_BOT_TOKEN  "YOUR_BOT_TOKEN:HERE"
#define TELEGRAM_CHAT_ID    "YOUR_CHAT_ID"

// ============================================================
// VIRTUAL PIN MAPPING (Blynk)
// ============================================================
#define VPIN_HEART_RATE       V0
#define VPIN_SPO2             V1
// V2 reserved for temperature — only assign when a real sensor is wired
#define VPIN_GPS_LAT          V3
#define VPIN_GPS_LON          V4
#define VPIN_ACTIVITY         V5
#define VPIN_DEVICE_STATUS    V6
#define VPIN_GPS_FIX          V7
// V8 reserved for battery voltage — only assign when measurement circuit exists
#define VPIN_LAST_UPDATE      V9

// ============================================================
// SAMPLING INTERVALS (milliseconds)
// ============================================================
#define BIOMETRIC_INTERVAL_MS   2000    // MAX30100 read interval
#define MOTION_INTERVAL_MS       500    // MPU6050 read interval
#define GPS_PUBLISH_INTERVAL_MS 10000   // GPS Blynk publish interval
#define TELEMETRY_INTERVAL_MS   5000    // General telemetry publish
#define TELEGRAM_COOLDOWN_MS   60000   // Minimum time between same-type alerts

// ============================================================
// ALERT THRESHOLDS (configurable per dog)
// ============================================================
#define HR_LOW_THRESHOLD        40     // BPM — below this triggers low-HR alert
#define HR_HIGH_THRESHOLD      180     // BPM — above this triggers high-HR alert
#define SPO2_LOW_THRESHOLD      90     // % — below this triggers low-SpO2 alert
#define SUDDEN_MOTION_THRESHOLD 2.5f   // g — acceleration magnitude above this triggers alert

// ============================================================
// SENSOR TIMEOUTS
// ============================================================
#define SENSOR_STALE_MS        30000   // Data older than this is considered stale
#define GPS_FIX_TIMEOUT_MS    120000   // Report GPS-fix-lost after this duration

// ============================================================
// SERIAL BAUD RATE
// ============================================================
#define SERIAL_BAUD   115200
#define GPS_BAUD        9600

// ============================================================
// ENABLE FLAGS
// ============================================================
#define ENABLE_BLYNK       true
#define ENABLE_TELEGRAM    true
#define DEMO_MODE          false  // Set true to skip real sensor init

#endif // CONFIG_H
