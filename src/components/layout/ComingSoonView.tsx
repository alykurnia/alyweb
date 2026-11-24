'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, FolderKanban, Sparkles, CheckCircle2 } from 'lucide-react';

interface ComingSoonViewProps {
  featureName: string;
  tagline: string;
  description: string;
  plannedSprint?: string;
  icon: React.ReactNode;
  specs: { title: string; detail: string }[];
}

export function ComingSoonView({
  featureName,
  tagline,
  description,
  plannedSprint = 'Sprint 2 Milestone',
  icon,
  specs,
}: ComingSoonViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Back button */}
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

      {/* Main Feature Announcement Card */}
      <Card className="p-8 border-slate-200 shadow-sm relative overflow-hidden">
        {/* Subtle engineering grid accent */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-xs">
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {featureName}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    {plannedSprint}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/projects">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<FolderKanban className="w-4 h-4" />}
                >
                  Manage Projects
                </Button>
              </Link>
            </div>
          </div>

          <div className="py-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Architecture Overview
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
              {description}
            </p>
          </div>

          {/* Technical Specs Roadmap */}
          <div className="mt-2 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Engineered Capabilities in Development
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specs.map((spec, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 block">{spec.title}</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      {spec.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Development Notice */}
          <div className="mt-8 p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>
                Sprint 1 Scope: <strong>Dashboard & UI Foundation Active</strong>. Hardware simulator engines will be activated in Sprint 2.
              </span>
            </div>
            <Link href="/" className="font-semibold hover:underline shrink-0 ml-2">
              Return Home &rarr;
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
