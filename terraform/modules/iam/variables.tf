# IAM Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "dynamodb_table_arns" {
  description = "List of DynamoDB table ARNs for CRUD access"
  type        = list(string)
  default     = []
}

variable "sns_topic_arns" {
  description = "List of SNS topic ARNs for publish access"
  type        = list(string)
  default     = []
}

variable "enable_ses" {
  description = "Enable SES send email policy"
  type        = bool
  default     = false
}

variable "ses_identity_arns" {
  description = "List of SES identity ARNs"
  type        = list(string)
  default     = ["*"]
}

variable "secrets_arns" {
  description = "List of Secrets Manager secret ARNs"
  type        = list(string)
  default     = []
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN for read access"
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
