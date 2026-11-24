#ifndef IOT_LAB_CONFIG_H
#define IOT_LAB_CONFIG_H

// ============================================================================
// Wi-Fi Configuration
// ============================================================================
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"

// ============================================================================
// IoT Lab Local Bridge Agent Configuration
// Replace with the IP address of your computer running the bridge
// ============================================================================
#define BRIDGE_HOST         "192.168.1.100" // IP address of computer running IoT Lab Local Bridge
#define BRIDGE_PORT         8765
#define BRIDGE_PATH         "/ws/device"

// ============================================================================
// Device Authentication & Pairing
// Must match the pairing token configured in IoT Lab Device Manager
// ============================================================================
#define DEVICE_ID           "esp32-lab-001"
#define PAIRING_TOKEN       "iotlab-secret-token-2026"
#define FIRMWARE_VERSION    "1.0.0"
#define BOARD_TYPE          "esp32-devkit"

// ============================================================================
// Timing Configuration (milliseconds)
// ============================================================================
#define HEARTBEAT_INTERVAL_MS   5000   // Send heartbeat every 5 seconds
#define TELEMETRY_INTERVAL_MS   2000   // Publish sensor data every 2 seconds

// ============================================================================
// Conditional Hardware Peripheral Feature Toggles
// Enable (1) or Disable (0) only the hardware you physically have connected!
// ============================================================================
#define ENABLE_STATUS_LED       1      // Built-in status LED (GPIO 2)
#define ENABLE_DHT22            0      // DHT22 / DHT11 Temperature & Humidity
#define ENABLE_HCSR04           0      // HC-SR04 Ultrasonic Sonar
#define ENABLE_SOIL_MOISTURE    0      // Analog Capacitive Soil Probe
#define ENABLE_DS18B20          0      // DS18B20 1-Wire Thermometer
#define ENABLE_RELAY            0      // Active-low Relay Module
#define ENABLE_SERVO            0      // SG90 Micro Servo

// ============================================================================
// Hardware Pin Mapping (ESP32 DevKit V1)
// ============================================================================
#define PIN_STATUS_LED          2      // Built-in blue LED
#define PIN_DHT22_DATA          4      // GPIO 4
#define PIN_HCSR04_TRIG         5      // GPIO 5
#define PIN_HCSR04_ECHO         18     // GPIO 18
#define PIN_SOIL_ANALOG         34     // GPIO 34 (ADC1 Channel 6 - Input Only)
#define PIN_DS18B20_ONEWIRE     19     // GPIO 19
#define PIN_RELAY_IN            21     // GPIO 21 (Active-Low)
#define PIN_SERVO_PWM           22     // GPIO 22

#endif // IOT_LAB_CONFIG_H
