# Dev Environment Outputs

output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api_gateway.api_endpoint
}

output "api_id" {
  description = "API Gateway ID"
  value       = module.api_gateway.api_id
}

output "tasks_table_name" {
  description = "Tasks DynamoDB table name"
  value       = module.tasks_table.table_name
}

output "users_table_name" {
  description = "Users DynamoDB table name"
  value       = module.users_table.table_name
}

output "tasks_table_arn" {
  description = "Tasks DynamoDB table ARN"
  value       = module.tasks_table.table_arn
}

output "users_table_arn" {
  description = "Users DynamoDB table ARN"
  value       = module.users_table.table_arn
}

output "dynamodb_policy_arn" {
  description = "DynamoDB CRUD policy ARN"
  value       = module.iam_policies.dynamodb_crud_policy_arn
}

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "user_pool_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.client_id
}

output "authorizer_id" {
  description = "API Gateway Authorizer ID"
  value       = module.cognito.authorizer_id
}

# # Amplify Frontend
# output "amplify_app_id" {
#   description = "Amplify App ID"
#   value       = module.amplify.app_id
# }

# output "amplify_branch_url" {
#   description = "Amplify deployed frontend URL"
#   value       = module.amplify.branch_url
# }
