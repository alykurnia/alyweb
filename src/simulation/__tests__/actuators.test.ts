import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { LEDModel } from '../actuators/LEDModel';
import { RelayModel } from '../actuators/RelayModel';
import { ServoModel } from '../actuators/ServoModel';
import { BuzzerModel } from '../actuators/BuzzerModel';

describe('Actuator Simulation Models Unit Tests', () => {
  it('LED reacts to digital signals and PWM brightness', () => {
    const led = new LEDModel('led-1');
    assert.strictEqual(led.isOn, false);
    assert.strictEqual(led.brightness, 0);

    // Digital HIGH
    led.updateFromSignal({ digital: 'HIGH', voltage: 3.3 });
    assert.strictEqual(led.isOn, true);
    assert.strictEqual(led.brightness, 100);

    // Digital LOW
    led.updateFromSignal({ digital: 'LOW', voltage: 0 });
    assert.strictEqual(led.isOn, false);
    assert.strictEqual(led.brightness, 0);

    // PWM duty (128 / 255 = 50%)
    led.updateFromSignal({ digital: 'HIGH', pwmDuty: 128 });
    assert.strictEqual(led.isOn, true);
    assert.strictEqual(led.brightness, 50);
  });

  it('Relay module toggles contacts based on active-low trigger', () => {
    const relay = new RelayModel('relay-1', 'Relay 1', 'active-low');
    relay.setPower(true, 5.0);

    // Default state: not energized, NO is open, NC is closed
    assert.strictEqual(relay.isEnergized, false);
    assert.strictEqual(relay.contactState, 'NO_OPEN_NC_CLOSED');

    // Trigger signal LOW -> Energizes relay
    relay.updateFromSignal({ digital: 'LOW' });
    assert.strictEqual(relay.isEnergized, true);
    assert.strictEqual(relay.contactState, 'NO_CLOSED_NC_OPEN');
    assert.strictEqual(relay.clickCount, 1);

    // Trigger signal HIGH -> De-energizes relay
    relay.updateFromSignal({ digital: 'HIGH' });
    assert.strictEqual(relay.isEnergized, false);
    assert.strictEqual(relay.contactState, 'NO_OPEN_NC_CLOSED');
  });

  it('Servo motor maps PWM pulse duty to rotation degrees', () => {
    const servo = new ServoModel('servo-1');
    servo.setPower(true, 5.0);

    // 0 duty -> 0 degrees
    servo.updateFromSignal({ digital: 'LOW', pwmDuty: 0 });
    assert.strictEqual(servo.angle, 0);

    // 255 duty -> 180 degrees
    servo.updateFromSignal({ digital: 'HIGH', pwmDuty: 255 });
    assert.strictEqual(servo.angle, 180);

    // 128 duty -> ~90 degrees
    servo.updateFromSignal({ digital: 'HIGH', pwmDuty: 128 });
    assert.strictEqual(servo.angle, 90);
  });

  it('Buzzer sounds on HIGH and tracks frequency', () => {
    const buzzer = new BuzzerModel('buzzer-1');
    buzzer.setPower(true, 3.3);

    assert.strictEqual(buzzer.isSounding, false);

    buzzer.updateFromSignal({ digital: 'HIGH', frequency: 1000 });
    assert.strictEqual(buzzer.isSounding, true);
    assert.strictEqual(buzzer.frequency, 1000);

    buzzer.updateFromSignal({ digital: 'LOW' });
    assert.strictEqual(buzzer.isSounding, false);
  });
});
