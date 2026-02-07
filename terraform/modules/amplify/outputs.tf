# Amplify Module Outputs

output "app_id" {
  description = "Amplify App ID"
  value       = aws_amplify_app.main.id
}

output "app_arn" {
  description = "Amplify App ARN"
  value       = aws_amplify_app.main.arn
}

output "default_domain" {
  description = "Default Amplify domain (e.g. https://develop.xxx.amplifyapp.com)"
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.main.default_domain}"
}

output "branch_url" {
  description = "Full URL of the deployed branch"
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.main.default_domain}"
}

output "default_domain_base" {
  description = "Base default domain (e.g. xxx.amplifyapp.com)"
  value       = aws_amplify_app.main.default_domain
}
