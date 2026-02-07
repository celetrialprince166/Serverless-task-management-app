# GitHub Actions Workflows

## Required Secrets

### Terraform Plan (`terraform-plan.yml`)

| Secret | Required | Description |
|--------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Yes* | AWS credentials for Terraform plan |
| `AWS_SECRET_ACCESS_KEY` | Yes* | AWS credentials for Terraform plan |
| `TF_BACKEND_CONFIG` | Yes* | Contents of `backend.hcl` for remote state. Copy from `terraform/environments/dev/backend.hcl`. |
| `TF_TFVARS` | Yes* | Contents of `terraform.tfvars`. Copy from your local `terraform/environments/dev/terraform.tfvars`. |

\* All four secrets are required for full `terraform plan` on PRs. Without them, the workflow runs format + validate only, or fails with a clear error if backend is set but secrets are not.

### CI (`ci.yml`)

No secrets required for lint/test/validate. Codecov upload uses `COCOV_TOKEN` if set (optional).
