import React, { useState } from 'react';
import { RawAlert } from '../types';
import { X, Terminal, Pause, Play, Trash2, Copy, Check } from 'lucide-react';

interface Props {
  alerts: RawAlert[];
  isOpen?: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const RawAlertStreamDrawer: React.FC<Props> = ({
  alerts = [],
  isOpen = true,
  onClose,
  onClear,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<'all' | 'suppressed' | 'dispatched'>('all');
  const [copied, setCopied] = useState(false);

  if (isOpen === false) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'suppressed') return a.suppressedByCooldown;
    if (filter === 'dispatched') return !a.suppressedByCooldown;
    return true;
  });

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(
      filteredAlerts
        .map(a => `[${new Date(a.timestamp).toISOString()}] [${a.service}] [${a.instanceName}] [${a.suppressedByCooldown ? 'SUPPRESSED' : 'DISPATCHED'}] ${a.message}`)
        .join('\n')
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Ingestion Telemetry Stream</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time alert buffer ({alerts.length} events)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume live scrolling' : 'Freeze stream'}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isPaused 
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
              <span>{isPaused ? 'Paused' : 'Live'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter & Toolbar */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded cursor-pointer ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('suppressed')}
              className={`px-2 py-1 rounded cursor-pointer ${filter === 'suppressed' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Suppressed ({alerts.filter(a => a.suppressedByCooldown).length})
            </button>
            <button
              onClick={() => setFilter('dispatched')}
              className={`px-2 py-1 rounded cursor-pointer ${filter === 'dispatched' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold shadow-xs' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Dispatched ({alerts.filter(a => !a.suppressedByCooldown).length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              title="Copy telemetry stream"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClear}
              className="p-1 rounded text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              title="Clear terminal stream"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Clear</span>
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950 text-slate-200">
          {filteredAlerts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-center p-6">
              No telemetry events match current filter.
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-2.5 rounded-lg border text-[11px] leading-relaxed transition-all ${
                  alert.suppressedByCooldown 
                    ? 'bg-amber-950/20 border-amber-900/40 text-amber-300/90' 
                    : 'bg-rose-950/20 border-rose-900/50 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                    alert.suppressedByCooldown 
                      ? 'bg-amber-900/50 text-amber-300' 
                      : 'bg-rose-900/60 text-rose-200'
                  }`}>
                    {alert.suppressedByCooldown ? 'Suppressed (Cooldown)' : 'Dispatched (Triggered Incident)'}
                  </span>
                </div>
                <div className="font-semibold text-slate-100 mb-0.5">
                  [{alert.service}] <span className="text-slate-300">{alert.errorType}</span> on <span className="text-blue-400">{alert.instanceName}</span>
                </div>
                <div className="text-slate-300 break-words">{alert.message}</div>
                {alert.stackTrace && (
                  <pre className="mt-1.5 p-1.5 bg-black/40 rounded text-[10px] text-slate-400 overflow-x-auto">
                    {alert.stackTrace}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
