import React from 'react';
import { MetricsHistoryPoint, RawAlert, ServiceType } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Users, 
  CheckCircle2, 
  BellOff, 
  Layers 
} from 'lucide-react';
import { SERVICE_METADATA } from '../utils/mockData';

interface Props {
  metricsHistory: MetricsHistoryPoint[];
  totalRaw: number;
  totalSuppressed: number;
  totalDispatched: number;
  alerts: RawAlert[];
}

export const NoiseReductionPanel: React.FC<Props> = ({
  metricsHistory,
  totalRaw,
  totalSuppressed,
  totalDispatched,
  alerts,
}) => {
  const reductionPercentage = totalRaw > 0 ? ((totalSuppressed / totalRaw) * 100).toFixed(1) : '96.8';
  
  // Calculate noise by service
  const serviceCounts: Record<string, number> = {};
  alerts.forEach(a => {
    serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1;
  });

  const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
  const estimatedHoursSaved = ((totalSuppressed * 3.5) / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Overall Noise Reduction</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {reductionPercentage}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Duplicate storm alerts filtered out
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Alerts Squelched</span>
            <BellOff className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalSuppressed}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            From waking on-call engineers
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Clean Dispatches</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalDispatched}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Actionable incident notifications
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Engineering Time Saved</span>
            <Clock className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            ~{estimatedHoursSaved} hrs
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Context switching avoided
          </p>
        </div>
      </div>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Noisy Infrastructure Components */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              Top Alert Volume by Service
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">Past 24 Hours</span>
          </div>

          <div className="space-y-3">
            {sortedServices.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No alert telemetry recorded yet.</div>
            ) : (
              sortedServices.slice(0, 5).map(([service, count]) => {
                const percent = totalRaw > 0 ? Math.round((count / totalRaw) * 100) : 0;
                return (
                  <div key={service} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{service}</span>
                      <span className="text-slate-500 dark:text-slate-400">{count} alerts ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Noise Suppression Timeline Breakdown */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Telemetry Filtering Efficiency
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">Real-time sampling</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">Deduplication Ratio</div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Every 100 incoming telemetry errors are condensed into ~3 actionable root-cause incident threads.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">Cascade Protection</div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Downstream failures (e.g. database disconnect triggering 50 microservices) are clustered into the primary database incident.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">On-Call Health Score</div>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                99.4% Alert Fatigue Squelch Rating
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
