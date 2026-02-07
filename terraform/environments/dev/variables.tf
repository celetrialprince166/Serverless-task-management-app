# Dev Environment Variables
# Sensitive variables must be provided via terraform.tfvars (copy from terraform.tfvars.example).
# terraform.tfvars is auto-loaded - no -var-file needed. Just run: terraform plan / terraform apply

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "taskmanager"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "cors_allowed_origin" {
  description = "Allowed CORS origin (use * for dev, or comma-separated list for production)"
  type        = string
  default     = "*"
}

# -----------------------------------------------------------------------------
# Secrets - provide via terraform.tfvars (DO NOT commit terraform.tfvars)
# -----------------------------------------------------------------------------

variable "ses_from_email" {
  description = "SES From address for notifications. Use your verified identity. Provide via -var-file=secrets.tfvars"
  type        = string
  default     = ""
  sensitive   = true

  validation {
    condition     = var.ses_from_email != ""
    error_message = "ses_from_email is required. Copy terraform.tfvars.example to terraform.tfvars and set your values."
  }
}

variable "allowed_domains" {
  description = "Comma-separated list of allowed email domains for sign-up. Provide via -var-file=secrets.tfvars"
  type        = string
  default     = ""
  sensitive   = true

  validation {
    condition     = var.allowed_domains != ""
    error_message = "allowed_domains is required. Copy terraform.tfvars.example to terraform.tfvars and set your values."
  }
}

variable "cognito_callback_urls" {
  description = "Cognito allowed callback URLs. Provide via -var-file=secrets.tfvars"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.cognito_callback_urls) > 0
    error_message = "cognito_callback_urls is required. Copy terraform.tfvars.example to terraform.tfvars and set your values."
  }
}

variable "cognito_logout_urls" {
  description = "Cognito allowed logout URLs. Provide via -var-file=secrets.tfvars"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.cognito_logout_urls) > 0
    error_message = "cognito_logout_urls is required. Copy terraform.tfvars.example to terraform.tfvars and set your values."
  }
}

# -----------------------------------------------------------------------------
# Optional - Amplify (null = connect manually in Console)
# -----------------------------------------------------------------------------

variable "ses_create_sender_identity" {
  description = "Set to true to have Terraform create the SES email identity."
  type        = bool
  default     = false
}

variable "amplify_branch_name" {
  description = "Git branch to deploy to Amplify"
  type        = string
  default     = "develop"
}

variable "amplify_repository_url" {
  description = "GitHub repository URL for Amplify. Leave null to connect manually."
  type        = string
  default     = null
}

variable "amplify_github_token" {
  description = "GitHub personal access token for Amplify repo access."
  type        = string
  default     = null
  sensitive   = true
}
