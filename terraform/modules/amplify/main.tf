/**
 * Amplify Hosting Module
 *
 * Creates AWS Amplify app for frontend hosting.
 * Connect to GitHub manually in Amplify Console or provide repository_url + access_token.
 */

resource "aws_amplify_app" "main" {
  name        = "${var.project_name}-${var.environment}-frontend"
  description = "Task Management System - ${var.environment} frontend"

  # Build specification - used when Amplify has no amplify.yml in repo
  build_spec = var.build_spec

  # Environment variables for Vite build (Cognito, API)
  environment_variables = merge(
    {
      VITE_AWS_REGION           = var.aws_region
      VITE_COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      VITE_COGNITO_CLIENT_ID    = var.cognito_client_id
      VITE_API_BASE_URL         = var.api_base_url
      AMPLIFY_MONOREPO_APP_ROOT = "frontend"
    },
    var.extra_environment_variables
  )

  # Git repository - omit to connect manually in Amplify Console
  repository   = var.repository_url
  access_token = var.github_access_token != null ? var.github_access_token : null

  # Enable auto branch creation for PR previews (optional)
  enable_auto_branch_creation = var.enable_auto_branch_creation
  auto_branch_creation_patterns = var.auto_branch_creation_patterns

  # Default redirect for SPA - all paths to index.html
  custom_rule {
    source = "/<*>"
    status = "404"
    target = "/index.html"
  }

  tags = merge(var.tags, {
    Module      = "amplify"
    Project     = var.project_name
    Environment = var.environment
  })
}

# Primary branch (dev or main)
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = var.branch_name

  enable_auto_build = true
  enable_pull_request_preview = var.enable_pr_preview

  environment_variables = var.branch_environment_variables

  tags = merge(var.tags, {
    Branch = var.branch_name
  })
}
