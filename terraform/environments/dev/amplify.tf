# Amplify Hosting - Frontend
# Deploys the React frontend. Connect to GitHub manually in Amplify Console if not using repository_url.

module "amplify" {
  source = "../../modules/amplify"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.client_id
  api_base_url         = module.api_gateway.api_endpoint

  branch_name = var.amplify_branch_name

  # Optional: Set to connect to GitHub. Otherwise connect manually in Amplify Console.
  repository_url     = var.amplify_repository_url
  github_access_token = var.amplify_github_token

  tags = local.common_tags
}
