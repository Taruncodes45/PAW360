# 🐾 PawSense360 — Smart Dog Collar IoT Ecosystem

> **Developer:** TARUN P GOWDA  
> **Version:** 1.0.0  
> **Status:** Functional prototype — demo mode operational, hardware integration documented

---

## Overview

PawSense360 is an open-source IoT-based smart dog collar ecosystem that integrates GPS tracking, biometric health monitoring, motion analysis, cloud synchronization, and emergency notifications.

The system is built around an ESP32-WROOM-32 microcontroller and combines:
- **MAX30100** — optical heart-rate and SpO₂ estimation (experimental)
- **MPU6050** — accelerometer and gyroscope for motion and activity analysis
- **Neo-6M** — GPS tracking (requires Wi-Fi for remote access)
- **Blynk IoT** — real-time cloud telemetry dashboard
- **Telegram Bot API** — configurable alerts and notifications
- **Web Dashboard** — polished React/TypeScript monitoring interface

---

## ⚠️ Important Limitations

**Read before using on an animal:**

- MAX30100 heart-rate and SpO₂ values are **experimental estimates only**. Not veterinary-grade.
- The MPU6050 die temperature is the chip's own temperature — **not the dog's body temperature**.
- Body temperature monitoring requires a dedicated contact sensor (not currently implemented).
- GPS fix requires **outdoor placement with clear sky view**. Indoor use will not work.
- The Neo-6M is a **GPS receiver only, not cellular**. Remote tracking requires Wi-Fi.
- Alert thresholds require calibration per dog. **Do not use as medical diagnostic criteria.**
- This is a prototype — animal safety has not been formally tested.
- A GPS collar is **not a substitute for supervision or veterinary care**.

---

## Features

| Feature | Status |
|---------|--------|
| Web dashboard (React + TS + Vite) | ✅ Implemented |
| Demo mode with simulated data | ✅ Implemented |
| GPS Tracking (Leaflet map) | ✅ Implemented |
| Heart Rate display (experimental) | ✅ Implemented |
| SpO₂ display (experimental) | ✅ Implemented |
| Motion / Activity monitoring | ✅ Implemented |
| Alerts & History page | ✅ Implemented |
| Device Status & Troubleshooting | ✅ Implemented |
| Settings & Integrations page | ✅ Implemented |
| ESP32 firmware (PawSense360.ino) | ✅ Implemented |
| MAX30100 firmware module | ✅ Implemented |
| MPU6050 firmware module | ✅ Implemented |
| Neo-6M GPS parsing module | ✅ Implemented |
| Blynk IoT integration | ✅ Implemented |
| Telegram alert system | ✅ Implemented |
| Backend proxy (Blynk API) | ✅ Implemented |
| Body temperature sensor | ❌ Not implemented (hardware required) |
| Battery voltage monitoring | ❌ Not implemented (circuit required) |
| Historical data persistence | ❌ Requires database setup |
| Android application | 📋 Future roadmap |
| Geofencing / safe zones | 📋 Future roadmap |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    ESP32-WROOM-32                            │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐               │
│  │ MAX30100  │  │  MPU6050  │  │  Neo-6M  │               │
│  │ (I2C 0x57)│  │ (I2C 0x68)│  │ (UART2)  │               │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘               │
│        └──────────────┴──────────────┘                       │
│                    Sensor Processing                          │
│              ┌──────────────────────┐                        │
│              │  Validation Layer    │                        │
│              │  - Plausibility check│                        │
│              │  - Stale data detect │                        │
│              │  - Cooldown tracking │                        │
│              └──────────┬───────────┘                        │
└─────────────────────────┼────────────────────────────────────┘
                          │ Wi-Fi
           ┌──────────────┴──────────────┐
           ▼                             ▼
    ┌─────────────┐              ┌──────────────┐
    │  Blynk IoT  │              │ Telegram Bot │
    │  V0–V9 pins │              │ Alert System │
    └──────┬──────┘              └──────────────┘
           │ Blynk API
           ▼
    ┌─────────────┐
    │  Backend    │  (Node.js Express — keeps token server-side)
    │  Proxy      │
    └──────┬──────┘
           │ REST API
           ▼
    ┌─────────────┐
    │  Web        │  (React + TypeScript + Vite)
    │  Dashboard  │
    └─────────────┘
```

---

## Project Structure

```
PawSense360/
├── README.md
├── .gitignore
├── .env.example
├── firmware/
│   ├── PawSense360.ino         ← Main firmware
│   ├── config.example.h        ← Credential template (commit this)
│   ├── config.h                ← Your real credentials (GITIGNORED)
│   ├── sensors/
│   │   ├── MAX30100Sensor.h/cpp
│   │   └── MPU6050Sensor.h/cpp
│   ├── gps/
│   │   └── GPSParser.h/cpp
│   ├── cloud/
│   │   └── BlynkClient.h/cpp
│   └── alerts/
│       └── TelegramAlert.h/cpp
├── dashboard/                  ← React web dashboard
│   ├── src/
│   │   ├── types/              ← TypeScript types
│   │   ├── context/            ← Global state
│   │   ├── services/           ← API + demo data
│   │   ├── components/         ← Reusable UI
│   │   └── pages/              ← All 7 pages
│   └── dist/                   ← Production build output
├── backend/                    ← Node.js proxy server
│   └── src/
│       ├── server.js
│       ├── blynkAdapter.js
│       └── mockAdapter.js
└── docs/
    ├── hardware-wiring.md
    ├── blynk-setup.md
    ├── telegram-setup.md
    └── testing.md
```

---

## Hardware Requirements

| Component | Model | Quantity | Notes |
|-----------|-------|----------|-------|
| Microcontroller | ESP32-WROOM-32 | 1 | Arduino IDE compatible |
| HR/SpO₂ Sensor | MAX30100 | 1 | I2C, 3.3V only |
| Motion Sensor | MPU6050 | 1 | I2C, shared bus with MAX30100 |
| GPS Module | Neo-6M | 1 | UART, 3.3V (check breakout) |
| Battery | 3.7V Li-Ion (18650) | 1 | With protection circuit |
| Charger | TP4056 with protection | 1 | With over-discharge protection |
| Voltage Reg. | AMS1117-3.3 or similar | 1 | If powering from raw Li-Ion |
| Resistors | 4.7 kΩ × 2 | 2 | I2C pull-ups (optional but recommended) |
| Enclosure | Weatherproof plastic | 1 | No metal near GPS antenna |

---

## Software Dependencies

### Arduino Libraries (install via Library Manager)
```
Blynk                                    — v1.3.2+  by Volodymyr Shymanskyy
SparkFun MAX3010x Pulse and Proximity    — v1.1.2+  by SparkFun Electronics
Adafruit MPU6050                         — v2.2.6+  by Adafruit
Adafruit Unified Sensor                  — v1.1.14+ by Adafruit
TinyGPS++                                — v1.0.3   by Mikal Hart
```

### Board Manager
URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`  
Board: `ESP32 Dev Module`

### Dashboard Dependencies
```bash
cd dashboard && npm install
```
Key packages: `react-router-dom`, `leaflet`, `recharts`, `lucide-react`, `date-fns`

---

## Quick Start

### 1. Clone and configure
```bash
# Copy credential templates
cp firmware/config.example.h firmware/config.h
cp .env.example backend/.env

# Fill in your values
nano firmware/config.h   # Wi-Fi, Blynk, Telegram credentials
nano backend/.env        # Blynk token for backend proxy
```

### 2. Upload firmware
1. Open `firmware/PawSense360.ino` in Arduino IDE.
2. Install all library dependencies.
3. Select board: **Tools → Board → ESP32 Dev Module**.
4. Select port: **Tools → Port → (your ESP32 COM port)**.
5. Click **Upload**.
6. Open Serial Monitor at 115200 baud.

### 3. Run the dashboard (Demo Mode — no hardware needed)
```bash
cd dashboard
npm run dev
```
Open http://localhost:5173 — Demo Mode is enabled by default.

### 4. Run the backend (optional — for live Blynk integration)
```bash
cd backend
npm install
npm run dev
```
Backend runs at http://localhost:3001.

### 5. Switch to live hardware
1. Edit `dashboard/.env`: set `VITE_DEMO_MODE=false`
2. Restart the dev server.
3. In Settings page, disable Demo Mode.
4. Ensure the backend is running with a valid Blynk token.
5. Power on the ESP32 collar.

---

## Blynk Virtual Pin Mapping

| Pin | Datastream | Type | Notes |
|-----|-----------|------|-------|
| V0 | Heart Rate | Float | BPM; -1 when invalid |
| V1 | SpO₂ | Float | %; -1 when invalid |
| V2 | Temperature | Float | RESERVED — not implemented |
| V3 | GPS Latitude | Double | 0.0 when no fix |
| V4 | GPS Longitude | Double | 0.0 when no fix |
| V5 | Activity Count | Int | Cumulative movement events |
| V6 | Device Status | Int | 1=online, 0=offline |
| V7 | GPS Fix | Int | 1=fix, 0=no fix |
| V8 | Battery Voltage | Float | RESERVED — not implemented |
| V9 | Data Age | Int | Seconds since last sensor read |

---

## Telegram Alerts

Alerts sent by the firmware (not the dashboard):
- 🟢 Device online/startup
- 📍 GPS location update (when requested)
- ❤️ Abnormal heart rate (configurable threshold)
- 🩸 Low SpO₂ estimate
- ⚡ Sudden motion event
- 📡 GPS fix lost/restored
- 📶 Wi-Fi reconnected/lost
- 🆘 Manual SOS (bypasses cooldown)

All alerts respect a configurable cooldown (default: 60 seconds per type).  
Demo Mode suppresses all Telegram alerts.

---

## Build Results

| Check | Status | Notes |
|-------|--------|-------|
| `npm run build` (TypeScript) | ✅ Pass | 2820 modules, 0 errors |
| Vite production build | ✅ Pass | dist/ generated |
| Demo mode smoke test | ✅ Pass | All pages render with simulated data |
| Secret leakage check | ✅ Pass | No credentials in dist/ |
| Hardware firmware | 📋 Manual | Requires ESP32 and physical sensors |
| Blynk integration | 📋 Manual | Requires Blynk account + credentials |
| Telegram integration | 📋 Manual | Requires Telegram bot + credentials |
| GPS satellite fix | 📋 Manual | Requires outdoor environment |

---

## Future Roadmap

1. **Android Application** — Native or React Native companion app.
2. **Persistent History** — SQLite backend for HR/SpO₂/activity trend analysis.
3. **Body Temperature** — Add DS18B20 or LM35 contact temperature sensor.
4. **Battery Monitoring** — Voltage divider + ESP32 ADC for battery level.
5. **Geofencing** — Safe-zone alerts when pet leaves a defined area.
6. **Multiple Pet Profiles** — Dashboard support for multiple collars.
7. **Cellular Module** — SIM800 or SIM7600 for tracking beyond Wi-Fi coverage.
8. **Step Counter** — Pedometer algorithm using MPU6050 data.
9. **Veterinary Records** — Health history and medication reminders.
10. **Over-the-Air Updates** — ESP32 OTA for firmware updates.

---

## Developer

**TARUN P GOWDA**  
PawSense360 — Personal IoT Project  
Version 1.0.0 | October 2026

---

*PawSense360 readings are for experimental and educational use only.  
Always consult a veterinarian for your pet's health concerns.*
