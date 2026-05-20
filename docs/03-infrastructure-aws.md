# Infrastructure & AWS Cloud Architecture

## AWS Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUD                                        │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         EDGE / GLOBAL                                │    │
│  │  Route53 ──▶ CloudFront ──▶ WAF ──▶ Shield Advanced                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    VPC (10.0.0.0/16)                                  │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │              PUBLIC SUBNETS (10.0.1.0/24, 10.0.2.0/24)       │    │    │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │    │    │
│  │  │  │ ALB          │  │ NAT Gateway  │  │ Bastion Host │      │    │    │
│  │  │  │ (API Gateway)│  │ (HA pair)    │  │ (SSM Session)│      │    │    │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘      │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                    │                                 │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │           PRIVATE SUBNETS (10.0.10.0/24, 10.0.11.0/24)      │    │    │
│  │  │                                                               │    │    │
│  │  │  ┌──────────────────────────────────────────────────────┐   │    │    │
│  │  │  │                 EKS CLUSTER                            │   │    │    │
│  │  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │   │    │    │
│  │  │  │  │Node Grp│ │Node Grp│ │Node Grp│ │Fargate │        │   │    │    │
│  │  │  │  │(system)│ │(app)   │ │(worker)│ │(batch) │        │   │    │    │
│  │  │  │  └────────┘ └────────┘ └────────┘ └────────┘        │   │    │    │
│  │  │  └──────────────────────────────────────────────────────┘   │    │    │
│  │  │                                                               │    │    │
│  │  │  ┌──────────────────────────────────────────────────────┐   │    │    │
│  │  │  │              MANAGED SERVICES                          │   │    │    │
│  │  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │    │    │
│  │  │  │  │RDS      │ │ElastiCa.│ │MSK      │ │OpenSrch │   │   │    │    │
│  │  │  │  │PostgreSQL│ │Redis    │ │Kafka    │ │         │   │   │    │    │
│  │  │  │  │Multi-AZ │ │Cluster  │ │3-broker │ │         │   │   │    │    │
│  │  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │    │    │
│  │  │  └──────────────────────────────────────────────────────┘   │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │                                                                       │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │           ISOLATED SUBNETS (10.0.20.0/24, 10.0.21.0/24)     │    │    │
│  │  │  ┌─────────────────┐  ┌─────────────────┐                   │    │    │
│  │  │  │ RDS Read Replicas│  │ Backup/DR       │                   │    │    │
│  │  │  └─────────────────┘  └─────────────────┘                   │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SERVERLESS / MANAGED                               │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │    │
│  │  │Cognito  │ │S3       │ │SQS/SNS  │ │EventBr. │ │Lambda   │     │    │
│  │  │(Auth)   │ │(Storage)│ │(Queues) │ │(Events) │ │(Glue)   │     │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    SECURITY & COMPLIANCE                              │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │    │
│  │  │GuardDuty│ │Sec. Hub │ │KMS      │ │Secrets  │ │CloudTrl │     │    │
│  │  │         │ │         │ │(Encrypt)│ │Manager  │ │(Audit)  │     │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Multi-Region Strategy

```
                    ┌──────────────────┐
                    │   Route53        │
                    │   (Latency-based)│
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ ap-south-  │  │ ap-south-  │  │ ap-north-  │
     │ east-1     │  │ east-2     │  │ east-1     │
     │ (Singapore)│  │ (Jakarta)  │  │ (Tokyo)    │
     │ PRIMARY    │  │ SECONDARY  │  │ DR         │
     └────────────┘  └────────────┘  └────────────┘
```

## Network Architecture

### VPC Design
- **CIDR**: 10.0.0.0/16 (65,536 IPs)
- **AZs**: Minimum 3 for high availability
- **Subnet Strategy**: Public / Private / Isolated per AZ

### Security Groups
```
┌─────────────────────────────────────────────────┐
│ Security Group Strategy                          │
├─────────────────────────────────────────────────┤
│ sg-alb        → Inbound: 443 from 0.0.0.0/0    │
│ sg-eks-nodes  → Inbound: All from sg-alb        │
│ sg-rds        → Inbound: 5432 from sg-eks-nodes │
│ sg-redis      → Inbound: 6379 from sg-eks-nodes │
│ sg-kafka      → Inbound: 9092 from sg-eks-nodes │
│ sg-opensearch → Inbound: 443 from sg-eks-nodes  │
└─────────────────────────────────────────────────┘
```

## EKS Cluster Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EKS CLUSTER                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Namespaces:                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ yummy-system    │ Ingress, cert-manager, monitoring   │   │
│  │ yummy-services  │ Core microservices                  │   │
│  │ yummy-workers   │ Background job processors           │   │
│  │ yummy-data      │ Kafka Connect, data pipelines       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Node Groups:                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ system    │ m5.large   │ 2-4 nodes │ System workloads │   │
│  │ app       │ m5.xlarge  │ 3-20 nodes│ App services     │   │
│  │ worker    │ c5.xlarge  │ 2-10 nodes│ CPU-intensive    │   │
│  │ spot      │ m5.xlarge  │ 0-10 nodes│ Batch/non-crit   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Add-ons:                                                    │
│  - AWS Load Balancer Controller                              │
│  - Cluster Autoscaler / Karpenter                            │
│  - External DNS                                              │
│  - Cert Manager                                              │
│  - AWS EBS CSI Driver                                        │
│  - AWS EFS CSI Driver                                        │
│  - Metrics Server                                            │
│  - Fluent Bit (logging)                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## AWS Service Mapping

| Component | AWS Service | Configuration |
|-----------|-------------|---------------|
| DNS | Route53 | Hosted zones, health checks, failover |
| CDN | CloudFront | Edge caching, custom domains, SSL |
| WAF | AWS WAF | Rate limiting, geo-blocking, OWASP rules |
| DDoS | Shield Advanced | Layer 3/4/7 protection |
| Load Balancer | ALB | Path-based routing, gRPC support |
| Container Orchestration | EKS | Managed Kubernetes 1.28+ |
| Container Registry | ECR | Image scanning, lifecycle policies |
| Compute | EC2 (EKS nodes) | Auto Scaling Groups, mixed instances |
| Serverless Compute | Lambda | Event handlers, cron jobs |
| Database | RDS PostgreSQL | Multi-AZ, 15 read replicas |
| Cache | ElastiCache Redis | Cluster mode, 6.x+ |
| Event Streaming | MSK (Kafka) | 3-broker, multi-AZ |
| Event Bus | EventBridge | Cross-service event routing |
| Queue | SQS | Standard + FIFO queues |
| Notifications | SNS | Push, SMS, email fanout |
| Search | OpenSearch | 3-node cluster, UltraWarm |
| Object Storage | S3 | Intelligent tiering, versioning |
| Auth | Cognito | User pools, identity pools |
| Secrets | Secrets Manager | Auto-rotation, cross-account |
| Config | AppConfig | Feature flags, gradual deploy |
| Monitoring | CloudWatch | Metrics, alarms, dashboards |
| Tracing | X-Ray | Distributed tracing |
| Audit | CloudTrail | API audit logging |
| Security | GuardDuty | Threat detection |
| Compliance | Security Hub | Security posture |
| Encryption | KMS | CMK for all data at rest |
| Backup | AWS Backup | Automated, cross-region |

## Terraform Module Structure

```
infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars
│   │   ├── staging/
│   │   └── production/
│   ├── modules/
│   │   ├── networking/
│   │   │   ├── vpc/
│   │   │   ├── subnets/
│   │   │   ├── security-groups/
│   │   │   └── nat-gateway/
│   │   ├── compute/
│   │   │   ├── eks/
│   │   │   ├── node-groups/
│   │   │   └── lambda/
│   │   ├── database/
│   │   │   ├── rds/
│   │   │   ├── elasticache/
│   │   │   └── opensearch/
│   │   ├── messaging/
│   │   │   ├── msk/
│   │   │   ├── sqs/
│   │   │   └── sns/
│   │   ├── storage/
│   │   │   ├── s3/
│   │   │   └── efs/
│   │   ├── security/
│   │   │   ├── cognito/
│   │   │   ├── kms/
│   │   │   ├── waf/
│   │   │   └── secrets-manager/
│   │   ├── observability/
│   │   │   ├── cloudwatch/
│   │   │   ├── prometheus/
│   │   │   └── grafana/
│   │   └── cicd/
│   │       ├── ecr/
│   │       └── codepipeline/
│   └── shared/
│       ├── backend.tf
│       ├── providers.tf
│       └── versions.tf
```

## Terraform Example: EKS Module

```hcl
# modules/compute/eks/main.tf

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "${var.project}-${var.environment}"
  cluster_version = "1.28"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  cluster_endpoint_public_access  = false
  cluster_endpoint_private_access = true

  eks_managed_node_groups = {
    system = {
      name           = "system"
      instance_types = ["m5.large"]
      min_size       = 2
      max_size       = 4
      desired_size   = 2

      labels = {
        role = "system"
      }

      taints = [{
        key    = "CriticalAddonsOnly"
        effect = "NO_SCHEDULE"
      }]
    }

    application = {
      name           = "application"
      instance_types = ["m5.xlarge"]
      min_size       = 3
      max_size       = 20
      desired_size   = 3

      labels = {
        role = "application"
      }
    }

    worker = {
      name           = "worker"
      instance_types = ["c5.xlarge"]
      min_size       = 2
      max_size       = 10
      desired_size   = 2

      labels = {
        role = "worker"
      }
    }
  }

  manage_aws_auth_configmap = true

  aws_auth_roles = var.aws_auth_roles

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  tags = var.tags
}
```

## Terraform Example: RDS Module

```hcl
# modules/database/rds/main.tf

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.project}-${var.environment}"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage

  db_name  = "yummy"
  username = "yummy_admin"
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.security_group_id]

  maintenance_window      = "Mon:00:00-Mon:03:00"
  backup_window           = "03:00-06:00"
  backup_retention_period = 30

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  deletion_protection = true
  storage_encrypted   = true
  kms_key_id         = var.kms_key_arn

  parameters = [
    {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements,pgaudit"
    },
    {
      name  = "log_statement"
      value = "mod"
    }
  ]

  tags = var.tags
}
```
