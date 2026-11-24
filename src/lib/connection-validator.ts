import { ComponentPin, PinType } from '@/types/circuit';

export interface ValidationResult {
  isValid: boolean;
  warning?: string;
  error?: string;
  wireColor: string;
  signalType: PinType;
}

export const WIRE_COLORS = {
  power_vcc: '#EF4444', // Red: VCC / Power
  power_gnd: '#1E293B', // Black: Ground
  gpio_digital: '#F59E0B', // Yellow/Amber: Digital signal
  gpio_pwm: '#F59E0B', // Yellow: PWM
  gpio_analog: '#3B82F6', // Blue: Analog signal
  comm_i2c: '#10B981', // Green: Communication
  comm_spi: '#10B981', // Green: Communication
  comm_uart: '#10B981', // Green: Communication
  comm_onewire: '#10B981', // Green: Communication
  passive: '#8B5CF6', // Purple/Violet: Passive
};

export function getWireColorForPinType(type: PinType): string {
  return WIRE_COLORS[type] || '#64748B';
}

export function validateConnection(
  sourceNodeId: string,
  targetNodeId: string,
  sourcePin: ComponentPin | undefined,
  targetPin: ComponentPin | undefined,
  existingEdges: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }[]
): ValidationResult {
  // 1. Prevent connecting component to itself
  if (sourceNodeId === targetNodeId) {
    return {
      isValid: false,
      error: 'Cannot connect a component pin to the same component.',
      wireColor: '#EF4444',
      signalType: 'gpio_digital',
    };
  }

  // 2. Pins must exist
  if (!sourcePin || !targetPin) {
    return {
      isValid: false,
      error: 'Invalid pin connection: source or target pin not found.',
      wireColor: '#64748B',
      signalType: 'gpio_digital',
    };
  }

  // 3. Prevent duplicate connections between the exact same pins
  const isDuplicate = existingEdges.some(
    (e) =>
      (e.source === sourceNodeId &&
        e.target === targetNodeId &&
        e.sourceHandle === sourcePin.id &&
        e.targetHandle === targetPin.id) ||
      (e.source === targetNodeId &&
        e.target === sourceNodeId &&
        e.sourceHandle === targetPin.id &&
        e.targetHandle === sourcePin.id)
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: `Duplicate wire: ${sourcePin.name} is already connected to ${targetPin.name}.`,
      wireColor: '#64748B',
      signalType: sourcePin.type,
    };
  }

  // Determine wire color: prioritized by power/gnd, then specific types
  let resolvedSignalType: PinType = sourcePin.type;
  if (sourcePin.type === 'power_vcc' || targetPin.type === 'power_vcc') {
    resolvedSignalType = 'power_vcc';
  } else if (sourcePin.type === 'power_gnd' || targetPin.type === 'power_gnd') {
    resolvedSignalType = 'power_gnd';
  } else if (sourcePin.type === 'gpio_analog' || targetPin.type === 'gpio_analog') {
    resolvedSignalType = 'gpio_analog';
  } else if (
    sourcePin.type.startsWith('comm_') ||
    targetPin.type.startsWith('comm_')
  ) {
    resolvedSignalType = sourcePin.type.startsWith('comm_') ? sourcePin.type : targetPin.type;
  }

  const wireColor = getWireColorForPinType(resolvedSignalType);

  // 4. Direction validation: warning if connecting output to output
  let warning: string | undefined = undefined;

  if (sourcePin.direction === 'output' && targetPin.direction === 'output') {
    warning = `Pin Contention Warning: Both ${sourcePin.name} and ${targetPin.name} are configured as OUTPUT pins. This may cause short-circuits.`;
  }

  // 5. Voltage level check: e.g. 5V output into 3.3V input
  if (
    sourcePin.voltage === '5V' &&
    targetPin.voltage === '3.3V' &&
    targetPin.type !== 'passive'
  ) {
    warning = `Voltage Level Warning: Connecting 5V (${sourcePin.name}) into 3.3V (${targetPin.name}) without a logic level shifter or divider may damage 3.3V ICs.`;
  } else if (
    targetPin.voltage === '5V' &&
    sourcePin.voltage === '3.3V' &&
    sourcePin.type !== 'passive' &&
    sourcePin.direction === 'output'
  ) {
    warning = `Logic Threshold Notice: 3.3V output (${sourcePin.name}) driving 5V input (${targetPin.name}) may be near the TTL high-threshold (VIH = 3.0V).`;
  }

  // 6. Ground to VCC warning
  if (
    (sourcePin.type === 'power_gnd' && targetPin.type === 'power_vcc') ||
    (sourcePin.type === 'power_vcc' && targetPin.type === 'power_gnd')
  ) {
    return {
      isValid: false,
      error: `Dead Short Circuit: Direct connection between VCC (${sourcePin.name}) and GND (${targetPin.name}) detected!`,
      wireColor: '#EF4444',
      signalType: 'power_vcc',
    };
  }

  return {
    isValid: true,
    warning,
    wireColor,
    signalType: resolvedSignalType,
  };
}
