export type Severity = 'critical' | 'warning' | 'info';

export type IncidentStatus = 'active' | 'cooldown_suppressed' | 'acknowledged' | 'resolved';

export type ServiceType = 
  | 'api-gateway'
  | 'auth-service'
  | 'payment-processor'
  | 'database-cluster'
  | 'cache-redis'
  | 'worker-queue'
  | 'search-indexer'
  | 'storage-s3';

export interface AppInstance {
  id: string;
  name: string;
  service: ServiceType;
  region: string;
  status: 'healthy' | 'warning' | 'critical';
  cpuUsage: number;
  memoryUsage: number;
  activeIncidentsCount: number;
  x3d?: number;
  y3d?: number;
  z3d?: number;
}

export interface RawAlert {
  id: string;
  timestamp: number;
  instanceId: string;
  instanceName: string;
  service: ServiceType;
  severity: Severity;
  errorType: string;
  message: string;
  fingerprint: string;
  stackTrace?: string;
  httpStatus?: number;
  latencyMs?: number;
  metadata?: Record<string, string | number>;
  suppressedByCooldown: boolean;
  incidentId?: string;
}

export interface IncidentThread {
  id: string;
  fingerprint: string;
  title: string;
  service: ServiceType;
  severity: Severity;
  status: IncidentStatus;
  firstSeen: number;
  lastSeen: number;
  alertCount: number;
  suppressedCount: number;
  dispatchedCount: number;
  affectedInstances: string[]; // instanceIds
  rawAlerts: RawAlert[];
  cooldownExpiresAt: number;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedAt?: number;
  rootCauseHypothesis: string;
  recommendedAction: string;
  escalationChannel?: 'pagerduty' | 'slack' | 'discord' | null;
}

export interface CooldownCell {
  service: ServiceType;
  errorType: string;
  fingerprint: string;
  lastFiredAt: number;
  cooldownExpiresAt: number;
  state: 'firing' | 'cooldown_suppressing' | 'ready';
  suppressedCount: number;
  affectedInstanceCount: number;
}

export interface MetricsHistoryPoint {
  timestamp: number;
  rawCount: number;
  suppressedCount: number;
  dispatchedCount: number;
  noiseReductionRatio: number;
}

export interface AppSettings {
  cooldownWindowSec: number; // default 60
  similarityThreshold: number; // 0.6 to 0.95
  ingestionSpeed: 'paused' | 'slow' | 'normal' | 'fast' | 'chaos';
  enableAudio: boolean;
  autoResolveAfterSec: number; // 0 = disabled, or e.g. 180s
  channels: {
    slack: boolean;
    pagerduty: boolean;
    discord: boolean;
    webhook: boolean;
  };
}

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'critical' | 'pagerduty' | 'slack' | 'discord';
  timestamp: number;
}
