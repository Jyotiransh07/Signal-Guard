import React, { useState } from 'react';
import { IncidentThread, AppInstance } from '../types';
import { 
  X, 
  CheckCircle2, 
  Check, 
  Clock, 
  Server, 
  MessageSquare, 
  Bell, 
  Lightbulb, 
  Terminal, 
  Copy,
  AlertTriangle,
  FileCode,
  Layers
} from 'lucide-react';
import { SERVICE_METADATA } from '../utils/mockData';

interface Props {
  incident: IncidentThread;
  instances: AppInstance[];
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onEscalate: (id: string, channel: 'pagerduty' | 'slack' | 'discord') => void;
  onSnoozeCooldown: (fingerprint: string) => void;
}

export const IncidentDetailModal: React.FC<Props> = ({
  incident,
  instances,
  onClose,
  onAcknowledge,
  onResolve,
  onEscalate,
  onSnoozeCooldown,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'stacktrace' | 'json'>('timeline');
  const [copied, setCopied] = useState(false);

  const dedupRatio = incident.alertCount > 0 
    ? (((incident.alertCount - (incident.dispatchedCount || 1)) / incident.alertCount) * 100).toFixed(1) 
    : '0';

  const copyIncidentJson = () => {
    navigator.clipboard.writeText(JSON.stringify(incident, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span
                className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  incident.severity === 'critical'
                    ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                    : incident.severity === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                }`}
              >
                {incident.severity}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded">
                {incident.service}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded">
                SIG: {incident.fingerprint}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {incident.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Raw Ingested</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{incident.alertCount} events</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Suppressed</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{dedupRatio}% filtered</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Affected Nodes</span>
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{incident.affectedInstances.length} nodes</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Duration</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {Math.max(1, Math.round((incident.lastSeen - incident.firstSeen) / 1000))}s active
            </span>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Root Cause Hypothesis & Runbook */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Root Cause Diagnosis & Suggested Runbook</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
              {incident.rootCauseHypothesis}
            </p>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
              <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-700 dark:text-emerald-400 block mb-0.5 text-xs">Remediation Action:</strong>
                <span className="font-mono text-xs">{incident.recommendedAction}</span>
              </div>
            </div>
          </div>

          {/* Affected Instances */}
          <div className="space-y-2">
            <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <Server className="w-4 h-4 text-blue-500" />
              <span>Affected Cluster Instances ({incident.affectedInstances.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {incident.affectedInstances.map(nodeId => {
                const inst = instances.find(i => i.id === nodeId);
                return (
                  <div
                    key={nodeId}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">{inst?.name || nodeId}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{inst?.region || 'cluster-node'}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                      Impacted
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabbed Inspector: Timeline, Stack Trace, JSON */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    activeTab === 'timeline'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Raw Alert Stream ({incident.rawAlerts.length})
                </button>
                <button
                  onClick={() => setActiveTab('stacktrace')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    activeTab === 'stacktrace'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Stack Trace Diff
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    activeTab === 'json'
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Payload JSON
                </button>
              </div>

              {activeTab === 'json' && (
                <button
                  onClick={copyIncidentJson}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            {/* Timeline view */}
            {activeTab === 'timeline' && (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {incident.rawAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-2.5 rounded-lg border text-xs font-mono ${
                      alert.suppressedByCooldown
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-sans">
                      <span>{new Date(alert.timestamp).toLocaleTimeString()} • {alert.instanceName}</span>
                      <span className={`font-semibold ${alert.suppressedByCooldown ? 'text-amber-600' : 'text-rose-600'}`}>
                        {alert.suppressedByCooldown ? 'Suppressed in Cooldown' : 'Dispatched Alert'}
                      </span>
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 break-all">{alert.message}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Stack trace view */}
            {activeTab === 'stacktrace' && (
              <div className="p-3.5 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-56">
                <pre className="whitespace-pre leading-relaxed">
                  {incident.rawAlerts[0]?.stackTrace || 'No stack trace provided in telemetry payload.'}
                </pre>
              </div>
            )}

            {/* JSON view */}
            {activeTab === 'json' && (
              <div className="p-3.5 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-56">
                <pre className="whitespace-pre leading-relaxed">
                  {JSON.stringify(incident, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Escalate:</span>
            <button
              onClick={() => onEscalate(incident.id, 'slack')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>Slack</span>
            </button>
            <button
              onClick={() => onEscalate(incident.id, 'pagerduty')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-500" />
              <span>PagerDuty</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {incident.status === 'active' && (
              <button
                onClick={() => {
                  onAcknowledge(incident.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Acknowledge
              </button>
            )}

            {incident.status !== 'resolved' && (
              <button
                onClick={() => {
                  onResolve(incident.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Mark Resolved
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
