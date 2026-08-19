import React from 'react';
import { CooldownCell, AppInstance } from '../types';
import { 
  Clock, 
  RotateCcw, 
  Flame, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { SERVICE_METADATA } from '../utils/mockData';

interface Props {
  cooldownCells: CooldownCell[];
  instances: AppInstance[];
  cooldownWindowSec: number;
  onUpdateCooldownWindow: (sec: number) => void;
  onResetCooldown: (fingerprint: string) => void;
  onTriggerTestCell: (cell: CooldownCell) => void;
}

export const CooldownMatrix: React.FC<Props> = ({
  cooldownCells,
  instances,
  cooldownWindowSec,
  onUpdateCooldownWindow,
  onResetCooldown,
  onTriggerTestCell,
}) => {
  const activeSuppressingCount = cooldownCells.filter(c => c.state === 'cooldown_suppressing').length;
  const totalSuppressedInMatrix = cooldownCells.reduce((acc, c) => acc + c.suppressedCount, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-6 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Signature Cooldown & Suppression Matrix
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              {activeSuppressingCount} Active Lockouts
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time suppression timers per error signature. Duplicate errors received during an active window increment the suppression counter without triggering new pages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total Noise Blocked: </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalSuppressedInMatrix} alerts</span>
          </div>
        </div>
      </div>

      {/* Global TTL Window Slider Control */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Global Suppression Cooldown Window (TTL):
          </span>
          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
            {cooldownWindowSec} seconds
          </span>
        </div>
        <input
          type="range"
          min="15"
          max="300"
          step="5"
          value={cooldownWindowSec}
          onChange={e => onUpdateCooldownWindow(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>15s (Aggressive alerting)</span>
          <span>60s (Recommended baseline)</span>
          <span>300s (Extended outage storm)</span>
        </div>
      </div>

      {/* Cooldown Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {cooldownCells.map(cell => {
          const now = Date.now();
          const isSuppressing = cell.state === 'cooldown_suppressing' && cell.cooldownExpiresAt > now;
          const remainingSec = isSuppressing ? Math.max(0, Math.ceil((cell.cooldownExpiresAt - now) / 1000)) : 0;
          const progressPercent = isSuppressing ? Math.max(0, Math.min(100, (remainingSec / cooldownWindowSec) * 100)) : 0;

          return (
            <div
              key={cell.fingerprint}
              className={`p-4 rounded-xl border transition-all ${
                isSuppressing
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Top Row: Service & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {cell.service}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {cell.errorType}
                  </h4>
                </div>

                {isSuppressing ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3" />
                    {remainingSec}s lock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    Ready
                  </span>
                )}
              </div>

              {/* Progress Countdown Bar */}
              {isSuppressing && (
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Stats Row */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Suppressed:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{cell.suppressedCount} duplicate traces</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onTriggerTestCell(cell)}
                    className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    title="Fire test error matching this signature"
                  >
                    <Flame className="w-3 h-3 text-rose-500" />
                    <span>Fire</span>
                  </button>

                  {isSuppressing && (
                    <button
                      onClick={() => onResetCooldown(cell.fingerprint)}
                      className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Reset cooldown lock immediately"
                    >
                      <RotateCcw className="w-3 h-3 text-blue-500" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
