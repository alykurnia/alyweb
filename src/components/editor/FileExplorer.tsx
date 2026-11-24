'use client';

import React, { useState, useRef } from 'react';
import {
  FileCode,
  FileText,
  FilePlus,
  Trash2,
  Edit2,
  Download,
  Upload,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';
import { useCodeEditorStore } from '@/stores/codeEditorStore';
import { ARDUINO_TEMPLATES, ArduinoTemplate } from '@/lib/templates/arduinoTemplates';

export function FileExplorer() {
  const {
    files,
    activeFileId,
    selectFile,
    createFile,
    renameFile,
    deleteFile,
    exportProjectZip,
    importFiles,
    loadTemplate,
    selectedBoard,
  } = useCodeEditorStore();

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'ino' | 'cpp' | 'h'>('cpp');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isExamplesOpen, setIsExamplesOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartCreate = (type: 'ino' | 'cpp' | 'h') => {
    setNewFileType(type);
    setNewFileName('');
    setIsCreatingFile(true);
  };

  const handleConfirmCreate = () => {
    if (newFileName.trim()) {
      createFile(newFileName.trim(), newFileType);
      setIsCreatingFile(false);
      setNewFileName('');
    }
  };

  const handleStartRename = (file: { id: string; name: string }) => {
    setEditingFileId(file.id);
    setEditName(file.name);
  };

  const handleConfirmRename = (fileId: string) => {
    if (editName.trim()) {
      renameFile(fileId, editName.trim());
      setEditingFileId(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded || uploaded.length === 0) return;

    const imported: { name: string; content: string }[] = [];
    for (let i = 0; i < uploaded.length; i++) {
      const f = uploaded[i];
      const text = await f.text();
      imported.push({ name: f.name, content: text });
    }

    importFiles(imported);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'ino':
        return <FileCode className="w-4 h-4 text-emerald-400" />;
      case 'cpp':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'h':
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col select-none text-xs">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".ino,.cpp,.h,.c"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Explorer Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90">
        <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          Project Files
        </span>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStartCreate('cpp')}
            title="New C++ Source File"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleImportClick}
            title="Import Source Files"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => exportProjectZip()}
            title="Export Project as ZIP"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Project Files List */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Inline file creation input */}
        {isCreatingFile && (
          <div className="px-3 py-1.5 bg-slate-800/60 flex items-center gap-2 border-l-2 border-blue-500">
            {getFileIcon(newFileType)}
            <input
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmCreate();
                if (e.key === 'Escape') setIsCreatingFile(false);
              }}
              placeholder={`filename.${newFileType}`}
              className="w-full bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleConfirmCreate}
              className="text-emerald-400 hover:text-emerald-300"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* File items */}
        <div className="space-y-0.5 px-2">
          {files.map((file) => {
            const isActive = activeFileId === file.id;
            const isEditing = editingFileId === file.id;

            return (
              <div
                key={file.id}
                onClick={() => !isEditing && selectFile(file.id)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 font-medium'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {getFileIcon(file.type)}
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename(file.id);
                        if (e.key === 'Escape') setEditingFileId(null);
                      }}
                      onBlur={() => handleConfirmRename(file.id)}
                      className="bg-slate-900 text-slate-100 px-1 py-0.5 text-xs rounded border border-blue-500 w-32 focus:outline-none"
                    />
                  ) : (
                    <span className="truncate">{file.name}</span>
                  )}
                </div>

                {/* Hover action icons */}
                {!isEditing && (
                  <div className="hidden group-hover:flex items-center gap-1 text-slate-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRename(file);
                      }}
                      title="Rename"
                      className="p-1 hover:text-slate-200"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${file.name}?`)) deleteFile(file.id);
                        }}
                        title="Delete"
                        className="p-1 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Example Sketches Accordion */}
        <div className="mt-4 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setIsExamplesOpen(!isExamplesOpen)}
            className="w-full px-3 py-1.5 flex items-center justify-between text-slate-400 hover:text-slate-200 font-bold text-[10px] uppercase tracking-wider"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              Example Sketches ({ARDUINO_TEMPLATES.length})
            </span>
            {isExamplesOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {isExamplesOpen && (
            <div className="space-y-1 px-2 mt-1">
              {ARDUINO_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => loadTemplate(tpl.id)}
                  className="px-2.5 py-1.5 rounded-md hover:bg-slate-800/70 text-slate-300 hover:text-white cursor-pointer transition-colors group flex items-start justify-between gap-1"
                >
                  <div>
                    <div className="font-medium text-xs group-hover:text-amber-300 transition-colors">
                      {tpl.name}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className="px-1 rounded bg-slate-800 text-slate-400">
                        {tpl.targetBoard === 'esp32-devkit' ? 'ESP32' : 'Uno'}
                      </span>
                      <span>•</span>
                      <span>{tpl.category}</span>
                    </div>
                  </div>

                  <span className="text-[10px] opacity-0 group-hover:opacity-100 text-amber-400 font-semibold transition-opacity">
                    Load
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
