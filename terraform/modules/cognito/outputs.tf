/**
 * Cognito Module Outputs
 */

# ==============================================================================
# User Pool
# ==============================================================================

output "user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.arn
}

output "user_pool_endpoint" {
  description = "Endpoint URL of the User Pool"
  value       = aws_cognito_user_pool.main.endpoint
}

# ==============================================================================
# App Client
# ==============================================================================

output "client_id" {
  description = "ID of the SPA app client"
  value       = aws_cognito_user_pool_client.spa.id
}

output "client_name" {
  description = "Name of the SPA app client"
  value       = aws_cognito_user_pool_client.spa.name
}

# ==============================================================================
# Groups
# ==============================================================================

output "admin_group_name" {
  description = "Name of the Admin group"
  value       = aws_cognito_user_group.admin.name
}

output "member_group_name" {
  description = "Name of the Member group"
  value       = aws_cognito_user_group.member.name
}

# ==============================================================================
# API Gateway Authorizer
# ==============================================================================

output "authorizer_id" {
  description = "ID of the Cognito API Gateway authorizer"
  value       = length(aws_api_gateway_authorizer.cognito) > 0 ? aws_api_gateway_authorizer.cognito[0].id : null
}

# ==============================================================================
# Frontend Config (for Amplify)
# ==============================================================================

output "auth_config" {
  description = "Auth configuration for frontend (Amplify)"
  value = {
    region           = data.aws_region.current.id
    user_pool_id     = aws_cognito_user_pool.main.id
    client_id        = aws_cognito_user_pool_client.spa.id
    oauth_domain     = null # Set if using hosted UI
    oauth_scopes     = var.allowed_oauth_scopes
    redirect_signin  = var.callback_urls
    redirect_signout = var.logout_urls
  }
}

# ==============================================================================
# Data Sources
# ==============================================================================

data "aws_region" "current" {}
