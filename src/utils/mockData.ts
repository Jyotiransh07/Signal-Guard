import { AppInstance, ServiceType, Severity } from '../types';

export const INITIAL_INSTANCES: AppInstance[] = [
  { id: 'inst-gw-01', name: 'api-gateway-us-east-1', service: 'api-gateway', region: 'us-east-1', status: 'healthy', cpuUsage: 42, memoryUsage: 58, activeIncidentsCount: 0, x3d: -140, y3d: -60, z3d: 0 },
  { id: 'inst-gw-02', name: 'api-gateway-us-east-2', service: 'api-gateway', region: 'us-east-1', status: 'healthy', cpuUsage: 38, memoryUsage: 54, activeIncidentsCount: 0, x3d: -120, y3d: 40, z3d: 40 },
  { id: 'inst-auth-01', name: 'auth-service-pod-a', service: 'auth-service', region: 'us-east-1', status: 'healthy', cpuUsage: 28, memoryUsage: 44, activeIncidentsCount: 0, x3d: -70, y3d: -110, z3d: -40 },
  { id: 'inst-pay-01', name: 'payment-processor-01', service: 'payment-processor', region: 'us-west-2', status: 'healthy', cpuUsage: 64, memoryUsage: 72, activeIncidentsCount: 0, x3d: 30, y3d: -120, z3d: 30 },
  { id: 'inst-pay-02', name: 'payment-processor-02', service: 'payment-processor', region: 'us-west-2', status: 'healthy', cpuUsage: 59, memoryUsage: 69, activeIncidentsCount: 0, x3d: 80, y3d: -70, z3d: -30 },
  { id: 'inst-db-01', name: 'postgres-primary-cluster', service: 'database-cluster', region: 'us-east-1', status: 'healthy', cpuUsage: 78, memoryUsage: 84, activeIncidentsCount: 0, x3d: 130, y3d: 20, z3d: 20 },
  { id: 'inst-db-02', name: 'postgres-replica-eu-01', service: 'database-cluster', region: 'eu-central-1', status: 'healthy', cpuUsage: 45, memoryUsage: 62, activeIncidentsCount: 0, x3d: 110, y3d: 100, z3d: -50 },
  { id: 'inst-redis-01', name: 'redis-cache-cluster-01', service: 'cache-redis', region: 'us-east-1', status: 'healthy', cpuUsage: 31, memoryUsage: 48, activeIncidentsCount: 0, x3d: 0, y3d: 130, z3d: 30 },
  { id: 'inst-wrk-01', name: 'worker-queue-consumer-1', service: 'worker-queue', region: 'us-west-2', status: 'healthy', cpuUsage: 88, memoryUsage: 89, activeIncidentsCount: 0, x3d: -60, y3d: 90, z3d: 50 },
  { id: 'inst-search-01', name: 'opensearch-node-alpha', service: 'search-indexer', region: 'us-east-1', status: 'healthy', cpuUsage: 51, memoryUsage: 65, activeIncidentsCount: 0, x3d: 0, y3d: -20, z3d: -90 },
];

export interface ErrorTemplate {
  errorType: string;
  service: ServiceType;
  severity: Severity;
  title: string;
  messageGenerators: ((instanceName: string) => string)[];
  stackTraces: string[];
  httpStatus?: number;
}

export const ERROR_TEMPLATES: ErrorTemplate[] = [
  {
    errorType: 'ConnectionPoolExhausted',
    service: 'database-cluster',
    severity: 'critical',
    title: 'PostgreSQL Connection Pool Exhausted',
    messageGenerators: [
      (inst) => `FATAL: remaining connection slots are reserved for non-replication superuser connections (client: ${inst}, pool_size: 100, active: 100)`,
      (inst) => `TimedOutError: ResourceRequest timed out after 30000ms while waiting for DB connection pool on ${inst}`,
      (inst) => `KnexTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full. Server ${inst}`,
    ],
    stackTraces: [
      `Error: Connection pool exhausted\n    at Pool.acquire (/app/node_modules/pg-pool/index.js:312:15)\n    at QueryExecutor.runTransaction (/app/src/db/executor.ts:88:24)\n    at OrderService.processCheckout (/app/src/services/order.ts:142:19)\n    at async /app/src/routes/api.ts:54:7`,
      `SequelizeConnectionAcquireTimeoutError: Operation timeout\n    at ConnectionManager.getConnection (/app/node_modules/sequelize/lib/dialects/postgres/connection-manager.js:240:19)\n    at async /app/src/repositories/user.ts:42:11`
    ],
    httpStatus: 503
  },
  {
    errorType: 'MemoryLeak',
    service: 'worker-queue',
    severity: 'critical',
    title: 'Node.js V8 Heap Memory Near OOM (>92%)',
    messageGenerators: [
      (inst) => `<--- Last few GCs ---> [${inst}] Mark-sweep (reduce) 4012.4 MB (94%) allocation failed - JavaScript heap out of memory`,
      (inst) => `MemoryLeakDetected: Worker process ${inst} heapUsage has climbed from 450MB to 3890MB over 12 minutes without GC recovery`,
      (inst) => `HeapThresholdBreached: Memory usage 93.8% on container instance ${inst} (cgroup limit: 4096MB)`
    ],
    stackTraces: [
      `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory\n 1: 0xb734e0 node::Abort() [/usr/local/bin/node]\n 2: 0xa841db node::FatalError(char const*, char const*) [/usr/local/bin/node]\n 3: 0xd3e51e v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [/usr/local/bin/node]`
    ],
    httpStatus: 500
  },
  {
    errorType: 'RedisTimeout',
    service: 'cache-redis',
    severity: 'warning',
    title: 'Redis Cache Cluster Read Timeout',
    messageGenerators: [
      (inst) => `IORedis.CommandTimeout: Connection to redis-shard-02.internal:6379 timed out after 3500ms from ${inst}`,
      (inst) => `RedisReadTimeoutException: Failed to fetch cache key 'session:usr_${Math.floor(Math.random()*899999+100000)}' within 2000ms`,
      (inst) => `ClusterDownError: CLUSTERDOWN The cluster is down or partitioned on node ${inst}`
    ],
    stackTraces: [
      `CommandTimeoutError: Command timed out\n    at RedisClient.sendCommand (/app/node_modules/ioredis/built/redis/index.js:521:20)\n    at SessionStore.get (/app/src/middleware/session.ts:31:16)\n    at async authMiddleware (/app/src/middleware/auth.ts:18:22)`
    ],
    httpStatus: 504
  },
  {
    errorType: 'PaymentTimeout',
    service: 'payment-processor',
    severity: 'critical',
    title: 'Payment Gateway 3rd-Party API Timeout (POST /v1/charges)',
    messageGenerators: [
      (inst) => `AxiosError: timeout of 5000ms exceeded at POST https://api.stripe.com/v1/charges (dispatch from ${inst})`,
      (inst) => `GatewayTimeout: Upstream provider payment-acquirer-ny returned 504 Gateway Timeout for txn_id=${Math.random().toString(36).substring(7)}`,
      (inst) => `CircuitBreakerOpenException: Circuit 'stripe-charges' tripped to OPEN state on ${inst} after 15 consecutive 5xx errors`
    ],
    stackTraces: [
      `StripeAPIError: Connection timed out after 5000ms\n    at RequestExecutor.execute (/app/node_modules/stripe/lib/RequestExecutor.js:94:18)\n    at StripeResource._request (/app/node_modules/stripe/lib/StripeResource.js:142:12)\n    at PaymentService.chargeCustomer (/app/src/services/billing.ts:109:22)`
    ],
    httpStatus: 504
  },
  {
    errorType: 'KafkaConsumerLag',
    service: 'worker-queue',
    severity: 'warning',
    title: 'Kafka Consumer Group Partition Lag Spike (>15k msgs)',
    messageGenerators: [
      (inst) => `ConsumerLagWarning: Topic 'user_telemetry_events' partition 4 lag reached 18,420 uncommitted records on ${inst}`,
      (inst) => `RebalanceInProgressError: The group is rebalancing, so a commit cannot be completed on worker ${inst}`,
      (inst) => `HeartbeatTimeout: Member worker-${inst} failed to send heartbeat within session.timeout.ms=45000`
    ],
    stackTraces: [
      `KafkaJSNonRetriableError: Heartbeat failed with coordinator\n    at Heartbeat.send (/app/node_modules/kafkajs/src/consumer/heartbeat.js:68:15)\n    at ConsumerGroup.heartbeat (/app/node_modules/kafkajs/src/consumer/consumerGroup.js:412:18)`
    ]
  },
  {
    errorType: 'AuthTokenInvalid',
    service: 'auth-service',
    severity: 'warning',
    title: 'JWT Signature Verification Failure / JWKS Mismatch',
    messageGenerators: [
      (inst) => `JsonWebTokenError: invalid signature for kid='key-2026-q3-prod' on gateway instance ${inst}`,
      (inst) => `JWKSRateLimitExceeded: Exceeded 100 req/s fetching /.well-known/jwks.json from identity provider on ${inst}`,
      (inst) => `TokenExpiredError: jwt expired at timestamp ${Date.now() - 42000} on ${inst}`
    ],
    stackTraces: [
      `JsonWebTokenError: invalid signature\n    at Object.module.exports [as verify] (/app/node_modules/jsonwebtoken/verify.js:142:19)\n    at verifyToken (/app/src/security/jwt.ts:45:12)\n    at async /app/src/middleware/auth.ts:24:9`
    ],
    httpStatus: 401
  },
  {
    errorType: 'CpuThrottling',
    service: 'api-gateway',
    severity: 'warning',
    title: 'Kubernetes Container CPU CFS Quota Throttled (>90%)',
    messageGenerators: [
      (inst) => `CgroupCpuThrottled: Container api-gateway on node ${inst} throttled 92.4% periods over last 60s window`,
      (inst) => `HighLatencyWarning: P99 latency degraded to 1420ms due to CPU quota starvation on ${inst}`,
      (inst) => `CFSQuotaSaturation: Task queue backing up; CPU limit (2.0 cores) reached 198% utilization`
    ],
    stackTraces: [
      `Warning: Event loop delay exceeded threshold (current: 480ms, threshold: 50ms)\n    at monitorEventLoopDelay (/app/src/metrics/telemetry.ts:74:10)`
    ]
  },
  {
    errorType: 'DiskSpaceExhausted',
    service: 'search-indexer',
    severity: 'critical',
    title: 'Disk Volume Space Low on Lucene Storage (>92%)',
    messageGenerators: [
      (inst) => `LowDiskWatermarkBreached: Disk usage at 93.1% on /var/data/indices on node ${inst}. Indexing throttled.`,
      (inst) => `DiskOutOfSpaceWarning: High watermark (90%) exceeded on mount /data; read-only index block activated on ${inst}`,
      (inst) => `LuceneSegmentMergeFailed: No space left on device while merging shard #3 on ${inst}`
    ],
    stackTraces: [
      `ElasticsearchException: Disk watermark [flood_stage] exceeded on node [search-node-alpha], all indices marked read-only\n    at IndexShard.checkDiskWatermark (/app/src/indexer/storage.ts:188:14)`
    ]
  }
];

export const SERVICE_METADATA: Record<ServiceType, { label: string; color: string; bg: string; border: string }> = {
  'api-gateway': { label: 'API Gateway', color: 'text-[#ff6b35]', bg: 'bg-[#ff6b35]/10', border: 'border-[#ff6b35]/30' },
  'auth-service': { label: 'Auth Service', color: 'text-[#8b7ff5]', bg: 'bg-[#8b7ff5]/10', border: 'border-[#8b7ff5]/30' },
  'payment-processor': { label: 'Payment Vault', color: 'text-[#ff3366]', bg: 'bg-[#ff3366]/10', border: 'border-[#ff3366]/30' },
  'database-cluster': { label: 'DB Cluster', color: 'text-[#ffb703]', bg: 'bg-[#ffb703]/10', border: 'border-[#ffb703]/30' },
  'cache-redis': { label: 'Redis Mesh', color: 'text-[#ff6b35]', bg: 'bg-[#ff6b35]/10', border: 'border-[#ff6b35]/30' },
  'worker-queue': { label: 'Worker Queue', color: 'text-[#39ff88]', bg: 'bg-[#39ff88]/10', border: 'border-[#39ff88]/30' },
  'search-indexer': { label: 'Search Indexer', color: 'text-[#8b7ff5]', bg: 'bg-[#8b7ff5]/10', border: 'border-[#8b7ff5]/30' },
  'storage-s3': { label: 'Object Storage', color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10', border: 'border-[#a78bfa]/30' }
};
