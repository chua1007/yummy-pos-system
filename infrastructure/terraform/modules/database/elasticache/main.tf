variable "project" { type = string }
variable "environment" { type = string }
variable "node_type" { type = string }
variable "subnet_group_name" { type = string }
variable "security_group_id" { type = string }

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${var.project}-${var.environment}"
  description          = "Yummy Redis cluster"

  node_type            = var.node_type
  num_cache_clusters   = var.environment == "dev" ? 1 : 2
  port                 = 6379
  engine_version       = "7.0"
  parameter_group_name = "default.redis7"

  subnet_group_name  = var.subnet_group_name
  security_group_ids = [var.security_group_id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  automatic_failover_enabled = var.environment != "dev"

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

output "endpoint" { value = aws_elasticache_replication_group.redis.primary_endpoint_address }
