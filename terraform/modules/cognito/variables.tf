/**
 * Cognito Module Variables
 */

# ==============================================================================
# Required Variables
# ==============================================================================

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
}

# ==============================================================================
# Password Policy
# ==============================================================================

variable "password_minimum_length" {
  description = "Minimum password length"
  type        = number
  default     = 12
}

variable "password_require_lowercase" {
  description = "Require lowercase characters"
  type        = bool
  default     = true
}

variable "password_require_uppercase" {
  description = "Require uppercase characters"
  type        = bool
  default     = true
}

variable "password_require_numbers" {
  description = "Require numbers"
  type        = bool
  default     = true
}

variable "password_require_symbols" {
  description = "Require symbols"
  type        = bool
  default     = true
}

variable "temporary_password_validity_days" {
  description = "Days before temporary password expires"
  type        = number
  default     = 7
}

# ==============================================================================
# Token Configuration
# ==============================================================================

variable "access_token_validity_hours" {
  description = "Access token validity in hours"
  type        = number
  default     = 1
}

variable "id_token_validity_hours" {
  description = "ID token validity in hours"
  type        = number
  default     = 1
}

variable "refresh_token_validity_days" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

# ==============================================================================
# OAuth Configuration
# ==============================================================================

variable "callback_urls" {
  description = "Allowed callback URLs for OAuth"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "logout_urls" {
  description = "Allowed logout URLs"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

variable "allowed_oauth_flows" {
  description = "Allowed OAuth flows"
  type        = list(string)
  default     = ["code"]
}

variable "allowed_oauth_scopes" {
  description = "Allowed OAuth scopes"
  type        = list(string)
  default     = ["email", "openid", "profile"]
}

# ==============================================================================
# Security Configuration
# ==============================================================================

variable "mfa_configuration" {
  description = "MFA configuration (OFF, ON, OPTIONAL)"
  type        = string
  default     = "OPTIONAL"
}

variable "advanced_security_mode" {
  description = "Advanced security mode (OFF, AUDIT, ENFORCED)"
  type        = string
  default     = "AUDIT"
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = string
  default     = "INACTIVE"
}

# ==============================================================================
# Lambda Triggers
# ==============================================================================

variable "enable_pre_signup_lambda" {
  description = "Whether to enable the pre-signup Lambda trigger"
  type        = bool
  default     = false
}

variable "pre_signup_lambda_arn" {
  description = "ARN of pre-signup Lambda function"
  type        = string
  default     = null
}

variable "pre_signup_lambda_name" {
  description = "Name of pre-signup Lambda function (for permission)"
  type        = string
  default     = null
}

variable "enable_post_confirmation_lambda" {
  description = "Whether to enable the post-confirmation Lambda trigger"
  type        = bool
  default     = false
}

variable "post_confirmation_lambda_arn" {
  description = "ARN of post-confirmation Lambda function"
  type        = string
  default     = null
}

variable "post_confirmation_lambda_name" {
  description = "Name of post-confirmation Lambda function (for permission)"
  type        = string
  default     = null
}


# ==============================================================================
# API Gateway Integration
# ==============================================================================

variable "api_gateway_rest_api_id" {
  description = "REST API ID for Cognito authorizer"
  type        = string
  default     = null
}

# ==============================================================================
# Tags
# ==============================================================================

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
