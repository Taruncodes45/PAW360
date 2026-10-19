# Testing Guide

## Automated Tests (Dashboard)

### Prerequisites
```bash
cd dashboard
npm install
```

### Build Test
```bash
npm run build
```
✅ Passes when TypeScript compilation and Vite bundle succeed with exit code 0.

### Type Check Only
```bash
npx tsc --noEmit
```

### Development Server
```bash
npm run dev
```
Dashboard available at http://localhost:5173

---

## Demo Mode Tests (Manual)

### DM-001: Demo Mode Activation
1. Open dashboard at http://localhost:5173
2. Navigate to Settings
3. Toggle Demo Mode ON
4. **Expected:** Purple "DEMO MODE ACTIVE" banner appears at top of every page
5. **Expected:** Sidebar shows "🟣 DEMO MODE ACTIVE" badge
6. **Expected:** All metric cards show "🟣 DEMO" source badge

### DM-002: Simulated Data Visibility
1. Navigate to Overview
2. **Expected:** Heart Rate and SpO₂ show values (not "No data")
3. **Expected:** GPS map shows marker near Bengaluru, India (12.9716, 77.5946)
4. **Expected:** Activity shows movement events

### DM-003: SOS Disabled in Demo Mode
1. Navigate to Overview
2. **Expected:** SOS button is disabled (grayed out)
3. **Expected:** Button label explains SOS is disabled in Demo Mode

### DM-004: Alerts Are Labeled Demo
1. Navigate to Alerts & History
2. **Expected:** All alerts show "DEMO" badge
3. **Expected:** Delivery status shows "demo" not "sent"

---

## Data Validity Tests (Manual)

### DV-001: Stale Data Indicator
1. Enable Demo Mode
2. Navigate to Live Health
3. **Expected:** Freshness bars show green when data is recent
4. Stop the dev server briefly, wait 30+ seconds, restart
5. **Expected:** Freshness bars turn orange → red for stale data

### DV-002: No-Data State
1. Disable Demo Mode (live mode)
2. Ensure backend is NOT running
3. **Expected:** Metric cards show skeleton loaders or "No data" text
4. **Expected:** No values displayed as "0" without invalid labeling
5. **Expected:** GPS map shows notice about unavailable data

### DV-003: GPS Fix Lost vs Last Known
1. In Demo Mode, navigate to GPS Tracking
2. **Expected:** Map shows fix marker with "Fix acquired (DEMO)" status
3. Manually test: modify demoData.ts to set hasFix=false
4. **Expected:** Banner changes to "Showing LAST KNOWN location"
5. **Expected:** Map marker turns yellow

---

## Telemetry Validation Tests (Manual)

### TV-001: Plausibility Check
Firmware logic: readings outside plausible ranges are discarded.
- HR < 20 or > 300 BPM → rejected (invalid)
- SpO₂ < 70 or > 100 → rejected
- GPS: |lat| > 90 or |lon| > 180 → rejected

### TV-002: Alert Cooldown
- Set `TELEGRAM_COOLDOWN_MS 5000` in config.h
- Trigger a motion event
- **Expected:** First alert sends, subsequent alerts within 5s are suppressed
- Serial monitor should show: `Alert 'Sudden Motion Event' suppressed (cooldown active)`

### TV-003: Missing GPS Fix
- Deploy firmware indoors
- **Expected:** GPS status shows "Searching for satellites..."
- **Expected:** No coordinates shown (not 0.0, 0.0)
- After fix is acquired outdoors:
- **Expected:** Status changes to "Fix acquired"
- **Expected:** Coordinates update on Blynk and dashboard

---

## Configuration Tests

### CT-001: Missing Credentials
- In config.h, set `TELEGRAM_BOT_TOKEN "YOUR_BOT_TOKEN:HERE"` (placeholder)
- **Expected:** Serial monitor shows warning, no Telegram attempt made
- **Expected:** No crash or hang

### CT-002: Wi-Fi Reconnection
- Disconnect Wi-Fi during operation
- **Expected:** Serial shows reconnection attempts
- **Expected:** Blynk reconnects automatically after Wi-Fi is restored
- **Expected:** Telegram alert sent on reconnect (if configured and cooldown expired)

---

## Hardware Tests (Require Physical Hardware)

These cannot be run in the current software-only environment.

### HW-001: I2C Device Detection
Upload I2C scanner sketch to ESP32.
**Expected:** Addresses 0x57 (MAX30100) and 0x68 (MPU6050) detected.

### HW-002: GPS NMEA Output
Open Serial2 monitor at 9600 baud.
**Expected:** NMEA sentences ($GPGGA, $GPRMC, etc.) received.

### HW-003: MAX30100 Signal Quality
Place sensor against skin (or fur, with pressure).
**Expected:** IR value > 50000, valid heartbeat detected.
**Note:** Readings are experimental — quality may vary significantly.

### HW-004: Battery Voltage Measurement
Battery monitoring requires an external voltage divider circuit.
(Not implemented in current hardware revision.)

---

## Secret Leakage Check

### SL-001: Frontend Bundle
```bash
cd dashboard && npm run build
grep -r "TOKEN" dist/
grep -r "SSID" dist/
```
**Expected:** No credentials in dist/ output.

### SL-002: Git Check
```bash
git status
```
**Expected:** config.h and .env are not tracked (listed in .gitignore).

---

## Known Limitations

1. MAX30100 HR/SpO₂ readings are experimental — not veterinary-grade.
2. GPS fix requires outdoor placement — indoor use will not work.
3. Neo-6M is GPS-only — live remote tracking needs Wi-Fi.
4. No body temperature monitoring without adding a real temperature sensor.
5. No battery voltage monitoring without adding a voltage divider circuit.
6. Historical data not persisted — requires database implementation.
7. Blynk free tier rate limits may throttle frequent API calls.
