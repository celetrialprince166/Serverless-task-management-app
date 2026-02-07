# IAM Module Outputs

output "dynamodb_crud_policy_arn" {
  description = "ARN of DynamoDB CRUD policy"
  value       = try(aws_iam_policy.dynamodb_crud[0].arn, null)
}

output "sns_publish_policy_arn" {
  description = "ARN of SNS publish policy"
  value       = try(aws_iam_policy.sns_publish[0].arn, null)
}

output "ses_send_policy_arn" {
  description = "ARN of SES send policy"
  value       = try(aws_iam_policy.ses_send[0].arn, null)
}

output "secrets_read_policy_arn" {
  description = "ARN of Secrets Manager read policy"
  value       = try(aws_iam_policy.secrets_read[0].arn, null)
}

output "cognito_read_policy_arn" {
  description = "ARN of Cognito read policy"
  value       = try(aws_iam_policy.cognito_read[0].arn, null)
}
