/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * Provides role and resource-level access control for Lambda handlers.
 */

import { AuthenticatedUser, UserRole } from '../auth-middleware/types';

/**
 * Permission check result
 */
export interface PermissionCheck {
    allowed: boolean;
    reason?: string;
}

/**
 * Error response for permission denied
 */
export interface PermissionDeniedResponse {
    statusCode: 403;
    body: string;
}

/**
 * Check if user has required role
 *
 * @param user - Authenticated user
 * @param allowedRoles - Roles that are permitted
 * @returns PermissionCheck result
 */
export function checkPermission(
    user: AuthenticatedUser,
    allowedRoles: UserRole[]
): PermissionCheck {
    if (allowedRoles.includes(user.role)) {
        return { allowed: true };
    }

    return {
        allowed: false,
        reason: `Role '${user.role}' is not authorized. Required: ${allowedRoles.join(' or ')}`,
    };
}

/**
 * Require specific roles - returns error response if not allowed
 *
 * Use in handlers:
 * ```typescript
 * const roleError = requireRole(user, ['admin']);
 * if (roleError) return roleError;
 * ```
 */
export function requireRole(
    user: AuthenticatedUser,
    allowedRoles: UserRole[]
): PermissionDeniedResponse | null {
    const check = checkPermission(user, allowedRoles);

    if (!check.allowed) {
        return {
            statusCode: 403,
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'Forbidden',
                    message: check.reason || 'Permission denied',
                },
            }),
        };
    }

    return null;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'admin';
}

/**
 * Check if user is assigned to a resource (for member access)
 *
 * @param user - Authenticated user
 * @param assignedUserIds - List of user IDs assigned to the resource
 * @returns true if user is assigned or is admin
 */
export function isAssignedOrAdmin(
    user: AuthenticatedUser,
    assignedUserIds: string[]
): boolean {
    if (isAdmin(user)) return true;
    return assignedUserIds.includes(user.userId);
}

/**
 * Require assignment to a resource - returns error response if not allowed
 *
 * Use for member access to specific tasks:
 * ```typescript
 * const accessError = requireAssignment(user, task.assignedTo);
 * if (accessError) return accessError;
 * ```
 */
export function requireAssignment(
    user: AuthenticatedUser,
    assignedUserIds: string[]
): PermissionDeniedResponse | null {
    if (isAssignedOrAdmin(user, assignedUserIds)) {
        return null;
    }

    return {
        statusCode: 403,
        body: JSON.stringify({
            success: false,
            error: {
                code: 'Forbidden',
                message: 'You do not have access to this resource',
            },
        }),
    };
}

/**
 * Action-based permission matrix
 */
export const PERMISSIONS: Record<string, UserRole[]> = {
    'task:create': ['admin'],
    'task:update': ['admin'],
    'task:delete': ['admin'],
    'task:assign': ['admin'],
    'task:list': ['admin', 'member'],
    'task:get': ['admin', 'member'],
    'task:updateStatus': ['admin', 'member'],
    'user:list': ['admin'],
    'user:get': ['admin', 'member'],
};

/**
 * Check if user can perform an action
 *
 * @param user - Authenticated user
 * @param action - Action to perform (e.g., 'task:create')
 * @returns true if action is allowed
 */
export function canPerform(user: AuthenticatedUser, action: string): boolean {
    const allowedRoles = PERMISSIONS[action];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
}
