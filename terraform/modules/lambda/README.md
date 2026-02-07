# Lambda Module

Creates an AWS Lambda function with associated resources.

## Features

- Lambda function with configurable runtime, memory, and timeout
- IAM execution role with least-privilege policies
- CloudWatch Log Group with configurable retention
- Optional X-Ray tracing
- Optional VPC configuration
- API Gateway permission (optional)
- Alias support for production deployments

## Usage

```hcl
module "create_task_lambda" {
  source = "../../modules/lambda"

  project_name  = "taskmanager"
  environment   = "dev"
  function_name = "createTask"
  description   = "Creates a new task"

  handler  = "handlers/tasks/create.handler"
  filename = data.archive_file.backend.output_path
  source_code_hash = data.archive_file.backend.output_base64sha256

  environment_variables = {
    TASKS_TABLE = module.tasks_table.table_name
    LOG_LEVEL   = "INFO"
  }

  policy_statements = [
    {
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem"]
      Resource = [module.tasks_table.table_arn]
    }
  ]

  api_gateway_execution_arn = aws_api_gateway_rest_api.main.execution_arn

  tags = local.common_tags
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| project_name | Name of the project | `string` | n/a | yes |
| environment | Deployment environment | `string` | n/a | yes |
| function_name | Lambda function name | `string` | n/a | yes |
| filename | Path to deployment package | `string` | n/a | yes |
| source_code_hash | Hash of deployment package | `string` | n/a | yes |
| runtime | Lambda runtime | `string` | `"nodejs20.x"` | no |
| handler | Lambda handler | `string` | `"index.handler"` | no |
| memory_size | Memory in MB | `number` | `256` | no |
| timeout | Timeout in seconds | `number` | `30` | no |
| enable_xray | Enable X-Ray tracing | `bool` | `true` | no |

## Outputs

| Name | Description |
|------|-------------|
| function_name | Name of the Lambda function |
| function_arn | ARN of the Lambda function |
| invoke_arn | Invoke ARN for API Gateway |
| role_arn | IAM execution role ARN |
| log_group_name | CloudWatch Log Group name |
