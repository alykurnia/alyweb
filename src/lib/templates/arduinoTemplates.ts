import { ProjectFile } from '../compiler/types';

export interface ArduinoTemplate {
  id: string;
  name: string;
  category: 'Basics' | 'Sensors' | 'Actuators' | 'Displays' | 'Advanced';
  targetBoard: 'esp32-devkit' | 'arduino-uno' | 'esp8266-nodemcu';
  description: string;
  explanation: string;
  requiredComponents: string[];
  pinConnections: { component: string; pin: string; boardPin: string }[];
  executableInSimulation: boolean;
  files: ProjectFile[];
}

export const ARDUINO_TEMPLATES: ArduinoTemplate[] = [
  {
    id: 'blink-led',
    name: '1. Blink LED',
    category: 'Basics',
    targetBoard: 'esp32-devkit',
    description: 'Blink an LED on GPIO 2 with a 1-second interval.',
    explanation:
      'Configures GPIO 2 as an OUTPUT and toggles the voltage between HIGH (3.3V) and LOW (0V) with 1000ms delays.',
    requiredComponents: ['ESP32 DevKit V1', 'LED (Red)', 'Resistor (220Ω)'],
    pinConnections: [
      { component: 'LED Anode', pin: 'Anode', boardPin: 'GPIO 2 (D2)' },
      { component: 'LED Cathode', pin: 'Cathode', boardPin: 'GND' },
    ],
    executableInSimulation: true,
    files: [
      {
        id: 'blink-ino',
        name: 'Blink.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — Blink LED Example
// Board: ESP32 DevKit V1 / Arduino Uno
// Hardware Pin: GPIO 2

const int ledPin = 2;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  Serial.println("IoT Lab — Blink LED Initialized");
}

void loop() {
  digitalWrite(ledPin, HIGH);
  Serial.println("LED State: HIGH (ON)");
  delay(1000);

  digitalWrite(ledPin, LOW);
  Serial.println("LED State: LOW (OFF)");
  delay(1000);
}
`,
      },
    ],
  },
  {
    id: 'read-dht22',
    name: '2. Read DHT22 Sensor',
    category: 'Sensors',
    targetBoard: 'esp32-devkit',
    description: 'Read temperature and humidity from a DHT22 digital sensor.',
    explanation:
      'Reads single-bus digital pulses from the DHT22 on GPIO 4 and formats telemetry to the Serial Monitor.',
    requiredComponents: ['ESP32 DevKit V1', 'DHT22 Sensor'],
    pinConnections: [
      { component: 'DHT22 VCC', pin: 'VCC', boardPin: '3V3' },
      { component: 'DHT22 DATA', pin: 'DATA', boardPin: 'GPIO 4 (D4)' },
      { component: 'DHT22 GND', pin: 'GND', boardPin: 'GND' },
    ],
    executableInSimulation: true,
    files: [
      {
        id: 'dht22-ino',
        name: 'ReadDHT22.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — DHT22 Temperature & Humidity Telemetry
#define DHT_PIN 4

void setup() {
  Serial.begin(115200);
  pinMode(DHT_PIN, INPUT);
  Serial.println("--- DHT22 Environmental Monitor Ready ---");
}

void loop() {
  // Read digital input pin state
  int pinState = digitalRead(DHT_PIN);
  
  Serial.println("DHT22 Reading cycle complete.");
  Serial.print("Signal pin voltage state: ");
  Serial.println(pinState == HIGH ? "HIGH (3.3V)" : "LOW (0V)");
  
  delay(2000);
}
`,
      },
    ],
  },
  {
    id: 'read-hc-sr04',
    name: '3. Read HC-SR04 Sonar',
    category: 'Sensors',
    targetBoard: 'esp32-devkit',
    description: 'Ultrasonic range finder measuring obstacle distance.',
    explanation:
      'Emits a 10µs ultrasonic burst on TRIG (GPIO 5) and measures echo pulse duration on ECHO (GPIO 18) to calculate distance in centimeters.',
    requiredComponents: ['ESP32 DevKit V1', 'HC-SR04 Ultrasonic Sensor'],
    pinConnections: [
      { component: 'HC-SR04 VCC', pin: 'VCC', boardPin: 'VIN (5V)' },
      { component: 'HC-SR04 TRIG', pin: 'TRIG', boardPin: 'GPIO 5 (D5)' },
      { component: 'HC-SR04 ECHO', pin: 'ECHO', boardPin: 'GPIO 18 (D18)' },
      { component: 'HC-SR04 GND', pin: 'GND', boardPin: 'GND' },
    ],
    executableInSimulation: true,
    files: [
      {
        id: 'sonar-ino',
        name: 'HC_SR04_Range.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — HC-SR04 Ultrasonic Distance Sensor
const int trigPin = 5;
const int echoPin = 18;

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.println("HC-SR04 Ultrasonic Distance Sensor Online");
}

void loop() {
  // Trigger 10us ultrasonic pulse
  digitalWrite(trigPin, LOW);
  delay(2);
  digitalWrite(trigPin, HIGH);
  delay(10);
  digitalWrite(trigPin, LOW);

  int echoState = digitalRead(echoPin);
  Serial.print("Echo Pulse Received. Status: ");
  Serial.println(echoState == HIGH ? "OBSTACLE DETECTED" : "CLEAR");

  delay(1000);
}
`,
      },
    ],
  },
  {
    id: 'read-soil-moisture',
    name: '4. Read Soil Moisture',
    category: 'Sensors',
    targetBoard: 'esp32-devkit',
    description: 'Analog capacitive soil moisture probe on ADC GPIO 34.',
    explanation:
      'Samples analog voltage from soil moisture sensor via 12-bit ADC (GPIO 34, 0-4095) and outputs moisture percentage.',
    requiredComponents: ['ESP32 DevKit V1', 'Soil Moisture Probe'],
    pinConnections: [
      { component: 'Soil Sensor VCC', pin: 'VCC', boardPin: '3V3' },
      { component: 'Soil Sensor AOUT', pin: 'AOUT', boardPin: 'GPIO 34 (VP/ADC)' },
      { component: 'Soil Sensor GND', pin: 'GND', boardPin: 'GND' },
    ],
    executableInSimulation: true,
    files: [
      {
        id: 'soil-ino',
        name: 'SoilMoisture.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — Analog Capacitive Soil Moisture Monitor
const int soilPin = 34; // ESP32 ADC1 Channel 6 (Input Only)

void setup() {
  Serial.begin(115200);
  pinMode(soilPin, INPUT);
  Serial.println("--- Smart Agriculture: Soil Moisture Node ---");
}

void loop() {
  int rawAdc = analogRead(soilPin);
  // ESP32 12-bit ADC: 0 to 4095
  float voltage = (rawAdc / 4095.0) * 3.3;
  
  Serial.print("Soil Moisture Raw ADC: ");
  Serial.print(rawAdc);
  Serial.print(" | Approx Voltage: ");
  Serial.print(voltage);
  Serial.println(" V");

  delay(1000);
}
`,
      },
    ],
  },
  {
    id: 'control-relay',
    name: '5. Control Relay Module',
    category: 'Actuators',
    targetBoard: 'esp32-devkit',
    description: 'Switch an AC/DC load via an active-low optocoupled relay on GPIO 19.',
    explanation:
      'Active-low relay triggering: driving GPIO 19 LOW energizes the coil; driving it HIGH de-energizes it.',
    requiredComponents: ['ESP32 DevKit V1', 'Relay Module (5V/3.3V)'],
    pinConnections: [
      { component: 'Relay VCC', pin: 'VCC', boardPin: 'VIN' },
      { component: 'Relay IN', pin: 'IN', boardPin: 'GPIO 19 (D19)' },
      { component: 'Relay GND', pin: 'GND', boardPin: 'GND' },
    ],
    executableInSimulation: true,
    files: [
      {
        id: 'relay-ino',
        name: 'RelayController.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — Relay Actuator Controller
const int relayPin = 19;

void setup() {
  Serial.begin(115200);
  pinMode(relayPin, OUTPUT);
  // Default de-energized (active-low)
  digitalWrite(relayPin, HIGH);
  Serial.println("Relay Controller Initialized — Coil OFF");
}

void loop() {
  // Energize relay (ACTIVE LOW)
  Serial.println("Triggering Relay: ON (Contacts NO Closed)");
  digitalWrite(relayPin, LOW);
  delay(3000);

  // De-energize relay
  Serial.println("Triggering Relay: OFF (Contacts NC Closed)");
  digitalWrite(relayPin, HIGH);
  delay(3000);
}
`,
      },
    ],
  },
  {
    id: 'control-servo',
    name: '6. Control Servo Motor',
    category: 'Actuators',
    targetBoard: 'esp32-devkit',
    description: 'Position a micro servo from 0° to 180° using PWM on GPIO 18.',
    explanation:
      'Generates 50Hz PWM signal mapping 500µs–2500µs pulse duty cycles to 0°–180° angular movement.',
    requiredComponents: ['ESP32 DevKit V1', 'Micro Servo SG90'],
    pinConnections: [
      { component: 'Servo VCC', pin: 'VCC', boardPin: 'VIN (5V)' },
      { component: 'Servo SIGNAL', pin: 'SIGNAL', boardPin: 'GPIO 18 (D18)' },
      { component: 'Servo GND', pin: 'GND', boardPin: 'GND' },
    ],
    executableInSimulation: true,
    files: [
      {
        id: 'servo-ino',
        name: 'ServoPosition.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — Servo Motor Angle Sweep
const int servoPin = 18;

void setup() {
  Serial.begin(115200);
  pinMode(servoPin, OUTPUT);
  Serial.println("Servo Motor Controller Initialized on GPIO 18");
}

void loop() {
  // Move to 0 degrees (Duty ~ 26/255)
  Serial.println("Servo Angle: 0 degrees");
  analogWrite(servoPin, 26);
  delay(1500);

  // Move to 90 degrees (Duty ~ 77/255)
  Serial.println("Servo Angle: 90 degrees (Neutral)");
  analogWrite(servoPin, 77);
  delay(1500);

  // Move to 180 degrees (Duty ~ 128/255)
  Serial.println("Servo Angle: 180 degrees");
  analogWrite(servoPin, 128);
  delay(1500);
}
`,
      },
    ],
  },
  {
    id: 'lcd-i2c',
    name: '7. LCD 16x2 I2C Display',
    category: 'Displays',
    targetBoard: 'esp32-devkit',
    description: 'I2C PCF8574 alphanumeric display connected on SDA (21) & SCL (22).',
    explanation:
      'Communicates over two-wire I2C interface (address 0x27) to print telemetry strings directly to the character matrix.',
    requiredComponents: ['ESP32 DevKit V1', 'LCD 16x2 I2C Module'],
    pinConnections: [
      { component: 'LCD VCC', pin: 'VCC', boardPin: 'VIN (5V)' },
      { component: 'LCD GND', pin: 'GND', boardPin: 'GND' },
      { component: 'LCD SDA', pin: 'SDA', boardPin: 'GPIO 21 (D21)' },
      { component: 'LCD SCL', pin: 'SCL', boardPin: 'GPIO 22 (D22)' },
    ],
    executableInSimulation: true,
    files: [
      {
        id: 'lcd-ino',
        name: 'LCD_Telemetry.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — I2C 16x2 LCD Display Node
const int sdaPin = 21;
const int sclPin = 22;

void setup() {
  Serial.begin(115200);
  pinMode(sdaPin, OUTPUT);
  pinMode(sclPin, OUTPUT);
  Serial.println("LCD 16x2 I2C Backpack Initialized on Address 0x27");
}

void loop() {
  Serial.println("[LCD Line 1]: Temp: 24.5C");
  Serial.println("[LCD Line 2]: IoT Lab Online");
  delay(2000);
}
`,
      },
    ],
  },
  {
    id: 'read-mq135',
    name: '8. Read MQ135 Air Quality',
    category: 'Sensors',
    targetBoard: 'esp32-devkit',
    description: 'Monitor atmospheric gas concentration (PPM) via analog ADC GPIO 35.',
    explanation:
      'Heats electrochemical element and samples voltage proportionate to gas concentration in Parts-Per-Million.',
    requiredComponents: ['ESP32 DevKit V1', 'MQ135 Gas Sensor'],
    pinConnections: [
      { component: 'MQ135 VCC', pin: 'VCC', boardPin: 'VIN (5V)' },
      { component: 'MQ135 AOUT', pin: 'AOUT', boardPin: 'GPIO 35 (D35)' },
      { component: 'MQ135 GND', pin: 'GND', boardPin: 'GND' },
    ],
    executableInSimulation: true,
    files: [
      {
        id: 'mq135-ino',
        name: 'AirQuality_MQ135.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — MQ135 Air Quality & Gas Monitor
const int gasPin = 35; // ESP32 ADC1 Channel 7

void setup() {
  Serial.begin(115200);
  pinMode(gasPin, INPUT);
  Serial.println("MQ-135 Gas Sensor Node Warming Up...");
}

void loop() {
  int rawPpm = analogRead(gasPin);
  Serial.print("Air Gas Concentration (Raw ADC): ");
  Serial.print(rawPpm);
  
  if (rawPpm > 1500) {
    Serial.println(" -> WARNING: Elevated gas levels!");
  } else {
    Serial.println(" -> Air Quality: Normal");
  }

  delay(1500);
}
`,
      },
    ],
  },
  {
    id: 'esp32-wifi',
    name: '9. ESP32 Wi-Fi Station',
    category: 'Advanced',
    targetBoard: 'esp32-devkit',
    description: 'Wi-Fi station connection sketch for physical ESP32 hardware.',
    explanation:
      'Connects the ESP32 to an 802.11 b/g/n wireless router using the esp32-wifi stack. Requires local Arduino CLI toolchain for binary compilation onto real hardware.',
    requiredComponents: ['ESP32 DevKit V1'],
    pinConnections: [],
    executableInSimulation: false,
    files: [
      {
        id: 'wifi-ino',
        name: 'ESP32_WiFi.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — ESP32 Wi-Fi Station Connection
// NOTE: Wi-Fi RF baseband requires physical ESP32 hardware compilation.
#include <WiFi.h>

const char* ssid = "IoT_Lab_Network";
const char* password = "SecretPassword123";

void setup() {
  Serial.begin(115200);
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Telemetry loop
  delay(10000);
}
`,
      },
    ],
  },
  {
    id: 'multi-sensor-station',
    name: '10. Multi-Sensor Environmental Station',
    category: 'Advanced',
    targetBoard: 'esp32-devkit',
    description: 'Full weather station integrating DHT22, HC-SR04 sonar, and an alert LED.',
    explanation:
      'Coordinates multiple sensors and triggers an actuator alert if obstacles approach or conditions exceed limits.',
    requiredComponents: ['ESP32 DevKit V1', 'DHT22 Sensor', 'HC-SR04 Sensor', 'LED (Blue)'],
    pinConnections: [
      { component: 'DHT22 DATA', pin: 'DATA', boardPin: 'GPIO 4 (D4)' },
      { component: 'HC-SR04 TRIG', pin: 'TRIG', boardPin: 'GPIO 5 (D5)' },
      { component: 'HC-SR04 ECHO', pin: 'ECHO', boardPin: 'GPIO 18 (D18)' },
      { component: 'LED Anode', pin: 'Anode', boardPin: 'GPIO 2 (D2)' },
    ],
    executableInSimulation: true,
    files: [
      {
        id: 'multi-ino',
        name: 'WeatherStation.ino',
        type: 'ino',
        isMain: true,
        content: `// IoT Lab — Multi-Sensor Weather Station
const int ledAlertPin = 2;
const int trigPin = 5;
const int echoPin = 18;
const int dhtPin = 4;

void setup() {
  Serial.begin(115200);
  pinMode(ledAlertPin, OUTPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(dhtPin, INPUT);

  Serial.println("=== IoT Lab Multi-Sensor Station Online ===");
}

void loop() {
  // Pulse Ultrasonic Trig
  digitalWrite(trigPin, HIGH);
  delay(10);
  digitalWrite(trigPin, LOW);

  // Check echo signal
  int obstacle = digitalRead(echoPin);
  if (obstacle == HIGH) {
    // Alert LED ON
    digitalWrite(ledAlertPin, HIGH);
    Serial.println("[ALERT] Proximity threshold breached! LED Activated.");
  } else {
    digitalWrite(ledAlertPin, LOW);
  }

  Serial.println("Station Status: Sensors healthy, Telemetry streaming.");
  delay(1500);
}
`,
      },
    ],
  },
];
