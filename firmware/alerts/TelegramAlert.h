/*
 * PawSense360 — Telegram Alert Module
 * ============================================================
 * Sends structured alert messages via Telegram Bot API.
 * Requires active Wi-Fi / internet connection on the ESP32.
 *
 * SECURITY: Bot token and chat ID are loaded from config.h,
 * which is excluded from version control (.gitignore).
 * NEVER hardcode credentials here.
 *
 * Alert types:
 *   - Device online/startup
 *   - GPS location
 *   - Abnormal biometric reading
 *   - Sudden motion event
 *   - GPS fix lost/restored
 *   - Sensor failure
 *   - SOS (manual or automatic)
 *
 * Cooldown enforcement prevents alert flooding.
 */

#ifndef TELEGRAM_ALERT_H
#define TELEGRAM_ALERT_H

#include <Arduino.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

enum AlertType {
  ALERT_STARTUP,
  ALERT_GPS_LOCATION,
  ALERT_HR_ABNORMAL,
  ALERT_SPO2_ABNORMAL,
  ALERT_SUDDEN_MOTION,
  ALERT_GPS_FIX_LOST,
  ALERT_GPS_FIX_RESTORED,
  ALERT_SENSOR_FAILURE,
  ALERT_SOS,
  ALERT_WIFI_LOST,
  ALERT_WIFI_RESTORED
};

struct AlertPayload {
  AlertType  type;
  String     deviceName;
  String     timestampUtc;
  float      heartRate;      // 0 if unavailable
  float      spo2;           // 0 if unavailable
  bool       hasGPS;
  double     latitude;
  double     longitude;
  String     mapUrl;
  String     extraInfo;      // Additional context message
};

class TelegramAlert {
public:
  TelegramAlert(const char* botToken, const char* chatId);

  // Send an alert — returns true if HTTP 200 received
  // Respects per-type cooldown to avoid flooding
  bool sendAlert(const AlertPayload& payload);

  // Force send regardless of cooldown (use for SOS only)
  bool sendAlertForced(const AlertPayload& payload);

  // Check if cooldown allows sending this alert type now
  bool canSend(AlertType type) const;

  // Set per-type cooldown in milliseconds
  void setCooldown(AlertType type, uint32_t cooldownMs);

private:
  const char* _botToken;
  const char* _chatId;
  uint32_t    _lastSentMs[11];   // One per AlertType

  static const uint32_t DEFAULT_COOLDOWN_MS = 60000;  // 1 minute default

  String _buildMessage(const AlertPayload& payload) const;
  bool   _sendHttpMessage(const String& message) const;
  String _alertTypeName(AlertType type) const;
};

#endif // TELEGRAM_ALERT_H
