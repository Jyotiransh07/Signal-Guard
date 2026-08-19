/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Github } from 'lucide-react';
import { 
  AppInstance, 
  RawAlert, 
  IncidentThread, 
  CooldownCell, 
  MetricsHistoryPoint, 
  AppSettings, 
  ToastMessage, 
  ServiceType, 
  Severity 
} from './types';
import { INITIAL_INSTANCES, ERROR_TEMPLATES, SERVICE_METADATA } from './utils/mockData';
import { generateFingerprint, computeSimilarity, getRootCauseAndAction } from './utils/fingerprint';
import { soundEngine } from './utils/audio';

import { Header, DashboardTab } from './components/Header';
import { WelcomeHero } from './components/WelcomeHero';
import { IncidentList } from './components/IncidentList';
import { RoutingPipeline } from './components/RoutingPipeline';
import { CooldownMatrix } from './components/CooldownMatrix';
import { Topology3DCanvas } from './components/Topology3DCanvas';
import { NoiseReductionPanel } from './components/NoiseReductionPanel';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { CustomAlertModal } from './components/CustomAlertModal';
import { SettingsModal } from './components/SettingsModal';
import { RawAlertStreamDrawer } from './components/RawAlertStreamDrawer';
import { PostMortemModal } from './components/PostMortemModal';
import { ToastContainer } from './components/ToastContainer';
import { syncIncident, syncRawAlert, testPushSampleToSupabase } from './lib/supabaseSync';

const DEFAULT_APP_SETTINGS: AppSettings = {
  cooldownWindowSec: 60,
  similarityThreshold: 0.85,
  ingestionSpeed: 'normal',
  enableAudio: true,
  autoResolveAfterSec: 0,
  channels: {
    slack: true,
    pagerduty: true,
    discord: true,
    webhook: true,
  },
};

export default function App() {
  // Theme state: default to 'light'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('signalguard_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Navigation tab state: default to welcoming 'home' page
  const [currentTab, setCurrentTab] = useState<DashboardTab>('home');

  // Core App State
  const [instances, setInstances] = useState<AppInstance[]>(INITIAL_INSTANCES);
  const [rawAlerts, setRawAlerts] = useState<RawAlert[]>([]);
  const [incidents, setIncidents] = useState<IncidentThread[]>([]);
  const [cooldownCells, setCooldownCells] = useState<CooldownCell[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistoryPoint[]>([]);

  // Selection & UI controls
  const [selectedIncident, setSelectedIncident] = useState<IncidentThread | null>(null);
  const [postMortemIncident, setPostMortemIncident] = useState<IncidentThread | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [isCustomAlertModalOpen, setIsCustomAlertModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRawTerminalOpen, setIsRawTerminalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Configurable Application Settings with safe defaults
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('signalguard_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_APP_SETTINGS,
          ...parsed,
          channels: {
            ...DEFAULT_APP_SETTINGS.channels,
            ...(parsed.channels || {}),
          },
        };
      }
    } catch (e) {
      console.warn('Failed to parse saved settings', e);
    }
    return DEFAULT_APP_SETTINGS;
  });

  // Save theme to localStorage and HTML class
  useEffect(() => {
    try {
      localStorage.setItem('signalguard_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Failed to save theme', e);
    }
  }, [theme]);

  // Toggle Theme helper
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync sound engine enabled state with user settings
  useEffect(() => {
    soundEngine.setEnabled(settings.enableAudio);
    try {
      localStorage.setItem('signalguard_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings', e);
    }
  }, [settings]);

  // Toast Dispatcher Helper
  const showToast = useCallback((title: string, description: string, type: ToastMessage['type'] = 'info') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title,
      description,
      type,
      timestamp: Date.now(),
    };
    setToasts(prev => [newToast, ...prev.slice(0, 4)]);
  }, []);

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Initialize Cooldown Cells from Error Templates on load
  useEffect(() => {
    const initialCells: CooldownCell[] = ERROR_TEMPLATES.map(tmpl => ({
      service: tmpl.service,
      errorType: tmpl.errorType,
      fingerprint: generateFingerprint(tmpl.service, tmpl.errorType, tmpl.title),
      lastFiredAt: 0,
      cooldownExpiresAt: 0,
      state: 'ready',
      suppressedCount: 0,
      affectedInstanceCount: 0,
    }));
    setCooldownCells(initialCells);
  }, []);

  // Pre-seed realistic initial incidents on load and sync to Supabase
  useEffect(() => {
    const now = Date.now();
    const seedTmpl = ERROR_TEMPLATES[0]; // Connection pool
    const fp = generateFingerprint(seedTmpl.service, seedTmpl.errorType, seedTmpl.title);
    const { hypothesis, action } = getRootCauseAndAction(seedTmpl.errorType, seedTmpl.service);

    const initialRaw: RawAlert[] = [
      {
        id: `raw-seed-1`,
        timestamp: now - 35000,
        instanceId: 'inst-db-01',
        instanceName: 'postgres-primary-cluster',
        service: 'database-cluster',
        severity: 'critical',
        errorType: seedTmpl.errorType,
        message: seedTmpl.messageGenerators[0]('postgres-primary-cluster'),
        fingerprint: fp,
        stackTrace: seedTmpl.stackTraces[0],
        httpStatus: 503,
        suppressedByCooldown: false,
      },
      {
        id: `raw-seed-2`,
        timestamp: now - 22000,
        instanceId: 'inst-gw-01',
        instanceName: 'api-gateway-us-east-1',
        service: 'database-cluster',
        severity: 'critical',
        errorType: seedTmpl.errorType,
        message: seedTmpl.messageGenerators[1]('api-gateway-us-east-1'),
        fingerprint: fp,
        stackTrace: seedTmpl.stackTraces[0],
        httpStatus: 503,
        suppressedByCooldown: true,
      },
      {
        id: `raw-seed-3`,
        timestamp: now - 8000,
        instanceId: 'inst-pay-01',
        instanceName: 'payment-processor-01',
        service: 'database-cluster',
        severity: 'critical',
        errorType: seedTmpl.errorType,
        message: seedTmpl.messageGenerators[2]('payment-processor-01'),
        fingerprint: fp,
        stackTrace: seedTmpl.stackTraces[0],
        httpStatus: 503,
        suppressedByCooldown: true,
      }
    ];

    const initialThread: IncidentThread = {
      id: 'inc-seed-001',
      fingerprint: fp,
      title: seedTmpl.title,
      service: seedTmpl.service,
      severity: seedTmpl.severity,
      status: 'cooldown_suppressed',
      firstSeen: now - 35000,
      lastSeen: now - 8000,
      alertCount: 42,
      suppressedCount: 41,
      dispatchedCount: 1,
      affectedInstances: ['inst-db-01', 'inst-gw-01', 'inst-pay-01'],
      rawAlerts: initialRaw,
      cooldownExpiresAt: now + 25000,
      rootCauseHypothesis: hypothesis,
      recommendedAction: action,
    };

    setIncidents([initialThread]);
    setRawAlerts(initialRaw);

    // Initial metrics point
    setMetricsHistory([
      { timestamp: now - 30000, rawCount: 12, suppressedCount: 11, dispatchedCount: 1, noiseReductionRatio: 91.6 },
      { timestamp: now - 20000, rawCount: 24, suppressedCount: 23, dispatchedCount: 1, noiseReductionRatio: 95.8 },
      { timestamp: now - 10000, rawCount: 42, suppressedCount: 41, dispatchedCount: 1, noiseReductionRatio: 97.6 },
    ]);
  }, []);

  // The Core Ingestion & Grouping Processor
  const processIncomingAlert = useCallback((
    service: ServiceType,
    severity: Severity,
    errorType: string,
    message: string,
    instanceId: string,
    stackTrace?: string,
    httpStatus?: number
  ) => {
    const now = Date.now();
    const inst = instances.find(i => i.id === instanceId) || instances[0];
    const fp = generateFingerprint(service, errorType, message);

    // Step 1: Check existing incidents for fingerprint match OR similarity threshold
    setIncidents(prevIncidents => {
      const existingIdx = prevIncidents.findIndex(inc => {
        if (inc.status === 'resolved') return false;
        if (inc.fingerprint === fp) return true;
        if (inc.service === service && inc.severity === severity) {
          const sim = computeSimilarity(inc.title, message);
          if (sim >= settings.similarityThreshold) return true;
        }
        return false;
      });

      const isExisting = existingIdx !== -1;
      const targetIncident = isExisting ? prevIncidents[existingIdx] : null;
      const isInCooldown = targetIncident && targetIncident.cooldownExpiresAt > now;

      // Determine suppression state
      const suppressed = !!(isExisting && isInCooldown);

      const rawAlertObj: RawAlert = {
        id: `raw-${now}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: now,
        instanceId: inst.id,
        instanceName: inst.name,
        service,
        severity,
        errorType,
        message,
        fingerprint: fp,
        stackTrace: stackTrace || `Error: ${errorType} in ${service}\n    at /app/src/handlers/process.ts:42:15`,
        httpStatus,
        suppressedByCooldown: suppressed,
        incidentId: targetIncident?.id
      };

      // Sound and Toast effects
      if (suppressed) {
        soundEngine.playSuppressedBlip();
      } else {
        soundEngine.playEscalationChime();
        if (severity === 'critical') {
          showToast(
            `🚨 [CRITICAL] Alert Dispatched to Channels`,
            `${errorType} on ${inst.name} created incident #${fp.slice(0, 8)}`,
            'pagerduty'
          );
        }
      }

      // Add to raw alerts list (keep last 150)
      setRawAlerts(raws => [rawAlertObj, ...raws.slice(0, 149)]);

      // Update Cooldown Matrix cell state
      setCooldownCells(cells => {
        const cellIdx = cells.findIndex(c => c.fingerprint === fp || (c.service === service && c.errorType === errorType));
        const cooldownExpiry = now + (settings.cooldownWindowSec * 1000);

        if (cellIdx !== -1) {
          const updated = [...cells];
          updated[cellIdx] = {
            ...updated[cellIdx],
            lastFiredAt: now,
            cooldownExpiresAt: suppressed ? updated[cellIdx].cooldownExpiresAt : cooldownExpiry,
            state: suppressed ? 'cooldown_suppressing' : 'firing',
            suppressedCount: suppressed ? updated[cellIdx].suppressedCount + 1 : updated[cellIdx].suppressedCount,
          };
          return updated;
        } else {
          return [
            ...cells,
            {
              service,
              errorType,
              fingerprint: fp,
              lastFiredAt: now,
              cooldownExpiresAt: cooldownExpiry,
              state: 'firing',
              suppressedCount: 0,
              affectedInstanceCount: 1,
            }
          ];
        }
      });

      // Update Incidents list
      if (isExisting && targetIncident) {
        const updatedInstances = Array.from(new Set([...targetIncident.affectedInstances, inst.id]));
        const updatedIncident: IncidentThread = {
          ...targetIncident,
          lastSeen: now,
          alertCount: targetIncident.alertCount + 1,
          suppressedCount: suppressed ? targetIncident.suppressedCount + 1 : targetIncident.suppressedCount,
          dispatchedCount: !suppressed ? targetIncident.dispatchedCount + 1 : targetIncident.dispatchedCount,
          affectedInstances: updatedInstances,
          rawAlerts: [rawAlertObj, ...targetIncident.rawAlerts.slice(0, 49)],
          status: suppressed ? 'cooldown_suppressed' : targetIncident.status === 'acknowledged' ? 'acknowledged' : 'active',
          cooldownExpiresAt: suppressed ? targetIncident.cooldownExpiresAt : (now + settings.cooldownWindowSec * 1000)
        };

        // Async sync to Supabase
        syncIncident(updatedIncident);
        syncRawAlert({ ...rawAlertObj, incidentId: updatedIncident.id });

        const next = [...prevIncidents];
        next[existingIdx] = updatedIncident;
        return next;
      } else {
        // Create new Incident Thread
        const { hypothesis, action } = getRootCauseAndAction(errorType, service);
        const matchingTmpl = ERROR_TEMPLATES.find(t => t.errorType === errorType);
        const newThread: IncidentThread = {
          id: `inc-${now.toString().slice(-6)}`,
          fingerprint: fp,
          title: matchingTmpl?.title || `${service}: ${errorType}`,
          service,
          severity,
          status: 'active',
          firstSeen: now,
          lastSeen: now,
          alertCount: 1,
          suppressedCount: 0,
          dispatchedCount: 1,
          affectedInstances: [inst.id],
          rawAlerts: [rawAlertObj],
          cooldownExpiresAt: now + (settings.cooldownWindowSec * 1000),
          rootCauseHypothesis: hypothesis,
          recommendedAction: action,
        };

        // Async sync to Supabase
        syncIncident(newThread);
        syncRawAlert({ ...rawAlertObj, incidentId: newThread.id });

        return [newThread, ...prevIncidents.slice(0, 29)];
      }
    });

    // Update instance load / health
    setInstances(prev => prev.map(item => {
      if (item.id === inst.id) {
        return {
          ...item,
          status: severity === 'critical' ? 'critical' : item.status === 'critical' ? 'critical' : 'warning',
          cpuUsage: Math.min(98, item.cpuUsage + Math.floor(Math.random() * 8 + 4)),
          memoryUsage: Math.min(96, item.memoryUsage + Math.floor(Math.random() * 5 + 2)),
          activeIncidentsCount: item.activeIncidentsCount + 1
        };
      }
      return item;
    }));

  }, [instances, settings, showToast]);

  // Automated Ingestion Loop based on ingestionSpeed
  useEffect(() => {
    if (settings.ingestionSpeed === 'paused') return;

    const intervalMap = {
      slow: 8000,
      normal: 4500,
      fast: 1800,
    };

    const intervalTime = intervalMap[settings.ingestionSpeed as 'slow' | 'normal' | 'fast'] || 4500;

    const timer = setInterval(() => {
      // Pick random error template
      const tmpl = ERROR_TEMPLATES[Math.floor(Math.random() * ERROR_TEMPLATES.length)];
      // Pick random instance matching service or fallback
      const matchingInsts = instances.filter(i => i.service === tmpl.service);
      const inst = matchingInsts.length > 0
        ? matchingInsts[Math.floor(Math.random() * matchingInsts.length)]
        : instances[Math.floor(Math.random() * instances.length)];

      const msg = tmpl.messageGenerators[Math.floor(Math.random() * tmpl.messageGenerators.length)](inst.name);
      const stack = tmpl.stackTraces[Math.floor(Math.random() * tmpl.stackTraces.length)];

      processIncomingAlert(
        tmpl.service,
        tmpl.severity,
        tmpl.errorType,
        msg,
        inst.id,
        stack,
        tmpl.httpStatus
      );
    }, intervalTime);

    return () => clearInterval(timer);
  }, [settings.ingestionSpeed, instances, processIncomingAlert]);

  // Record Metrics History every 5 seconds
  useEffect(() => {
    const metricsTimer = setInterval(() => {
      const totalRaw = incidents.reduce((sum, inc) => sum + inc.alertCount, 0);
      const totalSuppressed = incidents.reduce((sum, inc) => sum + (inc.suppressedCount || 0), 0);
      const totalDispatched = incidents.reduce((sum, inc) => sum + (inc.dispatchedCount || 1), 0);
      const ratio = totalRaw > 0 ? (totalSuppressed / totalRaw) * 100 : 0;

      setMetricsHistory(history => {
        const nextPoint: MetricsHistoryPoint = {
          timestamp: Date.now(),
          rawCount: totalRaw,
          suppressedCount: totalSuppressed,
          dispatchedCount: totalDispatched,
          noiseReductionRatio: parseFloat(ratio.toFixed(1)),
        };
        return [...history.slice(-29), nextPoint];
      });
    }, 5000);

    return () => clearInterval(metricsTimer);
  }, [incidents]);

  // Inject Simulated Burst (Alert Storm)
  const handleInjectBurst = (count: number = 10) => {
    const tmpl = ERROR_TEMPLATES[0]; // database pooler
    const inst = instances[0];
    soundEngine.playEscalationChime();

    showToast('Alert Storm Simulation Injected', `Triggered ${count} rapid duplicate error events`, 'warning');

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const msg = tmpl.messageGenerators[i % tmpl.messageGenerators.length](inst.name);
        processIncomingAlert(tmpl.service, tmpl.severity, tmpl.errorType, msg, inst.id, tmpl.stackTraces[0], tmpl.httpStatus);
      }, i * 180);
    }
  };

  // Inject Custom Craft Alert
  const handleInjectCustom = (alertData: {
    service: ServiceType;
    severity: Severity;
    errorType: string;
    message: string;
    instanceId: string;
    count: number;
  }) => {
    showToast('Custom Alert Created', `Injected ${alertData.count}x "${alertData.errorType}"`, 'info');
    for (let i = 0; i < alertData.count; i++) {
      setTimeout(() => {
        processIncomingAlert(
          alertData.service,
          alertData.severity,
          alertData.errorType,
          alertData.message,
          alertData.instanceId
        );
      }, i * 200);
    }
  };

  // Inject Single Alert from Matrix
  const handleInjectSingleAlert = (cell: CooldownCell) => {
    const tmpl = ERROR_TEMPLATES.find(t => t.errorType === cell.errorType) || ERROR_TEMPLATES[0];
    const inst = instances[Math.floor(Math.random() * instances.length)];
    const msg = tmpl.messageGenerators[0](inst.name);

    processIncomingAlert(cell.service, tmpl.severity, cell.errorType, msg, inst.id, tmpl.stackTraces[0], tmpl.httpStatus);
    showToast('Single Alert Injected', `Triggered ${cell.errorType} on ${inst.name}`, 'info');
  };

  // Reset Cooldown for a specific fingerprint
  const handleResetCooldown = (fingerprint: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.fingerprint === fingerprint) {
        return { ...inc, cooldownExpiresAt: Date.now() - 1000, status: 'active' };
      }
      return inc;
    }));

    setCooldownCells(prev => prev.map(c => {
      if (c.fingerprint === fingerprint) {
        return { ...c, cooldownExpiresAt: Date.now() - 1000, state: 'ready' };
      }
      return c;
    }));

    showToast('Cooldown Reset', `Suppression window cleared for ${fingerprint}`, 'info');
  };

  // Snooze Cooldown (+15m)
  const handleSnoozeCooldown = (fingerprint: string) => {
    const snoozeUntil = Date.now() + 15 * 60 * 1000;
    setIncidents(prev => prev.map(inc => {
      if (inc.fingerprint === fingerprint) {
        return { ...inc, cooldownExpiresAt: snoozeUntil, status: 'cooldown_suppressed' };
      }
      return inc;
    }));
    showToast('Cooldown Snoozed', `Suppression window extended by 15 minutes`, 'info');
  };

  // Acknowledge Incident
  const handleAcknowledge = (incidentId: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return { ...inc, status: 'acknowledged', acknowledgedAt: Date.now(), acknowledgedBy: 'On-Call Engineer' };
      }
      return inc;
    }));
    showToast('Incident Acknowledged', `Incident ${incidentId} marked in progress`, 'info');
  };

  // Resolve Incident (with celebration confetti)
  const handleResolve = (incidentId: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incidentId) {
        return { ...inc, status: 'resolved', resolvedAt: Date.now() };
      }
      return inc;
    }));

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    soundEngine.playResolutionChord();

    // Relax instance health
    setInstances(prev => prev.map(inst => ({
      ...inst,
      status: 'healthy',
      cpuUsage: Math.max(20, inst.cpuUsage - 25),
      memoryUsage: Math.max(35, inst.memoryUsage - 15)
    })));

    showToast('Incident Resolved', `Incident ${incidentId} resolved successfully`, 'success');
  };

  // Escalate Incident (e.g. to Slack / PagerDuty)
  const handleEscalate = (incidentId: string, channel: 'slack' | 'pagerduty') => {
    const inc = incidents.find(i => i.id === incidentId);
    if (!inc) return;

    soundEngine.playEscalationChime();
    showToast(
      channel === 'slack' ? 'Slack Message Dispatched' : 'PagerDuty Incident Triggered',
      `Delivered alert summary to #${inc.service}-oncall`,
      channel
    );
  };

  // Global calculations
  const totalRawAlerts = useMemo(() => {
    return incidents.reduce((sum, inc) => sum + inc.alertCount, 0);
  }, [incidents]);

  const totalSuppressed = useMemo(() => {
    return incidents.reduce((sum, inc) => sum + (inc.suppressedCount || 0), 0);
  }, [incidents]);

  const totalDispatched = useMemo(() => {
    return incidents.reduce((sum, inc) => sum + (inc.dispatchedCount || 1), 0);
  }, [incidents]);

  const activeIncidentsCount = useMemo(() => {
    return incidents.filter(i => i.status === 'active' || i.status === 'cooldown_suppressed').length;
  }, [incidents]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Clean Top Navigation Bar with Light/Dark Switch & Tab navigation */}
      <Header
        settings={settings}
        onUpdateSettings={newS => setSettings(s => ({ ...s, ...newS }))}
        theme={theme}
        onToggleTheme={toggleTheme}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onInjectBurst={handleInjectBurst}
        onOpenCustomAlertModal={() => setIsCustomAlertModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenRawTerminal={() => setIsRawTerminalOpen(true)}
        activeIncidentsCount={activeIncidentsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Tab 0: Welcoming Beginner-Friendly Home Page (Default Landing View) */}
        {currentTab === 'home' && (
          <WelcomeHero
            totalRaw={totalRawAlerts}
            totalSuppressed={totalSuppressed}
            activeIncidentsCount={activeIncidentsCount}
            recentAlerts={rawAlerts}
            incidents={incidents}
            settings={settings}
            onUpdateSettings={newS => setSettings(s => ({ ...s, ...newS }))}
            onInjectBurst={handleInjectBurst}
            onNavigateTab={setCurrentTab}
          />
        )}

        {/* Tab 1: Active Incidents Queue */}
        {currentTab === 'incidents' && (
          <div className="space-y-6">
            <IncidentList
              incidents={incidents}
              selectedInstanceId={selectedInstanceId}
              onClearInstanceFilter={() => setSelectedInstanceId(null)}
              onSelectIncident={setSelectedIncident}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              onOpenPostMortem={setPostMortemIncident}
            />
          </div>
        )}

        {/* Tab 2: Interactive 3D Server Topology Map */}
        {currentTab === 'topology' && (
          <div className="space-y-6">
            <Topology3DCanvas
              instances={instances}
              incidents={incidents}
              selectedInstanceId={selectedInstanceId}
              onSelectInstance={setSelectedInstanceId}
            />
          </div>
        )}

        {/* Tab 3: Suppression Cooldown Matrix */}
        {currentTab === 'matrix' && (
          <div className="space-y-6">
            <CooldownMatrix
              cooldownCells={cooldownCells}
              cooldownWindowSec={settings.cooldownWindowSec}
              onInjectSingleAlert={handleInjectSingleAlert}
              onResetCooldown={handleResetCooldown}
            />
          </div>
        )}

        {/* Tab 4: 4-Stage Ingestion Pipeline */}
        {currentTab === 'stream' && (
          <div className="space-y-6">
            <RoutingPipeline
              alerts={rawAlerts}
              incidents={incidents}
              settings={settings}
              onUpdateSettings={newS => setSettings(s => ({ ...s, ...newS }))}
              onInjectBurst={handleInjectBurst}
            />
          </div>
        )}

        {/* Tab 5: Noise Reduction Analytics */}
        {currentTab === 'analytics' && (
          <div className="space-y-6">
            <NoiseReductionPanel
              metricsHistory={metricsHistory}
              totalRaw={totalRawAlerts}
              totalSuppressed={totalSuppressed}
              totalDispatched={totalDispatched}
              alerts={rawAlerts}
            />
          </div>
        )}

      </main>

      {/* Clean, simple footer with GitHub repository link */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-4 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>SignalGuard — Stop Alert Fatigue & Notification Spam</span>
          <a
            href="https://github.com/Jyotiransh07/Signal-Guard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            title="View Source on GitHub"
          >
            <Github className="w-4 h-4" />
            <span>GitHub Repository</span>
          </a>
        </div>
      </footer>

      {/* Modals & Slide-overs */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          instances={instances}
          onClose={() => setSelectedIncident(null)}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
          onEscalate={handleEscalate}
          onSnoozeCooldown={handleSnoozeCooldown}
        />
      )}

      {isCustomAlertModalOpen && (
        <CustomAlertModal
          instances={instances}
          onClose={() => setIsCustomAlertModalOpen(false)}
          onInjectCustom={handleInjectCustom}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={newS => {
            setSettings(s => ({ ...s, ...newS }));
            showToast('Settings Updated', 'Telemetry filter rules updated', 'info');
          }}
          onClose={() => setIsSettingsModalOpen(false)}
          onResetAllData={() => {
            setIncidents([]);
            setRawAlerts([]);
            showToast('Data Reset', 'Cleared local incidents buffer', 'info');
          }}
        />
      )}

      {isRawTerminalOpen && (
        <RawAlertStreamDrawer
          alerts={rawAlerts}
          onClose={() => setIsRawTerminalOpen(false)}
          onClear={() => setRawAlerts([])}
        />
      )}

      {postMortemIncident && (
        <PostMortemModal
          incident={postMortemIncident}
          onClose={() => setPostMortemIncident(null)}
        />
      )}

      {/* Global Real-Time Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
