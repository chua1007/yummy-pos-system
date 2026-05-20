terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "yummy-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "yummy-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "yummy"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ─── Variables ────────────────────────────────────────────────

variable "aws_region" {
  default = "ap-southeast-1"
}

variable "environment" {
  default = "dev"
}

variable "project" {
  default = "yummy"
}

# ─── Networking ───────────────────────────────────────────────

module "vpc" {
  source = "../../modules/networking/vpc"

  project     = var.project
  environment = var.environment
  cidr_block  = "10.0.0.0/16"
  azs         = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}

# ─── EKS Cluster ─────────────────────────────────────────────

module "eks" {
  source = "../../modules/compute/eks"

  project            = var.project
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

# ─── Database ─────────────────────────────────────────────────

module "rds" {
  source = "../../modules/database/rds"

  project              = var.project
  environment          = var.environment
  instance_class       = "db.t3.medium"
  allocated_storage    = 20
  max_allocated_storage = 100
  db_subnet_group_name = module.vpc.db_subnet_group_name
  security_group_id    = module.vpc.rds_security_group_id
  kms_key_arn          = module.kms.key_arn

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

# ─── Redis ────────────────────────────────────────────────────

module "redis" {
  source = "../../modules/database/elasticache"

  project            = var.project
  environment        = var.environment
  node_type          = "cache.t3.small"
  subnet_group_name  = module.vpc.elasticache_subnet_group_name
  security_group_id  = module.vpc.redis_security_group_id
}

# ─── KMS ──────────────────────────────────────────────────────

module "kms" {
  source = "../../modules/security/kms"

  project     = var.project
  environment = var.environment
}

# ─── Outputs ──────────────────────────────────────────────────

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value     = module.rds.endpoint
  sensitive = true
}

output "redis_endpoint" {
  value = module.redis.endpoint
}
