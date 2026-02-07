# ==============================================================================
# Lambda Functions - Individual Microservices
# ==============================================================================
# Each handler is bundled separately by esbuild into dist/<domain>/<function>/index.js
# Shared libraries (Logger, DynamoDB client, middleware) are bundled INTO each function
# AWS SDK is NOT bundled (provided by Lambda runtime)

# ------------------------------------------------------------------------------
# Data Sources for ZIP Archives
# ------------------------------------------------------------------------------

# Auth - Pre-Signup
data "archive_file" "pre_signup_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/auth/preSignup"
  output_path = "${path.module}/../../../backend/dist/auth/preSignup/lambda.zip"
}

# Auth - Post-Confirmation
data "archive_file" "post_confirmation_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/auth/postConfirmation"
  output_path = "${path.module}/../../../backend/dist/auth/postConfirmation/lambda.zip"
}


# Health Check
data "archive_file" "health_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/health"
  output_path = "${path.module}/../../../backend/dist/health/lambda.zip"
}

# Tasks Handlers
data "archive_file" "tasks_create_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/tasks/create"
  output_path = "${path.module}/../../../backend/dist/tasks/create/lambda.zip"
}

data "archive_file" "tasks_list_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/tasks/list"
  output_path = "${path.module}/../../../backend/dist/tasks/list/lambda.zip"
}

data "archive_file" "tasks_get_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/tasks/get"
  output_path = "${path.module}/../../../backend/dist/tasks/get/lambda.zip"
}

data "archive_file" "tasks_update_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/tasks/update"
  output_path = "${path.module}/../../../backend/dist/tasks/update/lambda.zip"
}

data "archive_file" "tasks_delete_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/tasks/delete"
  output_path = "${path.module}/../../../backend/dist/tasks/delete/lambda.zip"
}

data "archive_file" "tasks_assign_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/tasks/assign"
  output_path = "${path.module}/../../../backend/dist/tasks/assign/lambda.zip"
}

# Users Handlers
data "archive_file" "users_list_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/users/list"
  output_path = "${path.module}/../../../backend/dist/users/list/lambda.zip"
}

data "archive_file" "users_get_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/users/get"
  output_path = "${path.module}/../../../backend/dist/users/get/lambda.zip"
}

data "archive_file" "users_me_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/users/me"
  output_path = "${path.module}/../../../backend/dist/users/me/lambda.zip"
}

data "archive_file" "users_update_role_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/users/updateRole"
  output_path = "${path.module}/../../../backend/dist/users/updateRole/lambda.zip"
}

# Notifications (Phase 4)
data "archive_file" "stream_processor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/notifications/streamProcessor"
  output_path = "${path.module}/../../../backend/dist/notifications/streamProcessor/lambda.zip"
}

data "archive_file" "email_formatter_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../../backend/dist/notifications/emailFormatter"
  output_path = "${path.module}/../../../backend/dist/notifications/emailFormatter/lambda.zip"
}

# ------------------------------------------------------------------------------
# Lambda Function Modules
# ------------------------------------------------------------------------------

# Common environment variables for handlers that need DynamoDB
locals {
  dynamodb_env_vars = {
    TASKS_TABLE = module.tasks_table.table_name
    USERS_TABLE = module.users_table.table_name
    LOG_LEVEL   = "INFO"
  }
}

# Pre-Signup Lambda (Cognito Trigger - no DynamoDB needed)
module "lambda_pre_signup" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "pre-signup"
  description   = "Cognito pre-signup trigger for domain validation"
  handler       = "index.handler"

  filename         = data.archive_file.pre_signup_zip.output_path
  source_code_hash = data.archive_file.pre_signup_zip.output_base64sha256

  environment_variables = {
    ALLOWED_DOMAINS = var.allowed_domains
  }

  tags = local.common_tags
}

# Post-Confirmation Lambda (Cognito Trigger - creates user record in DynamoDB)
module "lambda_post_confirmation" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "post-confirmation"
  description   = "Cognito post-confirmation trigger to create user in DynamoDB"
  handler       = "index.handler"

  filename         = data.archive_file.post_confirmation_zip.output_path
  source_code_hash = data.archive_file.post_confirmation_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem"
      ]
      Resource = [
        module.users_table.table_arn
      ]
    },
    {
      Effect   = "Allow"
      Action   = ["cognito-idp:AdminListGroupsForUser"]
      Resource = [module.cognito.user_pool_arn]
    }
  ]

  tags = local.common_tags
}


# Health Check Lambda
module "lambda_health" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "health"
  description   = "Health check endpoint"
  handler       = "index.handler"

  filename         = data.archive_file.health_zip.output_path
  source_code_hash = data.archive_file.health_zip.output_base64sha256

  environment_variables = {
    LOG_LEVEL = "INFO"
  }

  tags = local.common_tags
}

# Tasks - Create
module "lambda_tasks_create" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "tasks-create"
  description   = "Create a new task"
  handler       = "index.handler"

  filename         = data.archive_file.tasks_create_zip.output_path
  source_code_hash = data.archive_file.tasks_create_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem", "dynamodb:GetItem"]
      Resource = [module.tasks_table.table_arn, module.users_table.table_arn]
    }
  ]

  tags = local.common_tags
}

# Tasks - List
module "lambda_tasks_list" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "tasks-list"
  description   = "List tasks with filtering and pagination"
  handler       = "index.handler"

  filename         = data.archive_file.tasks_list_zip.output_path
  source_code_hash = data.archive_file.tasks_list_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect = "Allow"
      Action = ["dynamodb:Query", "dynamodb:Scan", "dynamodb:BatchGetItem"]
      Resource = [
        module.tasks_table.table_arn,
        "${module.tasks_table.table_arn}/index/*"
      ]
    }
  ]

  tags = local.common_tags
}

# Tasks - Get
module "lambda_tasks_get" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "tasks-get"
  description   = "Get a single task by ID"
  handler       = "index.handler"

  filename         = data.archive_file.tasks_get_zip.output_path
  source_code_hash = data.archive_file.tasks_get_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect = "Allow"
      Action = ["dynamodb:GetItem", "dynamodb:Query"]
      Resource = [
        module.tasks_table.table_arn,
        "${module.tasks_table.table_arn}/index/*"
      ]
    }
  ]

  tags = local.common_tags
}

# Tasks - Update
module "lambda_tasks_update" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "tasks-update"
  description   = "Update an existing task"
  handler       = "index.handler"

  filename         = data.archive_file.tasks_update_zip.output_path
  source_code_hash = data.archive_file.tasks_update_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem", "dynamodb:UpdateItem"]
      Resource = [module.tasks_table.table_arn]
    }
  ]

  tags = local.common_tags
}

# Tasks - Delete
module "lambda_tasks_delete" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "tasks-delete"
  description   = "Delete a task"
  handler       = "index.handler"

  filename         = data.archive_file.tasks_delete_zip.output_path
  source_code_hash = data.archive_file.tasks_delete_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect = "Allow"
      Action = ["dynamodb:GetItem", "dynamodb:DeleteItem", "dynamodb:Query"]
      Resource = [
        module.tasks_table.table_arn,
        "${module.tasks_table.table_arn}/index/*"
      ]
    }
  ]

  tags = local.common_tags
}

# Tasks - Assign
module "lambda_tasks_assign" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "tasks-assign"
  description   = "Assign users to a task"
  handler       = "index.handler"

  filename         = data.archive_file.tasks_assign_zip.output_path
  source_code_hash = data.archive_file.tasks_assign_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect = "Allow"
      Action = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Query", "dynamodb:UpdateItem"]
      Resource = [
        module.tasks_table.table_arn,
        module.users_table.table_arn,
        "${module.tasks_table.table_arn}/index/*"
      ]
    }
  ]

  tags = local.common_tags
}

# Users - List
module "lambda_users_list" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "users-list"
  description   = "List all users"
  handler       = "index.handler"

  filename         = data.archive_file.users_list_zip.output_path
  source_code_hash = data.archive_file.users_list_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect = "Allow"
      Action = ["dynamodb:Scan", "dynamodb:Query"]
      Resource = [
        module.users_table.table_arn,
        "${module.users_table.table_arn}/index/*"
      ]
    }
  ]

  tags = local.common_tags
}

# Users - Get
module "lambda_users_get" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "users-get"
  description   = "Get a user by ID"
  handler       = "index.handler"

  filename         = data.archive_file.users_get_zip.output_path
  source_code_hash = data.archive_file.users_get_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem"]
      Resource = [module.users_table.table_arn]
    }
  ]

  tags = local.common_tags
}

# Users - Me (Current User)
module "lambda_users_me" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "users-me"
  description   = "Get current authenticated user profile"
  handler       = "index.handler"

  filename         = data.archive_file.users_me_zip.output_path
  source_code_hash = data.archive_file.users_me_zip.output_base64sha256

  environment_variables = local.dynamodb_env_vars

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem"]
      Resource = [module.users_table.table_arn]
    }
  ]

  tags = local.common_tags
}

# Users - Update Role (Admin only) - updates DynamoDB and Cognito group membership
module "lambda_users_update_role" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "users-update-role"
  description   = "Update a user's role (Admin only); syncs DynamoDB and Cognito groups"
  handler       = "index.handler"

  filename         = data.archive_file.users_update_role_zip.output_path
  source_code_hash = data.archive_file.users_update_role_zip.output_base64sha256

  environment_variables = merge(local.dynamodb_env_vars, {
    USER_POOL_ID = module.cognito.user_pool_id
  })

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem", "dynamodb:UpdateItem"]
      Resource = [module.users_table.table_arn]
    },
    {
      Effect   = "Allow"
      Action   = ["cognito-idp:AdminAddUserToGroup", "cognito-idp:AdminRemoveUserFromGroup"]
      Resource = [module.cognito.user_pool_arn]
    }
  ]

  tags = local.common_tags
}

# ------------------------------------------------------------------------------
# Phase 4: Notifications - Stream Processor (DynamoDB Stream → SNS)
# ------------------------------------------------------------------------------
module "lambda_stream_processor" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "notifications-stream-processor"
  description   = "Process Tasks table stream and publish task events to SNS"
  handler       = "index.handler"
  timeout       = 60

  filename         = data.archive_file.stream_processor_zip.output_path
  source_code_hash = data.archive_file.stream_processor_zip.output_base64sha256

  environment_variables = merge(local.dynamodb_env_vars, {
    SNS_TOPIC_ARN = module.notifications.task_events_topic_arn
  })

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["dynamodb:GetRecords", "dynamodb:GetShardIterator", "dynamodb:DescribeStream", "dynamodb:ListStreams"]
      Resource = [module.tasks_table.stream_arn]
    },
    {
      Effect   = "Allow"
      Action   = ["dynamodb:GetItem", "dynamodb:Query"]
      Resource = [module.tasks_table.table_arn]
    },
    {
      Effect   = "Allow"
      Action   = ["sns:Publish"]
      Resource = [module.notifications.task_events_topic_arn]
    }
  ]

  tags = local.common_tags
}

# ------------------------------------------------------------------------------
# Phase 4: Notifications - Email Formatter (SNS → SES)
# ------------------------------------------------------------------------------
module "lambda_email_formatter" {
  source = "../../modules/lambda"

  project_name  = var.project_name
  environment   = var.environment
  function_name = "notifications-email-formatter"
  description   = "Send task notification emails via SES when triggered by SNS"
  handler       = "index.handler"
  timeout       = 30

  filename         = data.archive_file.email_formatter_zip.output_path
  source_code_hash = data.archive_file.email_formatter_zip.output_base64sha256

  environment_variables = {
    SES_FROM_EMAIL = var.ses_from_email
    APP_NAME       = var.project_name
    LOG_LEVEL      = "INFO"
  }

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["ses:SendEmail", "ses:SendRawEmail"]
      Resource = ["*"]
    }
  ]

  tags = local.common_tags
}

# DynamoDB Stream → Stream Processor Lambda
resource "aws_lambda_event_source_mapping" "tasks_stream_to_processor" {
  event_source_arn  = module.tasks_table.stream_arn
  function_name     = module.lambda_stream_processor.function_name
  starting_position = "LATEST"
  batch_size        = 10
}

# SNS Topic → Email Formatter Lambda (allow SNS to invoke)
resource "aws_lambda_permission" "sns_invoke_email_formatter" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_email_formatter.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = module.notifications.task_events_topic_arn
}

resource "aws_sns_topic_subscription" "task_events_to_email" {
  topic_arn = module.notifications.task_events_topic_arn
  protocol  = "lambda"
  endpoint  = module.lambda_email_formatter.function_arn
}

