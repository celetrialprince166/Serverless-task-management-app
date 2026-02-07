/**
 * Auth Types
 *
 * TypeScript interfaces for authenticated users and auth context.
 */

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'member';

/**
 * Authenticated user extracted from Cognito JWT claims
 */
export interface AuthenticatedUser {
    /** Cognito user ID (sub claim) */
    userId: string;

    /** User's email address */
    email: string;

    /** User's display name */
    name: string;

    /** Primary role (admin or member) */
    role: UserRole;

    /** Cognito groups the user belongs to */
    groups: string[];
}

/**
 * Cognito claims from JWT token (via API Gateway authorizer)
 */
export interface CognitoClaims {
    /** Subject - unique user ID */
    sub: string;

    /** Email address */
    email?: string;

    /** Whether email is verified */
    email_verified?: string;

    /** User's name */
    name?: string;

    /** Cognito groups (comma-separated string or array) */
    'cognito:groups'?: string | string[];

    /** Custom attributes */
    [key: string]: string | string[] | undefined;
}
