/*
 * PawSense360 — MAX30100 Sensor Module Header
 * ============================================================
 * Handles optical heart-rate and SpO2 estimation using the
 * MAX30100 biometric sensor over I2C.
 *
 * IMPORTANT LIMITATIONS:
 * - Readings are EXPERIMENTAL ESTIMATES only, not medical-grade.
 * - Movement, fur, poor contact, and skin pigmentation all affect accuracy.
 * - Do NOT use as a substitute for veterinary assessment.
 * - SpO2 estimation requires stable, stationary placement.
 */

#ifndef MAX30100_SENSOR_H
#define MAX30100_SENSOR_H

#include <Arduino.h>

// MAX30100 I2C address (fixed by hardware)
#define MAX30100_I2C_ADDR  0x57

struct BiometricReading {
  bool     valid;           // True only when reading passed quality checks
  float    heartRateBPM;    // Estimated heart rate in BPM (0 if invalid)
  float    spo2Percent;     // Estimated SpO2 % (0 if invalid)
  uint8_t  signalQuality;   // 0–100 quality score (heuristic)
  uint32_t timestampMs;     // millis() at time of reading
  String   statusMessage;   // Human-readable status or error description
};

class MAX30100Sensor {
public:
  MAX30100Sensor();

  // Initialize sensor — returns false if sensor not detected on I2C bus
  bool begin();

  // Update sensor readings (call frequently in loop — non-blocking)
  void update();

  // Returns latest reading; valid flag indicates data quality
  BiometricReading getReading() const;

  // Returns true if the sensor is responding on I2C
  bool isConnected() const;

  // Force a fresh reading cycle (clears stale data)
  void reset();

private:
  bool           _connected;
  BiometricReading _lastReading;
  uint32_t       _lastSampleMs;
  uint32_t       _lastValidMs;
  uint8_t        _sampleBuffer[16];
  int            _bufferIndex;

  // Internal signal processing helpers
  float  _computeHeartRate();
  float  _computeSpO2();
  uint8_t _assessSignalQuality();
  bool   _isReadingPlausible(float hr, float spo2);
};

#endif // MAX30100_SENSOR_H
