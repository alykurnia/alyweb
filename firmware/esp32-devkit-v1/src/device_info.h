#ifndef IOT_LAB_DEVICE_INFO_H
#define IOT_LAB_DEVICE_INFO_H

#include <Arduino.h>
#include <WiFi.h>
#include "config.h"

inline void populateDeviceInfoJson(char* buffer, size_t maxLen) {
  uint32_t flashSize = ESP.getFlashChipSize();
  uint32_t freeHeap = ESP.getFreeHeap();
  uint32_t cpuFreq = ESP.getCpuFreqMHz();
  int rssi = WiFi.RSSI();
  String ip = WiFi.localIP().toString();
  String mac = WiFi.macAddress();
  uint32_t uptime = millis() / 1000;

  snprintf(buffer, maxLen,
    "{"
    "\"protocol_version\":\"1.0\","
    "\"device_id\":\"%s\","
    "\"message_id\":\"info-%lu\","
    "\"timestamp\":%lu,"
    "\"type\":\"device_info\","
    "\"payload\":{"
      "\"board_type\":\"%s\","
      "\"chip_model\":\"%s\","
      "\"cores\":%d,"
      "\"cpu_freq_mhz\":%lu,"
      "\"flash_size_bytes\":%lu,"
      "\"free_heap_bytes\":%lu,"
      "\"ip_address\":\"%s\","
      "\"mac_address\":\"%s\","
      "\"wifi_rssi\":%d,"
      "\"firmware_version\":\"%s\","
      "\"uptime_seconds\":%lu"
    "}"
    "}",
    DEVICE_ID, millis(), millis(),
    BOARD_TYPE, ESP.getChipModel(), ESP.getChipCores(), (unsigned long)cpuFreq,
    (unsigned long)flashSize, (unsigned long)freeHeap, ip.c_str(), mac.c_str(),
    rssi, FIRMWARE_VERSION, (unsigned long)uptime
  );
}

#endif // IOT_LAB_DEVICE_INFO_H
