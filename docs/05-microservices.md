# Microservices Architecture

## Service Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        YUMMY MICROSERVICES MAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  PLATFORM SERVICES (Cross-cutting)                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ Gateway    │ │ Auth       │ │ Tenant     │ │ Notification│              │
│  │ Service    │ │ Service    │ │ Service    │ │ Service     │              │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                              │
│  │ File       │ │ Audit      │ │ Config     │                              │
│  │ Service    │ │ Service    │ │ Service    │                              │
│  └────────────┘ └────────────┘ └────────────┘                              │
│                                                                               │
│  CORE BUSINESS SERVICES                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ POS        │ │ Order      │ │ Menu       │ │ Kitchen    │               │
│  │ Service    │ │ Service    │ │ Service    │ │ Service    │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ Payment    │ │ Table      │ │ Reservation│ │ Delivery   │               │
│  │ Service    │ │ Service    │ │ Service    │ │ Service    │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│                                                                               │
│  OPERATIONS SERVICES                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ Inventory  │ │ Supplier   │ │ HR         │ │ Scheduling │               │
│  │ Service    │ │ Service    │ │ Service    │ │ Service    │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│                                                                               │
│  ENGAGEMENT SERVICES                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ CRM        │ │ Loyalty    │ │ Campaign   │ │ Voucher    │               │
│  │ Service    │ │ Service    │ │ Service    │ │ Service    │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│                                                                               │
│  INTELLIGENCE SERVICES                                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                              │
│  │ Analytics  │ │ Reporting  │ │ Forecasting│                              │
│  │ Service    │ │ Service    │ │ Service    │                              │
│  └────────────┘ └────────────┘ └────────────┘                              │
│                                                                               │
│  SAAS SERVICES                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │Subscription│ │ Billing    │ │ Feature    │ │ Onboarding │               │
│  │ Service    │ │ Service    │ │ Flag Svc   │ │ Service    │               │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘               │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Detail Specifications

### 1. Auth Service
| Attribute | Value |
|-----------|-------|
| Responsibility | Authentication, authorization, session management |
| Tech | NestJS + AWS Cognito SDK |
| Database | Cognito (users) + PostgreSQL (roles, permissions) |
| Events Published | user.registered, user.login, role.changed |
| Events Consumed | tenant.created |
| API Type | REST (external), gRPC (internal) |
| Scaling | Horizontal, stateless |

### 2. Tenant Service
| Attribute | Value |
|-----------|-------|
| Responsibility | Tenant lifecycle, configuration, branding |
| Tech | NestJS |
| Database | PostgreSQL |
| Events Published | tenant.created, tenant.updated, tenant.suspended |
| Events Consumed | subscription.changed |
| API Type | REST |
| Scaling | Horizontal, stateless |

### 3. POS Service
| Attribute | Value |
|-----------|-------|
| Responsibility | Point-of-sale operations, offline sync |
| Tech | NestJS |
| Database | PostgreSQL + Redis (session) |
| Events Published | pos.sale_completed, pos.shift_opened, pos.shift_closed |
| Events Consumed | menu.updated, payment.confirmed |
| API Type | REST + WebSocket |
| Scaling | Horizontal, stateless |
| Special | Offline-first architecture with sync queue |

### 4. Order Service
| Attribute | Value |
|-----------|-------|
| Responsibility | Order lifecycle management |
| Tech | NestJS |
| Database | PostgreSQL (partitioned by date) |
| Events Published | order.placed, order.confirmed, order.ready, order.completed |
| Events Consumed | payment.confirmed, kitchen.order_ready |
| API Type | REST + WebSocket (real-time updates) |
| Scaling | Horizontal, CQRS pattern |

### 5. Menu Service
| Attribute | Value |
|-----------|-------|
| Responsibility | Menu CRUD, categories, modifiers, pricing |
| Tech | NestJS |
| Database | PostgreSQL + Redis (cache) |
| Events Published | menu.updated, menu.item_added, menu.price_changed |
| Events Consumed | inventory.item_unavailable |
| API Type | REST |
| Scaling | Horizontal, heavy caching |

### 6. Kitchen Service (KDS)
| Attribute | Value |
|-----------|-------|
| Responsibility | Kitchen display, order routing, prep tracking |
| Tech | NestJS |
| Database | Redis (active orders) + PostgreSQL (history) |
| Events Published | kitchen.order_started, kitchen.order_ready, kitchen.item_ready |
| Events Consumed | order.placed, order.modified |
| API Type | WebSocket (real-time KDS) |
| Scaling | Horizontal |

### 7. Payment Service
| Attribute | Value |
|-----------|-------|
| Responsibility | Payment processing, refunds, split payments |
| Tech | NestJS |
| Database | PostgreSQL (PCI-compliant) |
| Events Published | payment.initiated, payment.confirmed, payment.failed, payment.refunded |
| Events Consumed | order.placed |
| API Type | REST |
| Scaling | Horizontal, idempotent |
| Special | PCI-DSS compliant, gateway abstraction layer |

### 8. Inventory Service
| Attribute | Value |
|-----------|-------|
| Responsibility | Stock tracking, auto-deduction, alerts |
| Tech | NestJS |
| Database | PostgreSQL |
| Events Published | inventory.low_stock, inventory.restocked, inventory.item_unavailable |
| Events Consumed | order.completed, purchase_order.received |
| API Type | REST |
| Scaling | Horizontal |

### 9. Analytics Service
| Attribute | Value |
|-----------|-------|
| Responsibility | Real-time analytics, dashboards, metrics |
| Tech | NestJS + ClickHouse/TimescaleDB |
| Database | PostgreSQL + OpenSearch (aggregations) |
| Events Published | analytics.report_generated |
| Events Consumed | ALL domain events (event sourcing) |
| API Type | REST + WebSocket (live dashboards) |
| Scaling | Horizontal, read-heavy |

### 10. CRM Service
| Attribute | Value |
|-----------|-------|
| Responsibility | Customer profiles, segmentation, history |
| Tech | NestJS |
| Database | PostgreSQL + OpenSearch (search) |
| Events Published | customer.created, customer.segment_changed |
| Events Consumed | order.completed, loyalty.points_earned |
| API Type | REST |
| Scaling | Horizontal |

## Event-Driven Architecture

### Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EVENT TOPOLOGY                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  POS Service                                                             │
│       │                                                                   │
│       ├──▶ order.placed ──────────┬──▶ Kitchen Service                   │
│       │                           ├──▶ Inventory Service                 │
│       │                           ├──▶ Analytics Service                 │
│       │                           └──▶ Notification Service              │
│       │                                                                   │
│  Kitchen Service                                                         │
│       │                                                                   │
│       ├──▶ kitchen.order_ready ───┬──▶ Order Service                     │
│       │                           ├──▶ Notification Service              │
│       │                           └──▶ Analytics Service                 │
│       │                                                                   │
│  Payment Service                                                         │
│       │                                                                   │
│       ├──▶ payment.confirmed ─────┬──▶ Order Service                     │
│       │                           ├──▶ Loyalty Service                   │
│       │                           ├──▶ CRM Service                       │
│       │                           └──▶ Analytics Service                 │
│       │                                                                   │
│  Inventory Service                                                       │
│       │                                                                   │
│       ├──▶ inventory.low_stock ───┬──▶ Notification Service              │
│       │                           └──▶ Supplier Service                  │
│       │                                                                   │
│       ├──▶ inventory.unavailable ─┬──▶ Menu Service                      │
│       │                           └──▶ POS Service                       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Kafka Topic Design

```
Topics:
├── yummy.orders.events          (partitioned by tenant_id)
├── yummy.payments.events        (partitioned by tenant_id)
├── yummy.kitchen.events         (partitioned by branch_id)
├── yummy.inventory.events       (partitioned by branch_id)
├── yummy.customers.events       (partitioned by tenant_id)
├── yummy.analytics.events       (partitioned by tenant_id)
├── yummy.notifications.commands (partitioned by recipient_id)
├── yummy.audit.events           (partitioned by tenant_id)
└── yummy.sync.events            (partitioned by device_id)
```

### Event Schema (CloudEvents Standard)

```typescript
interface DomainEvent {
  id: string;                    // UUID
  source: string;                // "yummy.order-service"
  type: string;                  // "order.placed"
  specversion: string;           // "1.0"
  time: string;                  // ISO 8601
  datacontenttype: string;       // "application/json"
  data: Record<string, unknown>; // Event payload
  // Extensions
  tenantid: string;              // Tenant UUID
  branchid: string;              // Branch UUID
  correlationid: string;         // Request correlation ID
  causationid: string;           // Causing event ID
}
```

## Service-to-Service Communication

```
┌─────────────────────────────────────────────────────────────┐
│              COMMUNICATION MATRIX                             │
├──────────────┬──────────────┬────────────┬──────────────────┤
│ From → To    │ Protocol     │ Pattern    │ Use Case         │
├──────────────┼──────────────┼────────────┼──────────────────┤
│ Gateway→Auth │ gRPC         │ Sync       │ Token validation │
│ POS→Order    │ REST         │ Sync       │ Place order      │
│ Order→Kitchen│ Kafka        │ Async      │ New order notify │
│ Order→Payment│ REST         │ Sync       │ Process payment  │
│ Payment→Order│ Kafka        │ Async      │ Payment result   │
│ Order→Invent.│ Kafka        │ Async      │ Stock deduction  │
│ Kitchen→Order│ Kafka        │ Async      │ Order ready      │
│ Order→Notif. │ SQS          │ Async      │ Customer notify  │
│ Analytics←*  │ Kafka        │ Async      │ Event ingestion  │
│ CRM←Payment  │ Kafka        │ Async      │ Purchase history │
└──────────────┴──────────────┴────────────┴──────────────────┘
```

## Resilience Patterns

### Circuit Breaker
```typescript
// NestJS Circuit Breaker implementation
@Injectable()
export class PaymentService {
  @CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenRequests: 3,
  })
  async processPayment(dto: ProcessPaymentDto): Promise<PaymentResult> {
    return this.paymentGateway.charge(dto);
  }
}
```

### Retry with Exponential Backoff
```typescript
@Injectable()
export class OrderService {
  @Retry({
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
  })
  async confirmOrder(orderId: string): Promise<Order> {
    return this.orderRepository.confirm(orderId);
  }
}
```

### Saga Pattern (Distributed Transactions)

```
┌─────────────────────────────────────────────────────────────┐
│              ORDER PLACEMENT SAGA                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Create Order (pending)                                   │
│     ↓ success                                                │
│  2. Reserve Inventory                                        │
│     ↓ success          ↓ failure → Cancel Order              │
│  3. Process Payment                                          │
│     ↓ success          ↓ failure → Release Inventory         │
│  4. Confirm Order                                            │
│     ↓ success          ↓ failure → Refund Payment            │
│  5. Notify Kitchen                                           │
│     ↓ success                                                │
│  6. Send Customer Notification                               │
│                                                               │
│  Compensating Actions (Rollback):                            │
│  - Cancel Order → Release Inventory → Refund Payment         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```
