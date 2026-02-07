# Auth Middleware Template

Template for JWT token extraction and user authentication validation in Lambda handlers.

## Usage

Copy and adapt this middleware for your Lambda handlers that require authentication.

## Files

- `middleware.ts` - Main middleware implementation
- `types.ts` - TypeScript interfaces
- `README.md` - This file

## Example Integration

```typescript
import { extractUser, requireAuth } from './middleware/auth';

export const handler = async (event: APIGatewayProxyEvent) => {
    const user = extractUser(event);
    if (!user) {
        return errorResponse(401, 'Unauthorized', 'Authentication required');
    }
    
    // User is now typed and available
    console.log(user.userId, user.role);
};
```
