/**
 * API Types - Generated from OpenAPI Specification
 * Task Management System
 */

// =============================================================================
// Enums
// =============================================================================

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Role = 'ADMIN' | 'MEMBER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';

// =============================================================================
// User Types
// =============================================================================

export interface UserSummary {
    id: string;
    name: string;
    email: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserRequest {
    name?: string;
}

/** Admin only: update another user's role */
export interface UpdateUserRoleRequest {
    role: Role;
}

// =============================================================================
// Task Types
// =============================================================================

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    createdBy: UserSummary;
    assignedTo: UserSummary[];
    createdAt: string;
    updatedAt: string;
    dueDate?: string;
    completedAt?: string;
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    priority?: Priority;
    dueDate?: string;
    assignedTo?: string[];
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    priority?: Priority;
    status?: TaskStatus;
    dueDate?: string;
}

export interface UpdateTaskStatusRequest {
    status: TaskStatus;
}

export interface AssignUsersRequest {
    userIds: string[];
}

// =============================================================================
// Pagination
// =============================================================================

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: Pagination;
}

// For backward compatibility with existing API response format
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface ApiListResponse<T> {
    data: T[];
    pagination?: Pagination;
}

// =============================================================================
// Error Types
// =============================================================================

export interface ApiError {
    error: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    path: string;
}

// =============================================================================
// Query Parameters
// =============================================================================

export interface TaskQueryParams {
    status?: TaskStatus;
    priority?: Priority;
    page?: number;
    limit?: number;
}

export interface UserQueryParams {
    role?: Role;
    status?: UserStatus;
    page?: number;
    limit?: number;
}
