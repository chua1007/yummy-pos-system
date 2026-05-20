# Repository Strategy & Folder Structure

## Repository Strategy: Monorepo

### Decision: Monorepo (Turborepo + pnpm workspaces)

**Rationale:**
- Shared TypeScript types across frontend and backend
- Unified CI/CD pipeline management
- Atomic commits across services
- Shared design system and utilities
- Simplified dependency management
- Better developer experience for a single team

**When to split (future):**
- Team grows beyond 30+ engineers
- Services need independent deployment cadences
- Different language requirements emerge

---

## Folder Structure

```
yummy/
├── .github/                          # GitHub Actions (if using GitHub)
├── .gitlab/                          # GitLab CI configuration
│   └── ci/
│       ├── lint.yml
│       ├── test.yml
│       ├── build.yml
│       ├── deploy-dev.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
├── .gitlab-ci.yml                    # Root CI/CD pipeline
│
├── apps/                             # Deployable applications
│   ├── web/                          # Main dashboard (Next.js)
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router
│   │   │   │   ├── (auth)/           # Auth layout group
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── (dashboard)/      # Dashboard layout group
│   │   │   │   │   ├── overview/
│   │   │   │   │   ├── orders/
│   │   │   │   │   ├── menu/
│   │   │   │   │   ├── inventory/
│   │   │   │   │   ├── customers/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── staff/
│   │   │   │   │   └── settings/
│   │   │   │   └── layout.tsx
│   │   │   ├── components/           # App-specific components
│   │   │   ├── hooks/                # App-specific hooks
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── lib/                  # Utilities
│   │   │   └── styles/               # Global styles
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── pos/                          # POS Terminal (Next.js PWA)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── terminal/         # Main POS screen
│   │   │   │   ├── orders/           # Order management
│   │   │   │   ├── tables/           # Table management
│   │   │   │   └── shift/            # Shift management
│   │   │   ├── components/
│   │   │   ├── stores/
│   │   │   ├── workers/              # Service workers
│   │   │   │   ├── sw.ts             # Main service worker
│   │   │   │   └── sync-worker.ts    # Background sync
│   │   │   └── lib/
│   │   │       ├── offline-db.ts     # IndexedDB wrapper
│   │   │       ├── sync-queue.ts     # Sync engine
│   │   │       └── connectivity.ts   # Network monitor
│   │   └── package.json
│   │
│   ├── kds/                          # Kitchen Display System
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   └── package.json
│   │
│   ├── ordering/                     # Customer QR Ordering (Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── [tenant]/         # Dynamic tenant routing
│   │   │   │   │   ├── [branch]/
│   │   │   │   │   │   ├── menu/
│   │   │   │   │   │   ├── cart/
│   │   │   │   │   │   └── checkout/
│   │   │   └── components/
│   │   └── package.json
│   │
│   ├── kiosk/                        # Self-service Kiosk
│   │   └── ...
│   │
│   ├── mobile/                       # React Native App
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── navigation/
│   │   │   ├── stores/
│   │   │   └── services/
│   │   ├── ios/
│   │   ├── android/
│   │   └── package.json
│   │
│   └── services/                     # Backend Microservices
│       ├── gateway/                  # API Gateway (NestJS)
│       │   ├── src/
│       │   │   ├── main.ts
│       │   │   ├── app.module.ts
│       │   │   ├── middleware/
│       │   │   │   ├── tenant.middleware.ts
│       │   │   │   ├── auth.middleware.ts
│       │   │   │   └── rate-limit.middleware.ts
│       │   │   └── proxy/
│       │   ├── Dockerfile
│       │   └── package.json
│       │
│       ├── auth-service/
│       │   ├── src/
│       │   │   ├── main.ts
│       │   │   ├── auth.module.ts
│       │   │   ├── controllers/
│       │   │   ├── services/
│       │   │   ├── guards/
│       │   │   ├── strategies/
│       │   │   └── dto/
│       │   ├── test/
│       │   ├── Dockerfile
│       │   └── package.json
│       │
│       ├── tenant-service/
│       │   ├── src/
│       │   │   ├── main.ts
│       │   │   ├── tenant.module.ts
│       │   │   ├── controllers/
│       │   │   ├── services/
│       │   │   ├── repositories/
│       │   │   ├── entities/
│       │   │   ├── dto/
│       │   │   └── events/
│       │   ├── test/
│       │   ├── prisma/
│       │   │   └── schema.prisma
│       │   ├── Dockerfile
│       │   └── package.json
│       │
│       ├── order-service/
│       ├── menu-service/
│       ├── pos-service/
│       ├── payment-service/
│       ├── kitchen-service/
│       ├── inventory-service/
│       ├── crm-service/
│       ├── analytics-service/
│       ├── notification-service/
│       ├── hr-service/
│       ├── reservation-service/
│       ├── delivery-service/
│       ├── subscription-service/
│       └── reporting-service/
│
├── packages/                         # Shared packages
│   ├── ui/                           # Design System (@yummy/ui)
│   │   ├── src/
│   │   │   ├── components/           # Shared UI components
│   │   │   │   ├── button/
│   │   │   │   ├── input/
│   │   │   │   ├── modal/
│   │   │   │   ├── table/
│   │   │   │   ├── card/
│   │   │   │   ├── dropdown/
│   │   │   │   ├── toast/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── command-palette/
│   │   │   │   └── ...
│   │   │   ├── motion/               # Animation utilities
│   │   │   │   ├── variants.ts
│   │   │   │   ├── constants.ts
│   │   │   │   ├── easings.ts
│   │   │   │   └── components/
│   │   │   ├── tokens/               # Design tokens
│   │   │   │   ├── colors.ts
│   │   │   │   ├── typography.ts
│   │   │   │   └── spacing.ts
│   │   │   ├── styles/               # Global styles
│   │   │   │   ├── themes/
│   │   │   │   │   ├── light.css
│   │   │   │   │   └── dark.css
│   │   │   │   └── globals.css
│   │   │   └── providers/
│   │   │       └── ThemeProvider.tsx
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── api-client/                   # Generated API client (@yummy/api-client)
│   │   ├── src/
│   │   │   ├── generated/            # OpenAPI generated types
│   │   │   ├── hooks/                # TanStack Query hooks
│   │   │   └── client.ts             # Axios/fetch client
│   │   └── package.json
│   │
│   ├── shared-types/                 # Shared TypeScript types (@yummy/types)
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   ├── events/
│   │   │   ├── dto/
│   │   │   └── enums/
│   │   └── package.json
│   │
│   ├── utils/                        # Shared utilities (@yummy/utils)
│   │   ├── src/
│   │   │   ├── formatting.ts
│   │   │   ├── validation.ts
│   │   │   ├── date.ts
│   │   │   └── currency.ts
│   │   └── package.json
│   │
│   ├── config/                       # Shared configs (@yummy/config)
│   │   ├── eslint/
│   │   ├── tsconfig/
│   │   ├── prettier/
│   │   └── package.json
│   │
│   └── database/                     # Shared DB utilities (@yummy/database)
│       ├── src/
│       │   ├── prisma/
│       │   │   └── schema.prisma
│       │   ├── migrations/
│       │   ├── seeds/
│       │   └── tenant-context.ts
│       └── package.json
│
├── infrastructure/                   # Infrastructure as Code
│   ├── terraform/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── modules/
│   │   │   ├── networking/
│   │   │   ├── compute/
│   │   │   ├── database/
│   │   │   ├── messaging/
│   │   │   ├── storage/
│   │   │   ├── security/
│   │   │   └── observability/
│   │   └── shared/
│   ├── kubernetes/
│   │   ├── base/                     # Kustomize base
│   │   │   ├── namespaces/
│   │   │   ├── services/
│   │   │   └── config/
│   │   └── overlays/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── production/
│   ├── helm/
│   │   └── yummy/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       ├── values-staging.yaml
│   │       ├── values-production.yaml
│   │       └── templates/
│   └── docker/
│       ├── Dockerfile.service        # Base service Dockerfile
│       ├── Dockerfile.web            # Base web Dockerfile
│       └── docker-compose.yml        # Local development
│
├── docs/                             # Documentation
│   ├── architecture/
│   ├── api/
│   ├── runbooks/
│   ├── adr/                          # Architecture Decision Records
│   └── guides/
│
├── scripts/                          # Development scripts
│   ├── setup.sh
│   ├── seed-data.ts
│   ├── generate-api-client.ts
│   └── migrate.ts
│
├── turbo.json                        # Turborepo configuration
├── pnpm-workspace.yaml               # pnpm workspace config
├── package.json                      # Root package.json
├── tsconfig.base.json                # Base TypeScript config
├── .eslintrc.js                      # Root ESLint config
├── .prettierrc                       # Prettier config
├── .env.example                      # Environment variables template
└── README.md
```

## Package Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                  DEPENDENCY GRAPH                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  @yummy/config ──────────────────────────────────────┐      │
│       │                                               │      │
│  @yummy/types ───────────────────────────────────┐   │      │
│       │                                           │   │      │
│  @yummy/utils ──────────────────────────────┐    │   │      │
│       │                                      │    │   │      │
│  @yummy/database ──────────────────────┐    │    │   │      │
│       │                                 │    │    │   │      │
│  @yummy/ui ───────────────────────┐    │    │    │   │      │
│       │                            │    │    │    │   │      │
│  @yummy/api-client ──────────┐    │    │    │    │   │      │
│       │                       │    │    │    │    │   │      │
│       ▼                       ▼    ▼    ▼    ▼    ▼   ▼      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  APPLICATIONS                                        │    │
│  │  web | pos | kds | ordering | kiosk | mobile         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  SERVICES (backend)                                  │    │
│  │  Uses: @yummy/types, @yummy/utils, @yummy/database  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```
