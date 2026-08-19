import React, { useState } from 'react';
import { RawAlert } from '../types';
import { X, Terminal, Pause, Play, Trash2, Copy, Check } from 'lucide-react';

interface Props {
  alerts: RawAlert[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const RawAlertStreamDrawer: React.FC<Props> = ({
  alerts,
  isOpen,
  onClose,
  onClear,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<'all' | 'suppressed' | 'dispatched'>('all');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-150">
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
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPaused 
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            <span>{isPaused ? 'Paused' : 'Live'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
            className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('suppressed')}
            className={`px-2 py-1 rounded ${filter === 'suppressed' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Suppressed ({alerts.filter(a => a.suppressedByCooldown).length})
          </button>
          <button
            onClick={() => setFilter('dispatched')}
            className={`px-2 py-1 rounded ${filter === 'dispatched' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Dispatched ({alerts.filter(a => !a.suppressedByCooldown).length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={onClear}
            className="text-xs text-rose-600 hover:underline flex items-center gap-1 ml-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-900 text-slate-200 font-mono text-xs space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-sans">
            No events logged in the terminal buffer.
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-2.5 rounded border transition-all ${
                alert.suppressedByCooldown
                  ? 'border-slate-800 bg-slate-950/60 text-slate-400'
                  : 'border-rose-900/60 bg-rose-950/30 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>{new Date(alert.timestamp).toLocaleTimeString()} • [{alert.service}] {alert.instanceName}</span>
                <span className={`font-semibold ${alert.suppressedByCooldown ? 'text-amber-400' : 'text-rose-400'}`}>
                  {alert.suppressedByCooldown ? 'SUPPRESSED (COOLDOWN)' : 'DISPATCHED ON-CALL'}
                </span>
              </div>
              <div className="break-all">{alert.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
