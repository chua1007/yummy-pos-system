# 🍽️ Yummy - Cloud-Native F&B Restaurant Management Ecosystem

> A production-grade, multi-tenant SaaS platform for restaurants, cafes, cloud kitchens, franchises, food chains, and retail food businesses across Southeast Asia.

## Quick Links

- [Executive Summary](./docs/01-executive-summary.md)
- [System Architecture](./docs/02-system-architecture.md)
- [Infrastructure & AWS](./docs/03-infrastructure-aws.md)
- [Database Design](./docs/04-database-design.md)
- [Microservices](./docs/05-microservices.md)
- [API Design](./docs/06-api-design.md)
- [DevOps & CI/CD](./docs/07-devops-cicd.md)
- [Security](./docs/08-security.md)
- [Frontend & UI/UX](./docs/09-frontend-ui-ux.md)
- [Motion & Animations](./docs/10-motion-design.md)
- [SaaS & Multi-Tenancy](./docs/11-saas-multi-tenancy.md)
- [Offline POS](./docs/12-offline-pos.md)
- [Observability](./docs/13-observability.md)
- [Scalability & HA](./docs/14-scalability-ha.md)
- [Cost Estimation](./docs/15-cost-estimation.md)
- [Roadmap](./docs/16-roadmap.md)
- [Repository Structure](./docs/17-repository-structure.md)
- [Engineering Standards](./docs/18-engineering-standards.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, TailwindCSS, shadcn/ui, Framer Motion, Zustand |
| Backend | NestJS Microservices, TypeScript |
| Mobile | React Native |
| Database | PostgreSQL (RDS) |
| Cache | Redis (ElastiCache) |
| Events | Kafka (MSK) / EventBridge |
| Auth | AWS Cognito + RBAC |
| Infra | Docker, Kubernetes (EKS), Terraform |
| Cloud | AWS-native |
| CI/CD | GitLab CI/CD, ECR, ECS/EKS |
| Observability | Prometheus, Grafana, Loki |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, Kafka)
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Copy environment variables
cp .env.example .env

# Start web dashboard (port 3000)
pnpm --filter @yummy/web dev

# Start POS terminal (port 3001)
pnpm --filter @yummy/pos dev

# Start API gateway (port 4000)
pnpm --filter @yummy/gateway dev

# Or run setup script
./scripts/setup.sh
```

## Project Structure

```
yummy/
├── apps/
│   ├── web/                  # Dashboard (Next.js) - port 3000
│   ├── pos/                  # POS Terminal (Next.js PWA) - port 3001
│   └── services/
│       ├── gateway/          # API Gateway (NestJS) - port 4000
│       └── order-service/    # Order Service (NestJS) - port 4001
├── packages/
│   ├── ui/                   # Design System (@yummy/ui)
│   └── shared-types/         # Shared TypeScript types (@yummy/types)
├── infrastructure/
│   ├── docker/               # Local development (docker-compose)
│   └── terraform/            # AWS infrastructure (EKS, RDS, etc.)
└── docs/                     # Architecture documentation
```

## License

Proprietary - All rights reserved.
