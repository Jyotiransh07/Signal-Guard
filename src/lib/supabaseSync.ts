import { supabase } from './supabase';
import { IncidentThread, RawAlert } from '../types';

export interface SyncStatus {
  connected: boolean;
  lastSyncedAt: number | null;
  syncedCount: number;
  lastError: string | null;
}

export const syncState: SyncStatus = {
  connected: true,
  lastSyncedAt: null,
  syncedCount: 0,
  lastError: null,
};

/**
 * Super-simple, lightweight sync to Supabase table 'signals'
 * No complex schemas, no foreign keys, no blocking constraints.
 */
export async function syncSignalToSupabase(
  type: 'incident' | 'alert',
  title: string,
  service: string,
  severity: string,
  message: string,
  suppressed: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const id = `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const { error } = await supabase.from('signals').insert({
      id,
      type,
      title,
      service,
      severity,
      message,
      suppressed,
      created_at: new Date().toISOString(),
    });

    if (error) {
      syncState.lastError = error.message;
      return { success: false, error: error.message };
    }

    syncState.lastSyncedAt = Date.now();
    syncState.syncedCount += 1;
    syncState.lastError = null;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase write error' };
  }
}

/**
 * Sync helper for incident objects
 */
export function syncIncident(incident: IncidentThread) {
  syncSignalToSupabase(
    'incident',
    incident.title,
    incident.service,
    incident.severity,
    `${incident.alertCount} alerts (${incident.suppressedCount} suppressed)`,
    incident.status === 'cooldown_suppressed'
  ).catch(() => {});
}

/**
 * Sync helper for raw alerts
 */
export function syncRawAlert(alert: RawAlert) {
  syncSignalToSupabase(
    'alert',
    `Alert: ${alert.errorType}`,
    alert.service,
    alert.severity,
    alert.message,
    alert.suppressedByCooldown
  ).catch(() => {});
}

/**
 * Simple 1-click test probe to verify live Supabase insertion
 */
export async function testPushSampleToSupabase(): Promise<{ success: boolean; message: string }> {
  const now = Date.now();
  const testId = `test-${now}`;

  // Try inserting into 'signals' table
  const { error } = await supabase.from('signals').insert({
    id: testId,
    type: 'test',
    title: 'Connection Probe from SignalGuard Dashboard',
    service: 'api-gateway',
    severity: 'info',
    message: 'Backend is connected and working perfectly!',
    suppressed: false,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return {
      success: false,
      message: `Supabase returned: ${error.message}. Please run the 3-line SQL below in your Supabase SQL Editor.`
    };
  }

  return {
    success: true,
    message: `Connected successfully! 1 test row was written to 'signals' table in your Supabase database.`
  };
}
