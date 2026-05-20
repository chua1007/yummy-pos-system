# Full System Architecture

## High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Web Dashboard    │  POS Terminal   │  Mobile App    │  Kiosk    │  KDS      │
│  (Next.js)        │  (Next.js+PWA)  │  (React Native)│  (Next.js)│  (Next.js)│
└────────┬──────────┴────────┬────────┴───────┬────────┴─────┬─────┴─────┬────┘
         │                   │                │              │           │
         ▼                   ▼                ▼              ▼           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CDN / EDGE LAYER                                    │
│                     AWS CloudFront + Route53 + WAF                            │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                                    │
│              AWS API Gateway + Kong / Custom NestJS Gateway                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │Rate Limit│  │Auth/JWT  │  │Tenant    │  │Request   │  │API       │     │
│  │Throttle  │  │Validate  │  │Routing   │  │Transform │  │Versioning│     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVICE MESH LAYER                                     │
│                    (AWS App Mesh / Istio on EKS)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Auth        │  │ Tenant      │  │ POS         │  │ Order       │       │
│  │ Service     │  │ Service     │  │ Service     │  │ Service     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Menu        │  │ Inventory   │  │ Payment     │  │ Kitchen     │       │
│  │ Service     │  │ Service     │  │ Service     │  │ Service     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ CRM         │  │ Analytics   │  │ HR          │  │ Notification│       │
│  │ Service     │  │ Service     │  │ Service     │  │ Service     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Subscription│  │ Delivery    │  │ Reservation │  │ Reporting   │       │
│  │ Service     │  │ Service     │  │ Service     │  │ Service     │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────────┐
│  EVENT BUS       │ │  CACHE LAYER     │ │  DATA LAYER                      │
│  ┌────────────┐  │ │  ┌────────────┐  │ │  ┌──────────┐  ┌──────────────┐ │
│  │ Kafka/MSK  │  │ │  │ Redis      │  │ │  │PostgreSQL│  │ S3           │ │
│  │ EventBridge│  │ │  │ ElastiCache│  │ │  │ RDS      │  │ Object Store │ │
│  │ SQS/SNS   │  │ │  └────────────┘  │ │  └──────────┘  └──────────────┘ │
│  └────────────┘  │ │                  │ │  ┌──────────┐  ┌──────────────┐ │
└──────────────────┘ └──────────────────┘ │  │OpenSearch│  │ DynamoDB     │ │
                                          │  │          │  │ (Sessions)   │ │
                                          │  └──────────┘  └──────────────┘ │
                                          └──────────────────────────────────┘
```

## Architecture Principles

### 1. Domain-Driven Design (DDD)
Each microservice owns a bounded context aligned with a business domain. Services communicate through well-defined APIs and domain events.

### 2. Event-Driven Architecture
Services publish domain events to Kafka/EventBridge. Other services subscribe to events they care about, enabling loose coupling and eventual consistency.

### 3. CQRS (Command Query Responsibility Segregation)
Write-heavy services (POS, Orders) separate command and query models for optimal performance.

### 4. Multi-Tenant Isolation
Every request carries tenant context. Data isolation is enforced at the database level (schema-per-tenant for enterprise, row-level for standard).

### 5. API-First Design
All service interfaces are defined as OpenAPI specs before implementation. Internal services use gRPC for performance-critical paths.

## Service Communication Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                  COMMUNICATION PATTERNS                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Synchronous (Request/Response):                             │
│  ┌──────────┐  REST/gRPC  ┌──────────┐                     │
│  │ Service A│────────────▶│ Service B│                      │
│  └──────────┘             └──────────┘                      │
│  Use: Real-time queries, auth validation, payment processing │
│                                                               │
│  Asynchronous (Event-Driven):                                │
│  ┌──────────┐  Event  ┌───────┐  Event  ┌──────────┐       │
│  │ Service A│────────▶│ Kafka │────────▶│ Service B│        │
│  └──────────┘         └───────┘         └──────────┘        │
│  Use: Order updates, inventory sync, analytics ingestion     │
│                                                               │
│  Async Command (Task Queue):                                 │
│  ┌──────────┐  Command ┌─────┐  Process ┌──────────┐       │
│  │ Service A│─────────▶│ SQS │─────────▶│ Worker   │       │
│  └──────────┘          └─────┘          └──────────┘        │
│  Use: Report generation, email sending, batch processing     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ORDER LIFECYCLE FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Customer ──▶ Order Service ──▶ Payment Service              │
│                    │                    │                     │
│                    ▼                    ▼                     │
│              Kitchen Service      Inventory Service           │
│                    │                    │                     │
│                    ▼                    ▼                     │
│              KDS Display          Stock Deduction             │
│                    │                    │                     │
│                    ▼                    ▼                     │
│              Order Ready          Analytics Service           │
│                    │                    │                     │
│                    ▼                    ▼                     │
│              Notification         Revenue Dashboard           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Cross-Cutting Concerns

| Concern | Implementation |
|---------|---------------|
| Authentication | AWS Cognito + JWT tokens |
| Authorization | RBAC with per-tenant role definitions |
| Tenant Context | Extracted from JWT, propagated via headers |
| Rate Limiting | API Gateway + Redis-based sliding window |
| Circuit Breaking | Resilience4j patterns in NestJS |
| Distributed Tracing | AWS X-Ray / OpenTelemetry |
| Logging | Structured JSON logs → Loki |
| Metrics | Prometheus exporters on each service |
| Secret Management | AWS Secrets Manager + Parameter Store |
| Configuration | AWS AppConfig with feature flags |

## Technology Decision Matrix

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend Framework | NestJS | TypeScript ecosystem, DI, modular, microservice-native |
| API Protocol (External) | REST + OpenAPI | Universal client support, tooling ecosystem |
| API Protocol (Internal) | gRPC | Performance, type safety, streaming support |
| Event Streaming | Kafka (MSK) | High throughput, replay capability, partitioning |
| Event Routing | EventBridge | AWS-native, rule-based routing, serverless |
| Primary Database | PostgreSQL | ACID, JSON support, mature, RLS for multi-tenancy |
| Cache | Redis | Sub-ms latency, pub/sub, session store |
| Search | OpenSearch | Full-text search, analytics, log aggregation |
| Object Storage | S3 | Unlimited scale, lifecycle policies, cost-effective |
| Container Orchestration | EKS | Kubernetes standard, AWS integration, ecosystem |
| IaC | Terraform | Multi-cloud capable, declarative, state management |
| CI/CD | GitLab CI | Integrated SCM, container registry, environments |
