/*
 * PawSense360 — MPU6050 Motion Sensor Implementation
 * ============================================================
 * Uses the Adafruit MPU6050 library (install via Library Manager:
 * "Adafruit MPU6050")
 *
 * I2C Wiring (shared bus with MAX30100):
 *   MPU6050 SDA  →  ESP32 GPIO 21
 *   MPU6050 SCL  →  ESP32 GPIO 22
 *   MPU6050 VCC  →  3.3V
 *   MPU6050 GND  →  GND
 *   MPU6050 AD0  →  GND (sets I2C address to 0x68)
 *
 * NOTE:
 *   The MPU6050 has an internal temperature sensor (die temperature).
 *   This measures the chip's own temperature — NOT the dog's body temperature.
 *   Do not display or report this as an animal health metric.
 */

#include "MPU6050Sensor.h"
#include <Wire.h>

// Using Adafruit MPU6050 library
// Install: Arduino IDE → Sketch → Include Library → Manage Libraries
//          Search: "Adafruit MPU6050"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

Adafruit_MPU6050 _mpu;

// Default thresholds
static const float DEFAULT_MOVEMENT_THRESHOLD      = 0.15f;  // g
static const float DEFAULT_SUDDEN_MOTION_THRESHOLD = 2.50f;  // g
static const uint32_t SUDDEN_COOLDOWN_MS           = 5000;   // 5 seconds between alerts
static const uint32_t ACTIVITY_WINDOW_MS           = 60000;  // 1-minute window

MPU6050Sensor::MPU6050Sensor()
  : _connected(false),
    _movementThreshold(DEFAULT_MOVEMENT_THRESHOLD),
    _suddenMotionThreshold(DEFAULT_SUDDEN_MOTION_THRESHOLD),
    _lastSampleMs(0),
    _lastSuddenAlertMs(0),
    _suddenCooldownMs(SUDDEN_COOLDOWN_MS) {
  _lastReading = {};
  _activity    = {};
}

bool MPU6050Sensor::begin() {
  Serial.println(F("[MPU6050] Initializing..."));

  if (!_mpu.begin(MPU6050_I2C_ADDR)) {
    Serial.println(F("[MPU6050] ERROR: Sensor not detected on I2C bus (0x68). "
                     "Check wiring and that AD0 is connected to GND."));
    _connected = false;
    return false;
  }

  // Configure ranges
  _mpu.setAccelerometerRange(MPU6050_RANGE_8_G);   // ±8g suitable for collar motion
  _mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  _mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  _connected = true;
  _activity.windowStartMs = millis();
  _activity.windowDurationMs = ACTIVITY_WINDOW_MS;

  Serial.println(F("[MPU6050] Initialized. Accel range: ±8g, Gyro range: ±500°/s"));
  Serial.printf("[MPU6050] Movement threshold: %.2fg, Sudden-motion threshold: %.2fg\n",
                _movementThreshold, _suddenMotionThreshold);
  return true;
}

void MPU6050Sensor::update() {
  if (!_connected) return;

  uint32_t now = millis();
  if (now - _lastSampleMs < 20) return;  // ~50Hz sample rate
  _lastSampleMs = now;

  sensors_event_t accelEvt, gyroEvt, tempEvt;
  _mpu.getEvent(&accelEvt, &gyroEvt, &tempEvt);

  // Convert m/s² to g (1g = 9.80665 m/s²)
  float ax = accelEvt.acceleration.x / 9.80665f;
  float ay = accelEvt.acceleration.y / 9.80665f;
  float az = accelEvt.acceleration.z / 9.80665f;
  float magnitude = sqrt(ax*ax + ay*ay + az*az);

  _lastReading.valid         = true;
  _lastReading.accelX        = ax;
  _lastReading.accelY        = ay;
  _lastReading.accelZ        = az;
  _lastReading.gyroX         = gyroEvt.gyro.x;
  _lastReading.gyroY         = gyroEvt.gyro.y;
  _lastReading.gyroZ         = gyroEvt.gyro.z;
  _lastReading.accelMagnitude = magnitude;
  // NOTE: tempEvt.temperature is MPU6050 die temperature — NOT dog body temperature
  // Stored for diagnostic purposes only, never displayed as animal health metric
  _lastReading.temperature   = tempEvt.temperature;
  _lastReading.timestampMs   = now;

  // Activity detection (subtract gravity baseline ~1g when stationary)
  float dynamicMagnitude = fabsf(magnitude - 1.0f);
  _lastReading.isMoving = (dynamicMagnitude > _movementThreshold);

  // Sudden motion detection with cooldown
  bool suddenNow = (magnitude > _suddenMotionThreshold);
  if (suddenNow && (now - _lastSuddenAlertMs > _suddenCooldownMs)) {
    _lastReading.suddenMovement = true;
    _lastSuddenAlertMs = now;
    Serial.printf("[MPU6050] Sudden motion detected! Magnitude: %.2fg\n", magnitude);
  } else {
    _lastReading.suddenMovement = false;
  }

  // Update activity window
  _updateActivityWindow();
  if (_lastReading.isMoving) {
    _lastReading.activityCount++;
  }
}

MotionReading MPU6050Sensor::getReading() const {
  return _lastReading;
}

ActivitySummary MPU6050Sensor::getActivitySummary() const {
  return _activity;
}

bool MPU6050Sensor::isConnected() const {
  return _connected;
}

void MPU6050Sensor::reset() {
  _lastReading = {};
  _activity    = {};
  _activity.windowStartMs = millis();
}

void MPU6050Sensor::setMovementThreshold(float gThreshold) {
  _movementThreshold = gThreshold;
  Serial.printf("[MPU6050] Movement threshold updated to %.2fg\n", gThreshold);
}

void MPU6050Sensor::setSuddenMotionThreshold(float gThreshold) {
  _suddenMotionThreshold = gThreshold;
  Serial.printf("[MPU6050] Sudden motion threshold updated to %.2fg\n", gThreshold);
}

void MPU6050Sensor::_updateActivityWindow() {
  uint32_t now = millis();

  // Roll the window every ACTIVITY_WINDOW_MS
  if (now - _activity.windowStartMs > _activity.windowDurationMs) {
    _activity.totalMovementEvents += _lastReading.activityCount;
    _activity.windowStartMs = now;
    _activity.peakMagnitude = 0;
    _activity.averageMagnitude = 0;
  }

  // Running average magnitude
  static uint32_t sampleCount = 0;
  sampleCount++;
  _activity.averageMagnitude =
    (_activity.averageMagnitude * (sampleCount - 1) + _lastReading.accelMagnitude) / sampleCount;

  if (_lastReading.accelMagnitude > _activity.peakMagnitude) {
    _activity.peakMagnitude = _lastReading.accelMagnitude;
  }

  if (_lastReading.isMoving) {
    _activity.activeMs += millis() - _lastSampleMs;
  } else {
    _activity.inactiveMs += millis() - _lastSampleMs;
  }
}

bool MPU6050Sensor::_readRegisters(uint8_t reg, uint8_t* buf, uint8_t len) {
  Wire.beginTransmission(MPU6050_I2C_ADDR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  Wire.requestFrom((uint8_t)MPU6050_I2C_ADDR, len);
  for (uint8_t i = 0; i < len; i++) {
    if (!Wire.available()) return false;
    buf[i] = Wire.read();
  }
  return true;
}
