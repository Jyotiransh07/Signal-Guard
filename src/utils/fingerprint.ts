import { RawAlert, IncidentThread, ServiceType, Severity } from '../types';

/**
 * Normalizes error messages by removing dynamic tokens (UUIDs, IPs, hex addresses, numbers, timestamps)
 * to produce consistent grouping fingerprints.
 */
export function generateFingerprint(service: ServiceType, errorType: string, message: string): string {
  // Strip UUIDs
  let cleanMsg = message.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '<UUID>');
  // Strip IP addresses and port numbers
  cleanMsg = cleanMsg.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/g, '<IP:PORT>');
  // Strip hex addresses (e.g. 0x7fff5fbff)
  cleanMsg = cleanMsg.replace(/0x[0-9a-fA-F]+/g, '<HEX>');
  // Strip isolated long numbers or transaction IDs
  cleanMsg = cleanMsg.replace(/\b\d{4,}\b/g, '<NUM>');
  // Strip specific dynamic query parameters or time intervals
  cleanMsg = cleanMsg.replace(/\b\d+(\.\d+)?(ms|s|m|h|MB|GB|%)\b/gi, '<VAL>');
  
  // Collapse whitespace
  cleanMsg = cleanMsg.trim().replace(/\s+/g, ' ').toLowerCase();

  // Create deterministic hash-like string
  const baseKey = `${service}::${errorType.toLowerCase()}::${cleanMsg.slice(0, 80)}`;
  return simpleHash(baseKey);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `fp-${hex.slice(0, 8)}`;
}

/**
 * Computes token similarity between two strings (Jaccard similarity)
 */
export function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  
  if (wordsA.size === 0 && wordsB.size === 0) return 1.0;
  if (wordsA.size === 0 || wordsB.size === 0) return 0.0;

  let intersection = 0;
  wordsA.forEach(w => {
    if (wordsB.has(w)) intersection++;
  });

  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Heuristic root cause & suggested playbook mapper
 */
export function getRootCauseAndAction(errorType: string, service: ServiceType): { hypothesis: string; action: string } {
  const map: Record<string, { hypothesis: string; action: string }> = {
    'ConnectionPoolExhausted': {
      hypothesis: 'Database connection pool reached saturation limit (max_connections=100) due to long-running unindexed queries or connection leaks in HTTP request lifecycle.',
      action: 'Check PgBouncer queue latency, terminate idle-in-transaction sessions, and scale read-replica pool allocations.'
    },
    'MemoryLeak': {
      hypothesis: 'Node.js V8 heap space exceeded 92% threshold. Retained detached DOM trees or unbounded in-memory cache buffers in service workers.',
      action: 'Trigger rolling container restart, capture heap snapshot via Chrome DevTools inspector, and inspect LRU cache eviction TTLs.'
    },
    'CpuThrottling': {
      hypothesis: 'Kubernetes cgroup CFS quota throttled > 90% during batch processing or cryptographic hashing spike.',
      action: 'Scale out HPA replica target by +3 pods and increase container CPU limit reservation from 1.5 to 3.0 cores.'
    },
    'RedisTimeout': {
      hypothesis: 'Redis primary node experiencing latency spike (>3000ms) or O(N) KEYS command execution blocking single-threaded event loop.',
      action: 'Inspect Redis SLOWLOG entries, verify read traffic is routed to replica shards, and check cluster replication lag.'
    },
    'KafkaConsumerLag': {
      hypothesis: 'Event consumer group offset falling behind incoming partition throughput (>15,000 unread messages). Worker thread blocked on sync I/O.',
      action: 'Add 4 additional consumer instances to balance partition assignment and check downstream sink backpressure.'
    },
    'PaymentTimeout': {
      hypothesis: 'Upstream payment processor REST endpoint experiencing elevated p99 latency (>4500ms) or webhook retry storms.',
      action: 'Enable circuit breaker fallback queue, switch traffic to secondary merchant gateway, and notify billing operations.'
    },
    'AuthTokenInvalid': {
      hypothesis: 'JWKS public key cache expired before upstream IAM service published renewed RSA certificates.',
      action: 'Force JWKS cache invalidate & reload across API Gateway edge nodes.'
    },
    'DiskSpaceExhausted': {
      hypothesis: 'Log rotation daemon (logrotate) halted; uncompressed Nginx access logs filled /var/log volume past 95% capacity.',
      action: 'Purge rolled archive logs, adjust retention to 7 days, and verify log streaming to OpenTelemetry collector.'
    },
    'DNSResolutionError': {
      hypothesis: 'Internal CoreDNS / Consul cluster experiencing packet loss or TTL cache stampede under heavy lookup volume.',
      action: 'Check CoreDNS pod CPU saturation and enable NodeLocal DNSCache daemonset.'
    },
    'SlowQuerySpike': {
      hypothesis: 'Missing composite index on transactions table triggered sequential table scan across 12M rows.',
      action: 'Add CONCURRENTLY index on (account_id, created_at) and review execution plan via EXPLAIN ANALYZE.'
    }
  };

  return map[errorType] || {
    hypothesis: `Anomalous error pattern detected in ${service}. Transient network or resource constraint under elevated workload.`,
    action: `Inspect application telemetry logs for ${service}, review recent CI/CD deployments, and verify instance health.`
  };
}
