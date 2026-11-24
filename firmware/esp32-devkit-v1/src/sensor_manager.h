#ifndef IOT_LAB_SENSOR_MANAGER_H
#define IOT_LAB_SENSOR_MANAGER_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "config.h"

#if ENABLE_DHT22
  #include <DHT.h>
  static DHT dhtSensor(PIN_DHT22_DATA, DHT22);
#endif

#if ENABLE_DS18B20
  #include <OneWire.h>
  #include <DallasTemperature.h>
  static OneWire oneWire(PIN_DS18B20_ONEWIRE);
  static DallasTemperature ds18b20Sensor(&oneWire);
#endif

class SensorManager {
public:
  void init() {
    #if ENABLE_DHT22
      dhtSensor.begin();
    #endif

    #if ENABLE_DS18B20
      ds18b20Sensor.begin();
    #endif

    #if ENABLE_HCSR04
      pinMode(PIN_HCSR04_TRIG, OUTPUT);
      pinMode(PIN_HCSR04_ECHO, INPUT);
      digitalWrite(PIN_HCSR04_TRIG, LOW);
    #endif

    #if ENABLE_SOIL_MOISTURE
      pinMode(PIN_SOIL_ANALOG, INPUT);
    #endif
  }

  bool buildTelemetryJson(char* buffer, size_t maxLen) {
    StaticJsonDocument<512> doc;
    doc["protocol_version"] = "1.0";
    doc["device_id"] = DEVICE_ID;
    char msgId[32];
    snprintf(msgId, sizeof(msgId), "tel-%lu", millis());
    doc["message_id"] = msgId;
    doc["timestamp"] = millis();
    doc["type"] = "telemetry";

    JsonObject payload = doc.createNestedObject("payload");
    bool hasData = false;

    #if ENABLE_DHT22
      float temp = dhtSensor.readTemperature();
      float hum = dhtSensor.readHumidity();
      if (!isnan(temp) && !isnan(hum)) {
        payload["temperature"] = round(temp * 10) / 10.0;
        payload["humidity"] = round(hum * 10) / 10.0;
        hasData = true;
      }
    #endif

    #if ENABLE_DS18B20
      ds18b20Sensor.requestTemperatures();
      float dsTemp = ds18b20Sensor.getTempCByIndex(0);
      if (dsTemp != DEVICE_DISCONNECTED_C) {
        payload["temperature_probe"] = round(dsTemp * 10) / 10.0;
        hasData = true;
      }
    #endif

    #if ENABLE_HCSR04
      digitalWrite(PIN_HCSR04_TRIG, HIGH);
      delayMicroseconds(10);
      digitalWrite(PIN_HCSR04_TRIG, LOW);
      unsigned long durationUs = pulseIn(PIN_HCSR04_ECHO, HIGH, 30000); // 30ms timeout (~5m)
      if (durationUs > 0) {
        float distanceCm = (durationUs * 0.0343) / 2.0;
        payload["distance"] = round(distanceCm * 10) / 10.0;
        hasData = true;
      }
    #endif

    #if ENABLE_SOIL_MOISTURE
      int rawAdc = analogRead(PIN_SOIL_ANALOG);
      // Map 12-bit ADC (0-4095) to percentage
      float moisturePct = constrain(map(rawAdc, 3200, 1400, 0, 100), 0, 100);
      payload["soil_moisture"] = moisturePct;
      hasData = true;
    #endif

    // Read general status pin state
    payload["status_led"] = digitalRead(PIN_STATUS_LED);

    serializeJson(doc, buffer, maxLen);
    return true;
  }
};

#endif // IOT_LAB_SENSOR_MANAGER_H
