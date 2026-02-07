/**
 * Auth Middleware
 *
 * Extracts and validates authenticated user from API Gateway Cognito authorizer.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthenticatedUser, CognitoClaims, UserRole } from './auth.types';
import { errorResponse } from '../lib';

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

    // Parse Cognito groups (can be comma-separated string or array)
    let groups: string[] = [];
    const cognitoGroups = claims['cognito:groups'];
    if (cognitoGroups) {
        if (Array.isArray(cognitoGroups)) {
            groups = cognitoGroups;
        } else {
            groups = cognitoGroups.split(',').map((g) => g.trim());
        }
    }

    // Determine role from groups (Admin takes precedence)
    const role: UserRole = groups.includes('Admin') ? 'admin' : 'member';

    return {
        userId: claims.sub,
        email: claims.email || '',
        name: claims.name || claims.email || 'Unknown User',
        role,
        groups,
    };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(event: APIGatewayProxyEvent): boolean {
    return extractUser(event) !== null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthenticatedUser, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(user.role);
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'admin';
}

/**
 * Require authentication - returns error response if not authenticated
 */
export function requireAuth(
    event: APIGatewayProxyEvent
): AuthenticatedUser | APIGatewayProxyResult {
    const user = extractUser(event);

    if (!user) {
        return errorResponse(401, 'Unauthorized', 'Authentication required');
    }

    return user;
}

/**
 * Type guard to check if result is an error response
 */
export function isErrorResponse(
    result: AuthenticatedUser | APIGatewayProxyResult
): result is APIGatewayProxyResult {
    return 'statusCode' in result;
}
