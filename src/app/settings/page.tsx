'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, ShieldCheck, Key } from 'lucide-react';

export default function AccountSettingsPage() {
  const [name, setName] = useState('Alex Morgan');
  const [email, setEmail] = useState('alex.morgan@iotlab.dev');
  const [role, setRole] = useState('Lead Embedded Hardware Engineer');
  const [apiKey] = useState('iotlab_live_sk_8f93e18a209b0147');
  const [copied, setCopied] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard?.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <Link href="/">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
            className="text-xs text-slate-600 hover:text-slate-900"
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Account & Security Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal engineering profile, credentials, and hardware API tokens.
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-6 border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-bold text-lg flex items-center justify-center ring-4 ring-blue-500/10">
            AM
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500">{email}</p>
            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified Hardware Developer
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Engineering Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Card>

      {/* Hardware API Key Card */}
      <Card className="p-6 border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">WebSerial & Compiler API Token</h3>
        </div>
        <p className="text-xs text-slate-500">
          Use this token for headless firmware flashing and command-line automation.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="password"
            readOnly
            value={apiKey}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 select-all"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyKey}
            className="text-xs shrink-0"
          >
            {copied ? 'Copied!' : 'Copy Token'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
