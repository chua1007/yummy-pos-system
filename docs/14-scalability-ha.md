# Scalability, High Availability & Disaster Recovery

## Scalability Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SCALABILITY ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  HORIZONTAL SCALING                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                       │    │
│  │  Application Layer:                                                  │    │
│  │  • EKS HPA (CPU/Memory/Custom metrics)                               │    │
│  │  • Karpenter for node auto-provisioning                              │    │
│  │  • Pod Disruption Budgets for safe scaling                           │    │
│  │                                                                       │    │
│  │  Database Layer:                                                     │    │
│  │  • RDS Read Replicas (up to 15)                                      │    │
│  │  • Connection pooling (PgBouncer)                                    │    │
│  │  • Table partitioning (time-based for orders)                        │    │
│  │  • Sharding strategy for 10K+ tenants                                │    │
│  │                                                                       │    │
│  │  Cache Layer:                                                        │    │
│  │  • ElastiCache Redis Cluster Mode                                    │    │
│  │  • Automatic shard rebalancing                                       │    │
│  │                                                                       │    │
│  │  Event Layer:                                                        │    │
│  │  • MSK partition scaling                                             │    │
│  │  • Consumer group auto-scaling                                       │    │
│  │                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  VERTICAL SCALING (where applicable)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  • RDS instance class upgrades (zero-downtime with Multi-AZ)         │    │
│  │  • ElastiCache node type upgrades                                    │    │
│  │  • EKS node group instance type changes                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scaling Triggers

| Component | Metric | Scale Up | Scale Down | Cooldown |
|-----------|--------|----------|------------|----------|
| App Pods | CPU | > 70% for 2min | < 30% for 10min | 5min |
| App Pods | Memory | > 80% for 2min | < 40% for 10min | 5min |
| App Pods | RPS | > 1000/pod for 1min | < 200/pod for 10min | 3min |
| Worker Pods | Queue depth | > 100 messages | < 10 messages | 5min |
| EKS Nodes | Pod pending | Any pending > 30s | Node utilization < 40% | 10min |
| RDS | Connections | > 80% max | N/A (manual) | N/A |
| Redis | Memory | > 75% | N/A (manual) | N/A |

### Database Sharding Strategy (10K+ tenants)

```
┌─────────────────────────────────────────────────────────────┐
│              DATABASE SHARDING (Future Scale)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Shard Key: tenant_id (consistent hashing)                   │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Shard 1  │  │ Shard 2  │  │ Shard 3  │  │ Shard N  │   │
│  │ Tenants  │  │ Tenants  │  │ Tenants  │  │ Tenants  │   │
│  │ 0-2499   │  │ 2500-4999│  │ 5000-7499│  │ ...      │   │
│  │          │  │          │  │          │  │          │   │
│  │ RDS      │  │ RDS      │  │ RDS      │  │ RDS      │   │
│  │ Multi-AZ │  │ Multi-AZ │  │ Multi-AZ │  │ Multi-AZ │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  Routing: Application-level shard router                     │
│  Migration: Online shard splitting with dual-write           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## High Availability Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HIGH AVAILABILITY DESIGN                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Target: 99.95% availability (26.3 minutes downtime/year)                    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ MULTI-AZ DEPLOYMENT (Minimum 3 AZs)                                 │    │
│  │                                                                       │    │
│  │  AZ-a              AZ-b              AZ-c                            │    │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐                    │    │
│  │  │EKS Nodes │     │EKS Nodes │     │EKS Nodes │                    │    │
│  │  │(3+ pods) │     │(3+ pods) │     │(3+ pods) │                    │    │
│  │  └──────────┘     └──────────┘     └──────────┘                    │    │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐                    │    │
│  │  │RDS       │     │RDS       │     │RDS       │                    │    │
│  │  │Primary   │     │Standby   │     │Read Rep. │                    │    │
│  │  └──────────┘     └──────────┘     └──────────┘                    │    │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐                    │    │
│  │  │Redis     │     │Redis     │     │Redis     │                    │    │
│  │  │Primary   │     │Replica   │     │Replica   │                    │    │
│  │  └──────────┘     └──────────┘     └──────────┘                    │    │
│  │  ┌──────────┐     ┌──────────┐     ┌──────────┐                    │    │
│  │  │Kafka     │     │Kafka     │     │Kafka     │                    │    │
│  │  │Broker 1  │     │Broker 2  │     │Broker 3  │                    │    │
│  │  └──────────┘     └──────────┘     └──────────┘                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  HA Patterns:                                                                │
│  • Pod anti-affinity (spread across AZs)                                     │
│  • Pod Disruption Budgets (min 2 available)                                  │
│  • Rolling updates (maxUnavailable: 0)                                       │
│  • Health checks (liveness + readiness + startup)                            │
│  • Circuit breakers (prevent cascade failures)                               │
│  • Graceful shutdown (drain connections before termination)                   │
│  • Connection retry with exponential backoff                                 │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Disaster Recovery Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DISASTER RECOVERY                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  DR Tier: Warm Standby (RPO: 5 min, RTO: 30 min)                            │
│                                                                               │
│  PRIMARY REGION                    DR REGION                                 │
│  (ap-southeast-1)                  (ap-southeast-2)                          │
│  ┌──────────────────┐             ┌──────────────────┐                      │
│  │ Full Production  │             │ Warm Standby     │                      │
│  │ Environment      │────────────▶│ (Scaled down)    │                      │
│  │                  │  Async      │                  │                      │
│  │ • EKS (full)    │  Replication│ • EKS (min)      │                      │
│  │ • RDS (primary) │             │ • RDS (replica)  │                      │
│  │ • Redis (full)  │             │ • Redis (replica)│                      │
│  │ • MSK (full)    │             │ • MSK (mirror)   │                      │
│  │ • S3 (primary)  │             │ • S3 (replicated)│                      │
│  └──────────────────┘             └──────────────────┘                      │
│                                                                               │
│  Failover Process:                                                           │
│  1. Detection: Route53 health check fails (30s)                              │
│  2. Decision: Automated or manual trigger                                    │
│  3. Promotion: RDS replica promoted to primary (5-10 min)                    │
│  4. Scaling: DR EKS scaled to production capacity (5 min)                    │
│  5. DNS: Route53 failover to DR region (60s TTL)                             │
│  6. Validation: Smoke tests on DR environment                                │
│  7. Communication: Status page updated                                       │
│                                                                               │
│  Failback Process:                                                           │
│  1. Primary region restored and validated                                    │
│  2. Data sync from DR back to primary                                        │
│  3. Traffic gradually shifted back (canary)                                  │
│  4. DR scaled back down to warm standby                                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Zero-Downtime Deployment Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              ZERO-DOWNTIME DEPLOYMENT                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Application Deployments:                                    │
│  • Rolling updates with maxSurge=1, maxUnavailable=0         │
│  • Readiness gates prevent traffic before ready              │
│  • Graceful shutdown (SIGTERM → drain → SIGKILL)             │
│  • PreStop hook: sleep 15s (allow LB deregistration)         │
│                                                               │
│  Database Migrations:                                        │
│  • Expand-contract pattern                                   │
│  • Phase 1: Add new column (nullable)                        │
│  • Phase 2: Backfill data, deploy code using both            │
│  • Phase 3: Make new column required                         │
│  • Phase 4: Remove old column                                │
│  • Never rename/drop columns in single deploy                │
│                                                               │
│  Infrastructure Changes:                                     │
│  • Blue/green for major infra changes                        │
│  • Terraform plan review before apply                        │
│  • Canary for EKS node group updates                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Production Readiness Checklist

### Pre-Launch

- [ ] All services have health check endpoints (/health/live, /health/ready)
- [ ] Structured logging implemented across all services
- [ ] Prometheus metrics exposed on all services
- [ ] Grafana dashboards created for all critical paths
- [ ] Alert rules configured with appropriate thresholds
- [ ] On-call rotation established
- [ ] Runbooks written for all critical alerts
- [ ] Load testing completed (target: 2x expected peak)
- [ ] Chaos engineering tests passed (pod kill, AZ failure)
- [ ] Security scan passed (SAST, DAST, container scan)
- [ ] Dependency audit clean (no critical vulnerabilities)
- [ ] Database backup/restore tested
- [ ] DR failover tested
- [ ] Rate limiting configured and tested
- [ ] WAF rules deployed and validated
- [ ] SSL/TLS certificates auto-renewal configured
- [ ] Secrets rotation tested
- [ ] PII handling reviewed and compliant
- [ ] RBAC permissions audited
- [ ] API documentation published
- [ ] Client SDKs tested
- [ ] Offline POS sync tested (24hr offline scenario)
- [ ] Multi-tenant isolation verified
- [ ] Performance budgets met (LCP < 2.5s, FID < 100ms)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested (Chrome, Safari, Firefox)
- [ ] Error tracking configured (Sentry/equivalent)
- [ ] Feature flags operational
- [ ] Rollback procedure documented and tested
- [ ] Incident response plan documented
- [ ] Status page configured
- [ ] SLOs defined and monitoring active
