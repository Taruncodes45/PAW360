# PawSense360 Hardware Wiring Guide

## Pin Mapping Table

| GPIO | Component  | Signal         | Direction | Purpose                          |
|------|-----------|----------------|-----------|----------------------------------|
| 21   | MAX30100  | SDA            | Bidirect  | I2C Data (shared bus)            |
| 22   | MAX30100  | SCL            | Output    | I2C Clock (shared bus)           |
| 21   | MPU6050   | SDA            | Bidirect  | I2C Data (same bus as MAX30100)  |
| 22   | MPU6050   | SCL            | Output    | I2C Clock (same bus)             |
| 16   | Neo-6M    | RX2 (UART2)    | Input     | Receives NMEA data from GPS TX   |
| 17   | Neo-6M    | TX2 (UART2)    | Output    | Sends config to GPS RX (optional)|
| 3.3V | MAX30100  | VCC            | Power     | 3.3V supply — NOT 5V             |
| 3.3V | MPU6050   | VCC            | Power     | 3.3V supply                      |
| 3.3V | Neo-6M    | VCC            | Power     | 3.3V supply (check module spec)  |
| GND  | All       | GND            | Ground    | Common ground reference          |
| GND  | MPU6050   | AD0            | Ground    | Sets I2C address to 0x68         |

## I2C Bus Summary
Both the MAX30100 and MPU6050 share the same I2C bus (GPIO21/GPIO22).
They have different I2C addresses:
- MAX30100: **0x57** (fixed by hardware)
- MPU6050: **0x68** (when AD0 pin is tied to GND)

**Pull-up resistors:** The ESP32 I2C driver includes internal pull-ups, but for reliable operation with both devices, add 4.7 kΩ external pull-up resistors from SDA and SCL to 3.3V.

## GPS Wiring
```
Neo-6M TX  →  ESP32 GPIO16 (UART2 RX)
Neo-6M RX  →  ESP32 GPIO17 (UART2 TX) [optional — for sending NMEA config commands]
Neo-6M VCC →  3.3V
Neo-6M GND →  GND
```

⚠️ **Some Neo-6M breakout boards accept 5V on VCC but use a 3.3V regulator internally.  
Check your specific breakout board datasheet before connecting.**

The Neo-6M GPS antenna must have an **unobstructed view of the sky**.  
Metallic enclosures will block satellite signals. Use a plastic enclosure or route the antenna outside.

## Power System

```
Battery: 3.7V Li-Ion (e.g., 18650 or equivalent)
  └─► TP4056 (charging + protection module)
       └─► Step-up/boost converter to 5V (if needed for USB host) OR
       └─► 3.3V LDO regulator for sensors
       └─► ESP32 3.3V pin
```

⚠️ **Critical notes:**
1. The TP4056 module alone provides **only charging and basic protection**, not a regulated output.
2. The ESP32 **cannot be powered directly from the raw Li-Ion cell** without regulation.
3. For direct 3.3V use, add an LDO (e.g., AMS1117-3.3) between battery and ESP32.
4. Alternatively, power via the ESP32's USB/5V pin through a 5V boost converter.
5. Check the TP4056 breakout board's rated current — many are limited to 1A charge current.

## Wiring Diagram (ASCII)

```
3.7V Li-Ion ──► TP4056 ──► Boost/LDO ──► ESP32 VIN/3.3V
                                    │
                                    ├──► MAX30100 VCC (3.3V)
                                    ├──► MPU6050 VCC  (3.3V)
                                    └──► Neo-6M  VCC  (3.3V)

ESP32 GPIO21 (SDA) ──────────────────┬──► MAX30100 SDA
                                     └──► MPU6050 SDA

ESP32 GPIO22 (SCL) ──────────────────┬──► MAX30100 SCL
                                     └──► MPU6050 SCL

ESP32 GPIO16 (RX2) ◄──── Neo-6M TX
ESP32 GPIO17 (TX2) ────► Neo-6M RX (optional)

ESP32 GND ───────────────────────────┬──► MAX30100 GND
                                     ├──► MPU6050 GND
                                     ├──► MPU6050 AD0 (→ 0x68)
                                     ├──► Neo-6M GND
                                     └──► TP4056 GND
```

## ESP32 Boot-Strapping Pins — Avoid
These pins affect boot mode and should not be driven at startup:
- **GPIO0** — Leave floating or HIGH for normal boot (LOW = bootloader mode)
- **GPIO2** — Should be LOW or floating at boot
- **GPIO15** — JTAG / boot-mode related
- **GPIO12** — Flash voltage selection

## Safety Precautions

### Electrical
- Never connect MAX30100 VCC to 5V — it is a 1.8V/3.3V device. 5V will damage it.
- Verify sensor current draw does not exceed the 3.3V regulator's current limit.
- Li-Ion cells can vent or catch fire if overcharged, over-discharged, or short-circuited.
  Use only a TP4056 module with **overcharge AND over-discharge protection** (some boards omit this).
- Add a fuse between battery and circuit.

### Thermal
- Monitor ESP32 and TP4056 temperatures during extended operation.
- Do not operate in environments exceeding 85°C.

### Animal Safety
⚠️ **This collar has not been tested for continuous animal use.**
Before deploying on an animal:
- Ensure the enclosure has no sharp edges.
- Verify the collar is not too tight — allow two fingers between collar and neck.
- Check for heat generation from the ESP32 and charging circuit.
- Do not leave the collar charging while attached to the animal.
- Regularly inspect wiring and connections for wear.
- This is a prototype — consult a veterinarian before extended use.
