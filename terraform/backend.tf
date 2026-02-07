# Backend configuration for Terraform remote state
# Uncomment after creating the S3 bucket and DynamoDB table

# terraform {
#   backend "s3" {
#     bucket         = "taskmanager-terraform-state"
#     key            = "state/terraform.tfstate"
#     region         = "eu-west-1"
#     encrypt        = true
#     dynamodb_table = "taskmanager-terraform-locks"
#   }
# }

# For initial setup, use local backend
# After S3/DynamoDB are created, uncomment the s3 backend above
# and run: terraform init -migrate-state
