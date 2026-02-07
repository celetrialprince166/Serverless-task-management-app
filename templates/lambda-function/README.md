# Lambda Function Template

Use this template for creating new Lambda handlers.

## Structure
```
handlers/<resource>/<action>.ts     # Handler file
handlers/<resource>/<action>.test.ts # Test file
```

## Features
- Structured CloudWatch logging with request IDs
- Error handling with custom error classes
- Standard API response format
- Input validation integration
- TypeScript with strict mode

## Usage
Copy the handler template and customize:
```typescript
import { handler } from './handler.template';
```

## Naming Convention
- Files: lowercase with action name (e.g., `create.ts`, `list.ts`)
- Functions: camelCase (e.g., `createTask`, `listUsers`)
- Exports: Named `handler` for Lambda
