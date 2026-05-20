variable "project" { type = string }
variable "environment" { type = string }

resource "aws_kms_key" "main" {
  description             = "Yummy ${var.environment} encryption key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project}-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

output "key_arn" { value = aws_kms_key.main.arn }
output "key_id" { value = aws_kms_key.main.key_id }
