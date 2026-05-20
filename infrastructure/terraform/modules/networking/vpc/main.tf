variable "project" { type = string }
variable "environment" { type = string }
variable "cidr_block" { type = string }
variable "azs" { type = list(string) }

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project}-${var.environment}"
  cidr = var.cidr_block
  azs  = var.azs

  private_subnets  = [for i, az in var.azs : cidrsubnet(var.cidr_block, 4, i)]
  public_subnets   = [for i, az in var.azs : cidrsubnet(var.cidr_block, 4, i + 4)]
  database_subnets = [for i, az in var.azs : cidrsubnet(var.cidr_block, 4, i + 8)]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment == "dev" ? true : false
  enable_dns_hostnames = true
  enable_dns_support   = true

  # EKS requirements
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

output "vpc_id" { value = module.vpc.vpc_id }
output "private_subnet_ids" { value = module.vpc.private_subnets }
output "public_subnet_ids" { value = module.vpc.public_subnets }
output "db_subnet_group_name" { value = module.vpc.database_subnet_group_name }
output "elasticache_subnet_group_name" { value = module.vpc.elasticache_subnet_group_name }
output "rds_security_group_id" { value = "" }
output "redis_security_group_id" { value = "" }
