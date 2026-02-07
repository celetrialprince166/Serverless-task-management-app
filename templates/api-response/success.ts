/**
 * Success Response Helper
 * 
 * Creates standardized success responses with proper CORS headers.
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { Pagination } from './types';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

/**
 * Create a success response
 * @param statusCode HTTP status code (200, 201, 204)
 * @param data Response data
 * @param pagination Optional pagination info for list endpoints
 */
export const successResponse = <T>(
    statusCode: number,
    data: T,
    pagination?: Pagination
): APIGatewayProxyResult => {
    const body = pagination
        ? { data, pagination }
        : { data };

    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
    };
};

/**
 * Create a 204 No Content response
 */
export const noContentResponse = (): APIGatewayProxyResult => ({
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
});

/**
 * Create a paginated list response
 * @param items Array of items
 * @param page Current page number
 * @param limit Items per page
 * @param total Total items count
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
