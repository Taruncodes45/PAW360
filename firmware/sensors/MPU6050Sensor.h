/*
 * PawSense360 — MPU6050 Motion Sensor Module Header
 * ============================================================
 * Reads acceleration and gyroscope data from the MPU6050
 * over I2C. Used for activity detection, step counting,
 * and sudden-movement alerting.
 *
 * NOTE: Motion analysis provides heuristic activity indicators.
 * Sudden-movement events are NOT diagnoses of distress or seizure.
 * Thresholds MUST be calibrated per dog size and collar placement.
 */

#ifndef MPU6050_SENSOR_H
#define MPU6050_SENSOR_H

#include <Arduino.h>

// MPU6050 I2C address (AD0 pin LOW = 0x68, HIGH = 0x69)
#define MPU6050_I2C_ADDR  0x68

struct MotionReading {
  bool    valid;
  float   accelX, accelY, accelZ;  // Acceleration in g
  float   gyroX,  gyroY,  gyroZ;   // Angular velocity in deg/s
  float   accelMagnitude;           // sqrt(x²+y²+z²) in g
  float   temperature;              // MPU6050 die temperature in °C (NOT dog temp)
  bool    isMoving;                 // True when magnitude > movement threshold
  bool    suddenMovement;           // True when spike above sudden-motion threshold
  uint32_t activityCount;           // Cumulative movement event count
  uint32_t timestampMs;
};

struct ActivitySummary {
  uint32_t totalMovementEvents;
  uint32_t inactiveMs;          // Milliseconds inactive in current window
  uint32_t activeMs;            // Milliseconds active in current window
  float    averageMagnitude;
  float    peakMagnitude;
  uint32_t windowStartMs;
  uint32_t windowDurationMs;
};

class MPU6050Sensor {
public:
  MPU6050Sensor();

  // Initialize — returns false if sensor not found on I2C
  bool begin();

  // Non-blocking update — call in main loop
  void update();

  // Latest raw motion reading
  MotionReading getReading() const;

  // Aggregated activity window summary
  ActivitySummary getActivitySummary() const;

  bool isConnected() const;
  void reset();

  // Calibration: set thresholds for this specific dog/placement
  void setMovementThreshold(float gThreshold);
  void setSuddenMotionThreshold(float gThreshold);

private:
  bool          _connected;
  MotionReading _lastReading;
  ActivitySummary _activity;

  float _movementThreshold;     // Default 0.15g
  float _suddenMotionThreshold; // Default 2.5g

  uint32_t _lastSampleMs;
  uint32_t _lastSuddenAlertMs;
  uint32_t _suddenCooldownMs;

  bool _readRegisters(uint8_t reg, uint8_t* buf, uint8_t len);
  void _updateActivityWindow();
};

#endif // MPU6050_SENSOR_H
