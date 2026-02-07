# Cognito Trigger Template

Template for AWS Cognito Lambda triggers (pre-signup, post-confirmation, etc.).

## Usage

Copy and adapt for Cognito User Pool triggers.

## Files

- `preSignup.ts` - Pre-signup trigger (email domain validation)
- `types.ts` - Cognito trigger event types
- `README.md` - This file

## Example: Pre-Signup Trigger

```typescript
// Lambda validates email domain before user can sign up
const ALLOWED_DOMAINS = ['amalitech.com', 'amalitechtraining.org'];

// If email domain not allowed, throw error to block signup
if (!isAllowedDomain(email)) {
    throw new Error('Email domain not authorized');
}
```

## Terraform Integration

```hcl
resource "aws_cognito_user_pool" "main" {
  lambda_config {
    pre_sign_up = aws_lambda_function.pre_signup.arn
  }
}
```
