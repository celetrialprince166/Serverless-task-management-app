# Main resources for the module
# Replace <MODULE_NAME> with actual module name

# Example resource pattern
# resource "aws_<resource_type>" "this" {
#   name = "${var.project_name}-${var.environment}-<resource>"
#
#   tags = local.common_tags
# }

locals {
  common_tags = merge(var.tags, {
    Module      = "<module-name>"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  })
}
