# Telegram Bot Setup Guide

## 1. Create a Bot
1. Open Telegram and search for **@BotFather**.
2. Send `/newbot` and follow the prompts.
3. Choose a name (e.g., `PawSense360 Monitor`) and username (e.g., `pawsense360_yourname_bot`).
4. BotFather will give you a **bot token** in this format:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. Copy this token — you will need it for `config.h`.

## 2. Get Your Chat ID
1. Start a conversation with your bot by sending `/start`.
2. Search for **@userinfobot** and send it a message.
3. It will reply with your User ID — this is your Chat ID.
   Alternatively, visit:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
   after sending your bot a message, and look for `"chat":{"id":...}`.

## 3. Configure the Firmware
In `config.h`:
```cpp
#define TELEGRAM_BOT_TOKEN  "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
#define TELEGRAM_CHAT_ID    "987654321"
```

⚠️ **Security:**
- `config.h` is listed in `.gitignore` — never commit it.
- The bot token allows sending messages from your bot.
- Do not share it or include it in GitHub repositories.
- For groups, the chat ID starts with a negative number (e.g., `-100123456789`).

## 4. Alert Types and Format
PawSense360 sends structured Markdown messages:

```
🐾 PawSense360 — Device Online
━━━━━━━━━━━━━━━━━━
📟 Device: PawSense360-001
🕐 Time: 2026-10-19T09:00:00Z
❤️ Heart Rate: 92 BPM (experimental)
🩸 SpO₂: 97% (experimental)
📍 Location: 12.971600, 77.594600
🗺️ Open in Google Maps
✅ PawSense360 is online and monitoring.
```

## 5. Alert Cooldowns
To prevent flooding, each alert type has a minimum cooldown (default: **60 seconds**).
Configurable in `config.h`:
```cpp
#define TELEGRAM_COOLDOWN_MS  60000  // 60 seconds
```

SOS alerts bypass the cooldown and are always delivered immediately.

## 6. Testing
1. Upload firmware with `DEMO_MODE false`.
2. Open Serial Monitor at 115200 baud.
3. You should see `[Telegram] Alert 'Device Online' sent successfully.` on startup.
4. Check your Telegram for the startup message.
5. If you see `HTTP error: 401`, your bot token is incorrect.
6. If you see `HTTP error: 400`, your chat ID is incorrect.

## 7. Connectivity Requirement
Telegram alerts require the ESP32 to have active internet connectivity.
The Neo-6M GPS module is **not** a cellular modem — it only provides location data.
If Wi-Fi is unavailable, alerts are queued and attempted after reconnection.
