/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * Provides role and resource-level access control for Lambda handlers.
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { AuthenticatedUser, UserRole } from './auth.types';
import { errorResponse } from '../lib';

/**
 * Require specific roles - returns error response if not allowed
 *
 * Usage:
 * ```typescript
 * const roleError = requireRole(user, ['admin']);
 * if (roleError) return roleError;
 * ```
 */
export function requireRole(
    user: AuthenticatedUser,
    allowedRoles: UserRole[]
): APIGatewayProxyResult | null {
    if (allowedRoles.includes(user.role)) {
        return null; // Access granted
    }

    return errorResponse(
        403,
        'Forbidden',
        `Role '${user.role}' is not authorized. Required: ${allowedRoles.join(' or ')}`
    );
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
 * Usage for member access to specific tasks:
 * ```typescript
 * const accessError = requireAssignment(user, task.assignedUserIds);
 * if (accessError) return accessError;
 * ```
 */
export function requireAssignment(
    user: AuthenticatedUser,
    assignedUserIds: string[]
): APIGatewayProxyResult | null {
    if (isAssignedOrAdmin(user, assignedUserIds)) {
        return null; // Access granted
    }

    return errorResponse(403, 'Forbidden', 'You do not have access to this resource');
}

/**
 * Permission matrix for actions
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
 */
export function canPerform(user: AuthenticatedUser, action: string): boolean {
    const allowedRoles = PERMISSIONS[action];
    if (!allowedRoles) return false;
    return allowedRoles.includes(user.role);
}

/**
 * Require permission for an action
 */
export function requirePermission(
    user: AuthenticatedUser,
    action: string
): APIGatewayProxyResult | null {
    const allowedRoles = PERMISSIONS[action];
    if (!allowedRoles) {
        return errorResponse(403, 'Forbidden', `Unknown action: ${action}`);
    }
    return requireRole(user, allowedRoles);
}
