/**
 * Tasks API Service
 * CRUD operations for tasks
 */
import api from './api';
import type {
    Task,
    CreateTaskRequest,
    UpdateTaskRequest,
    UpdateTaskStatusRequest,
    AssignUsersRequest,
    ApiResponse,
    ApiListResponse,
    TaskQueryParams,
    UserSummary,
} from '@/types/api';

/**
 * Get all tasks with optional filtering
 */
export async function getTasks(params?: TaskQueryParams): Promise<Task[]> {
    const response = await api.get<ApiListResponse<Task>>('/tasks', { params });
    return response.data.data;
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId: string): Promise<Task> {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${taskId}`);
    return response.data.data;
}

/**
 * Create a new task (Admin only)
 */
export async function createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data;
}

/**
 * Update a task (Admin only)
 */
export async function updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${taskId}`, data);
    return response.data.data;
}

/**
 * Delete a task (Admin only)
 */
export async function deleteTask(taskId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
}

/**
 * Update task status only (Admin or assigned Member)
 */
export async function updateTaskStatus(taskId: string, data: UpdateTaskStatusRequest): Promise<Task> {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${taskId}/status`, data);
    return response.data.data;
}

/**
 * Assign users to a task (Admin only)
 */
export async function assignUsersToTask(taskId: string, data: AssignUsersRequest): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${taskId}/assignments`, data);
    return response.data.data;
}

/**
 * Get users assigned to a task
 */
export async function getTaskAssignments(taskId: string): Promise<{ taskId: string; assignees: UserSummary[] }> {
    const response = await api.get<{ taskId: string; assignees: UserSummary[] }>(`/tasks/${taskId}/assignments`);
    return response.data;
}

/**
 * Unassign a user from a task (Admin only)
 */
export async function unassignUserFromTask(taskId: string, userId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/assignments/${userId}`);
}
