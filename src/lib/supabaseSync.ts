import { supabase } from './supabase';
import { IncidentThread, RawAlert } from '../types';

const SUPABASE_URL = 'https://akqcrvawyqiveqzjgltv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrcWNydmF3eXFpdmVxempnbHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTU4MDgsImV4cCI6MjEwMjczMTgwOH0.v7nY2Z7D1eOZEZ_Gvvf012-OtTnSAm5H7CLedxFhdq8';

export interface SyncStatus {
  connected: boolean;
  lastSyncedAt: number | null;
  syncedCount: number;
  lastError: string | null;
  recentRecords: Array<{ id: string; title: string; time: string; status: 'ok' | 'error' }>;
}

export const syncState: SyncStatus = {
  connected: true,
  lastSyncedAt: null,
  syncedCount: 0,
  lastError: null,
  recentRecords: [],
};

/**
 * Universal resilient insert into Supabase 'signals' table
 * Works via both Supabase JS client and direct REST POST fallback
 */
export async function insertSignal(record: {
  type: string;
  title: string;
  service: string;
  severity: string;
  message: string;
  suppressed?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const nowIso = new Date().toISOString();
  const id = `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const payloadWithId = {
    id,
    type: record.type,
    title: record.title,
    service: record.service,
    severity: record.severity,
    message: record.message,
    suppressed: Boolean(record.suppressed),
    created_at: nowIso,
  };

  const payloadWithoutId = {
    type: record.type,
    title: record.title,
    service: record.service,
    severity: record.severity,
    message: record.message,
    suppressed: Boolean(record.suppressed),
    created_at: nowIso,
  };

  // 1. Primary method: Supabase JS SDK
  try {
    const { error } = await supabase.from('signals').insert(payloadWithId);
    if (!error) {
      syncState.lastSyncedAt = Date.now();
      syncState.syncedCount += 1;
      syncState.lastError = null;
      syncState.recentRecords = [
        { id, title: record.title, time: new Date().toLocaleTimeString(), status: 'ok' },
        ...syncState.recentRecords.slice(0, 9),
      ];
      return { success: true };
    }
  } catch {
    // Continue to fallback
  }

  // 2. Try without custom text ID (in case user table has auto-increment integer ID)
  try {
    const { error: err2 } = await supabase.from('signals').insert(payloadWithoutId);
    if (!err2) {
      syncState.lastSyncedAt = Date.now();
      syncState.syncedCount += 1;
      syncState.lastError = null;
      syncState.recentRecords = [
        { id, title: record.title, time: new Date().toLocaleTimeString(), status: 'ok' },
        ...syncState.recentRecords.slice(0, 9),
      ];
      return { success: true };
    }
  } catch {
    // Continue to direct REST POST
  }

  // 3. Direct REST API POST
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/signals`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payloadWithId),
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      syncState.lastSyncedAt = Date.now();
      syncState.syncedCount += 1;
      syncState.lastError = null;
      syncState.recentRecords = [
        { id, title: record.title, time: new Date().toLocaleTimeString(), status: 'ok' },
        ...syncState.recentRecords.slice(0, 9),
      ];
      return { success: true };
    } else {
      const errText = await res.text().catch(() => '');
      syncState.lastError = errText || `HTTP ${res.status}`;
      return { success: false, error: errText };
    }
  } catch (fetchErr: any) {
    const errMsg = fetchErr?.message || 'Network error writing to Supabase';
    syncState.lastError = errMsg;
    return { success: false, error: errMsg };
  }
}

/**
 * Save an incident to Supabase signals table
 */
export async function syncIncident(incident: IncidentThread): Promise<{ success: boolean; error?: string }> {
  return insertSignal({
    type: 'incident',
    title: incident.title,
    service: incident.service,
    severity: incident.severity,
    message: `${incident.alertCount} alerts aggregated (${incident.suppressedCount} suppressed by cooldown)`,
    suppressed: incident.status === 'cooldown_suppressed',
  });
}

/**
 * Save a raw telemetry alert to Supabase signals table
 */
export async function syncRawAlert(alert: RawAlert): Promise<{ success: boolean; error?: string }> {
  return insertSignal({
    type: 'raw_alert',
    title: `${alert.service}: ${alert.errorType}`,
    service: alert.service,
    severity: alert.severity,
    message: alert.message,
    suppressed: alert.suppressedByCooldown,
  });
}

/**
 * 1-Click Verification Test that writes a sample record to Supabase
 */
export async function testPushSampleToSupabase(): Promise<{ success: boolean; message: string }> {
  const res = await insertSignal({
    type: 'test_probe',
    title: 'Dashboard Live Connection Test',
    service: 'api-gateway',
    severity: 'info',
    message: 'SignalGuard live telemetry sync verified and working!',
    suppressed: false,
  });

  if (res.success) {
    return {
      success: true,
      message: "Success! 1 test row was written to the 'signals' table in your Supabase database. Refresh your Supabase Table Editor to view it."
    };
  }

  return {
    success: false,
    message: `Supabase write note: ${res.error || 'Please run the 1-click SQL in the box below in your Supabase SQL Editor.'}`
  };
}
