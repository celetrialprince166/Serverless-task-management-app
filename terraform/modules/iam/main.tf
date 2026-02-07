# IAM Module
# Creates IAM roles and policies for Lambda functions

# DynamoDB Access Policy
resource "aws_iam_policy" "dynamodb_crud" {
  count = length(var.dynamodb_table_arns) > 0 ? 1 : 0

  name        = "${var.project_name}-${var.environment}-dynamodb-crud"
  description = "Policy for DynamoDB CRUD operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = concat(
          var.dynamodb_table_arns,
          [for arn in var.dynamodb_table_arns : "${arn}/index/*"]
        )
      }
    ]
  })

  tags = local.common_tags
}

# SNS Publish Policy
resource "aws_iam_policy" "sns_publish" {
  count = length(var.sns_topic_arns) > 0 ? 1 : 0

  name        = "${var.project_name}-${var.environment}-sns-publish"
  description = "Policy for SNS publish operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "SNSPublish"
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = var.sns_topic_arns
      }
    ]
  })

  tags = local.common_tags
}

# SES Send Email Policy
resource "aws_iam_policy" "ses_send" {
  count = var.enable_ses ? 1 : 0

  name        = "${var.project_name}-${var.environment}-ses-send"
  description = "Policy for SES send email operations"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SESSend"
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail"
        ]
        Resource = var.ses_identity_arns
      }
    ]
  })

  tags = local.common_tags
}

# Secrets Manager Read Policy
resource "aws_iam_policy" "secrets_read" {
  count = length(var.secrets_arns) > 0 ? 1 : 0

  name        = "${var.project_name}-${var.environment}-secrets-read"
  description = "Policy for reading from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecretsRead"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.secrets_arns
      }
    ]
  })

  tags = local.common_tags
}

# Cognito Read Policy
resource "aws_iam_policy" "cognito_read" {
  count = var.cognito_user_pool_arn != null ? 1 : 0

  name        = "${var.project_name}-${var.environment}-cognito-read"
  description = "Policy for reading Cognito user pool"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CognitoRead"
        Effect = "Allow"
        Action = [
          "cognito-idp:ListUsers",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminListGroupsForUser"
        ]
        Resource = var.cognito_user_pool_arn
      }
    ]
  })

  tags = local.common_tags
}

locals {
  common_tags = merge(var.tags, {
    Module      = "iam"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  })
}
