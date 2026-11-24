'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { X, FileCode, FileText } from 'lucide-react';
import { useCodeEditorStore } from '@/stores/codeEditorStore';
import type { OnMount } from '@monaco-editor/react';

// Dynamically import Monaco Editor to avoid SSR hydration issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export function MonacoEditorPane() {
  const {
    files,
    activeFileId,
    openTabIds,
    selectFile,
    closeTab,
    updateFileContent,
    unsavedFileIds,
    saveCurrentFile,
    diagnostics,
  } = useCodeEditorStore();

  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register Arduino Autocomplete keywords if not already registered
    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          {
            label: 'pinMode',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'pinMode(${1:pin}, ${2|OUTPUT,INPUT,INPUT_PULLUP|});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Configures the specified pin to behave either as an input or an output.',
            range,
          },
          {
            label: 'digitalWrite',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'digitalWrite(${1:pin}, ${2|HIGH,LOW|});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Write a HIGH or a LOW value to a digital pin.',
            range,
          },
          {
            label: 'digitalRead',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'digitalRead(${1:pin})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Reads the value from a specified digital pin, either HIGH or LOW.',
            range,
          },
          {
            label: 'analogRead',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'analogRead(${1:pin})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Reads the value from the specified analog pin (0-4095 on ESP32, 0-1023 on Uno).',
            range,
          },
          {
            label: 'analogWrite',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'analogWrite(${1:pin}, ${2:duty});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Writes an analog value (PWM wave) to a pin.',
            range,
          },
          {
            label: 'delay',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'delay(${1:1000});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Pauses the program for the amount of time (in milliseconds) specified as parameter.',
            range,
          },
          {
            label: 'millis',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'millis()',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Returns the number of milliseconds passed since the program began running.',
            range,
          },
          {
            label: 'Serial.println',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Serial.println(${1:"Hello IoT Lab"});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Prints data to the serial port as human-readable ASCII text followed by a newline.',
            range,
          },
          {
            label: 'Serial.print',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Serial.print(${1:val});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Prints data to the serial port as human-readable ASCII text.',
            range,
          },
          {
            label: 'Serial.begin',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Serial.begin(${1|115200,9600,57600,19200|});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Sets the data rate in bits per second (baud) for serial data transmission.',
            range,
          },
          {
            label: 'setup',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'void setup() {\n\t${1}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'The setup() function is called when a sketch starts.',
            range,
          },
          {
            label: 'loop',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'void loop() {\n\t${1}\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'After creating a setup() function, the loop() function does precisely what its name suggests, and loops consecutively.',
            range,
          },
        ];

        return { suggestions };
      },
    });

    // Add Ctrl+S keyboard shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveCurrentFile();
    });
  };

  // Sync Diagnostics with Monaco Model Markers
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current || !activeFile) return;

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    const fileDiags = diagnostics.filter((d) => d.file === activeFile.name);
    const markers = fileDiags.map((d) => ({
      startLineNumber: d.line,
      startColumn: d.column || 1,
      endLineNumber: d.endLine || d.line,
      endColumn: d.endColumn || 120,
      message: d.message,
      severity:
        d.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : d.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info,
    }));

    monaco.editor.setModelMarkers(model, 'owner', markers);
  }, [diagnostics, activeFile]);

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'ino':
        return <FileCode className="w-3.5 h-3.5 text-emerald-400" />;
      case 'cpp':
        return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
      case 'h':
        return <FileText className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Tab Bar */}
      <div className="h-9 bg-slate-900 border-b border-slate-800 flex items-center overflow-x-auto select-none no-scrollbar">
        {openTabIds.map((tabId) => {
          const file = files.find((f) => f.id === tabId);
          if (!file) return null;
          const isActive = tabId === activeFileId;
          const isUnsaved = unsavedFileIds.includes(tabId);

          return (
            <div
              key={tabId}
              onClick={() => selectFile(tabId)}
              className={`group h-full px-3 flex items-center gap-2 border-r border-slate-800 text-xs font-medium cursor-pointer transition-colors ${
                isActive
                  ? 'bg-slate-950 text-slate-100 border-t-2 border-t-blue-500'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              {getTabIcon(file.type)}
              <span>{file.name}</span>

              {isUnsaved && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
              )}

              {openTabIds.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tabId);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 rounded p-0.5 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Monaco Code Editor */}
      <div className="flex-1 relative overflow-hidden">
        {activeFile ? (
          <Editor
            height="100%"
            language="cpp"
            theme="vs-dark"
            value={activeFile.content}
            onChange={(val) => updateFileContent(activeFile.id, val || '')}
            onMount={handleEditorMount}
            options={{
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: true, maxColumn: 80 },
              scrollBeyondLastLine: false,
              tabSize: 2,
              wordWrap: 'on',
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No active file selected.
          </div>
        )}
      </div>
    </div>
  );
}
