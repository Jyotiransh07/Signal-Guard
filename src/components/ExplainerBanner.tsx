import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Clock, 
  BellRing, 
  ArrowRight, 
  Flame, 
  Sparkles, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Database, 
  CreditCard, 
  Cpu 
} from 'lucide-react';

interface Props {
  onInjectBurst: (count: number) => void;
  onInjectPreset: (scenario: 'database' | 'payment' | 'worker') => void;
}

export const ExplainerBanner: React.FC<Props> = ({ onInjectBurst, onInjectPreset }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-all mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Intelligent Alert Deduplication & Noise Suppression
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            During infrastructure failures, modern cloud clusters generate hundreds of repetitive alerts every second. 
            <strong> SignalGuard</strong> intercepts the incoming telemetry stream, groups identical error traces by signature, enforces an intelligent cooldown suppression window, and delivers a single, clean actionable incident to on-call teams.
          </p>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 shrink-0 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span>{isCollapsed ? 'Show How It Works' : 'Hide'}</span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {/* 3-Step Visual Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">1. Ingest Raw Telemetry</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Continuous logs & metrics flow from Kubernetes pods, microservices, and databases.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">2. Cluster & Cooldown Lock</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Similar stack traces map to one fingerprint. Cascading repeat errors are silently suppressed within the cooldown window.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">3. Clean Dispatch</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Only 1 actionable page dispatched to PagerDuty or Slack with aggregated instance count and remediation runbook.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Simulation Testing Trigger Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Try Live Failure Scenarios:
            </span>

            <button
              onClick={() => onInjectPreset('database')}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span>DB Connection Pool Crash (10 alerts)</span>
            </button>

            <button
              onClick={() => onInjectPreset('payment')}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-rose-500" />
              <span>Payment Gateway 504 Timeout</span>
            </button>

            <button
              onClick={() => onInjectPreset('worker')}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-violet-500" />
              <span>Worker Node OOM Storm</span>
            </button>

            <button
              onClick={() => onInjectBurst(20)}
              className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ml-auto"
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Inject Rapid Burst (20x)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
