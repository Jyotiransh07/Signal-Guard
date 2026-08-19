import React from 'react';
import { AppSettings } from '../types';
import { X, Sliders, MessageSquare, Bell, RotateCcw, ShieldCheck, Clock, Sparkles } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
  onResetAllData: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onClose,
  onResetAllData,
}) => {
  const currentChannels = settings?.channels || {
    slack: true,
    pagerduty: true,
    discord: true,
    webhook: true,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              SignalGuard Gateway Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Cooldown Window Slider */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Suppression Cooldown Window (TTL):
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{settings?.cooldownWindowSec || 60} seconds</span>
            </div>
            <input
              type="range"
              min="15"
              max="300"
              step="5"
              value={settings?.cooldownWindowSec || 60}
              onChange={e => onUpdateSettings({ cooldownWindowSec: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Time window after an incident fires during which identical repeat traces are grouped silently without firing redundant alerts.
            </p>
          </div>

          {/* Grouping Similarity Threshold */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                Signature Grouping Threshold:
              </span>
              <span className="text-violet-600 dark:text-violet-400 font-bold text-sm">{((settings?.similarityThreshold || 0.85) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={settings?.similarityThreshold || 0.85}
              onChange={e => onUpdateSettings({ similarityThreshold: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clustering tolerance for matching dynamic parameters (e.g. user IDs, memory addresses) into the same root incident.
            </p>
          </div>

          {/* Connected Routing Channels */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Notification Endpoints:</span>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(currentChannels.slack)}
                  onChange={e => onUpdateSettings({
                    channels: { ...currentChannels, slack: e.target.checked }
                  })}
                  className="rounded accent-blue-600 cursor-pointer"
                />
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-700 dark:text-slate-300 text-xs">Slack #eng-ops</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(currentChannels.pagerduty)}
                  onChange={e => onUpdateSettings({
                    channels: { ...currentChannels, pagerduty: e.target.checked }
                  })}
                  className="rounded accent-blue-600 cursor-pointer"
                />
                <Bell className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300 text-xs">PagerDuty P1</span>
              </label>
            </div>
          </div>

          {/* Reset Buffer */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => {
                if (window.confirm('Reset all demo buffer data and recreate clean cluster baseline?')) {
                  onResetAllData();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Buffer & Incidents</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              Save & Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
