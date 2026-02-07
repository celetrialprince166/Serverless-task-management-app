/**
 * Middleware barrel export
 */

// Auth middleware
export {
    extractUser,
    isAuthenticated,
    hasRole,
    isAdmin,
    requireAuth,
    isErrorResponse,
} from './auth';

export type { AuthenticatedUser, CognitoClaims, UserRole } from './auth.types';

// RBAC middleware
export {
    requireRole,
    isAssignedOrAdmin,
    requireAssignment,
    canPerform,
    requirePermission,
    PERMISSIONS,
} from './rbac';
