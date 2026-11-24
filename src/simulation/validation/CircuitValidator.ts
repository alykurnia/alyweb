import { CircuitNode, CircuitEdge } from '../../types/circuit';
import { CircuitValidationIssue } from '../types/simulation';
import { VoltageValidator } from './VoltageValidator';

export class CircuitValidator {
  /**
   * Run all circuit validation rules against the graph of nodes and edges.
   */
  public static validate(nodes: CircuitNode[], edges: CircuitEdge[]): CircuitValidationIssue[] {
    const issues: CircuitValidationIssue[] = [];

    if (nodes.length === 0) {
      return issues;
    }

    const nodeMap = new Map<string, CircuitNode>(nodes.map((n) => [n.id, n]));

    // Map which pins on each node have connected edges
    const connectedPinSet = new Set<string>(); // "nodeId:pinId"
    for (const edge of edges) {
      if (edge.source && edge.sourceHandle) {
        connectedPinSet.add(`${edge.source}:${edge.sourceHandle}`);
      }
      if (edge.target && edge.targetHandle) {
        connectedPinSet.add(`${edge.target}:${edge.targetHandle}`);
      }
    }

    // 1. Run Voltage & Short Circuit checks
    const voltageIssues = VoltageValidator.validate(nodes, edges);
    issues.push(...voltageIssues);

    // 2. Check for Microcontroller or Power Source
    const hasMcu = nodes.some(
      (n) => n.data.componentDefinition?.category === 'microcontroller'
    );
    const hasPower = nodes.some(
      (n) => n.data.componentDefinition?.category === 'power'
    );

    if (!hasMcu && !hasPower && nodes.length > 1) {
      issues.push({
        id: 'no-power-source',
        severity: 'WARNING',
        rule: 'RULE_NO_POWER_SOURCE',
        message: 'No Microcontroller or Power Supply detected. Circuit components will have no power source.',
      });
    }

    // 3. Component Power (VCC & GND) verification
    for (const node of nodes) {
      const def = node.data.componentDefinition;
      if (!def) continue;

      // Active devices that require VCC and GND to operate
      const isActiveDevice =
        def.category === 'sensor' ||
        def.category === 'display' ||
        ['relay', 'servo'].includes(def.typeId);

      if (isActiveDevice) {
        const vccPin = def.pins.find((p) => p.type === 'power_vcc');
        const gndPin = def.pins.find((p) => p.type === 'power_gnd');

        if (vccPin && !connectedPinSet.has(`${node.id}:${vccPin.id}`)) {
          issues.push({
            id: `missing-vcc-${node.id}`,
            severity: 'WARNING',
            componentId: node.id,
            componentName: node.data.label,
            pinId: vccPin.id,
            pinName: vccPin.name,
            rule: 'RULE_MISSING_VCC',
            message: `${node.data.label} power pin (${vccPin.name}) is not connected to a power rail.`,
          });
        }

        if (gndPin && !connectedPinSet.has(`${node.id}:${gndPin.id}`)) {
          issues.push({
            id: `missing-gnd-${node.id}`,
            severity: 'WARNING',
            componentId: node.id,
            componentName: node.data.label,
            pinId: gndPin.id,
            pinName: gndPin.name,
            rule: 'RULE_MISSING_GND',
            message: `${node.data.label} ground pin (${gndPin.name}) is not connected to Ground (GND).`,
          });
        }
      }

      // 4. LED Current Limiting Check
      if (def.typeId === 'led') {
        const anodePin = def.pins.find((p) => p.id === 'pin-anode' || p.name === 'Anode');
        if (anodePin && connectedPinSet.has(`${node.id}:${anodePin.id}`)) {
          // Check if connected directly to 5V rail or MCU without a resistor
          const incidentEdges = edges.filter(
            (e) =>
              (e.target === node.id && e.targetHandle === anodePin.id) ||
              (e.source === node.id && e.sourceHandle === anodePin.id)
          );

          for (const e of incidentEdges) {
            const otherNodeId = e.source === node.id ? e.target : e.source;
            const otherNode = nodeMap.get(otherNodeId);
            if (otherNode && otherNode.data.componentTypeId !== 'resistor') {
              issues.push({
                id: `led-no-resistor-${node.id}`,
                severity: 'WARNING',
                componentId: node.id,
                componentName: node.data.label,
                pinId: anodePin.id,
                pinName: anodePin.name,
                rule: 'RULE_LED_CURRENT_LIMIT',
                message: `LED "${node.data.label}" appears to be connected directly without a current-limiting resistor (recommended: 220Ω - 330Ω).`,
              });
              break;
            }
          }
        }
      }

      // 5. ESP32 Input-Only Pin Restriction Check (GPIO 34-39)
      if (def.typeId === 'esp32-devkit') {
        const inputOnlyPinIds = ['pin-gpio34', 'pin-gpio35', 'pin-gpio36', 'pin-gpio39'];
        for (const pinId of inputOnlyPinIds) {
          if (connectedPinSet.has(`${node.id}:${pinId}`)) {
            // Find what it connects to
            const incidentEdges = edges.filter(
              (e) =>
                (e.source === node.id && e.sourceHandle === pinId) ||
                (e.target === node.id && e.targetHandle === pinId)
            );

            for (const e of incidentEdges) {
              const otherNodeId = e.source === node.id ? e.target : e.source;
              const otherPinId = e.source === node.id ? e.targetHandle : e.sourceHandle;
              const otherNode = nodeMap.get(otherNodeId);
              if (otherNode) {
                const otherPin = otherNode.data.componentDefinition?.pins?.find(
                  (p) => p.id === otherPinId
                );
                // If connected to an actuator input (like LED anode, Relay IN, Servo SIGNAL)
                if (
                  otherNode.data.componentDefinition?.category === 'actuator' ||
                  otherPin?.direction === 'input'
                ) {
                  issues.push({
                    id: `esp32-input-only-${node.id}-${pinId}`,
                    severity: 'ERROR',
                    componentId: node.id,
                    componentName: node.data.label,
                    pinId,
                    rule: 'RULE_ESP32_INPUT_ONLY',
                    message: `ESP32 ${pinId.replace('pin-', '').toUpperCase()} is an INPUT-ONLY pin and cannot drive an actuator or output signal on "${otherNode.data.label}".`,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Sort issues by severity: FATAL > ERROR > WARNING
    const severityWeight: Record<string, number> = { FATAL: 3, ERROR: 2, WARNING: 1 };
    return issues.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);
  }
}
