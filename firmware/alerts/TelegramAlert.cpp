/*
 * PawSense360 — Telegram Alert Implementation
 */

#include "TelegramAlert.h"
#include <Arduino.h>

// Telegram Bot API endpoint
static const char* TELEGRAM_API_HOST = "api.telegram.org";
static const int   TELEGRAM_API_PORT = 443;

TelegramAlert::TelegramAlert(const char* botToken, const char* chatId)
  : _botToken(botToken), _chatId(chatId) {
  // Initialize all cooldown timestamps to 0 (allow first send immediately)
  for (int i = 0; i < 11; i++) _lastSentMs[i] = 0;
}

bool TelegramAlert::canSend(AlertType type) const {
  uint32_t now = millis();
  return (now - _lastSentMs[(int)type]) >= DEFAULT_COOLDOWN_MS;
}

void TelegramAlert::setCooldown(AlertType type, uint32_t cooldownMs) {
  // Store custom cooldown — simplified: just adjust last sent time
  // For full implementation use a separate cooldownMs array per type
  (void)type; (void)cooldownMs;
}

bool TelegramAlert::sendAlert(const AlertPayload& payload) {
  if (!canSend(payload.type)) {
    Serial.printf("[Telegram] Alert '%s' suppressed (cooldown active).\n",
                  _alertTypeName(payload.type).c_str());
    return false;
  }
  return sendAlertForced(payload);
}

bool TelegramAlert::sendAlertForced(const AlertPayload& payload) {
  String message = _buildMessage(payload);
  bool   success = _sendHttpMessage(message);

  if (success) {
    _lastSentMs[(int)payload.type] = millis();
    Serial.printf("[Telegram] Alert '%s' sent successfully.\n",
                  _alertTypeName(payload.type).c_str());
  } else {
    Serial.printf("[Telegram] ERROR: Failed to send alert '%s'. "
                  "Check internet connectivity and bot token.\n",
                  _alertTypeName(payload.type).c_str());
  }
  return success;
}

String TelegramAlert::_buildMessage(const AlertPayload& payload) const {
  String msg = "🐾 *PawSense360 — " + _alertTypeName(payload.type) + "*\n";
  msg += "━━━━━━━━━━━━━━━━━━\n";
  msg += "📟 Device: `" + payload.deviceName + "`\n";
  msg += "🕐 Time: " + payload.timestampUtc + "\n";

  // Biometric data
  if (payload.heartRate > 0) {
    msg += "❤️ Heart Rate: " + String(payload.heartRate, 0) + " BPM _(experimental)_\n";
  }
  if (payload.spo2 > 0) {
    msg += "🩸 SpO₂: " + String(payload.spo2, 0) + "% _(experimental)_\n";
  }

  // GPS data
  if (payload.hasGPS) {
    msg += "📍 Location: " + String(payload.latitude, 6) + ", "
                           + String(payload.longitude, 6) + "\n";
    if (payload.mapUrl.length() > 0) {
      msg += "🗺️ [Open in Google Maps](" + payload.mapUrl + ")\n";
    }
  } else {
    msg += "📍 GPS: No valid fix available\n";
  }

  // Extra context
  if (payload.extraInfo.length() > 0) {
    msg += "ℹ️ " + payload.extraInfo + "\n";
  }

  // Alert-specific notes
  switch (payload.type) {
    case ALERT_STARTUP:
      msg += "\n✅ PawSense360 is online and monitoring.";
      break;
    case ALERT_SOS:
      msg += "\n🚨 *SOS TRIGGERED — Please check on your pet immediately!*";
      break;
    case ALERT_HR_ABNORMAL:
      msg += "\n⚠️ Heart-rate reading is outside configured threshold.";
      msg += "\n_Note: MAX30100 readings are experimental estimates._";
      break;
    case ALERT_SUDDEN_MOTION:
      msg += "\n⚠️ Sudden movement detected. This is a heuristic indicator only.";
      msg += "\n_Not a diagnosis of distress or medical condition._";
      break;
    case ALERT_GPS_FIX_LOST:
      msg += "\n📡 GPS fix lost. Last known location may be shown on dashboard.";
      break;
    default:
      break;
  }

  return msg;
}

bool TelegramAlert::_sendHttpMessage(const String& message) const {
  // Validate that credentials are configured (not placeholder values)
  if (String(_botToken).startsWith("YOUR_") ||
      String(_chatId).startsWith("YOUR_")) {
    Serial.println(F("[Telegram] WARNING: Bot token or chat ID not configured. "
                     "Update config.h with real credentials."));
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();  // For production: load Telegram CA certificate

  HTTPClient https;
  String url = "https://api.telegram.org/bot" + String(_botToken) + "/sendMessage";

  if (!https.begin(client, url)) {
    Serial.println(F("[Telegram] ERROR: HTTPS connection failed."));
    return false;
  }

  https.addHeader("Content-Type", "application/json");

  // URL-encode not needed — sending JSON body
  String body = "{\"chat_id\":\"" + String(_chatId) + "\","
                + "\"text\":\"" + message + "\","
                + "\"parse_mode\":\"Markdown\","
                + "\"disable_web_page_preview\":false}";

  int httpCode = https.POST(body);
  https.end();

  if (httpCode == 200) {
    return true;
  } else {
    Serial.printf("[Telegram] HTTP error: %d\n", httpCode);
    return false;
  }
}

String TelegramAlert::_alertTypeName(AlertType type) const {
  switch (type) {
    case ALERT_STARTUP:           return "Device Online";
    case ALERT_GPS_LOCATION:      return "GPS Location Update";
    case ALERT_HR_ABNORMAL:       return "Abnormal Heart Rate";
    case ALERT_SPO2_ABNORMAL:     return "Low SpO₂ Estimate";
    case ALERT_SUDDEN_MOTION:     return "Sudden Motion Event";
    case ALERT_GPS_FIX_LOST:      return "GPS Fix Lost";
    case ALERT_GPS_FIX_RESTORED:  return "GPS Fix Restored";
    case ALERT_SENSOR_FAILURE:    return "Sensor Failure";
    case ALERT_SOS:               return "SOS EMERGENCY";
    case ALERT_WIFI_LOST:         return "Wi-Fi Disconnected";
    case ALERT_WIFI_RESTORED:     return "Wi-Fi Reconnected";
    default:                      return "Alert";
  }
}
