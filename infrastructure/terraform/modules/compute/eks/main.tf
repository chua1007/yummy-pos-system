variable "project" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "tags" { type = map(string) }

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${var.project}-${var.environment}"
  cluster_version = "1.29"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnet_ids

  cluster_endpoint_public_access  = var.environment == "dev" ? true : false
  cluster_endpoint_private_access = true

  eks_managed_node_groups = {
    application = {
      name           = "app"
      instance_types = var.environment == "dev" ? ["t3.medium"] : ["m5.xlarge"]
      min_size       = var.environment == "dev" ? 2 : 3
      max_size       = var.environment == "dev" ? 4 : 20
      desired_size   = var.environment == "dev" ? 2 : 3

      labels = { role = "application" }
    }
  }

  cluster_addons = {
    coredns    = { most_recent = true }
    kube-proxy = { most_recent = true }
    vpc-cni    = { most_recent = true }
  }

  tags = var.tags
}

output "cluster_endpoint" { value = module.eks.cluster_endpoint }
output "cluster_name" { value = module.eks.cluster_name }
