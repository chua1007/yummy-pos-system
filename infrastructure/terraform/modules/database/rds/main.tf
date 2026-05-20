variable "project" { type = string }
variable "environment" { type = string }
variable "instance_class" { type = string }
variable "allocated_storage" { type = number }
variable "max_allocated_storage" { type = number }
variable "db_subnet_group_name" { type = string }
variable "security_group_id" { type = string }
variable "kms_key_arn" { type = string }
variable "tags" { type = map(string) }

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

  multi_az               = var.environment != "dev"
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.security_group_id]

  backup_retention_period = var.environment == "dev" ? 7 : 30
  storage_encrypted       = true
  kms_key_id             = var.kms_key_arn

  performance_insights_enabled = true
  deletion_protection          = var.environment != "dev"

  tags = var.tags
}

output "endpoint" { value = module.rds.db_instance_endpoint }
