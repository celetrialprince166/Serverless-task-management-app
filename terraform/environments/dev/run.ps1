# Terraform Run Script - Dev Environment
# Run this from the project root or terraform/environments/dev
#
# First-time setup:
#   1. copy terraform.tfvars.example terraform.tfvars
#   2. Edit terraform.tfvars with your values
#   3. terraform init -backend-config=backend.hcl (if using remote state)
#
# Usage:
#   .\run.ps1 plan
#   .\run.ps1 apply
#   .\run.ps1 apply -auto-approve

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("plan", "apply", "destroy", "init")]
    [string]$Command
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Check for terraform.tfvars
if (-not (Test-Path "terraform.tfvars")) {
    Write-Host "ERROR: terraform.tfvars not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "First-time setup:" -ForegroundColor Yellow
    Write-Host "  1. copy terraform.tfvars.example terraform.tfvars"
    Write-Host "  2. Edit terraform.tfvars with your real values (SES email, domains, etc.)"
    Write-Host "  3. terraform init -backend-config=backend.hcl  (if using S3 backend)"
    Write-Host ""
    exit 1
}

# Ensure init has been run (when not running init)
if ($Command -ne "init") {
    if (-not (Test-Path ".terraform")) {
        Write-Host "Running terraform init first..." -ForegroundColor Yellow
        if (Test-Path "backend.hcl") {
            terraform init -backend-config=backend.hcl
        } else {
            terraform init -backend=false
        }
    }
}

switch ($Command) {
    "init" {
        if (Test-Path "backend.hcl") {
            terraform init -backend-config=backend.hcl
        } else {
            Write-Host "Run: terraform init -backend-config=backend.hcl" -ForegroundColor Yellow
            Write-Host "Create backend.hcl from backend.hcl.example first (see terraform/scripts/bootstrap-backend.sh)"
            terraform init -backend=false
        }
    }
    "plan"   { terraform plan }
    "apply"  { terraform apply }
    "destroy" { terraform destroy }
}
