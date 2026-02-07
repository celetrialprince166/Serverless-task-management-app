/**
 * Users API Service
 * User management operations
 */
import api from './api';
import type {
    User,
    UpdateUserRequest,
    UpdateUserRoleRequest,
    ApiResponse,
    ApiListResponse,
    UserQueryParams,
} from '@/types/api';

/**
 * Get the current authenticated user's profile
 */
export async function getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return response.data.data;
}

/**
 * Update the current user's profile
 */
export async function updateCurrentUser(data: UpdateUserRequest): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/users/me', data);
    return response.data.data;
}

/**
 * Get all users (Admin only)
 */
export async function getUsers(params?: UserQueryParams): Promise<User[]> {
    const response = await api.get<ApiListResponse<User>>('/users', { params });
    return response.data.data;
}

/**
 * Get a user by ID (Admin only)
 */
export async function getUser(userId: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${userId}`);
    return response.data.data;
}

/**
 * Update a user's role (Admin only)
 */
export async function updateUserRole(userId: string, data: UpdateUserRoleRequest): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/users/${userId}`, data);
    return response.data.data;
}

/**
 * Check API health (public endpoint)
 */
export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get<{ status: string; timestamp: string }>('/health');
    return response.data;
}
