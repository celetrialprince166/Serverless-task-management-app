# Cognito Module

Creates AWS Cognito resources for user authentication.

## Resources Created

- **User Pool** - With password policy and email verification
- **App Client** - SPA client (no secret)
- **User Groups** - Admin and Member groups
- **API Gateway Authorizer** - Cognito authorizer (optional)

## Usage

```hcl
module "cognito" {
  source = "../../modules/cognito"

  project_name = "taskmanager"
  environment  = "dev"

  # Optional: Connect to API Gateway
  api_gateway_rest_api_id = module.api_gateway.rest_api_id

  # Optional: Pre-signup Lambda trigger
  pre_signup_lambda_arn  = module.pre_signup_lambda.function_arn
  pre_signup_lambda_name = module.pre_signup_lambda.function_name

  tags = var.tags
}
```

## Outputs

| Output | Description |
|--------|-------------|
| `user_pool_id` | Cognito User Pool ID |
| `client_id` | SPA App Client ID |
| `authorizer_id` | API Gateway Cognito Authorizer ID |
| `auth_config` | Frontend configuration for Amplify |
