# Dev Environment Configuration
# Task Management System - Development

terraform {
  required_version = ">= 1.6.0"

  # S3 backend - config values provided via -backend-config=backend.hcl
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = var.aws_region

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# DynamoDB Tables
module "tasks_table" {
  source = "../../modules/dynamodb"

  project_name = var.project_name
  environment  = var.environment
  table_name   = "tasks"

  hash_key  = "PK"
  range_key = "SK"

  attributes = [
    { name = "PK", type = "S" },
    { name = "SK", type = "S" },
    { name = "GSI1PK", type = "S" },
    { name = "GSI1SK", type = "S" },
    { name = "GSI2PK", type = "S" },
    { name = "GSI2SK", type = "S" }
  ]

  global_secondary_indexes = [
    {
      name            = "GSI1"
      hash_key        = "GSI1PK"
      range_key       = "GSI1SK"
      projection_type = "ALL"
    },
    {
      name            = "GSI2"
      hash_key        = "GSI2PK"
      range_key       = "GSI2SK"
      projection_type = "ALL"
    }
  ]

  stream_enabled = true # For notifications in Phase 4

  tags = local.common_tags
}

module "users_table" {
  source = "../../modules/dynamodb"

  project_name = var.project_name
  environment  = var.environment
  table_name   = "users"

  hash_key  = "PK"
  range_key = "SK"

  attributes = [
    { name = "PK", type = "S" },
    { name = "SK", type = "S" },
    { name = "GSI1PK", type = "S" }
  ]

  global_secondary_indexes = [
    {
      name            = "GSI1"
      hash_key        = "GSI1PK"
      range_key       = "SK"
      projection_type = "ALL"
    }
  ]

  tags = local.common_tags
}

# API Gateway
module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name        = var.project_name
  environment         = var.environment
  cors_allowed_origin = var.cors_allowed_origin
  deployment_trigger  = timestamp()
  route_config_hash   = filesha1("${path.module}/api-routes.tf")
  # Ensure deployment runs after all dev route methods have integrations
  deployment_depends_on = null_resource.api_routes_ready

  tags = local.common_tags
}

# IAM Policies
module "iam_policies" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = var.environment

  dynamodb_table_arns = [
    module.tasks_table.table_arn,
    module.users_table.table_arn
  ]

  tags = local.common_tags
}

# Notifications (Phase 4) - SNS topic for task events
module "notifications" {
  source = "../../modules/notifications"

  project_name = var.project_name
  environment  = var.environment

  tags = local.common_tags
}

# Cognito User Pool
module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
  environment  = var.environment

  # Callback URLs for Auth - add Amplify URL after first deploy
  callback_urls = var.cognito_callback_urls
  logout_urls   = var.cognito_logout_urls

  # Lambda Triggers
  enable_pre_signup_lambda = true
  pre_signup_lambda_arn    = module.lambda_pre_signup.function_arn
  pre_signup_lambda_name   = module.lambda_pre_signup.function_name

  enable_post_confirmation_lambda = true
  post_confirmation_lambda_arn    = module.lambda_post_confirmation.function_arn
  post_confirmation_lambda_name   = module.lambda_post_confirmation.function_name

  # API Gateway Integration
  api_gateway_rest_api_id = module.api_gateway.api_id

  # Password Policy (matching task.md requirements)
  password_minimum_length    = 12
  password_require_lowercase = true
  password_require_uppercase = true
  password_require_numbers   = true
  password_require_symbols   = true

  tags = local.common_tags
}



