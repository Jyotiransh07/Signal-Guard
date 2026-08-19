import React, { useState } from 'react';
import { IncidentThread, Severity, IncidentStatus } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Layers, 
  Search, 
  Check, 
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Server,
  ShieldCheck,
  Flame,
  ArrowUpRight,
  Filter,
  X
} from 'lucide-react';
import { SERVICE_METADATA } from '../utils/mockData';

interface Props {
  incidents: IncidentThread[];
  selectedInstanceId: string | null;
  onClearInstanceFilter: () => void;
  onSelectIncident: (incident: IncidentThread) => void;
  onAcknowledge: (incidentId: string) => void;
  onResolve: (incidentId: string) => void;
  onOpenPostMortem: (incident: IncidentThread) => void;
}

export const IncidentList: React.FC<Props> = ({
  incidents,
  selectedInstanceId,
  onClearInstanceFilter,
  onSelectIncident,
  onAcknowledge,
  onResolve,
  onOpenPostMortem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);

  const filteredIncidents = incidents.filter(inc => {
    // Node filter
    if (selectedInstanceId && !inc.affectedInstances.includes(selectedInstanceId)) {
      return false;
    }

    // Severity filter
    if (severityFilter !== 'all' && inc.severity !== severityFilter) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && inc.status !== statusFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = inc.title.toLowerCase().includes(q);
      const matchService = inc.service.toLowerCase().includes(q);
      const matchFp = inc.fingerprint.toLowerCase().includes(q);
      const matchMsg = inc.rawAlerts.some(a => a.message.toLowerCase().includes(q));
      if (!matchTitle && !matchService && !matchFp && !matchMsg) return false;
    }

    return true;
  });

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
            Warning
          </span>
        );
      case 'info':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
            Info
          </span>
        );
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Active Outage
          </span>
        );
      case 'cooldown_suppressed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Cooldown Active
          </span>
        );
      case 'acknowledged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Acknowledged
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Resolved
          </span>
        );
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Aggregated Incident Threads
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredIncidents.length} {filteredIncidents.length === 1 ? 'thread' : 'threads'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Similar alert traces grouped by root-cause signature to eliminate on-call noise.
          </p>
        </div>

        {/* Selected Instance Filter Chip */}
        {selectedInstanceId && (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-xs font-medium">
            <Server className="w-3.5 h-3.5" />
            <span>Filtered by node: <strong>{selectedInstanceId}</strong></span>
            <button
              onClick={onClearInstanceFilter}
              className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-blue-700 dark:text-blue-300"
              title="Clear node filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by error, service, or trace..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">Severity:</label>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="cooldown_suppressed">Cooldown Suppressed</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-3 pt-1">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">All Services Operating Normally</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              No matching incidents found. Inject a simulation burst or craft an alert above to see SignalGuard cluster and deduplicate telemetry.
            </p>
          </div>
        ) : (
          filteredIncidents.map(incident => {
            const isExpanded = expandedThreadId === incident.id;
            const suppressionPercent = incident.alertCount > 0 
              ? Math.round(((incident.alertCount - (incident.dispatchedCount || 1)) / incident.alertCount) * 100) 
              : 0;

            const isCoolingDown = incident.cooldownExpiresAt > Date.now();
            const cooldownRemainingSec = Math.max(0, Math.ceil((incident.cooldownExpiresAt - Date.now()) / 1000));

            return (
              <div
                key={incident.id}
                className={`rounded-xl border transition-all ${
                  incident.status === 'active'
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                    : incident.status === 'resolved'
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                } hover:shadow-md`}
              >
                {/* Main Card Content */}
                <div className="p-4 space-y-3">
                  {/* Top Bar: Badges & Timestamps */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(incident.severity)}
                      {getStatusBadge(incident.status)}
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {incident.service}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>First seen: {formatRelativeTime(incident.firstSeen)}</span>
                      <span>•</span>
                      <span>Last seen: {formatRelativeTime(incident.lastSeen)}</span>
                    </div>
                  </div>

                  {/* Title & Status info */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {incident.title}
                      </h4>
                    </div>
                    {isCoolingDown && incident.status !== 'resolved' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Cooldown lock: {cooldownRemainingSec}s remaining
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Telemetry Summary Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">Total Raw Alerts</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {incident.alertCount} events
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <div className="text-emerald-700 dark:text-emerald-400 text-[11px]">Noise Suppressed</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {incident.suppressedCount || Math.max(0, incident.alertCount - 1)} ({suppressionPercent}%)
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">Pages Dispatched</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {incident.dispatchedCount || 1} alert
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">Affected Nodes</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {incident.affectedInstances.length} {incident.affectedInstances.length === 1 ? 'instance' : 'instances'}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Expanded Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setExpandedThreadId(isExpanded ? null : incident.id)}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span>{isExpanded ? 'Hide Error Sample' : 'Inspect Sample Trace'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {incident.status === 'active' && (
                        <button
                          onClick={() => onAcknowledge(incident.id)}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}

                      {incident.status !== 'resolved' && (
                        <button
                          onClick={() => onResolve(incident.id)}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}

                      <button
                        onClick={() => onOpenPostMortem(incident)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Generate Markdown Post-Mortem Report"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Post-Mortem</span>
                      </button>

                      <button
                        onClick={() => onSelectIncident(incident)}
                        className="px-3 py-1 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Details & Runbook</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Expanded Stack Trace */}
                  {isExpanded && incident.rawAlerts[0] && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono space-y-2">
                      <div className="text-slate-400 text-[11px] flex justify-between items-center border-b border-slate-800 pb-1">
                        <span>Latest Error Payload (node: {incident.rawAlerts[0].instanceName})</span>
                        <span>{new Date(incident.rawAlerts[0].timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-rose-400 font-semibold break-all">
                        {incident.rawAlerts[0].message}
                      </div>
                      {incident.rawAlerts[0].stackTrace && (
                        <pre className="text-slate-400 text-[10px] overflow-x-auto whitespace-pre leading-relaxed pt-1">
                          {incident.rawAlerts[0].stackTrace}
                        </pre>
                      )}
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                        <span>Hypothesis: {incident.rootCauseHypothesis}</span>
                        <button
                          onClick={() => onSelectIncident(incident)}
                          className="text-blue-400 hover:underline font-sans"
                        >
                          View Full Runbook →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
