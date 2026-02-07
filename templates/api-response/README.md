# API Response Template

Standard response format for all API endpoints.

## Features
- Consistent success/error response structure
- CORS headers pre-configured
- Proper HTTP status codes
- Typed interfaces for TypeScript

## Response Format

### Success Response
```json
{
  "data": { ... },
  "pagination": { ... }  // Optional, for list endpoints
}
```

### Error Response
```json
{
  "error": "ErrorCode",
  "message": "Human readable message",
  "details": { ... },  // Optional, validation errors
  "timestamp": "2026-02-06T10:00:00Z",
  "path": "/api/v1/tasks"
}
```

## Usage
```typescript
import { successResponse, errorResponse } from '../lib/response';
```
