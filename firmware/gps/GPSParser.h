/*
 * PawSense360 — GPS Parser Module Header
 * ============================================================
 * Parses NMEA sentences from the Neo-6M GPS module via UART.
 *
 * IMPORTANT LIMITATIONS:
 * - GPS requires outdoor or near-window placement for satellite fix.
 * - Initial cold-start fix may take 30–120 seconds or more.
 * - The Neo-6M is a GPS RECEIVER, not a cellular modem.
 * - Live remote tracking requires ESP32 to have active Wi-Fi/internet.
 * - Indoor use will likely produce no valid fix.
 *
 * Library: TinyGPS++ (install via Arduino Library Manager)
 *   Search: "TinyGPS++"
 */

#ifndef GPS_PARSER_H
#define GPS_PARSER_H

#include <Arduino.h>
#include <TinyGPS++.h>

// Hardware UART for GPS (UART2 on ESP32)
#define GPS_RX_PIN    16   // ESP32 GPIO16 → Neo-6M TX
#define GPS_TX_PIN    17   // ESP32 GPIO17 → Neo-6M RX (optional, for sending NMEA config)
#define GPS_SERIAL    Serial2

struct GPSData {
  bool     hasFix;           // True when satellite fix is valid
  bool     isStale;          // True when fix is older than GPS_FIX_TIMEOUT_MS
  double   latitude;         // Decimal degrees (valid only when hasFix)
  double   longitude;        // Decimal degrees (valid only when hasFix)
  float    speedKmh;         // Speed over ground km/h
  float    altitudeM;        // Altitude in meters (when available)
  uint32_t satellites;       // Number of satellites in view
  float    hdop;             // Horizontal dilution of precision (lower = better)
  uint32_t lastFixMs;        // millis() when fix was last obtained
  uint32_t lastUpdateMs;     // millis() of last NMEA parse
  String   lastFixTime;      // UTC time string of last valid fix
  String   mapUrl;           // Google Maps URL (empty if no fix)
  String   statusMessage;    // Human-readable GPS status
};

class GPSParser {
public:
  GPSParser();

  // Initialize UART for GPS — call in setup()
  void begin(uint32_t baudRate = 9600);

  // Call frequently in main loop — feeds characters to TinyGPS++
  void update();

  // Returns current GPS data; check hasFix before using coordinates
  GPSData getData() const;

  bool hasFix() const;
  bool isConnected() const;  // True if NMEA characters are being received

  // Build a Google Maps URL from valid coordinates
  String buildMapUrl(double lat, double lon) const;

  // Returns last known location even if fix is currently lost
  GPSData getLastKnown() const;

private:
  TinyGPSPlus _gps;
  GPSData     _current;
  GPSData     _lastKnown;

  uint32_t _lastCharMs;       // millis() of last received NMEA character
  bool     _receivingChars;   // True if GPS module is sending data

  void _refreshStatus();
};

#endif // GPS_PARSER_H
