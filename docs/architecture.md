# PawSense360 — System Architecture

## 1. High-Level Architecture Overview

PawSense360 is structured into three distinct layers:
1. **Edge Firmware Layer (ESP32)**: Collects sensor readings, executes low-latency posture/activity classification and threshold alert checks, sends telemetry to Blynk Cloud, and issues emergency Telegram alerts via HTTPS.
2. **Backend Proxy Layer (Node.js/Express)**: Isolates sensitive credentials (Blynk Auth Token, Telegram Bot Token), provides validated REST endpoints, caches historical snapshots, and simulates live data when hardware is disconnected.
3. **User Interface Layer (React 19 + TypeScript + Vite)**: Modern responsive dashboard featuring real-time health telemetry, interactive GPS mapping with custom Leaflet markers, activity timelines, system health diagnostics, and a demo simulation engine.

```
+--------------------------------------------------------------------+
|                         EDGE / EMBEDDED LAYER                     |
|                                                                    |
|  [MAX30100] ---> I2C (SDA 21 / SCL 22) ---\                       |
|  (HR & SpO2)                                \                      |
|                                              +---> [ESP32 DevKit]  |
|  [MPU6050]  ---> I2C (SDA 21 / SCL 22) -----/      - FreeRTOS Core |
|  (6-DOF IMU)                                       - WiFiManager  |
|                                                    - Kalman/EMA   |
|  [u-blox NEO-6M] -> UART (RX 16 / TX 17) ---------/ - TinyGPS++    |
+------------------------------+-------------------------------------+
                               |
            +------------------+------------------+
            | WiFi (HTTPS / SSL)                  | WiFi (REST / SSL)
            v                                     v
+-----------------------+              +-----------------------+
|  Telegram Bot API     |              |      Blynk Cloud      |
|  (Direct SOS Alerts)  |              |  (Virtual Pins V0-V8) |
+-----------------------+              +-----------+-----------+
                                                   |
                                                   | Blynk REST API (Server-to-Server)
                                                   v
                                       +-----------------------+
                                       |  PawSense360 Backend  |
                                       |   (Express Proxy)     |
                                       |  Port 3001 (Isolated) |
                                       +-----------+-----------+
                                                   |
                                                   | JSON API / CORS
                                                   v
                                       +-----------------------+
                                       | PawSense360 Dashboard |
                                       | (React + TS + Vite)   |
                                       | Port 5173 (Browser)   |
                                       +-----------------------+
```

---

## 2. Firmware Subsystems

### Sensor Sampling & Filtering
- **MAX30100 Pulse Oximeter**: Sampled via I2C at 100 Hz. Raw IR and Red LED readings pass through a DC removal filter and moving average peak detector to derive heart rate (BPM) and blood oxygen saturation (% SpO2).
- **MPU6050 Accelerometer & Gyroscope**: Sampled at 50 Hz. Vector magnitude \( \sqrt{a_x^2 + a_y^2 + a_z^2} \) is evaluated to classify real-time movement states:
  - *Resting / Sleeping*: Low variance, \( < 0.15g \) deviation.
  - *Walking*: Regular cyclic peaks between \( 0.2g \) and \( 0.6g \).
  - *Running*: High frequency, acceleration peaks \( > 0.6g \).
  - *Scratching / Shaking*: High-frequency gyroscope oscillations (\( > 250^\circ/\text{s} \)).
- **NEO-6M GPS Module**: Parsed asynchronously via HardwareSerial using TinyGPS++. Emits valid latitude, longitude, speed, HDOP, and satellite count.

### Pin & Protocol Mapping
| Peripheral | Protocol | ESP32 Pins | Description |
|---|---|---|---|
| MAX30100 | I2C (0x57) | GPIO 21 (SDA), GPIO 22 (SCL) | Heart Rate & SpO2 sensor |
| MPU6050 | I2C (0x68) | GPIO 21 (SDA), GPIO 22 (SCL) | 6-axis IMU |
| NEO-6M GPS | UART | GPIO 16 (RX2), GPIO 17 (TX2) | 9600 baud serial NMEA stream |
| Status LED | GPIO | GPIO 2 | Blinks on sync, steady on alert |

---

## 3. Cloud Synchronization & Pin Layout

The system utilizes Blynk Virtual Pins for telemetry:
- **V0**: Heart Rate (BPM)
- **V1**: SpO2 (%)
- **V2**: Activity State (0: Rest, 1: Walk, 2: Run, 3: Shake)
- **V3**: Daily Step Count
- **V4**: GPS Coordinates (`lat,lon` string or Location Widget)
- **V5**: GPS Speed (km/h)
- **V6**: Battery Level (%)
- **V7**: RSSI / Signal Strength (dBm)
- **V8**: Alert Status Flag (Bitmask)

---

## 4. Backend Proxy Architecture

The Node.js proxy provides two critical advantages:
1. **Security**: Browser clients never possess or leak the Blynk Auth Token or Telegram credentials.
2. **Resilience & Caching**: When hardware is offline or during bench evaluation without physical sensors, the proxy routes mock telemetry and historical trends transparently to the dashboard.

---

## 5. Security & Safety Model

- **No Secrets in Client Bundles**: All `.env` tokens reside in firmware flash or backend environment variables.
- **Out-of-Range Heart Rate Warnings**: Alerts fire on sustained abnormal heart rate (< 50 or > 160 BPM for dogs depending on size class).
- **Indoor GPS Protection**: When HDOP > 5 or satellites < 4, coordinates are flagged as low confidence or retained at last known reliable fix.
