/**
 * Auth Middleware
 *
 * Extracts and validates authenticated user from API Gateway Cognito authorizer.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { AuthenticatedUser, CognitoClaims, UserRole } from './types';

/**
 * Extract authenticated user from API Gateway event
 *
 * @param event - API Gateway proxy event with Cognito authorizer
 * @returns AuthenticatedUser or null if not authenticated
 */
export function extractUser(event: APIGatewayProxyEvent): AuthenticatedUser | null {
    const claims = event.requestContext?.authorizer?.claims as CognitoClaims | undefined;

    if (!claims || !claims.sub) {
        return null;
    }

    // Parse Cognito groups (comma-separated string)
    const groupsString = claims['cognito:groups'] || '';
    const groups = groupsString ? groupsString.split(',').map((g) => g.trim()) : [];

    // Determine role from groups (admin takes precedence)
    const role: UserRole = groups.includes('Admin') ? 'admin' : 'member';

    return {
        userId: claims.sub,
        email: claims.email || '',
        name: claims.name || claims.email || 'Unknown User',
        role,
        groups,
        claims,
    };
}

/**
 * Check if user is authenticated
 *
 * @param event - API Gateway proxy event
 * @returns true if user has valid authentication
 */
export function isAuthenticated(event: APIGatewayProxyEvent): boolean {
    return extractUser(event) !== null;
}

/**
 * Check if user has a specific role
 *
 * @param user - Authenticated user
 * @param allowedRoles - Roles that are allowed
 * @returns true if user has one of the allowed roles
 */
export function hasRole(user: AuthenticatedUser, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(user.role);
}

/**
 * Check if user is an admin
 *
 * @param user - Authenticated user
 * @returns true if user is an admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'admin';
}

/**
 * Require authentication - throws error response if not authenticated
 *
 * Use this in handlers that require authentication:
 * ```typescript
 * const user = requireAuth(event);
 * if ('statusCode' in user) return user; // Error response
 * // user is now AuthenticatedUser
 * ```
 */
export function requireAuth(
    event: APIGatewayProxyEvent
): AuthenticatedUser | { statusCode: number; body: string } {
    const user = extractUser(event);

    if (!user) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'Unauthorized',
                    message: 'Authentication required',
                },
            }),
        };
    }

    return user;
}
