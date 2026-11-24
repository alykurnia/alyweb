import { CircuitNode, CircuitEdge } from '../../types/circuit';
import { CircuitValidationIssue } from '../types/simulation';

export class VoltageValidator {
  /**
   * Validate voltage levels across all connected edges in the circuit.
   */
  public static validate(nodes: CircuitNode[], edges: CircuitEdge[]): CircuitValidationIssue[] {
    const issues: CircuitValidationIssue[] = [];
    const nodeMap = new Map<string, CircuitNode>(nodes.map((n) => [n.id, n]));

    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) continue;

      const sourcePin = sourceNode.data.componentDefinition?.pins?.find(
        (p) => p.id === edge.sourceHandle
      );
      const targetPin = targetNode.data.componentDefinition?.pins?.find(
        (p) => p.id === edge.targetHandle
      );

      if (!sourcePin || !targetPin) continue;

      // 1. Direct Short Circuit Check: VCC to GND
      const isSourcePower = sourcePin.type === 'power_vcc';
      const isTargetPower = targetPin.type === 'power_vcc';
      const isSourceGnd = sourcePin.type === 'power_gnd';
      const isTargetGnd = targetPin.type === 'power_gnd';

      if ((isSourcePower && isTargetGnd) || (isSourceGnd && isTargetPower)) {
        issues.push({
          id: `short-circuit-${edge.id}`,
          severity: 'FATAL',
          componentId: sourceNode.id,
          componentName: sourceNode.data.label,
          pinId: sourcePin.id,
          pinName: sourcePin.name,
          rule: 'RULE_SHORT_CIRCUIT',
          message: `CRITICAL: Direct short circuit between ${sourcePin.name} (${sourceNode.data.label}) and ${targetPin.name} (${targetNode.data.label})! Power rail shorted to Ground.`,
        });
      }

      // 2. Voltage Overdrive: 5V logic or power directly feeding 3.3V-only logic pin
      const is5V = sourcePin.voltage === '5V' || edge.data?.sourceVoltage === '5V';
      const isTarget3V3Only =
        targetPin.voltage === '3.3V' &&
        targetPin.type !== 'power_vcc' && // Many sensors have 3.3V/5V compatible VCC, but logic pins might not
        targetNode.data.componentTypeId.startsWith('esp32');

      if (is5V && isTarget3V3Only) {
        issues.push({
          id: `voltage-mismatch-${edge.id}`,
          severity: 'ERROR',
          componentId: targetNode.id,
          componentName: targetNode.data.label,
          pinId: targetPin.id,
          pinName: targetPin.name,
          rule: 'RULE_VOLTAGE_OVERDRIVE',
          message: `Voltage Warning: 5V level applied to 3.3V pin ${targetPin.name} on ${targetNode.data.label}. ESP32 GPIOs are not 5V tolerant.`,
        });
      }
    }

    return issues;
  }
}
