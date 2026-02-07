/**
 * Task Model
 */

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CLOSED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface UserSummary {
    id: string;
    name: string;
    email: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdBy: UserSummary;
    assignedTo: UserSummary[];
    createdAt: string;
    updatedAt: string;
    dueDate?: string;
    completedAt?: string;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    assignedTo?: string[];
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
}

export interface UpdateStatusInput {
    status: TaskStatus;
}

// DynamoDB Item representation
export interface TaskItem {
    PK: string; // TASK#{id}
    SK: string; // METADATA
    GSI1PK: string; // STATUS#{status}
    GSI1SK: string; // {createdAt}
    GSI2PK?: string; // PRIORITY#{priority}
    GSI2SK?: string; // {dueDate}
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdById: string;
    createdByName: string;
    createdByEmail: string;
    createdAt: string;
    updatedAt: string;
    dueDate?: string;
    completedAt?: string;
}

// Assignment item
export interface AssignmentItem {
    PK: string; // TASK#{taskId}
    SK: string; // ASSIGN#{userId}
    GSI2PK: string; // USER#{userId}
    GSI2SK: string; // {assignedAt}
    taskId: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    assignedAt: string;
    assignedById: string;
    assignedByName: string;
}

