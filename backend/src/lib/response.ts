/**
 * API Response Helpers
 *
 * Standard response format for API Gateway + Lambda.
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { ErrorDetails } from './errors';

const getCorsHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
});

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/**
 * Create a success response
 */
export const successResponse = <T>(
    statusCode: number,
    data: T,
    pagination?: Pagination
): APIGatewayProxyResult => {
    const body = pagination ? { data, pagination } : { data };

    return {
        statusCode,
        headers: getCorsHeaders(),
        body: JSON.stringify(body),
    };
};

/**
 * Create a 204 No Content response
 */
export const noContentResponse = (): APIGatewayProxyResult => ({
    statusCode: 204,
    headers: getCorsHeaders(),
    body: '',
});

/**
 * Create an error response
 */
export const errorResponse = (
    statusCode: number,
    error: string,
    message: string,
    details?: ErrorDetails,
    path?: string
): APIGatewayProxyResult => {
    const body: Record<string, unknown> = {
        error,
        message,
        timestamp: new Date().toISOString(),
    };

    if (details) body.details = details;
    if (path) body.path = path;

    return {
        statusCode,
        headers: getCorsHeaders(),
        body: JSON.stringify(body),
    };
};

/**
 * Create paginated list response
 */
export const paginatedResponse = <T>(
    items: T[],
    page: number,
    limit: number,
    total: number
): APIGatewayProxyResult => {
    const totalPages = Math.ceil(total / limit);

    const pagination: Pagination = {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
    };

    return successResponse(200, items, pagination);
};

// Convenience error responses
export const badRequest = (message: string, details?: ErrorDetails): APIGatewayProxyResult =>
    errorResponse(400, 'BadRequest', message, details);

export const unauthorized = (
    message = 'Missing or invalid authentication token'
): APIGatewayProxyResult => errorResponse(401, 'Unauthorized', message);

export const forbidden = (
    message = 'You do not have permission to perform this action'
): APIGatewayProxyResult => errorResponse(403, 'Forbidden', message);

export const notFound = (resource = 'Resource'): APIGatewayProxyResult =>
    errorResponse(404, 'NotFound', `${resource} not found`);

export const conflict = (message: string): APIGatewayProxyResult =>
    errorResponse(409, 'Conflict', message);

export const internalServerError = (
    message = 'An unexpected error occurred'
): APIGatewayProxyResult => errorResponse(500, 'InternalServerError', message);
