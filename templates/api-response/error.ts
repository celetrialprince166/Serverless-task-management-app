/**
 * Error Response Helper
 * 
 * Creates standardized error responses with proper CORS headers.
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { ErrorDetails } from './types';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

/**
 * Create an error response
 * @param statusCode HTTP status code (400, 401, 403, 404, 409, 422, 500)
 * @param error Error code (e.g., 'BadRequest', 'NotFound')
 * @param message Human-readable error message
 * @param details Optional additional error details
 * @param path Optional request path
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

    if (details) {
        body.details = details;
    }

    if (path) {
        body.path = path;
    }

    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
    };
};

/**
 * Common error responses
 */
export const badRequest = (message: string, details?: ErrorDetails): APIGatewayProxyResult =>
    errorResponse(400, 'BadRequest', message, details);

export const unauthorized = (message = 'Missing or invalid authentication token'): APIGatewayProxyResult =>
    errorResponse(401, 'Unauthorized', message);

export const forbidden = (message = 'You do not have permission to perform this action'): APIGatewayProxyResult =>
    errorResponse(403, 'Forbidden', message);

export const notFound = (resource = 'Resource'): APIGatewayProxyResult =>
    errorResponse(404, 'NotFound', `${resource} not found`);

export const conflict = (message: string): APIGatewayProxyResult =>
    errorResponse(409, 'Conflict', message);

export const validationError = (message: string, details: ErrorDetails): APIGatewayProxyResult =>
    errorResponse(422, 'ValidationError', message, details);

export const internalServerError = (message = 'An unexpected error occurred'): APIGatewayProxyResult =>
    errorResponse(500, 'InternalServerError', message);
