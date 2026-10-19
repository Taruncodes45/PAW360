/*
 * PawSense360 — MAX30100 Sensor Implementation
 * ============================================================
 * Uses the SparkFun MAX3010x library (install via Arduino Library Manager:
 * "SparkFun MAX3010x Pulse and Proximity Sensor Library")
 *
 * I2C Wiring:
 *   MAX30100 SDA  →  ESP32 GPIO 21
 *   MAX30100 SCL  →  ESP32 GPIO 22
 *   MAX30100 VIN  →  3.3V (do NOT connect to 5V)
 *   MAX30100 GND  →  GND
 *   MAX30100 INT  →  optional ESP32 GPIO (interrupt-driven mode)
 */

#include "MAX30100Sensor.h"
#include <Wire.h>

// Using SparkFun MAX3010x library
// Install: Arduino IDE → Sketch → Include Library → Manage Libraries
//          Search: "SparkFun MAX3010x"
#include <MAX30105.h>
#include <heartRate.h>
#include <spo2_algorithm.h>

MAX30105 _particleSensor;

// Rolling buffer sizes for averaging
static const uint8_t  RATE_SIZE    = 4;
static const uint32_t MAX_IR_VALUE = 50000;   // Minimum IR for valid finger/contact detection

static byte    _rateHistory[RATE_SIZE];
static byte    _rateIndex    = 0;
static long    _lastBeat     = 0;
static float   _beatsPerMin  = 0;
static float   _beatAvg      = 0;

// SPO2 buffers
static const byte BUFFER_LENGTH = 100;
static uint32_t irBuffer[BUFFER_LENGTH];
static uint32_t redBuffer[BUFFER_LENGTH];
static int32_t  spo2Value      = 0;
static int8_t   validSPO2      = 0;
static int32_t  heartRateValue = 0;
static int8_t   validHR        = 0;

MAX30100Sensor::MAX30100Sensor()
  : _connected(false), _lastSampleMs(0), _lastValidMs(0),
    _bufferIndex(0) {
  _lastReading = {false, 0.0f, 0.0f, 0, 0, "Not initialized"};
}

bool MAX30100Sensor::begin() {
  Serial.println(F("[MAX30100] Initializing..."));

  if (!_particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println(F("[MAX30100] ERROR: Sensor not detected on I2C bus (0x57). "
                     "Check wiring and 3.3V supply."));
    _connected = false;
    _lastReading.statusMessage = "Sensor not found";
    return false;
  }

  // Configure sensor for pulse oximetry measurement
  _particleSensor.setup(
    60,    // LED brightness (0–255); adjust for fur/skin contact
    4,     // Sample average (1,2,4,8,16,32)
    2,     // LED mode: 1=Red only, 2=Red+IR (required for SpO2)
    100,   // Sample rate (50,100,200,400,800,1000,1600,3200)
    411,   // Pulse width (69,118,215,411 microseconds)
    4096   // ADC range (2048,4096,8192,16384)
  );

  _connected = true;
  Serial.println(F("[MAX30100] Initialized successfully."));
  Serial.println(F("[MAX30100] NOTE: Readings are experimental estimates. "
                   "Not suitable for veterinary diagnosis."));
  return true;
}

void MAX30100Sensor::update() {
  if (!_connected) return;

  uint32_t now = millis();
  if (now - _lastSampleMs < 10) return;  // ~100Hz max sample rate
  _lastSampleMs = now;

  long irValue = _particleSensor.getIR();

  // Check for sensor contact (fur/skin must be pressed against sensor)
  if (irValue < MAX_IR_VALUE) {
    _lastReading.valid         = false;
    _lastReading.heartRateBPM  = 0;
    _lastReading.spo2Percent   = 0;
    _lastReading.signalQuality = 0;
    _lastReading.statusMessage = "No contact detected";
    _lastReading.timestampMs   = now;
    return;
  }

  // Beat detection
  if (checkForBeat(irValue)) {
    long delta = now - _lastBeat;
    _lastBeat  = now;

    _beatsPerMin = 60.0f / (delta / 1000.0f);

    if (_beatsPerMin < 20 || _beatsPerMin > 300) {
      // Implausible reading — discard
      return;
    }

    _rateHistory[_rateIndex++] = (byte)_beatsPerMin;
    _rateIndex %= RATE_SIZE;

    _beatAvg = 0;
    for (byte x = 0; x < RATE_SIZE; x++) _beatAvg += _rateHistory[x];
    _beatAvg /= RATE_SIZE;
  }

  // Collect samples for SpO2 calculation
  if (_bufferIndex < BUFFER_LENGTH) {
    redBuffer[_bufferIndex] = _particleSensor.getRed();
    irBuffer[_bufferIndex]  = irValue;
    _bufferIndex++;
  } else {
    // Shift buffer and add new sample
    for (byte i = 25; i < BUFFER_LENGTH; i++) {
      redBuffer[i - 25] = redBuffer[i];
      irBuffer[i - 25]  = irBuffer[i];
    }
    for (byte i = 75; i < BUFFER_LENGTH; i++) {
      redBuffer[i] = _particleSensor.getRed();
      irBuffer[i]  = irValue;
    }

    maxim_heart_rate_and_oxygen_saturation(
      irBuffer, BUFFER_LENGTH, redBuffer,
      &spo2Value, &validSPO2,
      &heartRateValue, &validHR
    );
  }

  // Publish reading if values are plausible
  float hr   = (_beatAvg > 20 && _beatAvg < 300) ? _beatAvg : 0.0f;
  float spo2 = (validSPO2 && spo2Value >= 70 && spo2Value <= 100)
               ? (float)spo2Value : 0.0f;

  _lastReading.heartRateBPM  = hr;
  _lastReading.spo2Percent   = spo2;
  _lastReading.signalQuality = _assessSignalQuality();
  _lastReading.timestampMs   = now;

  if (hr > 0 || spo2 > 0) {
    _lastReading.valid         = true;
    _lastReading.statusMessage = "OK (experimental)";
    _lastValidMs               = now;
  } else {
    _lastReading.valid         = false;
    _lastReading.statusMessage = "Acquiring signal...";
  }
}

BiometricReading MAX30100Sensor::getReading() const {
  return _lastReading;
}

bool MAX30100Sensor::isConnected() const {
  return _connected;
}

void MAX30100Sensor::reset() {
  if (_connected) {
    _particleSensor.reset();
    _bufferIndex  = 0;
    _rateIndex    = 0;
    _beatAvg      = 0;
    spo2Value     = 0;
    validSPO2     = 0;
    _lastReading  = {false, 0.0f, 0.0f, 0, millis(), "Reset"};
  }
}

float MAX30100Sensor::_computeHeartRate() {
  return _beatAvg;
}

float MAX30100Sensor::_computeSpO2() {
  return (validSPO2) ? (float)spo2Value : 0.0f;
}

uint8_t MAX30100Sensor::_assessSignalQuality() {
  long irValue = _particleSensor.getIR();
  if (irValue < MAX_IR_VALUE)        return 0;
  if (irValue < MAX_IR_VALUE * 1.5f) return 30;
  if (irValue < MAX_IR_VALUE * 2.0f) return 60;
  return 90;
}

bool MAX30100Sensor::_isReadingPlausible(float hr, float spo2) {
  // Plausible dog heart-rate range: 40–200 BPM
  // Plausible SpO2 range: 85–100%
  bool hrOk   = (hr   > 40 && hr   < 200);
  bool spo2Ok = (spo2 > 85 && spo2 <= 100) || spo2 == 0;
  return hrOk && spo2Ok;
}
