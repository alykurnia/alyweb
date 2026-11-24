#include <Arduino.h>
#include "config.h"
#include "sensor_manager.h"
#include "gpio_manager.h"
#include "communication.h"

// Singleton Hardware Managers
static SensorManager sensorMgr;
static GpioManager gpioMgr;
static CommunicationManager commMgr(sensorMgr, gpioMgr);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================================");
  Serial.println("  IoT Lab — ESP32 DevKit V1 Hardware Firmware v1.0.0   ");
  Serial.println("========================================================");

  // Initialize GPIO and Sensors
  gpioMgr.init();
  sensorMgr.init();

  // Initialize Wi-Fi and Bridge Communication
  commMgr.init();
}

void loop() {
  // Drive WebSocket event loop, heartbeat, and sensor polling
  commMgr.loop();
  delay(10); // Yield to FreeRTOS watchdog
}
