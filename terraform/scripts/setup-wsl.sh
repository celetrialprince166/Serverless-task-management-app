#!/usr/bin/env bash
#
# setup-wsl.sh - Install Development Tools in WSL (Ubuntu)
#
# Installs:
#   - Terraform (latest)
#   - Node.js 20.x (LTS)
#   - AWS CLI v2
#   - AWS SAM CLI
#   - jq, unzip, zip
#

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${RESET} $*"; }
log_success() { echo -e "${GREEN}${BOLD}[SUCCESS]${RESET} $*"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_info "This script must be run as root (use sudo)"
   exit 1
fi

log_info "Updating package lists..."
apt-get update && apt-get install -y curl gnupg software-properties-common wget unzip zip jq

# 1. Install Terraform
if ! command -v terraform &>/dev/null; then
    log_info "Installing Terraform..."
    wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list
    apt-get update
    apt-get install -y terraform
    log_success "Terraform installed: $(terraform --version | head -n1)"
else
    log_info "Terraform already installed: $(terraform --version | head -n1)"
fi

# 2. Install Node.js 20.x
if ! command -v node &>/dev/null; then
    log_info "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log_success "Node.js installed: $(node --version)"
    log_success "npm installed: $(npm --version)"
else
    log_info "Node.js already installed: $(node --version)"
fi

# 3. Install AWS CLI v2
if ! command -v aws &>/dev/null; then
    log_info "Installing AWS CLI v2..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -q awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
    log_success "AWS CLI installed: $(aws --version)"
else
    log_info "AWS CLI already installed: $(aws --version)"
fi

# 4. Install AWS SAM CLI
if ! command -v sam &>/dev/null; then
    log_info "Installing AWS SAM CLI..."
    # Create temp dir to avoid writing to Windows filesystem (if mounted)
    TMP_DIR=$(mktemp -d)
    pushd "$TMP_DIR" > /dev/null
    
    wget -q https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
    unzip -q aws-sam-cli-linux-x86_64.zip -d sam-installation
    ./sam-installation/install
    
    popd > /dev/null
    rm -rf "$TMP_DIR"
    log_success "AWS SAM CLI installed: $(sam --version)"
else
    log_info "AWS SAM CLI already installed: $(sam --version)"
fi

log_success "Setup complete! Please restart your shell."
