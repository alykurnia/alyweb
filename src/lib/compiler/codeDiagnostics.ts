import { DiagnosticItem, ProjectFile, SUPPORTED_BOARDS } from './types';

/**
 * Pre-compile static code analysis and linting for Arduino C++.
 * Detects structural issues, unclosed delimiters, missing Arduino functions,
 * and board-specific hardware violations (e.g. ESP32 input-only GPIOs).
 */
export function analyzeArduinoCode(
  files: ProjectFile[],
  boardId: string = 'esp32-devkit'
): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];
  const board = SUPPORTED_BOARDS[boardId] || SUPPORTED_BOARDS['esp32-devkit'];

  const mainFile = files.find((f) => f.type === 'ino' || f.isMain) || files[0];
  if (!mainFile) {
    diagnostics.push({
      file: 'project',
      line: 1,
      column: 1,
      severity: 'error',
      message: 'No main Arduino sketch file (.ino) found in project.',
    });
    return diagnostics;
  }

  // Iterate through all files for syntax and structural checks
  for (const file of files) {
    if (file.type !== 'ino' && file.type !== 'cpp' && file.type !== 'h') continue;
    const lines = file.content.split('\n');

    // 1. Bracket and parenthesis balancing
    const braceStack: { char: string; line: number; col: number }[] = [];
    let inBlockComment = false;

    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      let inString = false;
      let stringChar = '';

      for (let c = 0; c < lineText.length; c++) {
        const ch = lineText[c];
        const next = lineText[c + 1];

        // Handle comments
        if (!inString && !inBlockComment && ch === '/' && next === '/') {
          break; // Line comment ends processing for this line
        }
        if (!inString && !inBlockComment && ch === '/' && next === '*') {
          inBlockComment = true;
          c++;
          continue;
        }
        if (inBlockComment && ch === '*' && next === '/') {
          inBlockComment = false;
          c++;
          continue;
        }
        if (inBlockComment) continue;

        // Handle string literals
        if ((ch === '"' || ch === "'") && (c === 0 || lineText[c - 1] !== '\\')) {
          if (!inString) {
            inString = true;
            stringChar = ch;
          } else if (ch === stringChar) {
            inString = false;
          }
          continue;
        }
        if (inString) continue;

        // Bracket matching
        if (ch === '{' || ch === '(' || ch === '[') {
          braceStack.push({ char: ch, line: lineNum, col: c + 1 });
        } else if (ch === '}' || ch === ')' || ch === ']') {
          const expected = ch === '}' ? '{' : ch === ')' ? '(' : '[';
          const last = braceStack.pop();
          if (!last || last.char !== expected) {
            diagnostics.push({
              file: file.name,
              line: lineNum,
              column: c + 1,
              severity: 'error',
              message: `Mismatched closing delimiter '${ch}'. Expected matching '${last ? last.char : expected}'.`,
              source: 'syntax',
            });
          }
        }
      }
    });

    // Unclosed delimiters
    while (braceStack.length > 0) {
      const unclosed = braceStack.pop()!;
      diagnostics.push({
        file: file.name,
        line: unclosed.line,
        column: unclosed.col,
        severity: 'error',
        message: `Unclosed delimiter '${unclosed.char}'.`,
        source: 'syntax',
      });
    }

    // 2. Hardware and Board-Specific Validation
    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const stripped = lineText.trim();
      if (stripped.startsWith('//') || stripped.startsWith('/*')) return;

      // Check pinMode hardware restrictions
      const pinModeMatch = lineText.match(/pinMode\s*\(\s*(\d+|[A-Za-z0-9_]+)\s*,\s*(OUTPUT|INPUT|INPUT_PULLUP)\s*\)/);
      if (pinModeMatch) {
        const pinArg = pinModeMatch[1].trim();
        const modeArg = pinModeMatch[2].trim();

        if (modeArg === 'OUTPUT') {
          if (board.id === 'esp32-devkit' && board.inputOnlyPins.includes(pinArg)) {
            diagnostics.push({
              file: file.name,
              line: lineNum,
              column: lineText.indexOf(pinModeMatch[0]) + 1,
              severity: 'error',
              message: `Hardware Restriction: GPIO ${pinArg} on ESP32 DevKit is INPUT-ONLY (pins 34-39 have no output drivers).`,
              source: 'hardware-drc',
            });
          }
        }

        // Pin range check
        const num = parseInt(pinArg, 10);
        if (!isNaN(num)) {
          if (board.id === 'esp32-devkit' && (num < 0 || num > 39)) {
            diagnostics.push({
              file: file.name,
              line: lineNum,
              column: lineText.indexOf(pinArg) + 1,
              severity: 'warning',
              message: `GPIO ${num} is out of valid range (0-39) for ESP32.`,
              source: 'hardware-drc',
            });
          } else if (board.id === 'arduino-uno' && (num < 0 || num > 19)) {
            diagnostics.push({
              file: file.name,
              line: lineNum,
              column: lineText.indexOf(pinArg) + 1,
              severity: 'warning',
              message: `Pin ${num} is out of valid range (0-13 digital, A0-A5) for Arduino Uno.`,
              source: 'hardware-drc',
            });
          }
        }
      }

      // Check analogRead on non-ADC pins for Uno
      const analogReadMatch = lineText.match(/analogRead\s*\(\s*(\d+|[A-Za-z0-9_]+)\s*\)/);
      if (analogReadMatch && board.id === 'arduino-uno') {
        const pinArg = analogReadMatch[1].trim();
        const num = parseInt(pinArg, 10);
        if (!isNaN(num) && num > 5 && num < 14) {
          diagnostics.push({
            file: file.name,
            line: lineNum,
            column: lineText.indexOf(pinArg) + 1,
            severity: 'warning',
            message: `analogRead() on Arduino Uno expects analog pins A0-A5 (or 0-5), got digital pin ${num}.`,
            source: 'hardware-drc',
          });
        }
      }
    });
  }

  // 3. Verify main sketch has setup() and loop()
  const combinedCode = files
    .filter((f) => f.type === 'ino' || f.isMain)
    .map((f) => f.content)
    .join('\n');

  const hasSetup = /void\s+setup\s*\(\s*\)/.test(combinedCode);
  const hasLoop = /void\s+loop\s*\(\s*\)/.test(combinedCode);

  if (!hasSetup) {
    diagnostics.push({
      file: mainFile.name,
      line: 1,
      column: 1,
      severity: 'error',
      message: 'Missing mandatory Arduino entry point: "void setup()".',
      source: 'arduino-core',
    });
  }

  if (!hasLoop) {
    diagnostics.push({
      file: mainFile.name,
      line: 1,
      column: 1,
      severity: 'error',
      message: 'Missing mandatory Arduino execution loop: "void loop()".',
      source: 'arduino-core',
    });
  }

  return diagnostics;
}
