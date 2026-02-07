# API Gateway Module
# Creates REST API Gateway with stages and CORS configuration

# IAM Role for API Gateway to write to CloudWatch Logs
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-${var.environment}-apigw-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach the managed policy for API Gateway to push logs to CloudWatch
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Configure API Gateway account settings with CloudWatch role
resource "aws_api_gateway_account" "this" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn

  depends_on = [aws_iam_role_policy_attachment.api_gateway_cloudwatch]
}

resource "aws_api_gateway_rest_api" "this" {
  name        = "${var.project_name}-${var.environment}-api"
  description = var.description

  endpoint_configuration {
    types = [var.endpoint_type]
  }

  tags = local.common_tags
}

# API Resource for base path /api/v1
resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_resource" "v1" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "v1"
}

# Gateway Response for CORS (4XX and 5XX errors)
resource "aws_api_gateway_gateway_response" "cors_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'${var.cors_allowed_origin}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "cors_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  response_type = "DEFAULT_5XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'${var.cors_allowed_origin}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,PATCH,DELETE,OPTIONS'"
  }
}

# Health check resource under /api/v1/health
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "health"
}

# Health check GET method
resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

# Health check MOCK integration (returns 200 OK)
resource "aws_api_gateway_integration" "health_get" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# Health check method response
resource "aws_api_gateway_method_response" "health_get_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

# Health check integration response
resource "aws_api_gateway_integration_response" "health_get_200" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  status_code = aws_api_gateway_method_response.health_get_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'${var.cors_allowed_origin}'"
  }

  response_templates = {
    "application/json" = jsonencode({
      status    = "healthy"
      timestamp = "$context.requestTime"
      stage     = "$stageVariables.stage"
    })
  }
}

# Dummy dependency when no external route gate is passed (avoids null in depends_on)
resource "null_resource" "deployment_gate" {
  count    = var.deployment_depends_on != null ? 0 : 1
  triggers = {}
}

locals {
  deployment_gate = var.deployment_depends_on != null ? var.deployment_depends_on : null_resource.deployment_gate[0]
}

# Deployment - depends on at least one method existing and optional env route gate
resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(join(",", [
      jsonencode(var.deployment_trigger),
      var.route_config_hash
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  # Must wait for all methods to have integrations (module health + any env-specific routes)
  depends_on = [
    aws_api_gateway_method.health_get,
    aws_api_gateway_integration.health_get,
    aws_api_gateway_integration_response.health_get_200,
    local.deployment_gate,
  ]
}

# Stage
resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.this.id
  stage_name    = var.environment

  # Access logging
  dynamic "access_log_settings" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      destination_arn = aws_cloudwatch_log_group.api_access[0].arn
      format = jsonencode({
        requestId          = "$context.requestId"
        ip                 = "$context.identity.sourceIp"
        caller             = "$context.identity.caller"
        user               = "$context.identity.user"
        requestTime        = "$context.requestTime"
        httpMethod         = "$context.httpMethod"
        resourcePath       = "$context.resourcePath"
        status             = "$context.status"
        protocol           = "$context.protocol"
        responseLength     = "$context.responseLength"
        integrationError   = "$context.integrationErrorMessage"
        integrationLatency = "$context.integrationLatency"
      })
    }
  }

  xray_tracing_enabled = var.enable_xray

  tags = local.common_tags

  # Ensure CloudWatch role is set in account settings before creating stage with logging
  depends_on = [aws_api_gateway_account.this]
}

# CloudWatch Log Group for access logs
resource "aws_cloudwatch_log_group" "api_access" {
  count             = var.enable_access_logs ? 1 : 0
  name              = "/aws/apigateway/${var.project_name}-${var.environment}-api/access-logs"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# CloudWatch Log Group for execution logs
resource "aws_cloudwatch_log_group" "api_execution" {
  count             = var.enable_execution_logs ? 1 : 0
  name              = "API-Gateway-Execution-Logs_${aws_api_gateway_rest_api.this.id}/${var.environment}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# Method settings for logging
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = "*/*"

  settings {
    logging_level      = var.enable_execution_logs ? "INFO" : "OFF"
    data_trace_enabled = var.enable_execution_logs
    metrics_enabled    = true

    throttling_burst_limit = var.throttling_burst_limit
    throttling_rate_limit  = var.throttling_rate_limit
  }
}

locals {
  common_tags = merge(var.tags, {
    Module      = "api-gateway"
    API         = "${var.project_name}-api"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  })
}
