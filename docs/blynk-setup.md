# Blynk IoT Setup Guide

## 1. Create a Blynk Account
- Go to https://blynk.cloud and create a free account.

## 2. Create a Template
1. Click **+ New Template**.
2. Name: `PawSense360`
3. Hardware: `ESP32`
4. Connection type: `WiFi`
5. Copy the **TEMPLATE_ID** — you'll need it for config.h.

## 3. Create Datastreams (Virtual Pins)

Go to **Datastreams** tab in your template and create the following:

| Virtual Pin | Name               | Data Type | Min   | Max   | Units |
|-------------|-------------------|-----------|-------|-------|-------|
| V0          | Heart Rate         | Double    | 0     | 300   | BPM   |
| V1          | SpO2 Estimate      | Double    | 0     | 100   | %     |
| V2          | Temperature        | Double    | 0     | 50    | °C    |
| V3          | GPS Latitude       | Double    | -90   | 90    | °     |
| V4          | GPS Longitude      | Double    | -180  | 180   | °     |
| V5          | Activity Count     | Integer   | 0     | 99999 |       |
| V6          | Device Status      | Integer   | 0     | 1     |       |
| V7          | GPS Fix Status     | Integer   | 0     | 1     |       |
| V8          | Battery Voltage    | Double    | 0     | 4.2   | V     |
| V9          | Data Age           | Integer   | 0     | 3600  | s     |

⚠️ V2 (Temperature) and V8 (Battery) are reserved — do not publish data to them until real sensors are wired.

## 4. Create a Device
1. Go to **Devices** → **+ New Device** → **From Template**.
2. Select the PawSense360 template.
3. Copy the **AUTH_TOKEN** — this is your device-specific credential.
   **Keep this private — never commit it.**

## 5. Update config.h
```cpp
#define BLYNK_TEMPLATE_ID   "YOUR_TEMPLATE_ID"
#define BLYNK_TEMPLATE_NAME "PawSense360"
#define BLYNK_AUTH_TOKEN    "YOUR_AUTH_TOKEN"
```

## 6. Create a Blynk Dashboard
In the Blynk mobile app or web dashboard, add widgets:
- **Label widget** for V0 (Heart Rate)
- **Label widget** for V1 (SpO2)
- **Map widget** for V3 + V4 (GPS location)
- **Gauge widget** for V5 (Activity)
- **LED widget** for V6 (Device Status)
- **LED widget** for V7 (GPS Fix)
- **Label widget** for V9 (Data Age)

## 7. Backend Proxy Configuration
The PawSense360 web dashboard reads from the backend proxy, not directly from Blynk.
This keeps your auth token server-side.

In `backend/.env`:
```
BLYNK_AUTH_TOKEN=your_real_auth_token_here
```

## Notes
- Blynk free tier has limited history storage and API calls.
- The firmware uses `Blynk.virtualWrite()` to push values — no Blynk server polling required.
- If the ESP32 is offline, Blynk retains the last sent values.
- Data freshness is tracked via V9 (age in seconds since last sensor read).
