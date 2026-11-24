# IoT Lab Local Hardware Bridge Agent

The **IoT Lab Local Bridge Agent** is a dedicated Node.js service that runs locally on your workstation to bridge web browsers with physical IoT microcontrollers (ESP32 DevKit V1, ESP8266, Arduino).

---

## Architecture Overview

```
 [IoT Lab Web App] (Browser)
        ▲
        │  WebSocket (/ws/client)
        ▼
 [IoT Lab Local Bridge Agent] (Port 8765)
        ▲
        │  WebSocket (/ws/device) or USB SerialPort
        ▼
 [Physical ESP32 DevKit V1] (Hardware)
```

- **WebSocket Server**: Binds to `0.0.0.0:8765` so physical ESP32 devices on your local Wi-Fi can connect directly.
- **Protocol Version**: `1.0` with strict schema validation.
- **Security**: Device token pairing, origin validation, command expiration checks, and GPIO pin allowlists (blocks illegal writes to input-only pins 34–39).

---

## Installation & Setup

### Prerequisites
- Node.js (v18.0.0 or later)
- An ESP32 DevKit V1 board connected to the same local Wi-Fi network or via USB cable.

### 1. Install Dependencies
```bash
cd bridge
npm install
```

### 2. Run the Bridge Agent
```bash
# Start on default port 8765
npm start

# Or specify custom port/host
npx tsx src/index.ts --port 8765 --host 0.0.0.0
```

### 3. Run Automated Tests
```bash
npm test
```

---

## Communication Protocol (JSON Schema)

Every message transmitted through the bridge uses this structure:

```json
{
  "protocol_version": "1.0",
  "device_id": "esp32-lab-001",
  "message_id": "msg-1730000000000",
  "timestamp": 1730000000000,
  "type": "telemetry",
  "payload": {
    "temperature": 27.8,
    "humidity": 65.2,
    "soil_moisture": 48
  }
}
```

### Supported Message Types:
- `hello` : Device authentication handshake containing the pairing token.
- `device_info` : Firmware version, chip model, IP address, RSSI, and pin capabilities.
- `telemetry` : Real-time sensor readings.
- `gpio_write` : Command from browser to drive physical GPIO pin (HIGH/LOW/PWM).
- `gpio_read` : Command to sample digital/analog pin state.
- `heartbeat` : Keep-alive message sent every 5 seconds.
- `ack` / `error` : Execution acknowledgment and diagnostics.

---

## Pairing a Device

1. In the IoT Lab web app, navigate to **Hardware > Device Manager**.
2. Click **Pair New Device**.
3. Enter your Device ID (e.g. `esp32-lab-001`) and Secret Token (e.g. `iotlab-secret-token-2026`).
4. Flashed ESP32 devices using this token will connect to `ws://<YOUR_COMPUTER_IP>:8765/ws/device`.
