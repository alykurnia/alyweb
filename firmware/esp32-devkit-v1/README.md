# IoT Lab ESP32 DevKit V1 Firmware

This directory contains the production-grade C++ firmware for connecting a physical **ESP32 DevKit V1** board directly to the **IoT Lab Web Platform** via the **Local Bridge Agent**.

---

## Hardware Pinout & Wiring

| Component | ESP32 DevKit Pin | Type | Notes |
| :--- | :--- | :--- | :--- |
| **Status LED** | **GPIO 2** | Digital Output | Built-in Blue LED |
| **DHT22 Data** | **GPIO 4** | Digital I/O | Requires 4.7kΩ or 10kΩ pull-up |
| **HC-SR04 TRIG** | **GPIO 5** | Digital Output | 10µs trigger pulse |
| **HC-SR04 ECHO** | **GPIO 18** | Digital Input | Use 1kΩ / 2kΩ voltage divider from 5V echo |
| **Soil Moisture AOUT** | **GPIO 34** | Analog Input (ADC1) | **Input-Only GPIO** (0–3.3V) |
| **DS18B20 1-Wire** | **GPIO 19** | Digital 1-Wire | Requires 4.7kΩ pull-up to 3.3V |
| **Relay IN** | **GPIO 21** | Digital Output | Active-Low trigger |
| **Servo Signal** | **GPIO 22** | PWM (50Hz) | 5V power from VIN |

---

## Setup & Flashing Instructions

### Option 1: PlatformIO (Recommended)
1. Install [VS Code](https://code.visualstudio.com/) and the **PlatformIO IDE** extension.
2. Open the folder `firmware/esp32-devkit-v1`.
3. Edit `src/config.h`:
   - Set `WIFI_SSID` and `WIFI_PASSWORD` to your local Wi-Fi.
   - Set `BRIDGE_HOST` to your computer's local IP address (e.g., `192.168.1.50`).
   - Enable only the sensors you have connected by changing `#define ENABLE_... 1`.
4. Connect ESP32 DevKit V1 via micro-USB cable.
5. Click **Upload** (Arrow icon) in PlatformIO toolbar.

### Option 2: Arduino IDE
1. Open Arduino IDE and add ESP32 Board URL in Preferences:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
2. Install board: **ESP32 Dev Module**.
3. Install required libraries from Library Manager:
   - `ArduinoJson` (v6.x)
   - `WebSockets` by Markus Sattler
   - `DHT sensor library`
   - `DallasTemperature` & `OneWire`
   - `ESP32Servo`
4. Compile and upload at **115200 baud**.

---

## Verifying Connection

1. Start the Local Bridge Agent on your computer (`npm start` in `bridge/`).
2. Open IoT Lab at `http://localhost:3001/hardware`.
3. When the ESP32 boots and connects to Wi-Fi, it will perform a handshake with the bridge.
4. The device card will turn green (`CONNECTED`), showing real-time RSSI, uptime, and telemetry readings!
