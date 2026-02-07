# API Gateway Module Variables

variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "description" {
  description = "Description of the API"
  type        = string
  default     = "Task Management System REST API"
}

variable "endpoint_type" {
  description = "API endpoint type (REGIONAL, EDGE, PRIVATE)"
  type        = string
  default     = "REGIONAL"
}

variable "cors_allowed_origin" {
  description = "Allowed origin for CORS (* or specific domain)"
  type        = string
  default     = "*"
}

variable "deployment_trigger" {
  description = "Value to trigger redeployment (hash of API config)"
  type        = string
  default     = "initial"
}

variable "route_config_hash" {
  description = "Hash of the route configuration file to trigger redeployment"
  type        = string
  default     = ""
}

variable "enable_access_logs" {
  description = "Enable API Gateway access logging"
  type        = bool
  default     = true
}

variable "enable_execution_logs" {
  description = "Enable API Gateway execution logging"
  type        = bool
  default     = true
}

variable "enable_xray" {
  description = "Enable X-Ray tracing"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 30
}

variable "throttling_burst_limit" {
  description = "API throttling burst limit"
  type        = number
  default     = 100
}

variable "throttling_rate_limit" {
  description = "API throttling rate limit (requests per second)"
  type        = number
  default     = 50
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "deployment_depends_on" {
  description = "Optional single resource (e.g. a null_resource that depends on all route integrations) so deployment runs after every method has an integration"
  type        = any
  default     = null
}
