/**
 * User Model
 */

export type UserRole = 'ADMIN' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserInput {
    name?: string;
}

// DynamoDB Item representation
export interface UserItem {
    PK: string; // USER#{id}
    SK: string; // PROFILE
    GSI1PK: string; // EMAIL#{email}
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    updatedAt: string;
}
