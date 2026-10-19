/*
 * PawSense360 — GPS Parser Implementation
 * ============================================================
 * Parses Neo-6M NMEA output via ESP32 Hardware UART2.
 *
 * Pin connections:
 *   Neo-6M TX  →  ESP32 GPIO16 (RX2)
 *   Neo-6M RX  →  ESP32 GPIO17 (TX2)  [optional]
 *   Neo-6M VCC →  3.3V
 *   Neo-6M GND →  GND
 *
 * GPS antenna must have a clear view of sky.
 * Avoid metallic enclosures that block satellite signals.
 */

#include "GPSParser.h"
#include "../config.h"

GPSParser::GPSParser()
  : _lastCharMs(0), _receivingChars(false) {
  _current   = {false, false, 0.0, 0.0, 0, 0, 0, 0, 99.9f, 0, 0, "", "", "Not started"};
  _lastKnown = _current;
}

void GPSParser::begin(uint32_t baudRate) {
  GPS_SERIAL.begin(baudRate, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println(F("[GPS] UART2 initialized for Neo-6M GPS module."));
  Serial.printf("[GPS] RX=GPIO%d, TX=GPIO%d, Baud=%d\n",
                GPS_RX_PIN, GPS_TX_PIN, baudRate);
  Serial.println(F("[GPS] Waiting for satellite fix — may take 30–120 seconds outdoors."));
}

void GPSParser::update() {
  uint32_t now = millis();

  // Feed all available NMEA characters to TinyGPS++
  while (GPS_SERIAL.available() > 0) {
    char c = GPS_SERIAL.read();
    _gps.encode(c);
    _lastCharMs      = now;
    _receivingChars  = true;
  }

  // Mark as not receiving if no chars in 5 seconds
  if (_receivingChars && (now - _lastCharMs > 5000)) {
    _receivingChars = false;
    Serial.println(F("[GPS] WARNING: No NMEA data received for 5 seconds. "
                     "Check wiring and power."));
  }

  _refreshStatus();
}

void GPSParser::_refreshStatus() {
  uint32_t now = millis();
  _current.lastUpdateMs = now;

  bool newFix = _gps.location.isValid() && _gps.location.isUpdated();

  if (newFix) {
    _current.hasFix    = true;
    _current.isStale   = false;
    _current.latitude  = _gps.location.lat();
    _current.longitude = _gps.location.lng();
    _current.lastFixMs = now;

    if (_gps.speed.isValid())     _current.speedKmh   = _gps.speed.kmph();
    if (_gps.altitude.isValid())  _current.altitudeM  = _gps.altitude.meters();
    if (_gps.satellites.isValid()) _current.satellites = _gps.satellites.value();
    if (_gps.hdop.isValid())      _current.hdop       = _gps.hdop.value();

    // Build UTC time string
    if (_gps.time.isValid() && _gps.date.isValid()) {
      char buf[32];
      snprintf(buf, sizeof(buf), "%04d-%02d-%02dT%02d:%02d:%02dZ",
               _gps.date.year(), _gps.date.month(),  _gps.date.day(),
               _gps.time.hour(), _gps.time.minute(), _gps.time.second());
      _current.lastFixTime = String(buf);
    }

    _current.mapUrl = buildMapUrl(_current.latitude, _current.longitude);
    _current.statusMessage = "Fix acquired";

    // Persist as last known
    _lastKnown = _current;

  } else if (_current.hasFix) {
    // Had a fix — check if it has expired
    if (now - _current.lastFixMs > GPS_FIX_TIMEOUT_MS) {
      _current.hasFix  = false;
      _current.isStale = true;
      _current.statusMessage = "Fix lost — last known location available";
      Serial.println(F("[GPS] Fix lost. Displaying last known location."));
    }
  } else {
    _current.isStale = (now - _current.lastFixMs > GPS_FIX_TIMEOUT_MS);
    if (!_receivingChars) {
      _current.statusMessage = "No NMEA data — check wiring";
    } else {
      _current.statusMessage = "Searching for satellites...";
    }
  }
}

GPSData GPSParser::getData() const {
  return _current;
}

GPSData GPSParser::getLastKnown() const {
  return _lastKnown;
}

bool GPSParser::hasFix() const {
  return _current.hasFix;
}

bool GPSParser::isConnected() const {
  return _receivingChars;
}

String GPSParser::buildMapUrl(double lat, double lon) const {
  char buf[128];
  snprintf(buf, sizeof(buf),
           "https://maps.google.com/?q=%.6f,%.6f",
           lat, lon);
  return String(buf);
}
