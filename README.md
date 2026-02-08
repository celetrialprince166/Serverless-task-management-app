# Serverless Task Management System

A production-ready, fully serverless task management application built on AWS using Infrastructure as Code (Terraform), demonstrating modern DevOps practices including CI/CD automation, role-based access control, and event-driven architecture.

[![CI](https://github.com/yourusername/task-manage-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/task-manage-lab/actions/workflows/ci.yml)
[![Terraform](https://img.shields.io/badge/Terraform-1.6+-623CE4?logo=terraform)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Serverless-FF9900?logo=amazon-aws)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Architecture](#architecture)
- [Development Journey](#development-journey)
- [Motivation](#motivation)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [CI/CD Pipeline](#cicd-pipeline)
- [Learning Outcomes](#learning-outcomes)
- [Challenges & Solutions](#challenges--solutions)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Architecture

![Serverless Task Management System - AWS Architecture](arch/diagram.png)

### Architecture Overview

The system follows a **serverless microservices architecture** deployed entirely on AWS:

| Layer | Components | Purpose |
|-------|------------|---------|
| **Frontend** | AWS Amplify, React, Vite, Tailwind CSS | Single-page application with responsive UI |
| **CDN** | CloudFront | Global content delivery with SSL/TLS termination |
| **API** | API Gateway (REST) | Request routing, throttling, CORS handling |
| **Auth** | Cognito User Pools | JWT-based authentication with RBAC |
| **Compute** | Lambda (Node.js 20.x) | 15+ microservice functions |
| **Data** | DynamoDB (Single-Table Design) | NoSQL database with on-demand scaling |
| **Notifications** | SNS + SES + DynamoDB Streams | Event-driven email notifications |
| **Monitoring** | CloudWatch, X-Ray | Centralized logging and distributed tracing |
| **Security** | IAM, Secrets Manager, KMS | Least-privilege access and encryption |

### Data Flow

1. **User Request**: HTTPS → CloudFront → Amplify Frontend
2. **API Call**: Frontend → API Gateway → Cognito Authorizer → Lambda
3. **Data Operations**: Lambda → DynamoDB (encrypted at rest)
4. **Notifications**: DynamoDB Streams → Stream Processor → SNS → Email Formatter → SES

---

## Development Journey

This section documents how the system was built end-to-end, from initial architecture design to production deployment on AWS Amplify.

### Phase 1: Architecture Design

We started with description that specified the desired AWS components, data flow, and layout. This description produced the initial diagram (now in `arch/diagram.png`) depicting:

- User entry flow (HTTPS → CloudFront → Amplify frontend)
- API Gateway and Cognito authentication
- Lambda compute layer with RBAC (Admin vs Member)
- DynamoDB (Tasks, Users) with single-table design
- Event-driven notification pipeline (DynamoDB Streams → SNS → SES)

As the implementation progressed, we **refined the architecture ** to match what was actually built—adding details such as the Post-Confirmation Cognito trigger, specific Lambda handlers, the Stream Processor, and the monorepo Amplify setup with `appRoot: frontend`. This kept the diagram aligned with the real system.

### Phase 2: Infrastructure as Code (Terraform)

With the architecture defined, we provisioned all AWS resources via **Terraform**:

- **Modular design**: Reusable modules for Lambda, API Gateway, Cognito, DynamoDB, Amplify, and notifications
- **Remote state**: S3 backend with DynamoDB locking for team collaboration
- **Secrets management**: Sensitive values in `terraform.tfvars` (gitignored), with CI/CD using GitHub Secrets (`TF_TFVARS`, `TF_BACKEND_CONFIG`)
- **Environment support**: Separate `environments/dev` configuration for development

Key outputs (API URL, User Pool ID, Client ID) were used to configure the frontend and backend integrations.

### Phase 3: Backend Development

We implemented **15+ Lambda functions** in TypeScript:

- **Auth handlers**: Pre-signup (email domain validation), Post-confirmation (DynamoDB user sync)
- **Task handlers**: Create, list, get, update, delete, assign, unassign, status update
- **User handlers**: List, get, me, update role, update profile
- **Notification handlers**: Stream processor (DynamoDB Streams → SNS), email formatter (SNS → SES)

Each handler uses Joi for validation, shared middleware for auth and RBAC, and the AWS SDK v3 for DynamoDB, SNS, and SES. Tests were written with Jest and integrated into the CI pipeline.

### Phase 4: Frontend Development

The **React 19 + Vite + Tailwind** frontend was built in the `frontend/` directory:

- **Amplify Auth**: Cognito integration for sign-up, sign-in, and protected routes
- **API service layer**: Typed API client calling the REST endpoints
- **Role-based UI**: Admin-only actions (create task, assign, update role) vs Member actions (view tasks, update status)
- **Build configuration**: `amplify.yml` at repository root with `appRoot: frontend` for monorepo hosting

### Phase 5: CI/CD and Repository Setup

- **GitHub Actions**: `ci.yml` runs lint, tests, security scans (npm audit, Checkov), and Terraform validation; `terraform-plan.yml` posts plans on PRs
- **Repository hygiene**: `.gitignore` excludes `.agent`, non-essential docs (keeping `docs/openapi.yaml`), `terraform.tfvars`, and other sensitive or build artifacts
- **Terraform in CI**: GitHub Secrets supply backend config and variable values so `terraform plan` runs without committing secrets

### Phase 6: Amplify Deployment

The final step was **deploying the frontend to AWS Amplify**:

1. **Connect GitHub**: In Amplify Console, connected the repository and selected the main branch
2. **Build settings**: Amplify detected `amplify.yml` (or uses default: `npm ci` and `npm run build` in `frontend/`)
3. **Environment variables**: Added `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`, `VITE_API_URL` from Terraform outputs
4. **Deploy**: Amplify builds and deploys on each push, serving the app via CloudFront with HTTPS

The backend (Lambda, API Gateway, DynamoDB) was already live from Terraform; Amplify only hosts the frontend and wires it to the existing API and Cognito User Pool.

### Summary

| Phase | Focus | Outcome |
|-------|--------|---------|
| 1 | Architecture | Diagram and refined prompt (V3) |
| 2 | Terraform | All AWS infra provisioned |
| 3 | Backend | Lambda handlers, DynamoDB, notifications |
| 4 | Frontend | React app with Amplify Auth |
| 5 | CI/CD | GitHub Actions, secrets, `.gitignore` |
| 6 | Amplify | Frontend hosted and deployed automatically |

---

## Motivation

This project was built to demonstrate **production-grade DevOps and cloud engineering skills** through a real-world application. The goals were to:

- **Master Infrastructure as Code**: Design reusable, modular Terraform configurations following DRY principles
- **Implement Serverless Architecture**: Build cost-effective, auto-scaling applications without server management
- **Apply Security Best Practices**: Implement RBAC, JWT authentication, encryption, and least-privilege IAM policies
- **Create Event-Driven Systems**: Use DynamoDB Streams and SNS for decoupled, asynchronous processing
- **Establish CI/CD Pipelines**: Automate testing, security scanning, and infrastructure validation

This project showcases the complete lifecycle of a cloud-native application—from infrastructure provisioning to frontend deployment—demonstrating skills directly applicable to DevOps, Cloud, and Platform Engineering roles.

---

## Key Features

### Task Management
- **Full CRUD Operations**: Create, read, update, and delete tasks
- **Task Status Workflow**: OPEN → IN_PROGRESS → UNDER_REVIEW → COMPLETED → CLOSED
- **Priority Levels**: LOW, MEDIUM, HIGH, URGENT with visual indicators
- **Task Assignment**: Assign multiple users to tasks with tracking
- **Due Date Management**: Set and track task deadlines

### Authentication & Authorization
- **AWS Cognito Integration**: Secure JWT-based authentication
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full CRUD access to all resources, user management
  - **Member**: View assigned tasks, update task status only
- **Email Domain Restriction**: Only `@amalitech.com` and `@amalitechtraining.org` domains allowed
- **Cognito Triggers**: Pre-signup validation and post-confirmation user provisioning

### Notifications (Event-Driven)
- **Real-time Email Notifications** via Amazon SES:
  - Task assignment notifications
  - Status change alerts
  - Overdue task reminders
- **DynamoDB Streams**: Capture data changes for event processing
- **HTML Email Templates**: Professional, branded email communications

### Infrastructure
- **100% Infrastructure as Code**: All resources defined in Terraform
- **Modular Design**: Reusable modules for Lambda, DynamoDB, API Gateway, Cognito
- **Remote State Management**: S3 backend with DynamoDB locking
- **Multi-Environment Support**: Separate configurations for dev/staging/prod

---

## Technologies Used

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x | Lambda runtime environment |
| **TypeScript** | 5.7+ | Type-safe backend development |
| **AWS SDK v3** | 3.712+ | AWS service integration |
| **Joi** | 17.13+ | Request validation |
| **Jest** | 29.7+ | Unit and integration testing |
| **esbuild** | 0.24+ | Fast TypeScript bundling |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI framework |
| **Vite** | 7.2+ | Build tool and dev server |
| **TypeScript** | 5.9+ | Type-safe frontend development |
| **Tailwind CSS** | 4.1+ | Utility-first styling |
| **AWS Amplify** | 6.16+ | AWS integration and hosting |
| **Framer Motion** | 12.x | Animations and transitions |
| **React Router** | 7.x | Client-side routing |

### Infrastructure & DevOps

| Technology | Version | Purpose |
|------------|---------|---------|
| **Terraform** | 1.6+ | Infrastructure as Code |
| **AWS Provider** | 6.0+ | AWS resource provisioning |
| **GitHub Actions** | - | CI/CD automation |
| **Checkov** | - | Infrastructure security scanning |
| **Codecov** | - | Code coverage reporting |

### AWS Services

| Service | Purpose |
|---------|---------|
| **Lambda** | Serverless compute (15+ functions) |
| **API Gateway** | REST API management |
| **DynamoDB** | NoSQL database (single-table design) |
| **Cognito** | User authentication and authorization |
| **SNS** | Pub/sub messaging for notifications |
| **SES** | Transactional email delivery |
| **Amplify** | Frontend hosting and CI/CD |
| **CloudFront** | CDN and SSL termination |
| **CloudWatch** | Logging and monitoring |
| **X-Ray** | Distributed tracing |
| **Secrets Manager** | Secure credential storage |
| **IAM** | Access management |
| **KMS** | Encryption key management |
| **S3** | Terraform state storage |

---

## Prerequisites

Before setting up this project, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **npm** >= 10.0.0 (comes with Node.js)
- **Terraform** >= 1.6.0 ([Download](https://www.terraform.io/downloads))
- **AWS CLI** v2 ([Download](https://aws.amazon.com/cli/))
- **Git** ([Download](https://git-scm.com/))

### AWS Account Requirements

- AWS account with appropriate permissions
- AWS CLI configured with credentials (`aws configure`)
- SES production access (for email notifications)

---

## Project Structure

```
task-manage-lab/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI pipeline (lint, test, security)
│       └── terraform-plan.yml        # Terraform plan on PRs
├── arch/
│   └── diagram.png                   # Architecture diagram
├── backend/
│   ├── src/
│   │   ├── handlers/                 # Lambda function handlers
│   │   │   ├── auth/                 # Cognito triggers
│   │   │   ├── notifications/        # Email notification handlers
│   │   │   ├── tasks/                # Task CRUD operations
│   │   │   └── users/                # User management
│   │   ├── lib/                      # Shared utilities (DynamoDB, SES, SNS)
│   │   ├── middleware/               # Auth and RBAC middleware
│   │   ├── models/                   # TypeScript data models
│   │   ├── templates/emails/         # HTML email templates
│   │   └── validators/               # Joi validation schemas
│   ├── tests/                        # Unit and integration tests
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── openapi.yaml                  # API documentation (OpenAPI 3.0)
├── frontend/
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── config/                   # Amplify configuration
│   │   ├── context/                  # React context (Auth)
│   │   ├── pages/                    # Page components
│   │   ├── services/                 # API service layer
│   │   └── types/                    # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── templates/                        # Code templates for consistency
├── terraform/
│   ├── environments/
│   │   └── dev/                      # Development environment
│   ├── modules/                      # Reusable Terraform modules
│   │   ├── amplify/
│   │   ├── api-gateway/
│   │   ├── cognito/
│   │   ├── dynamodb/
│   │   ├── iam/
│   │   ├── lambda/
│   │   └── notifications/
│   ├── scripts/                      # Setup and bootstrap scripts
│   ├── backend.tf                    # S3 backend configuration
│   └── versions.tf                   # Provider versions
├── amplify.yml                       # Amplify build specification
└── README.md
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/celetrialprince166/Serverless-task-management-app.git
cd task-manage-lab
```

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### 3. Bootstrap Terraform Backend

```bash
cd terraform/scripts
chmod +x bootstrap-backend.sh
./bootstrap-backend.sh
```

This creates the S3 bucket and DynamoDB table for Terraform state management.

### 4. Configure Terraform Variables

```bash
cd ../environments/dev
cp terraform.tfvars.example terraform.tfvars
cp backend.hcl.example backend.hcl
```

Edit `terraform.tfvars` with your configuration:

```hcl
project_name        = "taskmanager"
environment         = "dev"
aws_region          = "us-east-1"
ses_from_email      = "noreply@yourdomain.com"
allowed_domains     = "@amalitech.com,@amalitechtraining.org"
cognito_callback_urls = ["http://localhost:5173"]
cognito_logout_urls   = ["http://localhost:5173"]
```

### 5. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init -backend-config=backend.hcl

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

### 6. Build and Deploy Backend

```bash
cd ../../../backend
npm ci
npm run build
```

The Lambda functions are automatically deployed via Terraform.

### 7. Configure and Run Frontend

```bash
cd ../frontend
npm ci

# Copy environment template
cp .env.example .env
```

Edit `.env` with values from Terraform outputs:

```env
VITE_USER_POOL_ID=us-east-1_XXXXXXXX
VITE_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
```

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## Usage

### Creating a Task (Admin)

```bash
curl -X POST https://your-api-url/api/v1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add Cognito integration for user login",
    "priority": "HIGH",
    "dueDate": "2024-12-31"
  }'
```

### Listing Tasks

```bash
curl -X GET https://your-api-url/api/v1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Updating Task Status (Member)

```bash
curl -X PATCH https://your-api-url/api/v1/tasks/{taskId}/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}'
```

### Assigning Users to a Task (Admin)

```bash
curl -X POST https://your-api-url/api/v1/tasks/{taskId}/assignments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user-id-1", "user-id-2"]}'
```

---

## API Documentation

Full API documentation is available in OpenAPI 3.0 format at [`docs/openapi.yaml`](docs/openapi.yaml).

### Endpoints Summary

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/health` | Health check | Public |
| `POST` | `/api/v1/tasks` | Create task | Admin |
| `GET` | `/api/v1/tasks` | List tasks | Admin/Member |
| `GET` | `/api/v1/tasks/{id}` | Get task details | Admin/Member |
| `PUT` | `/api/v1/tasks/{id}` | Update task | Admin |
| `DELETE` | `/api/v1/tasks/{id}` | Delete task | Admin |
| `PATCH` | `/api/v1/tasks/{id}/status` | Update status | Admin/Member |
| `POST` | `/api/v1/tasks/{id}/assignments` | Assign users | Admin |
| `GET` | `/api/v1/users/me` | Get current user | Authenticated |
| `PUT` | `/api/v1/users/me` | Update profile | Authenticated |
| `GET` | `/api/v1/users` | List all users | Admin |
| `GET` | `/api/v1/users/{id}` | Get user details | Admin |
| `PUT` | `/api/v1/users/{id}` | Update user role | Admin |

---

## CI/CD Pipeline

### Continuous Integration (`ci.yml`)

Triggered on push/PR to `main` and `develop` branches:

```yaml
Jobs:
├── lint-and-test
│   ├── TypeScript compilation
│   ├── Jest tests with coverage
│   └── Codecov upload
├── security-scan
│   ├── npm audit (dependency vulnerabilities)
│   └── Checkov (Terraform security)
└── terraform-validate
    ├── Format check
    ├── Init (backend=false)
    └── Validate
```

### Terraform Plan (`terraform-plan.yml`)

Triggered on PRs when Terraform files change:

- Generates execution plan
- Posts plan output as PR comment
- Enables infrastructure review before merge

### Required Secrets

| Secret | Purpose |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | AWS authentication |
| `AWS_SECRET_ACCESS_KEY` | AWS authentication |
| `TF_BACKEND_CONFIG` | Terraform backend configuration |
| `TF_TFVARS` | Terraform variables |

---

## Learning Outcomes

Through building this project, I gained hands-on experience with:

- **Infrastructure as Code**
  - Designed modular, reusable Terraform configurations
  - Implemented remote state management with S3 and DynamoDB locking
  - Applied Terraform best practices (workspaces, modules, variables)

- **Serverless Architecture**
  - Built 15+ Lambda functions with TypeScript
  - Implemented single-table DynamoDB design patterns
  - Configured API Gateway with request validation and CORS

- **Authentication & Security**
  - Integrated AWS Cognito for JWT-based authentication
  - Implemented role-based access control (RBAC)
  - Applied least-privilege IAM policies per function
  - Configured encryption at rest and in transit

- **Event-Driven Architecture**
  - Used DynamoDB Streams for change data capture
  - Implemented SNS pub/sub for decoupled notifications
  - Built email notification system with SES and HTML templates

- **CI/CD & DevOps**
  - Created GitHub Actions workflows for automated testing
  - Integrated security scanning (Checkov, npm audit)
  - Implemented infrastructure validation in pipelines

- **Frontend Development**
  - Built responsive React application with TypeScript
  - Integrated AWS Amplify for authentication UI
  - Implemented protected routes and role-based rendering

---

## Challenges & Solutions

### Challenge 1: DynamoDB Single-Table Design

**Problem**: Traditional relational database thinking led to multiple tables, causing complex queries and higher costs.

**Solution**: Implemented single-table design with composite keys:
- Tasks: `PK=TASK#{id}`, `SK=METADATA`
- Assignments: `PK=TASK#{taskId}`, `SK=ASSIGN#{userId}`
- GSIs for status and priority queries

**Learning**: Single-table design reduces costs and improves query performance in DynamoDB.

### Challenge 2: Cognito Post-Confirmation Sync

**Problem**: Users existed in Cognito but not in DynamoDB, causing authorization failures.

**Solution**: Implemented Post-Confirmation Lambda trigger that:
- Creates user record in DynamoDB on signup
- Updates user record on subsequent sign-ins
- Handles both signup and sign-in confirmation events

**Learning**: Cognito triggers are essential for maintaining data consistency across services.

### Challenge 3: CORS Configuration

**Problem**: Frontend requests blocked by CORS errors despite API Gateway configuration.

**Solution**: 
- Added OPTIONS methods for all endpoints
- Configured Gateway Responses for 4XX/5XX errors
- Ensured Lambda responses include CORS headers

**Learning**: CORS must be handled at multiple levels in serverless architectures.

### Challenge 4: Lambda Cold Starts

**Problem**: Initial requests experienced high latency due to cold starts.

**Solution**:
- Used esbuild for smaller bundle sizes
- Externalized AWS SDK (provided by runtime)
- Implemented connection reuse for DynamoDB client

**Learning**: Bundle optimization significantly reduces cold start times.

---

## Future Improvements

- [ ] **Multi-Environment Deployment**: Add staging and production environments
- [ ] **Monitoring Dashboard**: CloudWatch dashboards with custom metrics
- [ ] **WebSocket Support**: Real-time task updates via API Gateway WebSockets
- [ ] **Task Comments**: Add commenting functionality to tasks
- [ ] **File Attachments**: S3 integration for task attachments
- [ ] **Audit Logging**: Track all user actions for compliance
- [ ] **Rate Limiting**: Implement API throttling per user
- [ ] **Terraform Cloud**: Migrate to Terraform Cloud for team collaboration
- [ ] **Container Support**: Add ECS/Fargate option for compute-intensive tasks
- [ ] **GraphQL API**: Add AppSync for flexible querying

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For major changes, please open an issue first to discuss the proposed changes.

### Development Guidelines

- Follow TypeScript best practices
- Write unit tests for new functionality
- Update documentation as needed
- Ensure CI pipeline passes before requesting review

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Prince Tetteh Ayiku** - DevOps Engineer

- GitHub: [@celetrialprince166](https://github.com/celetrialprince166)
- LinkedIn: [Prince Tetteh Ayiku](https://linkedin.com/in/prince-tetteh-ayiku)
- Email: princeayiku5@gmail.com

---

## Acknowledgments

- [AWS Documentation](https://docs.aws.amazon.com/) - Comprehensive service guides
- [Terraform Registry](https://registry.terraform.io/) - Provider documentation
- [React Documentation](https://react.dev/) - Frontend framework guides
- [AmaliTech](https://amalitech.com/) - Training and development support

---

<p align="center">
  <sub>Built with dedication to demonstrate production-grade DevOps practices</sub>
</p>
