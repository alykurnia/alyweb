import { SimulationEngine } from '../engine/SimulationEngine';
import { ProjectFile } from '@/lib/compiler/types';

export type RuntimeState = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

export interface RuntimeCallbacks {
  onStateChange?: (state: RuntimeState) => void;
  onSerialMessage?: (text: string, type?: 'rx' | 'tx' | 'info' | 'error') => void;
  onRuntimeLog?: (msg: string) => void;
  onError?: (err: string) => void;
}

export class ArduinoRuntimeEngine {
  private engine: SimulationEngine;
  private state: RuntimeState = 'idle';
  private shouldStop: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private baudRate: number = 115200;
  private callbacks: RuntimeCallbacks = {};
  private executionDelayPromiseResolve: (() => void) | null = null;
  private mcuId?: string;

  constructor(engine: SimulationEngine, callbacks: RuntimeCallbacks = {}) {
    this.engine = engine;
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: RuntimeCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getState(): RuntimeState {
    return this.state;
  }

  public getBaudRate(): number {
    return this.baudRate;
  }

  private setState(newState: RuntimeState): void {
    this.state = newState;
    this.callbacks.onStateChange?.(newState);
  }

  private log(msg: string): void {
    this.callbacks.onRuntimeLog?.(msg);
  }

  private serial(text: string, type: 'rx' | 'tx' | 'info' | 'error' = 'rx'): void {
    this.callbacks.onSerialMessage?.(text, type);
  }

  /**
   * Pre-processes C++ code by stripping comments and replacing #define macros.
   */
  private preprocess(code: string): { cleanCode: string; defines: Map<string, string> } {
    // 1. Remove line comments and block comments
    const noComments = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');

    // 2. Extract #define macros
    const defines = new Map<string, string>();
    const defineRegex = /#define\s+([A-Za-z0-9_]+)\s+([^\r\n]+)/g;
    let match;
    while ((match = defineRegex.exec(noComments)) !== null) {
      defines.set(match[1].trim(), match[2].trim());
    }

    // Remove define lines
    let cleanCode = noComments.replace(/#define[^\r\n]+/g, '');

    // Replace defines in the rest of code
    defines.forEach((val, key) => {
      const reg = new RegExp(`\\b${key}\\b`, 'g');
      cleanCode = cleanCode.replace(reg, val);
    });

    return { cleanCode, defines };
  }

  /**
   * Start executing an Arduino sketch.
   */
  public async run(files: ProjectFile[], targetMcuId?: string): Promise<boolean> {
    if (this.state === 'running') {
      this.stop();
    }

    this.mcuId = targetMcuId || this.engine.getFirstMcuId();
    this.shouldStop = false;
    this.isPaused = false;
    this.startTime = Date.now();
    this.setState('running');

    this.log(`Starting Arduino runtime on MCU: ${this.mcuId || 'default'}`);

    // Combine .ino and .cpp files
    const fullCode = files
      .filter((f) => f.type === 'ino' || f.type === 'cpp' || f.isMain)
      .map((f) => f.content)
      .join('\n');

    try {
      const { cleanCode } = this.preprocess(fullCode);

      // Extract setup() and loop() function bodies
      const setupBody = this.extractFunctionBody(cleanCode, 'setup');
      const loopBody = this.extractFunctionBody(cleanCode, 'loop');

      if (!setupBody && !loopBody) {
        throw new Error('Sketch does not contain setup() or loop() functions.');
      }

      // Initialize runtime environment with built-in constants and APIs
      const env = this.createRuntimeEnvironment();

      // Execute global statements (variable declarations outside setup/loop)
      this.executeGlobalStatements(cleanCode, env);

      // 1. Execute setup() once
      if (setupBody) {
        this.log('Executing setup()...');
        await this.executeBlock(setupBody, env);
      }

      // 2. Execute loop() continuously until stopped
      this.log('Entering loop() cycle...');
      while (!this.shouldStop) {
        if (this.isPaused) {
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }

        if (loopBody) {
          await this.executeBlock(loopBody, env);
        }

        // Cooperative yield per loop to prevent locking the browser event loop
        await new Promise((r) => setTimeout(r, 5));
      }

      this.setState('stopped');
      this.log('Arduino runtime stopped.');
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.setState('error');
      this.log(`Runtime Error: ${errorMsg}`);
      this.callbacks.onError?.(errorMsg);
      this.serial(`\n[Runtime Exception: ${errorMsg}]\n`, 'error');
      return false;
    }
  }

  /**
   * Stop running sketch immediately.
   */
  public stop(): void {
    this.shouldStop = true;
    this.isPaused = false;
    if (this.executionDelayPromiseResolve) {
      this.executionDelayPromiseResolve();
      this.executionDelayPromiseResolve = null;
    }
    this.setState('stopped');
    this.log('Execution stop signal received.');
  }

  public pause(): void {
    if (this.state === 'running') {
      this.isPaused = true;
      this.setState('paused');
      this.log('Execution paused.');
    }
  }

  public resume(): void {
    if (this.state === 'paused') {
      this.isPaused = false;
      this.setState('running');
      this.log('Execution resumed.');
    }
  }

  /**
   * Extract body between braces of a named function, e.g. void setup() { ... }
   */
  private extractFunctionBody(code: string, funcName: string): string | null {
    const reg = new RegExp(`(?:void\\s+)?${funcName}\\s*\\([^)]*\\)\\s*\\{`, 'g');
    const match = reg.exec(code);
    if (!match) return null;

    let braceCount = 1;
    let idx = reg.lastIndex;
    const startIdx = idx;

    while (idx < code.length && braceCount > 0) {
      const ch = code[idx];
      if (ch === '{') braceCount++;
      else if (ch === '}') braceCount--;
      idx++;
    }

    if (braceCount === 0) {
      return code.substring(startIdx, idx - 1);
    }
    return null;
  }

  /**
   * Create sandboxed execution environment object with Arduino APIs.
   */
  private createRuntimeEnvironment(): Record<string, unknown> {
    const env: Record<string, unknown> = {
      // Standard Arduino Constants
      HIGH: 'HIGH',
      LOW: 'LOW',
      OUTPUT: 'OUTPUT',
      INPUT: 'INPUT',
      INPUT_PULLUP: 'INPUT_PULLUP',
      LED_BUILTIN: 2,
      true: true,
      false: false,

      // Timing
      millis: () => Date.now() - this.startTime,
      micros: () => (Date.now() - this.startTime) * 1000,
      delay: async (ms: number) => {
        if (this.shouldStop) return;
        const validMs = Math.max(0, Number(ms) || 0);
        await new Promise<void>((resolve) => {
          this.executionDelayPromiseResolve = resolve;
          setTimeout(() => {
            this.executionDelayPromiseResolve = null;
            resolve();
          }, validMs);
        });
      },
      delayMicroseconds: async (us: number) => {
        const ms = Math.max(1, Math.round(Number(us) / 1000));
        await (env as any).delay(ms);
      },

      // GPIO APIs mapped to SimulationEngine
      pinMode: (pin: number | string, mode: string) => {
        const pinStr = String(pin);
        const validMode = mode === 'OUTPUT' ? 'OUTPUT' : mode === 'INPUT_PULLUP' ? 'INPUT_PULLUP' : 'INPUT';
        this.engine.arduinoPinMode(pinStr, validMode, this.mcuId);
        this.log(`pinMode(${pinStr}, ${validMode})`);
      },

      digitalWrite: (pin: number | string, val: string | number) => {
        const pinStr = String(pin);
        const state = val === 'HIGH' || val === 1 || val === (true as unknown) ? 'HIGH' : 'LOW';
        this.engine.arduinoDigitalWrite(pinStr, state, this.mcuId);
      },

      digitalRead: (pin: number | string): number => {
        const pinStr = String(pin);
        const state = this.engine.arduinoDigitalRead(pinStr, this.mcuId);
        return state === 'HIGH' ? 1 : 0;
      },

      analogWrite: (pin: number | string, val: number) => {
        const pinStr = String(pin);
        const duty = Math.max(0, Math.min(255, Math.round(Number(val))));
        this.engine.arduinoAnalogWrite(pinStr, duty, this.mcuId);
      },

      analogRead: (pin: number | string): number => {
        const pinStr = String(pin);
        return this.engine.arduinoAnalogRead(pinStr, this.mcuId);
      },

      // Math Helpers
      map: (x: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
        return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
      },
      constrain: (amt: number, low: number, high: number) => Math.min(high, Math.max(low, amt)),
      min: (a: number, b: number) => Math.min(a, b),
      max: (a: number, b: number) => Math.max(a, b),
      abs: (x: number) => Math.abs(x),
      sq: (x: number) => x * x,
      sqrt: (x: number) => Math.sqrt(x),

      // Serial UART Terminal
      Serial: {
        begin: (baud: number) => {
          this.baudRate = Number(baud) || 115200;
          this.log(`Serial.begin(${this.baudRate})`);
          this.serial(`[Serial initialized at ${this.baudRate} baud]\n`, 'info');
        },
        print: (val: unknown) => {
          const str = String(val !== undefined ? val : '');
          this.serial(str, 'rx');
        },
        println: (val?: unknown) => {
          const str = (val !== undefined ? String(val) : '') + '\n';
          this.serial(str, 'rx');
        },
      },
    };

    return env;
  }

  /**
   * Evaluates top-level variable declarations outside setup/loop.
   */
  private executeGlobalStatements(code: string, env: Record<string, unknown>): void {
    // Remove setup and loop function blocks first
    let globals = code
      .replace(/(?:void\s+)?setup\s*\([^)]*\)\s*\{[\s\S]*?\}/g, '')
      .replace(/(?:void\s+)?loop\s*\([^)]*\)\s*\{[\s\S]*?\}/g, '');

    // Match variable declarations: e.g. int ledPin = 2; const float vref = 3.3;
    const varDeclRegex = /(?:const\s+)?(?:int|float|double|bool|boolean|char|String|long|unsigned\s+long|uint8_t|uint16_t|uint32_t)\s+([A-Za-z0-9_]+)\s*(?:=\s*([^;]+))?;/g;
    let match;
    while ((match = varDeclRegex.exec(globals)) !== null) {
      const varName = match[1].trim();
      const expr = match[2] ? match[2].trim() : '0';
      try {
        env[varName] = this.evaluateExpression(expr, env);
      } catch {
        env[varName] = 0;
      }
    }
  }

  /**
   * Execute statements inside a code block safely.
   */
  private async executeBlock(code: string, env: Record<string, unknown>): Promise<void> {
    if (this.shouldStop) return;

    // Split block into statements respecting nested control structures
    const statements = this.parseStatements(code);

    for (const stmt of statements) {
      if (this.shouldStop) break;

      const trimmed = stmt.trim();
      if (!trimmed) continue;

      // 1. delay() call
      const delayMatch = trimmed.match(/^delay\s*\(\s*([^)]+)\s*\);?$/);
      if (delayMatch) {
        const ms = Number(this.evaluateExpression(delayMatch[1], env)) || 0;
        await (env.delay as (ms: number) => Promise<void>)(ms);
        continue;
      }

      // 2. pinMode()
      const pinModeMatch = trimmed.match(/^pinMode\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\);?$/);
      if (pinModeMatch) {
        const pin = this.evaluateExpression(pinModeMatch[1], env);
        const mode = String(this.evaluateExpression(pinModeMatch[2], env));
        (env.pinMode as (p: unknown, m: string) => void)(pin, mode);
        continue;
      }

      // 3. digitalWrite()
      const dwMatch = trimmed.match(/^digitalWrite\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\);?$/);
      if (dwMatch) {
        const pin = this.evaluateExpression(dwMatch[1], env);
        const val = this.evaluateExpression(dwMatch[2], env);
        (env.digitalWrite as (p: unknown, v: unknown) => void)(pin, val);
        continue;
      }

      // 4. analogWrite()
      const awMatch = trimmed.match(/^analogWrite\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\);?$/);
      if (awMatch) {
        const pin = this.evaluateExpression(awMatch[1], env);
        const duty = Number(this.evaluateExpression(awMatch[2], env));
        (env.analogWrite as (p: unknown, d: number) => void)(pin, duty);
        continue;
      }

      // 5. Serial.println() / Serial.print() / Serial.begin()
      const serialBeginMatch = trimmed.match(/^Serial\.begin\s*\(\s*([^)]+)\s*\);?$/);
      if (serialBeginMatch) {
        const baud = Number(this.evaluateExpression(serialBeginMatch[1], env));
        (env.Serial as { begin: (b: number) => void }).begin(baud);
        continue;
      }

      const serialPrintlnMatch = trimmed.match(/^Serial\.println\s*\(\s*(.*)\s*\);?$/);
      if (serialPrintlnMatch) {
        const arg = serialPrintlnMatch[1].trim();
        const val = arg.length > 0 ? this.evaluateExpression(arg, env) : '';
        (env.Serial as { println: (v: unknown) => void }).println(val);
        continue;
      }

      const serialPrintMatch = trimmed.match(/^Serial\.print\s*\(\s*([^)]+)\s*\);?$/);
      if (serialPrintMatch) {
        const val = this.evaluateExpression(serialPrintMatch[1], env);
        (env.Serial as { print: (v: unknown) => void }).print(val);
        continue;
      }

      // 6. Variable assignment or declaration
      const varAssignMatch = trimmed.match(/^(?:(?:const\s+)?(?:int|float|double|bool|boolean|char|String|long|unsigned\s+long|uint8_t|uint16_t|uint32_t)\s+)?([A-Za-z0-9_]+)\s*=\s*(.+);?$/);
      if (varAssignMatch) {
        const varName = varAssignMatch[1];
        const expr = varAssignMatch[2].replace(/;$/, '');
        env[varName] = this.evaluateExpression(expr, env);
        continue;
      }

      // 7. Increment / Decrement: e.g. i++; or counter--;
      const incMatch = trimmed.match(/^([A-Za-z0-9_]+)(\+\+|--);?$/);
      if (incMatch) {
        const varName = incMatch[1];
        const cur = Number(env[varName]) || 0;
        env[varName] = incMatch[2] === '++' ? cur + 1 : cur - 1;
        continue;
      }

      // 8. If condition: if (cond) { ... } else { ... }
      if (trimmed.startsWith('if')) {
        await this.executeIfStatement(trimmed, env);
        continue;
      }

      // 9. For loop: for (int i = 0; i < 10; i++) { ... }
      if (trimmed.startsWith('for')) {
        await this.executeForLoop(trimmed, env);
        continue;
      }

      // 10. While loop: while (cond) { ... }
      if (trimmed.startsWith('while')) {
        await this.executeWhileLoop(trimmed, env);
        continue;
      }

      // Fallback: evaluate expression directly if function call
      try {
        this.evaluateExpression(trimmed.replace(/;$/, ''), env);
      } catch {
        // Ignore unhandled syntax token gracefully
      }
    }
  }

  /**
   * Split statements taking into account block delimiters {} so if/for blocks stay intact.
   */
  private parseStatements(code: string): string[] {
    const stmts: string[] = [];
    let cur = '';
    let braceLevel = 0;
    let parenLevel = 0;

    for (let i = 0; i < code.length; i++) {
      const ch = code[i];

      if (ch === '{') braceLevel++;
      else if (ch === '}') braceLevel--;
      else if (ch === '(') parenLevel++;
      else if (ch === ')') parenLevel--;

      cur += ch;

      // End of statement when semicolon or closing brace at top level
      if (braceLevel === 0 && parenLevel === 0) {
        if (ch === ';') {
          stmts.push(cur);
          cur = '';
        } else if (ch === '}' && (cur.trim().startsWith('if') || cur.trim().startsWith('for') || cur.trim().startsWith('while'))) {
          // Check if followed by "else"
          const rest = code.substring(i + 1).trimStart();
          if (!rest.startsWith('else')) {
            stmts.push(cur);
            cur = '';
          }
        }
      }
    }

    if (cur.trim()) {
      stmts.push(cur);
    }

    return stmts;
  }

  private async executeIfStatement(stmt: string, env: Record<string, unknown>): Promise<void> {
    const condMatch = stmt.match(/^if\s*\(([^)]+)\)\s*\{/);
    if (!condMatch) return;

    const conditionExpr = condMatch[1];
    const isTrue = Boolean(this.evaluateExpression(conditionExpr, env));

    // Extract ifBody
    const ifStart = stmt.indexOf('{') + 1;
    let braceCount = 1;
    let idx = ifStart;
    while (idx < stmt.length && braceCount > 0) {
      if (stmt[idx] === '{') braceCount++;
      else if (stmt[idx] === '}') braceCount--;
      idx++;
    }

    const ifBody = stmt.substring(ifStart, idx - 1);
    const rest = stmt.substring(idx).trim();

    if (isTrue) {
      await this.executeBlock(ifBody, env);
    } else if (rest.startsWith('else')) {
      const elseStart = rest.indexOf('{') + 1;
      let elseBrace = 1;
      let elseIdx = elseStart;
      while (elseIdx < rest.length && elseBrace > 0) {
        if (rest[elseIdx] === '{') elseBrace++;
        else if (rest[elseIdx] === '}') elseBrace--;
        elseIdx++;
      }
      const elseBody = rest.substring(elseStart, elseIdx - 1);
      await this.executeBlock(elseBody, env);
    }
  }

  private async executeForLoop(stmt: string, env: Record<string, unknown>): Promise<void> {
    const headMatch = stmt.match(/^for\s*\(([^;]*);([^;]*);([^)]*)\)\s*\{/);
    if (!headMatch) return;

    const initStmt = headMatch[1].trim();
    const condExpr = headMatch[2].trim();
    const stepStmt = headMatch[3].trim();

    // Extract body
    const bodyStart = stmt.indexOf('{') + 1;
    let braceCount = 1;
    let idx = bodyStart;
    while (idx < stmt.length && braceCount > 0) {
      if (stmt[idx] === '{') braceCount++;
      else if (stmt[idx] === '}') braceCount--;
      idx++;
    }
    const body = stmt.substring(bodyStart, idx - 1);

    // Run init
    if (initStmt) {
      await this.executeBlock(initStmt + ';', env);
    }

    let iterations = 0;
    while (!this.shouldStop && (condExpr ? Boolean(this.evaluateExpression(condExpr, env)) : true)) {
      await this.executeBlock(body, env);
      if (stepStmt) {
        await this.executeBlock(stepStmt + ';', env);
      }
      iterations++;
      // Yield to avoid freeze
      if (iterations % 50 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
      if (iterations > 10000) {
        throw new Error('For-loop iteration limit (10000) exceeded.');
      }
    }
  }

  private async executeWhileLoop(stmt: string, env: Record<string, unknown>): Promise<void> {
    const headMatch = stmt.match(/^while\s*\(([^)]+)\)\s*\{/);
    if (!headMatch) return;

    const condExpr = headMatch[1].trim();
    const bodyStart = stmt.indexOf('{') + 1;
    let braceCount = 1;
    let idx = bodyStart;
    while (idx < stmt.length && braceCount > 0) {
      if (stmt[idx] === '{') braceCount++;
      else if (stmt[idx] === '}') braceCount--;
      idx++;
    }
    const body = stmt.substring(bodyStart, idx - 1);

    let iterations = 0;
    while (!this.shouldStop && Boolean(this.evaluateExpression(condExpr, env))) {
      await this.executeBlock(body, env);
      iterations++;
      if (iterations % 50 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
      if (iterations > 10000) {
        throw new Error('While-loop iteration limit (10000) exceeded.');
      }
    }
  }

  /**
   * Safely evaluate arithmetic, relational, and function call expressions in sandbox context.
   */
  public evaluateExpression(expr: string, env: Record<string, unknown>): unknown {
    const trimmed = expr.trim();
    if (!trimmed) return 0;

    // Direct literals
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    if (/^"(.*)"$/.test(trimmed)) {
      return trimmed.slice(1, -1);
    }
    if (/^'(.*)'$/.test(trimmed)) {
      return trimmed.slice(1, -1);
    }
    if (trimmed === 'HIGH') return 'HIGH';
    if (trimmed === 'LOW') return 'LOW';
    if (trimmed === 'OUTPUT') return 'OUTPUT';
    if (trimmed === 'INPUT') return 'INPUT';
    if (trimmed === 'INPUT_PULLUP') return 'INPUT_PULLUP';
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Check direct variable lookup
    if (Object.prototype.hasOwnProperty.call(env, trimmed)) {
      return env[trimmed];
    }

    // Function calls: digitalRead(pin) or analogRead(pin)
    const drMatch = trimmed.match(/^digitalRead\s*\(\s*([^)]+)\s*\)$/);
    if (drMatch) {
      const pin = this.evaluateExpression(drMatch[1], env);
      return (env.digitalRead as (p: unknown) => number)(pin);
    }

    const arMatch = trimmed.match(/^analogRead\s*\(\s*([^)]+)\s*\)$/);
    if (arMatch) {
      const pin = this.evaluateExpression(arMatch[1], env);
      return (env.analogRead as (p: unknown) => number)(pin);
    }

    const millisMatch = trimmed.match(/^millis\s*\(\s*\)$/);
    if (millisMatch) {
      return (env.millis as () => number)();
    }

    // Evaluate mathematical/relational expression with safe variable substitution
    try {
      // Build an evaluation scope
      const scopeKeys = Object.keys(env).filter((k) => /^[A-Za-z0-9_]+$/.test(k));
      const scopeVals = scopeKeys.map((k) => env[k]);

      // Protect against malicious code injection
      if (/(require|import|eval|Function|window|document|process|global)/.test(trimmed)) {
        return 0;
      }

      // Convert relational operators if any
      const safeExpr = trimmed.replace(/\bHIGH\b/g, '1').replace(/\bLOW\b/g, '0');
      const evaluator = new Function(...scopeKeys, `return (${safeExpr});`);
      return evaluator(...scopeVals);
    } catch {
      return 0;
    }
  }
}
