'use client';

import React, { useState } from 'react';
import {
  Sliders,
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Power,
  Cpu,
  Info,
} from 'lucide-react';
import { useHardwareStore } from '../stores/hardwareStore';
import { ESP32_HARDWARE_PINS } from '../types/protocol';

export function GpioControlPanel() {
  const {
    registeredDevices,
    activeDeviceId,
    setActiveDeviceId,
    hardwareModeEnabled,
    setHardwareModeEnabled,
    sendGpioWrite,
    sendGpioRead,
    emergencyStop,
  } = useHardwareStore();

  const [confirmActuator, setConfirmActuator] = useState<{
    pin: number;
    value: number;
    title: string;
  } | null>(null);

  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const activeDevice = registeredDevices.find((d) => d.deviceId === activeDeviceId) || registeredDevices[0];
  const isOnline = activeDevice && activeDevice.status === 'connected';

  // Major ESP32 GPIO Pins list for control grid
  const pinList = [
    { pin: 2, label: 'GPIO 2 (LED)', pwm: true, safe: true },
    { pin: 4, label: 'GPIO 4 (DHT/IO)', pwm: true, safe: true },
    { pin: 5, label: 'GPIO 5 (TRIG)', pwm: true, safe: true },
    { pin: 18, label: 'GPIO 18 (ECHO/IO)', pwm: true, safe: true },
    { pin: 19, label: 'GPIO 19 (Relay)', pwm: true, safe: true, isActuator: true },
    { pin: 21, label: 'GPIO 21 (SDA/IO)', pwm: true, safe: true },
    { pin: 22, label: 'GPIO 22 (SCL/Servo)', pwm: true, safe: true, isActuator: true },
    { pin: 23, label: 'GPIO 23 (IO)', pwm: true, safe: true },
    { pin: 25, label: 'GPIO 25 (DAC1/ADC)', pwm: true, safe: true },
    { pin: 26, label: 'GPIO 26 (DAC2/ADC)', pwm: true, safe: true },
    { pin: 27, label: 'GPIO 27 (ADC)', pwm: true, safe: true },
    { pin: 32, label: 'GPIO 32 (ADC)', pwm: true, safe: true },
    { pin: 33, label: 'GPIO 33 (ADC)', pwm: true, safe: true },
    { pin: 34, label: 'GPIO 34 (Input-Only)', inputOnly: true },
    { pin: 35, label: 'GPIO 35 (Input-Only)', inputOnly: true },
    { pin: 36, label: 'GPIO 36 / VP (Input-Only)', inputOnly: true },
    { pin: 39, label: 'GPIO 39 / VN (Input-Only)', inputOnly: true },
  ];

  const handleWritePin = async (pin: number, val: number, isActuator?: boolean) => {
    if (!activeDevice) return;

    if (!hardwareModeEnabled) {
      setCommandFeedback('Error: Hardware Mode is disabled. Enable Hardware Mode first.');
      return;
    }

    if (isActuator && val === 1) {
      setConfirmActuator({
        pin,
        value: val,
        title: `Drive GPIO ${pin} to HIGH (Actuator Activation)`,
      });
      return;
    }

    setIsSending(true);
    setCommandFeedback(`Sending GPIO ${pin} -> ${val === 1 ? 'HIGH' : 'LOW'}...`);
    const res = await sendGpioWrite(activeDevice.deviceId, pin, val, 'OUTPUT');
    setIsSending(false);

    if (res.success) {
      setCommandFeedback(`✔ ACK: GPIO ${pin} set to ${val === 1 ? 'HIGH' : 'LOW'}`);
    } else {
      setCommandFeedback(`✖ Error: ${res.error}`);
    }
  };

  const handleConfirmActuatorAction = async () => {
    if (!confirmActuator || !activeDevice) return;
    const { pin, value } = confirmActuator;
    setConfirmActuator(null);

    setIsSending(true);
    const res = await sendGpioWrite(activeDevice.deviceId, pin, value, 'OUTPUT', 'relay');
    setIsSending(false);

    if (res.success) {
      setCommandFeedback(`✔ ACK: Actuator on GPIO ${pin} energized.`);
    } else {
      setCommandFeedback(`✖ Error: ${res.error}`);
    }
  };

  const handleEmergencyStop = async () => {
    if (!activeDevice) return;
    setIsSending(true);
    setCommandFeedback('Emergency Stop Dispatched: Driving all outputs LOW...');
    const res = await emergencyStop(activeDevice.deviceId);
    setIsSending(false);
    if (res.success) {
      setCommandFeedback('✔ Emergency Stop Executed: All GPIO outputs driven to SAFE 0V.');
    } else {
      setCommandFeedback(`✖ E-Stop Error: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Emergency Stop */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Physical GPIO Pin Control Matrix</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Read and drive physical pins on target: <span className="font-semibold text-slate-200">{activeDevice?.name}</span> ({activeDevice?.boardType})
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Hardware Mode Toggle */}
          <button
            onClick={() => setHardwareModeEnabled(!hardwareModeEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hardwareModeEnabled
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {hardwareModeEnabled ? 'Hardware Mode: ENABLED' : 'Hardware Mode: DISABLED'}
          </button>

          {/* Emergency Stop Button */}
          <button
            onClick={handleEmergencyStop}
            disabled={!isOnline || !hardwareModeEnabled}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Emergency Stop (Safe All)</span>
          </button>
        </div>
      </div>

      {/* Hardware Mode Disabled Warning */}
      {!hardwareModeEnabled && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Hardware Mode is currently OFF.</strong> Commands are blocked to prevent unintended physical actuation. Click &quot;Hardware Mode: DISABLED&quot; above to enable live physical GPIO control.
          </span>
        </div>
      )}

      {/* Command Feedback Bar */}
      {commandFeedback && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between">
          <span>{commandFeedback}</span>
          <button onClick={() => setCommandFeedback(null)} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
      )}

      {/* GPIO Pin Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {pinList.map((p) => {
          const pinState = activeDevice?.pinStates[p.pin];
          const isHigh = pinState?.value === 1;

          return (
            <div
              key={p.pin}
              className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition-colors ${
                p.inputOnly
                  ? 'border-slate-800/60 bg-slate-900/50'
                  : isHigh
                  ? 'border-emerald-500/50 bg-slate-900/90 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{p.label}</span>
                  {p.inputOnly ? (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      INPUT-ONLY
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isHigh ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isHigh ? 'HIGH (3.3V)' : 'LOW (0V)'}
                    </span>
                  )}
                </div>

                {p.inputOnly ? (
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    Hardware restriction: Pins 34-39 have no internal output drivers.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {p.isActuator ? 'High-load actuator pin' : 'General Purpose Digital / PWM Pin'}
                  </p>
                )}
              </div>

              {/* Pin Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                {p.inputOnly ? (
                  <button
                    onClick={() => sendGpioRead(activeDevice?.deviceId || '', p.pin, 'ANALOG')}
                    disabled={!isOnline || !hardwareModeEnabled}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded text-xs font-mono transition-colors"
                  >
                    analogRead()
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleWritePin(p.pin, 1, p.isActuator)}
                      disabled={!isOnline || !hardwareModeEnabled || isHigh}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${
                        isHigh
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-emerald-600/80 text-slate-300 hover:text-white disabled:opacity-40'
                      }`}
                    >
                      HIGH
                    </button>
                    <button
                      onClick={() => handleWritePin(p.pin, 0)}
                      disabled={!isOnline || !hardwareModeEnabled || !isHigh}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${
                        !isHigh
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white disabled:opacity-40'
                      }`}
                    >
                      LOW
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actuator Safety Confirmation Modal */}
      {confirmActuator && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-sm text-white">Confirm Actuator Trigger</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to drive physical pin <strong>GPIO {confirmActuator.pin}</strong> to <strong>HIGH</strong>.
              If a relay or motor is wired to this pin, it will actuate physically. Ensure wires and loads are clear.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmActuator(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmActuatorAction}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs"
              >
                Confirm & Actuate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
