# SaaS & Multi-Tenancy Architecture

## SaaS Subscription Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION & BILLING ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      PLAN TIERS                                       │    │
│  │                                                                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │    │
│  │  │ Starter  │  │ Growth   │  │Enterprise│  │ Custom   │           │    │
│  │  │ $49/mo   │  │ $149/mo  │  │ $499/mo  │  │ Custom   │           │    │
│  │  │          │  │          │  │          │  │          │           │    │
│  │  │ 1 branch │  │ 5 branch │  │ Unlimited│  │ Unlimited│           │    │
│  │  │ 3 users  │  │ 20 users │  │ Unlimited│  │ Unlimited│           │    │
│  │  │ Core POS │  │ + CRM    │  │ + All    │  │ + White  │           │    │
│  │  │ + Menu   │  │ + Analyt.│  │ + API    │  │   Label  │           │    │
│  │  │ + Orders │  │ + Loyalty│  │ + SLA    │  │ + Custom │           │    │
│  │  │          │  │ + Invent.│  │ + SSO    │  │   Dev    │           │    │
│  │  │ Shared DB│  │ Shared DB│  │ Isolated │  │ Dedicated│           │    │
│  │  │ (RLS)    │  │ (RLS)    │  │ (Schema) │  │ (DB)     │           │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    USAGE METERING                                     │    │
│  │                                                                       │    │
│  │  Tracked Metrics:                                                    │    │
│  │  • Orders processed per month                                        │    │
│  │  • API calls per month                                               │    │
│  │  • Storage used (images, documents)                                  │    │
│  │  • Active users                                                      │    │
│  │  • Branches                                                          │    │
│  │  • SMS/Email notifications sent                                      │    │
│  │  • Payment transactions processed                                    │    │
│  │                                                                       │    │
│  │  Overage Handling:                                                   │    │
│  │  • Soft limits with warnings at 80%, 90%, 100%                       │    │
│  │  • Hard limits on API calls (429 response)                           │    │
│  │  • Automatic upgrade suggestions                                     │    │
│  │  • Grace period (7 days) before enforcement                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tenant Onboarding Automation

```
┌─────────────────────────────────────────────────────────────┐
│              TENANT ONBOARDING FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Sign Up                                                  │
│     └─▶ Create Cognito user                                 │
│     └─▶ Verify email                                        │
│                                                               │
│  2. Tenant Provisioning (automated)                          │
│     └─▶ Create tenant record                                │
│     └─▶ Provision database schema (if enterprise)           │
│     └─▶ Create default roles & permissions                  │
│     └─▶ Generate API keys                                   │
│     └─▶ Set up default branch                               │
│     └─▶ Apply default feature flags                         │
│     └─▶ Configure default theme                             │
│                                                               │
│  3. Guided Setup Wizard                                      │
│     └─▶ Business details                                    │
│     └─▶ Branch configuration                                │
│     └─▶ Menu setup (import or manual)                       │
│     └─▶ Payment gateway connection                          │
│     └─▶ Staff invitation                                    │
│     └─▶ POS device registration                             │
│                                                               │
│  4. Activation                                               │
│     └─▶ Trial period starts (14 days)                       │
│     └─▶ Welcome email sequence                              │
│     └─▶ In-app onboarding tour                              │
│                                                               │
│  Timeline: < 5 minutes from sign-up to first order          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Feature Flag Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              FEATURE FLAG SYSTEM                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Storage: AWS AppConfig + Redis (cache)                      │
│                                                               │
│  Flag Types:                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ BOOLEAN    │ Simple on/off toggle                    │    │
│  │ PERCENTAGE │ Gradual rollout (0-100%)                │    │
│  │ SEGMENT    │ Target specific tenant groups           │    │
│  │ PLAN       │ Tied to subscription tier               │    │
│  │ SCHEDULE   │ Time-based activation                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Evaluation Hierarchy:                                       │
│  1. User-level override                                      │
│  2. Tenant-level override                                    │
│  3. Plan-level default                                       │
│  4. Global default                                           │
│                                                               │
│  Example Flags:                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ feature.qr_ordering          │ plan:growth+         │    │
│  │ feature.ai_analytics         │ plan:enterprise      │    │
│  │ feature.multi_branch         │ plan:growth+         │    │
│  │ feature.white_label          │ plan:custom          │    │
│  │ feature.offline_pos          │ boolean:true         │    │
│  │ feature.new_dashboard_v2     │ percentage:20%       │    │
│  │ feature.loyalty_program      │ plan:growth+         │    │
│  │ feature.inventory_forecast   │ plan:enterprise      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Feature Flag Implementation

```typescript
// packages/shared/src/feature-flags/client.ts
interface FeatureFlag {
  key: string;
  enabled: boolean;
  variant?: string;
  metadata?: Record<string, unknown>;
}

interface FlagContext {
  tenantId: string;
  userId: string;
  plan: string;
  region: string;
  branchId?: string;
}

class FeatureFlagClient {
  private cache: Map<string, FeatureFlag> = new Map();
  private redis: Redis;

  async isEnabled(key: string, context: FlagContext): Promise<boolean> {
    // 1. Check local cache (< 1ms)
    // 2. Check Redis cache (< 5ms)
    // 3. Fetch from AppConfig (< 50ms, rare)
    const flag = await this.resolve(key, context);
    return flag.enabled;
  }

  async getVariant(key: string, context: FlagContext): Promise<string | null> {
    const flag = await this.resolve(key, context);
    return flag.variant ?? null;
  }
}

// Usage in NestJS guard
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private flags: FeatureFlagClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.get<string>('feature', context.getHandler());
    const request = context.switchToHttp().getRequest();
    return this.flags.isEnabled(feature, {
      tenantId: request.tenantId,
      userId: request.userId,
      plan: request.tenantPlan,
      region: request.tenantRegion,
    });
  }
}

// Controller usage
@Get('forecast')
@RequireFeature('feature.inventory_forecast')
async getInventoryForecast() { ... }
```

## White-Label Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              WHITE-LABEL SYSTEM                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Customizable Elements:                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ BRANDING                                             │    │
│  │  • Logo (header, favicon, loading screen)            │    │
│  │  • Color scheme (primary, secondary, accent)         │    │
│  │  • Typography (font family, weights)                 │    │
│  │  • Border radius style                               │    │
│  │  • Custom CSS overrides                              │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ DOMAIN                                               │    │
│  │  • Custom domain (pos.clientbrand.com)               │    │
│  │  • Custom email domain (noreply@clientbrand.com)     │    │
│  │  • SSL certificate (auto-provisioned via ACM)        │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ CONTENT                                              │    │
│  │  • App name                                          │    │
│  │  • Email templates                                   │    │
│  │  • Receipt templates                                 │    │
│  │  • Help center content                               │    │
│  │  • Terms & conditions                                │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │ FEATURES                                             │    │
│  │  • Module visibility                                 │    │
│  │  • Custom navigation structure                       │    │
│  │  • Custom dashboard widgets                          │    │
│  │  • Custom report templates                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Implementation:                                             │
│  • Tenant config stored in PostgreSQL + Redis cache          │
│  • CSS variables injected at runtime                         │
│  • Assets served from tenant-specific S3 prefix              │
│  • Custom domains via CloudFront + ACM                       │
│  • Email via SES with tenant-specific templates              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Language & Localization

```typescript
// Supported locales
const locales = {
  'en': 'English',
  'ms': 'Bahasa Melayu',
  'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese',
  'th': 'Thai',
  'id': 'Bahasa Indonesia',
  'vi': 'Vietnamese',
  'tl': 'Filipino',
};

// Localization strategy:
// - UI strings: i18next with namespace per module
// - Currency: per-tenant configuration (MYR, SGD, THB, IDR, PHP, VND)
// - Date/time: per-branch timezone
// - Number formatting: locale-aware
// - RTL: not required for SEA markets (future consideration)
```

## Region-Based Configuration

| Region | Currency | Tax | Payment Gateways | Compliance |
|--------|----------|-----|-------------------|------------|
| Malaysia | MYR | SST 6% | iPay88, Billplz, Stripe | PDPA |
| Singapore | SGD | GST 9% | Stripe, PayNow | PDPA |
| Thailand | THB | VAT 7% | Omise, PromptPay | PDPA |
| Indonesia | IDR | PPN 11% | Midtrans, GoPay | UU PDP |
| Philippines | PHP | VAT 12% | PayMongo, GCash | DPA |
| Vietnam | VND | VAT 10% | VNPay, MoMo | Cybersecurity Law |

## Audit Logging

Every tenant action is logged for compliance:
- Who (user ID, role)
- What (action, resource, changes)
- When (timestamp, timezone)
- Where (IP, device, branch)
- Why (request context, correlation ID)

Retention: 7 years (configurable per region/compliance requirement)
