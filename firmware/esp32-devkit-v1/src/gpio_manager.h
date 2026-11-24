#ifndef IOT_LAB_GPIO_MANAGER_H
#define IOT_LAB_GPIO_MANAGER_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "config.h"

#if ENABLE_SERVO
  #include <ESP32Servo.h>
  static Servo userServo;
#endif

class GpioManager {
public:
  void init() {
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, LOW);

    #if ENABLE_RELAY
      pinMode(PIN_RELAY_IN, OUTPUT);
      digitalWrite(PIN_RELAY_IN, HIGH); // Default active-low off
    #endif

    #if ENABLE_SERVO
      userServo.attach(PIN_SERVO_PWM);
      userServo.write(90); // Default neutral position
    #endif
  }

  /**
   * Handle incoming gpio_write command from IoT Lab Web App
   */
  bool handleGpioWrite(JsonObject payload, char* replyBuffer, size_t maxLen, const char* replyTo) {
    if (!payload.containsKey("pin") || !payload.containsKey("value")) {
      buildErrorReply(replyBuffer, maxLen, replyTo, "MISSING_PARAMS", "gpio_write requires pin and value");
      return false;
    }

    int pin = payload["pin"];
    int val = payload["value"];

    // 1. Hardware validation: Input-only pin check (GPIO 34-39 on ESP32)
    if (pin == 34 || pin == 35 || pin == 36 || pin == 39) {
      buildErrorReply(replyBuffer, maxLen, replyTo, "HARDWARE_RESTRICTION", "GPIO is input-only on ESP32");
      return false;
    }

    // 2. Execute write
    String mode = payload["mode"] | "OUTPUT";
    if (mode == "PWM") {
      ledcAttachPin(pin, 0); // Attach to LEDC channel 0
      ledcSetup(0, 5000, 8); // 5kHz, 8-bit resolution (0-255)
      ledcWrite(0, constrain(val, 0, 255));
    } else {
      pinMode(pin, OUTPUT);
      digitalWrite(pin, val == 1 || val == HIGH ? HIGH : LOW);
    }

    // 3. Send ACK
    StaticJsonDocument<256> reply;
    reply["protocol_version"] = "1.0";
    reply["device_id"] = DEVICE_ID;
    char msgId[32];
    snprintf(msgId, sizeof(msgId), "ack-%lu", millis());
    reply["message_id"] = msgId;
    reply["timestamp"] = millis();
    reply["type"] = "ack";

    JsonObject ackPayload = reply.createNestedObject("payload");
    ackPayload["reply_to"] = replyTo;
    ackPayload["success"] = true;
    ackPayload["pin"] = pin;
    ackPayload["value"] = val;

    serializeJson(reply, replyBuffer, maxLen);
    return true;
  }

  /**
   * Handle incoming gpio_read command
   */
  bool handleGpioRead(JsonObject payload, char* replyBuffer, size_t maxLen, const char* replyTo) {
    if (!payload.containsKey("pin")) {
      buildErrorReply(replyBuffer, maxLen, replyTo, "MISSING_PARAMS", "gpio_read requires pin");
      return false;
    }

    int pin = payload["pin"];
    String mode = payload["mode"] | "INPUT";

    int val = 0;
    if (mode == "ANALOG") {
      val = analogRead(pin);
    } else {
      val = digitalRead(pin);
    }

    StaticJsonDocument<256> reply;
    reply["protocol_version"] = "1.0";
    reply["device_id"] = DEVICE_ID;
    char msgId[32];
    snprintf(msgId, sizeof(msgId), "ack-%lu", millis());
    reply["message_id"] = msgId;
    reply["timestamp"] = millis();
    reply["type"] = "ack";

    JsonObject ackPayload = reply.createNestedObject("payload");
    ackPayload["reply_to"] = replyTo;
    ackPayload["success"] = true;
    ackPayload["pin"] = pin;
    ackPayload["value"] = val;

    serializeJson(reply, replyBuffer, maxLen);
    return true;
  }

private:
  void buildErrorReply(char* buffer, size_t maxLen, const char* replyTo, const char* code, const char* message) {
    StaticJsonDocument<256> doc;
    doc["protocol_version"] = "1.0";
    doc["device_id"] = DEVICE_ID;
    char msgId[32];
    snprintf(msgId, sizeof(msgId), "err-%lu", millis());
    doc["message_id"] = msgId;
    doc["timestamp"] = millis();
    doc["type"] = "error";

    JsonObject err = doc.createNestedObject("payload");
    if (replyTo) err["reply_to"] = replyTo;
    err["code"] = code;
    err["message"] = message;

    serializeJson(doc, buffer, maxLen);
  }
};

#endif // IOT_LAB_GPIO_MANAGER_H
