# Amplify Module Variables

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID for auth"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
  type        = string
}

variable "api_base_url" {
  description = "API Gateway base URL (including /api/v1)"
  type        = string
}

variable "branch_name" {
  description = "Git branch to deploy (e.g. develop, main)"
  type        = string
  default     = "develop"
}

variable "repository_url" {
  description = "GitHub repository URL (e.g. https://github.com/org/repo). Leave null to connect manually."
  type        = string
  default     = null
}

variable "github_access_token" {
  description = "GitHub personal access token for repo access. Required if repository_url is set."
  type        = string
  default     = null
  sensitive   = true
}

variable "build_spec" {
  description = "Amplify build specification YAML. Fallback when no amplify.yml in repo."
  type        = string
  default     = <<-EOT
    version: 1
    applications:
      - appRoot: frontend
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: dist
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
    EOT
}

variable "enable_auto_branch_creation" {
  description = "Enable automatic branch creation for PR previews"
  type        = bool
  default     = false
}

variable "auto_branch_creation_patterns" {
  description = "Branch patterns for auto-creation (e.g. feature/*)"
  type        = list(string)
  default     = []
}

variable "enable_pr_preview" {
  description = "Enable pull request preview deployments"
  type        = bool
  default     = true
}

variable "branch_environment_variables" {
  description = "Extra environment variables for the branch"
  type        = map(string)
  default     = {}
}

variable "extra_environment_variables" {
  description = "Extra environment variables for the app"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
