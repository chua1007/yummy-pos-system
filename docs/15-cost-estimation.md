# Cost Estimation & Optimization

## AWS Infrastructure Cost Projections

### Assumptions
- Region: ap-southeast-1 (Singapore)
- Reserved Instances: 1-year commitment for baseline
- On-Demand for burst capacity
- Data transfer: 50GB/month per 100 restaurants
- Average 500 orders/day per restaurant
- 3 concurrent users per restaurant

---

### Tier 1: 100 Restaurants (~$4,500-6,500/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|-------------|
| EKS | 1 cluster, 3 m5.large nodes | $450 |
| RDS PostgreSQL | db.r5.large, Multi-AZ, 100GB | $650 |
| ElastiCache Redis | cache.r5.large, 2 nodes | $380 |
| MSK (Kafka) | kafka.m5.large, 3 brokers | $650 |
| ALB | 1 ALB, moderate traffic | $80 |
| CloudFront | 500GB transfer, 5M requests | $120 |
| S3 | 200GB storage, 1M requests | $30 |
| Route53 | 2 hosted zones, health checks | $20 |
| Cognito | 300 MAU | $0 (free tier) |
| WAF | 1 Web ACL, 5 rules | $30 |
| CloudWatch | Logs, metrics, alarms | $150 |
| Secrets Manager | 20 secrets | $10 |
| ECR | 10 repositories, 50GB | $25 |
| NAT Gateway | 2 AZs, 100GB transfer | $180 |
| Data Transfer | 50GB inter-AZ + internet | $50 |
| **Subtotal** | | **$2,825** |
| Observability (Grafana Cloud) | Pro tier | $500 |
| Backup (AWS Backup) | RDS + S3 | $100 |
| Reserved Instance Savings | -30% on compute | -$400 |
| **Total Estimated** | | **$4,500-6,500** |

**Cost per restaurant: ~$45-65/month**

---

### Tier 2: 1,000 Restaurants (~$18,000-25,000/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|-------------|
| EKS | 1 cluster, 8 m5.xlarge nodes + spot | $2,400 |
| RDS PostgreSQL | db.r5.2xlarge, Multi-AZ, 1TB, 3 read replicas | $3,200 |
| ElastiCache Redis | cache.r5.xlarge, cluster mode, 6 nodes | $1,800 |
| MSK (Kafka) | kafka.m5.xlarge, 6 brokers | $2,600 |
| ALB | 2 ALBs, high traffic | $300 |
| CloudFront | 5TB transfer, 50M requests | $800 |
| S3 | 2TB storage, 10M requests | $200 |
| OpenSearch | 3 m5.large.search nodes | $900 |
| Route53 | 5 hosted zones, health checks | $50 |
| Cognito | 3,000 MAU | $150 |
| WAF | 2 Web ACLs, 10 rules | $80 |
| CloudWatch | Enhanced monitoring | $400 |
| Lambda | Event processing, 5M invocations | $100 |
| SQS/SNS | 10M messages | $50 |
| NAT Gateway | 3 AZs, 500GB transfer | $600 |
| Data Transfer | 500GB | $300 |
| **Subtotal** | | **$13,930** |
| Observability Stack | Self-hosted on EKS | $800 |
| Backup & DR | Cross-region replication | $500 |
| Reserved Instance Savings | -35% on compute/DB | -$2,500 |
| Spot Instance Savings | Workers on spot | -$500 |
| **Total Estimated** | | **$18,000-25,000** |

**Cost per restaurant: ~$18-25/month**

---

### Tier 3: 10,000 Restaurants (~$85,000-120,000/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|-------------|
| EKS | 2 clusters, 30+ nodes (mixed) | $12,000 |
| RDS PostgreSQL | db.r5.4xlarge, Multi-AZ, 5TB, sharded (4 instances) | $18,000 |
| ElastiCache Redis | cache.r5.2xlarge, cluster mode, 12 shards | $8,000 |
| MSK (Kafka) | kafka.m5.2xlarge, 9 brokers, tiered storage | $10,000 |
| ALB | 4 ALBs, very high traffic | $1,200 |
| CloudFront | 50TB transfer, 500M requests | $5,000 |
| S3 | 20TB storage, 100M requests | $1,500 |
| OpenSearch | 6 m5.xlarge.search + UltraWarm | $3,500 |
| Route53 | 20 hosted zones, latency routing | $200 |
| Cognito | 30,000 MAU | $1,200 |
| WAF + Shield Advanced | Full protection | $3,500 |
| CloudWatch + X-Ray | Full observability | $2,000 |
| Lambda | 50M invocations | $500 |
| SQS/SNS | 100M messages | $300 |
| EventBridge | 50M events | $100 |
| NAT Gateway | 3 AZs, 5TB transfer | $3,000 |
| Data Transfer | 5TB | $2,000 |
| **Subtotal** | | **$72,000** |
| DR Region (warm standby) | ~30% of primary | $8,000 |
| Observability Stack | Dedicated cluster | $3,000 |
| Backup & DR | Full cross-region | $2,000 |
| Reserved Instance Savings | -40% (3-year) | -$15,000 |
| Spot Instance Savings | Workers + batch | -$3,000 |
| Savings Plans | Compute savings | -$5,000 |
| **Total Estimated** | | **$85,000-120,000** |

**Cost per restaurant: ~$8.50-12/month**

---

## Cost Optimization Strategy

### Immediate Optimizations
1. **Reserved Instances** — 1-year RI for baseline compute (30-40% savings)
2. **Spot Instances** — Worker nodes, batch processing (60-70% savings)
3. **S3 Intelligent Tiering** — Automatic cost optimization for stored data
4. **RDS Reserved** — 1-year reserved for database instances
5. **Right-sizing** — Regular review of instance utilization

### Architecture Optimizations
1. **Caching** — Aggressive Redis caching reduces DB load (fewer read replicas needed)
2. **CDN** — CloudFront reduces origin requests by 80%+
3. **Event-driven** — Async processing reduces compute requirements
4. **Serverless** — Lambda for infrequent tasks (reports, notifications)
5. **Data lifecycle** — Archive old data to S3 Glacier

### Scaling Optimizations
1. **Karpenter** — Right-sized nodes, bin-packing optimization
2. **HPA tuning** — Aggressive scale-down during off-peak
3. **Scheduled scaling** — Pre-scale for known peak hours (lunch/dinner)
4. **Multi-tenant density** — Efficient resource sharing across tenants

### Cost Monitoring
- AWS Cost Explorer with daily reports
- Budget alerts at 80%, 90%, 100% of monthly target
- Per-tenant cost attribution via resource tagging
- Monthly cost review meetings
- Quarterly architecture optimization reviews

## Cost Attribution (Tagging Strategy)

```
Tags:
  Environment: production | staging | development
  Service: order-service | payment-service | ...
  Tenant: shared | tenant-{id} (for dedicated resources)
  Team: platform | backend | frontend | devops
  CostCenter: engineering | infrastructure | operations
```
