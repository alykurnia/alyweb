import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GpioController } from '../gpio/GpioController';

describe('GpioController Simulation Unit Tests', () => {
  it('initializes ESP32 DevKit V1 with appropriate pins and restrictions', () => {
    const esp32 = new GpioController('esp32-1', 'esp32-devkit');
    assert.strictEqual(esp32.boardName, 'ESP32 DevKit V1');

    const pin2 = esp32.getPin('pin-gpio2');
    assert.ok(pin2);
    assert.strictEqual(pin2.digitalValue, 'LOW');

    // ESP32 GPIO 34 is input-only
    const pin34 = esp32.getPin('pin-gpio34');
    assert.ok(pin34);

    // Attempting to set pin 34 as OUTPUT should throw an error
    assert.throws(() => {
      esp32.pinMode('pin-gpio34', 'OUTPUT');
    }, /INPUT-ONLY/);
  });

  it('correctly sets digital output and updates voltage', () => {
    const esp32 = new GpioController('esp32-1', 'esp32-devkit');
    esp32.pinMode('pin-gpio4', 'OUTPUT');
    esp32.digitalWrite('pin-gpio4', 'HIGH');

    const pin4 = esp32.getPin('pin-gpio4');
    assert.strictEqual(pin4?.digitalValue, 'HIGH');
    assert.strictEqual(pin4?.voltage, 3.3);

    esp32.digitalWrite('pin-gpio4', 'LOW');
    assert.strictEqual(pin4?.digitalValue, 'LOW');
    assert.strictEqual(pin4?.voltage, 0);
  });

  it('correctly sets PWM duty cycle on PWM-capable pin', () => {
    const esp32 = new GpioController('esp32-1', 'esp32-devkit');
    esp32.analogWrite('pin-gpio18', 128);

    const pin18 = esp32.getPin('pin-gpio18');
    assert.strictEqual(pin18?.mode, 'PWM_OUTPUT');
    assert.strictEqual(pin18?.pwmDuty, 128);
    // 128/255 * 3.3V approx 1.66V
    assert.ok(pin18 && pin18.voltage > 1.5 && pin18.voltage < 1.8);
  });

  it('handles Arduino Uno ADC resolution and pin mapping', () => {
    const uno = new GpioController('uno-1', 'arduino-uno');
    assert.strictEqual(uno.boardName, 'Arduino Uno R3');

    // Analog input A0
    uno.setAnalogVoltage('pin-a0', 2.5);
    const pinA0 = uno.getPin('pin-a0');
    assert.ok(pinA0);
    assert.strictEqual(pinA0.mode, 'ANALOG_INPUT');
    // Arduino 10-bit ADC: 2.5V / 5.0V * 1023 approx 511-512
    assert.ok(pinA0.analogValue >= 510 && pinA0.analogValue <= 512);
  });
});
