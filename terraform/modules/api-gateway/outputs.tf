# API Gateway Module Outputs

output "api_id" {
  description = "ID of the REST API"
  value       = aws_api_gateway_rest_api.this.id
}

output "api_arn" {
  description = "ARN of the REST API"
  value       = aws_api_gateway_rest_api.this.arn
}

output "execution_arn" {
  description = "Execution ARN for Lambda permissions"
  value       = aws_api_gateway_rest_api.this.execution_arn
}

output "root_resource_id" {
  description = "Root resource ID of the API"
  value       = aws_api_gateway_rest_api.this.root_resource_id
}

output "v1_resource_id" {
  description = "Resource ID for /api/v1 path"
  value       = aws_api_gateway_resource.v1.id
}

output "stage_name" {
  description = "Name of the deployed stage"
  value       = aws_api_gateway_stage.this.stage_name
}

output "invoke_url" {
  description = "Base URL for API invocation"
  value       = aws_api_gateway_stage.this.invoke_url
}

output "api_endpoint" {
  description = "Full API endpoint including /api/v1"
  value       = "${aws_api_gateway_stage.this.invoke_url}api/v1"
}
