import { DeviceRegistry } from './device-manager/DeviceRegistry';
import { BridgeServer } from './websocket/BridgeServer';
import { SerialBridgeAdapter } from './serial/SerialBridgeAdapter';

/**
 * IoT Lab Local Bridge Agent Entry Point
 */
async function main() {
  const args = process.argv.slice(2);
  let port = 8765;
  let host = '0.0.0.0'; // Bind to 0.0.0.0 so ESP32 on local Wi-Fi can connect

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--host' && args[i + 1]) {
      host = args[i + 1];
      i++;
    }
  }

  console.log('================================================================');
  console.log('            IoT Lab — Local Hardware Bridge Agent              ');
  console.log('================================================================');
  console.log(` Protocol Version : 1.0 (Strict Schema Validation)`);
  console.log(` WebSocket Port   : ${port}`);
  console.log(` Listening Host   : ${host}`);
  console.log(` Client Route     : ws://127.0.0.1:${port}/ws/client (Next.js App)`);
  console.log(` Device Route     : ws://<LOCAL_IP>:${port}/ws/device (ESP32)`);
  console.log('================================================================');

  const registry = new DeviceRegistry();
  const serialAdapter = new SerialBridgeAdapter();

  // Register default development lab device and token for immediate pairing
  registry.registerDevice('esp32-lab-001', 'iotlab-secret-token-2026', 'ESP32 DevKit Lab 1', 'esp32-devkit');
  console.log('[Registry] Pre-registered default device: "esp32-lab-001" (Token: iotlab-secret-token-2026)');

  const server = new BridgeServer(registry, { port, host });
  await server.start();
  console.log(`[BridgeServer] Online and waiting for connections...`);

  // Serial adapter status check
  if (serialAdapter.isAvailable()) {
    console.log('[SerialAdapter] USB SerialPort support: AVAILABLE');
    const ports = await serialAdapter.listPorts();
    console.log(`[SerialAdapter] Detected COM ports: ${ports.length > 0 ? ports.map((p) => p.path).join(', ') : 'None'}`);
  } else {
    console.log('[SerialAdapter] USB SerialPort support: UNAVAILABLE (using WebSocket primary transport)');
  }

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('\n[BridgeServer] Gracefully shutting down...');
    await server.stop();
    await serialAdapter.disconnect();
    console.log('[BridgeServer] Stopped cleanly. Goodbye.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[BridgeServer] Fatal startup error:', err);
    process.exit(1);
  });
}

export { DeviceRegistry, BridgeServer, SerialBridgeAdapter };
