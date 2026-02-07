/**
 * Cognito User Pool Module
 *
 * Creates AWS Cognito resources for authentication:
 * - User Pool with password policy
 * - App Client for frontend (no secret, for SPA)
 * - User Groups (Admin, Member)
 * - Pre-signup Lambda trigger for email domain validation
 */

# ==============================================================================
# User Pool
# ==============================================================================

resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-users"

  # Username attributes
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length                   = var.password_minimum_length
    require_lowercase                = var.password_require_lowercase
    require_uppercase                = var.password_require_uppercase
    require_numbers                  = var.password_require_numbers
    require_symbols                  = var.password_require_symbols
    temporary_password_validity_days = var.temporary_password_validity_days
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Schema attributes
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 5
      max_length = 256
    }
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = var.advanced_security_mode
  }

  # MFA configuration
  mfa_configuration = var.mfa_configuration

  # Software token MFA (TOTP) - required when MFA is OPTIONAL or ON
  dynamic "software_token_mfa_configuration" {
    for_each = var.mfa_configuration != "OFF" ? [1] : []
    content {
      enabled = true
    }
  }

  # Lambda triggers - only include if any trigger is enabled
  dynamic "lambda_config" {
    for_each = var.enable_pre_signup_lambda || var.enable_post_confirmation_lambda ? [1] : []
    content {
      pre_sign_up          = var.enable_pre_signup_lambda ? var.pre_signup_lambda_arn : null
      post_confirmation    = var.enable_post_confirmation_lambda ? var.post_confirmation_lambda_arn : null
      post_authentication  = var.enable_post_confirmation_lambda ? var.post_confirmation_lambda_arn : null
    }
  }

  # Deletion protection
  deletion_protection = var.deletion_protection

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-user-pool"
    Environment = var.environment
  })
}


# ==============================================================================
# App Client (for SPA - no client secret)
# ==============================================================================

resource "aws_cognito_user_pool_client" "spa" {
  name         = "${var.project_name}-${var.environment}-spa-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # No secret for SPA (public client)
  generate_secret = false

  # Explicit auth flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
  ]

  # Supported identity providers
  supported_identity_providers = ["COGNITO"]

  # Token validity
  access_token_validity  = var.access_token_validity_hours
  id_token_validity      = var.id_token_validity_hours
  refresh_token_validity = var.refresh_token_validity_days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Callback URLs (for hosted UI, if used)
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # OAuth configuration
  allowed_oauth_flows                  = var.allowed_oauth_flows
  allowed_oauth_flows_user_pool_client = length(var.allowed_oauth_flows) > 0
  allowed_oauth_scopes                 = var.allowed_oauth_scopes

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Read/write attributes
  read_attributes  = ["email", "email_verified", "name", "updated_at"]
  write_attributes = ["email", "name"]
}

# ==============================================================================
# User Groups
# ==============================================================================

resource "aws_cognito_user_group" "admin" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrators with full access to all resources"
  precedence   = 1
}

resource "aws_cognito_user_group" "member" {
  name         = "Member"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Regular members with limited access"
  precedence   = 10
}

# ==============================================================================
# API Gateway Authorizer
# ==============================================================================

resource "aws_api_gateway_authorizer" "cognito" {
  count         = var.api_gateway_rest_api_id != null ? 1 : 0
  name          = "${var.project_name}-${var.environment}-cognito-authorizer"
  rest_api_id   = var.api_gateway_rest_api_id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [aws_cognito_user_pool.main.arn]

  identity_source = "method.request.header.Authorization"
}

# ==============================================================================
# Lambda Permission (for Pre-Signup trigger)
# ==============================================================================

resource "aws_lambda_permission" "cognito_pre_signup" {
  count         = var.enable_pre_signup_lambda ? 1 : 0
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.pre_signup_lambda_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

# ==============================================================================
# Lambda Permission (for Post-Confirmation trigger)
# ==============================================================================

resource "aws_lambda_permission" "cognito_post_confirmation" {
  count         = var.enable_post_confirmation_lambda ? 1 : 0
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = var.post_confirmation_lambda_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
