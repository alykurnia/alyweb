import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { DHT22Model } from '../sensors/DHT22Model';
import { DHT11Model } from '../sensors/DHT11Model';
import { UltrasonicModel } from '../sensors/UltrasonicModel';
import { SoilMoistureModel } from '../sensors/SoilMoistureModel';
import { MQ135Model } from '../sensors/MQ135Model';
import { BH1750Model } from '../sensors/BH1750Model';
import { BMP280Model } from '../sensors/BMP280Model';

describe('Sensor Simulation Models Unit Tests', () => {
  it('DHT22 handles power state and clamping correctly', () => {
    const dht = new DHT22Model('dht-1');
    assert.strictEqual(dht.isPowered, false);

    // When unpowered
    let reading = dht.getReadings();
    assert.strictEqual(reading.status, 'UNPOWERED');

    // Power sensor
    dht.setPower(true, 3.3);
    assert.strictEqual(dht.isPowered, true);

    dht.setProperty('temperature', 32.5);
    dht.setProperty('humidity', 70);
    reading = dht.getReadings();

    assert.strictEqual(reading.status, 'OK');
    assert.strictEqual(reading.temperature, 32.5);
    assert.strictEqual(reading.humidity, 70);

    // Clamping checks
    dht.setProperty('temperature', 150); // Max 80
    dht.setProperty('humidity', -20); // Min 0
    reading = dht.getReadings();
    assert.strictEqual(reading.temperature, 80);
    assert.strictEqual(reading.humidity, 0);

    // Test DHT11 specific range clamping (0-50°C, 20-90% RH)
    const dht11 = new DHT11Model('dht11-1');
    dht11.setPower(true, 5.0);
    dht11.setProperty('temperature', 90);
    dht11.setProperty('humidity', 10);
    const dht11Reading = dht11.getReadings();
    assert.strictEqual(dht11Reading.temperature, 50);
    assert.strictEqual(dht11Reading.humidity, 20);
  });

  it('Ultrasonic HC-SR04 calculates echo pulse duration correctly', () => {
    const sonar = new UltrasonicModel('sonar-1');
    sonar.setPower(true, 5.0);
    sonar.setProperty('distance', 100); // 100 cm

    const reading = sonar.getReadings();
    assert.strictEqual(reading.distance, 100);
    // At speed of sound 340m/s (29µs/cm one-way): round-trip = 100 * 58 µs = 5800µs
    assert.strictEqual(reading.echoDurationUs, 5800);
  });

  it('Soil Moisture sensor simulates inverse analog voltage', () => {
    const soil = new SoilMoistureModel('soil-1');
    soil.setPower(true, 3.3);

    soil.setProperty('moisture', 80); // 80% wet
    const wetReading = soil.getReadings();
    assert.strictEqual(wetReading.moisture, 80);

    soil.setProperty('moisture', 10); // 10% dry
    const dryReading = soil.getReadings();
    // In capacitive sensors, dry soil produces higher voltage than wet soil
    assert.ok(Number(dryReading.analogVoltage) > Number(wetReading.analogVoltage));
  });

  it('MQ135 simulates air quality and digital threshold trigger', () => {
    const mq = new MQ135Model('mq-1');
    mq.setPower(true, 5.0);

    mq.setProperty('ppm', 200);
    let reading = mq.getReadings();
    assert.strictEqual(reading.ppm, 200);
    assert.strictEqual(reading.airQuality, 'FAIR');

    mq.setProperty('ppm', 800);
    reading = mq.getReadings();
    assert.strictEqual(reading.airQuality, 'HAZARDOUS');
  });

  it('BH1750 and BMP280 return realistic environmental measurements', () => {
    const bh = new BH1750Model('bh-1');
    bh.setPower(true, 3.3);
    bh.setProperty('lux', 500);
    assert.strictEqual(bh.getReadings().lux, 500);

    const bmp = new BMP280Model('bmp-1');
    bmp.setPower(true, 3.3);
    bmp.setProperty('pressure', 1013.25);
    const bmpReading = bmp.getReadings();
    assert.strictEqual(bmpReading.pressure, 1013.25);
    assert.strictEqual(bmpReading.altitude, 0); // Sea level
  });
});
