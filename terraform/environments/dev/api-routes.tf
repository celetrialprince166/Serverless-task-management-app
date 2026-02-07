# ==============================================================================
# API Gateway Routes - Lambda Integrations
# ==============================================================================
# Connects API Gateway endpoints to Lambda functions
# Uses AWS_PROXY integration for direct Lambda invocation

# ------------------------------------------------------------------------------
# Local Variables
# ------------------------------------------------------------------------------
locals {
  api_id         = module.api_gateway.api_id
  v1_resource_id = module.api_gateway.v1_resource_id
  execution_arn  = module.api_gateway.execution_arn
  authorizer_id  = module.cognito.authorizer_id
}

# ------------------------------------------------------------------------------
# Health Endpoint (Override with Lambda instead of MOCK)
# ------------------------------------------------------------------------------
# Note: Using root /health for public health check
resource "aws_api_gateway_resource" "health_root" {
  rest_api_id = local.api_id
  parent_id   = module.api_gateway.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.health_root.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_get" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.health_root.id
  http_method             = aws_api_gateway_method.health_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_health.invoke_arn
}

resource "aws_lambda_permission" "health_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_health.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# ------------------------------------------------------------------------------
# Tasks Resource (/api/v1/tasks)
# ------------------------------------------------------------------------------
resource "aws_api_gateway_resource" "tasks" {
  rest_api_id = local.api_id
  parent_id   = local.v1_resource_id
  path_part   = "tasks"
}

resource "aws_api_gateway_resource" "task_id" {
  rest_api_id = local.api_id
  parent_id   = aws_api_gateway_resource.tasks.id
  path_part   = "{taskId}"
}

resource "aws_api_gateway_resource" "task_assign" {
  rest_api_id = local.api_id
  parent_id   = aws_api_gateway_resource.task_id.id
  path_part   = "assign"
}

# /api/v1/tasks/{taskId}/assignments (frontend uses this path)
resource "aws_api_gateway_resource" "task_assignments" {
  rest_api_id = local.api_id
  parent_id   = aws_api_gateway_resource.task_id.id
  path_part   = "assignments"
}

# --- OPTIONS /api/v1/tasks/{taskId}/assignments (CORS preflight) ---
resource "aws_api_gateway_method" "task_assignments_options" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_assignments.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "task_assignments_options" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_assignments.id
  http_method = aws_api_gateway_method.task_assignments_options.http_method
  type        = "MOCK"

  # WHEN_NO_MATCH allows OPTIONS without Content-Type to pass through
  passthrough_behavior = "WHEN_NO_MATCH"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "task_assignments_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_assignments.id
  http_method = aws_api_gateway_method.task_assignments_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "task_assignments_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_assignments.id
  http_method = aws_api_gateway_method.task_assignments_options.http_method
  status_code = aws_api_gateway_method_response.task_assignments_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# --- POST /api/v1/tasks/{taskId}/assignments (Assign users to task) ---
resource "aws_api_gateway_method" "task_assignments_post" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_assignments.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id

  request_parameters = {
    "method.request.path.taskId" = true
  }
}

resource "aws_api_gateway_integration" "task_assignments_post" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.task_assignments.id
  http_method             = aws_api_gateway_method.task_assignments_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_tasks_assign.invoke_arn
}

resource "aws_lambda_permission" "tasks_assignments_post_apigw" {
  statement_id  = "AllowAPIGatewayInvokeAssignments"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_tasks_assign.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# --- POST /api/v1/tasks (Create Task) ---
resource "aws_api_gateway_method" "tasks_post" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id
}

resource "aws_api_gateway_integration" "tasks_post" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.tasks.id
  http_method             = aws_api_gateway_method.tasks_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_tasks_create.invoke_arn
}

resource "aws_lambda_permission" "tasks_create_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_tasks_create.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# --- GET /api/v1/tasks (List Tasks) ---
resource "aws_api_gateway_method" "tasks_get" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id
}

resource "aws_api_gateway_integration" "tasks_get" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.tasks.id
  http_method             = aws_api_gateway_method.tasks_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_tasks_list.invoke_arn
}

resource "aws_lambda_permission" "tasks_list_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_tasks_list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# --- GET /api/v1/tasks/{taskId} (Get Task) ---
resource "aws_api_gateway_method" "task_get" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_id.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id

  request_parameters = {
    "method.request.path.taskId" = true
  }
}

resource "aws_api_gateway_integration" "task_get" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.task_id.id
  http_method             = aws_api_gateway_method.task_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_tasks_get.invoke_arn
}

resource "aws_lambda_permission" "tasks_get_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_tasks_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# --- PUT /api/v1/tasks/{taskId} (Update Task) ---
resource "aws_api_gateway_method" "task_put" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id

  request_parameters = {
    "method.request.path.taskId" = true
  }
}

resource "aws_api_gateway_integration" "task_put" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.task_id.id
  http_method             = aws_api_gateway_method.task_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_tasks_update.invoke_arn
}

resource "aws_lambda_permission" "tasks_update_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_tasks_update.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# --- DELETE /api/v1/tasks/{taskId} (Delete Task) ---
resource "aws_api_gateway_method" "task_delete" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id

  request_parameters = {
    "method.request.path.taskId" = true
  }
}

resource "aws_api_gateway_integration" "task_delete" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.task_id.id
  http_method             = aws_api_gateway_method.task_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_tasks_delete.invoke_arn
}

resource "aws_lambda_permission" "tasks_delete_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_tasks_delete.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# --- PATCH /api/v1/tasks/{taskId}/status (Update Task Status) ---
resource "aws_api_gateway_resource" "task_status" {
  rest_api_id = local.api_id
  parent_id   = aws_api_gateway_resource.task_id.id
  path_part   = "status"
}

resource "aws_api_gateway_method" "task_status_patch" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_status.id
  http_method   = "PATCH"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id

  request_parameters = {
    "method.request.path.taskId" = true
  }
}

resource "aws_api_gateway_integration" "task_status_patch" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.task_status.id
  http_method             = aws_api_gateway_method.task_status_patch.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_tasks_update.invoke_arn
}

resource "aws_api_gateway_method" "task_status_options" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_status.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "task_status_options" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_status.id
  http_method = aws_api_gateway_method.task_status_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "task_status_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_status.id
  http_method = aws_api_gateway_method.task_status_options.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "task_status_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_status.id
  http_method = aws_api_gateway_method.task_status_options.http_method
  status_code = aws_api_gateway_method_response.task_status_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,PATCH,PUT'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}



# --- POST /api/v1/tasks/{taskId}/assign (Assign Task) ---
resource "aws_api_gateway_method" "task_assign" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_assign.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id

  request_parameters = {
    "method.request.path.taskId" = true
  }
}

resource "aws_api_gateway_integration" "task_assign" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.task_assign.id
  http_method             = aws_api_gateway_method.task_assign.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_tasks_assign.invoke_arn
}

resource "aws_lambda_permission" "tasks_assign_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_tasks_assign.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# Task Assign CORS
resource "aws_api_gateway_method" "task_assign_options" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_assign.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "task_assign_options" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_assign.id
  http_method = aws_api_gateway_method.task_assign_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "task_assign_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_assign.id
  http_method = aws_api_gateway_method.task_assign_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "task_assign_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_assign.id
  http_method = aws_api_gateway_method.task_assign_options.http_method
  status_code = aws_api_gateway_method_response.task_assign_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# ------------------------------------------------------------------------------
# Users Resource (/api/v1/users)
# ------------------------------------------------------------------------------
resource "aws_api_gateway_resource" "users" {
  rest_api_id = local.api_id
  parent_id   = local.v1_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_resource" "users_me" {
  rest_api_id = local.api_id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "me"
}

resource "aws_api_gateway_resource" "user_id" {
  rest_api_id = local.api_id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{userId}"
}

# --- GET /api/v1/users (List Users) ---
resource "aws_api_gateway_method" "users_get" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id
}

resource "aws_api_gateway_integration" "users_get" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.users.id
  http_method             = aws_api_gateway_method.users_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_users_list.invoke_arn
}

resource "aws_lambda_permission" "users_list_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_users_list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# --- GET /api/v1/users/me (Current User) ---
resource "aws_api_gateway_method" "users_me_get" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.users_me.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id
}

resource "aws_api_gateway_integration" "users_me_get" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.users_me.id
  http_method             = aws_api_gateway_method.users_me_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_users_me.invoke_arn
}

resource "aws_lambda_permission" "users_me_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_users_me.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# --- GET /api/v1/users/{userId} (Get User) ---
resource "aws_api_gateway_method" "user_get" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.user_id.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id

  request_parameters = {
    "method.request.path.userId" = true
  }
}

resource "aws_api_gateway_integration" "user_get" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.user_id.id
  http_method             = aws_api_gateway_method.user_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_users_get.invoke_arn
}

resource "aws_lambda_permission" "users_get_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_users_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# --- PUT /api/v1/users/{userId} (Update User Role - Admin only) ---
resource "aws_api_gateway_method" "user_put" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.user_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = local.authorizer_id

  request_parameters = {
    "method.request.path.userId" = true
  }
}

resource "aws_api_gateway_integration" "user_put" {
  rest_api_id             = local.api_id
  resource_id             = aws_api_gateway_resource.user_id.id
  http_method             = aws_api_gateway_method.user_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_users_update_role.invoke_arn
}

resource "aws_lambda_permission" "users_update_role_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_users_update_role.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${local.execution_arn}/*/*"
}

# ------------------------------------------------------------------------------
# CORS - OPTIONS Methods for preflight requests
# ------------------------------------------------------------------------------

# Tasks CORS
resource "aws_api_gateway_method" "tasks_options" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.tasks.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "tasks_options" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.tasks_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "tasks_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.tasks_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "tasks_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.tasks.id
  http_method = aws_api_gateway_method.tasks_options.http_method
  status_code = aws_api_gateway_method_response.tasks_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Task ID CORS
resource "aws_api_gateway_method" "task_id_options" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.task_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "task_id_options" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_id.id
  http_method = aws_api_gateway_method.task_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "task_id_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_id.id
  http_method = aws_api_gateway_method.task_id_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "task_id_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.task_id.id
  http_method = aws_api_gateway_method.task_id_options.http_method
  status_code = aws_api_gateway_method_response.task_id_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Users CORS
resource "aws_api_gateway_method" "users_options" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_options" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "users_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "users_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = aws_api_gateway_method_response.users_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Users Me CORS
resource "aws_api_gateway_method" "users_me_options" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.users_me.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_me_options" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.users_me.id
  http_method = aws_api_gateway_method.users_me_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "users_me_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.users_me.id
  http_method = aws_api_gateway_method.users_me_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "users_me_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.users_me.id
  http_method = aws_api_gateway_method.users_me_options.http_method
  status_code = aws_api_gateway_method_response.users_me_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,PUT,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# User ID CORS (for GET and PUT /users/{userId})
resource "aws_api_gateway_method" "user_id_options" {
  rest_api_id   = local.api_id
  resource_id   = aws_api_gateway_resource.user_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "user_id_options" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.user_id.id
  http_method = aws_api_gateway_method.user_id_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "user_id_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.user_id.id
  http_method = aws_api_gateway_method.user_id_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "user_id_options_200" {
  rest_api_id = local.api_id
  resource_id = aws_api_gateway_resource.user_id.id
  http_method = aws_api_gateway_method.user_id_options.http_method
  status_code = aws_api_gateway_method_response.user_id_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,PUT,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Gate so API Gateway deployment runs only after every method has an integration
resource "null_resource" "api_routes_ready" {
  triggers = {
    integrations = sha1(join(",", [
      aws_api_gateway_integration.health_get.id,
      aws_api_gateway_integration.task_assignments_options.id,
      aws_api_gateway_integration.task_assignments_post.id,
      aws_api_gateway_integration.tasks_post.id,
      aws_api_gateway_integration.tasks_get.id,
      aws_api_gateway_integration.task_get.id,
      aws_api_gateway_integration.task_put.id,
      aws_api_gateway_integration.task_delete.id,
      aws_api_gateway_integration.task_status_patch.id,
      aws_api_gateway_integration.task_status_options.id,
      aws_api_gateway_integration.task_assign.id,
      aws_api_gateway_integration.task_assign_options.id,
      aws_api_gateway_integration.users_get.id,
      aws_api_gateway_integration.users_me_get.id,
      aws_api_gateway_integration.user_get.id,
      aws_api_gateway_integration.user_put.id,
      aws_api_gateway_integration.tasks_options.id,
      aws_api_gateway_integration.task_id_options.id,
      aws_api_gateway_integration.users_options.id,
      aws_api_gateway_integration.users_me_options.id,
      aws_api_gateway_integration.user_id_options.id,
    ]))
  }
  depends_on = [
    aws_api_gateway_integration.health_get,
    aws_api_gateway_integration.task_assignments_options,
    aws_api_gateway_integration.task_assignments_post,
    aws_api_gateway_integration.tasks_post,
    aws_api_gateway_integration.tasks_get,
    aws_api_gateway_integration.task_get,
    aws_api_gateway_integration.task_put,
    aws_api_gateway_integration.task_delete,
    aws_api_gateway_integration.task_status_patch,
    aws_api_gateway_integration.task_status_options,
    aws_api_gateway_integration.task_assign,
    aws_api_gateway_integration.task_assign_options,
    aws_api_gateway_integration.users_get,
    aws_api_gateway_integration.users_me_get,
    aws_api_gateway_integration.user_get,
    aws_api_gateway_integration.user_put,
    aws_api_gateway_integration.tasks_options,
    aws_api_gateway_integration.task_id_options,
    aws_api_gateway_integration.users_options,
    aws_api_gateway_integration.users_me_options,
    aws_api_gateway_integration.user_id_options,
  ]
}
