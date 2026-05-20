# Observability Architecture

## Observability Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OBSERVABILITY ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    DATA SOURCES                                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │App Logs  │ │Metrics   │ │Traces    │ │Events    │ │Health    │ │    │
│  │  │(JSON)    │ │(Prom.)   │ │(OTLP)    │ │(Domain)  │ │Checks   │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    COLLECTION LAYER                                   │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ Fluent Bit   │  │ Prometheus   │  │ OpenTelemetry│              │    │
│  │  │ (Log shipper)│  │ (Scraper)    │  │ Collector    │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    STORAGE LAYER                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ Loki         │  │ Prometheus   │  │ Tempo        │              │    │
│  │  │ (Logs)       │  │ (Metrics)    │  │ (Traces)     │              │    │
│  │  │ S3 backend   │  │ Thanos/S3    │  │ S3 backend   │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    VISUALIZATION & ALERTING                           │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ Grafana      │  │ AlertManager │  │ PagerDuty    │              │    │
│  │  │ (Dashboards) │  │ (Rules)      │  │ (Escalation) │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Metrics Strategy

### Key Business Metrics (RED Method)

| Service | Rate | Errors | Duration |
|---------|------|--------|----------|
| Order Service | Orders/min | Failed orders % | Order processing time |
| Payment Service | Transactions/min | Payment failures % | Payment latency |
| POS Service | Sales/hour | POS errors % | Checkout time |
| Kitchen Service | Items prepared/hour | Missed orders % | Prep time |
| API Gateway | Requests/sec | 4xx/5xx rate | Response time (p50/p95/p99) |

### Infrastructure Metrics

```yaml
# Prometheus recording rules
groups:
  - name: yummy_sli
    rules:
      # Availability SLI
      - record: yummy:availability:ratio
        expr: |
          sum(rate(http_requests_total{status!~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))

      # Latency SLI (p99 < 500ms)
      - record: yummy:latency:p99
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          )

      # Error budget remaining
      - record: yummy:error_budget:remaining
        expr: |
          1 - (
            (1 - yummy:availability:ratio) / (1 - 0.999)
          )
```

### Custom Application Metrics

```typescript
// NestJS Prometheus metrics
@Injectable()
export class MetricsService {
  private orderCounter: Counter;
  private orderDuration: Histogram;
  private activeOrders: Gauge;
  private revenueCounter: Counter;

  constructor(private prometheus: PrometheusService) {
    this.orderCounter = new Counter({
      name: 'yummy_orders_total',
      help: 'Total orders processed',
      labelNames: ['tenant_id', 'branch_id', 'type', 'status'],
    });

    this.orderDuration = new Histogram({
      name: 'yummy_order_processing_seconds',
      help: 'Order processing duration',
      labelNames: ['tenant_id', 'type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    });

    this.activeOrders = new Gauge({
      name: 'yummy_active_orders',
      help: 'Currently active orders',
      labelNames: ['tenant_id', 'branch_id', 'status'],
    });

    this.revenueCounter = new Counter({
      name: 'yummy_revenue_total',
      help: 'Total revenue processed',
      labelNames: ['tenant_id', 'branch_id', 'currency', 'payment_method'],
    });
  }
}
```

## Logging Strategy

### Structured Log Format

```typescript
// Standard log entry
interface LogEntry {
  timestamp: string;       // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;         // "order-service"
  version: string;         // "1.2.3"
  environment: string;     // "production"
  // Context
  tenantId?: string;
  branchId?: string;
  userId?: string;
  requestId: string;       // Correlation ID
  traceId?: string;        // OpenTelemetry trace
  spanId?: string;
  // Error details
  error?: {
    name: string;
    message: string;
    stack: string;
    code?: string;
  };
  // Additional context
  metadata?: Record<string, unknown>;
  duration?: number;       // ms
}

// Example log output
{
  "timestamp": "2024-03-15T10:30:00.123Z",
  "level": "info",
  "message": "Order placed successfully",
  "service": "order-service",
  "version": "1.2.3",
  "environment": "production",
  "tenantId": "tenant_abc123",
  "branchId": "branch_xyz",
  "userId": "user_456",
  "requestId": "req_789",
  "traceId": "abc123def456",
  "metadata": {
    "orderId": "ord_001",
    "orderTotal": 4500,
    "itemCount": 3
  },
  "duration": 245
}
```

### Log Levels & Retention

| Level | Usage | Retention |
|-------|-------|-----------|
| DEBUG | Development only, verbose | Not shipped to production |
| INFO | Business events, state changes | 30 days |
| WARN | Degraded performance, retries | 90 days |
| ERROR | Failed operations, exceptions | 1 year |
| FATAL | Service crashes, data loss | 2 years |

## Alerting Strategy

### Alert Severity Levels

```yaml
# AlertManager configuration
groups:
  - name: yummy_critical
    rules:
      - alert: HighErrorRate
        expr: yummy:availability:ratio < 0.995
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate exceeds SLO ({{ $value }})"
          runbook: "https://runbooks.yummy.io/high-error-rate"

      - alert: PaymentServiceDown
        expr: up{service="payment-service"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Payment service is unreachable"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_pool_available_connections < 5
        for: 2m
        labels:
          severity: critical

  - name: yummy_warning
    rules:
      - alert: HighLatency
        expr: yummy:latency:p99 > 0.5
        for: 10m
        labels:
          severity: warning

      - alert: DiskSpaceRunningLow
        expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.2
        for: 15m
        labels:
          severity: warning

      - alert: KafkaConsumerLag
        expr: kafka_consumer_group_lag > 10000
        for: 5m
        labels:
          severity: warning
```

### Escalation Policy

| Severity | Response Time | Notification | Escalation |
|----------|--------------|--------------|------------|
| Critical | 5 min | PagerDuty + Slack + SMS | → Engineering Lead (15min) → CTO (30min) |
| Warning | 30 min | Slack channel | → On-call engineer (1hr) |
| Info | Next business day | Email digest | None |

## Grafana Dashboards

### Dashboard Hierarchy
```
Dashboards/
├── Executive/
│   ├── Platform Overview (SLIs, revenue, tenant health)
│   └── Business Metrics (orders, revenue, growth)
├── Operations/
│   ├── Service Health (per-service RED metrics)
│   ├── Infrastructure (CPU, memory, disk, network)
│   ├── Database (connections, queries, replication lag)
│   └── Kafka (throughput, lag, partition health)
├── Tenant/
│   ├── Tenant Health (per-tenant metrics)
│   └── Tenant Usage (API calls, storage, orders)
└── On-Call/
    ├── Incident Dashboard (active alerts, recent changes)
    └── Runbook Links
```

## SLO Definitions

| Service | SLI | SLO Target | Error Budget (30d) |
|---------|-----|------------|-------------------|
| API Availability | Successful requests / Total requests | 99.9% | 43.2 min downtime |
| API Latency (p99) | Requests < 500ms / Total requests | 99.0% | 432 min slow |
| Order Processing | Orders completed / Orders placed | 99.95% | 21.6 min failures |
| Payment Success | Successful payments / Total attempts | 99.9% | 43.2 min failures |
| POS Sync | Synced within 5min / Total offline orders | 99.5% | 216 min delay |
