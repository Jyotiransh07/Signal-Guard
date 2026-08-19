import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sliders, 
  Flame, 
  PlusCircle, 
  Radio,
  Sun,
  Moon,
  ShieldCheck, 
  Activity, 
  Layers, 
  Network, 
  SlidersHorizontal, 
  BarChart3, 
  Terminal,
  Home,
  Pause,
  Play
} from 'lucide-react';
import { AppSettings } from '../types';

export type DashboardTab = 'home' | 'incidents' | 'topology' | 'matrix' | 'stream' | 'analytics';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onInjectBurst: (count: number) => void;
  onOpenCustomAlertModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenRawTerminal: () => void;
  activeIncidentsCount: number;
  currentTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onInjectBurst,
  onOpenCustomAlertModal,
  onOpenSettingsModal,
  onOpenRawTerminal,
  activeIncidentsCount,
  currentTab,
  onTabChange,
  theme,
  onToggleTheme,
}) => {
  const isPaused = settings.ingestionSpeed === 'paused';

  const togglePause = () => {
    onUpdateSettings({
      ingestionSpeed: isPaused ? 'normal' : 'paused'
    });
  };

  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors shadow-sm">
      {/* Top tier: Brand, Status, Action Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Brand Wordmark & Tagline */}
        <button
          onClick={() => onTabChange('home')}
          className="flex items-center gap-3 shrink-0 text-left cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-sm font-bold text-sm group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 transition-colors">
                SignalGuard
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                isPaused 
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                {isPaused ? 'Stream Paused' : 'Live Ingestion'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Smart Alert Reducer & Telemetry Noise Filter
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Pause / Play Live Stream Button */}
          <button
            onClick={togglePause}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isPaused
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
            title={isPaused ? 'Click to resume automated alert stream' : 'Click to pause automated alert stream'}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Alerts</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-current" />
                <span className="hidden sm:inline">Pause Alerts</span>
              </>
            )}
          </button>

          {/* Quick Storm Simulation Button */}
          <button
            onClick={() => onInjectBurst(10)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Simulate 10 duplicate errors to test how SignalGuard stops notification spam"
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulate Alert Storm</span>
            <span className="sm:hidden">Storm</span>
          </button>

          {/* Create Custom Alert */}
          <button
            onClick={onOpenCustomAlertModal}
            className="hidden md:flex px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Craft Alert</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={() => onUpdateSettings({ enableAudio: !settings.enableAudio })}
            title={settings.enableAudio ? 'Sound effects enabled (click to mute)' : 'Sound effects muted (click to enable)'}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              settings.enableAudio
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {settings.enableAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title={theme === 'dark' ? 'Click to switch to Light Theme' : 'Click to switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* Raw Terminal Drawer */}
          <button
            onClick={onOpenRawTerminal}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Open Live Raw Alert Stream Buffer"
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettingsModal}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            title="Gateway Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
        <nav className="flex items-center gap-1 py-1">
          {/* Home Tab */}
          <button
            onClick={() => onTabChange('home')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'home'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home & Overview</span>
          </button>

          {/* Incidents Tab */}
          <button
            onClick={() => onTabChange('incidents')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'incidents'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Active Incidents</span>
            {activeIncidentsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                {activeIncidentsCount}
              </span>
            )}
          </button>

          {/* Server Health Topology */}
          <button
            onClick={() => onTabChange('topology')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'topology'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Server Health Map</span>
          </button>

          {/* Suppression Cooldown Matrix */}
          <button
            onClick={() => onTabChange('matrix')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'matrix'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Suppression Rules</span>
          </button>

          {/* Pipeline Stream */}
          <button
            onClick={() => onTabChange('stream')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'stream'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Alert Pipeline</span>
          </button>

          {/* Noise Reduction Analytics */}
          <button
            onClick={() => onTabChange('analytics')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'analytics'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Saved Time & Analytics</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
