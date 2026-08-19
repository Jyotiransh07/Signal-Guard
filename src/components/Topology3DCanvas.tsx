import React, { useState, useMemo } from 'react';
import { AppInstance, RawAlert, ServiceType } from '../types';
import { 
  Server, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Radio, 
  Filter, 
  XCircle, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { SERVICE_METADATA } from '../utils/mockData';

interface Props {
  instances: AppInstance[];
  recentAlerts: RawAlert[];
  selectedInstanceId: string | null;
  onSelectInstance: (id: string | null) => void;
}

export const Topology3DCanvas: React.FC<Props> = ({
  instances,
  recentAlerts,
  selectedInstanceId,
  onSelectInstance,
}) => {
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Group instances by service category
  const serviceGroups = useMemo(() => {
    const map = new Map<ServiceType, AppInstance[]>();
    instances.forEach(inst => {
      if (!map.has(inst.service)) {
        map.set(inst.service, []);
      }
      map.get(inst.service)!.push(inst);
    });
    return Array.from(map.entries());
  }, [instances]);

  const filteredInstances = instances.filter(inst => {
    if (filterService !== 'all' && inst.service !== filterService) return false;
    if (filterStatus !== 'all' && inst.status !== filterStatus) return false;
    return true;
  });

  const getServiceIcon = (service: ServiceType) => {
    switch (service) {
      case 'database-cluster':
        return <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'api-gateway':
        return <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'auth-service':
        return <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
      case 'worker-queue':
        return <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Server className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getStatusChip = (status: AppInstance['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Healthy
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Degraded
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            Outage
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cluster Service Map & Node Topology
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {instances.length} Active Nodes
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any infrastructure node to isolate and inspect its telemetry events.
          </p>
        </div>

        {/* Action / Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedInstanceId && (
            <button
              onClick={() => onSelectInstance(null)}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Clear Node Isolation</span>
            </button>
          )}

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="py-1 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Health States</option>
            <option value="critical">Outage Only</option>
            <option value="warning">Degraded Only</option>
            <option value="healthy">Healthy Only</option>
          </select>
        </div>
      </div>

      {/* Grid of Service Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredInstances.map(inst => {
          const isSelected = selectedInstanceId === inst.id;
          const hasActiveAlert = inst.status !== 'healthy';

          return (
            <div
              key={inst.id}
              onClick={() => onSelectInstance(isSelected ? null : inst.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500 shadow-md'
                  : inst.status === 'critical'
                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10 hover:border-rose-400'
                  : inst.status === 'warning'
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-400'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {getServiceIcon(inst.service)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]" title={inst.name}>
                      {inst.name}
                    </h4>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {inst.region} • {inst.service}
                    </div>
                  </div>
                </div>

                {getStatusChip(inst.status)}
              </div>

              {/* Resource Metrics Bar */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>CPU Utilization</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{inst.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        inst.cpuUsage > 85
                          ? 'bg-rose-500'
                          : inst.cpuUsage > 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${inst.cpuUsage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span>Memory Allocation</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{inst.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        inst.memoryUsage > 85
                          ? 'bg-rose-500'
                          : inst.memoryUsage > 65
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${inst.memoryUsage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  {inst.activeIncidentsCount > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                      <Flame className="w-3 h-3" /> {inst.activeIncidentsCount} Active Incident{inst.activeIncidentsCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Baseline Normal
                    </span>
                  )}
                </span>

                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  {isSelected ? 'Isolated ✓' : 'Click to filter →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
