/**
 * API Response Types
 * 
 * Standard type definitions for API responses.
 */

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface SuccessResponse<T> {
    data: T;
    pagination?: Pagination;
}

export interface ErrorDetails {
    field?: string;
    constraint?: string;
    [key: string]: unknown;
}

export interface ErrorResponse {
    error: string;
    message: string;
    details?: ErrorDetails;
    timestamp: string;
    path?: string;
}

export interface APIResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}
