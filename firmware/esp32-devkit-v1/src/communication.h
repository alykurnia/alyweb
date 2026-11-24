#ifndef IOT_LAB_COMMUNICATION_H
#define IOT_LAB_COMMUNICATION_H

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "device_info.h"
#include "sensor_manager.h"
#include "gpio_manager.h"

class CommunicationManager {
private:
  WebSocketsClient webSocket;
  SensorManager& sensors;
  GpioManager& gpio;
  unsigned long lastHeartbeat = 0;
  unsigned long lastTelemetry = 0;
  bool isConnected = false;

public:
  CommunicationManager(SensorManager& sm, GpioManager& gm)
    : sensors(sm), gpio(gm) {}

  void init() {
    Serial.printf("[WiFi] Connecting to %s...\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
    } else {
      Serial.println("\n[WiFi] Connection timeout. Retrying in background...");
    }

    // Initialize WebSocket Client connecting to Local Bridge Agent
    webSocket.begin(BRIDGE_HOST, BRIDGE_PORT, BRIDGE_PATH);
    webSocket.onEvent([this](WStype_t type, uint8_t* payload, size_t length) {
      this->onWebSocketEvent(type, payload, length);
    });
    webSocket.setReconnectInterval(5000);
    webSocket.enableHeartbeat(15000, 3000, 2);
  }

  void loop() {
    webSocket.loop();

    if (!isConnected) return;

    unsigned long now = millis();

    // Periodic Heartbeat
    if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
      lastHeartbeat = now;
      sendHeartbeat();
    }

    // Periodic Telemetry
    if (now - lastTelemetry >= TELEMETRY_INTERVAL_MS) {
      lastTelemetry = now;
      sendTelemetry();
    }
  }

  void onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
      case WStype_DISCONNECTED:
        Serial.println("[WS] Disconnected from IoT Lab Bridge.");
        isConnected = false;
        digitalWrite(PIN_STATUS_LED, LOW);
        break;

      case WStype_CONNECTED:
        Serial.printf("[WS] Connected to Bridge at %s:%d\n", BRIDGE_HOST, BRIDGE_PORT);
        isConnected = true;
        digitalWrite(PIN_STATUS_LED, HIGH);
        // Send initial Handshake (hello)
        sendHandshake();
        // Send detailed device specs
        sendDeviceInfo();
        break;

      case WStype_TEXT: {
        char* text = (char*)payload;
        handleIncomingMessage(text);
        break;
      }

      default:
        break;
    }
  }

private:
  void sendHandshake() {
    StaticJsonDocument<256> doc;
    doc["protocol_version"] = "1.0";
    doc["device_id"] = DEVICE_ID;
    char msgId[32];
    snprintf(msgId, sizeof(msgId), "hello-%lu", millis());
    doc["message_id"] = msgId;
    doc["timestamp"] = millis();
    doc["type"] = "hello";

    JsonObject payload = doc.createNestedObject("payload");
    payload["token"] = PAIRING_TOKEN;
    payload["firmware_version"] = FIRMWARE_VERSION;
    payload["board_type"] = BOARD_TYPE;

    JsonArray caps = payload.createNestedArray("capabilities");
    caps.add("gpio");
    caps.add("telemetry");
    caps.add("pwm");
    #if ENABLE_DHT22
      caps.add("dht22");
    #endif
    #if ENABLE_HCSR04
      caps.add("hcsr04");
    #endif
    #if ENABLE_SOIL_MOISTURE
      caps.add("soil_moisture");
    #endif

    char buffer[256];
    serializeJson(doc, buffer, sizeof(buffer));
    webSocket.sendTXT(buffer);
    Serial.println("[WS] Handshake transmitted to bridge.");
  }

  void sendDeviceInfo() {
    char buffer[512];
    populateDeviceInfoJson(buffer, sizeof(buffer));
    webSocket.sendTXT(buffer);
  }

  void sendHeartbeat() {
    StaticJsonDocument<256> doc;
    doc["protocol_version"] = "1.0";
    doc["device_id"] = DEVICE_ID;
    char msgId[32];
    snprintf(msgId, sizeof(msgId), "hb-%lu", millis());
    doc["message_id"] = msgId;
    doc["timestamp"] = millis();
    doc["type"] = "heartbeat";

    JsonObject payload = doc.createNestedObject("payload");
    payload["uptime_seconds"] = millis() / 1000;
    payload["rssi"] = WiFi.RSSI();
    payload["free_heap"] = ESP.getFreeHeap();

    char buffer[256];
    serializeJson(doc, buffer, sizeof(buffer));
    webSocket.sendTXT(buffer);
  }

  void sendTelemetry() {
    char buffer[512];
    if (sensors.buildTelemetryJson(buffer, sizeof(buffer))) {
      webSocket.sendTXT(buffer);
    }
  }

  void handleIncomingMessage(const char* text) {
    StaticJsonDocument<512> doc;
    DeserializationError err = deserializeJson(doc, text);
    if (err) {
      Serial.printf("[WS] Failed to parse message JSON: %s\n", err.c_str());
      return;
    }

    const char* type = doc["type"] | "";
    const char* msgId = doc["message_id"] | "";
    JsonObject payload = doc["payload"];

    char replyBuffer[512];

    if (strcmp(type, "gpio_write") == 0) {
      if (gpio.handleGpioWrite(payload, replyBuffer, sizeof(replyBuffer), msgId)) {
        webSocket.sendTXT(replyBuffer);
      }
    } else if (strcmp(type, "gpio_read") == 0) {
      if (gpio.handleGpioRead(payload, replyBuffer, sizeof(replyBuffer), msgId)) {
        webSocket.sendTXT(replyBuffer);
      }
    } else if (strcmp(type, "ack") == 0) {
      Serial.printf("[WS] Bridge ACK: %s\n", (const char*)payload["message"]);
    }
  }
};

#endif // IOT_LAB_COMMUNICATION_H
