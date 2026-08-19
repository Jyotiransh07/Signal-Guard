import React, { useState } from 'react';
import { RawAlert, AppSettings, IncidentThread } from '../types';
import { 
  Radio, 
  Layers, 
  Bell, 
  MessageSquare, 
  MessageCircle, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  Flame 
} from 'lucide-react';

interface Props {
  alerts: RawAlert[];
  incidents: IncidentThread[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onInjectBurst: (count: number) => void;
}

export const RoutingPipeline: React.FC<Props> = ({
  alerts = [],
  incidents = [],
  settings,
  onUpdateSettings,
  onInjectBurst,
}) => {
  const [streamFilter, setStreamFilter] = useState<'all' | 'suppressed' | 'dispatched'>('all');

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const totalAlerts = safeAlerts.length;
  const suppressedCount = safeAlerts.filter(a => a?.suppressedByCooldown).length;
  const dispatchedCount = safeAlerts.filter(a => !a?.suppressedByCooldown).length;
  const noiseReductionRatio = totalAlerts > 0 ? Math.round((suppressedCount / totalAlerts) * 100) : 96;

  const currentChannels = settings?.channels || {
    slack: true,
    pagerduty: true,
    discord: true,
    webhook: true,
  };

  const filteredAlerts = safeAlerts.filter(a => {
    if (streamFilter === 'suppressed') return a?.suppressedByCooldown;
    if (streamFilter === 'dispatched') return !a?.suppressedByCooldown;
    return true;
  }).slice(0, 15);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-6 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Real-Time Alert Routing Pipeline
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Active Deduplication
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trace how incoming raw alert storms are clustered and suppressed before reaching on-call engineers.
          </p>
        </div>

        <button
          onClick={() => onInjectBurst(10)}
          className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>Fire 10 Test Alerts</span>
        </button>
      </div>

      {/* 4-Stage Visual Architecture Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Stage 1: Ingest */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stage 01</span>
            <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Ingestion Gateway</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            OpenTelemetry collector buffer capturing logs, traces & metrics.
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total Ingested:</span>
            <span className="font-bold text-slate-900 dark:text-white">{totalAlerts} events</span>
          </div>
        </div>

        {/* Stage 2: Clustering */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stage 02</span>
            <Layers className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Signature Clustering</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Tokenizes stack traces and groups by error fingerprint & service.
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Similarity Match:</span>
            <span className="font-bold text-violet-600 dark:text-violet-400">{((settings?.similarityThreshold || 0.85) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Stage 3: Cooldown Filter */}
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Stage 03</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Cooldown Lockout</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Silently squelches duplicates during the {settings?.cooldownWindowSec || 60}s cooldown period.
          </div>
          <div className="pt-2 border-t border-amber-200 dark:border-amber-900/50 flex justify-between items-center text-xs">
            <span className="text-amber-700 dark:text-amber-400 font-medium">Noise Filtered:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{suppressedCount} ({noiseReductionRatio}%)</span>
          </div>
        </div>

        {/* Stage 4: Channel Dispatch */}
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">Stage 04</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">Escalation Dispatch</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Delivers a consolidated actionable page with full diagnostic runbook.
          </div>
          <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900/50 flex justify-between items-center text-xs">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Clean Pages Sent:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{dispatchedCount} alerts</span>
          </div>
        </div>
      </div>

      {/* Connected Channels Settings Row */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            Connected Escalation Destinations
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Toggle on-call notification endpoints
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={Boolean(currentChannels.slack)}
              onChange={e => onUpdateSettings({
                channels: { ...currentChannels, slack: e.target.checked }
              })}
              className="rounded accent-blue-600 cursor-pointer"
            />
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Slack #eng-ops</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={Boolean(currentChannels.pagerduty)}
              onChange={e => onUpdateSettings({
                channels: { ...currentChannels, pagerduty: e.target.checked }
              })}
              className="rounded accent-blue-600 cursor-pointer"
            />
            <Bell className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">PagerDuty P1</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={Boolean(currentChannels.discord)}
              onChange={e => onUpdateSettings({
                channels: { ...currentChannels, discord: e.target.checked }
              })}
              className="rounded accent-blue-600 cursor-pointer"
            />
            <MessageCircle className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Discord Alert</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300">
            <input
              type="checkbox"
              checked={Boolean(currentChannels.webhook)}
              onChange={e => onUpdateSettings({
                channels: { ...currentChannels, webhook: e.target.checked }
              })}
              className="rounded accent-blue-600 cursor-pointer"
            />
            <Terminal className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">JSON Webhook</span>
          </label>
        </div>
      </div>

      {/* Live Stream Telemetry Table */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Telemetry Stream Buffer
          </h4>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setStreamFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                streamFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({safeAlerts.length})
            </button>
            <button
              onClick={() => setStreamFilter('suppressed')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                streamFilter === 'suppressed'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Suppressed ({suppressedCount})
            </button>
            <button
              onClick={() => setStreamFilter('dispatched')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                streamFilter === 'dispatched'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dispatched ({dispatchedCount})
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs font-mono">
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-sans">
              No telemetry events in buffer.
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                  alert.suppressedByCooldown
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    : 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/60'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">[{alert.instanceName}]</span>
                    <span className="text-slate-500">{alert.service}</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 break-all font-sans text-xs">
                    {alert.message}
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col sm:items-end gap-1 font-sans">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      alert.suppressedByCooldown
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {alert.suppressedByCooldown ? 'Suppressed by Cooldown' : 'Dispatched to On-Call'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
