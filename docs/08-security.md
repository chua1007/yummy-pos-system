# Security Architecture

## Zero-Trust Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ZERO-TRUST SECURITY MODEL                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  PRINCIPLE: Never trust, always verify                                       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PERIMETER SECURITY                                                   │    │
│  │  WAF → Shield → CloudFront → API Gateway                            │    │
│  │  • OWASP Top 10 rules                                               │    │
│  │  • Rate limiting per IP/tenant                                       │    │
│  │  • Geo-blocking (configurable)                                       │    │
│  │  • Bot detection                                                     │    │
│  │  • DDoS protection (Layer 3/4/7)                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ IDENTITY & ACCESS                                                    │    │
│  │  Cognito → JWT → RBAC → Resource-level permissions                   │    │
│  │  • MFA enforcement for admin roles                                   │    │
│  │  • Short-lived tokens (15min access, 7d refresh)                     │    │
│  │  • Token rotation on privilege change                                │    │
│  │  • Device fingerprinting                                             │    │
│  │  • Session management with Redis                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ SERVICE-TO-SERVICE                                                   │    │
│  │  mTLS → Service Mesh → IAM Roles                                    │    │
│  │  • Mutual TLS between all services                                   │    │
│  │  • Service accounts with least privilege                             │    │
│  │  • Network policies (deny-all default)                               │    │
│  │  • Request signing for internal APIs                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ DATA SECURITY                                                        │    │
│  │  KMS → RLS → Encryption → Masking                                   │    │
│  │  • AES-256 encryption at rest (KMS CMK)                              │    │
│  │  • TLS 1.3 in transit                                                │    │
│  │  • Row-level security for tenant isolation                           │    │
│  │  • PII masking in logs                                               │    │
│  │  • Data classification labels                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## RBAC Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RBAC HIERARCHY                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  PLATFORM LEVEL (Yummy Internal)                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ super_admin    → Full platform access                │    │
│  │ platform_ops   → Infrastructure & monitoring         │    │
│  │ support_agent  → Tenant support, read-only data      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  TENANT LEVEL (Per Restaurant/Chain)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ tenant_owner   → Full tenant access, billing         │    │
│  │ tenant_admin   → All operations except billing       │    │
│  │ branch_manager → Single branch, full operations      │    │
│  │ shift_lead     → POS, orders, basic reports          │    │
│  │ cashier        → POS only, no settings               │    │
│  │ kitchen_staff  → KDS only                            │    │
│  │ waiter         → Orders, tables                      │    │
│  │ viewer         → Read-only dashboards                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  PERMISSION STRUCTURE                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Resource: orders                                     │    │
│  │   Actions: create, read, update, delete, export      │    │
│  │   Scope: own_branch | all_branches | all_tenants     │    │
│  │                                                       │    │
│  │ Resource: menu                                       │    │
│  │   Actions: create, read, update, delete, publish     │    │
│  │   Scope: own_branch | all_branches                   │    │
│  │                                                       │    │
│  │ Resource: analytics                                  │    │
│  │   Actions: read, export                              │    │
│  │   Scope: own_branch | all_branches                   │    │
│  │                                                       │    │
│  │ Resource: settings                                   │    │
│  │   Actions: read, update                              │    │
│  │   Scope: own_branch | tenant_wide                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### RBAC Implementation

```typescript
// Permission definition
interface Permission {
  resource: string;    // "orders", "menu", "analytics"
  action: string;      // "create", "read", "update", "delete"
  scope: Scope;        // "own", "branch", "tenant", "platform"
  conditions?: Record<string, unknown>; // Additional constraints
}

// Role definition
interface Role {
  id: string;
  tenantId: string;
  name: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
}

// Guard decorator usage
@Controller('orders')
export class OrderController {
  @Post()
  @RequirePermission({ resource: 'orders', action: 'create', scope: 'branch' })
  async createOrder(@Body() dto: CreateOrderDto) { ... }

  @Get()
  @RequirePermission({ resource: 'orders', action: 'read', scope: 'branch' })
  async listOrders(@Query() query: ListOrdersDto) { ... }

  @Delete(':id')
  @RequirePermission({ resource: 'orders', action: 'delete', scope: 'branch' })
  async cancelOrder(@Param('id') id: string) { ... }
}
```

## PCI-DSS Considerations

```
┌─────────────────────────────────────────────────────────────┐
│              PCI-DSS COMPLIANCE STRATEGY                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  APPROACH: SAQ-A (Redirect to payment gateway)               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Card data NEVER touches Yummy servers                │    │
│  │                                                       │    │
│  │ Flow:                                                 │    │
│  │ 1. Client → Payment Gateway SDK (Stripe/Adyen)       │    │
│  │ 2. Gateway tokenizes card                            │    │
│  │ 3. Token sent to Yummy Payment Service               │    │
│  │ 4. Yummy uses token for charges via gateway API      │    │
│  │                                                       │    │
│  │ We store:                                            │    │
│  │ ✓ Payment tokens (gateway-specific)                  │    │
│  │ ✓ Last 4 digits (for display)                        │    │
│  │ ✓ Transaction references                             │    │
│  │ ✗ Full card numbers                                  │    │
│  │ ✗ CVV/CVC                                           │    │
│  │ ✗ Magnetic stripe data                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## OWASP Top 10 Mitigations

| Vulnerability | Mitigation |
|---------------|-----------|
| Injection | Parameterized queries (Prisma ORM), input validation (Zod) |
| Broken Auth | Cognito managed auth, MFA, token rotation |
| Sensitive Data Exposure | KMS encryption, TLS 1.3, PII masking |
| XML External Entities | JSON-only APIs, no XML parsing |
| Broken Access Control | RBAC guards, tenant isolation, RLS |
| Security Misconfiguration | IaC (Terraform), security scanning, CIS benchmarks |
| XSS | CSP headers, output encoding, React auto-escaping |
| Insecure Deserialization | Schema validation, type-safe DTOs |
| Known Vulnerabilities | Automated dependency scanning, Trivy, Snyk |
| Insufficient Logging | Structured audit logs, CloudTrail, alerting |

## Secret Management

```
┌─────────────────────────────────────────────────────────────┐
│              SECRET MANAGEMENT STRATEGY                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  AWS Secrets Manager                                         │
│  ├── /yummy/production/database/credentials                  │
│  ├── /yummy/production/redis/credentials                     │
│  ├── /yummy/production/kafka/credentials                     │
│  ├── /yummy/production/payment-gateway/api-keys              │
│  ├── /yummy/production/cognito/client-secrets                │
│  └── /yummy/production/third-party/api-keys                  │
│                                                               │
│  AWS Parameter Store (AppConfig)                             │
│  ├── /yummy/production/feature-flags                         │
│  ├── /yummy/production/service-config                        │
│  └── /yummy/production/tenant-config                         │
│                                                               │
│  Rotation Policy:                                            │
│  • Database credentials: 30-day auto-rotation                │
│  • API keys: 90-day rotation                                 │
│  • JWT signing keys: 7-day rotation                          │
│  • Service accounts: 90-day rotation                         │
│                                                               │
│  Access:                                                     │
│  • EKS pods via IRSA (IAM Roles for Service Accounts)       │
│  • External Secrets Operator syncs to K8s secrets            │
│  • No secrets in environment variables or code               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## WAF Strategy

```yaml
# WAF Rules Configuration
rules:
  - name: rate-limit-global
    priority: 1
    action: block
    statement:
      rateBasedStatement:
        limit: 2000
        aggregateKeyType: IP

  - name: rate-limit-auth
    priority: 2
    action: block
    statement:
      rateBasedStatement:
        limit: 20
        aggregateKeyType: IP
        scopeDownStatement:
          byteMatchStatement:
            searchString: "/v1/auth/login"

  - name: aws-managed-common-rules
    priority: 3
    statement:
      managedRuleGroupStatement:
        vendorName: AWS
        name: AWSManagedRulesCommonRuleSet

  - name: aws-managed-sql-injection
    priority: 4
    statement:
      managedRuleGroupStatement:
        vendorName: AWS
        name: AWSManagedRulesSQLiRuleSet

  - name: geo-restriction
    priority: 5
    action: block
    statement:
      notStatement:
        statement:
          geoMatchStatement:
            countryCodes: [MY, SG, TH, ID, PH, VN]
```

## Audit Logging Strategy

```typescript
// Every mutation is audit-logged
interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;           // "order.created", "menu.updated"
  resource: string;         // "order", "menu_item"
  resourceId: string;       // UUID of affected resource
  changes: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  metadata: {
    ipAddress: string;
    userAgent: string;
    requestId: string;
    branchId: string;
  };
  timestamp: string;
}

// Stored in:
// 1. PostgreSQL (30-day hot storage)
// 2. S3 (long-term archival, Glacier after 90 days)
// 3. OpenSearch (searchable, 90-day retention)
```

## Tenant Isolation Strategy

| Layer | Isolation Method |
|-------|-----------------|
| Network | VPC, Security Groups, Network Policies |
| Application | Tenant context in JWT, middleware enforcement |
| Database | Row-Level Security (standard), Schema isolation (enterprise) |
| Cache | Key prefixing with tenant_id |
| Events | Tenant-partitioned Kafka topics |
| Storage | S3 prefix per tenant, bucket policies |
| Secrets | Per-tenant secret paths |
| Logging | Tenant-tagged log entries |

## Backup & Recovery Strategy

| Component | RPO | RTO | Method |
|-----------|-----|-----|--------|
| RDS PostgreSQL | 5 min | 30 min | Automated snapshots + PITR |
| Redis | 1 hour | 15 min | AOF persistence + snapshots |
| S3 | 0 (durable) | Immediate | Cross-region replication |
| Kafka | 0 | 15 min | Multi-AZ, topic replication |
| EKS Config | 0 | 30 min | GitOps (Terraform state) |
| Secrets | 0 | 5 min | Multi-region replication |
