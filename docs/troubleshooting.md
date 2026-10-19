# PawSense360 — Troubleshooting Guide

This guide covers common issues encountered during setup, firmware flashing, hardware interfacing, and dashboard execution.

---

## 1. Hardware & Sensor Issues

### A. I2C Bus Hangs / Sensor Not Detected (0x57 or 0x68)
* **Symptom**: Serial monitor prints `[I2C] Device not found at 0x57` or `0x68`.
* **Fixes**:
  1. Verify pull-up resistors: Both SDA (GPIO 21) and SCL (GPIO 22) require 4.7kΩ pull-up resistors to 3.3V (most breakout boards include them, but check with a multimeter).
  2. Level shifting: Ensure VCC is supplied with 3.3V, NOT 5V. Supplying 5V to MAX30100 can damage the sensor or cause bus latch-up.
  3. Run an I2C scanner sketch to isolate whether wiring or address conflict is the root cause.

### B. MAX30100 Reading 0 BPM / Inaccurate Heart Rate
* **Symptom**: HR outputs 0 or SpO2 stays at 0%.
* **Fixes**:
  1. Optical contact: Animal fur scatters optical IR and Red wavelengths. Ensure the sensor window makes direct contact with skin (e.g. inner ear flap, groin, or shaved patch for testing).
  2. Ambient light interference: Shield the photodiode from direct sunlight or bright indoor overhead LEDs.
  3. Current configuration: Adjust `setLedCurrent()` in `MAX30100Sensor.cpp` to increase diode brightness.

### C. GPS Fix Not Acquired (Neo-6M)
* **Symptom**: `GPS status: No Fix` or `Lat: 0.0, Lon: 0.0`.
* **Fixes**:
  1. Clear sky view: GPS signals cannot penetrate thick concrete walls or metal roofs. Place the antenna near an open window or outdoors.
  2. Cold start time: The first satellite lock (Time To First Fix) can take 2 to 5 minutes.
  3. PPS LED: Verify the green/red PPS indicator on the NEO-6M is blinking once per second, confirming an active 3D fix.

---

## 2. Firmware Flashing & Serial Monitor

### A. Flash Upload Timeout (`A fatal error occurred: Failed to connect to ESP32`)
* **Fixes**:
  1. Hold down the **BOOT** (or **IO0**) button on the ESP32 board when the Arduino IDE / PlatformIO starts uploading (`Connecting........_____.....`).
  2. Ensure the correct COM port is selected and CP2102/CH340 USB drivers are installed.
  3. Close any open serial monitors (PuTTY, Arduino Serial Monitor) before attempting an upload.

---

## 3. Cloud & Network Issues

### A. ESP32 Cannot Connect to Wi-Fi
* **Symptom**: Repeated `[WiFi] Connecting... Timeout` in serial logs.
* **Fixes**:
  1. Frequency band: ESP32 only supports **2.4 GHz** Wi-Fi networks. It cannot connect to 5.0 GHz-only SSIDs.
  2. Credentials: Check `firmware/config.h` for matching SSID and password.

### B. Telegram Messages Not Arriving
* **Symptom**: No alert messages in your Telegram chat on SOS trigger.
* **Fixes**:
  1. Verify `TELEGRAM_CHAT_ID`: Ensure you have started a chat with your bot by pressing `/start` in the Telegram app first.
  2. SSL/TLS Certificate: ESP32 requires `WiFiClientSecure`. Ensure `setInsecure()` is active for development testing or proper root certificates are loaded.

---

## 4. Web Dashboard & Backend

### A. Dashboard Cannot Connect to Backend (`Failed to fetch telemetry`)
* **Fixes**:
  1. Check backend status: Verify port 3001 is active via `http://localhost:3001/api/health`.
  2. CORS: Backend allows origins `http://localhost:5173` and `http://localhost:4173`.
  3. Switch to **Demo Mode**: If you do not have physical hardware online, toggle the Demo Mode switch in the dashboard top navigation bar to generate simulated live vitals.

### B. Port Already in Use (EADDRINUSE: 3001 or 5173)
* **Fixes**:
  - Run `netstat -ano | findstr :3001` (Windows) and terminate the lingering process with `taskkill /PID <PID> /F`.
