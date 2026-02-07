# Dev Environment

## Local Setup

### 1. Create terraform.tfvars

```powershell
copy terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values (SES email, domains, Cognito URLs)
```

`terraform.tfvars` is in `.gitignore` and will **not** be pushed. Terraform auto-loads it—no `-var-file` needed.

### 2. Initialize Terraform

```powershell
# If you have backend.hcl (S3 remote state):
terraform init -backend-config=backend.hcl

# Or local state only:
terraform init -backend=false
```

### 3. Run Terraform

**Option A: Using the run script**
```powershell
.\run.ps1 plan
.\run.ps1 apply
```

**Option B: Direct commands**
```powershell
terraform plan
terraform apply
```

No `-var-file` is needed—`terraform.tfvars` is loaded automatically.

## If You Run Without terraform.tfvars

Terraform will fail with:

```
Error: Invalid value for variable
ses_from_email is required. Copy terraform.tfvars.example to terraform.tfvars and set your values.
```
