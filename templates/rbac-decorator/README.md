# RBAC Decorator Template

Template for role-based access control (RBAC) in Lambda handlers.

## Usage

Use this template to restrict handler access based on user roles.

## Files

- `rbac.ts` - RBAC helper functions
- `README.md` - This file

## Example Integration

```typescript
import { checkPermission, requireRole } from './middleware/rbac';
import { extractUser } from './middleware/auth';

export const handler = async (event: APIGatewayProxyEvent) => {
    const user = extractUser(event);
    if (!user) return errorResponse(401, 'Unauthorized');
    
    // Require admin role
    const roleCheck = requireRole(user, ['admin']);
    if (roleCheck) return roleCheck; // Returns 403 error response
    
    // Proceed with admin-only action
};
```

## RBAC Matrix

| Action | Admin | Member |
|--------|-------|--------|
| Create/Update/Delete Task | ✅ | ❌ |
| Assign Task | ✅ | ❌ |
| List/Get Tasks | ✅ | ✅ (assigned only) |
| Update Task Status | ✅ | ✅ (assigned only) |
