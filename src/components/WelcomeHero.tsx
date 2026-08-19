import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  ArrowRight, 
  Bell, 
  BellOff, 
  Sparkles, 
  Layers, 
  Activity, 
  Database, 
  CreditCard,
  Pause,
  Play,
  Zap,
  Sliders,
  Check,
  RefreshCw,
  Clock,
  Send
} from 'lucide-react';
import { RawAlert, IncidentThread, AppSettings } from '../types';

interface Props {
  totalRaw: number;
  totalSuppressed: number;
  activeIncidentsCount: number;
  recentAlerts: RawAlert[];
  incidents: IncidentThread[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onInjectBurst: (count: number) => void;
  onNavigateTab: (tab: 'incidents' | 'topology' | 'matrix' | 'stream' | 'analytics') => void;
}

export const WelcomeHero: React.FC<Props> = ({
  totalRaw,
  totalSuppressed,
  activeIncidentsCount,
  recentAlerts,
  incidents,
  settings,
  onUpdateSettings,
  onInjectBurst,
  onNavigateTab,
}) => {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [animatingCount, setAnimatingCount] = useState<number>(0);

  const isPaused = settings.ingestionSpeed === 'paused';

  const togglePause = () => {
    onUpdateSettings({
      ingestionSpeed: isPaused ? 'normal' : 'paused'
    });
  };

  const handleRunScenario = (scenarioName: string, count: number) => {
    setActiveScenario(scenarioName);
    setAnimatingCount(count);
    onInjectBurst(count);

    setTimeout(() => {
      setActiveScenario(null);
      setAnimatingCount(0);
    }, 2500);
  };

  const noiseFilteredPercent = totalRaw > 0 
    ? Math.round((totalSuppressed / totalRaw) * 100) 
    : 96;

  const hoursSaved = (totalSuppressed * 2.5 / 60).toFixed(1);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* 1. Hero Title & Value Proposition */}
      <div className="text-center space-y-4 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Intelligent Alert Deduplication</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Turn 100 Panic Alerts into <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
            1 Quiet, Actionable Summary
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          When servers crash, they flood engineers with endless duplicate error pings. 
          SignalGuard silently catches the storm, blocks the noise, and delivers <strong>one clean notification</strong> with the exact fix.
        </p>

        {/* Global Alert Control Bar: Play / Pause + Test Storm */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {/* Pause / Play Toggle */}
          <button
            onClick={togglePause}
            className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              isPaused
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Alerts are Paused (Click to Resume)</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
                <span>Pause Live Alerts</span>
              </>
            )}
          </button>

          {/* Simulate Failure Button */}
          <button
            onClick={() => handleRunScenario('Database Disconnect', 10)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer transition-all"
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Simulate 10x Error Burst</span>
          </button>

          {/* Direct link to Queue */}
          <button
            onClick={() => onNavigateTab('incidents')}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>View Incidents</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Creative Interactive Sandbox Stage */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Interactive Noise Filter Sandbox</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any outage scenario below to watch SignalGuard intercept duplicate alerts live.
            </p>
          </div>

          {/* Quick Scenario Triggers */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleRunScenario('Database Crash', 8)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Database Outage (8x)</span>
            </button>

            <button
              onClick={() => handleRunScenario('Payment Gateway Timeout', 8)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payment Timeout (8x)</span>
            </button>
          </div>
        </div>

        {/* The 3-Stage Visual Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 relative">
          
          {/* Stage 1: The Raw Error Burst */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  1. Server Outage Burst
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                  {animatingCount > 0 ? `${animatingCount} ALERTS INCOMING` : 'SPAM ALERT STREAM'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A single down server triggers hundreds of repetitive error logs.
              </p>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-2xs">
                <span>🚨 [DB-01] Connection refused</span>
                <span className="text-[10px] text-slate-400">0.1s</span>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-2xs">
                <span>🚨 [API-GW] 503 DB Unreachable</span>
                <span className="text-[10px] text-slate-400">0.2s</span>
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-rose-700 dark:text-rose-300 flex items-center justify-between shadow-2xs">
                <span>🚨 [PAY-01] Connection pool empty</span>
                <span className="text-[10px] text-slate-400">0.3s</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
              Without SignalGuard: Phone buzzes 50 times 😫
            </div>
          </div>

          {/* Stage 2: SignalGuard Smart Shield */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  2. SignalGuard Smart Filter
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  DEDUPLICATING
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Matches error signatures and silences duplicates during the 60s cooldown window.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/60 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Identified Signature:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">DB_CONN_FAIL</span>
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Silence Lock Timer:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 60s active
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Noise Filter Ratio:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{noiseFilteredPercent}%</span>
              </div>
            </div>

            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold text-center">
              ✓ Duplicate alerts silently merged into 1 thread
            </div>
          </div>

          {/* Stage 3: Clean Actionable Output */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  3. Clean Notification
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  1 MESSAGE ONLY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your team receives a single consolidated summary with fix steps.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 space-y-1.5 text-xs shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span>Slack: [Critical] Database Pool Error</span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                <strong>Root Cause:</strong> Max connection limits reached.
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                <strong>Fix:</strong> Restart pooler or expand connection capacity.
              </div>
            </div>

            <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold text-center">
              1 page delivered • Engineer sleeps peacefully 😴
            </div>
          </div>

        </div>
      </div>

      {/* 3. Live Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Noise Reduced</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {noiseFilteredPercent}%
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Duplicate pings blocked</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Spam Blocked</span>
            <BellOff className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            {totalSuppressed}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Quiet phone notifications</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Active Incidents</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {activeIncidentsCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Consolidated problem threads</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Engineer Time Saved</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
            ~{hoursSaved} hrs
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Saved from triage noise</p>
        </div>

      </div>

      {/* 4. Three Simple Steps (Beginner Friendly) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-2 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm">
            1
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            1. Automatic Telemetry Ingestion
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            SignalGuard connects directly to your servers and logs. You can pause or resume the stream anytime with one click.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-2 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm">
            2
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            2. Smart Fingerprint Clustering
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Duplicate error messages are grouped together. Subsequent identical errors silently increase the counter without buzzing your phone.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-2 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm">
            3
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            3. Instant Resolution Runbooks
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Every incident includes automated root-cause diagnosis, list of affected servers, and ready-to-use post-mortem reports.
          </p>
        </div>

      </div>

    </div>
  );
};
